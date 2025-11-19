"""
KPI Service
Servicio para calcular los KPIs del Super Dashboard.
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, List, Tuple
from bson import ObjectId


async def get_active_merchants(
    db,
    start_date: datetime,
    end_date: datetime
) -> Dict:
    """
    Obtiene merchants activos en el período.
    
    Activo = tiene al menos 1 event_log en el período.
    
    Returns:
        {
            "count": int,
            "merchants": [{"id", "nombre", "last_activity", "total_events"}]
        }
    """
    # Obtener IDs únicos de merchants con actividad
    merchant_ids = await db.event_logs.distinct(
        "merchant_id",
        {"timestamp": {"$gte": start_date, "$lte": end_date}}
    )
    
    # Obtener detalles de cada merchant
    merchants_data = []
    for merchant_id in merchant_ids:
        merchant = await db.merchants.find_one({"_id": ObjectId(merchant_id)})
        if not merchant:
            continue
        
        # IMPORTANTE: Solo incluir merchants ACTIVOS (con activated_at)
        # Los inactivos solo se muestran en jerarquía
        if not merchant.get("activated_at"):
            continue
        
        # Contar eventos del merchant en el período
        event_count = await db.event_logs.count_documents({
            "merchant_id": merchant_id,
            "timestamp": {"$gte": start_date, "$lte": end_date}
        })
        
        # Última actividad
        last_event = await db.event_logs.find_one(
            {"merchant_id": merchant_id},
            sort=[("timestamp", -1)]
        )
        
        merchants_data.append({
            "id": str(merchant["_id"]),
            "nombre": merchant.get("nombre", "N/A"),
            "username": merchant.get("username", "N/A"),
            "last_activity": last_event["timestamp"] if last_event else None,
            "total_events": event_count
        })
    
    # Ordenar por última actividad
    merchants_data.sort(key=lambda x: x["last_activity"] or datetime.min, reverse=True)
    
    return {
        "count": len(merchants_data),
        "merchants": merchants_data
    }


async def get_new_merchants(
    db,
    start_date: datetime,
    end_date: datetime,
    previous_start_date: Optional[datetime] = None,
    previous_end_date: Optional[datetime] = None
) -> Dict:
    """
    Obtiene merchants nuevos (initial activation) en el período.
    
    Nuevo = activated_at está dentro del período.
    
    Opcionalmente compara con período anterior.
    
    Returns:
        {
            "count": int,
            "previous_count": int (opcional),
            "change_percentage": float (opcional),
            "merchants": [{"id", "nombre", "activated_at"}]
        }
    """
    # Merchants con activated_at en el período
    current_merchants = await db.merchants.find({
        "activated_at": {"$gte": start_date, "$lte": end_date}
    }).to_list(1000)
    
    result = {
        "count": len(current_merchants),
        "merchants": [
            {
                "id": str(m["_id"]),
                "nombre": m.get("nombre", "N/A"),
                "username": m.get("username", "N/A"),
                "activated_at": m.get("activated_at")
            }
            for m in current_merchants
        ]
    }
    
    # Si se proporciona período anterior, calcular comparación
    if previous_start_date and previous_end_date:
        previous_merchants = await db.merchants.count_documents({
            "activated_at": {"$gte": previous_start_date, "$lte": previous_end_date}
        })
        
        result["previous_count"] = previous_merchants
        
        # Calcular cambio porcentual
        if previous_merchants > 0:
            change = ((len(current_merchants) - previous_merchants) / previous_merchants) * 100
            result["change_percentage"] = round(change, 2)
        else:
            result["change_percentage"] = 100.0 if len(current_merchants) > 0 else 0.0
    
    return result


async def get_active_clerks(
    db,
    start_date: datetime,
    end_date: datetime
) -> Dict:
    """
    Obtiene clerks activos en el período.
    
    Activo = tiene al menos 1 event_log en el período.
    
    Returns:
        {
            "count": int,
            "new_count": int (activated_at en período),
            "existing_count": int (activated_at antes del período),
            "clerks": [{"id", "nombre", "email", "role", "merchant_nombre", "total_events"}]
        }
    """
    # IDs únicos de clerks con actividad
    clerk_ids = await db.event_logs.distinct(
        "clerk_id",
        {"timestamp": {"$gte": start_date, "$lte": end_date}}
    )
    
    clerks_data = []
    new_clerks = 0
    existing_clerks = 0
    
    for clerk_id in clerk_ids:
        clerk = await db.clerks.find_one({"_id": ObjectId(clerk_id)})
        if not clerk:
            continue
        
        # IMPORTANTE: Solo incluir clerks ACTIVOS (con activated_at)
        # Los inactivos solo se muestran en jerarquía
        if not clerk.get("activated_at"):
            continue
        
        # Contar eventos
        event_count = await db.event_logs.count_documents({
            "clerk_id": clerk_id,
            "timestamp": {"$gte": start_date, "$lte": end_date}
        })
        
        # Obtener merchant name
        merchant = await db.merchants.find_one({"_id": ObjectId(clerk["merchant_id"])})
        merchant_nombre = merchant.get("nombre", "N/A") if merchant else "N/A"
        
        # Determinar si es nuevo o existente
        activated_at = clerk.get("activated_at")
        if activated_at and start_date <= activated_at <= end_date:
            new_clerks += 1
            clerk_status = "new"
        else:
            existing_clerks += 1
            clerk_status = "existing"
        
        clerks_data.append({
            "id": str(clerk["_id"]),
            "nombre": clerk.get("nombre", "N/A"),
            "email": clerk.get("email", "N/A"),
            "role": clerk.get("role", "employee"),
            "merchant_nombre": merchant_nombre,
            "total_events": event_count,
            "status": clerk_status,
            "activated_at": clerk.get("activated_at"),  # Para verificar filtro
            "fully_activated_at": clerk.get("fully_activated_at")  # Para verificar filtro
        })
    
    # Ordenar por total_events
    clerks_data.sort(key=lambda x: x["total_events"], reverse=True)
    
    return {
        "count": len(clerks_data),
        "new_count": new_clerks,
        "existing_count": existing_clerks,
        "clerks": clerks_data
    }


async def get_churn_rate(
    db,
    current_start: datetime,
    current_end: datetime,
    previous_start: datetime,
    previous_end: datetime
) -> Dict:
    """
    Calcula churn rate de merchants y clerks.
    
    Churn = activos en período anterior pero 0 actividad en período actual.
    
    Returns:
        {
            "merchants": {
                "churned_count": int,
                "churn_rate": float,
                "details": [{"id", "nombre", "last_activity"}]
            },
            "clerks": {
                "churned_count": int,
                "churn_rate": float,
                "details": [{"id", "nombre", "merchant_nombre", "last_activity"}]
            }
        }
    """
    # MERCHANTS CHURN
    # 1. Merchants activos en período anterior
    previous_merchant_ids = set(await db.event_logs.distinct(
        "merchant_id",
        {"timestamp": {"$gte": previous_start, "$lte": previous_end}}
    ))
    
    # 2. Merchants activos en período actual
    current_merchant_ids = set(await db.event_logs.distinct(
        "merchant_id",
        {"timestamp": {"$gte": current_start, "$lte": current_end}}
    ))
    
    # 3. Churned = en anterior pero no en actual
    churned_merchant_ids = previous_merchant_ids - current_merchant_ids
    
    # Obtener detalles de merchants churned
    churned_merchants = []
    for merchant_id in churned_merchant_ids:
        merchant = await db.merchants.find_one({"_id": ObjectId(merchant_id)})
        if not merchant:
            continue
        
        # Última actividad
        last_event = await db.event_logs.find_one(
            {"merchant_id": merchant_id},
            sort=[("timestamp", -1)]
        )
        
        churned_merchants.append({
            "id": str(merchant["_id"]),
            "nombre": merchant.get("nombre", "N/A"),
            "username": merchant.get("username", "N/A"),
            "last_activity": last_event["timestamp"] if last_event else None
        })
    
    merchant_churn_rate = 0.0
    if len(previous_merchant_ids) > 0:
        merchant_churn_rate = (len(churned_merchant_ids) / len(previous_merchant_ids)) * 100
    
    # CLERKS CHURN (misma lógica)
    previous_clerk_ids = set(await db.event_logs.distinct(
        "clerk_id",
        {"timestamp": {"$gte": previous_start, "$lte": previous_end}}
    ))
    
    current_clerk_ids = set(await db.event_logs.distinct(
        "clerk_id",
        {"timestamp": {"$gte": current_start, "$lte": current_end}}
    ))
    
    churned_clerk_ids = previous_clerk_ids - current_clerk_ids
    
    churned_clerks = []
    for clerk_id in churned_clerk_ids:
        clerk = await db.clerks.find_one({"_id": ObjectId(clerk_id)})
        if not clerk:
            continue
        
        merchant = await db.merchants.find_one({"_id": ObjectId(clerk["merchant_id"])})
        merchant_nombre = merchant.get("nombre", "N/A") if merchant else "N/A"
        
        last_event = await db.event_logs.find_one(
            {"clerk_id": clerk_id},
            sort=[("timestamp", -1)]
        )
        
        churned_clerks.append({
            "id": str(clerk["_id"]),
            "nombre": clerk.get("nombre", "N/A"),
            "email": clerk.get("email", "N/A"),
            "merchant_nombre": merchant_nombre,
            "last_activity": last_event["timestamp"] if last_event else None
        })
    
    clerk_churn_rate = 0.0
    if len(previous_clerk_ids) > 0:
        clerk_churn_rate = (len(churned_clerk_ids) / len(previous_clerk_ids)) * 100
    
    return {
        "merchants": {
            "churned_count": len(churned_merchant_ids),
            "total_previous": len(previous_merchant_ids),
            "churn_rate": round(merchant_churn_rate, 2),
            "details": churned_merchants
        },
        "clerks": {
            "churned_count": len(churned_clerk_ids),
            "total_previous": len(previous_clerk_ids),
            "churn_rate": round(clerk_churn_rate, 2),
            "details": churned_clerks
        }
    }


async def get_hierarchy_breakdown(db) -> Dict:
    """
    Obtiene breakdown de Admin/Merchant/Clerk en todo el sistema.
    
    Returns:
        {
            "total_admins": int,
            "total_merchants": int,
            "total_clerks": int,
            "merchants_per_admin": float,
            "clerks_per_merchant": float,
            "details": [
                {
                    "admin": {...},
                    "merchants_count": int,
                    "clerks_count": int
                }
            ]
        }
    """
    total_admins = await db.admins.count_documents({})
    total_merchants = await db.merchants.count_documents({})
    total_clerks = await db.clerks.count_documents({})
    
    # Calcular promedios
    merchants_per_admin = total_merchants / total_admins if total_admins > 0 else 0
    clerks_per_merchant = total_clerks / total_merchants if total_merchants > 0 else 0
    
    # Detalles por admin
    admins = await db.admins.find({}).to_list(1000)
    admin_details = []
    
    for admin in admins:
        admin_id = str(admin["_id"])
        
        # Contar merchants del admin
        merchants_count = await db.merchants.count_documents({"admin_id": admin_id})
        
        # Contar clerks de todos los merchants del admin
        merchant_ids = await db.merchants.distinct("_id", {"admin_id": admin_id})
        clerks_count = await db.clerks.count_documents({
            "merchant_id": {"$in": [str(mid) for mid in merchant_ids]}
        })
        
        admin_details.append({
            "admin": {
                "id": admin_id,
                "nombre": admin.get("nombre", "N/A"),
                "email": admin.get("email", "N/A")
            },
            "merchants_count": merchants_count,
            "clerks_count": clerks_count
        })
    
    return {
        "total_admins": total_admins,
        "total_merchants": total_merchants,
        "total_clerks": total_clerks,
        "merchants_per_admin": round(merchants_per_admin, 2),
        "clerks_per_merchant": round(clerks_per_merchant, 2),
        "details": admin_details
    }


async def get_all_kpis(
    db,
    start_date: datetime,
    end_date: datetime,
    previous_start_date: Optional[datetime] = None,
    previous_end_date: Optional[datetime] = None
) -> Dict:
    """
    Obtiene TODOS los KPIs en una sola llamada (endpoint principal del dashboard).
    
    Incluye:
    - Active merchants
    - New merchants
    - Active clerks
    - Feature usage
    - Churn rate
    - Hierarchy breakdown
    """
    from services.event_tracking_service import get_feature_usage_stats
    
    # Si no se proporciona período anterior, calcularlo automáticamente
    if not previous_start_date or not previous_end_date:
        period_duration = end_date - start_date
        previous_end_date = start_date - timedelta(seconds=1)
        previous_start_date = previous_end_date - period_duration
    
    # Ejecutar todas las funciones en paralelo (o secuencial, depende de la carga)
    active_merchants = await get_active_merchants(db, start_date, end_date)
    new_merchants = await get_new_merchants(db, start_date, end_date, previous_start_date, previous_end_date)
    active_clerks = await get_active_clerks(db, start_date, end_date)
    feature_usage = await get_feature_usage_stats(db, start_date, end_date)
    churn = await get_churn_rate(db, start_date, end_date, previous_start_date, previous_end_date)
    hierarchy = await get_hierarchy_breakdown(db)
    
    return {
        "period": {
            "start": start_date,
            "end": end_date,
            "previous_start": previous_start_date,
            "previous_end": previous_end_date
        },
        "active_merchants": active_merchants,
        "new_merchants": new_merchants,
        "active_clerks": active_clerks,
        "feature_usage": feature_usage,
        "churn": churn,
        "hierarchy": hierarchy
    }
