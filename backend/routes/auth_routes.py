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
