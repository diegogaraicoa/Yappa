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
    unpaid_sales = await db.sales.find({
        "store_id": store_id,
        "paid": False
    }).to_list(100)
    
    if unpaid_sales:
        # Agrupar por cliente
        debts_by_customer = {}
        for sale in unpaid_sales:
            customer_id = sale.get("customer_id")
            if customer_id:
                if customer_id not in debts_by_customer:
                    debts_by_customer[customer_id] = {
                        "customer_name": sale.get("customer_name", "Cliente"),
                        "total_debt": 0,
                        "sales_count": 0,
                        "oldest_date": sale.get("created_at")
                    }
                
                debt = sale.get("total", 0) - sale.get("paid_amount", 0)
                debts_by_customer[customer_id]["total_debt"] += debt
                debts_by_customer[customer_id]["sales_count"] += 1
                
                if sale.get("created_at") < debts_by_customer[customer_id]["oldest_date"]:
                    debts_by_customer[customer_id]["oldest_date"] = sale.get("created_at")
        
        # Buscar la deuda más antigua
        oldest_debt = None
        oldest_days = 0
        
        for customer_id, debt_info in debts_by_customer.items():
            days_old = (datetime.now() - debt_info["oldest_date"]).days
            if days_old > oldest_days:
                oldest_days = days_old
                oldest_debt = debt_info
        
        if oldest_debt and oldest_days >= 7:  # Solo mostrar si tiene más de 1 semana
            return {
                "type": "overdue_debt",
                "category": "Cobranza",
                "icon": "💰",
                "color": "#FF9800",
                "title": "Deuda Pendiente",
                "message": f"{oldest_debt['customer_name']} debe ${oldest_debt['total_debt']:.2f} desde hace {oldest_days} días.",
                "cta_text": "Enviar Recordatorio",
                "cta_action": "send_payment_reminder",
                "cta_data": {"customer_id": customer_id},
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
    
    # 2. Deudas pendientes
    unpaid_sales = await db.sales.find({
        "store_id": store_id,
        "paid": False
    }).to_list(100)
    
    debts_by_customer = {}
    for sale in unpaid_sales:
        customer_id = sale.get("customer_id")
        if customer_id:
            if customer_id not in debts_by_customer:
                debts_by_customer[customer_id] = {
                    "customer_name": sale.get("customer_name", "Cliente"),
                    "total_debt": 0,
                    "oldest_date": sale.get("created_at")
                }
            
            debt = sale.get("total", 0) - sale.get("paid_amount", 0)
            debts_by_customer[customer_id]["total_debt"] += debt
            
            if sale.get("created_at") < debts_by_customer[customer_id]["oldest_date"]:
                debts_by_customer[customer_id]["oldest_date"] = sale.get("created_at")
    
    for customer_id, debt_info in debts_by_customer.items():
        days_old = (datetime.now() - debt_info["oldest_date"]).days
        if days_old >= 7:
            all_insights.append({
                "id": f"debt_{customer_id}",
                "type": "overdue_debt",
                "category": "Cobranza",
                "icon": "💰",
                "color": "#FF9800",
                "title": "Deuda Pendiente",
                "message": f"{debt_info['customer_name']} debe ${debt_info['total_debt']:.2f} desde hace {days_old} días.",
                "cta_text": "Cobrar",
                "cta_action": "send_payment_reminder",
                "cta_data": {"customer_id": customer_id},
                "priority": 7,
                "timestamp": debt_info["oldest_date"].isoformat()
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
