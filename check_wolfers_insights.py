#!/usr/bin/env python3
import sys
sys.path.append('/app/backend')
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
from datetime import datetime, timedelta

async def check():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["test_database"]
    
    store_id = "69152f3af9b199e3507a5b2b"
    recent = datetime.utcnow() - timedelta(hours=2)
    
    # Get recent insights
    insights = await db.insights.find({
        "store_id": store_id,
        "created_at": {"$gte": recent}
    }).sort("created_at", -1).to_list(10)
    
    print(f"📊 REPORTES DE WOLFERS (últimas 2 horas):")
    print("=" * 60)
    
    if not insights:
        print("❌ No hay reportes generados en las últimas 2 horas")
    else:
        for i, insight in enumerate(insights, 1):
            print(f"\n{i}. Reporte ID: {insight['_id']}")
            print(f"   Fecha: {insight.get('created_at')}")
            print(f"   Contenido:")
            print(f"   {insight.get('insight', 'N/A')[:300]}...")
            print(f"   Enviado a WhatsApp: {'Sí' if insight.get('sent_to_whatsapp') else 'No'}")

asyncio.run(check())
