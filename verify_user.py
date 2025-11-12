#!/usr/bin/env python3
import sys
sys.path.append('/app/backend')
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

async def verify():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["test_database"]
    
    phone = "+593992913093"
    
    # Find user
    user = await db.users.find_one({"whatsapp_number": phone})
    
    if user:
        print("✅ USUARIO ENCONTRADO")
        print(f"   Email: {user['email']}")
        print(f"   Store ID: {user['store_id']}")
        print(f"   WhatsApp: {user['whatsapp_number']}")
        
        # Get store info
        from bson import ObjectId
        store = await db.stores.find_one({"_id": ObjectId(user['store_id'])})
        if store:
            print(f"   Tienda: {store['name']}")
        
        # Count products
        products = await db.products.count_documents({"store_id": user['store_id']})
        print(f"\n📦 Productos en inventario: {products}")
        
        # Recent sales
        sales = await db.sales.count_documents({"store_id": user['store_id']})
        print(f"💰 Total ventas: {sales}")
        
        # Recent WhatsApp sales
        wa_sales = await db.sales.count_documents({
            "store_id": user['store_id'],
            "notes": "Registrado vía WhatsApp"
        })
        print(f"📱 Ventas por WhatsApp: {wa_sales}")
        
    else:
        print("❌ Usuario no encontrado")

asyncio.run(verify())
