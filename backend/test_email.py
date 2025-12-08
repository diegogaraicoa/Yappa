"""
Script de prueba para verificar el envío de emails con SendGrid
"""

import sys
import os
sys.path.append('/app/backend')

from services.email_service import send_clerk_pin_email, send_welcome_admin_email, send_email
from dotenv import load_dotenv

load_dotenv()

def test_simple_email():
    """Prueba de envío de email simple"""
    print("\n🧪 Probando envío de email simple...")
    try:
        result = send_email(
            to_email="dgaraicoa@hotmail.com",
            subject="Test de YAPPA - Email Service",
            html_content="<h1>¡Funciona!</h1><p>El servicio de email de YAPPA está funcionando correctamente.</p>",
            plain_content="¡Funciona! El servicio de email de YAPPA está funcionando correctamente."
        )
        if result:
            print("✅ Email simple enviado exitosamente")
        else:
            print("❌ Error al enviar email simple")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

def test_clerk_pin_email():
    """Prueba de envío de PIN a un clerk"""
    print("\n🧪 Probando envío de PIN a clerk...")
    try:
        result = send_clerk_pin_email(
            clerk_email="dgaraicoa@hotmail.com",
            clerk_name="Juan Pérez",
            pin="1234",
            store_name="Tienda Centro"
        )
        if result:
            print("✅ Email de PIN enviado exitosamente")
        else:
            print("❌ Error al enviar email de PIN")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

def test_welcome_admin_email():
    """Prueba de envío de email de bienvenida al admin"""
    print("\n🧪 Probando envío de email de bienvenida...")
    try:
        result = send_welcome_admin_email(
            admin_email="dgaraicoa@hotmail.com",
            company_name="Mi Empresa Test",
            num_stores=3,
            num_clerks=8
        )
        if result:
            print("✅ Email de bienvenida enviado exitosamente")
        else:
            print("❌ Error al enviar email de bienvenida")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    print("="*60)
    print("🚀 PRUEBA DE SERVICIO DE EMAIL - YAPPA")
    print("="*60)
    
    # Verificar que la API Key esté configurada
    api_key = os.getenv('SENDGRID_API_KEY')
    if not api_key:
        print("❌ SENDGRID_API_KEY no está configurada en .env")
        sys.exit(1)
    
    print(f"✅ API Key configurada: {api_key[:10]}...")
    print(f"✅ From Email: {os.getenv('SENDGRID_FROM_EMAIL')}")
    
    # Ejecutar pruebas
    test_simple_email()
    test_clerk_pin_email()
    test_welcome_admin_email()
    
    print("\n" + "="*60)
    print("✅ PRUEBAS COMPLETADAS")
    print("="*60)
    print("\n⚠️ Revisa tu email: dgaraicoa@hotmail.com")
    print("Deberías recibir 3 emails:")
    print("  1. Email de prueba simple")
    print("  2. Email con PIN de clerk")
    print("  3. Email de bienvenida al admin")
    print()
