"""
KYB Routes - Admin Ops para gestionar datos KYB (Know Your Business)
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from datetime import datetime
from typing import Optional
import sys
import csv
import io
import base64
sys.path.append('/app/backend')

from models import KYBDataCreate, KYBDataUpdate
from bson import ObjectId

router = APIRouter(prefix="/kyb", tags=["kyb"])


@router.post("")
async def create_or_update_kyb(kyb_data: KYBDataCreate):
    """
    Crear o actualizar datos KYB de un merchant.
    Si ya existe, actualiza. Si no, crea nuevo.
    """
    from main import get_database
    db = get_database()
    
    try:
        # Verificar que el merchant existe
        merchant = await db.merchants.find_one({"_id": ObjectId(kyb_data.merchant_id)})
        if not merchant:
            raise HTTPException(status_code=404, detail="Merchant no encontrado")
        
        # Verificar si ya existe KYB para este merchant
        existing_kyb = await db.kyb_data.find_one({"merchant_id": kyb_data.merchant_id})
        
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
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{merchant_id}")
async def get_kyb_by_merchant(merchant_id: str):
    """
    Obtener datos KYB de un merchant específico.
    """
    from main import get_database
    db = get_database()
    
    try:
        kyb = await db.kyb_data.find_one({"merchant_id": merchant_id})
        
        if not kyb:
            raise HTTPException(status_code=404, detail="KYB no encontrado para este merchant")
        
        # Obtener info del merchant
        merchant = await db.merchants.find_one({"_id": ObjectId(merchant_id)})
        
        return {
            "kyb": {
                "id": str(kyb["_id"]),
                "merchant_id": kyb["merchant_id"],
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
            "merchant": {
                "nombre": merchant.get("nombre") if merchant else "N/A",
                "username": merchant.get("username") if merchant else "N/A"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("")
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
        
        # Enrich with merchant info
        result = []
        for kyb in kyb_list:
            merchant = await db.merchants.find_one({"_id": ObjectId(kyb["merchant_id"])})
            
            result.append({
                "id": str(kyb["_id"]),
                "merchant_id": kyb["merchant_id"],
                "merchant_nombre": merchant.get("nombre") if merchant else "N/A",
                "merchant_username": merchant.get("username") if merchant else "N/A",
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
        
        # Get merchants without KYB
        all_merchants = await db.merchants.count_documents({})
        merchants_with_kyb = await db.kyb_data.count_documents({})
        merchants_without_kyb = all_merchants - merchants_with_kyb
        
        return {
            "total": total,
            "pending_count": pending_count,
            "approved_count": approved_count,
            "rejected_count": rejected_count,
            "merchants_without_kyb": merchants_without_kyb,
            "kyb_data": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{kyb_id}")
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


@router.delete("/{kyb_id}")
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


@router.get("/template/download")
async def download_csv_template():
    """
    Descargar template CSV para carga masiva de KYB.
    """
    try:
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow([
            "merchant_username",
            "nombre_legal",
            "ruc_tax_id",
            "direccion_fiscal",
            "telefono_contacto",
            "email_oficial",
            "representante_legal",
            "documento_representante_url",
            "notas"
        ])
        
        # Example row
        writer.writerow([
            "tienda_demo",
            "Demo Store S.A.",
            "1234567890001",
            "Av. Principal 123, Quito, Ecuador",
            "+593999123456",
            "contacto@demostore.com",
            "Juan Pérez",
            "https://example.com/documento.pdf",
            "Ejemplo de datos KYB"
        ])
        
        # Convert to bytes
        output.seek(0)
        
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=kyb_template.csv"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/bulk-upload")
async def bulk_upload_kyb(file: UploadFile = File(...)):
    """
    Carga masiva de datos KYB desde CSV.
    """
    from main import get_database
    db = get_database()
    
    try:
        # Read CSV file
        contents = await file.read()
        decoded = contents.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(decoded))
        
        created_count = 0
        updated_count = 0
        error_count = 0
        errors = []
        
        for row_num, row in enumerate(csv_reader, start=2):
            try:
                # Get merchant by username
                merchant = await db.merchants.find_one({"username": row["merchant_username"]})
                
                if not merchant:
                    errors.append(f"Fila {row_num}: Merchant '{row['merchant_username']}' no encontrado")
                    error_count += 1
                    continue
                
                merchant_id = str(merchant["_id"])
                
                # Check if KYB exists
                existing_kyb = await db.kyb_data.find_one({"merchant_id": merchant_id})
                
                kyb_data = {
                    "merchant_id": merchant_id,
                    "nombre_legal": row["nombre_legal"],
                    "ruc_tax_id": row["ruc_tax_id"],
                    "direccion_fiscal": row["direccion_fiscal"],
                    "telefono_contacto": row["telefono_contacto"],
                    "email_oficial": row["email_oficial"],
                    "representante_legal": row["representante_legal"],
                    "documento_representante": row.get("documento_representante_url"),
                    "notas": row.get("notas"),
                    "status": "pending",
                    "updated_at": datetime.utcnow()
                }
                
                if existing_kyb:
                    # Update
                    await db.kyb_data.update_one(
                        {"_id": existing_kyb["_id"]},
                        {"$set": kyb_data}
                    )
                    updated_count += 1
                else:
                    # Create
                    kyb_data["created_at"] = datetime.utcnow()
                    await db.kyb_data.insert_one(kyb_data)
                    created_count += 1
                    
            except Exception as e:
                errors.append(f"Fila {row_num}: {str(e)}")
                error_count += 1
        
        return {
            "message": "Carga masiva completada",
            "created": created_count,
            "updated": updated_count,
            "errors": error_count,
            "error_details": errors
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload-document/{kyb_id}")
async def upload_document(kyb_id: str, file: UploadFile = File(...)):
    """
    Subir documento del representante legal (PDF o imagen).
    Guarda como base64 en la DB.
    """
    from main import get_database
    db = get_database()
    
    try:
        # Validate file type
        allowed_types = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400, 
                detail="Tipo de archivo no permitido. Solo PDF, JPG, PNG"
            )
        
        # Read file
        contents = await file.read()
        
        # Convert to base64
        file_base64 = base64.b64encode(contents).decode('utf-8')
        documento_str = f"data:{file.content_type};base64,{file_base64}"
        
        # Update KYB
        result = await db.kyb_data.update_one(
            {"_id": ObjectId(kyb_id)},
            {
                "$set": {
                    "documento_representante": documento_str,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="KYB no encontrado")
        
        return {
            "message": "Documento subido exitosamente",
            "filename": file.filename,
            "size": len(contents)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
