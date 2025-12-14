"""
Yappa Data Models
Nueva arquitectura: Admin → Merchant → Clerk
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

# ============================================
# ADMIN (Compañía/Dueño)
# ============================================

class Admin(BaseModel):
    """
    Admin representa la compañía o dueño del negocio.
    Un Admin puede tener múltiples Merchants (tiendas físicas).
    """
    id: Optional[str] = Field(alias="_id")
    nombre: str
    email: str
    telefono: Optional[str] = None
    active: bool = True  # Control de acceso al sistema
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


class AdminCreate(BaseModel):
    nombre: str
    email: str
    telefono: Optional[str] = None
    active: Optional[bool] = True


# ============================================
# MERCHANT (Tienda Física)
# ============================================

class Merchant(BaseModel):
    """
    Merchant representa una tienda física.
    Pertenece a un Admin y tiene múltiples Clerks.
    """
    id: Optional[str] = Field(alias="_id")
    admin_id: str  # Link a Admin
    username: str  # Para login paso 1
    password: str  # Hashed
    nombre: str
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    
    # Activaciones
    created_at: datetime = Field(default_factory=datetime.utcnow)
    activated_at: Optional[datetime] = None  # Initial: cliente/proveedor/producto
    fully_activated_at: Optional[datetime] = None  # Full: primera venta
    
    # Status
    active: bool = True
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


class MerchantCreate(BaseModel):
    admin_id: str
    username: str
    password: str
    nombre: str
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    active: Optional[bool] = True


# ============================================
# CLERK (Empleado/Usuario)
# ============================================

class Clerk(BaseModel):
    """
    Clerk representa un empleado/usuario de una tienda.
    Pertenece a un Merchant.
    """
    id: Optional[str] = Field(alias="_id")
    merchant_id: str  # Link a Merchant
    email: str  # Para login paso 2
    password: str  # Hashed
    nombre: str
    whatsapp_number: Optional[str] = None
    role: str = "employee"  # "owner" o "employee"
    
    # Activaciones
    created_at: datetime = Field(default_factory=datetime.utcnow)
    activated_at: Optional[datetime] = None  # Initial: primer login + acción
    fully_activated_at: Optional[datetime] = None  # Full: primera venta registrada
    
    # Alertas y notificaciones
    alerts_enabled: bool = True
    stock_alerts_enabled: bool = True
    sales_summary_enabled: bool = True
    ai_insights_enabled: bool = True
    
    # Status
    active: bool = True
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


class ClerkCreate(BaseModel):
    merchant_id: str
    email: str
    password: str
    nombre: str
    whatsapp_number: Optional[str] = None
    active: Optional[bool] = True
    role: str = "employee"


# ============================================
# EVENT LOG (Feature Tracking)
# ============================================

class EventLog(BaseModel):
    """
    EventLog registra todas las acciones de usuarios.
    Para analytics de feature usage.
    """
    id: Optional[str] = Field(alias="_id")
    merchant_id: str
    clerk_id: str
    
    # Qué y dónde
    section: str  # sales, expenses, inventory, customers, suppliers, reports, etc.
    action: str  # view, create, edit, delete
    
    # Metadata opcional
    metadata: Optional[dict] = None
    
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


class EventLogCreate(BaseModel):
    merchant_id: str
    clerk_id: str
    section: str
    action: str
    metadata: Optional[dict] = None


# ============================================
# KYB DATA (Know Your Business)
# ============================================

class KYBData(BaseModel):
    """
    KYBData almacena información de KYB (Know Your Business) de cada Admin.
    Ingresada manualmente por el super admin.
    IMPORTANTE: Vinculado a Admin, no a Merchant.
    """
    id: Optional[str] = Field(alias="_id")
    admin_id: str  # Link a Admin (cambiado de merchant_id)
    
    # Información legal del negocio
    nombre_legal: str  # Nombre legal del negocio
    ruc_tax_id: str  # RUC / Tax ID
    direccion_fiscal: str  # Dirección fiscal completa
    telefono_contacto: str  # Teléfono de contacto
    email_oficial: str  # Email oficial
    
    # Representante legal
    representante_legal: str  # Nombre del representante legal
    documento_representante: Optional[str] = None  # Link al documento (opcional)
    
    # Metadata
    status: str = "pending"  # pending, approved, rejected
    notas: Optional[str] = None
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


class KYBDataCreate(BaseModel):
    admin_id: str  # Cambiado de merchant_id
    nombre_legal: str
    ruc_tax_id: str
    direccion_fiscal: str
    telefono_contacto: str
    email_oficial: str
    representante_legal: str
    documento_representante: Optional[str] = None
    notas: Optional[str] = None


class KYBDataUpdate(BaseModel):
    nombre_legal: Optional[str] = None
    ruc_tax_id: Optional[str] = None
    direccion_fiscal: Optional[str] = None
    telefono_contacto: Optional[str] = None
    email_oficial: Optional[str] = None
    representante_legal: Optional[str] = None
    documento_representante: Optional[str] = None
    status: Optional[str] = None
    notas: Optional[str] = None


# ============================================
# LEGACY MAPPING
# ============================================
# Para referencia durante migración:
# - stores → merchants
# - store_id → merchant_id
# - users → clerks
# - user_id → clerk_id
