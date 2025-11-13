#!/usr/bin/env python3
import sys
sys.path.append('/app/backend')
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

async def check():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["test_database"]
    
    store_id = "69152f3af9b199e3507a5b2b"
    
    # Get ALL insights for this store
    insights = await db.insights.find({
        "store_id": store_id
    }).sort("_id", -1).to_list(10)
    
    print(f"📊 TODOS LOS REPORTES DE WOLFERS:")
    print("=" * 60)
    
    if not insights:
        print("❌ No hay reportes generados para esta tienda")
    else:
        for i, insight in enumerate(insights, 1):
            print(f"\n{i}. Reporte ID: {insight['_id']}")
            print(f"   Contenido (primeros 200 caracteres):")
            content = insight.get('insight', 'N/A')
            if content and content != 'N/A':
                print(f"   {content[:200]}...")
            else:
                print(f"   ⚠️ Sin contenido")
    
    # Check sales and expenses
    sales_count = await db.sales.count_documents({"store_id": store_id})
    expenses_count = await db.expenses.count_documents({"store_id": store_id})
    products_count = await db.products.count_documents({"store_id": store_id})
    
    print(f"\n\n📈 DATOS DE LA TIENDA WOLFERS:")
    print(f"   Productos: {products_count}")
    print(f"   Ventas: {sales_count}")
    print(f"   Gastos: {expenses_count}")
    print(f"   Reportes AI: {len(insights)}")

asyncio.run(check())
