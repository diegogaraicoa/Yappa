from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import asyncio
from dotenv import load_dotenv

load_dotenv()

# Import services
from .twilio_service import twilio_service
from .sendgrid_service import sendgrid_service
from .expo_push_service import expo_push_service

# MongoDB connection for scheduler
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'tiendadb')]

scheduler = AsyncIOScheduler()

async def send_daily_stock_alerts():
    """Job: Send daily stock alerts at 8am via Email, WhatsApp, and Push"""
    print(f"[{datetime.now()}] Running daily stock alerts job...")
    
    try:
        # Get all products with low stock
        products = await db.products.find({}).to_list(10000)
        
        # Group products by store
        stores_alerts = {}
        for product in products:
            stock = product.get("stock", product.get("quantity", 0))
            min_stock = product.get("stock_minimo", product.get("min_stock_alert", 10))
            
            if stock <= min_stock:
                store_id = str(product["store_id"])
                if store_id not in stores_alerts:
                    stores_alerts[store_id] = []
                stores_alerts[store_id].append({
                    "name": product.get("nombre", product.get("name", "Producto")),
                    "stock": stock,
                    "min_stock": min_stock
                })
        
        # Send alerts to each merchant
        for store_id, alert_products in stores_alerts.items():
            # Get merchant
            merchant = await db.merchants.find_one({"_id": ObjectId(store_id)})
            if not merchant:
                continue
            
            # Send Email (if enabled)
            if merchant.get("stock_alert_email") and merchant.get("email"):
                try:
                    from .email_service import send_stock_alert_email
                    send_stock_alert_email(
                        merchant_email=merchant["email"],
                        store_name=merchant.get("store_name", merchant.get("nombre", "Tu Tienda")),
                        low_stock_products=alert_products
                    )
                    print(f"✅ Alerta de stock enviada por email a {merchant['email']}")
                except Exception as e:
                    print(f"⚠️ Error al enviar email a {merchant.get('email')}: {str(e)}")
            
            # Send WhatsApp (if enabled)
            if merchant.get("stock_alert_whatsapp") and merchant.get("whatsapp_number"):
                try:
                    for product in alert_products:
                        if product["stock"] == 0:
                            twilio_service.send_critical_stock_alert(
                                merchant["whatsapp_number"],
                                product["name"]
                            )
                        else:
                            twilio_service.send_stock_alert(
                                merchant["whatsapp_number"],
                                product["name"],
                                product["stock"],
                                product["min_stock"]
                            )
                    print(f"✅ Alerta de stock enviada por WhatsApp a {merchant['whatsapp_number']}")
                except Exception as e:
                    print(f"⚠️ Error al enviar WhatsApp: {str(e)}")
            
            # Send Push Notification (if enabled)
            if merchant.get("stock_alert_push") and merchant.get("expo_push_token"):
                try:
                    # Send one consolidated push or one per critical product
                    critical_products = [p for p in alert_products if p["stock"] == 0]
                    warning_products = [p for p in alert_products if p["stock"] > 0]
                    
                    if critical_products:
                        # Send critical alert
                        product_names = ", ".join([p["name"] for p in critical_products[:3]])
                        if len(critical_products) > 3:
                            product_names += f" y {len(critical_products) - 3} más"
                        
                        expo_push_service.send_push_notification(
                            merchant["expo_push_token"],
                            "🚨 Stock Agotado",
                            f"Sin stock: {product_names}",
                            {"type": "stock_alert", "level": "critical", "count": len(critical_products)}
                        )
                    
                    if warning_products:
                        # Send warning alert
                        product_names = ", ".join([p["name"] for p in warning_products[:3]])
                        if len(warning_products) > 3:
                            product_names += f" y {len(warning_products) - 3} más"
                        
                        expo_push_service.send_push_notification(
                            merchant["expo_push_token"],
                            "⚠️ Stock Bajo",
                            f"Stock bajo: {product_names}",
                            {"type": "stock_alert", "level": "warning", "count": len(warning_products)}
                        )
                    
                    print(f"✅ Alerta de stock enviada por Push a {merchant.get('store_name', 'Tienda')}")
                except Exception as e:
                    print(f"⚠️ Error al enviar Push: {str(e)}")
        
        print(f"[{datetime.now()}] Daily stock alerts sent to {len(stores_alerts)} stores")
    
    except Exception as e:
        print(f"Error in daily stock alerts job: {str(e)}")

async def send_daily_sales_summary():
    """Job: Send daily sales summary at 8pm via Email, WhatsApp, and Push"""
    print(f"[{datetime.now()}] Running daily sales summary job...")
    
    try:
        # Get today's date
        today = datetime.now().date()
        start_of_day = datetime.combine(today, datetime.min.time())
        end_of_day = datetime.combine(today, datetime.max.time())
        
        # Get all merchants (nueva estructura)
        merchants = await db.merchants.find({}).to_list(10000)
        
        for merchant in merchants:
            store_id = str(merchant.get("_id"))
            
            # Check if merchant has any daily alerts enabled
            has_daily_email = merchant.get("daily_email", False)
            has_daily_whatsapp = merchant.get("daily_whatsapp", False)
            has_daily_push = merchant.get("daily_push", False)
            
            if not has_daily_email and not has_daily_whatsapp and not has_daily_push:
                continue
            
            # Get today's sales
            sales = await db.sales.find({
                "store_id": store_id,
                "created_at": {"$gte": start_of_day, "$lte": end_of_day}
            }).to_list(10000)
            
            # Get today's expenses
            expenses = await db.expenses.find({
                "store_id": store_id,
                "created_at": {"$gte": start_of_day, "$lte": end_of_day}
            }).to_list(10000)
            
            total_sales = sum(sale.get("total", 0) for sale in sales)
            total_expenses = sum(expense.get("amount", 0) for expense in expenses)
            balance = total_sales - total_expenses
            
            # Calcular productos más vendidos
            product_sales = {}
            for sale in sales:
                for item in sale.get("items", sale.get("products", [])):
                    product_name = item.get("product_name", "Producto")
                    quantity = item.get("quantity", 0)
                    if product_name in product_sales:
                        product_sales[product_name] += quantity
                    else:
                        product_sales[product_name] = quantity
            
            top_products = [
                {"name": name, "quantity": qty} 
                for name, qty in sorted(product_sales.items(), key=lambda x: x[1], reverse=True)
            ]
            
            # Get low stock alerts
            products = await db.products.find({"store_id": store_id}).to_list(10000)
            low_stock_alerts = [
                {
                    "product": p.get("nombre", p.get("name", "Producto")),
                    "stock": p.get("stock", p.get("quantity", 0)),
                    "min_stock": p.get("stock_minimo", p.get("min_stock_alert", 0))
                }
                for p in products
                if p.get("stock", p.get("quantity", 0)) <= p.get("stock_minimo", p.get("min_stock_alert", 0))
            ]
            
            # Send Email (only if daily_email is enabled and email exists)
            if has_daily_email and merchant.get("email"):
                try:
                    from .email_service import send_daily_summary_email
                    
                    summary_data = {
                        "total_sales": total_sales,
                        "total_expenses": total_expenses,
                        "balance": balance,
                        "top_products": top_products,
                        "low_stock_alerts": low_stock_alerts,
                        "date": today.strftime("%d/%m/%Y")
                    }
                    
                    send_daily_summary_email(
                        admin_email=merchant["email"],
                        company_name=merchant.get("store_name", merchant.get("nombre", "Tu Tienda")),
                        summary_data=summary_data
                    )
                    print(f"✅ Email de resumen diario enviado a {merchant['email']}")
                except Exception as e:
                    print(f"⚠️ Error al enviar email a {merchant.get('email')}: {str(e)}")
            
            # Send WhatsApp (only if daily_whatsapp is enabled and whatsapp_number exists)
            if has_daily_whatsapp and merchant.get("whatsapp_number"):
                try:
                    twilio_service.send_daily_sales_summary(
                        merchant["whatsapp_number"],
                        total_sales,
                        len(sales),
                        total_expenses
                    )
                    print(f"✅ WhatsApp de resumen diario enviado a {merchant['whatsapp_number']}")
                except Exception as e:
                    print(f"⚠️ Error al enviar WhatsApp a {merchant.get('whatsapp_number')}: {str(e)}")
            
            # Send Push Notification (only if daily_push is enabled and expo_push_token exists)
            if has_daily_push and merchant.get("expo_push_token"):
                try:
                    expo_push_service.send_daily_summary_push(
                        merchant["expo_push_token"],
                        total_sales,
                        balance
                    )
                    print(f"✅ Push de resumen diario enviado a {merchant.get('store_name', 'Tienda')}")
                except Exception as e:
                    print(f"⚠️ Error al enviar Push: {str(e)}")
        
        print(f"[{datetime.now()}] Daily sales summary sent to {len(merchants)} merchants")
    
    except Exception as e:
        print(f"Error in daily sales summary job: {str(e)}")

async def send_weekly_summary_with_insights():
    """Job: Send weekly summary + AI insights on Monday at 9am via Email, WhatsApp, and Push"""
    print(f"[{datetime.now()}] Running weekly summary with AI insights job...")
    
    try:
        from .ai_insights_service import ai_insights_service
        
        # Get last 7 days
        today = datetime.now().date()
        week_ago = today - timedelta(days=7)
        start_of_week = datetime.combine(week_ago, datetime.min.time())
        end_of_week = datetime.combine(today, datetime.max.time())
        
        # Get all merchants
        merchants = await db.merchants.find({}).to_list(10000)
        
        for merchant in merchants:
            store_id = str(merchant.get("_id"))
            
            # Check if merchant has any weekly alerts enabled
            has_weekly_email = merchant.get("weekly_email", False)
            has_weekly_whatsapp = merchant.get("weekly_whatsapp", False)
            has_weekly_push = merchant.get("weekly_push", False)
            
            if not has_weekly_email and not has_weekly_whatsapp and not has_weekly_push:
                continue
            
            # Get week's data
            sales = await db.sales.find({
                "store_id": store_id,
                "created_at": {"$gte": start_of_week, "$lte": end_of_week}
            }).to_list(10000)
            
            expenses = await db.expenses.find({
                "store_id": store_id,
                "created_at": {"$gte": start_of_week, "$lte": end_of_week}
            }).to_list(10000)
            
            products = await db.products.find({"store_id": store_id}).to_list(1000)
            customers = await db.customers.find({"store_id": store_id}).to_list(1000)
            
            # Calculate basic metrics
            total_sales = sum(sale.get("total", 0) for sale in sales)
            total_expenses = sum(expense.get("amount", 0) for expense in expenses)
            balance = total_sales - total_expenses
            
            # Get debts
            customer_debts_cursor = await db.sales.find({
                "store_id": store_id,
                "paid": False
            }).to_list(10000)
            customer_debts = sum(sale.get("total", 0) - sale.get("paid_amount", 0) for sale in customer_debts_cursor)
            
            supplier_debts_cursor = await db.expenses.find({
                "store_id": store_id,
                "paid": False
            }).to_list(10000)
            supplier_debts = sum(expense.get("amount", 0) - expense.get("paid_amount", 0) for expense in supplier_debts_cursor)
            
            # Generate AI insights
            insights = await ai_insights_service.generate_business_insights(
                sales, expenses, products, customers
            )
            
            # Save insights to DB
            if insights.get('success'):
                await db.insights.insert_one({
                    "store_id": store_id,
                    "insights": insights.get('insights'),
                    "metrics": insights.get('metrics'),
                    "generated_at": datetime.now(),
                    "period": "weekly",
                    "period_days": 7
                })
            
            data = {
                "total_sales": total_sales,
                "total_expenses": total_expenses,
                "balance": balance,
                "customer_debts": customer_debts,
                "supplier_debts": supplier_debts,
                "insights": insights.get('insights', []) if insights.get('success') else []
            }
            
            # Send Email (if enabled)
            if has_weekly_email and merchant.get("email"):
                try:
                    from .email_service import send_weekly_summary_email
                    send_weekly_summary_email(
                        merchant_email=merchant["email"],
                        store_name=merchant.get("store_name", merchant.get("nombre", "Tu Tienda")),
                        summary_data=data
                    )
                    print(f"✅ Resumen semanal enviado por email a {merchant['email']}")
                except Exception as e:
                    print(f"⚠️ Error al enviar email semanal: {str(e)}")
            
            # Send WhatsApp (if enabled)
            if has_weekly_whatsapp and merchant.get("whatsapp_number"):
                try:
                    twilio_service.send_weekly_summary(
                        merchant["whatsapp_number"],
                        data
                    )
                    # Also send AI insights via WhatsApp
                    if insights.get('success'):
                        message = ai_insights_service.format_insights_for_whatsapp(insights)
                        twilio_service.send_whatsapp(merchant["whatsapp_number"], message)
                    print("✅ Resumen semanal enviado por WhatsApp")
                except Exception as e:
                    print(f"⚠️ Error al enviar WhatsApp semanal: {str(e)}")
            
            # Send Push Notification (if enabled)
            if has_weekly_push and merchant.get("expo_push_token"):
                try:
                    # Send summary push
                    emoji = "📈" if balance >= 0 else "📉"
                    expo_push_service.send_push_notification(
                        merchant["expo_push_token"],
                        f"{emoji} Resumen Semanal",
                        f"Ventas: ${total_sales:.2f} | Balance: ${balance:.2f}",
                        {"type": "weekly_summary", "total_sales": total_sales, "balance": balance}
                    )
                    print(f"✅ Resumen semanal enviado por Push a {merchant.get('store_name', 'Tienda')}")
                except Exception as e:
                    print(f"⚠️ Error al enviar Push semanal: {str(e)}")
        
        print(f"[{datetime.now()}] Weekly summary with insights sent")
    
    except Exception as e:
        print(f"Error in weekly summary with insights job: {str(e)}")


# DEPRECATED - Replaced by send_weekly_summary_with_insights
async def send_weekly_summary_OLD():
    """Job: Send weekly summary on Monday at 9am"""
    print(f"[{datetime.now()}] Running weekly summary job...")
    
    try:
        # Get last 7 days
        today = datetime.now().date()
        week_ago = today - timedelta(days=7)
        start_of_week = datetime.combine(week_ago, datetime.min.time())
        end_of_week = datetime.combine(today, datetime.max.time())
        
        # Get all stores
        stores = await db.users.find({}).to_list(10000)
        
        for user in stores:
            if not user.get("alerts_enabled", True):
                continue
            
            if not user.get("weekly_summary_enabled", True):
                continue
            
            store_id = str(user.get("store_id"))
            if not store_id:
                continue
            
            # Get week's sales
            sales = await db.sales.find({
                "store_id": store_id,
                "created_at": {"$gte": start_of_week, "$lte": end_of_week}
            }).to_list(10000)
            
            # Get week's expenses
            expenses = await db.expenses.find({
                "store_id": store_id,
                "created_at": {"$gte": start_of_week, "$lte": end_of_week}
            }).to_list(10000)
            
            # Get customer debts
            customer_debts_cursor = await db.sales.find({
                "store_id": store_id,
                "paid": False
            }).to_list(10000)
            customer_debts = sum(sale.get("total", 0) - sale.get("paid_amount", 0) for sale in customer_debts_cursor)
            
            # Get supplier debts
            supplier_debts_cursor = await db.expenses.find({
                "store_id": store_id,
                "paid": False
            }).to_list(10000)
            supplier_debts = sum(expense.get("amount", 0) - expense.get("paid_amount", 0) for expense in supplier_debts_cursor)
            
            total_sales = sum(sale.get("total", 0) for sale in sales)
            total_expenses = sum(expense.get("amount", 0) for expense in expenses)
            balance = total_sales - total_expenses
            
            data = {
                "total_sales": total_sales,
                "total_expenses": total_expenses,
                "balance": balance,
                "customer_debts": customer_debts,
                "supplier_debts": supplier_debts
            }
            
            # Send WhatsApp
            if user.get("whatsapp_number"):
                twilio_service.send_weekly_summary(
                    user["whatsapp_number"],
                    data
                )
            
            # Email temporarily disabled
            # if user.get("alert_email"):
            #     sendgrid_service.send_weekly_summary_email(
            #         user["alert_email"],
            #         data
            #     )
        
        print(f"[{datetime.now()}] Weekly summary sent")
    
    except Exception as e:
        print(f"Error in weekly summary job: {str(e)}")

async def send_weekly_ai_insights():
    """Job: Send AI insights weekly on Monday"""
    print(f"[{datetime.now()}] Running weekly AI insights job...")
    
    try:
        from .ai_insights_service import ai_insights_service
        
        # Get all stores
        stores = await db.users.find({}).to_list(10000)
        
        for user in stores:
            store_id = str(user.get("store_id"))
            if not store_id:
                continue
            
            # Get last 7 days of data
            seven_days_ago = datetime.now() - timedelta(days=7)
            
            sales = await db.sales.find({
                "store_id": store_id,
                "created_at": {"$gte": seven_days_ago}
            }).to_list(1000)
            
            expenses = await db.expenses.find({
                "store_id": store_id,
                "created_at": {"$gte": seven_days_ago}
            }).to_list(1000)
            
            products = await db.products.find({"store_id": store_id}).to_list(1000)
            customers = await db.customers.find({"store_id": store_id}).to_list(1000)
            
            # Generate insights
            insights = await ai_insights_service.generate_business_insights(
                sales, expenses, products, customers
            )
            
            if insights.get('success'):
                # Save to DB
                await db.insights.insert_one({
                    "store_id": store_id,
                    "user_id": user["_id"],
                    "insights": insights.get('insights'),
                    "metrics": insights.get('metrics'),
                    "generated_at": datetime.now(),
                    "period": "weekly",
                    "period_days": 7
                })
                
                # Send via WhatsApp
                if user.get("whatsapp_number"):
                    message = ai_insights_service.format_insights_for_whatsapp(insights)
                    twilio_service.send_whatsapp(user["whatsapp_number"], message)
        
        print(f"[{datetime.now()}] Weekly AI insights sent")
    
    except Exception as e:
        print(f"Error in weekly AI insights job: {str(e)}")

async def send_monthly_ai_insights():
    """Job: Send AI insights monthly on 1st"""
    print(f"[{datetime.now()}] Running monthly AI insights job...")
    
    try:
        from .ai_insights_service import ai_insights_service
        
        # Get all merchants
        merchants = await db.merchants.find({}).to_list(10000)
        
        for merchant in merchants:
            store_id = str(merchant.get("_id"))
            
            # Get last 30 days of data
            thirty_days_ago = datetime.now() - timedelta(days=30)
            
            sales = await db.sales.find({
                "store_id": store_id,
                "created_at": {"$gte": thirty_days_ago}
            }).to_list(1000)
            
            expenses = await db.expenses.find({
                "store_id": store_id,
                "created_at": {"$gte": thirty_days_ago}
            }).to_list(1000)
            
            products = await db.products.find({"store_id": store_id}).to_list(1000)
            customers = await db.customers.find({"store_id": store_id}).to_list(1000)
            
            # Generate insights
            insights = await ai_insights_service.generate_business_insights(
                sales, expenses, products, customers
            )
            
            if insights.get('success'):
                # Save to DB
                await db.insights.insert_one({
                    "store_id": store_id,
                    "merchant_id": merchant["_id"],
                    "insights": insights.get('insights'),
                    "metrics": insights.get('metrics'),
                    "generated_at": datetime.now(),
                    "period": "monthly",
                    "period_days": 30
                })
                
                # Send Email (if enabled)
                if merchant.get("monthly_email") and merchant.get("email"):
                    try:
                        from .email_service import send_monthly_insights_email
                        send_monthly_insights_email(
                            merchant_email=merchant["email"],
                            store_name=merchant.get("store_name", merchant.get("nombre", "Tu Tienda")),
                            insights=insights
                        )
                        print(f"✅ Insights mensuales enviados por email a {merchant['email']}")
                    except Exception as e:
                        print(f"⚠️ Error al enviar email mensual: {str(e)}")
                
                # Send WhatsApp (if enabled)
                if merchant.get("monthly_whatsapp") and merchant.get("whatsapp_number"):
                    try:
                        message = ai_insights_service.format_insights_for_whatsapp(insights)
                        twilio_service.send_whatsapp(merchant["whatsapp_number"], message)
                        print("✅ Insights mensuales enviados por WhatsApp")
                    except Exception as e:
                        print(f"⚠️ Error al enviar WhatsApp mensual: {str(e)}")
        
        print(f"[{datetime.now()}] Monthly AI insights sent")
    
    except Exception as e:
        print(f"Error in monthly AI insights job: {str(e)}")

def start_scheduler():
    """Initialize and start the scheduler"""
    # Daily stock alerts at 8:00 AM
    scheduler.add_job(
        send_daily_stock_alerts,
        CronTrigger(hour=8, minute=0),
        id='daily_stock_alerts',
        name='Send daily stock alerts',
        replace_existing=True
    )
    
    # Daily sales summary at 8:00 PM
    scheduler.add_job(
        send_daily_sales_summary,
        CronTrigger(hour=20, minute=0),
        id='daily_sales_summary',
        name='Send daily sales summary',
        replace_existing=True
    )
    
    # Weekly summary + AI insights on Monday at 9:00 AM
    scheduler.add_job(
        send_weekly_summary_with_insights,
        CronTrigger(day_of_week='mon', hour=9, minute=0),
        id='weekly_summary_insights',
        name='Send weekly summary with AI insights',
        replace_existing=True
    )
    
    # Monthly AI insights on 1st of month at 10:00 AM
    scheduler.add_job(
        send_monthly_ai_insights,
        CronTrigger(day=1, hour=10, minute=0),
        id='monthly_ai_insights',
        name='Send monthly AI insights',
        replace_existing=True
    )
    
    scheduler.start()
    print("Alert scheduler started successfully")
    print("Jobs scheduled:")
    print("  - Daily stock alerts: 8:00 AM")
    print("  - Daily sales summary: 8:00 PM")
    print("  - Weekly summary: Monday 9:00 AM")
    print("  - Weekly AI insights: Monday 9:30 AM")
    print("  - Monthly AI insights: 1st of month 10:00 AM")

def stop_scheduler():
    """Stop the scheduler"""
    if scheduler.running:
        scheduler.shutdown()
        print("Alert scheduler stopped")
