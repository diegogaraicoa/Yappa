#!/usr/bin/env python3
import sys
sys.path.append('/app/backend')
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

async def check():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["test_database"]
    
    # Find WOLFERS user
    user = await db.users.find_one({"whatsapp_number": {"$regex": "997992717"}})
    
    if user:
        print("📱 USUARIO WOLFERS:")
        print(f"   Email: {user['email']}")
        print(f"   WhatsApp registrado: {user.get('whatsapp_number')}")
        print(f"   Store ID: {user['store_id']}")
        
        # Check recent insights
        insights = await db.insights.find({
            "store_id": user['store_id']
        }).sort("created_at", -1).limit(5).to_list(5)
        
        print(f"\n📊 REPORTES GENERADOS (últimos 5):")
        for i, insight in enumerate(insights, 1):
            print(f"\n{i}. ID: {insight['_id']}")
            print(f"   Fecha: {insight.get('created_at')}")
            print(f"   Tipo: {insight.get('type', 'N/A')}")
            print(f"   Preview: {insight.get('insight', 'N/A')[:100]}...")
    else:
        print("❌ Usuario WOLFERS no encontrado")
        
        # Search all users
        all_users = await db.users.find().to_list(100)
        print(f"\nUsuarios en BD: {len(all_users)}")
        for u in all_users:
            print(f"  - {u.get('email')}: {u.get('whatsapp_number', 'Sin WhatsApp')}")

asyncio.run(check())
