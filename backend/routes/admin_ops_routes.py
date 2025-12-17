"""
Admin Ops Routes - CRUD completo para gestión de Admin/Merchant/Clerk/KYB
Este módulo implementa todos los endpoints necesarios para la nueva UI de Admin Ops
con acordeones para gestión completa de la jerarquía.
"""

from fastapi import APIRouter, HTTPException
from datetime import datetime
from typing import Optional
import sys
sys.path.append('/app/backend')

from models import AdminCreate, MerchantCreate, ClerkCreate, KYBDataCreate, KYBDataUpdate
from bson import ObjectId

router = APIRouter(prefix="/admin_ops", tags=["admin-ops"])


# ============================================
# CRUD ADMINS
# ============================================

@router.post("/admins")
async def create_admin(admin_data: AdminCreate):
    """
    Crear un nuevo Admin.
    """
    from main import get_database
    db = get_database()
    
    try:
        # Verificar que no exista admin con el mismo email
        existing = await db.admins.find_one({"email": admin_data.email})
        if existing:
            raise HTTPException(status_code=400, detail="Ya existe un admin con este email")
        
        admin_dict = admin_data.model_dump()
        admin_dict["created_at"] = datetime.utcnow()
        
        result = await db.admins.insert_one(admin_dict)
        
        return {
            "message": "Admin creado exitosamente",
            "admin_id": str(result.inserted_id)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/admins")
async def get_all_admins():
    """
    Listar todos los admins con información de merchants asociados.
    """
    from main import get_database
    db = get_database()
    
    try:
        admins = await db.admins.find({}).to_list(1000)
        
        admins_list = []
        for admin in admins:
            admin_id = str(admin["_id"])
            
            # Contar merchants y clerks asociados
            merchants_count = await db.merchants.count_documents({"admin_id": admin_id})
            
            # Contar clerks de todos los merchants del admin
            merchant_ids = await db.merchants.distinct("_id", {"admin_id": admin_id})
            clerks_count = await db.clerks.count_documents({
                "merchant_id": {"$in": [str(mid) for mid in merchant_ids]}
            })
            
            # Verificar si tiene KYB data
            kyb_data = await db.kyb_data.find_one({"admin_id": admin_id})
            
            admins_list.append({
                "id": admin_id,
                "nombre": admin.get("nombre", "N/A"),
                "email": admin.get("email", "N/A"),
                "telefono": admin.get("telefono", "N/A"),
                "active": admin.get("active", True),  # Default True para registros antiguos
                "created_at": admin.get("created_at"),
                "merchants_count": merchants_count,
                "clerks_count": clerks_count,
                "has_kyb": kyb_data is not None,
                "kyb_status": kyb_data.get("status") if kyb_data else None
            })
        
        # Ordenar por fecha de creación descendente
        admins_list.sort(key=lambda x: x["created_at"] or datetime.min, reverse=True)
        
        return {
            "count": len(admins_list),
            "admins": admins_list
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/admins/{admin_id}")
async def get_admin(admin_id: str):
    """
    Obtener información detallada de un admin específico.
    """
    from main import get_database
    db = get_database()
    
    try:
        admin = await db.admins.find_one({"_id": ObjectId(admin_id)})
        
        if not admin:
            raise HTTPException(status_code=404, detail="Admin no encontrado")
        
        # Obtener merchants del admin
        merchants = await db.merchants.find({"admin_id": admin_id}).to_list(1000)
        
        # Obtener KYB data
        kyb_data = await db.kyb_data.find_one({"admin_id": admin_id})
        
        return {
            "id": str(admin["_id"]),
            "nombre": admin.get("nombre", "N/A"),
            "email": admin.get("email", "N/A"),
            "telefono": admin.get("telefono", "N/A"),
            "created_at": admin.get("created_at"),
            "merchants": [
                {
                    "id": str(m["_id"]),
                    "nombre": m.get("nombre", "N/A"),
                    "username": m.get("username", "N/A")
                }
                for m in merchants
            ],
            "kyb_data": {
                "id": str(kyb_data["_id"]),
                "nombre_legal": kyb_data.get("nombre_legal"),
                "ruc_tax_id": kyb_data.get("ruc_tax_id"),
                "status": kyb_data.get("status")
            } if kyb_data else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/admins/{admin_id}")
async def update_admin(admin_id: str, admin_data: AdminCreate):
    """
    Actualizar información de un admin.
    """
    from main import get_database
    db = get_database()
    
    try:
        # Verificar que el admin existe
        existing = await db.admins.find_one({"_id": ObjectId(admin_id)})
        if not existing:
            raise HTTPException(status_code=404, detail="Admin no encontrado")
        
        # Verificar que no se duplique el email (si cambió)
        if admin_data.email != existing.get("email"):
            duplicate = await db.admins.find_one({"email": admin_data.email})
            if duplicate:
                raise HTTPException(status_code=400, detail="Ya existe un admin con este email")
        
        update_dict = admin_data.model_dump()
        
        await db.admins.update_one(
            {"_id": ObjectId(admin_id)},
            {"$set": update_dict}
        )
        
        return {"message": "Admin actualizado exitosamente"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/admins/{admin_id}")
async def delete_admin(admin_id: str):
    """
    Eliminar un admin.
    VALIDACIÓN: No permite eliminar si tiene merchants asociados.
    """
    from main import get_database
    db = get_database()
    
    try:
        # Verificar que existe
        admin = await db.admins.find_one({"_id": ObjectId(admin_id)})
        if not admin:
            raise HTTPException(status_code=404, detail="Admin no encontrado")
        
        # Verificar que no tiene merchants
        merchants_count = await db.merchants.count_documents({"admin_id": admin_id})
        if merchants_count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"No se puede eliminar: el admin tiene {merchants_count} merchant(s) asociado(s). Elimine primero los merchants."
            )
        
        # Eliminar KYB data si existe
        await db.kyb_data.delete_many({"admin_id": admin_id})
        
        # Eliminar admin
        await db.admins.delete_one({"_id": ObjectId(admin_id)})
        
        return {"message": "Admin eliminado exitosamente"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# CRUD MERCHANTS
# ============================================

@router.post("/merchants")
async def create_merchant(merchant_data: MerchantCreate):
    """
    Crear un nuevo Merchant.
    VALIDACIÓN: Requiere un admin_id válido.
    """
    from main import get_database
    from passlib.context import CryptContext
    
    db = get_database()
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    try:
        # Verificar que el admin existe
        admin = await db.admins.find_one({"_id": ObjectId(merchant_data.admin_id)})
        if not admin:
            raise HTTPException(status_code=404, detail="Admin no encontrado")
        
        # Verificar que no exista merchant con el mismo username
        existing = await db.merchants.find_one({"username": merchant_data.username})
        if existing:
            raise HTTPException(status_code=400, detail="Ya existe un merchant con este username")
        
        merchant_dict = merchant_data.model_dump()
        
        # Hash password
        merchant_dict["password"] = pwd_context.hash(merchant_dict["password"])
        
        # Timestamps
        merchant_dict["created_at"] = datetime.utcnow()
        merchant_dict["activated_at"] = None
        merchant_dict["fully_activated_at"] = None
        merchant_dict["active"] = True
        
        result = await db.merchants.insert_one(merchant_dict)
        
        return {
            "message": "Merchant creado exitosamente",
            "merchant_id": str(result.inserted_id)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/merchants")
async def get_all_merchants():
    """
    Listar todos los merchants con información de admin y clerks.
    """
    from main import get_database
    db = get_database()
    
    try:
        merchants = await db.merchants.find({}).to_list(1000)
        
        merchants_list = []
        for merchant in merchants:
            merchant_id = str(merchant["_id"])
            
            # Obtener admin info
            admin = None
            if merchant.get("admin_id"):
                admin = await db.admins.find_one({"_id": ObjectId(merchant["admin_id"])})
            
            # Contar clerks
            clerks_count = await db.clerks.count_documents({"merchant_id": merchant_id})
            
            merchants_list.append({
                "id": merchant_id,
                "nombre": merchant.get("nombre", "N/A"),
                "username": merchant.get("username", "N/A"),
                "direccion": merchant.get("direccion", "N/A"),
                "telefono": merchant.get("telefono", "N/A"),
                "admin_id": merchant.get("admin_id"),
                "admin_nombre": admin.get("nombre", "N/A") if admin else "N/A",
                "admin_email": admin.get("email", "N/A") if admin else "N/A",
                "created_at": merchant.get("created_at"),
                "activated_at": merchant.get("activated_at"),
                "fully_activated_at": merchant.get("fully_activated_at"),
                "active": merchant.get("active", True),
                "clerks_count": clerks_count
            })
        
        # Ordenar por fecha de creación descendente
        merchants_list.sort(key=lambda x: x["created_at"] or datetime.min, reverse=True)
        
        return {
            "count": len(merchants_list),
            "merchants": merchants_list
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/merchants/{merchant_id}")
async def get_merchant(merchant_id: str):
    """
    Obtener información detallada de un merchant específico.
    """
    from main import get_database
    db = get_database()
    
    try:
        merchant = await db.merchants.find_one({"_id": ObjectId(merchant_id)})
        
        if not merchant:
            raise HTTPException(status_code=404, detail="Merchant no encontrado")
        
        # Obtener admin info
        admin = None
        if merchant.get("admin_id"):
            admin = await db.admins.find_one({"_id": ObjectId(merchant["admin_id"])})
        
        # Obtener clerks del merchant
        clerks = await db.clerks.find({"merchant_id": merchant_id}).to_list(1000)
        
        return {
            "id": str(merchant["_id"]),
            "nombre": merchant.get("nombre", "N/A"),
            "username": merchant.get("username", "N/A"),
            "direccion": merchant.get("direccion", "N/A"),
            "telefono": merchant.get("telefono", "N/A"),
            "admin": {
                "id": str(admin["_id"]),
                "nombre": admin.get("nombre", "N/A"),
                "email": admin.get("email", "N/A")
            } if admin else None,
            "created_at": merchant.get("created_at"),
            "activated_at": merchant.get("activated_at"),
            "fully_activated_at": merchant.get("fully_activated_at"),
            "active": merchant.get("active", True),
            "clerks": [
                {
                    "id": str(c["_id"]),
                    "nombre": c.get("nombre", "N/A"),
                    "email": c.get("email", "N/A"),
                    "role": c.get("role", "employee")
                }
                for c in clerks
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/merchants/{merchant_id}")
async def update_merchant(merchant_id: str, merchant_data: MerchantCreate):
    """
    Actualizar información de un merchant.
    NOTA: Si se proporciona password, se hace hash automáticamente.
    """
    from main import get_database
    from passlib.context import CryptContext
    
    db = get_database()
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    try:
        # Verificar que el merchant existe
        existing = await db.merchants.find_one({"_id": ObjectId(merchant_id)})
        if not existing:
            raise HTTPException(status_code=404, detail="Merchant no encontrado")
        
        # Verificar que el admin existe
        admin = await db.admins.find_one({"_id": ObjectId(merchant_data.admin_id)})
        if not admin:
            raise HTTPException(status_code=404, detail="Admin no encontrado")
        
        # Verificar que no se duplique el username (si cambió)
        if merchant_data.username != existing.get("username"):
            duplicate = await db.merchants.find_one({"username": merchant_data.username})
            if duplicate:
                raise HTTPException(status_code=400, detail="Ya existe un merchant con este username")
        
        update_dict = merchant_data.model_dump()
        
        # Hash password si se proporcionó uno nuevo
        update_dict["password"] = pwd_context.hash(update_dict["password"])
        
        await db.merchants.update_one(
            {"_id": ObjectId(merchant_id)},
            {"$set": update_dict}
        )
        
        return {"message": "Merchant actualizado exitosamente"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/merchants/{merchant_id}")
async def delete_merchant(merchant_id: str):
    """
    Eliminar un merchant.
    VALIDACIÓN: No permite eliminar si tiene clerks asociados.
    """
    from main import get_database
    db = get_database()
    
    try:
        # Verificar que existe
        merchant = await db.merchants.find_one({"_id": ObjectId(merchant_id)})
        if not merchant:
            raise HTTPException(status_code=404, detail="Merchant no encontrado")
        
        # Verificar que no tiene clerks
        clerks_count = await db.clerks.count_documents({"merchant_id": merchant_id})
        if clerks_count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"No se puede eliminar: el merchant tiene {clerks_count} clerk(s) asociado(s). Elimine primero los clerks."
            )
        
        # Eliminar merchant
        await db.merchants.delete_one({"_id": ObjectId(merchant_id)})
        
        return {"message": "Merchant eliminado exitosamente"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# CRUD CLERKS
# ============================================

@router.post("/clerks")
async def create_clerk(clerk_data: ClerkCreate):
    """
    Crear un nuevo Clerk.
    VALIDACIÓN: Requiere un merchant_id válido.
    """
    from main import get_database
    from passlib.context import CryptContext
    
    db = get_database()
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    try:
        # Verificar que el merchant existe
        merchant = await db.merchants.find_one({"_id": ObjectId(clerk_data.merchant_id)})
        if not merchant:
            raise HTTPException(status_code=404, detail="Merchant no encontrado")
        
        # Verificar que no exista clerk con el mismo email
        existing = await db.clerks.find_one({"email": clerk_data.email})
        if existing:
            raise HTTPException(status_code=400, detail="Ya existe un clerk con este email")
        
        clerk_dict = clerk_data.model_dump()
        
        # Hash password
        clerk_dict["password"] = pwd_context.hash(clerk_dict["password"])
        
        # Timestamps
        clerk_dict["created_at"] = datetime.utcnow()
        clerk_dict["activated_at"] = None
        clerk_dict["fully_activated_at"] = None
        
        # Alertas por defecto
        clerk_dict["alerts_enabled"] = True
        clerk_dict["stock_alerts_enabled"] = True
        clerk_dict["sales_summary_enabled"] = True
        clerk_dict["ai_insights_enabled"] = True
        clerk_dict["active"] = True
        
        result = await db.clerks.insert_one(clerk_dict)
        
        return {
            "message": "Clerk creado exitosamente",
            "clerk_id": str(result.inserted_id)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/clerks")
async def get_all_clerks():
    """
    Listar todos los clerks con información de merchant y admin.
    """
    from main import get_database
    db = get_database()
    
    try:
        clerks = await db.clerks.find({}).to_list(1000)
        
        clerks_list = []
        for clerk in clerks:
            # Obtener merchant info
            merchant = None
            admin = None
            
            if clerk.get("merchant_id"):
                merchant = await db.merchants.find_one({"_id": ObjectId(clerk["merchant_id"])})
                
                if merchant and merchant.get("admin_id"):
                    admin = await db.admins.find_one({"_id": ObjectId(merchant["admin_id"])})
            
            clerks_list.append({
                "id": str(clerk["_id"]),
                "nombre": clerk.get("nombre", "N/A"),
                "email": clerk.get("email", "N/A"),
                "whatsapp_number": clerk.get("whatsapp_number", "N/A"),
                "role": clerk.get("role", "employee"),
                "merchant_id": clerk.get("merchant_id"),
                "merchant_nombre": merchant.get("nombre", "N/A") if merchant else "N/A",
                "merchant_username": merchant.get("username", "N/A") if merchant else "N/A",
                "admin_nombre": admin.get("nombre", "N/A") if admin else "N/A",
                "created_at": clerk.get("created_at"),
                "activated_at": clerk.get("activated_at"),
                "fully_activated_at": clerk.get("fully_activated_at"),
                "active": clerk.get("active", True)
            })
        
        # Ordenar por fecha de creación descendente
        clerks_list.sort(key=lambda x: x["created_at"] or datetime.min, reverse=True)
        
        return {
            "count": len(clerks_list),
            "clerks": clerks_list
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/clerks/{clerk_id}")
async def get_clerk(clerk_id: str):
    """
    Obtener información detallada de un clerk específico.
    """
    from main import get_database
    db = get_database()
    
    try:
        clerk = await db.clerks.find_one({"_id": ObjectId(clerk_id)})
        
        if not clerk:
            raise HTTPException(status_code=404, detail="Clerk no encontrado")
        
        # Obtener merchant info
        merchant = None
        admin = None
        
        if clerk.get("merchant_id"):
            merchant = await db.merchants.find_one({"_id": ObjectId(clerk["merchant_id"])})
            
            if merchant and merchant.get("admin_id"):
                admin = await db.admins.find_one({"_id": ObjectId(merchant["admin_id"])})
        
        return {
            "id": str(clerk["_id"]),
            "nombre": clerk.get("nombre", "N/A"),
            "email": clerk.get("email", "N/A"),
            "whatsapp_number": clerk.get("whatsapp_number", "N/A"),
            "role": clerk.get("role", "employee"),
            "merchant": {
                "id": str(merchant["_id"]),
                "nombre": merchant.get("nombre", "N/A"),
                "username": merchant.get("username", "N/A")
            } if merchant else None,
            "admin": {
                "id": str(admin["_id"]),
                "nombre": admin.get("nombre", "N/A"),
                "email": admin.get("email", "N/A")
            } if admin else None,
            "created_at": clerk.get("created_at"),
            "activated_at": clerk.get("activated_at"),
            "fully_activated_at": clerk.get("fully_activated_at"),
            "alerts_enabled": clerk.get("alerts_enabled", True),
            "stock_alerts_enabled": clerk.get("stock_alerts_enabled", True),
            "sales_summary_enabled": clerk.get("sales_summary_enabled", True),
            "ai_insights_enabled": clerk.get("ai_insights_enabled", True),
            "active": clerk.get("active", True)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/clerks/{clerk_id}")
async def update_clerk(clerk_id: str, clerk_data: ClerkCreate):
    """
    Actualizar información de un clerk.
    NOTA: Si se proporciona password, se hace hash automáticamente.
    """
    from main import get_database
    from passlib.context import CryptContext
    
    db = get_database()
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    try:
        # Verificar que el clerk existe
        existing = await db.clerks.find_one({"_id": ObjectId(clerk_id)})
        if not existing:
            raise HTTPException(status_code=404, detail="Clerk no encontrado")
        
        # Verificar que el merchant existe
        merchant = await db.merchants.find_one({"_id": ObjectId(clerk_data.merchant_id)})
        if not merchant:
            raise HTTPException(status_code=404, detail="Merchant no encontrado")
        
        # Verificar que no se duplique el email (si cambió)
        if clerk_data.email != existing.get("email"):
            duplicate = await db.clerks.find_one({"email": clerk_data.email})
            if duplicate:
                raise HTTPException(status_code=400, detail="Ya existe un clerk con este email")
        
        update_dict = clerk_data.model_dump()
        
        # Hash password si se proporcionó uno nuevo
        update_dict["password"] = pwd_context.hash(update_dict["password"])
        
        await db.clerks.update_one(
            {"_id": ObjectId(clerk_id)},
            {"$set": update_dict}
        )
        
        return {"message": "Clerk actualizado exitosamente"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/clerks/{clerk_id}")
async def delete_clerk(clerk_id: str):
    """
    Eliminar un clerk.
    """
    from main import get_database
    db = get_database()
    
    try:
        # Verificar que existe
        clerk = await db.clerks.find_one({"_id": ObjectId(clerk_id)})
        if not clerk:
            raise HTTPException(status_code=404, detail="Clerk no encontrado")
        
        # Eliminar clerk
        await db.clerks.delete_one({"_id": ObjectId(clerk_id)})
        
        return {"message": "Clerk eliminado exitosamente"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# CRUD KYB (Vinculado a Admin)
# ============================================

@router.post("/kyb")
async def create_or_update_kyb(kyb_data: KYBDataCreate):
    """
    Crear o actualizar datos KYB de un Admin.
    Si ya existe, actualiza. Si no, crea nuevo.
    """
    from main import get_database
    db = get_database()
    
    try:
        # Verificar que el admin existe
        admin = await db.admins.find_one({"_id": ObjectId(kyb_data.admin_id)})
        if not admin:
            raise HTTPException(status_code=404, detail="Admin no encontrado")
        
        # Verificar si ya existe KYB para este admin
        existing_kyb = await db.kyb_data.find_one({"admin_id": kyb_data.admin_id})
        
        kyb_dict = kyb_data.model_dump()
        kyb_dict["updated_at"] = datetime.utcnow()
        
        if existing_kyb:
            # Actualizar
            await db.kyb_data.update_one(
                {"_id": existing_kyb["_id"]},
                {"$set": kyb_dict}
            )
            return {
                "message": "KYB actualizado exitosamente",
                "kyb_id": str(existing_kyb["_id"])
            }
        else:
            # Crear nuevo
            kyb_dict["created_at"] = datetime.utcnow()
            kyb_dict["status"] = "pending"
            result = await db.kyb_data.insert_one(kyb_dict)
            return {
                "message": "KYB creado exitosamente",
                "kyb_id": str(result.inserted_id)
            }
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/kyb/{admin_id}")
async def get_kyb_by_admin(admin_id: str):
    """
    Obtener datos KYB de un admin específico.
    """
    from main import get_database
    db = get_database()
    
    try:
        kyb = await db.kyb_data.find_one({"admin_id": admin_id})
        
        if not kyb:
            raise HTTPException(status_code=404, detail="KYB no encontrado para este admin")
        
        # Obtener info del admin
        admin = await db.admins.find_one({"_id": ObjectId(admin_id)})
        
        return {
            "kyb": {
                "id": str(kyb["_id"]),
                "admin_id": kyb["admin_id"],
                "nombre_legal": kyb.get("nombre_legal"),
                "ruc_tax_id": kyb.get("ruc_tax_id"),
                "direccion_fiscal": kyb.get("direccion_fiscal"),
                "telefono_contacto": kyb.get("telefono_contacto"),
                "email_oficial": kyb.get("email_oficial"),
                "representante_legal": kyb.get("representante_legal"),
                "documento_representante": kyb.get("documento_representante"),
                "status": kyb.get("status", "pending"),
                "notas": kyb.get("notas"),
                "created_at": kyb.get("created_at"),
                "updated_at": kyb.get("updated_at")
            },
            "admin": {
                "nombre": admin.get("nombre") if admin else "N/A",
                "email": admin.get("email") if admin else "N/A"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/kyb")
async def get_all_kyb(status: Optional[str] = None):
    """
    Obtener todos los datos KYB con filtros opcionales.
    
    status: pending, approved, rejected, or None for all
    """
    from main import get_database
    db = get_database()
    
    try:
        # Build query
        query = {}
        if status:
            query["status"] = status
        
        # Get all KYB data
        kyb_list = await db.kyb_data.find(query).to_list(1000)
        
        # Enrich with admin info
        result = []
        for kyb in kyb_list:
            admin = await db.admins.find_one({"_id": ObjectId(kyb["admin_id"])})
            
            result.append({
                "id": str(kyb["_id"]),
                "admin_id": kyb["admin_id"],
                "admin_nombre": admin.get("nombre") if admin else "N/A",
                "admin_email": admin.get("email") if admin else "N/A",
                "nombre_legal": kyb.get("nombre_legal"),
                "ruc_tax_id": kyb.get("ruc_tax_id"),
                "direccion_fiscal": kyb.get("direccion_fiscal"),
                "telefono_contacto": kyb.get("telefono_contacto"),
                "email_oficial": kyb.get("email_oficial"),
                "representante_legal": kyb.get("representante_legal"),
                "documento_representante": kyb.get("documento_representante"),
                "status": kyb.get("status", "pending"),
                "notas": kyb.get("notas"),
                "created_at": kyb.get("created_at"),
                "updated_at": kyb.get("updated_at")
            })
        
        # Count by status
        total = len(result)
        pending_count = await db.kyb_data.count_documents({"status": "pending"})
        approved_count = await db.kyb_data.count_documents({"status": "approved"})
        rejected_count = await db.kyb_data.count_documents({"status": "rejected"})
        
        # Get admins without KYB
        all_admins = await db.admins.count_documents({})
        admins_with_kyb = await db.kyb_data.count_documents({})
        admins_without_kyb = all_admins - admins_with_kyb
        
        return {
            "total": total,
            "pending_count": pending_count,
            "approved_count": approved_count,
            "rejected_count": rejected_count,
            "admins_without_kyb": admins_without_kyb,
            "kyb_data": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/kyb/{kyb_id}")
async def update_kyb(kyb_id: str, update_data: KYBDataUpdate):
    """
    Actualizar datos KYB específicos.
    """
    from main import get_database
    db = get_database()
    
    try:
        # Get existing KYB
        existing = await db.kyb_data.find_one({"_id": ObjectId(kyb_id)})
        if not existing:
            raise HTTPException(status_code=404, detail="KYB no encontrado")
        
        # Update only provided fields
        update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
        update_dict["updated_at"] = datetime.utcnow()
        
        await db.kyb_data.update_one(
            {"_id": ObjectId(kyb_id)},
            {"$set": update_dict}
        )
        
        return {"message": "KYB actualizado exitosamente"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/kyb/{kyb_id}")
async def delete_kyb(kyb_id: str):
    """
    Eliminar datos KYB.
    """
    from main import get_database
    db = get_database()
    
    try:
        result = await db.kyb_data.delete_one({"_id": ObjectId(kyb_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="KYB no encontrado")
        
        return {"message": "KYB eliminado exitosamente"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



# ============================================
# ALERT SETTINGS (Email & WhatsApp)
# ============================================

from pydantic import BaseModel

class AlertSettingsRequest(BaseModel):
    email: str = ""
    whatsapp_number: str = ""
    stock_alert_email: bool = False
    stock_alert_whatsapp: bool = False
    stock_alert_push: bool = True
    debt_alert_push: bool = True
    daily_email: bool = False
    daily_whatsapp: bool = False
    daily_push: bool = False
    weekly_email: bool = False
    weekly_whatsapp: bool = False
    weekly_push: bool = True
    monthly_email: bool = False
    monthly_whatsapp: bool = False

@router.get("/alert-settings")
async def get_alert_settings():
    """
    Obtener configuración actual de alertas del usuario
    """
    from main import get_database
    
    db = get_database()
    
    # Por ahora usamos tiendaclave como merchant por defecto
    # TODO: En producción, obtener del token de autenticación
    merchant = await db.merchants.find_one({"username": "tiendaclave"})
    
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant no encontrado")
    
    return {
        "email": merchant.get("email", ""),
        "whatsapp_number": merchant.get("whatsapp_number", ""),
        "stock_alert_email": merchant.get("stock_alert_email", False),
        "stock_alert_whatsapp": merchant.get("stock_alert_whatsapp", False),
        "stock_alert_push": merchant.get("stock_alert_push", True),
        "debt_alert_push": merchant.get("debt_alert_push", True),
        "daily_email": merchant.get("daily_email", False),
        "daily_whatsapp": merchant.get("daily_whatsapp", False),
        "daily_push": merchant.get("daily_push", False),
        "weekly_email": merchant.get("weekly_email", False),
        "weekly_whatsapp": merchant.get("weekly_whatsapp", False),
        "weekly_push": merchant.get("weekly_push", True),
        "monthly_email": merchant.get("monthly_email", False),
        "monthly_whatsapp": merchant.get("monthly_whatsapp", False),
    }


@router.post("/alert-settings")
async def save_alert_settings(settings: AlertSettingsRequest):
    """
    Guardar configuración de alertas
    """
    from main import get_database
    
    db = get_database()
    
    # Por ahora usamos tiendaclave como merchant por defecto
    # TODO: En producción, obtener del token de autenticación
    merchant = await db.merchants.find_one({"username": "tiendaclave"})
    
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant no encontrado")
    
    # Actualizar configuración (incluye WhatsApp y Push)
    await db.merchants.update_one(
        {"_id": merchant["_id"]},
        {"$set": {
            "email": settings.email,
            "whatsapp_number": settings.whatsapp_number,
            "stock_alert_email": settings.stock_alert_email,
            "stock_alert_whatsapp": settings.stock_alert_whatsapp,
            "stock_alert_push": settings.stock_alert_push,
            "debt_alert_push": settings.debt_alert_push,
            "daily_email": settings.daily_email,
            "daily_whatsapp": settings.daily_whatsapp,
            "daily_push": settings.daily_push,
            "weekly_email": settings.weekly_email,
            "weekly_whatsapp": settings.weekly_whatsapp,
            "weekly_push": settings.weekly_push,
            "monthly_email": settings.monthly_email,
            "monthly_whatsapp": settings.monthly_whatsapp,
            "updated_at": datetime.utcnow()
        }}
    )
    
    return {
        "success": True,
        "message": "Configuración de alertas guardada exitosamente"
    }

