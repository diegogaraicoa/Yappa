#!/usr/bin/env python3
import sys
import asyncio
sys.path.append('/app/backend')
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def register_user(whatsapp_number, email, password, store_name):
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["test_database"]
    
    # Check if user exists
    existing = await db.users.find_one({"whatsapp_number": whatsapp_number})
    if existing:
        print(f"✅ Usuario ya existe con WhatsApp: {whatsapp_number}")
        print(f"   Email: {existing['email']}")
        print(f"   Store: {existing['store_id']}")
        return
    
    # Create store
    store = {
        "name": store_name,
        "created_at": None
    }
    store_result = await db.stores.insert_one(store)
    store_id = str(store_result.inserted_id)
    
    # Create user
    user = {
        "email": email,
        "password": pwd_context.hash(password),
        "store_id": store_id,
        "whatsapp_number": whatsapp_number,
        "alerts_enabled": True,
        "stock_alerts_enabled": True,
        "sales_summary_enabled": True,
        "ai_insights_enabled": True
    }
    
    await db.users.insert_one(user)
    print(f"✅ Usuario registrado exitosamente!")
    print(f"   WhatsApp: {whatsapp_number}")
    print(f"   Email: {email}")
    print(f"   Password: {password}")
    print(f"   Store ID: {store_id}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python3 register_whatsapp_user.py +593XXXXXXXXX")
        sys.exit(1)
    
    phone = sys.argv[1]
    email = f"whatsapp{phone.replace('+', '')}@tienda.com"
    password = "MiTienda2025!"
    store_name = f"Tienda WhatsApp {phone}"
    
    asyncio.run(register_user(phone, email, password, store_name))
