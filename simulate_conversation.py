#!/usr/bin/env python3
import sys
sys.path.append('/app/backend')
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
from services.whatsapp_conversation_service import WhatsAppConversationService

async def simulate():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["test_database"]
    
    service = WhatsAppConversationService(db)
    
    user_phone = "+593992913093"
    store_id = "690e264929f0c385565b3a1b"
    
    print("🤖 SIMULACIÓN DE CONVERSACIÓN CON AI")
    print("=" * 60)
    
    messages = [
        "venta",
        "vendí 2 coca colas a María por $5 total",
        "efectivo y ya pagó",
        "sí"
    ]
    
    for i, msg in enumerate(messages, 1):
        print(f"\n📱 TÚ: {msg}")
        print("-" * 60)
        
        response = await service.process_message(user_phone, store_id, msg)
        
        print(f"🤖 AI: {response}")
        print()
        
        await asyncio.sleep(1)
    
    print("\n✅ Conversación completa!")
    print("\nVerificando si se creó la venta...")
    
    from datetime import datetime, timedelta
    recent = datetime.utcnow() - timedelta(minutes=1)
    sales = await db.sales.find({
        "store_id": store_id,
        "created_at": {"$gte": recent}
    }).sort("created_at", -1).to_list(1)
    
    if sales:
        sale = sales[0]
        print(f"\n💰 VENTA REGISTRADA:")
        print(f"   ID: {sale['_id']}")
        print(f"   Total: ${sale['total']}")
        print(f"   Cliente: {sale.get('customer_name')}")
        print(f"   Productos: {sale.get('products')}")
    else:
        print("\n❌ No se registró ninguna venta")

asyncio.run(simulate())
