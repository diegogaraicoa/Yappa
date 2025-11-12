#!/usr/bin/env python3
import sys
sys.path.append('/app/backend')
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
from datetime import datetime, timedelta

async def check():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["test_database"]
    
    store_id = "690e264929f0c385565b3a1b"
    recent = datetime.utcnow() - timedelta(minutes=10)
    
    sales = await db.sales.find({
        "store_id": store_id,
        "created_at": {"$gte": recent}
    }).sort("created_at", -1).to_list(10)
    
    print(f"💰 VENTAS DE LOS ÚLTIMOS 10 MINUTOS:")
    print("=" * 60)
    
    if not sales:
        print("No hay ventas recientes")
    else:
        for sale in sales:
            print(f"\n📝 Venta ID: {sale['_id']}")
            print(f"   Total: ${sale['total']}")
            print(f"   Cliente: {sale.get('customer_name', 'N/A')}")
            print(f"   Pago: {sale.get('payment_method', 'N/A')}")
            print(f"   Pagado: {'Sí' if sale.get('paid') else 'No'}")
            print(f"   Notas: {sale.get('notes', 'N/A')}")
            print(f"   Productos:")
            for p in sale.get('products', []):
                print(f"      - {p['product_name']}: {p['quantity']} x ${p['price']} = ${p['total']}")
            print(f"   Fecha: {sale['created_at']}")

asyncio.run(check())
