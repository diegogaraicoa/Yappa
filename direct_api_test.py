#!/usr/bin/env python3
"""
Direct API Test - Test core sale/expense registration without WhatsApp
"""

import requests
import json
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/backend/.env')
load_dotenv('/app/frontend/.env')

# Configuration from environment
BACKEND_URL = os.getenv('EXPO_PUBLIC_BACKEND_URL', 'https://ops-central-7.preview.emergentagent.com') + "/api"
TEST_EMAIL = "direct.test@test.com"
TEST_PASSWORD = "DirectTest2025!"
TEST_STORE_NAME = "Direct Test Store"

def log(message):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")

def test_direct_apis():
    """Test core sale and expense APIs directly"""
    session = requests.Session()
    
    # Register user
    log("🔐 Registering test user...")
    register_data = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
        "store_name": TEST_STORE_NAME,
        "whatsapp_number": "+593999888777"
    }
    
    response = session.post(f"{BACKEND_URL}/auth/register", json=register_data)
    if response.status_code != 200:
        log(f"❌ Registration failed: {response.status_code} - {response.text}")
        return False
    
    data = response.json()
    auth_token = data["access_token"]
    store_id = data["user"]["store_id"]
    session.headers.update({"Authorization": f"Bearer {auth_token}"})
    log("✅ User registered successfully")
    
    # Create test product
    log("📦 Creating test product...")
    product_data = {
        "name": "Test Agua",
        "quantity": 100.0,
        "price": 1.0,
        "cost": 0.7
    }
    
    response = session.post(f"{BACKEND_URL}/products", json=product_data)
    if response.status_code != 200:
        log(f"❌ Product creation failed: {response.status_code} - {response.text}")
        return False
    
    product = response.json()
    product_id = product["_id"]
    log(f"✅ Product created: {product['name']} (ID: {product_id})")
    
    # Test direct sale creation
    log("💰 Testing direct sale creation...")
    sale_data = {
        "products": [
            {
                "product_id": product_id,
                "product_name": "Test Agua",
                "quantity": 2,
                "price": 1.0,
                "total": 2.0
            }
        ],
        "total": 2.0,
        "payment_method": "Efectivo",
        "paid": True,
        "customer_name": "Juan Test",
        "notes": "Direct API test sale",
        "with_inventory": True
    }
    
    response = session.post(f"{BACKEND_URL}/sales", json=sale_data)
    if response.status_code != 200:
        log(f"❌ Sale creation failed: {response.status_code} - {response.text}")
        return False
    
    sale = response.json()
    log(f"✅ Sale created successfully: ID {sale['_id']}, Total: ${sale['total']}")
    
    # Test direct expense creation
    log("💸 Testing direct expense creation...")
    expense_data = {
        "category": "Servicios",
        "amount": 50.0,
        "payment_method": "Efectivo",
        "paid": True,
        "notes": "Direct API test expense - luz",
        "supplier_name": "Test Supplier"
    }
    
    response = session.post(f"{BACKEND_URL}/expenses", json=expense_data)
    if response.status_code != 200:
        log(f"❌ Expense creation failed: {response.status_code} - {response.text}")
        return False
    
    expense = response.json()
    log(f"✅ Expense created successfully: ID {expense['_id']}, Amount: ${expense['amount']}")
    
    # Verify records exist
    log("🔍 Verifying records in database...")
    
    # Check sales
    response = session.get(f"{BACKEND_URL}/sales")
    if response.status_code == 200:
        sales = response.json()
        log(f"✅ Found {len(sales)} sales in database")
    else:
        log(f"❌ Failed to fetch sales: {response.status_code}")
        return False
    
    # Check expenses
    response = session.get(f"{BACKEND_URL}/expenses")
    if response.status_code == 200:
        expenses = response.json()
        log(f"✅ Found {len(expenses)} expenses in database")
    else:
        log(f"❌ Failed to fetch expenses: {response.status_code}")
        return False
    
    log("🎉 DIRECT API TEST PASSED - Core functionality working!")
    return True

if __name__ == "__main__":
    if test_direct_apis():
        print("✅ DIRECT API TEST SUCCESSFUL")
        exit(0)
    else:
        print("❌ DIRECT API TEST FAILED")
        exit(1)