from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import datetime
from typing import Optional
from bson import ObjectId
import traceback

router = APIRouter(prefix="/api/ai/reports", tags=["AI Reports"])

# Import will be done in server.py to get db dependency

async def get_reports_router(db, get_current_merchant):
    """Factory function to create router with dependencies"""
    
    from services.ai_report_service import ai_report_service
    
    @router.post("/generate")
    async def generate_report(
        year: Optional[int] = None,
        month: Optional[int] = None,
        merchant = Depends(get_current_merchant)
    ):
        """
        Generate an AI-powered business report for a specific month.
        If no year/month provided, generates for current month.
        """
        try:
            merchant_id = str(merchant['_id'])
            
            # Default to current month if not specified
            now = datetime.now()
            if year is None:
                year = now.year
            if month is None:
                month = now.month
            
            # Validate month
            if month < 1 or month > 12:
                raise HTTPException(status_code=400, detail="Mes inválido (1-12)")
            
            # Check if report already exists for this month
            existing = await db.ai_reports.find_one({
                'merchant_id': merchant_id,
                'year': year,
                'month': month
            })
            
            if existing:
                # Return existing report instead of generating new one
                return {
                    'success': True,
                    'message': 'Reporte existente encontrado',
                    'report': {
                        'id': str(existing['_id']),
                        'year': existing['year'],
                        'month': existing['month'],
                        'month_name': existing.get('month_name', ''),
                        'generated_at': existing['generated_at'].isoformat() if existing.get('generated_at') else None,
                        'ai_analysis': existing.get('ai_analysis', ''),
                        'metrics': existing.get('metrics', {})
                    },
                    'is_cached': True
                }
            
            # Generate new report
            result = await ai_report_service.generate_report(db, merchant_id, year, month)
            
            if result['success']:
                result['is_cached'] = False
                result['message'] = 'Reporte generado exitosamente'
            
            return result
            
        except HTTPException:
            raise
        except Exception as e:
            print(f"Error generating report: {e}")
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Error generando reporte: {str(e)}")
    
    @router.get("/history")
    async def get_report_history(
        limit: int = Query(default=12, le=24),
        merchant = Depends(get_current_merchant)
    ):
        """
        Get list of all generated reports for the merchant
        """
        try:
            merchant_id = str(merchant['_id'])
            
            reports = await db.ai_reports.find(
                {'merchant_id': merchant_id}
            ).sort([('year', -1), ('month', -1)]).limit(limit).to_list(limit)
            
            return {
                'success': True,
                'count': len(reports),
                'reports': [
                    {
                        'id': str(r['_id']),
                        'year': r['year'],
                        'month': r['month'],
                        'month_name': r.get('month_name', ''),
                        'generated_at': r['generated_at'].isoformat() if r.get('generated_at') else None,
                        'metrics': r.get('metrics', {})
                    }
                    for r in reports
                ]
            }
            
        except Exception as e:
            print(f"Error fetching report history: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    @router.get("/{report_id}")
    async def get_report_detail(
        report_id: str,
        merchant = Depends(get_current_merchant)
    ):
        """
        Get full details of a specific report
        """
        try:
            merchant_id = str(merchant['_id'])
            
            report = await db.ai_reports.find_one({
                '_id': ObjectId(report_id),
                'merchant_id': merchant_id
            })
            
            if not report:
                raise HTTPException(status_code=404, detail="Reporte no encontrado")
            
            return {
                'success': True,
                'report': {
                    'id': str(report['_id']),
                    'year': report['year'],
                    'month': report['month'],
                    'month_name': report.get('month_name', ''),
                    'generated_at': report['generated_at'].isoformat() if report.get('generated_at') else None,
                    'ai_analysis': report.get('ai_analysis', ''),
                    'metrics': report.get('metrics', {}),
                    'data_summary': report.get('data_summary', {})
                }
            }
            
        except HTTPException:
            raise
        except Exception as e:
            print(f"Error fetching report: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    @router.delete("/{report_id}")
    async def delete_report(
        report_id: str,
        merchant = Depends(get_current_merchant)
    ):
        """
        Delete a specific report
        """
        try:
            merchant_id = str(merchant['_id'])
            
            result = await db.ai_reports.delete_one({
                '_id': ObjectId(report_id),
                'merchant_id': merchant_id
            })
            
            if result.deleted_count == 0:
                raise HTTPException(status_code=404, detail="Reporte no encontrado")
            
            return {
                'success': True,
                'message': 'Reporte eliminado'
            }
            
        except HTTPException:
            raise
        except Exception as e:
            print(f"Error deleting report: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    @router.post("/regenerate/{report_id}")
    async def regenerate_report(
        report_id: str,
        merchant = Depends(get_current_merchant)
    ):
        """
        Regenerate an existing report (delete old and create new)
        """
        try:
            merchant_id = str(merchant['_id'])
            
            # Find existing report
            existing = await db.ai_reports.find_one({
                '_id': ObjectId(report_id),
                'merchant_id': merchant_id
            })
            
            if not existing:
                raise HTTPException(status_code=404, detail="Reporte no encontrado")
            
            year = existing['year']
            month = existing['month']
            
            # Delete old report
            await db.ai_reports.delete_one({'_id': ObjectId(report_id)})
            
            # Generate new report
            from services.ai_report_service import ai_report_service
            result = await ai_report_service.generate_report(db, merchant_id, year, month)
            
            if result['success']:
                result['message'] = 'Reporte regenerado exitosamente'
            
            return result
            
        except HTTPException:
            raise
        except Exception as e:
            print(f"Error regenerating report: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    return router
