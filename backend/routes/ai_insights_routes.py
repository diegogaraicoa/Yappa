"""
AI Insights Routes - Endpoints para insights de IA visibles en la app
"""

from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta
from typing import List, Optional
import random

router = APIRouter(prefix="/ai", tags=["ai-insights"])


@router.get("/insight-of-the-day")
async def get_insight_of_the_day():
    """
    Obtiene el insight más importante del día
    
    Este endpoint analiza:
    - Insights generados por el scheduler
    - Stock bajo
    - Deudas pendientes
    - Tendencias de ventas
    
    Y devuelve EL MÁS IMPORTANTE para mostrar en el Home
    """
    from main import get_database
    from bson import ObjectId
    
    db = get_database()
    
    # Por ahora usamos tiendaclave como merchant
    merchant = await db.merchants.find_one({"username": "tiendaclave"})
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant no encontrado")
    
    store_id = str(merchant.get("_id"))
    
    # 1. Verificar stock crítico (PRIORIDAD ALTA)
    products = await db.products.find({
        "store_id": store_id
    }).to_list(1000)
    
    critical_stock = []
    low_stock = []
    
    for product in products:
        stock = product.get("stock", 0)
        min_stock = product.get("stock_minimo", 10)
        
        if stock == 0:
            critical_stock.append(product)
        elif stock <= min_stock:
            low_stock.append(product)
    
    # Si hay stock crítico, esa es la prioridad #1
    if critical_stock:
        product = critical_stock[0]
        return {
            "type": "critical_stock",
            "category": "Stock",
            "icon": "⚠️",
            "color": "#FF4A4A",
            "title": "Stock Agotado",
            "message": f"{product.get('nombre')} está agotado. No podrás vender hasta reponer.",
            "cta_text": "Reponer Ahora",
            "cta_action": "navigate_to_product",
            "cta_data": {"product_id": str(product.get("_id"))},
            "priority": 10
        }
    
    # 2. Verificar stock bajo (PRIORIDAD MEDIA-ALTA)
    if low_stock:
        product = low_stock[0]
        return {
            "type": "low_stock",
            "category": "Stock",
            "icon": "📦",
            "color": "#FFD447",
            "title": "Stock Bajo",
            "message": f"{product.get('nombre')} tiene solo {product.get('stock', 0)} unidades. Mínimo recomendado: {product.get('stock_minimo', 10)}.",
            "cta_text": "Ajustar Stock",
            "cta_action": "navigate_to_product",
            "cta_data": {"product_id": str(product.get("_id"))},
            "priority": 8
        }
    
    # 3. Verificar deudas pendientes (PRIORIDAD MEDIA)
    # Usar campo deuda_total de clientes (consistente con pantalla de clientes)
    customers_with_debt = await db.customers.find({
        "$or": [
            {"merchant_id": store_id},
            {"merchant_id": {"$exists": False}},
            {"merchant_id": None}
        ],
        "deuda_total": {"$lt": 0}  # Deuda negativa = debe dinero
    }).sort("deuda_total", 1).to_list(10)  # Ordenar por deuda más alta primero
    
    if customers_with_debt:
        # Tomar el cliente con mayor deuda
        top_debtor = customers_with_debt[0]
        debt_amount = abs(top_debtor.get("deuda_total", 0))
        customer_name = top_debtor.get("nombre", top_debtor.get("name", "Cliente"))
        
        if debt_amount > 0:
            return {
                "type": "overdue_debt",
                "category": "Cobranza",
                "icon": "💰",
                "color": "#FF9800",
                "title": "Deuda Pendiente",
                "message": f"{customer_name} debe ${debt_amount:.2f}. ¡Es momento de cobrar!",
                "cta_text": "Ver Clientes",
                "cta_action": "navigate_to_customers",
                "cta_data": {"customer_id": str(top_debtor.get("_id"))},
                "priority": 7
            }
    
    # 4. Buscar insights del scheduler (PRIORIDAD BAJA)
    latest_insight = await db.insights.find_one(
        {"store_id": store_id},
        sort=[("generated_at", -1)]
    )
    
    if latest_insight and latest_insight.get("insights"):
        insight_text = latest_insight["insights"][0]
        return {
            "type": "ai_recommendation",
            "category": "Insights IA",
            "icon": "🤖",
            "color": "#A66BFF",
            "title": "Recomendación del Día",
            "message": insight_text,
            "cta_text": "Ver Más Insights",
            "cta_action": "navigate_to_insights",
            "cta_data": {},
            "priority": 5
        }
    
    # 5. Si no hay nada urgente, mensaje motivador
    today_sales = await db.sales.find({
        "store_id": store_id,
        "created_at": {
            "$gte": datetime.combine(datetime.now().date(), datetime.min.time())
        }
    }).to_list(1000)
    
    total_today = sum(sale.get("total", 0) for sale in today_sales)
    
    return {
        "type": "daily_summary",
        "category": "Resumen",
        "icon": "📊",
        "color": "#00D2FF",
        "title": "Todo Bien por Ahora",
        "message": f"Llevas ${total_today:.2f} en ventas hoy. ¡Sigue así!",
        "cta_text": "Ver Balance",
        "cta_action": "navigate_to_balance",
        "cta_data": {},
        "priority": 3
    }


@router.get("/quick-actions")
async def get_quick_actions():
    """
    Obtiene las acciones rápidas recomendadas basadas en insights
    
    Devuelve 2-3 acciones que el usuario debería tomar HOY
    """
    from main import get_database
    
    db = get_database()
    
    merchant = await db.merchants.find_one({"username": "tiendaclave"})
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant no encontrado")
    
    store_id = str(merchant.get("_id"))
    
    actions = []
    
    # 1. Verificar productos con stock bajo
    low_stock_count = await db.products.count_documents({
        "store_id": store_id,
        "$expr": {"$lte": ["$stock", "$stock_minimo"]}
    })
    
    if low_stock_count > 0:
        actions.append({
            "id": "replenish_stock",
            "icon": "📦",
            "label": f"Reponer {low_stock_count} Productos",
            "color": "#FFD447",
            "action": "navigate_to_inventory"
        })
    
    # 2. Verificar deudas por cobrar
    unpaid_count = await db.sales.count_documents({
        "store_id": store_id,
        "paid": False
    })
    
    if unpaid_count > 0:
        actions.append({
            "id": "collect_debts",
            "icon": "💰",
            "label": f"Cobrar a {unpaid_count} Clientes",
            "color": "#FF9800",
            "action": "navigate_to_customers"
        })
    
    # Solo devolver si hay acciones reales (no incluir "Ver Balance" como default)
    # El usuario solo debería ver Quick Actions si HAY ALGO que necesite acción
    
    # Limitar a máximo 3 acciones
    return {
        "actions": actions[:3]
    }


@router.get("/new-insights-count")
async def get_new_insights_count():
    """
    Devuelve cuántos insights nuevos hay sin leer
    Para mostrar badge en el tab de IA
    """
    from main import get_database
    
    db = get_database()
    
    merchant = await db.merchants.find_one({"username": "tiendaclave"})
    if not merchant:
        return {"count": 0}
    
    store_id = str(merchant.get("_id"))
    
    # Buscar insights generados en los últimos 7 días
    seven_days_ago = datetime.now() - timedelta(days=7)
    
    recent_insights = await db.insights.find({
        "store_id": store_id,
        "generated_at": {"$gte": seven_days_ago},
        "read": {"$ne": True}  # No marcados como leídos
    }).to_list(100)
    
    # Contar total de insights individuales
    total_count = sum(len(doc.get("insights", [])) for doc in recent_insights)
    
    return {
        "count": min(total_count, 99)  # Máximo 99 para UI
    }


@router.get("/all-insights")
async def get_all_insights():
    """
    Obtiene todos los insights organizados por categoría
    
    Devuelve insights de:
    - Stock crítico/bajo
    - Deudas pendientes
    - Insights del scheduler (semanales/mensuales)
    - Recomendaciones generales
    """
    from main import get_database
    from bson import ObjectId
    
    db = get_database()
    
    merchant = await db.merchants.find_one({"username": "tiendaclave"})
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant no encontrado")
    
    store_id = str(merchant.get("_id"))
    
    all_insights = []
    
    # 1. Stock crítico y bajo
    products = await db.products.find({"store_id": store_id}).to_list(1000)
    
    for product in products:
        stock = product.get("stock", 0)
        min_stock = product.get("stock_minimo", 10)
        
        if stock == 0:
            all_insights.append({
                "id": f"critical_stock_{product.get('_id')}",
                "type": "critical_stock",
                "category": "Stock",
                "icon": "⚠️",
                "color": "#FF4A4A",
                "title": "Stock Agotado",
                "message": f"{product.get('nombre')} está completamente agotado.",
                "cta_text": "Reponer",
                "cta_action": "navigate_to_product",
                "cta_data": {"product_id": str(product.get("_id"))},
                "priority": 10,
                "timestamp": datetime.now().isoformat()
            })
        elif stock <= min_stock:
            all_insights.append({
                "id": f"low_stock_{product.get('_id')}",
                "type": "low_stock",
                "category": "Stock",
                "icon": "📦",
                "color": "#FFD447",
                "title": "Stock Bajo",
                "message": f"{product.get('nombre')} tiene {stock} unidades (mínimo: {min_stock}).",
                "cta_text": "Ver Producto",
                "cta_action": "navigate_to_product",
                "cta_data": {"product_id": str(product.get("_id"))},
                "priority": 8,
                "timestamp": datetime.now().isoformat()
            })
    
    # 2. Deudas pendientes (usar campo deuda_total de clientes para consistencia)
    # Buscar clientes con deuda (merchant_id puede ser string o ausente en datos legacy)
    customers_with_debt = await db.customers.find({
        "$or": [
            {"merchant_id": store_id},
            {"merchant_id": {"$exists": False}},  # Datos legacy sin merchant_id
            {"merchant_id": None}
        ],
        "deuda_total": {"$lt": 0}  # Deuda negativa = debe dinero
    }).sort("deuda_total", 1).to_list(20)
    
    for customer in customers_with_debt:
        debt_amount = abs(customer.get("deuda_total", 0))
        customer_name = customer.get("nombre", customer.get("name", "Cliente"))
        customer_id = str(customer.get("_id"))
        
        if debt_amount > 0:
            all_insights.append({
                "id": f"debt_{customer_id}",
                "type": "overdue_debt",
                "category": "Cobranza",
                "icon": "💰",
                "color": "#FF9800",
                "title": "Deuda Pendiente",
                "message": f"{customer_name} debe ${debt_amount:.2f}. ¡Es momento de cobrar!",
                "cta_text": "Ver Clientes",
                "cta_action": "navigate_to_customers",
                "cta_data": {"customer_id": customer_id},
                "priority": 7,
                "timestamp": datetime.now().isoformat()
            })
    
    # 3. Insights del scheduler (últimos 7 días)
    seven_days_ago = datetime.now() - timedelta(days=7)
    scheduler_insights = await db.insights.find({
        "store_id": store_id,
        "generated_at": {"$gte": seven_days_ago}
    }).sort("generated_at", -1).to_list(10)
    
    for doc in scheduler_insights:
        for idx, insight_text in enumerate(doc.get("insights", [])):
            all_insights.append({
                "id": f"scheduler_{doc.get('_id')}_{idx}",
                "type": "ai_recommendation",
                "category": "Insights IA",
                "icon": "🤖",
                "color": "#A66BFF",
                "title": "Recomendación IA",
                "message": insight_text,
                "cta_text": "Ver Detalles",
                "cta_action": "view_insight_details",
                "cta_data": {"insight_id": str(doc.get("_id"))},
                "priority": 5,
                "timestamp": doc.get("generated_at").isoformat()
            })
    
    # Ordenar por prioridad (mayor a menor) y luego por timestamp
    all_insights.sort(key=lambda x: (-x["priority"], x["timestamp"]), reverse=True)
    
    return {
        "insights": all_insights,
        "total_count": len(all_insights)
    }


@router.post("/mark-insights-as-read")
async def mark_insights_as_read():
    """
    Marca todos los insights como leídos
    Para resetear el badge
    """
    from main import get_database
    
    db = get_database()
    
    merchant = await db.merchants.find_one({"username": "tiendaclave"})
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant no encontrado")
    
    store_id = str(merchant.get("_id"))
    
    result = await db.insights.update_many(
        {"store_id": store_id, "read": {"$ne": True}},
        {"$set": {"read": True, "read_at": datetime.now()}}
    )
    
    return {
        "success": True,
        "marked_count": result.modified_count
    }



@router.get("/insights-timeline")
async def get_insights_timeline(
    days: int = 30,
    status: str = "all"  # all, resolved, pending
):
    """
    Obtiene el historial/timeline de insights con su estado
    
    Parámetros:
    - days: Número de días hacia atrás (default: 30)
    - status: Filtrar por estado (all, resolved, pending)
    
    Devuelve insights con información de:
    - Cuándo se generó
    - Cuándo se resolvió (si aplica)
    - Estado actual
    """
    from main import get_database
    from bson import ObjectId
    
    db = get_database()
    
    merchant = await db.merchants.find_one({"username": "tiendaclave"})
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant no encontrado")
    
    store_id = str(merchant.get("_id"))
    
    # Fecha límite para buscar
    start_date = datetime.now() - timedelta(days=days)
    
    timeline = []
    
    # 1. Obtener historial de insights guardados en la colección insights_history
    history_query = {
        "store_id": store_id,
        "created_at": {"$gte": start_date}
    }
    
    if status == "resolved":
        history_query["resolved"] = True
    elif status == "pending":
        history_query["resolved"] = {"$ne": True}
    
    saved_history = await db.insights_history.find(history_query).sort("created_at", -1).to_list(100)
    
    for item in saved_history:
        timeline.append({
            "id": str(item.get("_id")),
            "type": item.get("type"),
            "category": item.get("category"),
            "icon": item.get("icon", "📋"),
            "color": item.get("color", "#9E9E9E"),
            "title": item.get("title"),
            "message": item.get("message"),
            "created_at": item.get("created_at").isoformat() if item.get("created_at") else None,
            "resolved": item.get("resolved", False),
            "resolved_at": item.get("resolved_at").isoformat() if item.get("resolved_at") else None,
            "resolved_action": item.get("resolved_action"),
            "entity_id": item.get("entity_id"),
            "entity_type": item.get("entity_type")
        })
    
    # 2. Obtener insights actuales (pendientes) y marcarlos como pendientes
    if status in ["all", "pending"]:
        # Productos con stock bajo/agotado
        products = await db.products.find({"store_id": store_id}).to_list(1000)
        
        for product in products:
            stock = product.get("stock", 0)
            min_stock = product.get("stock_minimo", 10)
            product_id = str(product.get("_id"))
            
            # Verificar si ya está en el historial como pendiente
            existing = next((t for t in timeline if t.get("entity_id") == product_id and not t.get("resolved")), None)
            
            if not existing:
                if stock == 0:
                    timeline.append({
                        "id": f"current_critical_{product_id}",
                        "type": "critical_stock",
                        "category": "Stock",
                        "icon": "⚠️",
                        "color": "#FF4A4A",
                        "title": "Stock Agotado",
                        "message": f"{product.get('nombre')} está agotado.",
                        "created_at": datetime.now().isoformat(),
                        "resolved": False,
                        "resolved_at": None,
                        "entity_id": product_id,
                        "entity_type": "product"
                    })
                elif stock <= min_stock:
                    timeline.append({
                        "id": f"current_low_{product_id}",
                        "type": "low_stock",
                        "category": "Stock",
                        "icon": "📦",
                        "color": "#FFD447",
                        "title": "Stock Bajo",
                        "message": f"{product.get('nombre')} tiene {stock} unidades (mínimo: {min_stock}).",
                        "created_at": datetime.now().isoformat(),
                        "resolved": False,
                        "resolved_at": None,
                        "entity_id": product_id,
                        "entity_type": "product"
                    })
        
        # Clientes con deuda
        customers = await db.customers.find({"store_id": store_id}).to_list(1000)
        
        for customer in customers:
            deuda = customer.get("deuda_total", 0)
            customer_id = str(customer.get("_id"))
            
            existing = next((t for t in timeline if t.get("entity_id") == customer_id and not t.get("resolved")), None)
            
            if not existing and deuda < 0:
                nombre = customer.get("nombre", customer.get("name", "Cliente"))
                apellido = customer.get("apellido", customer.get("lastname", ""))
                timeline.append({
                    "id": f"current_debt_{customer_id}",
                    "type": "customer_debt",
                    "category": "Cobranza",
                    "icon": "💰",
                    "color": "#FF9800",
                    "title": "Deuda Pendiente",
                    "message": f"{nombre} {apellido} debe ${abs(deuda):.2f}.",
                    "created_at": datetime.now().isoformat(),
                    "resolved": False,
                    "resolved_at": None,
                    "entity_id": customer_id,
                    "entity_type": "customer"
                })
    
    # Filtrar por status si es necesario
    if status == "resolved":
        timeline = [t for t in timeline if t.get("resolved")]
    elif status == "pending":
        timeline = [t for t in timeline if not t.get("resolved")]
    
    # Ordenar por fecha (más reciente primero)
    timeline.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    
    # Estadísticas
    total = len(timeline)
    resolved_count = len([t for t in timeline if t.get("resolved")])
    pending_count = total - resolved_count
    
    return {
        "timeline": timeline,
        "stats": {
            "total": total,
            "resolved": resolved_count,
            "pending": pending_count
        }
    }


@router.post("/resolve-insight")
async def resolve_insight(
    entity_type: str,  # "product" or "customer"
    entity_id: str,
    action: str  # "replenished", "paid", "dismissed"
):
    """
    Marca un insight como resuelto y lo guarda en el historial
    
    Esto se llama automáticamente cuando:
    - Se repone stock de un producto
    - Se registra un pago de un cliente
    - El usuario descarta manualmente un insight
    """
    from main import get_database
    from bson import ObjectId
    
    db = get_database()
    
    merchant = await db.merchants.find_one({"username": "tiendaclave"})
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant no encontrado")
    
    store_id = str(merchant.get("_id"))
    
    # Obtener información de la entidad
    entity_info = {}
    insight_type = ""
    
    if entity_type == "product":
        product = await db.products.find_one({"_id": ObjectId(entity_id), "store_id": store_id})
        if product:
            stock = product.get("stock", 0)
            min_stock = product.get("stock_minimo", 10)
            entity_info = {
                "name": product.get("nombre", "Producto"),
                "stock_before": stock,
                "min_stock": min_stock
            }
            insight_type = "critical_stock" if stock == 0 else "low_stock"
    
    elif entity_type == "customer":
        customer = await db.customers.find_one({"_id": ObjectId(entity_id), "store_id": store_id})
        if customer:
            entity_info = {
                "name": f"{customer.get('nombre', '')} {customer.get('apellido', '')}".strip(),
                "debt_before": customer.get("deuda_total", 0)
            }
            insight_type = "customer_debt"
    
    # Guardar en historial
    history_doc = {
        "store_id": store_id,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "type": insight_type,
        "category": "Stock" if entity_type == "product" else "Cobranza",
        "icon": "📦" if entity_type == "product" else "💰",
        "color": "#4CAF50",  # Verde para resuelto
        "title": f"{'Stock Repuesto' if entity_type == 'product' else 'Pago Registrado'}",
        "message": f"{entity_info.get('name', 'Item')} - {action}",
        "created_at": datetime.now(),
        "resolved": True,
        "resolved_at": datetime.now(),
        "resolved_action": action,
        "entity_info": entity_info
    }
    
    result = await db.insights_history.insert_one(history_doc)
    
    return {
        "success": True,
        "history_id": str(result.inserted_id),
        "message": f"Insight marcado como resuelto: {action}"
    }


@router.get("/super-insights")
async def get_super_dashboard_insights(
    period: str = "this_month",
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """
    AI Insights para el Super Dashboard.
    
    Compara métricas del período actual vs período anterior:
    - Actividad de usuarios
    - Nuevas cuentas creadas
    - Uso de funcionalidades
    - Churn risk
    
    Genera recomendaciones basadas en patrones.
    
    Períodos soportados: 7d, 30d, today, this_month, last_month, custom
    Default: this_month (mes actual vs mes anterior, como churn)
    """
    from main import get_database
    from bson import ObjectId
    
    db = get_database()
    now = datetime.utcnow()
    
    # Calcular períodos según el filtro seleccionado
    if start_date and end_date and period == "custom":
        # Período personalizado
        current_start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
        current_end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
        # Período anterior = misma duración antes del inicio
        duration = current_end - current_start
        previous_end = current_start - timedelta(seconds=1)
        previous_start = previous_end - duration
        period_label = f"{start_date} - {end_date}"
    elif period == "7d":
        current_start = now - timedelta(days=7)
        current_end = now
        previous_end = current_start - timedelta(seconds=1)
        previous_start = previous_end - timedelta(days=7)
        period_label = "Últimos 7 días"
    elif period == "30d":
        current_start = now - timedelta(days=30)
        current_end = now
        previous_end = current_start - timedelta(seconds=1)
        previous_start = previous_end - timedelta(days=30)
        period_label = "Últimos 30 días"
    elif period == "today":
        current_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        current_end = now
        previous_start = current_start - timedelta(days=1)
        previous_end = current_start - timedelta(seconds=1)
        period_label = "Hoy"
    elif period == "last_month":
        # Mes pasado completo
        first_of_this_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        current_end = first_of_this_month - timedelta(seconds=1)
        current_start = current_end.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        # Período anterior = mes antes del mes pasado
        previous_end = current_start - timedelta(seconds=1)
        previous_start = previous_end.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        period_label = "Mes pasado"
    else:
        # Default: this_month (mes actual vs mes anterior)
        current_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        current_end = now
        previous_end = current_start - timedelta(seconds=1)
        previous_start = previous_end.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        period_label = "Este mes"
    
    insights = []
    
    # 1. ACTIVIDAD DE USUARIOS (event_logs)
    this_week_events = await db.event_logs.count_documents({
        "timestamp": {"$gte": current_start, "$lte": current_end}
    })
    last_week_events = await db.event_logs.count_documents({
        "timestamp": {"$gte": previous_start, "$lte": previous_end}
    })
    
    events_change = 0
    if last_week_events > 0:
        events_change = ((this_week_events - last_week_events) / last_week_events) * 100
    elif this_week_events > 0:
        events_change = 100
    
    insights.append({
        "id": "user_activity",
        "category": "Actividad",
        "icon": "📊",
        "color": "#2196F3" if events_change >= 0 else "#F44336",
        "title": "Actividad de Usuarios",
        "this_week": this_week_events,
        "last_week": last_week_events,
        "change_percent": round(events_change, 1),
        "trend": "up" if events_change > 0 else ("down" if events_change < 0 else "stable"),
        "insight": f"{'📈 Aumento' if events_change > 0 else '📉 Disminución'} del {abs(round(events_change))}% en actividad" if events_change != 0 else "Sin cambios en actividad"
    })
    
    # 2. NUEVOS MERCHANTS
    this_week_merchants = await db.merchants.count_documents({
        "activated_at": {"$gte": current_start, "$lte": current_end}
    })
    last_week_merchants = await db.merchants.count_documents({
        "activated_at": {"$gte": previous_start, "$lte": previous_end}
    })
    
    merchants_change = 0
    if last_week_merchants > 0:
        merchants_change = ((this_week_merchants - last_week_merchants) / last_week_merchants) * 100
    elif this_week_merchants > 0:
        merchants_change = 100
    
    insights.append({
        "id": "new_merchants",
        "category": "Crecimiento",
        "icon": "🏪",
        "color": "#4CAF50" if merchants_change >= 0 else "#FF9800",
        "title": "Nuevos Merchants",
        "this_week": this_week_merchants,
        "last_week": last_week_merchants,
        "change_percent": round(merchants_change, 1),
        "trend": "up" if merchants_change > 0 else ("down" if merchants_change < 0 else "stable"),
        "insight": f"{'🎉 ' if merchants_change > 0 else ''}{this_week_merchants} nuevos merchants esta semana"
    })
    
    # 3. NUEVOS CLERKS
    this_week_clerks = await db.clerks.count_documents({
        "activated_at": {"$gte": this_week_start}
    })
    last_week_clerks = await db.clerks.count_documents({
        "activated_at": {"$gte": last_week_start, "$lt": last_week_end}
    })
    
    clerks_change = 0
    if last_week_clerks > 0:
        clerks_change = ((this_week_clerks - last_week_clerks) / last_week_clerks) * 100
    elif this_week_clerks > 0:
        clerks_change = 100
    
    insights.append({
        "id": "new_clerks",
        "category": "Crecimiento",
        "icon": "👥",
        "color": "#FF9800" if clerks_change >= 0 else "#F44336",
        "title": "Nuevos Clerks",
        "this_week": this_week_clerks,
        "last_week": last_week_clerks,
        "change_percent": round(clerks_change, 1),
        "trend": "up" if clerks_change > 0 else ("down" if clerks_change < 0 else "stable"),
        "insight": f"{this_week_clerks} nuevos clerks activados"
    })
    
    # 4. FUNCIONALIDADES MÁS USADAS
    pipeline = [
        {"$match": {"timestamp": {"$gte": this_week_start}}},
        {"$group": {"_id": "$section", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    top_features = await db.event_logs.aggregate(pipeline).to_list(5)
    
    # 5. CLERKS EN RIESGO DE CHURN (sin actividad en 7+ días)
    active_clerk_ids = await db.event_logs.distinct(
        "clerk_id",
        {"timestamp": {"$gte": this_week_start}}
    )
    total_clerks = await db.clerks.count_documents({"activated_at": {"$ne": None}})
    inactive_clerks = total_clerks - len(active_clerk_ids)
    
    churn_risk_percent = (inactive_clerks / total_clerks * 100) if total_clerks > 0 else 0
    
    insights.append({
        "id": "churn_risk",
        "category": "Retención",
        "icon": "⚠️" if churn_risk_percent > 30 else "✅",
        "color": "#F44336" if churn_risk_percent > 50 else ("#FF9800" if churn_risk_percent > 30 else "#4CAF50"),
        "title": "Riesgo de Churn",
        "this_week": inactive_clerks,
        "total": total_clerks,
        "change_percent": round(churn_risk_percent, 1),
        "trend": "warning" if churn_risk_percent > 30 else "ok",
        "insight": f"{inactive_clerks} clerks sin actividad en 7 días ({round(churn_risk_percent)}%)"
    })
    
    # 6. RECOMENDACIONES AI
    recommendations = []
    
    if events_change < -20:
        recommendations.append({
            "type": "warning",
            "icon": "💡",
            "title": "Actividad Decreciente",
            "message": "La actividad ha bajado significativamente. Considera enviar notificaciones push o promociones para re-enganchar usuarios."
        })
    
    if merchants_change > 50:
        recommendations.append({
            "type": "success",
            "icon": "🚀",
            "title": "Excelente Crecimiento",
            "message": f"¡{this_week_merchants} nuevos merchants! Asegúrate de tener recursos de onboarding suficientes."
        })
    
    if churn_risk_percent > 30:
        recommendations.append({
            "type": "alert",
            "icon": "🔔",
            "title": "Alto Riesgo de Abandono",
            "message": f"{round(churn_risk_percent)}% de clerks están inactivos. Implementa una campaña de reactivación."
        })
    
    if len(recommendations) == 0:
        recommendations.append({
            "type": "info",
            "icon": "✨",
            "title": "Todo en Orden",
            "message": "Las métricas de la plataforma se ven saludables. ¡Sigue así!"
        })
    
    return {
        "generated_at": now.isoformat(),
        "period": {
            "this_week": {"start": this_week_start.isoformat(), "end": now.isoformat()},
            "last_week": {"start": last_week_start.isoformat(), "end": last_week_end.isoformat()}
        },
        "insights": insights,
        "top_features": [
            {"name": f.get("_id", "Unknown"), "count": f.get("count", 0)} 
            for f in top_features
        ],
        "recommendations": recommendations
    }
