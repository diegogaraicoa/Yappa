import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Content
from dotenv import load_dotenv

load_dotenv()

class SendGridService:
    def __init__(self):
        self.api_key = os.getenv('SENDGRID_API_KEY')
        self.from_email = os.getenv('SENDGRID_FROM_EMAIL')
        self.from_name = os.getenv('SENDGRID_FROM_NAME', 'Yappa')
        self.client = SendGridAPIClient(self.api_key)
    
    def send_email(self, to_email: str, subject: str, html_content: str) -> dict:
        """
        Send email via SendGrid
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML content of email
        
        Returns:
            dict with success status
        """
        try:
            message = Mail(
                from_email=(self.from_email, self.from_name),
                to_emails=to_email,
                subject=subject,
                html_content=html_content
            )
            
            response = self.client.send(message)
            
            return {
                'success': True,
                'status_code': response.status_code
            }
        except Exception as e:
            print(f'Error sending email: {str(e)}')
            return {
                'success': False,
                'error': str(e)
            }
    
    def send_stock_alert_email(self, to_email: str, products: list) -> dict:
        """Send stock alert email with list of low stock products"""
        subject = "⚠️ Alerta de Stock Bajo - Yappa"
        
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
                <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
                    <h2 style="color: #FF9800; border-bottom: 3px solid #FF9800; padding-bottom: 10px;">
                        🔔 Alerta de Stock Bajo
                    </h2>
                    <p>Los siguientes productos tienen stock bajo y necesitan ser reabastecidos:</p>
                    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                        <thead>
                            <tr style="background-color: #f0f0f0;">
                                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Producto</th>
                                <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Stock Actual</th>
                                <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Mínimo</th>
                                <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
        """
        
        for product in products:
            alert_color = '#f44336' if product['quantity'] == 0 else '#FF9800'
            alert_text = 'CRÍTICO' if product['quantity'] == 0 else 'BAJO'
            
            html_content += f"""
                            <tr>
                                <td style="padding: 10px; border: 1px solid #ddd;">{product['name']}</td>
                                <td style="padding: 10px; text-align: center; border: 1px solid #ddd; font-weight: bold; color: {alert_color};">{product['quantity']}</td>
                                <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">{product.get('min_stock_alert', 10)}</td>
                                <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">
                                    <span style="background: {alert_color}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">{alert_text}</span>
                                </td>
                            </tr>
            """
        
        html_content += """
                        </tbody>
                    </table>
                    <p style="color: #666; margin-top: 20px;">
                        💡 <strong>Tip:</strong> Mantén tu inventario siempre actualizado para evitar pérdida de ventas.
                    </p>
                    <div style="margin-top: 30px; padding: 15px; background-color: #e3f2fd; border-left: 4px solid #2196F3; border-radius: 4px;">
                        <p style="margin: 0; color: #1976D2;">
                            📱 Accede a Yappa desde tu celular para gestionar tu inventario.
                        </p>
                    </div>
                </div>
            </body>
        </html>
        """
        
        return self.send_email(to_email, subject, html_content)
    
    def send_daily_sales_email(self, to_email: str, data: dict) -> dict:
        """Send daily sales summary email"""
        subject = f"📊 Resumen Diario - {data['date']}"
        balance = data['total_sales'] - data['total_expenses']
        balance_color = '#4CAF50' if balance >= 0 else '#f44336'
        
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
                <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
                    <h2 style="color: #4CAF50; border-bottom: 3px solid #4CAF50; padding-bottom: 10px;">
                        📊 Resumen del Día
                    </h2>
                    <p style="color: #666;">Fecha: <strong>{data['date']}</strong></p>
                    
                    <div style="display: flex; justify-content: space-between; margin: 20px 0;">
                        <div style="flex: 1; padding: 20px; background: #E8F5E9; border-radius: 8px; margin-right: 10px;">
                            <h3 style="margin: 0; color: #4CAF50;">💰 Ventas</h3>
                            <p style="margin: 10px 0 0 0; font-size: 24px; font-weight: bold; color: #2E7D32;">
                                ${data['total_sales']:.2f}
                            </p>
                            <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">
                                {data['num_sales']} transacciones
                            </p>
                        </div>
                        
                        <div style="flex: 1; padding: 20px; background: #FFEBEE; border-radius: 8px; margin-left: 10px;">
                            <h3 style="margin: 0; color: #f44336;">💸 Gastos</h3>
                            <p style="margin: 10px 0 0 0; font-size: 24px; font-weight: bold; color: #C62828;">
                                ${data['total_expenses']:.2f}
                            </p>
                        </div>
                    </div>
                    
                    <div style="padding: 20px; background: {balance_color}20; border-radius: 8px; border-left: 4px solid {balance_color};">
                        <h3 style="margin: 0; color: {balance_color};">Balance del Día</h3>
                        <p style="margin: 10px 0 0 0; font-size: 28px; font-weight: bold; color: {balance_color};">
                            ${balance:.2f}
                        </p>
                    </div>
                    
                    <p style="color: #666; margin-top: 30px; text-align: center;">
                        ¡Sigue así! 💪
                    </p>
                </div>
            </body>
        </html>
        """
        
        return self.send_email(to_email, subject, html_content)
    
    def send_weekly_summary_email(self, to_email: str, data: dict) -> dict:
        """Send weekly summary email"""
        subject = f"📈 Resumen Semanal - Yappa"
        
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
                <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
                    <h2 style="color: #2196F3; border-bottom: 3px solid #2196F3; padding-bottom: 10px;">
                        📈 Resumen de la Semana
                    </h2>
                    
                    <div style="margin: 20px 0;">
                        <h3>💰 Ventas Totales</h3>
                        <p style="font-size: 32px; font-weight: bold; color: #4CAF50; margin: 10px 0;">
                            ${data['total_sales']:.2f}
                        </p>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <h3>💸 Gastos Totales</h3>
                        <p style="font-size: 32px; font-weight: bold; color: #f44336; margin: 10px 0;">
                            ${data['total_expenses']:.2f}
                        </p>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <h3>➕ Balance Neto</h3>
                        <p style="font-size: 32px; font-weight: bold; color: #2196F3; margin: 10px 0;">
                            ${data['balance']:.2f}
                        </p>
                    </div>
        """
        
        if data.get('customer_debts', 0) > 0:
            html_content += f"""
                    <div style="padding: 15px; background: #FFF3E0; border-radius: 8px; margin: 20px 0;">
                        <h4 style="margin: 0; color: #F57C00;">👥 Clientes con Deudas</h4>
                        <p style="margin: 10px 0; font-size: 20px; font-weight: bold; color: #E65100;">
                            ${data['customer_debts']:.2f}
                        </p>
                        <p style="margin: 0; font-size: 14px; color: #666;">
                            💡 Recuerda hacer seguimiento de cobros pendientes
                        </p>
                    </div>
            """
        
        if data.get('supplier_debts', 0) > 0:
            html_content += f"""
                    <div style="padding: 15px; background: #FFEBEE; border-radius: 8px; margin: 20px 0;">
                        <h4 style="margin: 0; color: #C62828;">🏪 Deudas con Proveedores</h4>
                        <p style="margin: 10px 0; font-size: 20px; font-weight: bold; color: #B71C1C;">
                            ${data['supplier_debts']:.2f}
                        </p>
                        <p style="margin: 0; font-size: 14px; color: #666;">
                            💡 Planifica tus pagos a proveedores
                        </p>
                    </div>
            """
        
        html_content += """
                    <p style="color: #666; margin-top: 30px; text-align: center; font-size: 18px;">
                        ¡Excelente trabajo esta semana! 🎉
                    </p>
                </div>
            </body>
        </html>
        """
        
        return self.send_email(to_email, subject, html_content)

# Singleton instance
sendgrid_service = SendGridService()
