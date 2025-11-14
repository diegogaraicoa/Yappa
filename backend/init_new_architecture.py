#!/usr/bin/env python3
"""
Inicialización de la nueva arquitectura Admin → Merchant → Clerk
Este script:
1. Crea las nuevas colecciones necesarias
2. Crea índices para optimización
3. Verifica que todo esté listo
"""

import sys
sys.path.append('/app/backend')

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

async def init_new_architecture():
    print("🚀 Inicializando nueva arquitectura...")
    print("=" * 60)
    
    # Conectar a MongoDB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["test_database"]
    
    # ============================================
    # 1. CREAR COLECCIONES
    # ============================================
    
    collections_to_create = [
        "admins",
        "merchants", 
        "clerks",
        "event_logs",
        "kyb_data"
    ]
    
    print("\n📁 Creando colecciones...")
    existing_collections = await db.list_collection_names()
    
    for collection_name in collections_to_create:
        if collection_name not in existing_collections:
            await db.create_collection(collection_name)
            print(f"  ✅ Creada: {collection_name}")
        else:
            print(f"  ✓ Ya existe: {collection_name}")
    
    # ============================================
    # 2. CREAR ÍNDICES
    # ============================================
    
    print("\n🔍 Creando índices para optimización...")
    
    # Índices para Admins
    await db.admins.create_index("email", unique=True)
    print("  ✅ admins: email (unique)")
    
    # Índices para Merchants
    await db.merchants.create_index("admin_id")
    await db.merchants.create_index("username", unique=True)
    await db.merchants.create_index("activated_at")
    await db.merchants.create_index("fully_activated_at")
    print("  ✅ merchants: admin_id, username (unique), activated_at, fully_activated_at")
    
    # Índices para Clerks
    await db.clerks.create_index("merchant_id")
    await db.clerks.create_index("email", unique=True)
    await db.clerks.create_index("activated_at")
    await db.clerks.create_index("fully_activated_at")
    print("  ✅ clerks: merchant_id, email (unique), activated_at, fully_activated_at")
    
    # Índices para Event Logs
    await db.event_logs.create_index("merchant_id")
    await db.event_logs.create_index("clerk_id")
    await db.event_logs.create_index("section")
    await db.event_logs.create_index("timestamp")
    await db.event_logs.create_index([("merchant_id", 1), ("section", 1)])
    print("  ✅ event_logs: merchant_id, clerk_id, section, timestamp")
    
    # Índices para KYB Data
    await db.kyb_data.create_index("admin_id", unique=True)
    print("  ✅ kyb_data: admin_id (unique)")
    
    # ============================================
    # 3. VERIFICAR ESTRUCTURA
    # ============================================
    
    print("\n📊 Verificando estructura...")
    
    collections = {
        "admins": await db.admins.count_documents({}),
        "merchants": await db.merchants.count_documents({}),
        "clerks": await db.clerks.count_documents({}),
        "event_logs": await db.event_logs.count_documents({}),
        "kyb_data": await db.kyb_data.count_documents({}),
    }
    
    print("\nColecciones y documentos:")
    for name, count in collections.items():
        print(f"  • {name}: {count} documentos")
    
    # También verificar colecciones legacy
    legacy_collections = {
        "stores": await db.stores.count_documents({}) if "stores" in existing_collections else 0,
        "users": await db.users.count_documents({}) if "users" in existing_collections else 0,
    }
    
    print("\nColecciones legacy (para referencia):")
    for name, count in legacy_collections.items():
        print(f"  • {name}: {count} documentos")
    
    # ============================================
    # 4. RESUMEN
    # ============================================
    
    print("\n" + "=" * 60)
    print("✅ Inicialización completada!")
    print("=" * 60)
    print("\n📝 Próximos pasos:")
    print("  1. Los usuarios existentes necesitarán re-registro")
    print("  2. Implementar nuevos endpoints de auth")
    print("  3. Crear sistema de feature tracking")
    print("  4. Implementar Super Dashboard")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(init_new_architecture())
