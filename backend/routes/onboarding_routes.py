"""
Onboarding Routes - Nuevo flujo de registro completo
Admin → Merchants → Clerks
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
import sys
import os
sys.path.append('/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db_instance = client[os.environ.get('DB_NAME', 'tiendadb')]

async def get_database():
    return db_instance

router = APIRouter(prefix="/onboarding", tags=["onboarding"])

# ============================================
# MODELS
# ============================================

class AdminSignupRequest(BaseModel):
    company_name: str  # Nombre de la compañía
    email: EmailStr
    password: str
    num_stores: int  # Cuántas tiendas tiene

class MerchantCreateRequest(BaseModel):
    store_name: str  # Nombre del local/tienda
    address: Optional[str] = None
    phone: Optional[str] = None

class ClerkCreateRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    pin: str  # PIN de 4 dígitos

class OnboardingCompleteRequest(BaseModel):
    admin: AdminSignupRequest
    merchants: List[MerchantCreateRequest]
    clerks_per_merchant: dict  # {merchant_index: [ClerkCreateRequest]}

# ============================================
# STEP 1: Create Admin
# ============================================

@router.post("/step1-admin")
async def create_admin_step1(request: AdminSignupRequest):
    """
    Paso 1: Crear Admin (compañía)
    """
    db = await get_database()
    
    # Verificar si ya existe el email
    existing = await db.admins.find_one({"email": request.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email ya está registrado")
    
    # Crear admin
    hashed_password = get_password_hash(request.password)
    
    admin_doc = {
        "company_name": request.company_name,
        "email": request.email,
        "password": hashed_password,
        "num_stores": request.num_stores,
        "created_at": datetime.utcnow(),
        "activated_at": datetime.utcnow(),
        "fully_activated_at": None,  # Se activa cuando completa onboarding
    }
    
    result = await db.admins.insert_one(admin_doc)
    admin_id = str(result.inserted_id)
    
    return {
        "success": True,
        "admin_id": admin_id,
        "message": "Admin creado exitosamente",
        "next_step": "create_merchants"
    }

# ============================================
# STEP 2: Create Merchants
# ============================================

@router.post("/step2-merchants/{admin_id}")
async def create_merchants_step2(admin_id: str, merchants: List[MerchantCreateRequest]):
    """
    Paso 2: Crear Merchants (tiendas)
    """
    db = await get_database()
    
    # Verificar que el admin existe
    admin = await db.admins.find_one({"_id": ObjectId(admin_id)})
    if not admin:
        raise HTTPException(status_code=404, detail="Admin no encontrado")
    
    merchant_ids = []
    
    for merchant_data in merchants:
        # Generar username único
        base_username = merchant_data.store_name.lower().replace(" ", "")
        username = base_username
        counter = 1
        
        # Asegurar que el username sea único
        while await db.merchants.find_one({"username": username}):
            username = f"{base_username}{counter}"
            counter += 1
        
        # Generar password temporal (puede ser cambiado después)
        temp_password = f"{base_username}123"
        hashed_password = get_password_hash(temp_password)
        
        merchant_doc = {
            "admin_id": admin_id,
            "username": username,
            "password": hashed_password,
            "store_name": merchant_data.store_name,
            "nombre": merchant_data.store_name,  # Mantener compatibilidad
            "direccion": merchant_data.address,
            "telefono": merchant_data.phone,
            "created_at": datetime.utcnow(),
            "activated_at": datetime.utcnow(),
            "fully_activated_at": None,
        }
        
        result = await db.merchants.insert_one(merchant_doc)
        merchant_ids.append({
            "merchant_id": str(result.inserted_id),
            "store_name": merchant_data.store_name,
            "username": username,
            "temp_password": temp_password
        })
    
    return {
        "success": True,
        "merchants": merchant_ids,
        "message": f"{len(merchant_ids)} merchants creados",
        "next_step": "create_clerks"
    }

# ============================================
# STEP 3: Create Clerks
# ============================================

@router.post("/step3-clerks/{merchant_id}")
async def create_clerks_step3(merchant_id: str, clerks: List[ClerkCreateRequest]):
    """
    Paso 3: Crear Clerks (empleados) para un merchant
    """
    db = await get_database()
    
    # Verificar que el merchant existe
    merchant = await db.merchants.find_one({"_id": ObjectId(merchant_id)})
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant no encontrado")
    
    clerk_ids = []
    
    for clerk_data in clerks:
        # Verificar que el PIN sea de 4 dígitos
        if len(clerk_data.pin) != 4 or not clerk_data.pin.isdigit():
            raise HTTPException(status_code=400, detail="PIN debe ser de 4 dígitos numéricos")
        
        # Verificar email único
        existing = await db.clerks.find_one({"email": clerk_data.email})
        if existing:
            raise HTTPException(status_code=400, detail=f"Email {clerk_data.email} ya está registrado")
        
        # Hash del PIN
        hashed_pin = get_password_hash(clerk_data.pin)
        
        clerk_doc = {
            "merchant_id": merchant_id,
            "email": clerk_data.email,
            "first_name": clerk_data.first_name,
            "last_name": clerk_data.last_name,
            "full_name": f"{clerk_data.first_name} {clerk_data.last_name}",
            "nombre": f"{clerk_data.first_name} {clerk_data.last_name}",  # Compatibilidad
            "pin": hashed_pin,
            "whatsapp_number": None,
            "created_at": datetime.utcnow(),
            "activated_at": datetime.utcnow(),
            "fully_activated_at": datetime.utcnow(),
        }
        
        result = await db.clerks.insert_one(clerk_doc)
        clerk_ids.append({
            "clerk_id": str(result.inserted_id),
            "name": clerk_doc["full_name"],
            "email": clerk_data.email
        })
    
    return {
        "success": True,
        "clerks": clerk_ids,
        "message": f"{len(clerk_ids)} clerks creados para merchant",
    }

# ============================================
# COMPLETE ONBOARDING: Todo en un endpoint
# ============================================

@router.post("/complete")
async def complete_onboarding(request: OnboardingCompleteRequest):
    """
    Onboarding completo en un solo request
    Crea Admin → Merchants → Clerks
    """
    db = await get_database()
    
    try:
        # Step 1: Create Admin
        admin_response = await create_admin_step1(request.admin)
        admin_id = admin_response["admin_id"]
        
        # Step 2: Create Merchants
        merchants_response = await create_merchants_step2(admin_id, request.merchants)
        
        # Step 3: Create Clerks for each merchant
        all_clerks = []
        for idx, merchant_info in enumerate(merchants_response["merchants"]):
            merchant_id = merchant_info["merchant_id"]
            
            # Obtener clerks para este merchant
            clerks_for_merchant = request.clerks_per_merchant.get(str(idx), [])
            
            if clerks_for_merchant:
                clerks_response = await create_clerks_step3(merchant_id, clerks_for_merchant)
                all_clerks.extend(clerks_response["clerks"])
        
        # Marcar admin como fully activated
        await db.admins.update_one(
            {"_id": ObjectId(admin_id)},
            {"$set": {"fully_activated_at": datetime.utcnow()}}
        )
        
        # Generar token para el primer merchant
        first_merchant = merchants_response["merchants"][0]
        token = create_access_token(
            data={
                "admin_id": admin_id,
                "merchant_id": first_merchant["merchant_id"],
                "username": first_merchant["username"]
            }
        )
        
        return {
            "success": True,
            "message": "Onboarding completado exitosamente",
            "admin_id": admin_id,
            "company_name": request.admin.company_name,
            "merchants": merchants_response["merchants"],
            "total_clerks": len(all_clerks),
            "token": token,
            "redirect_to": "clerk_selection"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en onboarding: {str(e)}")

# ============================================
# LOGIN: Nuevo flujo con Clerks
# ============================================

@router.post("/login/step1")
async def login_step1_merchant(username: str, password: str):
    """
    Login Paso 1: Validar credenciales del Merchant
    Retorna lista de clerks disponibles
    """
    db = await get_database()
    
    from services.auth_service import verify_password
    
    # Buscar merchant
    merchant = await db.merchants.find_one({"username": username})
    if not merchant or not verify_password(password, merchant["password"]):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    # Obtener clerks del merchant
    clerks_cursor = db.clerks.find({"merchant_id": str(merchant["_id"])})
    clerks = await clerks_cursor.to_list(length=100)
    
    clerk_list = [
        {
            "clerk_id": str(clerk["_id"]),
            "name": clerk.get("full_name", clerk.get("nombre", "Sin nombre")),
            "email": clerk["email"]
        }
        for clerk in clerks
    ]
    
    return {
        "success": True,
        "merchant_id": str(merchant["_id"]),
        "store_name": merchant.get("store_name", merchant.get("nombre")),
        "clerks": clerk_list,
        "next_step": "select_clerk_and_pin"
    }

@router.post("/login/step2")
async def login_step2_clerk(merchant_id: str, clerk_id: str, pin: str):
    """
    Login Paso 2: Validar PIN del Clerk seleccionado
    Retorna token de acceso completo
    """
    db = await get_database()
    
    from services.auth_service import verify_password
    
    # Buscar clerk
    clerk = await db.clerks.find_one({"_id": ObjectId(clerk_id), "merchant_id": merchant_id})
    if not clerk:
        raise HTTPException(status_code=404, detail="Clerk no encontrado")
    
    # Verificar PIN
    if not verify_password(pin, clerk["pin"]):
        raise HTTPException(status_code=401, detail="PIN incorrecto")
    
    # Obtener merchant y admin
    merchant = await db.merchants.find_one({"_id": ObjectId(merchant_id)})
    
    # Generar token
    token = create_access_token(
        data={
            "admin_id": merchant.get("admin_id"),
            "merchant_id": merchant_id,
            "clerk_id": clerk_id,
            "username": merchant["username"]
        }
    )
    
    return {
        "success": True,
        "token": token,
        "user": {
            "admin_id": merchant.get("admin_id"),
            "merchant_id": merchant_id,
            "clerk_id": clerk_id,
            "clerk_name": clerk.get("full_name", clerk.get("nombre")),
            "store_name": merchant.get("store_name", merchant.get("nombre")),
        }
    }
