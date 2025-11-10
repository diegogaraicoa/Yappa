from exponent_server_sdk import PushClient, PushMessage, PushServerError
from requests.exceptions import ConnectionError, HTTPError

class ExpoPushService:
    def __init__(self):
        self.client = PushClient()
    
    def send_push_notification(self, expo_push_token: str, title: str, body: str, data: dict = None) -> dict:
        """
        Send push notification via Expo
        
        Args:
            expo_push_token: User's Expo push token (starts with ExponentPushToken[...])
            title: Notification title
            body: Notification body
            data: Optional data payload
        
        Returns:
            dict with success status
        """
        try:
            message = PushMessage(
                to=expo_push_token,
                title=title,
                body=body,
                data=data or {},
                sound='default',
                priority='high'
            )
            
            response = self.client.publish(message)
            
            return {
                'success': True,
                'response': response
            }
        except PushServerError as e:
            print(f'Push server error: {e.errors}')
            return {
                'success': False,
                'error': f'Push server error: {e.errors}'
            }
        except (ConnectionError, HTTPError) as e:
            print(f'Connection error: {str(e)}')
            return {
                'success': False,
                'error': f'Connection error: {str(e)}'
            }
        except Exception as e:
            print(f'Unexpected error: {str(e)}')
            return {
                'success': False,
                'error': str(e)
            }
    
    def send_stock_alert_push(self, expo_push_token: str, product_name: str, quantity: int) -> dict:
        """Send stock alert push notification"""
        if quantity == 0:
            title = "🚨 Stock Agotado"
            body = f"{product_name} está sin stock. ¡Reabastece urgente!"
        else:
            title = "⚠️ Stock Bajo"
            body = f"{product_name} tiene solo {quantity} unidades disponibles."
        
        return self.send_push_notification(
            expo_push_token,
            title,
            body,
            data={'type': 'stock_alert', 'product': product_name}
        )
    
    def send_daily_summary_push(self, expo_push_token: str, total_sales: float, balance: float) -> dict:
        """Send daily summary push notification"""
        title = "📊 Resumen del Día"
        body = f"Ventas: ${total_sales:.2f} | Balance: ${balance:.2f}"
        
        return self.send_push_notification(
            expo_push_token,
            title,
            body,
            data={'type': 'daily_summary'}
        )

# Singleton instance
expo_push_service = ExpoPushService()
