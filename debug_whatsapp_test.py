#!/usr/bin/env python3
"""
Debug WhatsApp AI - Check what Claude is actually responding
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://join-onboard.preview.emergentagent.com/api"
TEST_USER_PHONE = "+593992913093"

def debug_conversation_flow():
    """Debug the conversation flow to see what's happening"""
    
    print("🔍 DEBUGGING WHATSAPP CONVERSATION FLOW")
    print("=" * 60)
    
    # Register user first
    session = requests.Session()
    
    # Try to login
    login_data = {
        "email": "test@example.com",
        "password": "testpass123"
    }
    response = session.post(f"{BACKEND_URL}/auth/login", json=login_data)
    if response.status_code == 200:
        data = response.json()
        auth_token = data["access_token"]
        session.headers.update({"Authorization": f"Bearer {auth_token}"})
        print("✅ Logged in successfully")
    else:
        print("❌ Login failed")
        return
    
    # Test conversation step by step
    messages = [
        "venta",
        "vendí 2 aguas a Juan por $2 total",
        "fue en efectivo y ya pagó",
        "sí"
    ]
    
    for i, message in enumerate(messages, 1):
        print(f"\n--- STEP {i}: Sending '{message}' ---")
        
        # Send message to webhook
        form_data = {
            "From": f"whatsapp:{TEST_USER_PHONE}",
            "Body": message,
            "NumMedia": "0"
        }
        
        response = session.post(f"{BACKEND_URL}/whatsapp/webhook", data=form_data)
        print(f"Webhook Status: {response.status_code}")
        
        # Wait a bit for processing
        time.sleep(2)
        
        # Check if any sales were created
        sales_response = session.get(f"{BACKEND_URL}/sales")
        if sales_response.status_code == 200:
            sales = sales_response.json()
            whatsapp_sales = [s for s in sales if "WhatsApp" in s.get("notes", "")]
            print(f"WhatsApp Sales Found: {len(whatsapp_sales)}")
            if whatsapp_sales:
                print(f"Latest Sale: {whatsapp_sales[-1]}")
        
        time.sleep(1)
    
    print("\n" + "=" * 60)
    print("🔍 FINAL DATABASE CHECK")
    
    # Final check
    sales_response = session.get(f"{BACKEND_URL}/sales")
    if sales_response.status_code == 200:
        sales = sales_response.json()
        whatsapp_sales = [s for s in sales if "WhatsApp" in s.get("notes", "")]
        print(f"Total WhatsApp Sales: {len(whatsapp_sales)}")
        for sale in whatsapp_sales:
            print(f"Sale ID: {sale.get('_id')}, Total: ${sale.get('total')}, Products: {len(sale.get('products', []))}")

if __name__ == "__main__":
    debug_conversation_flow()