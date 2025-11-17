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
