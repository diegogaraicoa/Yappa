#!/usr/bin/env python3
"""
Seed test data for new auth system
Creates: 1 Admin → 1 Merchant → 2 Clerks
"""

import sys
sys.path.append('/app/backend')

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from services.auth_service import get_password_hash

async def seed_test_data():
    print("🌱 Seeding test data for auth system...")
    print("=" * 60)
    
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["test_database"]
    
    # ============================================
    # 1. CREATE ADMIN
    # ============================================
    
    print("\n👤 Creating Admin...")
    admin_data = {
        "nombre": "Juan Perez",
        "email": "juan@example.com",
        "telefono": "+593999123456",
        "created_at": datetime.utcnow()
    }
    
    # Check if exists
    existing_admin = await db.admins.find_one({"email": admin_data["email"]})
    if existing_admin:
        admin_id = str(existing_admin["_id"])
        print(f"  ✓ Admin already exists: {admin_id}")
    else:
        admin_result = await db.admins.insert_one(admin_data)
        admin_id = str(admin_result.inserted_id)
        print(f"  ✅ Admin created: {admin_id}")
    
    # ============================================
    # 2. CREATE MERCHANT
    # ============================================
    
    print("\n🏪 Creating Merchant...")
    merchant_data = {
        "admin_id": admin_id,
        "username": "tienda_demo",
        "password": get_password_hash("demo123"),  # Password: demo123
        "nombre": "Tienda Demo",
        "direccion": "Av. Principal 123, Quito",
        "telefono": "+593999111222",
        "created_at": datetime.utcnow(),
        "activated_at": None,
        "fully_activated_at": None,
        "active": True
    }
    
    # Check if exists
    existing_merchant = await db.merchants.find_one({"username": merchant_data["username"]})
    if existing_merchant:
        merchant_id = str(existing_merchant["_id"])
        print(f"  ✓ Merchant already exists: {merchant_id}")
    else:
        merchant_result = await db.merchants.insert_one(merchant_data)
        merchant_id = str(merchant_result.inserted_id)
        print(f"  ✅ Merchant created: {merchant_id}")
    
    # ============================================
    # 3. CREATE CLERKS
    # ============================================
    
    print("\n👥 Creating Clerks...")
    
    clerks_data = [
        {
            "merchant_id": merchant_id,
            "email": "maria@example.com",
            "password": get_password_hash("maria123"),  # Password: maria123
            "nombre": "Maria Lopez",
            "whatsapp_number": "+593992913093",
            "role": "owner",
            "created_at": datetime.utcnow(),
            "activated_at": None,
            "fully_activated_at": None,
            "alerts_enabled": True,
            "stock_alerts_enabled": True,
            "sales_summary_enabled": True,
            "ai_insights_enabled": True,
            "active": True
        },
        {
            "merchant_id": merchant_id,
            "email": "carlos@example.com",
            "password": get_password_hash("carlos123"),  # Password: carlos123
            "nombre": "Carlos Ruiz",
            "whatsapp_number": "+593997992717",
            "role": "employee",
            "created_at": datetime.utcnow(),
            "activated_at": None,
            "fully_activated_at": None,
            "alerts_enabled": True,
            "stock_alerts_enabled": True,
            "sales_summary_enabled": True,
            "ai_insights_enabled": True,
            "active": True
        }
    ]
    
    for clerk_data in clerks_data:
        # Check if exists
        existing_clerk = await db.clerks.find_one({"email": clerk_data["email"]})
        if existing_clerk:
            print(f"  ✓ Clerk already exists: {clerk_data['nombre']} ({clerk_data['email']})")
        else:
            clerk_result = await db.clerks.insert_one(clerk_data)
            print(f"  ✅ Clerk created: {clerk_data['nombre']} ({clerk_data['email']})")
    
    # ============================================
    # SUMMARY
    # ============================================
    
    print("\n" + "=" * 60)
    print("✅ Test data seeded successfully!")
    print("=" * 60)
    
    print("\n📝 TEST CREDENTIALS:")
    print("-" * 60)
    print("STEP 1 - Merchant Login:")
    print(f"  Username: tienda_demo")
    print(f"  Password: demo123")
    print()
    print("STEP 2 - Clerk Login (choose one):")
    print(f"  1. Maria Lopez (Owner)")
    print(f"     Email: maria@example.com")
    print(f"     Password: maria123")
    print()
    print(f"  2. Carlos Ruiz (Employee)")
    print(f"     Email: carlos@example.com")
    print(f"     Password: carlos123")
    print("-" * 60)
    
    print("\n🧪 TEST ENDPOINTS:")
    print("-" * 60)
    print("1. POST /api/auth/merchant/login")
    print('   Body: {"username": "tienda_demo", "password": "demo123"}')
    print()
    print("2. POST /api/auth/clerk/login")
    print('   Body: {"merchant_id": "<from_step1>", "email": "maria@example.com", "password": "maria123"}')
    print("-" * 60)
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_test_data())
