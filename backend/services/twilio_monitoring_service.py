"""
Twilio Monitoring Service
Obtiene estadísticas de uso de Twilio/WhatsApp
"""

from datetime import datetime, timedelta
from typing import Optional, Dict
import os
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

# Twilio pricing (aproximado - actualizar según tu plan)
WHATSAPP_MESSAGE_COST = 0.005  # $0.005 por mensaje


def get_twilio_client() -> Optional[Client]:
    """
    Obtiene cliente de Twilio con las credenciales del .env
    """
    account_sid = os.getenv('TWILIO_ACCOUNT_SID')
    auth_token = os.getenv('TWILIO_AUTH_TOKEN')
    
    if not account_sid or not auth_token:
        return None
    
    return Client(account_sid, auth_token)


async def get_twilio_stats(db, days: int = 30) -> Dict:
    """
    Obtiene estadísticas de uso de Twilio.
    
    Combina:
    - Stats reales de Twilio API
    - Event logs de nuestra DB (para breakdown por merchant)
    """
    try:
        client = get_twilio_client()
        
        if not client:
            # Si no hay credenciales, retornar datos simulados
            return get_simulated_stats(db, days)
        
        # Calcular fechas
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Obtener mensajes de Twilio
        messages = client.messages.list(
            date_sent_after=start_date,
            date_sent_before=end_date,
            limit=1000  # Ajustar según necesidad
        )
        
        # Procesar mensajes
        total_sent = 0
        total_received = 0
        total_errors = 0
        total_cost = 0
        
        errors_details = []
        daily_usage = {}
        
        for msg in messages:
            date_key = msg.date_sent.strftime('%Y-%m-%d')
            
            if date_key not in daily_usage:
                daily_usage[date_key] = {'sent': 0, 'received': 0, 'errors': 0}
            
            # Clasificar por dirección
            if msg.direction == 'outbound-api':
                total_sent += 1
                daily_usage[date_key]['sent'] += 1
                total_cost += WHATSAPP_MESSAGE_COST
            else:
                total_received += 1
                daily_usage[date_key]['received'] += 1
            
            # Detectar errores
            if msg.error_code:
                total_errors += 1
                daily_usage[date_key]['errors'] += 1
                errors_details.append({
                    'date': msg.date_sent.isoformat(),
                    'error_code': msg.error_code,
                    'error_message': msg.error_message,
                    'to': msg.to,
                    'status': msg.status
                })
        
        # Obtener breakdown por merchant desde nuestra DB
        merchant_breakdown = await get_merchant_breakdown(db, start_date, end_date)
        
        # Obtener rate limit hits (429 errors) desde event logs
        rate_limit_hits = await get_rate_limit_hits(db, start_date, end_date)
        
        return {
            'period': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat(),
                'days': days
            },
            'totals': {
                'sent': total_sent,
                'received': total_received,
                'errors': total_errors,
                'cost_usd': round(total_cost, 2)
            },
            'daily_usage': [
                {
                    'date': date,
                    'sent': stats['sent'],
                    'received': stats['received'],
                    'errors': stats['errors']
                }
                for date, stats in sorted(daily_usage.items())
            ],
            'errors': errors_details[-10:],  # Últimos 10 errores
            'merchant_breakdown': merchant_breakdown,
            'rate_limit_hits': rate_limit_hits,
            'has_real_data': True
        }
        
    except Exception as e:
        print(f"Error getting Twilio stats: {e}")
        return get_simulated_stats(db, days)


async def get_merchant_breakdown(db, start_date: datetime, end_date: datetime) -> list:
    """
    Obtiene breakdown de uso de WhatsApp por merchant.
    Basado en los event logs de 'whatsapp' section.
    """
    try:
        # Obtener eventos de WhatsApp en el período
        events = await db.event_logs.find({
            'section': 'whatsapp',
            'timestamp': {'$gte': start_date, '$lte': end_date}
        }).to_list(10000)
        
        # Agrupar por merchant
        merchant_usage = {}
        for event in events:
            merchant_id = event.get('merchant_id')
            if not merchant_id:
                continue
            
            if merchant_id not in merchant_usage:
                merchant_usage[merchant_id] = 0
            merchant_usage[merchant_id] += 1
        
        # Obtener nombres de merchants
        breakdown = []
        for merchant_id, count in merchant_usage.items():
            merchant = await db.merchants.find_one({'_id': merchant_id})
            if merchant:
                breakdown.append({
                    'merchant_id': str(merchant['_id']),
                    'merchant_nombre': merchant.get('nombre', 'N/A'),
                    'messages_count': count
                })
        
        # Ordenar por uso descendente
        breakdown.sort(key=lambda x: x['messages_count'], reverse=True)
        
        return breakdown[:10]  # Top 10
        
    except Exception as e:
        print(f"Error getting merchant breakdown: {e}")
        return []


async def get_rate_limit_hits(db, start_date: datetime, end_date: datetime) -> int:
    """
    Cuenta cuántas veces se alcanzó el rate limit (429 errors).
    Esto lo obtenemos de los logs de nuestra app, no de Twilio.
    """
    try:
        # Buscar en event logs si registramos 429 errors
        # O en una colección de error logs si la tienes
        # Por ahora retornamos 0
        return 0
    except Exception as e:
        print(f"Error getting rate limit hits: {e}")
        return 0


def get_simulated_stats(db, days: int) -> Dict:
    """
    Retorna datos simulados cuando no hay acceso a Twilio API.
    """
    import random
    
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Generar datos diarios
    daily_usage = []
    total_sent = 0
    total_received = 0
    
    for i in range(days):
        date = start_date + timedelta(days=i)
        sent = random.randint(10, 50)
        received = random.randint(5, 30)
        
        total_sent += sent
        total_received += received
        
        daily_usage.append({
            'date': date.strftime('%Y-%m-%d'),
            'sent': sent,
            'received': received,
            'errors': random.randint(0, 2)
        })
    
    return {
        'period': {
            'start': start_date.isoformat(),
            'end': end_date.isoformat(),
            'days': days
        },
        'totals': {
            'sent': total_sent,
            'received': total_received,
            'errors': random.randint(0, 10),
            'cost_usd': round(total_sent * WHATSAPP_MESSAGE_COST, 2)
        },
        'daily_usage': daily_usage,
        'errors': [],
        'merchant_breakdown': [],
        'rate_limit_hits': 0,
        'has_real_data': False
    }


async def send_alert_email(subject: str, message: str):
    """
    Envía email de alerta cuando hay problemas.
    TODO: Implementar con servicio de email (SendGrid, SES, etc.)
    """
    # Por ahora solo log
    print(f"ALERT EMAIL: {subject} - {message}")
    # TODO: Implementar envío real
    pass
