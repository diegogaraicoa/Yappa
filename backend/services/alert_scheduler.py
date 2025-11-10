from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
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
    """Job: Send daily stock alerts at 8am"""
    print(f"[{datetime.now()}] Running daily stock alerts job...")
    
    try:
        # Get all stores with alert-enabled products
        products = await db.products.find({
            "alert_enabled": True
        }).to_list(10000)
        
        # Group products by store
        stores_alerts = {}
        for product in products:
            if product["quantity"] <= product.get("min_stock_alert", 10):
                store_id = str(product["store_id"])
                if store_id not in stores_alerts:
                    stores_alerts[store_id] = []
                stores_alerts[store_id].append(product)
        
        # Send alerts to each store owner
        for store_id, alert_products in stores_alerts.items():
            # Get store owner/user
            users = await db.users.find({"store_id": store_id}).to_list(100)
            
            for user in users:
                if not user.get("alerts_enabled", True):
                    continue
                
                if not user.get("stock_alerts_enabled", True):
                    continue
                
                # Send WhatsApp
                if user.get("whatsapp_number"):
                    for product in alert_products:
                        if product["quantity"] == 0:
                            twilio_service.send_critical_stock_alert(
                                user["whatsapp_number"],
                                product["name"]
                            )
                        else:
                            twilio_service.send_stock_alert(
                                user["whatsapp_number"],
                                product["name"],
                                product["quantity"],
                                product.get("min_stock_alert", 10)
                            )
                
                # Email temporarily disabled
                # if user.get("alert_email"):
                #     sendgrid_service.send_stock_alert_email(
                #         user["alert_email"],
                #         alert_products
                #     )
                
                # Send Push Notifications
                if user.get("expo_push_token"):
                    for product in alert_products:
                        expo_push_service.send_stock_alert_push(
                            user["expo_push_token"],
                            product["name"],
                            product["quantity"]
                        )
        
        print(f"[{datetime.now()}] Daily stock alerts sent to {len(stores_alerts)} stores")
    
    except Exception as e:
        print(f"Error in daily stock alerts job: {str(e)}")

async def send_daily_sales_summary():
    """Job: Send daily sales summary at 8pm"""
    print(f"[{datetime.now()}] Running daily sales summary job...")
    
    try:
        # Get today's date
        today = datetime.now().date()
        start_of_day = datetime.combine(today, datetime.min.time())
        end_of_day = datetime.combine(today, datetime.max.time())
        
        # Get all stores
        stores = await db.users.find({}).to_list(10000)
        
        for user in stores:
            if not user.get("alerts_enabled", True):
                continue
            
            if not user.get("daily_summary_enabled", True):
                continue
            
            store_id = str(user.get("store_id"))
            if not store_id:
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
            
            # Send WhatsApp
            if user.get("whatsapp_number"):
                twilio_service.send_daily_sales_summary(
                    user["whatsapp_number"],
                    total_sales,
                    len(sales),
                    total_expenses
                )
            
            # Email temporarily disabled
            # if user.get("alert_email"):
            #     sendgrid_service.send_daily_sales_email(
            #         user["alert_email"],
            #         {
            #             "date": today.strftime("%Y-%m-%d"),
            #             "total_sales": total_sales,
            #             "num_sales": len(sales),
            #             "total_expenses": total_expenses
            #         }
            #     )
            
            # Send Push
            if user.get("expo_push_token"):
                expo_push_service.send_daily_summary_push(
                    user["expo_push_token"],
                    total_sales,
                    balance
                )
        
        print(f"[{datetime.now()}] Daily sales summary sent")
    
    except Exception as e:
        print(f"Error in daily sales summary job: {str(e)}")

async def send_weekly_summary():
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
        
        # Get all stores
        stores = await db.users.find({}).to_list(10000)
        
        for user in stores:
            store_id = str(user.get("store_id"))
            if not store_id:
                continue
            
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
                    "user_id": user["_id"],
                    "insights": insights.get('insights'),
                    "metrics": insights.get('metrics'),
                    "generated_at": datetime.now(),
                    "period": "monthly",
                    "period_days": 30
                })
                
                # Send via WhatsApp
                if user.get("whatsapp_number"):
                    message = ai_insights_service.format_insights_for_whatsapp(insights)
                    twilio_service.send_whatsapp(user["whatsapp_number"], message)
        
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
    
    # Weekly summary on Monday at 9:00 AM
    scheduler.add_job(
        send_weekly_summary,
        CronTrigger(day_of_week='mon', hour=9, minute=0),
        id='weekly_summary',
        name='Send weekly summary',
        replace_existing=True
    )
    
    # Weekly AI insights on Monday at 9:30 AM (after weekly summary)
    scheduler.add_job(
        send_weekly_ai_insights,
        CronTrigger(day_of_week='mon', hour=9, minute=30),
        id='weekly_ai_insights',
        name='Send weekly AI insights',
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
