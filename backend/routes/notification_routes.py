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
