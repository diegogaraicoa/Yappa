"""
Analytics Routes - Endpoints para feature usage y estadísticas
"""

from fastapi import APIRouter, Query
from datetime import datetime, timedelta
from typing import Optional
import sys
sys.path.append('/app/backend')

from services.event_tracking_service import (
    get_feature_usage_stats,
    get_section_activity_timeline,
    get_merchant_activity_summary,
    get_clerk_activity_summary,
    log_event
)

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/feature-usage")
async def get_feature_usage(
    days: int = Query(default=30, ge=1, le=365),
    merchant_id: Optional[str] = None
):
    """
    Obtiene estadísticas de uso de features.
    
    Query params:
        days: Número de días hacia atrás (default: 30)
        merchant_id: Filtrar por merchant (opcional)
    
    Returns:
        Estadísticas de features más y menos usados
    """
    from main import get_database
    db = get_database()
    
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    stats = await get_feature_usage_stats(
        db,
        start_date=start_date,
        end_date=end_date,
        merchant_id=merchant_id
    )
    
    return stats


@router.get("/section/{section}/timeline")
async def get_section_timeline(
    section: str,
    days: int = Query(default=30, ge=1, le=365)
):
    """
    Obtiene timeline de actividad de una sección específica.
    
    Útil para ver tendencias a lo largo del tiempo.
    """
    from main import get_database
    db = get_database()
    
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    timeline = await get_section_activity_timeline(
        db,
        section=section,
        start_date=start_date,
        end_date=end_date
    )
    
    return {
        "section": section,
        "period_days": days,
        "timeline": timeline
    }


@router.get("/merchant/{merchant_id}/activity")
async def get_merchant_activity(
    merchant_id: str,
    days: int = Query(default=30, ge=1, le=365)
):
    """
    Obtiene resumen de actividad de un merchant.
    """
    from main import get_database
    db = get_database()
    
    summary = await get_merchant_activity_summary(db, merchant_id, days)
    
    return summary


@router.get("/clerk/{clerk_id}/activity")
async def get_clerk_activity(
    clerk_id: str,
    days: int = Query(default=30, ge=1, le=365)
):
    """
    Obtiene resumen de actividad de un clerk.
    """
    from main import get_database
    db = get_database()
    
    summary = await get_clerk_activity_summary(db, clerk_id, days)
    
    return summary


@router.post("/log-event")
async def log_event_endpoint(
    merchant_id: str,
    clerk_id: str,
    section: str,
    action: str = "view",
    metadata: Optional[dict] = None
):
    """
    Endpoint manual para logging de eventos.
    
    Útil para tracking desde el frontend.
    """
    from main import get_database
    db = get_database()
    
    success = await log_event(
        db,
        merchant_id=merchant_id,
        clerk_id=clerk_id,
        section=section,
        action=action,
        metadata=metadata
    )
    
    if success:
        return {"message": "Event logged successfully"}
    else:
        return {"message": "Error logging event"}, 500
