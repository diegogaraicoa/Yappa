#!/usr/bin/env python3
"""
Quick test to see debug output from WhatsApp conversation
"""

import requests
import time
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')

# Configuration
BACKEND_URL = os.getenv('EXPO_PUBLIC_BACKEND_URL', 'https://streetbiz.preview.emergentagent.com') + "/api"
TEST_USER_PHONE = "+593992913093"

def send_whatsapp_message(message):
    """Send a WhatsApp message to the webhook"""
    form_data = {
        "From": f"whatsapp:{TEST_USER_PHONE}",
        "Body": message,
        "NumMedia": "0"
    }
    
    response = requests.post(f"{BACKEND_URL}/whatsapp/webhook", data=form_data)
    print(f"Sent: '{message}' -> Status: {response.status_code}")
    return response.status_code == 200

def main():
    print("🧪 Quick WhatsApp test with debug output")
    
    # Test a simple sale flow
    print("\n1. Starting sale...")
    send_whatsapp_message("venta")
    time.sleep(3)
    
    print("\n2. Providing sale details...")
    send_whatsapp_message("vendí 2 aguas a Juan por $2 total")
    time.sleep(3)
    
    print("\n3. Providing payment...")
    send_whatsapp_message("efectivo y ya pagó")
    time.sleep(3)
    
    print("\n4. Confirming...")
    send_whatsapp_message("sí")
    time.sleep(3)
    
    print("\n✅ Test complete. Check backend logs for debug output.")

if __name__ == "__main__":
    main()