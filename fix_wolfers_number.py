#!/usr/bin/env python3
import sys
sys.path.append('/app/backend')
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

async def fix():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["test_database"]
    
    # Update WOLFERS number
    result = await db.users.update_one(
        {"whatsapp_number": "+0997992717"},
        {"$set": {"whatsapp_number": "+593997992717"}}
    )
    
    if result.modified_count > 0:
        print("✅ Número de WhatsApp corregido!")
        print("   Antes: +0997992717")
        print("   Ahora: +593997992717")
        
        # Verify
        user = await db.users.find_one({"whatsapp_number": "+593997992717"})
        if user:
            print(f"\n✅ Verificación exitosa")
            print(f"   Usuario: {user['email']}")
            print(f"   WhatsApp: {user['whatsapp_number']}")
    else:
        print("❌ No se pudo actualizar")

asyncio.run(fix())
