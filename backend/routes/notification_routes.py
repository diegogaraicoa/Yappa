"""
Push Notification Routes - Endpoints para gestionar notificaciones push
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

router = APIRouter(prefix="/notifications", tags=["notifications"])


class PushTokenRegister(BaseModel):
    push_token: str
    platform: str  # "ios" or "android"


class NotificationPayload(BaseModel):
    title: str
    body: str
    data: Optional[dict] = None


@router.post("/register-token")
async def register_push_token(payload: PushTokenRegister):
    """
    Registra un token de Expo Push para recibir notificaciones
    """
    from main import get_database
    
    db = get_database()
    
    # Por ahora usamos tiendaclave como merchant
    merchant = await db.merchants.find_one({"username": "tiendaclave"})
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant no encontrado")
    
    store_id = str(merchant.get("_id"))
    
    # Guardar o actualizar el token
    await db.push_tokens.update_one(
        {"store_id": store_id, "push_token": payload.push_token},
        {
            "$set": {
                "store_id": store_id,
                "push_token": payload.push_token,
                "platform": payload.platform,
                "updated_at": datetime.now(),
                "active": True
            },
            "$setOnInsert": {
                "created_at": datetime.now()
            }
        },
        upsert=True
    )
    
    return {
        "success": True,
        "message": "Token registrado correctamente"
    }


@router.get("/tokens")
async def get_push_tokens():
    """
    Obtiene todos los tokens de push registrados para el merchant
    """
    from main import get_database
    
    db = get_database()
    
    merchant = await db.merchants.find_one({"username": "tiendaclave"})
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant no encontrado")
    
    store_id = str(merchant.get("_id"))
    
    tokens = await db.push_tokens.find({
        "store_id": store_id,
        "active": True
    }).to_list(100)
    
    return {
        "tokens": [
            {
                "push_token": t["push_token"],
                "platform": t["platform"],
                "created_at": t.get("created_at"),
                "updated_at": t.get("updated_at")
            }
            for t in tokens
        ],
        "count": len(tokens)
    }


@router.post("/send")
async def send_push_notification(payload: NotificationPayload):
    """
    Envía una notificación push a todos los dispositivos registrados del merchant
    
    Usa la API de Expo Push Notifications
    """
    import httpx
    from main import get_database
    
    db = get_database()
    
    merchant = await db.merchants.find_one({"username": "tiendaclave"})
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant no encontrado")
    
    store_id = str(merchant.get("_id"))
    
    # Obtener tokens activos
    tokens = await db.push_tokens.find({
        "store_id": store_id,
        "active": True
    }).to_list(100)
    
    if not tokens:
        return {
            "success": False,
            "message": "No hay dispositivos registrados para recibir notificaciones"
        }
    
    # Preparar mensajes para Expo Push API
    messages = []
    for token in tokens:
        push_token = token["push_token"]
        if push_token.startswith("ExponentPushToken"):
            messages.append({
                "to": push_token,
                "sound": "default",
                "title": payload.title,
                "body": payload.body,
                "data": payload.data or {},
                "priority": "high",
                "channelId": "default"
            })
    
    if not messages:
        return {
            "success": False,
            "message": "No hay tokens válidos de Expo Push"
        }
    
    # Enviar a Expo Push API
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://exp.host/--/api/v2/push/send",
                json=messages,
                headers={
                    "Accept": "application/json",
                    "Accept-Encoding": "gzip, deflate",
                    "Content-Type": "application/json"
                }
            )
            
            result = response.json()
            
            # Guardar log de notificación enviada
            await db.notification_logs.insert_one({
                "store_id": store_id,
                "title": payload.title,
                "body": payload.body,
                "data": payload.data,
                "tokens_count": len(messages),
                "response": result,
                "sent_at": datetime.now()
            })
            
            return {
                "success": True,
                "message": f"Notificación enviada a {len(messages)} dispositivo(s)",
                "result": result
            }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@router.post("/send-insight-alert")
async def send_insight_alert(insight_type: str, message: str):
    """
    Envía una notificación de alerta basada en un insight
    """
    titles = {
        "critical_stock": "🚨 ¡Stock Agotado!",
        "low_stock": "⚠️ Stock Bajo",
        "debt": "💰 Deuda Pendiente",
        "overdue_debt": "⏰ Deuda Vencida"
    }
    
    payload = NotificationPayload(
        title=titles.get(insight_type, "Alerta Yappa"),
        body=message,
        data={"type": insight_type, "screen": "insights"}
    )
    
    return await send_push_notification(payload)


@router.delete("/token/{push_token}")
async def deactivate_push_token(push_token: str):
    """
    Desactiva un token de push (cuando el usuario cierra sesión)
    """
    from main import get_database
    
    db = get_database()
    
    result = await db.push_tokens.update_one(
        {"push_token": push_token},
        {"$set": {"active": False, "deactivated_at": datetime.now()}}
    )
    
    return {
        "success": result.modified_count > 0,
        "message": "Token desactivado" if result.modified_count > 0 else "Token no encontrado"
    }


# ==================== SCHEDULER TEST ENDPOINTS ====================

@router.post("/scheduler/test/{job_type}")
async def test_scheduler_job(job_type: str):
    """
    Ejecuta manualmente un job del scheduler para pruebas
    
    job_type puede ser:
    - 'stock': Ejecuta alertas de stock diarias
    - 'daily': Ejecuta resumen diario
    - 'weekly': Ejecuta resumen semanal
    - 'monthly': Ejecuta insights mensuales
    """
    from services.alert_scheduler import (
        send_daily_stock_alerts,
        send_daily_sales_summary,
        send_weekly_summary_with_insights,
        send_monthly_ai_insights
    )
    
    valid_jobs = {
        "stock": ("Alertas de Stock Diarias", send_daily_stock_alerts),
        "daily": ("Resumen de Ventas Diario", send_daily_sales_summary),
        "weekly": ("Resumen Semanal + AI Insights", send_weekly_summary_with_insights),
        "monthly": ("Insights Mensuales IA", send_monthly_ai_insights)
    }
    
    if job_type not in valid_jobs:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo de job inválido. Opciones válidas: {list(valid_jobs.keys())}"
        )
    
    job_name, job_func = valid_jobs[job_type]
    
    try:
        await job_func()
        return {
            "success": True,
            "message": f"Job '{job_name}' ejecutado correctamente",
            "job_type": job_type
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "job_type": job_type
        }


@router.post("/test-all")
async def test_all_notifications():
    """
    Prueba TODAS las notificaciones: Push remota + WhatsApp
    """
    import httpx
    from main import get_database
    from services.twilio_service import twilio_service
    
    db = get_database()
    results = {"push": None, "whatsapp": None}
    
    # Obtener merchant
    merchant = await db.merchants.find_one({"username": "tiendaclave"})
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant no encontrado")
    
    store_id = str(merchant.get("_id"))
    
    # 1. ENVIAR PUSH NOTIFICATION REMOTA
    try:
        tokens = await db.push_tokens.find({
            "store_id": store_id,
            "active": True
        }).to_list(100)
        
        if tokens:
            messages = []
            for token in tokens:
                push_token = token["push_token"]
                if push_token.startswith("ExponentPushToken"):
                    messages.append({
                        "to": push_token,
                        "sound": "default",
                        "title": "🧪 Prueba YAPPA",
                        "body": "¡Tus notificaciones push están funcionando!",
                        "data": {"type": "test"},
                        "priority": "high"
                    })
            
            if messages:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        "https://exp.host/--/api/v2/push/send",
                        json=messages,
                        headers={"Content-Type": "application/json"}
                    )
                    results["push"] = {
                        "success": True,
                        "sent_to": len(messages),
                        "response": response.json()
                    }
            else:
                results["push"] = {"success": False, "error": "No hay tokens válidos"}
        else:
            results["push"] = {"success": False, "error": "No hay dispositivos registrados"}
    except Exception as e:
        results["push"] = {"success": False, "error": str(e)}
    
    # 2. ENVIAR WHATSAPP
    try:
        whatsapp_number = merchant.get("whatsapp_number")
        if whatsapp_number:
            message = "🧪 *Prueba YAPPA*\n\n¡Tus notificaciones de WhatsApp están funcionando correctamente!"
            twilio_service.send_whatsapp(whatsapp_number, message)
            results["whatsapp"] = {"success": True, "sent_to": whatsapp_number}
        else:
            results["whatsapp"] = {"success": False, "error": "No hay número de WhatsApp configurado"}
    except Exception as e:
        results["whatsapp"] = {"success": False, "error": str(e)}
    
    return {
        "success": True,
        "message": "Prueba de notificaciones completada",
        "results": results
    }


@router.get("/scheduler/status")
async def get_scheduler_status():
    """
    Obtiene el estado actual del scheduler y los próximos jobs programados
    """
    from services.alert_scheduler import scheduler
    
    jobs = []
    for job in scheduler.get_jobs():
        jobs.append({
            "id": job.id,
            "name": job.name,
            "next_run": str(job.next_run_time) if job.next_run_time else None,
            "trigger": str(job.trigger)
        })
    
    return {
        "running": scheduler.running,
        "jobs": jobs,
        "jobs_count": len(jobs)
    }
