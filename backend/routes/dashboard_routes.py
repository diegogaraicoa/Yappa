"""
Dashboard Routes - Endpoints para el Super Dashboard
"""

from fastapi import APIRouter, Query, HTTPException
from datetime import datetime, timedelta
from typing import Optional
import sys
sys.path.append('/app/backend')

from services.kpi_service import (
    get_active_merchants,
    get_new_merchants,
    get_active_clerks,
    get_churn_rate,
    get_hierarchy_breakdown,
    get_all_kpis
)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def parse_period(period: str) -> tuple[datetime, datetime]:
    """
    Helper para parsear períodos comunes.
    
    Opciones:
    - "30d": Últimos 30 días
    - "7d": Últimos 7 días
    - "today": Hoy
    - "this_month": Este mes
    - "last_month": Mes pasado
    """
    now = datetime.utcnow()
    
    if period == "30d":
        start = now - timedelta(days=30)
        end = now
    elif period == "7d":
        start = now - timedelta(days=7)
        end = now
    elif period == "today":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end = now
    elif period == "this_month":
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end = now
    elif period == "last_month":
        # Primer día del mes pasado
        first_day_this_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end = first_day_this_month - timedelta(seconds=1)
        start = end.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        # Default: últimos 30 días
        start = now - timedelta(days=30)
        end = now
    
    return start, end


@router.get("/kpis")
async def get_dashboard_kpis(
    period: str = Query(default="30d", description="30d, 7d, today, this_month, last_month"),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """
    Endpoint principal del Super Dashboard.
    
    Devuelve TODOS los KPIs en una sola llamada:
    - Active merchants
    - New merchants (con comparación vs período anterior)
    - Active clerks (nuevos vs existentes)
    - Feature usage (top 5 + bottom 5)
    - Churn rate (merchants + clerks)
    - Hierarchy breakdown (Admin/Merchant/Clerk)
    
    Query params:
        period: Período predefinido (30d, 7d, today, this_month, last_month)
        start_date: Fecha inicio custom (ISO format, opcional)
        end_date: Fecha fin custom (ISO format, opcional)
    
    Si se proporcionan start_date y end_date custom, se ignora 'period'.
    """
    from main import get_database
    db = get_database()
    
    try:
        # Determinar rango de fechas
        if start_date and end_date:
            # Custom range
            current_start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            current_end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        else:
            # Período predefinido
            current_start, current_end = parse_period(period)
        
        # Calcular período anterior (misma duración)
        period_duration = current_end - current_start
        previous_end = current_start - timedelta(seconds=1)
        previous_start = previous_end - period_duration
        
        # Obtener todos los KPIs
        kpis = await get_all_kpis(
            db,
            start_date=current_start,
            end_date=current_end,
            previous_start_date=previous_start,
            previous_end_date=previous_end
        )
        
        return kpis
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching KPIs: {str(e)}")


@router.get("/merchants/active")
async def get_active_merchants_list(
    period: str = Query(default="30d"),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """
    Lista detallada de merchants activos.
    
    Clickeable desde el KPI card.
    """
    from main import get_database
    db = get_database()
    
    try:
        if start_date and end_date:
            current_start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            current_end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        else:
            current_start, current_end = parse_period(period)
        
        result = await get_active_merchants(db, current_start, current_end)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/merchants/new")
async def get_new_merchants_list(
    period: str = Query(default="30d"),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """
    Lista detallada de merchants nuevos (initial activation).
    
    Clickeable desde el KPI card.
    """
    from main import get_database
    db = get_database()
    
    try:
        if start_date and end_date:
            current_start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            current_end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        else:
            current_start, current_end = parse_period(period)
        
        # Calcular período anterior
        period_duration = current_end - current_start
        previous_end = current_start - timedelta(seconds=1)
        previous_start = previous_end - period_duration
        
        result = await get_new_merchants(db, current_start, current_end, previous_start, previous_end)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/clerks/active")
async def get_active_clerks_list(
    period: str = Query(default="30d"),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """
    Lista detallada de clerks activos.
    
    Incluye nuevos vs existentes.
    Clickeable desde el KPI card.
    """
    from main import get_database
    db = get_database()
    
    try:
        if start_date and end_date:
            current_start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            current_end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        else:
            current_start, current_end = parse_period(period)
        
        result = await get_active_clerks(db, current_start, current_end)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/churn")
async def get_churn_details(
    period: str = Query(default="30d"),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """
    Detalles completos de churn (merchants + clerks).
    
    Muestra quiénes churned y su última actividad.
    Clickeable desde el KPI card.
    """
    from main import get_database
    db = get_database()
    
    try:
        if start_date and end_date:
            current_start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            current_end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        else:
            current_start, current_end = parse_period(period)
        
        # Calcular período anterior
        period_duration = current_end - current_start
        previous_end = current_start - timedelta(seconds=1)
        previous_start = previous_end - period_duration
        
        result = await get_churn_rate(db, current_start, current_end, previous_start, previous_end)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/hierarchy")
async def get_hierarchy():
    """
    Breakdown de Admin/Merchant/Clerk.
    
    Muestra totales y promedios del sistema.
    """
    from main import get_database
    db = get_database()
    
    try:
        result = await get_hierarchy_breakdown(db)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/all-admins")
async def get_all_admins():
    """
    Lista completa de todos los admins.
    """
    from main import get_database
    db = get_database()
    
    try:
        admins = await db.admins.find({}).to_list(1000)
        
        admins_list = []
        for admin in admins:
            # Contar merchants asociados
            merchants_count = await db.merchants.count_documents({"admin_id": str(admin["_id"])})
            
            admins_list.append({
                "id": str(admin["_id"]),
                "nombre": admin.get("nombre", "N/A"),
                "email": admin.get("email", "N/A"),
                "telefono": admin.get("telefono", "N/A"),
                "created_at": admin.get("created_at"),
                "merchants_count": merchants_count
            })
        
        return {
            "count": len(admins_list),
            "admins": admins_list
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/all-merchants-list")
async def get_all_merchants_list():
    """
    Lista completa de todos los merchants (activos + inactivos).
    """
    from main import get_database
    db = get_database()
    
    try:
        merchants = await db.merchants.find({}).to_list(1000)
        
        merchants_list = []
        for merchant in merchants:
            # Contar clerks asociados
            clerks_count = await db.clerks.count_documents({"merchant_id": str(merchant["_id"])})
            
            # Obtener admin info
            admin = None
            if merchant.get("admin_id"):
                admin = await db.admins.find_one({"_id": ObjectId(merchant["admin_id"])})
            
            merchants_list.append({
                "id": str(merchant["_id"]),
                "nombre": merchant.get("nombre", "N/A"),
                "username": merchant.get("username", "N/A"),
                "direccion": merchant.get("direccion", "N/A"),
                "telefono": merchant.get("telefono", "N/A"),
                "admin_nombre": admin.get("nombre", "N/A") if admin else "N/A",
                "created_at": merchant.get("created_at"),
                "activated_at": merchant.get("activated_at"),
                "fully_activated_at": merchant.get("fully_activated_at"),
                "active": merchant.get("active", True),
                "clerks_count": clerks_count
            })
        
        # Ordenar por fecha de creación descendente
        merchants_list.sort(key=lambda x: x["created_at"] or datetime.min, reverse=True)
        
        return {
            "count": len(merchants_list),
            "merchants": merchants_list
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/all-clerks-list")
async def get_all_clerks_list():
    """
    Lista completa de todos los clerks (activos + inactivos).
    """
    from main import get_database
    db = get_database()
    
    try:
        clerks = await db.clerks.find({}).to_list(1000)
        
        clerks_list = []
        for clerk in clerks:
            # Obtener merchant info
            merchant = None
            if clerk.get("merchant_id"):
                merchant = await db.merchants.find_one({"_id": ObjectId(clerk["merchant_id"])})
            
            clerks_list.append({
                "id": str(clerk["_id"]),
                "nombre": clerk.get("nombre", "N/A"),
                "email": clerk.get("email", "N/A"),
                "whatsapp_number": clerk.get("whatsapp_number", "N/A"),
                "role": clerk.get("role", "employee"),
                "merchant_nombre": merchant.get("nombre", "N/A") if merchant else "N/A",
                "created_at": clerk.get("created_at"),
                "activated_at": clerk.get("activated_at"),
                "fully_activated_at": clerk.get("fully_activated_at"),
                "active": clerk.get("active", True)
            })
        
        # Ordenar por fecha de creación descendente
        clerks_list.sort(key=lambda x: x["created_at"] or datetime.min, reverse=True)
        
        return {
            "count": len(clerks_list),
            "clerks": clerks_list
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/feature-usage-detail")
async def get_feature_usage_detail(
    period: str = Query(default="30d"),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """
    Detalle de feature usage con breakdown por merchant.
    """
    from main import get_database
    from services.event_tracking_service import get_feature_usage_stats
    db = get_database()
    
    try:
        if start_date and end_date:
            current_start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            current_end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        else:
            current_start, current_end = parse_period(period)
        
        # Obtener stats de feature usage
        feature_stats = await get_feature_usage_stats(db, current_start, current_end)
        
        # Para cada feature, obtener breakdown por merchant
        for feature in feature_stats["most_used"] + feature_stats["least_used"]:
            section = feature["section"]
            
            # Obtener merchants únicos que usaron esta feature
            merchant_ids = await db.event_logs.distinct(
                "merchant_id",
                {
                    "section": section,
                    "timestamp": {"$gte": current_start, "$lte": current_end}
                }
            )
            
            # Obtener detalles de cada merchant
            merchants_breakdown = []
            for merchant_id in merchant_ids:
                merchant = await db.merchants.find_one({"_id": ObjectId(merchant_id)})
                if not merchant:
                    continue
                
                # Contar visitas de este merchant a esta feature
                visits = await db.event_logs.count_documents({
                    "merchant_id": merchant_id,
                    "section": section,
                    "timestamp": {"$gte": current_start, "$lte": current_end}
                })
                
                merchants_breakdown.append({
                    "merchant_id": str(merchant["_id"]),
                    "merchant_nombre": merchant.get("nombre", "N/A"),
                    "visits": visits
                })
            
            # Ordenar por visitas descendente
            merchants_breakdown.sort(key=lambda x: x["visits"], reverse=True)
            feature["merchants_breakdown"] = merchants_breakdown
            feature["unique_merchants"] = len(merchants_breakdown)
        
        return feature_stats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
