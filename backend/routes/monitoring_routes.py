"""
Monitoring Routes - WhatsApp/Twilio usage monitoring
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional
import sys
sys.path.append('/app/backend')

from services.twilio_monitoring_service import get_twilio_stats, send_alert_email

router = APIRouter(prefix="/monitoring", tags=["monitoring"])


@router.get("/whatsapp")
async def get_whatsapp_monitoring(days: int = Query(default=30, ge=1, le=90)):
    """
    Obtiene estadísticas de uso de WhatsApp/Twilio.
    
    Args:
        days: Número de días atrás (1-90)
    
    Returns:
        Stats de mensajes enviados/recibidos, costos, errores, etc.
    """
    from main import get_database
    db = get_database()
    
    try:
        stats = await get_twilio_stats(db, days)
        return stats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/alert")
async def send_monitoring_alert(
    subject: str = Query(..., description="Asunto del email"),
    message: str = Query(..., description="Mensaje del email")
):
    """
    Envía email de alerta manualmente.
    
    Útil para testing o alertas manuales.
    """
    try:
        await send_alert_email(subject, message)
        return {"message": "Alerta enviada exitosamente"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def check_monitoring_health():
    """
    Verifica el estado del sistema de monitoring.
    """
    from services.twilio_monitoring_service import get_twilio_client
    
    client = get_twilio_client()
    
    return {
        "twilio_configured": client is not None,
        "status": "healthy" if client else "no_credentials"
    }
