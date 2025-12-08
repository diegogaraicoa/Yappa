"""
Auth Routes - Endpoints para el nuevo sistema de autenticación de 2 pasos
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import sys
sys.path.append('/app/backend')

from services.auth_service import (
    authenticate_merchant,
    authenticate_clerk,
    get_clerks_by_merchant,
    create_access_token,
    get_password_hash
)

router = APIRouter(prefix="/auth", tags=["authentication"])

# ============================================
# MODELS
# ============================================

class MerchantLoginRequest(BaseModel):
    username: str
    password: str


class ClerkLoginRequest(BaseModel):
    merchant_id: str
    email: str
    password: str


class MerchantRegisterRequest(BaseModel):
    admin_id: str
    username: str
    password: str
    nombre: str
    direccion: Optional[str] = None
    telefono: Optional[str] = None


class ClerkRegisterRequest(BaseModel):
    merchant_id: str
    email: str
    password: str
    nombre: str
    whatsapp_number: Optional[str] = None
    role: str = "employee"


# ============================================
# ENDPOINTS
# ============================================

@router.post("/merchant/login")
async def merchant_login(request: MerchantLoginRequest, db=None):
    """
    PASO 1: Login de Merchant
    
    Autentica merchant con username y password.
    Retorna token temporal y lista de clerks.
    """
    # Get db from app state (will be injected)
    from main import get_database
    db = get_database()
    
    # Autenticar merchant
    merchant = await authenticate_merchant(db, request.username, request.password)
    
    if not merchant:
        raise HTTPException(
            status_code=401,
            detail="Username o password incorrectos"
        )
    
    # Crear token temporal (solo con merchant_id)
    token_data = {
        "merchant_id": merchant["id"],
        "type": "merchant"
    }
    access_token = create_access_token(token_data)
    
    # Obtener lista de clerks
    clerks = await get_clerks_by_merchant(db, merchant["id"])
    
    if not clerks:
        raise HTTPException(
            status_code=404,
            detail="No hay clerks registrados para este merchant. Contacte al administrador."
        )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "merchant": merchant,
        "clerks": clerks,
        "next_step": "clerk_login"
    }


@router.post("/clerk/login")
async def clerk_login(request: ClerkLoginRequest):
    """
    PASO 2: Login de Clerk
    
    Autentica clerk con email y password.
    Retorna token final con merchant_id y clerk_id.
    """
    from main import get_database
    db = get_database()
    
    # Autenticar clerk
    clerk = await authenticate_clerk(db, request.merchant_id, request.email, request.password)
    
    if not clerk:
        raise HTTPException(
            status_code=401,
            detail="Email o password incorrectos"
        )
    
    # Crear token completo
    token_data = {
        "merchant_id": clerk["merchant_id"],
        "clerk_id": clerk["id"],
        "type": "clerk",
        "role": clerk["role"]
    }
    access_token = create_access_token(token_data)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "clerk": clerk,
        "message": "Login exitoso"
    }


@router.get("/merchant/{merchant_id}/clerks")
async def get_merchant_clerks(merchant_id: str):
    """
    Obtiene lista de clerks de un merchant.
    Útil para el dropdown en el paso 2.
    """
    from main import get_database
    db = get_database()
    
    clerks = await get_clerks_by_merchant(db, merchant_id)
    
    return {"clerks": clerks}


@router.post("/merchant/register")
async def register_merchant(request: MerchantRegisterRequest):
    """
    Registrar nuevo Merchant.
    Usado por super admin o durante onboarding.
    """
    from main import get_database
    db = get_database()
    from bson import ObjectId
    from datetime import datetime
    
    # Verificar que username no exista
    existing = await db.merchants.find_one({"username": request.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username ya existe")
    
    # Verificar que admin_id exista
    admin = await db.admins.find_one({"_id": ObjectId(request.admin_id)})
    if not admin:
        raise HTTPException(status_code=404, detail="Admin no encontrado")
    
    # Crear merchant
    merchant_data = {
        "admin_id": request.admin_id,
        "username": request.username,
        "password": get_password_hash(request.password),
        "nombre": request.nombre,
        "direccion": request.direccion,
        "telefono": request.telefono,
        "created_at": datetime.utcnow(),
        "activated_at": None,
        "fully_activated_at": None,
        "active": True
    }
    
    result = await db.merchants.insert_one(merchant_data)
    
    return {
        "message": "Merchant creado exitosamente",
        "merchant_id": str(result.inserted_id)
    }


@router.post("/clerk/register")
async def register_clerk(request: ClerkRegisterRequest):
    """
    Registrar nuevo Clerk.
    Usado por merchant owner o super admin.
    """
    from main import get_database
    db = get_database()
    from bson import ObjectId
    from datetime import datetime
    
    # Verificar que email no exista
    existing = await db.clerks.find_one({"email": request.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email ya está registrado")
    
    # Verificar que merchant_id exista
    merchant = await db.merchants.find_one({"_id": ObjectId(request.merchant_id)})
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant no encontrado")
    
    # Crear clerk
    clerk_data = {
        "merchant_id": request.merchant_id,
        "email": request.email,
        "password": get_password_hash(request.password),
        "nombre": request.nombre,
        "whatsapp_number": request.whatsapp_number,
        "role": request.role,
        "created_at": datetime.utcnow(),
        "activated_at": None,
        "fully_activated_at": None,
        "alerts_enabled": True,
        "stock_alerts_enabled": True,
        "sales_summary_enabled": True,
        "ai_insights_enabled": True,
        "active": True
    }
    
    result = await db.clerks.insert_one(clerk_data)
    
    return {
        "message": "Clerk creado exitosamente",
        "clerk_id": str(result.inserted_id)
    }


# ============================================
# SUPER ADMIN LOGIN (para Super Dashboard)
# ============================================

class AdminLoginRequest(BaseModel):
    email: str
    password: str


@router.post("/admin/login")
async def admin_login(request: AdminLoginRequest):
    """
    Login de Admin para acceder al Super Dashboard.
    
    Por ahora usa credenciales hardcodeadas.
    En producción, debería autenticar contra la tabla de admins.
    """
    from main import get_database
    db = get_database()
    
    # OPCIÓN 1: Credenciales hardcodeadas (rápido para MVP)
    # Cambiar estas credenciales antes de producción
    ADMIN_EMAIL = "admin@streetbiz.com"
    ADMIN_PASSWORD = "SuperAdmin2025!"
    
    if request.email == ADMIN_EMAIL and request.password == ADMIN_PASSWORD:
        # Crear token
        token_data = {
            "email": request.email,
            "type": "super_admin"
        }
        access_token = create_access_token(token_data)
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "admin": {
                "email": request.email,
                "nombre": "Super Admin"
            }
        }
    
    # OPCIÓN 2: Autenticar contra DB (comentado por ahora)
    # from services.auth_service import verify_password
    # admin = await db.admins.find_one({"email": request.email})
    # if not admin:
    #     raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    # if not verify_password(request.password, admin.get("password", "")):
    #     raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    raise HTTPException(
        status_code=401,
        detail="Credenciales incorrectas"
    )



# ============================================
# PASSWORD RECOVERY
# ============================================

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """
    Envía email con link para resetear contraseña
    """
    from motor.motor_asyncio import AsyncIOMotorClient
    import os
    from dotenv import load_dotenv
    from pathlib import Path
    import secrets
    from datetime import datetime, timedelta
    
    ROOT_DIR = Path(__file__).parent.parent
    load_dotenv(ROOT_DIR / '.env')
    
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'tiendadb')]
    
    # Buscar si es admin o merchant
    admin = await db.admins.find_one({"email": request.email})
    merchant = await db.merchants.find_one({"email": request.email}) if not admin else None
    
    if not admin and not merchant:
        # Por seguridad, no revelamos si el email existe o no
        return {
            "success": True,
            "message": "Si el email existe, recibirás un link para resetear tu contraseña"
        }
    
    # Generar token único
    reset_token = secrets.token_urlsafe(32)
    expiry = datetime.utcnow() + timedelta(hours=1)
    
    # Guardar token en la base de datos
    if admin:
        await db.admins.update_one(
            {"_id": admin["_id"]},
            {"$set": {
                "reset_token": reset_token,
                "reset_token_expiry": expiry
            }}
        )
        user_name = admin.get("company_name", "Usuario")
    else:
        await db.merchants.update_one(
            {"_id": merchant["_id"]},
            {"$set": {
                "reset_token": reset_token,
                "reset_token_expiry": expiry
            }}
        )
        user_name = merchant.get("store_name", merchant.get("nombre", "Usuario"))
    
    # Enviar email
    try:
        from services.email_service import send_password_reset_email
        send_password_reset_email(request.email, reset_token, user_name)
        print(f"✅ Email de recuperación enviado a {request.email}")
    except Exception as e:
        print(f"⚠️ Error al enviar email: {str(e)}")
        # No fallar el request por error de email
    
    return {
        "success": True,
        "message": "Si el email existe, recibirás un link para resetear tu contraseña"
    }


@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    """
    Resetea la contraseña usando el token enviado por email
    """
    from motor.motor_asyncio import AsyncIOMotorClient
    import os
    from dotenv import load_dotenv
    from pathlib import Path
    from datetime import datetime
    
    ROOT_DIR = Path(__file__).parent.parent
    load_dotenv(ROOT_DIR / '.env')
    
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ.get('DB_NAME', 'tiendadb')]
    
    # Buscar token en admins o merchants
    admin = await db.admins.find_one({
        "reset_token": request.token,
        "reset_token_expiry": {"$gt": datetime.utcnow()}
    })
    
    merchant = await db.merchants.find_one({
        "reset_token": request.token,
        "reset_token_expiry": {"$gt": datetime.utcnow()}
    }) if not admin else None
    
    if not admin and not merchant:
        raise HTTPException(status_code=400, detail="Token inválido o expirado")
    
    # Validar nueva contraseña
    if len(request.new_password) < 6:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 6 caracteres")
    
    # Hashear nueva contraseña
    new_password_hash = get_password_hash(request.new_password)
    
    # Actualizar contraseña y eliminar token
    if admin:
        await db.admins.update_one(
            {"_id": admin["_id"]},
            {"$set": {
                "password": new_password_hash,
                "reset_token": None,
                "reset_token_expiry": None,
                "updated_at": datetime.utcnow()
            }}
        )
    else:
        await db.merchants.update_one(
            {"_id": merchant["_id"]},
            {"$set": {
                "password": new_password_hash,
                "reset_token": None,
                "reset_token_expiry": None,
                "updated_at": datetime.utcnow()
            }}
        )
    
    return {
        "success": True,
        "message": "Contraseña actualizada exitosamente"
    }

