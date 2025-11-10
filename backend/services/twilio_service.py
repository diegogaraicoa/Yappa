import os
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

class TwilioService:
    def __init__(self):
        self.account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        self.auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        self.whatsapp_from = os.getenv('TWILIO_WHATSAPP_FROM')
        self.client = Client(self.account_sid, self.auth_token)
    
    def send_whatsapp(self, to_number: str, message: str) -> dict:
        """
        Send WhatsApp message via Twilio
        
        Args:
            to_number: Recipient phone number in E.164 format (e.g., +593992913093)
            message: Message content
        
        Returns:
            dict with status and message_sid or error
        """
        try:
            # Ensure number has whatsapp: prefix
            if not to_number.startswith('whatsapp:'):
                to_number = f'whatsapp:{to_number}'
            
            message_obj = self.client.messages.create(
                from_=self.whatsapp_from,
                to=to_number,
                body=message
            )
            
            return {
                'success': True,
                'message_sid': message_obj.sid,
                'status': message_obj.status
            }
        except Exception as e:
            print(f'Error sending WhatsApp: {str(e)}')
            return {
                'success': False,
                'error': str(e)
            }
    
    def send_stock_alert(self, to_number: str, product_name: str, current_stock: int, min_stock: int) -> dict:
        """Send stock alert via WhatsApp"""
        message = f"🔔 *Alerta de Stock Bajo* 🔔\n\n"
        message += f"Producto: *{product_name}*\n"
        message += f"Stock actual: {current_stock}\n"
        message += f"Mínimo requerido: {min_stock}\n\n"
        message += f"⚠️ Es momento de reabastecer este producto."
        
        return self.send_whatsapp(to_number, message)
    
    def send_critical_stock_alert(self, to_number: str, product_name: str) -> dict:
        """Send critical stock alert (out of stock)"""
        message = f"🚨 *ALERTA CRÍTICA* 🚨\n\n"
        message += f"Producto: *{product_name}*\n"
        message += f"Stock: *AGOTADO* (0 unidades)\n\n"
        message += f"❌ Reabastece URGENTE para evitar pérdida de ventas."
        
        return self.send_whatsapp(to_number, message)
    
    def send_daily_sales_summary(self, to_number: str, total_sales: float, num_sales: int, total_expenses: float) -> dict:
        """Send daily sales summary"""
        balance = total_sales - total_expenses
        
        message = f"📊 *Resumen Diario* 📊\n\n"
        message += f"💰 Ventas: ${total_sales:.2f} ({num_sales} transacciones)\n"
        message += f"💸 Gastos: ${total_expenses:.2f}\n"
        message += f"{'➕' if balance >= 0 else '➖'} Balance: ${abs(balance):.2f}\n\n"
        message += f"¡Sigue así!"
        
        return self.send_whatsapp(to_number, message)
    
    def send_weekly_summary(self, to_number: str, data: dict) -> dict:
        """Send weekly business summary"""
        message = f"📈 *Resumen Semanal* 📈\n\n"
        message += f"💰 Ventas totales: ${data['total_sales']:.2f}\n"
        message += f"💸 Gastos totales: ${data['total_expenses']:.2f}\n"
        message += f"➕ Balance: ${data['balance']:.2f}\n\n"
        
        if data.get('customer_debts', 0) > 0:
            message += f"👥 Clientes deben: ${data['customer_debts']:.2f}\n"
        
        if data.get('supplier_debts', 0) > 0:
            message += f"🏪 Debes a proveedores: ${data['supplier_debts']:.2f}\n"
        
        message += f"\n¡Excelente trabajo esta semana!"
        
        return self.send_whatsapp(to_number, message)

# Singleton instance
twilio_service = TwilioService()
