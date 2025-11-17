#!/usr/bin/env python3
"""
Seed robust test data for Super Dashboard KPIs
Creates:
- 3 Admins
- 10 Merchants (distributed across admins)
- 20 Clerks (distributed across merchants)
- 200+ Event logs (varied activity)
"""

import sys
sys.path.append('/app/backend')

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
from services.auth_service import get_password_hash
import random

# Secciones para eventos
SECTIONS = ["sales", "expenses", "inventory", "customers", "suppliers", "reports", "insights", "whatsapp", "training"]
ACTIONS = ["view", "create", "edit", "delete"]


async def seed_dashboard_data():
    print("🌱 Seeding robust dashboard data...")
    print("=" * 70)
    
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["test_database"]
    
    # ============================================
    # 1. CREATE ADMINS (3)
    # ============================================
    
    print("\n👤 Creating Admins...")
    admins_data = [
        {
            "nombre": "Admin Principal",
            "email": "admin1@example.com",
            "telefono": "+593999111111",
            "created_at": datetime.utcnow() - timedelta(days=180)
        },
        {
            "nombre": "Admin Secundario",
            "email": "admin2@example.com",
            "telefono": "+593999222222",
            "created_at": datetime.utcnow() - timedelta(days=120)
        },
        {
            "nombre": "Admin Test",
            "email": "admin3@example.com",
            "telefono": "+593999333333",
            "created_at": datetime.utcnow() - timedelta(days=60)
        }
    ]
    
    admin_ids = []
    for admin_data in admins_data:
        existing = await db.admins.find_one({"email": admin_data["email"]})
        if existing:
            admin_ids.append(str(existing["_id"]))
            print(f"  ✓ Admin exists: {admin_data['nombre']}")
        else:
            result = await db.admins.insert_one(admin_data)
            admin_ids.append(str(result.inserted_id))
            print(f"  ✅ Admin created: {admin_data['nombre']}")
    
    # ============================================
    # 2. CREATE MERCHANTS (10)
    # ============================================
    
    print("\n🏪 Creating Merchants...")
    merchants_base = [
        {"username": "tienda_norte", "nombre": "Tienda Norte", "direccion": "Norte de Quito"},
        {"username": "tienda_sur", "nombre": "Tienda Sur", "direccion": "Sur de Quito"},
        {"username": "tienda_centro", "nombre": "Tienda Centro", "direccion": "Centro de Quito"},
        {"username": "tienda_valle", "nombre": "Tienda Valle", "direccion": "Valle de los Chillos"},
        {"username": "tienda_guayaquil", "nombre": "Tienda Guayaquil", "direccion": "Guayaquil"},
        {"username": "tienda_cuenca", "nombre": "Tienda Cuenca", "direccion": "Cuenca"},
        {"username": "tienda_ambato", "nombre": "Tienda Ambato", "direccion": "Ambato"},
        {"username": "tienda_manta", "nombre": "Tienda Manta", "direccion": "Manta"},
        {"username": "tienda_loja", "nombre": "Tienda Loja", "direccion": "Loja"},
        {"username": "tienda_esmeraldas", "nombre": "Tienda Esmeraldas", "direccion": "Esmeraldas"}
    ]
    
    merchant_ids = []
    now = datetime.utcnow()
    
    for i, merchant_base in enumerate(merchants_base):
        # Distribuir merchants entre admins
        admin_id = admin_ids[i % len(admin_ids)]
        
        # Variar fechas de creación y activación
        days_ago = random.randint(5, 90)
        created_at = now - timedelta(days=days_ago)
        
        # 70% de merchants activados
        if random.random() < 0.7:
            activated_at = created_at + timedelta(days=random.randint(1, 5))
            # 50% de activados tienen full activation
            if random.random() < 0.5:
                fully_activated_at = activated_at + timedelta(days=random.randint(1, 10))
            else:
                fully_activated_at = None
        else:
            activated_at = None
            fully_activated_at = None
        
        merchant_data = {
            "admin_id": admin_id,
            "username": merchant_base["username"],
            "password": get_password_hash("demo123"),
            "nombre": merchant_base["nombre"],
            "direccion": merchant_base["direccion"],
            "telefono": f"+593999{random.randint(100000, 999999)}",
            "created_at": created_at,
            "activated_at": activated_at,
            "fully_activated_at": fully_activated_at,
            "active": True
        }
        
        existing = await db.merchants.find_one({"username": merchant_data["username"]})
        if existing:
            merchant_ids.append(str(existing["_id"]))
            print(f"  ✓ Merchant exists: {merchant_base['nombre']}")
        else:
            result = await db.merchants.insert_one(merchant_data)
            merchant_ids.append(str(result.inserted_id))
            print(f"  ✅ Merchant created: {merchant_base['nombre']} (Admin {i % len(admin_ids) + 1})")
    
    # ============================================
    # 3. CREATE CLERKS (20)
    # ============================================
    
    print("\n👥 Creating Clerks...")
    clerk_names = [
        ("Maria Lopez", "owner"), ("Carlos Ruiz", "employee"),
        ("Ana Torres", "employee"), ("Pedro Gomez", "employee"),
        ("Sofia Martinez", "employee"), ("Diego Sanchez", "employee"),
        ("Laura Diaz", "employee"), ("Juan Morales", "owner"),
        ("Carmen Flores", "employee"), ("Luis Herrera", "employee"),
        ("Patricia Romero", "employee"), ("Miguel Castro", "owner"),
        ("Rosa Ortiz", "employee"), ("Fernando Silva", "employee"),
        ("Elena Vargas", "employee"), ("Roberto Mendez", "employee"),
        ("Isabel Reyes", "employee"), ("Alberto Cruz", "owner"),
        ("Monica Jimenez", "employee"), ("Raul Ramos", "employee")
    ]
    
    clerk_ids = []
    
    for i, (nombre, role) in enumerate(clerk_names):
        # Distribuir clerks entre merchants (algunos merchants tienen más clerks)
        merchant_id = merchant_ids[i % len(merchant_ids)]
        
        # Email único
        email = f"clerk{i+1}@example.com"
        
        # Fechas
        days_ago = random.randint(2, 80)
        created_at = now - timedelta(days=days_ago)
        
        # 80% de clerks activados
        if random.random() < 0.8:
            activated_at = created_at + timedelta(hours=random.randint(1, 48))
            # 60% de activados tienen full activation
            if random.random() < 0.6:
                fully_activated_at = activated_at + timedelta(days=random.randint(1, 7))
            else:
                fully_activated_at = None
        else:
            activated_at = None
            fully_activated_at = None
        
        clerk_data = {
            "merchant_id": merchant_id,
            "email": email,
            "password": get_password_hash("clerk123"),
            "nombre": nombre,
            "whatsapp_number": f"+593992{random.randint(100000, 999999)}",
            "role": role,
            "created_at": created_at,
            "activated_at": activated_at,
            "fully_activated_at": fully_activated_at,
            "alerts_enabled": True,
            "stock_alerts_enabled": True,
            "sales_summary_enabled": True,
            "ai_insights_enabled": True,
            "active": True
        }
        
        existing = await db.clerks.find_one({"email": email})
        if existing:
            clerk_ids.append(str(existing["_id"]))
            print(f"  ✓ Clerk exists: {nombre}")
        else:
            result = await db.clerks.insert_one(clerk_data)
            clerk_ids.append(str(result.inserted_id))
            print(f"  ✅ Clerk created: {nombre} ({role})")
    
    # ============================================
    # 4. CREATE EVENT LOGS (200+)
    # ============================================
    
    print("\n📊 Creating Event Logs...")
    
    # Generar eventos variados en los últimos 60 días
    events_created = 0
    
    # Obtener solo clerks activados para eventos
    active_clerks = []
    for clerk_id in clerk_ids:
        clerk = await db.clerks.find_one({"_id": clerk_id})
        if clerk and clerk.get("activated_at"):
            active_clerks.append(clerk)
    
    # Crear 10-30 eventos por clerk activo
    for clerk in active_clerks:
        merchant_id = clerk["merchant_id"]
        clerk_id = str(clerk["_id"])
        
        # Número aleatorio de eventos
        num_events = random.randint(10, 30)
        
        for _ in range(num_events):
            # Timestamp aleatorio en los últimos 60 días (después de activation)
            activation_date = clerk.get("activated_at", now - timedelta(days=60))
            max_days = min((now - activation_date).days, 60)
            if max_days < 1:
                max_days = 1
            
            days_ago = random.randint(0, max_days)
            timestamp = now - timedelta(
                days=days_ago,
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )
            
            # Sección y acción aleatorias (pero con sesgo hacia sales/expenses)
            section_weights = {
                "sales": 30,
                "expenses": 25,
                "inventory": 15,
                "customers": 10,
                "reports": 10,
                "insights": 5,
                "whatsapp": 3,
                "training": 2
            }
            
            section = random.choices(
                list(section_weights.keys()),
                weights=list(section_weights.values())
            )[0]
            
            action = random.choice(ACTIONS)
            
            event = {
                "merchant_id": merchant_id,
                "clerk_id": clerk_id,
                "section": section,
                "action": action,
                "metadata": {"test": True},
                "timestamp": timestamp
            }
            
            await db.event_logs.insert_one(event)
            events_created += 1
    
    print(f"  ✅ Created {events_created} event logs")
    
    # ============================================
    # 5. CREATE CHURN SCENARIO
    # ============================================
    
    print("\n⚠️  Creating churn scenario...")
    
    # Crear 2 merchants "churned" (activos hace 60-90 días, inactivos últimos 30)
    for i in range(2):
        admin_id = random.choice(admin_ids)
        created_at = now - timedelta(days=random.randint(90, 120))
        activated_at = created_at + timedelta(days=2)
        
        churned_merchant = {
            "admin_id": admin_id,
            "username": f"tienda_churned_{i+1}",
            "password": get_password_hash("demo123"),
            "nombre": f"Tienda Churned {i+1}",
            "direccion": "Dirección",
            "telefono": "+593999000000",
            "created_at": created_at,
            "activated_at": activated_at,
            "fully_activated_at": activated_at + timedelta(days=5),
            "active": True
        }
        
        existing = await db.merchants.find_one({"username": churned_merchant["username"]})
        if not existing:
            result = await db.merchants.insert_one(churned_merchant)
            churned_merchant_id = str(result.inserted_id)
            
            # Crear clerk para este merchant
            churned_clerk = {
                "merchant_id": churned_merchant_id,
                "email": f"churned{i+1}@example.com",
                "password": get_password_hash("clerk123"),
                "nombre": f"Clerk Churned {i+1}",
                "whatsapp_number": "+593999000000",
                "role": "owner",
                "created_at": created_at,
                "activated_at": activated_at,
                "fully_activated_at": activated_at + timedelta(days=5),
                "alerts_enabled": True,
                "stock_alerts_enabled": True,
                "sales_summary_enabled": True,
                "ai_insights_enabled": True,
                "active": True
            }
            
            result = await db.clerks.insert_one(churned_clerk)
            churned_clerk_id = str(result.inserted_id)
            
            # Crear eventos antiguos (60-90 días atrás)
            for _ in range(20):
                old_timestamp = now - timedelta(
                    days=random.randint(60, 90),
                    hours=random.randint(0, 23)
                )
                
                event = {
                    "merchant_id": churned_merchant_id,
                    "clerk_id": churned_clerk_id,
                    "section": random.choice(SECTIONS),
                    "action": random.choice(ACTIONS),
                    "metadata": {"churned": True},
                    "timestamp": old_timestamp
                }
                
                await db.event_logs.insert_one(event)
            
            print(f"  ✅ Created churned merchant: {churned_merchant['nombre']}")
    
    # ============================================
    # SUMMARY
    # ============================================
    
    print("\n" + "=" * 70)
    print("✅ Dashboard data seeded successfully!")
    print("=" * 70)
    
    # Estadísticas
    total_admins = await db.admins.count_documents({})
    total_merchants = await db.merchants.count_documents({})
    total_clerks = await db.clerks.count_documents({})
    total_events = await db.event_logs.count_documents({})
    
    print(f"\n📊 DATABASE STATS:")
    print(f"  - Admins: {total_admins}")
    print(f"  - Merchants: {total_merchants}")
    print(f"  - Clerks: {total_clerks}")
    print(f"  - Event Logs: {total_events}")
    
    # Merchants activados
    activated = await db.merchants.count_documents({"activated_at": {"$ne": None}})
    fully_activated = await db.merchants.count_documents({"fully_activated_at": {"$ne": None}})
    print(f"\n  - Merchants Activated: {activated} ({int(activated/total_merchants*100)}%)")
    print(f"  - Merchants Fully Activated: {fully_activated} ({int(fully_activated/total_merchants*100)}%)")
    
    # Clerks activados
    clerks_activated = await db.clerks.count_documents({"activated_at": {"$ne": None}})
    clerks_fully = await db.clerks.count_documents({"fully_activated_at": {"$ne": None}})
    print(f"\n  - Clerks Activated: {clerks_activated} ({int(clerks_activated/total_clerks*100)}%)")
    print(f"  - Clerks Fully Activated: {clerks_fully} ({int(clerks_fully/total_clerks*100)}%)")
    
    print("\n🎯 Ready to test Super Dashboard KPIs!")
    print("=" * 70)
    
    client.close()


if __name__ == "__main__":
    asyncio.run(seed_dashboard_data())
