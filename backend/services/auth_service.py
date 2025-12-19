"""
Auth Service - Nuevo sistema de autenticación de 2 pasos
Paso 1: Merchant Login (username + password)
Paso 2: Clerk Login (email + password)
"""

from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import JWTError, jwt
from typing import Optional, Dict
import os

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Configuration
SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 días


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica una contraseña contra su hash"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Genera hash de una contraseña"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Crea un JWT token con la información proporcionada.
    
    Para Merchant (Paso 1):
        data = {"merchant_id": "xxx", "type": "merchant"}
    
    Para Clerk (Paso 2):
        data = {"merchant_id": "xxx", "clerk_id": "yyy", "type": "clerk"}
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt


def decode_access_token(token: str) -> Optional[Dict]:
    """
    Decodifica un JWT token y retorna su payload.
    Retorna None si el token es inválido o expiró.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


async def authenticate_merchant(db, username: str, password: str) -> Optional[Dict]:
    """
    PASO 1: Autenticar Merchant
    
    Args:
        db: Database connection
        username: Username del merchant
        password: Password del merchant
    
    Returns:
        Dict con info del merchant si auth exitoso, None si falla
    """
    merchant = await db.merchants.find_one({
        "username": username
    })
    
    if not merchant:
        return None
    
    # Verificar si el merchant está desactivado (activated_at es None)
    if merchant.get("activated_at") is None:
        return None
    
    if not verify_password(password, merchant["password"]):
        return None
    
    # Retornar info del merchant (sin password)
    merchant_data = {
        "id": str(merchant["_id"]),
        "admin_id": merchant["admin_id"],
        "username": merchant["username"],
        "nombre": merchant["nombre"],
        "activated_at": merchant.get("activated_at"),
        "fully_activated_at": merchant.get("fully_activated_at")
    }
    
    return merchant_data


async def authenticate_clerk(db, merchant_id: str, email: str, password: str) -> Optional[Dict]:
    """
    PASO 2: Autenticar Clerk
    
    Args:
        db: Database connection
        merchant_id: ID del merchant (del paso 1)
        email: Email del clerk
        password: Password del clerk
    
    Returns:
        Dict con info del clerk si auth exitoso, None si falla
    """
    clerk = await db.clerks.find_one({
        "merchant_id": merchant_id,
        "email": email
    })
    
    if not clerk:
        return None
    
    # Verificar si el clerk está desactivado (activated_at es None)
    if clerk.get("activated_at") is None:
        return None
    
    if not verify_password(password, clerk["password"]):
        return None
    
    # Actualizar last_login
    await db.clerks.update_one(
        {"_id": clerk["_id"]},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    
    # Retornar info del clerk (sin password)
    clerk_data = {
        "id": str(clerk["_id"]),
        "merchant_id": clerk["merchant_id"],
        "email": clerk["email"],
        "nombre": clerk["nombre"],
        "whatsapp_number": clerk.get("whatsapp_number"),
        "role": clerk["role"],
        "activated_at": clerk.get("activated_at"),
        "fully_activated_at": clerk.get("fully_activated_at")
    }
    
    return clerk_data


async def get_clerks_by_merchant(db, merchant_id: str) -> list:
    """
    Obtiene lista de clerks de un merchant.
    Para mostrar en el dropdown del paso 2.
    Solo muestra clerks activos (con activated_at no nulo).
    
    Args:
        db: Database connection
        merchant_id: ID del merchant
    
    Returns:
        Lista de clerks con info básica
    """
    clerks = await db.clerks.find({
        "merchant_id": merchant_id,
        "activated_at": {"$ne": None}
    }).to_list(100)
    
    # Retornar solo info necesaria para el dropdown
    clerks_list = []
    for clerk in clerks:
        clerks_list.append({
            "id": str(clerk["_id"]),
            "nombre": clerk["nombre"],
            "email": clerk["email"],
            "role": clerk["role"]
        })
    
    return clerks_list


async def check_and_activate_clerk(db, clerk_id: str, action: str = "login"):
    """
    Verifica y activa clerk si cumple condiciones.
    
    Initial Activation: Primer login + cualquier acción
    Full Activation: Primera venta registrada
    
    Args:
        db: Database connection
        clerk_id: ID del clerk
        action: Tipo de acción (login, sale, expense, etc.)
    """
    clerk = await db.clerks.find_one({"_id": clerk_id})
    
    if not clerk:
        return
    
    # Initial Activation: Si ya hizo login y está haciendo una acción
    if action != "login" and not clerk.get("activated_at"):
        await db.clerks.update_one(
            {"_id": clerk_id},
            {"$set": {"activated_at": datetime.utcnow()}}
        )
        print(f"✅ Clerk {clerk_id} initial activation!")
    
    # Full Activation: Primera venta
    if action == "sale" and not clerk.get("fully_activated_at"):
        await db.clerks.update_one(
            {"_id": clerk_id},
            {"$set": {"fully_activated_at": datetime.utcnow()}}
        )
        print(f"✅ Clerk {clerk_id} full activation!")


async def check_and_activate_merchant(db, merchant_id: str, action: str):
    """
    Verifica y activa merchant si cumple condiciones.
    
    Initial Activation: Registra cliente/proveedor/producto
    Full Activation: Primera venta
    
    Args:
        db: Database connection
        merchant_id: ID del merchant
        action: Tipo de acción (customer, supplier, product, sale)
    """
    merchant = await db.merchants.find_one({"_id": merchant_id})
    
    if not merchant:
        return
    
    # Initial Activation
    if action in ["customer", "supplier", "product"] and not merchant.get("activated_at"):
        await db.merchants.update_one(
            {"_id": merchant_id},
            {"$set": {"activated_at": datetime.utcnow()}}
        )
        print(f"✅ Merchant {merchant_id} initial activation!")
    
    # Full Activation
    if action == "sale" and not merchant.get("fully_activated_at"):
        await db.merchants.update_one(
            {"_id": merchant_id},
            {"$set": {"fully_activated_at": datetime.utcnow()}}
        )
        print(f"✅ Merchant {merchant_id} full activation!")
