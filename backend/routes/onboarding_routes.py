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
from passlib.context import CryptContext
from jose import jwt

ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db_instance = client[os.environ.get('DB_NAME', 'tiendadb')]

# Security
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production-tienda-app-2025')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 43200  # 30 días
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def get_database():
    return db_instance

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    from datetime import timedelta
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

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
    phone: str  # Teléfono / WhatsApp
    pin: str  # PIN de 4 dígitos
    role: Optional[str] = "employee"  # "owner" o "employee"

class OnboardingCompleteRequest(BaseModel):
    admin: AdminSignupRequest
    merchants: List[MerchantCreateRequest]
    clerks_per_merchant: dict  # {merchant_index: [ClerkCreateRequest]}

# Nuevos modelos para el flujo simplificado
class SearchStoresRequest(BaseModel):
    query: str

class JoinStoreRequest(BaseModel):
    merchant_id: str
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    pin: str
    role: str  # "owner" o "employee"

class SingleStoreOnboardingRequest(BaseModel):
    """Para el caso de 1 sola tienda (Admin = Merchant)"""
    store_name: str
    email: EmailStr
    password: str
    # Clerk data
    first_name: str
    last_name: str
    phone: str
    pin: str
    role: str  # "owner" o "employee"

class MultiStoreOnboardingRequest(BaseModel):
    """Para el caso de 2+ tiendas (Admin separado de Merchants)"""
    business_name: str  # Nombre del negocio (Admin)
    email: EmailStr
    password: str
    stores: List[MerchantCreateRequest]  # Lista de tiendas
    clerks_per_store: dict  # {store_index: [ClerkCreateRequest]}

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
            "whatsapp_number": clerk_data.phone,
            "role": clerk_data.role if hasattr(clerk_data, 'role') and clerk_data.role else "employee",  # owner o employee
            "created_at": datetime.utcnow(),
            "activated_at": datetime.utcnow(),
            "fully_activated_at": datetime.utcnow(),
        }
        
        result = await db.clerks.insert_one(clerk_doc)
        
        # Enviar PIN por email usando SendGrid
        try:
            from services.email_service import send_clerk_pin_email
            merchant = await db.merchants.find_one({"_id": ObjectId(merchant_id)})
            store_name = merchant.get("store_name", merchant.get("nombre", "Tu tienda"))
            
            send_clerk_pin_email(
                clerk_email=clerk_data.email,
                clerk_name=clerk_doc["full_name"],
                pin=clerk_data.pin,
                store_name=store_name
            )
            print(f"✅ PIN enviado por email a {clerk_data.email}")
        except Exception as e:
            print(f"⚠️ Error al enviar email a {clerk_data.email}: {str(e)}")
            print(f"[FALLBACK] PIN para {clerk_data.email}: {clerk_data.pin}")
        
        clerk_ids.append({
            "clerk_id": str(result.inserted_id),
            "name": clerk_doc["full_name"],
            "email": clerk_data.email,
            "phone": clerk_data.phone
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
            clerks_data = request.clerks_per_merchant.get(str(idx), [])
            
            if clerks_data:
                # Convertir dicts a ClerkCreateRequest objects
                clerks_for_merchant = [
                    ClerkCreateRequest(**clerk) if isinstance(clerk, dict) else clerk
                    for clerk in clerks_data
                ]
                clerks_response = await create_clerks_step3(merchant_id, clerks_for_merchant)
                all_clerks.extend(clerks_response["clerks"])
        
        # Marcar admin como fully activated
        await db.admins.update_one(
            {"_id": ObjectId(admin_id)},
            {"$set": {"fully_activated_at": datetime.utcnow()}}
        )
        
        # Enviar email de bienvenida al admin
        try:
            from services.email_service import send_welcome_admin_email
            send_welcome_admin_email(
                admin_email=request.admin.email,
                company_name=request.admin.company_name,
                num_stores=len(merchants_response["merchants"]),
                num_clerks=len(all_clerks)
            )
            print(f"✅ Email de bienvenida enviado a {request.admin.email}")
        except Exception as e:
            print(f"⚠️ Error al enviar email de bienvenida: {str(e)}")
        
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
    
    COMPATIBILIDAD: Si el merchant no tiene clerks (cuenta antigua),
    genera token directamente y permite login sin clerk selection.
    """
    db = await get_database()
    
    # Buscar merchant
    merchant = await db.merchants.find_one({"username": username})
    if not merchant or not verify_password(password, merchant["password"]):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    # Obtener clerks del merchant
    clerks_cursor = db.clerks.find({"merchant_id": str(merchant["_id"])})
    clerks = await clerks_cursor.to_list(length=100)
    
    # SI NO HAY CLERKS (cuenta antigua), generar token directamente
    if len(clerks) == 0:
        # Sistema antiguo - login directo sin clerks
        token = create_access_token(
            data={
                "admin_id": merchant.get("admin_id"),
                "merchant_id": str(merchant["_id"]),
                "username": merchant["username"]
            }
        )
        
        return {
            "success": True,
            "token": token,
            "legacy_account": True,
            "user": {
                "merchant_id": str(merchant["_id"]),
                "store_name": merchant.get("store_name", merchant.get("nombre")),
            },
            "message": "Login exitoso (cuenta antigua)"
        }
    
    # NUEVO SISTEMA - tiene clerks
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
        "legacy_account": False,
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


# ============================================
# NUEVO FLUJO SIMPLIFICADO DE REGISTRO
# ============================================

@router.get("/search-stores")
async def search_stores(query: str):
    """
    Buscar tiendas por nombre para unirse a una existente.
    Retorna lista de tiendas que coinciden con la búsqueda.
    """
    db = await get_database()
    
    if not query or len(query) < 2:
        return {"stores": []}
    
    # Buscar merchants que coincidan con el query (case-insensitive)
    stores = await db.merchants.find({
        "$or": [
            {"store_name": {"$regex": query, "$options": "i"}},
            {"nombre": {"$regex": query, "$options": "i"}}
        ],
        "activated_at": {"$ne": None}  # Solo tiendas activas
    }).to_list(20)
    
    result = []
    for store in stores:
        # Obtener info del admin para mostrar ubicación/contexto
        admin_info = None
        if store.get("admin_id"):
            admin = await db.admins.find_one({"_id": ObjectId(store["admin_id"])})
            if admin:
                admin_info = admin.get("company_name")
        
        result.append({
            "merchant_id": str(store["_id"]),
            "store_name": store.get("store_name", store.get("nombre", "Sin nombre")),
            "business_name": admin_info,  # Nombre del negocio padre (si aplica)
            "address": store.get("direccion", store.get("address")),
        })
    
    return {"stores": result}


@router.post("/join-store")
async def join_existing_store(request: JoinStoreRequest):
    """
    Unirse a una tienda existente como nuevo clerk.
    El usuario ya buscó y seleccionó la tienda.
    """
    db = await get_database()
    
    # Verificar que el merchant existe y está activo
    merchant = await db.merchants.find_one({
        "_id": ObjectId(request.merchant_id),
        "activated_at": {"$ne": None}
    })
    
    if not merchant:
        raise HTTPException(status_code=404, detail="Tienda no encontrada o inactiva")
    
    # Verificar que el email no esté ya registrado
    existing_clerk = await db.clerks.find_one({"email": request.email})
    if existing_clerk:
        raise HTTPException(status_code=400, detail="Este email ya está registrado")
    
    # Verificar PIN de 4 dígitos
    if len(request.pin) != 4 or not request.pin.isdigit():
        raise HTTPException(status_code=400, detail="El PIN debe ser de 4 dígitos numéricos")
    
    # Crear el clerk
    hashed_pin = get_password_hash(request.pin)
    
    clerk_doc = {
        "merchant_id": request.merchant_id,
        "email": request.email,
        "first_name": request.first_name,
        "last_name": request.last_name,
        "full_name": f"{request.first_name} {request.last_name}",
        "nombre": f"{request.first_name} {request.last_name}",
        "pin": hashed_pin,
        "whatsapp_number": request.phone,
        "role": request.role,  # "owner" o "employee"
        "created_at": datetime.utcnow(),
        "activated_at": datetime.utcnow(),
        "fully_activated_at": datetime.utcnow(),
    }
    
    result = await db.clerks.insert_one(clerk_doc)
    clerk_id = str(result.inserted_id)
    
    # Enviar PIN por correo
    try:
        from services.email_service import send_clerk_pin_email
        store_name = merchant.get("store_name", merchant.get("nombre", "Tu tienda"))
        send_clerk_pin_email(
            clerk_email=request.email,
            clerk_name=clerk_doc["full_name"],
            pin=request.pin,  # PIN sin hashear para el email
            store_name=store_name
        )
    except Exception as e:
        print(f"[FALLBACK] No se pudo enviar email. PIN para {request.email}: {request.pin}")
    
    # Generar token para login automático
    token = create_access_token(
        data={
            "admin_id": merchant.get("admin_id"),
            "merchant_id": request.merchant_id,
            "clerk_id": clerk_id,
            "username": merchant["username"]
        }
    )
    
    return {
        "success": True,
        "message": "Te has unido a la tienda exitosamente",
        "clerk_id": clerk_id,
        "token": token,
        "user": {
            "admin_id": merchant.get("admin_id"),
            "merchant_id": request.merchant_id,
            "clerk_id": clerk_id,
            "clerk_name": clerk_doc["full_name"],
            "store_name": merchant.get("store_name", merchant.get("nombre")),
            "role": request.role
        }
    }


@router.post("/register-single-store")
async def register_single_store(request: SingleStoreOnboardingRequest):
    """
    Registro simplificado para 1 sola tienda.
    Admin y Merchant tienen el mismo nombre.
    Crea: Admin + Merchant (mismo nombre) + Clerk (dueño o empleado)
    """
    db = await get_database()
    
    # Verificar email no duplicado
    existing_admin = await db.admins.find_one({"email": request.email})
    if existing_admin:
        raise HTTPException(status_code=400, detail="Este email ya está registrado como administrador")
    
    existing_clerk = await db.clerks.find_one({"email": request.email})
    if existing_clerk:
        raise HTTPException(status_code=400, detail="Este email ya está registrado como empleado")
    
    # Verificar PIN
    if len(request.pin) != 4 or not request.pin.isdigit():
        raise HTTPException(status_code=400, detail="El PIN debe ser de 4 dígitos numéricos")
    
    try:
        # 1. Crear Admin (con el nombre de la tienda)
        hashed_password = get_password_hash(request.password)
        
        admin_doc = {
            "company_name": request.store_name,  # Mismo nombre que la tienda
            "nombre": request.store_name,
            "email": request.email,
            "password": hashed_password,
            "num_stores": 1,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "activated_at": datetime.utcnow(),
            "fully_activated_at": datetime.utcnow(),
        }
        
        admin_result = await db.admins.insert_one(admin_doc)
        admin_id = str(admin_result.inserted_id)
        
        # 2. Crear Merchant (mismo nombre que admin)
        base_username = request.store_name.lower().replace(" ", "").replace(".", "")
        username = base_username
        counter = 1
        while await db.merchants.find_one({"username": username}):
            username = f"{base_username}{counter}"
            counter += 1
        
        merchant_doc = {
            "admin_id": admin_id,
            "username": username,
            "password": hashed_password,  # Misma contraseña que admin
            "store_name": request.store_name,
            "nombre": request.store_name,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "activated_at": datetime.utcnow(),
            "fully_activated_at": datetime.utcnow(),
        }
        
        merchant_result = await db.merchants.insert_one(merchant_doc)
        merchant_id = str(merchant_result.inserted_id)
        
        # 3. Crear Clerk
        hashed_pin = get_password_hash(request.pin)
        
        clerk_doc = {
            "merchant_id": merchant_id,
            "email": request.email,
            "first_name": request.first_name,
            "last_name": request.last_name,
            "full_name": f"{request.first_name} {request.last_name}",
            "nombre": f"{request.first_name} {request.last_name}",
            "pin": hashed_pin,
            "whatsapp_number": request.phone,
            "role": request.role,  # "owner" o "employee"
            "created_at": datetime.utcnow(),
            "activated_at": datetime.utcnow(),
            "fully_activated_at": datetime.utcnow(),
        }
        
        clerk_result = await db.clerks.insert_one(clerk_doc)
        clerk_id = str(clerk_result.inserted_id)
        
        # Enviar PIN por correo
        try:
            from services.email_service import send_clerk_pin_email
            send_clerk_pin_email(
                clerk_email=request.email,
                clerk_name=clerk_doc["full_name"],
                pin=request.pin,  # PIN sin hashear para el email
                store_name=request.store_name
            )
        except Exception as e:
            print(f"[FALLBACK] No se pudo enviar email. PIN para {request.email}: {request.pin}")
        
        # Generar token
        token = create_access_token(
            data={
                "admin_id": admin_id,
                "merchant_id": merchant_id,
                "clerk_id": clerk_id,
                "username": username
            }
        )
        
        return {
            "success": True,
            "message": "Registro completado exitosamente",
            "admin_id": admin_id,
            "merchant_id": merchant_id,
            "clerk_id": clerk_id,
            "username": username,
            "token": token,
            "user": {
                "admin_id": admin_id,
                "merchant_id": merchant_id,
                "clerk_id": clerk_id,
                "clerk_name": clerk_doc["full_name"],
                "store_name": request.store_name,
                "role": request.role
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en registro: {str(e)}")


@router.post("/register-multi-store")
async def register_multi_store(request: MultiStoreOnboardingRequest):
    """
    Registro para 2+ tiendas.
    Crea: Admin (negocio) + Merchants (tiendas) + Clerks
    """
    db = await get_database()
    
    # Verificar email no duplicado
    existing_admin = await db.admins.find_one({"email": request.email})
    if existing_admin:
        raise HTTPException(status_code=400, detail="Este email ya está registrado")
    
    try:
        # 1. Crear Admin (nombre del negocio)
        hashed_password = get_password_hash(request.password)
        
        admin_doc = {
            "company_name": request.business_name,
            "nombre": request.business_name,
            "email": request.email,
            "password": hashed_password,
            "num_stores": len(request.stores),
            "is_active": True,
            "created_at": datetime.utcnow(),
            "activated_at": datetime.utcnow(),
            "fully_activated_at": None,  # Se activa cuando complete el onboarding
        }
        
        admin_result = await db.admins.insert_one(admin_doc)
        admin_id = str(admin_result.inserted_id)
        
        # 2. Crear Merchants (tiendas)
        merchants_created = []
        for idx, store in enumerate(request.stores):
            base_username = store.store_name.lower().replace(" ", "").replace(".", "")
            username = base_username
            counter = 1
            while await db.merchants.find_one({"username": username}):
                username = f"{base_username}{counter}"
                counter += 1
            
            temp_password = f"{base_username}123"
            hashed_merchant_password = get_password_hash(temp_password)
            
            merchant_doc = {
                "admin_id": admin_id,
                "username": username,
                "password": hashed_merchant_password,
                "store_name": store.store_name,
                "nombre": store.store_name,
                "direccion": store.address,
                "telefono": store.phone,
                "is_active": True,
                "created_at": datetime.utcnow(),
                "activated_at": datetime.utcnow(),
                "fully_activated_at": None,
            }
            
            merchant_result = await db.merchants.insert_one(merchant_doc)
            merchant_id = str(merchant_result.inserted_id)
            
            merchants_created.append({
                "merchant_id": merchant_id,
                "store_name": store.store_name,
                "username": username,
                "temp_password": temp_password
            })
            
            # 3. Crear Clerks para este merchant
            clerks_data = request.clerks_per_store.get(str(idx), [])
            for clerk_data in clerks_data:
                if isinstance(clerk_data, dict):
                    # Verificar PIN
                    pin = clerk_data.get("pin", "")
                    if len(pin) != 4 or not pin.isdigit():
                        continue
                    
                    hashed_pin = get_password_hash(pin)
                    
                    clerk_doc = {
                        "merchant_id": merchant_id,
                        "email": clerk_data.get("email"),
                        "first_name": clerk_data.get("first_name"),
                        "last_name": clerk_data.get("last_name"),
                        "full_name": f"{clerk_data.get('first_name')} {clerk_data.get('last_name')}",
                        "nombre": f"{clerk_data.get('first_name')} {clerk_data.get('last_name')}",
                        "pin": hashed_pin,
                        "whatsapp_number": clerk_data.get("phone"),
                        "role": clerk_data.get("role", "employee"),
                        "created_at": datetime.utcnow(),
                        "activated_at": datetime.utcnow(),
                        "fully_activated_at": datetime.utcnow(),
                    }
                    
                    await db.clerks.insert_one(clerk_doc)
        
        # Marcar admin como fully activated
        await db.admins.update_one(
            {"_id": ObjectId(admin_id)},
            {"$set": {"fully_activated_at": datetime.utcnow()}}
        )
        
        # Generar token para el primer merchant
        first_merchant = merchants_created[0]
        token = create_access_token(
            data={
                "admin_id": admin_id,
                "merchant_id": first_merchant["merchant_id"],
                "username": first_merchant["username"]
            }
        )
        
        return {
            "success": True,
            "message": f"Registro completado: {len(merchants_created)} tiendas creadas",
            "admin_id": admin_id,
            "business_name": request.business_name,
            "merchants": merchants_created,
            "token": token
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en registro: {str(e)}")
