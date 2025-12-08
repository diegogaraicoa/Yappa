"""
Email Service - SendGrid Integration
Servicio para envío de emails transaccionales usando SendGrid
"""

import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

SENDGRID_API_KEY = os.getenv('SENDGRID_API_KEY')
SENDGRID_FROM_EMAIL = os.getenv('SENDGRID_FROM_EMAIL', 'noreply@yappa.app')
SENDGRID_FROM_NAME = os.getenv('SENDGRID_FROM_NAME', 'YAPPA')


class EmailServiceError(Exception):
    """Custom exception for email service errors"""
    pass


def send_email(to_email: str, subject: str, html_content: str, plain_content: str = None):
    """
    Envía un email usando SendGrid
    
    Args:
        to_email: Email del destinatario
        subject: Asunto del email
        html_content: Contenido HTML del email
        plain_content: Contenido en texto plano (opcional)
    
    Returns:
        bool: True si el envío fue exitoso
    
    Raises:
        EmailServiceError: Si hay un error al enviar el email
    """
    
    if not SENDGRID_API_KEY:
        raise EmailServiceError("SendGrid API Key no está configurada")
    
    try:
        message = Mail(
            from_email=Email(SENDGRID_FROM_EMAIL, SENDGRID_FROM_NAME),
            to_emails=To(to_email),
            subject=subject,
            html_content=Content("text/html", html_content)
        )
        
        if plain_content:
            message.add_content(Content("text/plain", plain_content))
        
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        
        # SendGrid returns 202 for successful queuing
        if response.status_code == 202:
            print(f"✅ Email enviado exitosamente a {to_email}")
            return True
        else:
            print(f"⚠️ Respuesta inesperada de SendGrid: {response.status_code}")
            return False
            
    except Exception as e:
        error_msg = f"Error al enviar email a {to_email}: {str(e)}"
        print(f"❌ {error_msg}")
        raise EmailServiceError(error_msg)


def send_clerk_pin_email(clerk_email: str, clerk_name: str, pin: str, store_name: str):
    """
    Envía el PIN de acceso a un clerk (empleado)
    
    Args:
        clerk_email: Email del clerk
        clerk_name: Nombre completo del clerk
        pin: PIN de 4 dígitos
        store_name: Nombre de la tienda
    """
    
    subject = f"Tu PIN de acceso a YAPPA - {store_name}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f5f5f5;
            }}
            .container {{
                background-color: white;
                border-radius: 12px;
                padding: 40px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }}
            .header {{
                text-align: center;
                margin-bottom: 30px;
            }}
            .logo {{
                font-size: 48px;
                font-weight: 900;
                color: #00D2FF;
                margin-bottom: 10px;
            }}
            .store-name {{
                font-size: 18px;
                color: #757575;
                font-weight: 600;
            }}
            .greeting {{
                font-size: 20px;
                color: #212121;
                margin-bottom: 20px;
            }}
            .pin-container {{
                background: linear-gradient(135deg, #00D2FF 0%, #00B8E6 100%);
                border-radius: 12px;
                padding: 30px;
                text-align: center;
                margin: 30px 0;
            }}
            .pin-label {{
                color: white;
                font-size: 14px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 10px;
            }}
            .pin-code {{
                color: white;
                font-size: 48px;
                font-weight: 900;
                letter-spacing: 8px;
                font-family: 'Courier New', monospace;
            }}
            .instructions {{
                background-color: #E0F7FA;
                border-left: 4px solid #00D2FF;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
            }}
            .instructions-title {{
                font-weight: 700;
                color: #212121;
                margin-bottom: 10px;
                font-size: 16px;
            }}
            .instructions ol {{
                margin: 10px 0;
                padding-left: 20px;
            }}
            .instructions li {{
                margin: 8px 0;
                color: #424242;
            }}
            .footer {{
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #E0E0E0;
                color: #757575;
                font-size: 14px;
            }}
            .warning {{
                background-color: #FFF3E0;
                border-left: 4px solid #FF9800;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
                font-size: 14px;
                color: #424242;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">YAPPA</div>
                <div class="store-name">{store_name}</div>
            </div>
            
            <div class="greeting">
                ¡Hola, {clerk_name}! 👋
            </div>
            
            <p>Has sido registrado como empleado en <strong>{store_name}</strong>. Para acceder a la aplicación YAPPA, necesitarás tu PIN de seguridad.</p>
            
            <div class="pin-container">
                <div class="pin-label">Tu PIN de Acceso</div>
                <div class="pin-code">{pin}</div>
            </div>
            
            <div class="instructions">
                <div class="instructions-title">📱 Cómo iniciar sesión:</div>
                <ol>
                    <li>Abre la aplicación YAPPA</li>
                    <li>El gerente ingresará con las credenciales de la tienda</li>
                    <li>Selecciona tu nombre de la lista de empleados</li>
                    <li>Ingresa tu PIN: <strong>{pin}</strong></li>
                    <li>¡Listo! Ya puedes usar YAPPA</li>
                </ol>
            </div>
            
            <div class="warning">
                <strong>⚠️ Importante:</strong> Guarda este PIN en un lugar seguro. No lo compartas con nadie. Si olvidas tu PIN, solicita a tu gerente que te genere uno nuevo.
            </div>
            
            <div class="footer">
                <p>Este es un email automático de YAPPA.<br>
                Si tienes dudas, contacta a tu gerente.</p>
                <p style="margin-top: 15px; color: #BDBDBD; font-size: 12px;">
                    © 2025 YAPPA - Sistema de Gestión para Tiendas
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    plain_content = f"""
    YAPPA - {store_name}
    
    ¡Hola, {clerk_name}!
    
    Has sido registrado como empleado en {store_name}.
    
    TU PIN DE ACCESO: {pin}
    
    Cómo iniciar sesión:
    1. Abre la aplicación YAPPA
    2. El gerente ingresa con las credenciales de la tienda
    3. Selecciona tu nombre de la lista
    4. Ingresa tu PIN: {pin}
    
    IMPORTANTE: Guarda este PIN en un lugar seguro.
    
    © 2025 YAPPA
    """
    
    return send_email(clerk_email, subject, html_content, plain_content)


def send_welcome_admin_email(admin_email: str, company_name: str, num_stores: int, num_clerks: int):
    """
    Envía email de bienvenida al admin después del registro completo
    
    Args:
        admin_email: Email del admin
        company_name: Nombre de la compañía
        num_stores: Número de tiendas registradas
        num_clerks: Número de empleados registrados
    """
    
    subject = f"¡Bienvenido a YAPPA, {company_name}! 🎉"
    
    html_content = f"""
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f5f5f5;
            }}
            .container {{
                background-color: white;
                border-radius: 12px;
                padding: 40px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }}
            .header {{
                text-align: center;
                margin-bottom: 30px;
            }}
            .logo {{
                font-size: 56px;
                font-weight: 900;
                color: #00D2FF;
                margin-bottom: 10px;
            }}
            .welcome {{
                font-size: 28px;
                font-weight: 700;
                color: #212121;
                margin-bottom: 10px;
            }}
            .subtitle {{
                font-size: 16px;
                color: #757575;
            }}
            .stats {{
                display: flex;
                justify-content: space-around;
                margin: 30px 0;
                padding: 20px;
                background: linear-gradient(135deg, #E0F7FA 0%, #B2EBF2 100%);
                border-radius: 12px;
            }}
            .stat {{
                text-align: center;
            }}
            .stat-number {{
                font-size: 36px;
                font-weight: 900;
                color: #00D2FF;
            }}
            .stat-label {{
                font-size: 14px;
                color: #424242;
                margin-top: 5px;
            }}
            .features {{
                margin: 30px 0;
            }}
            .feature {{
                margin: 15px 0;
                padding: 15px;
                background-color: #FAFAFA;
                border-radius: 8px;
            }}
            .feature-icon {{
                font-size: 24px;
                margin-right: 10px;
            }}
            .feature-title {{
                font-weight: 700;
                color: #212121;
                font-size: 16px;
            }}
            .feature-desc {{
                color: #757575;
                font-size: 14px;
                margin-top: 5px;
            }}
            .cta {{
                text-align: center;
                margin: 30px 0;
            }}
            .button {{
                display: inline-block;
                background-color: #00D2FF;
                color: white;
                padding: 15px 40px;
                text-decoration: none;
                border-radius: 12px;
                font-weight: 700;
                font-size: 16px;
            }}
            .footer {{
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #E0E0E0;
                color: #757575;
                font-size: 14px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">YAPPA</div>
                <div class="welcome">¡Bienvenido a YAPPA!</div>
                <div class="subtitle">{company_name}</div>
            </div>
            
            <p style="font-size: 16px; color: #424242;">
                Tu cuenta ha sido creada exitosamente. Estamos emocionados de que inicies tu camino hacia una mejor gestión de tu negocio.
            </p>
            
            <div class="stats">
                <div class="stat">
                    <div class="stat-number">{num_stores}</div>
                    <div class="stat-label">Tienda{'s' if num_stores != 1 else ''}</div>
                </div>
                <div class="stat">
                    <div class="stat-number">{num_clerks}</div>
                    <div class="stat-label">Empleado{'s' if num_clerks != 1 else ''}</div>
                </div>
            </div>
            
            <div class="features">
                <h3 style="color: #212121; margin-bottom: 20px;">✨ Lo que puedes hacer ahora:</h3>
                
                <div class="feature">
                    <span class="feature-icon">📊</span>
                    <div class="feature-title">Gestión Completa</div>
                    <div class="feature-desc">Registra ventas, gastos, inventario y más desde tu celular</div>
                </div>
                
                <div class="feature">
                    <span class="feature-icon">👥</span>
                    <div class="feature-title">Equipo Conectado</div>
                    <div class="feature-desc">Tus empleados ya recibieron sus PINs de acceso por email</div>
                </div>
                
                <div class="feature">
                    <span class="feature-icon">📈</span>
                    <div class="feature-title">Insights con IA</div>
                    <div class="feature-desc">Recibe recomendaciones inteligentes para mejorar tu negocio</div>
                </div>
                
                <div class="feature">
                    <span class="feature-icon">💻</span>
                    <div class="feature-title">Dashboard Admin</div>
                    <div class="feature-desc">Accede a reportes y análisis desde cualquier navegador</div>
                </div>
            </div>
            
            <div class="cta">
                <p style="color: #424242; margin-bottom: 20px;">¿Listo para comenzar?</p>
                <a href="#" class="button">Abrir YAPPA</a>
            </div>
            
            <div style="background-color: #E8F5E9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <strong style="color: #2E7D32;">💡 Próximos pasos:</strong>
                <ul style="margin: 10px 0; color: #424242;">
                    <li>Descarga la app YAPPA en tu celular</li>
                    <li>Inicia sesión con las credenciales de tu tienda</li>
                    <li>Explora el dashboard desde tu navegador</li>
                    <li>Invita a tus empleados a descargar la app</li>
                </ul>
            </div>
            
            <div class="footer">
                <p>¿Necesitas ayuda? Contacta a soporte@yappa.app</p>
                <p style="margin-top: 15px; color: #BDBDBD; font-size: 12px;">
                    © 2025 YAPPA - Sistema de Gestión para Tiendas
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    plain_content = f"""
    ¡Bienvenido a YAPPA!
    
    {company_name}
    
    Tu cuenta ha sido creada exitosamente.
    
    Resumen:
    - {num_stores} tienda(s) registrada(s)
    - {num_clerks} empleado(s) registrado(s)
    
    Próximos pasos:
    1. Descarga la app YAPPA
    2. Inicia sesión con las credenciales de tu tienda
    3. Explora el dashboard desde tu navegador
    
    ¿Necesitas ayuda? Contacta a soporte@yappa.app
    
    © 2025 YAPPA
    """
    
    return send_email(admin_email, subject, html_content, plain_content)



def send_stock_alert_email(merchant_email: str, store_name: str, low_stock_products: list):
    """
    Envía email con alertas de productos con stock bajo
    
    Args:
        merchant_email: Email del merchant
        store_name: Nombre de la tienda
        low_stock_products: Lista de productos con stock bajo [{name, stock, min_stock}]
    """
    
    subject = f"⚠️ Alerta de Stock Bajo - {store_name}"
    
    # Generar lista de productos en HTML
    products_html = ""
    for product in low_stock_products:
        stock = product.get('stock', product.get('quantity', 0))
        min_stock = product.get('min_stock', product.get('min_stock_alert', 10))
        product_name = product.get('name', product.get('nombre', 'Producto'))
        
        if stock == 0:
            alert_color = "#F44336"
            alert_bg = "#FFEBEE"
            alert_text = "AGOTADO"
        else:
            alert_color = "#FF9800"
            alert_bg = "#FFF3E0"
            alert_text = "STOCK BAJO"
        
        products_html += f"""
        <div style="background-color: {alert_bg}; border-left: 4px solid {alert_color}; padding: 16px; border-radius: 8px; margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="flex: 1;">
                    <div style="font-size: 16px; font-weight: 700; color: #212121; margin-bottom: 4px;">
                        {product_name}
                    </div>
                    <div style="font-size: 14px; color: #757575;">
                        Stock actual: <strong style="color: {alert_color};">{stock}</strong> | Mínimo: {min_stock}
                    </div>
                </div>
                <div style="background-color: {alert_color}; color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 700;">
                    {alert_text}
                </div>
            </div>
        </div>
        """
    
    html_content = f"""
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f5f5f5;
            }}
            .container {{
                background-color: white;
                border-radius: 12px;
                padding: 40px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }}
            .header {{
                text-align: center;
                margin-bottom: 30px;
            }}
            .logo {{
                font-size: 40px;
                font-weight: 900;
                color: #00D2FF;
            }}
            .alert-icon {{
                font-size: 48px;
                margin: 20px 0;
            }}
            .title {{
                font-size: 24px;
                font-weight: 700;
                color: #212121;
                margin-bottom: 10px;
            }}
            .store-name {{
                font-size: 16px;
                color: #757575;
                font-weight: 600;
            }}
            .message {{
                font-size: 16px;
                color: #424242;
                margin: 20px 0;
                line-height: 24px;
            }}
            .products-section {{
                margin: 30px 0;
            }}
            .section-title {{
                font-size: 18px;
                font-weight: 700;
                color: #212121;
                margin-bottom: 16px;
                border-bottom: 2px solid #FF9800;
                padding-bottom: 8px;
            }}
            .cta {{
                text-align: center;
                margin: 30px 0;
            }}
            .button {{
                display: inline-block;
                background-color: #00D2FF;
                color: white;
                padding: 14px 32px;
                text-decoration: none;
                border-radius: 12px;
                font-weight: 700;
                font-size: 16px;
            }}
            .footer {{
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #E0E0E0;
                color: #757575;
                font-size: 14px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">YAPPA</div>
                <div class="alert-icon">⚠️</div>
                <div class="title">Alerta de Stock Bajo</div>
                <div class="store-name">{store_name}</div>
            </div>
            
            <p class="message">
                Tienes <strong>{len(low_stock_products)} producto{'s' if len(low_stock_products) != 1 else ''}</strong> 
                que {'requieren' if len(low_stock_products) != 1 else 'requiere'} reposición de stock.
            </p>
            
            <div class="products-section">
                <div class="section-title">Productos Afectados</div>
                {products_html}
            </div>
            
            <div class="cta">
                <a href="#" class="button">Gestionar Inventario en YAPPA</a>
            </div>
            
            <div style="background-color: #E3F2FD; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <strong style="color: #1976D2;">💡 Recomendación:</strong>
                <p style="margin: 8px 0 0 0; color: #424242; font-size: 14px;">
                    Reabastece estos productos lo antes posible para evitar perder ventas. Puedes configurar alertas automáticas en la app de YAPPA.
                </p>
            </div>
            
            <div class="footer">
                <p>Este es un email automático de YAPPA.<br>
                Para desactivar estas alertas, ve a Configuración en la app.</p>
                <p style="margin-top: 15px; color: #BDBDBD; font-size: 12px;">
                    © 2025 YAPPA - Sistema de Gestión para Tiendas
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    plain_content = f"""
    YAPPA - Alerta de Stock Bajo
    {store_name}
    
    ⚠️ Tienes {len(low_stock_products)} producto(s) que requiere(n) reposición de stock.
    
    Productos Afectados:
    """
    
    for product in low_stock_products:
        stock = product.get('stock', product.get('quantity', 0))
        min_stock = product.get('min_stock', product.get('min_stock_alert', 10))
        product_name = product.get('name', product.get('nombre', 'Producto'))
        status = "AGOTADO" if stock == 0 else "STOCK BAJO"
        plain_content += f"\n  • {product_name}: {stock} unidades (Mín: {min_stock}) - {status}"
    
    plain_content += """
    
    💡 Recomendación:
    Reabastece estos productos lo antes posible para evitar perder ventas.
    
    Para desactivar estas alertas, ve a Configuración en la app.
    
    © 2025 YAPPA
    """
    
    return send_email(merchant_email, subject, html_content, plain_content)



def send_password_reset_email(user_email: str, reset_token: str, user_name: str = "Usuario"):
    """
    Envía email con link para resetear contraseña
    
    Args:
        user_email: Email del usuario
        reset_token: Token único para resetear la contraseña
        user_name: Nombre del usuario
    """
    
    # TODO: Cambiar este URL por el de producción
    reset_url = f"https://yappa.app/reset-password?token={reset_token}"
    
    subject = "Recupera tu contraseña de YAPPA"
    
    html_content = f"""
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f5f5f5;
            }}
            .container {{
                background-color: white;
                border-radius: 12px;
                padding: 40px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }}
            .header {{
                text-align: center;
                margin-bottom: 30px;
            }}
            .logo {{
                font-size: 48px;
                font-weight: 900;
                color: #00D2FF;
                margin-bottom: 10px;
            }}
            .title {{
                font-size: 24px;
                font-weight: 700;
                color: #212121;
                margin-bottom: 10px;
            }}
            .subtitle {{
                font-size: 16px;
                color: #757575;
            }}
            .message {{
                font-size: 16px;
                color: #424242;
                margin: 20px 0;
            }}
            .button-container {{
                text-align: center;
                margin: 30px 0;
            }}
            .button {{
                display: inline-block;
                background-color: #00D2FF;
                color: white;
                padding: 15px 40px;
                text-decoration: none;
                border-radius: 12px;
                font-weight: 700;
                font-size: 16px;
            }}
            .button:hover {{
                background-color: #00B8E6;
            }}
            .warning {{
                background-color: #FFF3E0;
                border-left: 4px solid #FF9800;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
                font-size: 14px;
                color: #424242;
            }}
            .footer {{
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #E0E0E0;
                color: #757575;
                font-size: 14px;
            }}
            .expiry {{
                background-color: #E8F5E9;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
                text-align: center;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">YAPPA</div>
                <div class="title">Recuperación de Contraseña</div>
            </div>
            
            <p class="message">Hola <strong>{user_name}</strong>,</p>
            
            <p class="message">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta en YAPPA. 
                Si fuiste tú, haz clic en el botón de abajo para crear una nueva contraseña.
            </p>
            
            <div class="button-container">
                <a href="{reset_url}" class="button">Restablecer Contraseña</a>
            </div>
            
            <div class="expiry">
                <strong>⏰ Este enlace expirará en 1 hora</strong>
            </div>
            
            <div class="warning">
                <strong>⚠️ ¿No solicitaste esto?</strong><br>
                Si no solicitaste restablecer tu contraseña, ignora este email. Tu cuenta está segura y no se realizó ningún cambio.
            </div>
            
            <p style="font-size: 14px; color: #757575; margin-top: 20px;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                <a href="{reset_url}" style="color: #00D2FF; word-break: break-all;">{reset_url}</a>
            </p>
            
            <div class="footer">
                <p>Este es un email automático de YAPPA.<br>
                Por favor, no respondas a este mensaje.</p>
                <p style="margin-top: 15px; color: #BDBDBD; font-size: 12px;">
                    © 2025 YAPPA - Sistema de Gestión para Tiendas
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    plain_content = f"""
    YAPPA - Recuperación de Contraseña
    
    Hola {user_name},
    
    Recibimos una solicitud para restablecer la contraseña de tu cuenta en YAPPA.
    
    Para crear una nueva contraseña, visita el siguiente enlace:
    {reset_url}
    
    ⏰ Este enlace expirará en 1 hora.
    
    ⚠️ ¿No solicitaste esto?
    Si no solicitaste restablecer tu contraseña, ignora este email. Tu cuenta está segura.
    
    © 2025 YAPPA
    """
    
    return send_email(user_email, subject, html_content, plain_content)


def send_daily_summary_email(admin_email: str, company_name: str, summary_data: dict):
    """
    Envía email con resumen diario de ventas y alertas
    
    Args:
        admin_email: Email del admin
        company_name: Nombre de la compañía
        summary_data: Diccionario con datos del resumen {
            'total_sales': float,
            'total_expenses': float,
            'balance': float,
            'top_products': list,
            'low_stock_alerts': list,
            'date': str
        }
    """
    
    subject = f"Resumen Diario - {company_name} - {summary_data.get('date', 'Hoy')}"
    
    # Formatear productos más vendidos
    top_products_html = ""
    if summary_data.get('top_products'):
        for i, prod in enumerate(summary_data['top_products'][:5], 1):
            top_products_html += f"""
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #E0E0E0;">{i}</td>
                <td style="padding: 10px; border-bottom: 1px solid #E0E0E0;">{prod.get('name', 'N/A')}</td>
                <td style="padding: 10px; border-bottom: 1px solid #E0E0E0; text-align: right;">{prod.get('quantity', 0)}</td>
            </tr>
            """
    else:
        top_products_html = "<tr><td colspan='3' style='padding: 20px; text-align: center; color: #757575;'>No hay ventas hoy</td></tr>"
    
    # Formatear alertas de stock bajo
    low_stock_html = ""
    if summary_data.get('low_stock_alerts'):
        for alert in summary_data['low_stock_alerts'][:5]:
            low_stock_html += f"""
            <div style="background-color: #FFF3E0; padding: 12px; border-radius: 8px; margin-bottom: 8px;">
                <strong>{alert.get('product', 'N/A')}</strong><br>
                <span style="color: #757575; font-size: 14px;">
                    Stock actual: {alert.get('stock', 0)} | Mínimo: {alert.get('min_stock', 0)}
                </span>
            </div>
            """
    else:
        low_stock_html = "<p style='color: #757575; text-align: center;'>✅ Todos los productos tienen stock suficiente</p>"
    
    balance_color = "#00D2FF" if summary_data.get('balance', 0) >= 0 else "#F44336"
    
    html_content = f"""
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 700px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f5f5f5;
            }}
            .container {{
                background-color: white;
                border-radius: 12px;
                padding: 40px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }}
            .header {{
                text-align: center;
                margin-bottom: 30px;
            }}
            .logo {{
                font-size: 40px;
                font-weight: 900;
                color: #00D2FF;
            }}
            .title {{
                font-size: 24px;
                font-weight: 700;
                color: #212121;
                margin-top: 10px;
            }}
            .date {{
                font-size: 14px;
                color: #757575;
                margin-top: 5px;
            }}
            .stats {{
                display: flex;
                justify-content: space-around;
                margin: 30px 0;
                gap: 15px;
            }}
            .stat {{
                flex: 1;
                text-align: center;
                padding: 20px;
                background: linear-gradient(135deg, #E0F7FA 0%, #B2EBF2 100%);
                border-radius: 12px;
            }}
            .stat-value {{
                font-size: 28px;
                font-weight: 900;
                color: #00D2FF;
                margin-bottom: 5px;
            }}
            .stat-label {{
                font-size: 14px;
                color: #424242;
            }}
            .section {{
                margin: 30px 0;
            }}
            .section-title {{
                font-size: 18px;
                font-weight: 700;
                color: #212121;
                margin-bottom: 15px;
                border-bottom: 2px solid #00D2FF;
                padding-bottom: 10px;
            }}
            table {{
                width: 100%;
                border-collapse: collapse;
            }}
            th {{
                background-color: #E0F7FA;
                padding: 12px;
                text-align: left;
                font-weight: 600;
                color: #212121;
            }}
            .footer {{
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #E0E0E0;
                color: #757575;
                font-size: 14px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">YAPPA</div>
                <div class="title">Resumen Diario</div>
                <div class="date">{company_name} - {summary_data.get('date', 'Hoy')}</div>
            </div>
            
            <div class="stats">
                <div class="stat">
                    <div class="stat-value">${summary_data.get('total_sales', 0):.2f}</div>
                    <div class="stat-label">Ventas</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${summary_data.get('total_expenses', 0):.2f}</div>
                    <div class="stat-label">Gastos</div>
                </div>
                <div class="stat">
                    <div class="stat-value" style="color: {balance_color};">${summary_data.get('balance', 0):.2f}</div>
                    <div class="stat-label">Balance</div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">📊 Top 5 Productos Más Vendidos</div>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 50px;">#</th>
                            <th>Producto</th>
                            <th style="width: 100px; text-align: right;">Cantidad</th>
                        </tr>
                    </thead>
                    <tbody>
                        {top_products_html}
                    </tbody>
                </table>
            </div>
            
            <div class="section">
                <div class="section-title">⚠️ Alertas de Stock Bajo</div>
                {low_stock_html}
            </div>
            
            <div class="footer">
                <p>Este resumen se envía automáticamente todos los días.<br>
                Para desactivar estas notificaciones, ve a Configuración en la app.</p>
                <p style="margin-top: 15px; color: #BDBDBD; font-size: 12px;">
                    © 2025 YAPPA - Sistema de Gestión para Tiendas
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    plain_content = f"""
    YAPPA - Resumen Diario
    {company_name} - {summary_data.get('date', 'Hoy')}
    
    Resumen del Día:
    - Ventas: ${summary_data.get('total_sales', 0):.2f}
    - Gastos: ${summary_data.get('total_expenses', 0):.2f}
    - Balance: ${summary_data.get('balance', 0):.2f}
    
    Top 5 Productos Más Vendidos:
    """
    
    if summary_data.get('top_products'):
        for i, prod in enumerate(summary_data['top_products'][:5], 1):
            plain_content += f"\n  {i}. {prod.get('name', 'N/A')} - {prod.get('quantity', 0)} unidades"
    else:
        plain_content += "\n  No hay ventas hoy"
    
    plain_content += "\n\nAlertas de Stock Bajo:\n"
    if summary_data.get('low_stock_alerts'):
        for alert in summary_data['low_stock_alerts'][:5]:
            plain_content += f"\n  • {alert.get('product', 'N/A')}: Stock actual {alert.get('stock', 0)} (Mín: {alert.get('min_stock', 0)})"
    else:
        plain_content += "\n  ✅ Todos los productos tienen stock suficiente"
    
    plain_content += "\n\n© 2025 YAPPA"
    
    return send_email(admin_email, subject, html_content, plain_content)




def send_weekly_summary_email(merchant_email: str, store_name: str, summary_data: dict):
    """
    Envía email con resumen semanal + insights de IA
    
    Args:
        merchant_email: Email del merchant
        store_name: Nombre de la tienda
        summary_data: {
            'total_sales': float,
            'total_expenses': float,
            'balance': float,
            'customer_debts': float,
            'supplier_debts': float,
            'insights': list of strings
        }
    """
    
    subject = f"📊 Resumen Semanal + Insights IA - {store_name}"
    
    balance_color = "#00D2FF" if summary_data.get('balance', 0) >= 0 else "#F44336"
    
    # Formatear insights de IA
    insights_html = ""
    if summary_data.get('insights'):
        for i, insight in enumerate(summary_data['insights'][:5], 1):
            insights_html += f"""
            <div style="background-color: #F3E5F5; padding: 16px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid #9C27B0;">
                <div style="display: flex; align-items: flex-start;">
                    <div style="background-color: #9C27B0; color: white; width: 28px; height: 28px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; margin-right: 12px; flex-shrink: 0;">
                        {i}
                    </div>
                    <div style="flex: 1; color: #424242; font-size: 15px; line-height: 22px;">
                        {insight}
                    </div>
                </div>
            </div>
            """
    else:
        insights_html = "<p style='color: #757575; text-align: center; font-style: italic;'>No hay insights disponibles esta semana</p>"
    
    html_content = f"""
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 700px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f5f5f5;
            }}
            .container {{
                background-color: white;
                border-radius: 12px;
                padding: 40px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }}
            .header {{
                text-align: center;
                margin-bottom: 30px;
            }}
            .logo {{
                font-size: 40px;
                font-weight: 900;
                color: #00D2FF;
            }}
            .title {{
                font-size: 28px;
                font-weight: 700;
                color: #212121;
                margin-top: 10px;
            }}
            .subtitle {{
                font-size: 14px;
                color: #757575;
                margin-top: 5px;
            }}
            .stats {{
                display: flex;
                justify-content: space-around;
                margin: 30px 0;
                gap: 15px;
            }}
            .stat {{
                flex: 1;
                text-align: center;
                padding: 20px;
                background: linear-gradient(135deg, #E0F7FA 0%, #B2EBF2 100%);
                border-radius: 12px;
            }}
            .stat-value {{
                font-size: 28px;
                font-weight: 900;
                color: #00D2FF;
                margin-bottom: 5px;
            }}
            .stat-label {{
                font-size: 14px;
                color: #424242;
            }}
            .debts-section {{
                display: flex;
                gap: 15px;
                margin: 20px 0;
            }}
            .debt-card {{
                flex: 1;
                padding: 16px;
                background-color: #FFF9C4;
                border-radius: 8px;
                border-left: 4px solid #FBC02D;
            }}
            .debt-title {{
                font-size: 14px;
                color: #757575;
                margin-bottom: 4px;
            }}
            .debt-value {{
                font-size: 20px;
                font-weight: 700;
                color: #F57F17;
            }}
            .section {{
                margin: 30px 0;
            }}
            .section-title {{
                font-size: 20px;
                font-weight: 700;
                color: #212121;
                margin-bottom: 15px;
                border-bottom: 2px solid #9C27B0;
                padding-bottom: 10px;
                display: flex;
                align-items: center;
            }}
            .ai-badge {{
                background: linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%);
                color: white;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 700;
                margin-left: 10px;
            }}
            .footer {{
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #E0E0E0;
                color: #757575;
                font-size: 14px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">YAPPA</div>
                <div class="title">Resumen Semanal</div>
                <div class="subtitle">{store_name}</div>
            </div>
            
            <div class="stats">
                <div class="stat">
                    <div class="stat-value">${summary_data.get('total_sales', 0):.2f}</div>
                    <div class="stat-label">Ventas</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${summary_data.get('total_expenses', 0):.2f}</div>
                    <div class="stat-label">Gastos</div>
                </div>
                <div class="stat">
                    <div class="stat-value" style="color: {balance_color};">${summary_data.get('balance', 0):.2f}</div>
                    <div class="stat-label">Balance</div>
                </div>
            </div>
            
            <div class="debts-section">
                <div class="debt-card">
                    <div class="debt-title">Por Cobrar</div>
                    <div class="debt-value">${summary_data.get('customer_debts', 0):.2f}</div>
                </div>
                <div class="debt-card">
                    <div class="debt-title">Por Pagar</div>
                    <div class="debt-value">${summary_data.get('supplier_debts', 0):.2f}</div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">
                    🤖 Insights con IA
                    <span class="ai-badge">POWERED BY AI</span>
                </div>
                {insights_html}
            </div>
            
            <div class="footer">
                <p>Este resumen se envía automáticamente cada semana.<br>
                Para cambiar tus preferencias, ve a Configuración de Alertas en la app.</p>
                <p style="margin-top: 15px; color: #BDBDBD; font-size: 12px;">
                    © 2025 YAPPA - Sistema de Gestión para Tiendas
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    plain_content = f"""
    YAPPA - Resumen Semanal
    {store_name}
    
    📊 Resumen de la Semana:
    - Ventas: ${summary_data.get('total_sales', 0):.2f}
    - Gastos: ${summary_data.get('total_expenses', 0):.2f}
    - Balance: ${summary_data.get('balance', 0):.2f}
    
    💰 Deudas:
    - Por Cobrar: ${summary_data.get('customer_debts', 0):.2f}
    - Por Pagar: ${summary_data.get('supplier_debts', 0):.2f}
    
    🤖 Insights con IA:
    """
    
    if summary_data.get('insights'):
        for i, insight in enumerate(summary_data['insights'][:5], 1):
            plain_content += f"\n  {i}. {insight}"
    else:
        plain_content += "\n  No hay insights disponibles esta semana"
    
    plain_content += "\n\n© 2025 YAPPA"
    
    return send_email(merchant_email, subject, html_content, plain_content)


def send_monthly_insights_email(merchant_email: str, store_name: str, insights_data: dict):
    """
    Envía email con insights mensuales de IA
    
    Args:
        merchant_email: Email del merchant
        store_name: Nombre de la tienda
        insights_data: {
            'insights': list of strings,
            'metrics': dict with metrics
        }
    """
    
    subject = f"🚀 Insights Mensuales IA - {store_name}"
    
    # Formatear insights
    insights_html = ""
    if insights_data.get('insights'):
        for i, insight in enumerate(insights_data['insights'], 1):
            insights_html += f"""
            <div style="background-color: #E8EAF6; padding: 20px; border-radius: 12px; margin-bottom: 16px; border-left: 4px solid #3F51B5;">
                <div style="display: flex; align-items: flex-start;">
                    <div style="background: linear-gradient(135deg, #3F51B5 0%, #303F9F 100%); color: white; width: 32px; height: 32px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; margin-right: 12px; flex-shrink: 0;">
                        {i}
                    </div>
                    <div style="flex: 1; color: #212121; font-size: 16px; line-height: 24px;">
                        {insight}
                    </div>
                </div>
            </div>
            """
    else:
        insights_html = "<p style='color: #757575; text-align: center; font-style: italic;'>No hay insights disponibles este mes</p>"
    
    html_content = f"""
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 700px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f5f5f5;
            }}
            .container {{
                background-color: white;
                border-radius: 12px;
                padding: 40px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }}
            .header {{
                text-align: center;
                margin-bottom: 30px;
                background: linear-gradient(135deg, #3F51B5 0%, #303F9F 100%);
                padding: 30px;
                border-radius: 12px;
                margin: -40px -40px 30px -40px;
            }}
            .logo {{
                font-size: 40px;
                font-weight: 900;
                color: white;
            }}
            .title {{
                font-size: 28px;
                font-weight: 700;
                color: white;
                margin-top: 10px;
            }}
            .subtitle {{
                font-size: 16px;
                color: #E8EAF6;
                margin-top: 5px;
            }}
            .ai-badge {{
                background-color: #FFD54F;
                color: #212121;
                padding: 6px 16px;
                border-radius: 20px;
                font-size: 13px;
                font-weight: 700;
                display: inline-block;
                margin-top: 10px;
            }}
            .intro {{
                font-size: 16px;
                color: #424242;
                margin-bottom: 30px;
                text-align: center;
                line-height: 24px;
            }}
            .section {{
                margin: 30px 0;
            }}
            .section-title {{
                font-size: 20px;
                font-weight: 700;
                color: #212121;
                margin-bottom: 20px;
            }}
            .footer {{
                text-align: center;
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #E0E0E0;
                color: #757575;
                font-size: 14px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">YAPPA</div>
                <div class="title">Insights Mensuales</div>
                <div class="subtitle">{store_name}</div>
                <div class="ai-badge">🤖 POWERED BY AI</div>
            </div>
            
            <p class="intro">
                Hemos analizado el comportamiento de tu negocio durante el último mes. 
                Aquí están nuestras recomendaciones principales para mejorar tu rentabilidad.
            </p>
            
            <div class="section">
                <div class="section-title">📈 Recomendaciones Estratégicas</div>
                {insights_html}
            </div>
            
            <div style="background-color: #E8F5E9; padding: 20px; border-radius: 12px; margin: 30px 0;">
                <div style="font-size: 18px; font-weight: 700; color: #2E7D32; margin-bottom: 10px;">
                    💡 ¿Necesitas más análisis?
                </div>
                <div style="font-size: 14px; color: #424242; line-height: 22px;">
                    Estos insights se generan automáticamente cada mes. Para obtener recomendaciones semanales adicionales, 
                    asegúrate de tener activadas las alertas semanales en tu configuración.
                </div>
            </div>
            
            <div class="footer">
                <p>Este análisis se envía automáticamente el primer día de cada mes.<br>
                Para cambiar tus preferencias, ve a Configuración de Alertas en la app.</p>
                <p style="margin-top: 15px; color: #BDBDBD; font-size: 12px;">
                    © 2025 YAPPA - Sistema de Gestión para Tiendas
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    plain_content = f"""
    YAPPA - Insights Mensuales IA
    {store_name}
    
    📈 Recomendaciones Estratégicas del Mes:
    """
    
    if insights_data.get('insights'):
        for i, insight in enumerate(insights_data['insights'], 1):
            plain_content += f"\n  {i}. {insight}"
    else:
        plain_content += "\n  No hay insights disponibles este mes"
    
    plain_content += """
    
    💡 ¿Necesitas más análisis?
    Estos insights se generan automáticamente cada mes.
    
    © 2025 YAPPA
    """
    
    return send_email(merchant_email, subject, html_content, plain_content)

