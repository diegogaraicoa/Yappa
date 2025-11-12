#!/usr/bin/env python3
import sys
sys.path.append('/app/backend')
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
from datetime import datetime, timedelta

async def check_recent():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["test_database"]
    
    # Check recent conversations
    recent_time = datetime.utcnow() - timedelta(hours=1)
    conversations = await db.whatsapp_conversations.find({
        "created_at": {"$gte": recent_time}
    }).sort("created_at", -1).to_list(5)
    
    print("🔍 CONVERSACIONES RECIENTES (última hora):")
    print("=" * 60)
    for conv in conversations:
        print(f"\nID: {conv['_id']}")
        print(f"Teléfono: {conv['user_phone']}")
        print(f"Estado: {conv['status']}")
        print(f"Intent: {conv.get('intent', 'N/A')}")
        print(f"Mensajes: {len(conv.get('messages', []))}")
        print(f"Datos extraídos: {conv.get('data', {})}")
        
    # Check recent sales
    sales = await db.sales.find({
        "notes": "Registrado vía WhatsApp",
        "created_at": {"$gte": recent_time}
    }).sort("created_at", -1).to_list(5)
    
    print("\n\n💰 VENTAS REGISTRADAS VÍA WHATSAPP (última hora):")
    print("=" * 60)
    for sale in sales:
        print(f"\nID: {sale['_id']}")
        print(f"Total: ${sale['total']}")
        print(f"Cliente: {sale.get('customer_name', 'N/A')}")
        print(f"Productos: {sale.get('products', [])}")
        print(f"Fecha: {sale['created_at']}")

asyncio.run(check_recent())
