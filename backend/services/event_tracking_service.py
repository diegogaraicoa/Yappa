"""
Event Tracking Service
Sistema para registrar y analizar el uso de features de la aplicación.
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, List
from bson import ObjectId

# Secciones válidas que trackeamos
VALID_SECTIONS = [
    "sales",           # Ventas
    "expenses",        # Gastos
    "inventory",       # Inventario/Productos
    "customers",       # Clientes
    "suppliers",       # Proveedores
    "debts",           # Deudas
    "reports",         # Reportes AI
    "insights",        # Insights/Mis Datos
    "whatsapp",        # WhatsApp AI
    "admin_console",   # Admin Console
    "training",        # Capacitación
    "settings",        # Configuración
    "dashboard",       # Dashboard principal
    "export",          # Exportar CSV
    "ai_reports",      # Reportes IA mensuales
]

# Acciones válidas
VALID_ACTIONS = [
    "view",      # Ver/Visitar sección
    "create",    # Crear registro
    "edit",      # Editar registro
    "delete",    # Eliminar registro
    "export",    # Exportar datos
    "search"     # Buscar
]


async def log_event(
    db,
    merchant_id: str,
    clerk_id: str,
    section: str,
    action: str = "view",
    metadata: Optional[Dict] = None
) -> bool:
    """
    Registra un evento en el sistema.
    
    Args:
        db: Database connection
        merchant_id: ID del merchant
        clerk_id: ID del clerk que realiza la acción
        section: Sección de la app (sales, expenses, etc.)
        action: Acción realizada (view, create, edit, delete)
        metadata: Info adicional opcional
    
    Returns:
        True si se registró exitosamente, False si hubo error
    """
    try:
        # Validar sección
        if section not in VALID_SECTIONS:
            print(f"⚠️  Section '{section}' not in valid sections. Logging anyway.")
        
        # Validar acción
        if action not in VALID_ACTIONS:
            print(f"⚠️  Action '{action}' not in valid actions. Logging anyway.")
        
        # Crear evento
        event = {
            "merchant_id": merchant_id,
            "clerk_id": clerk_id,
            "section": section,
            "action": action,
            "metadata": metadata or {},
            "timestamp": datetime.utcnow()
        }
        
        # Insertar en DB
        await db.event_logs.insert_one(event)
        
        return True
        
    except Exception as e:
        print(f"❌ Error logging event: {e}")
        return False


async def get_feature_usage_stats(
    db,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    merchant_id: Optional[str] = None
) -> Dict:
    """
    Obtiene estadísticas de uso de features.
    
    Args:
        db: Database connection
        start_date: Fecha inicio (default: hace 30 días)
        end_date: Fecha fin (default: ahora)
        merchant_id: Filtrar por merchant específico (opcional)
    
    Returns:
        Dict con estadísticas de uso por sección
    """
    # Definir rango de fechas
    if not end_date:
        end_date = datetime.utcnow()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    # Construir query
    match_query = {
        "timestamp": {"$gte": start_date, "$lte": end_date}
    }
    
    if merchant_id:
        match_query["merchant_id"] = merchant_id
    
    # Agregación por sección
    pipeline = [
        {"$match": match_query},
        {
            "$group": {
                "_id": "$section",
                "count": {"$sum": 1},
                "unique_merchants": {"$addToSet": "$merchant_id"},
                "unique_clerks": {"$addToSet": "$clerk_id"}
            }
        },
        {
            "$project": {
                "section": "$_id",
                "visits": "$count",
                "unique_merchants": {"$size": "$unique_merchants"},
                "unique_clerks": {"$size": "$unique_clerks"}
            }
        },
        {"$sort": {"visits": -1}}
    ]
    
    results = await db.event_logs.aggregate(pipeline).to_list(100)
    
    # Formatear resultados
    stats = {
        "period": {
            "start": start_date,
            "end": end_date
        },
        "most_used": [],
        "least_used": [],
        "by_section": {}
    }
    
    for result in results:
        section_name = result["section"]
        stats["by_section"][section_name] = {
            "visits": result["visits"],
            "unique_merchants": result["unique_merchants"],
            "unique_clerks": result["unique_clerks"]
        }
    
    # Top 5 más usados
    stats["most_used"] = results[:5] if len(results) >= 5 else results
    
    # Top 5 menos usados
    stats["least_used"] = results[-5:][::-1] if len(results) >= 5 else []
    
    return stats


async def get_section_activity_timeline(
    db,
    section: str,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> List[Dict]:
    """
    Obtiene timeline de actividad de una sección específica.
    
    Útil para ver tendencias de uso a lo largo del tiempo.
    """
    if not end_date:
        end_date = datetime.utcnow()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    pipeline = [
        {
            "$match": {
                "section": section,
                "timestamp": {"$gte": start_date, "$lte": end_date}
            }
        },
        {
            "$group": {
                "_id": {
                    "year": {"$year": "$timestamp"},
                    "month": {"$month": "$timestamp"},
                    "day": {"$dayOfMonth": "$timestamp"}
                },
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"_id": 1}}
    ]
    
    results = await db.event_logs.aggregate(pipeline).to_list(100)
    
    # Formatear para devolver
    timeline = []
    for result in results:
        date = datetime(
            result["_id"]["year"],
            result["_id"]["month"],
            result["_id"]["day"]
        )
        timeline.append({
            "date": date,
            "visits": result["count"]
        })
    
    return timeline


async def get_merchant_activity_summary(
    db,
    merchant_id: str,
    days: int = 30
) -> Dict:
    """
    Obtiene resumen de actividad de un merchant específico.
    
    Útil para ver qué features usa cada merchant.
    """
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Total de eventos
    total_events = await db.event_logs.count_documents({
        "merchant_id": merchant_id,
        "timestamp": {"$gte": start_date}
    })
    
    # Por sección
    pipeline = [
        {
            "$match": {
                "merchant_id": merchant_id,
                "timestamp": {"$gte": start_date}
            }
        },
        {
            "$group": {
                "_id": "$section",
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"count": -1}}
    ]
    
    by_section = await db.event_logs.aggregate(pipeline).to_list(100)
    
    # Clerks activos
    clerks_active = await db.event_logs.distinct(
        "clerk_id",
        {
            "merchant_id": merchant_id,
            "timestamp": {"$gte": start_date}
        }
    )
    
    return {
        "merchant_id": merchant_id,
        "period_days": days,
        "total_events": total_events,
        "active_clerks": len(clerks_active),
        "by_section": [
            {"section": item["_id"], "count": item["count"]}
            for item in by_section
        ]
    }


async def get_clerk_activity_summary(
    db,
    clerk_id: str,
    days: int = 30
) -> Dict:
    """
    Obtiene resumen de actividad de un clerk específico.
    """
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Total de eventos
    total_events = await db.event_logs.count_documents({
        "clerk_id": clerk_id,
        "timestamp": {"$gte": start_date}
    })
    
    # Por sección
    pipeline = [
        {
            "$match": {
                "clerk_id": clerk_id,
                "timestamp": {"$gte": start_date}
            }
        },
        {
            "$group": {
                "_id": "$section",
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"count": -1}}
    ]
    
    by_section = await db.event_logs.aggregate(pipeline).to_list(100)
    
    return {
        "clerk_id": clerk_id,
        "period_days": days,
        "total_events": total_events,
        "by_section": [
            {"section": item["_id"], "count": item["count"]}
            for item in by_section
        ]
    }
