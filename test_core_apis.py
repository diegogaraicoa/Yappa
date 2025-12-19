#!/usr/bin/env python3
"""
Test core sales and expenses API endpoints directly
"""

import requests
import json
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')

# Configuration
BACKEND_URL = os.getenv('EXPO_PUBLIC_BACKEND_URL', 'https://tienda-manager-3.preview.emergentagent.com') + "/api"
TEST_EMAIL = "maria.gonzalez@test.com"
TEST_PASSWORD = "MiTienda2025!"

def test_core_apis():
    """Test core sales and expenses APIs"""
    session = requests.Session()
    
    print("🔐 Logging in...")
    login_data = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }
    response = session.post(f"{BACKEND_URL}/auth/login", json=login_data)
    if response.status_code != 200:
        print(f"❌ Login failed: {response.text}")
        return False
    
    data = response.json()
    auth_token = data["access_token"]
    store_id = data["user"]["store_id"]
    session.headers.update({"Authorization": f"Bearer {auth_token}"})
    
    print(f"✅ Logged in successfully - Store ID: {store_id}")
    
    # Test direct sale creation
    print("\n💰 Testing direct sale creation...")
    sale_data = {
        "products": [
            {
                "product_id": "000000000000000000000000",  # Placeholder ID
                "product_name": "Test Product",
                "quantity": 2,
                "price": 1.0,
                "total": 2.0
            }
        ],
        "total": 2.0,
        "payment_method": "Efectivo",
        "paid": True,
        "customer_name": "Juan Test",
        "notes": "Test sale via API",
        "with_inventory": False
    }
    
    response = session.post(f"{BACKEND_URL}/sales", json=sale_data)
    print(f"Sale creation response: {response.status_code}")
    if response.status_code == 200:
        print("✅ Direct sale creation works!")
        sale_result = response.json()
        print(f"   Sale ID: {sale_result.get('_id')}")
    else:
        print(f"❌ Direct sale creation failed: {response.text}")
        return False
    
    # Test direct expense creation
    print("\n💸 Testing direct expense creation...")
    expense_data = {
        "category": "Servicios",
        "amount": 50.0,
        "supplier_name": "Test Supplier",
        "payment_method": "Efectivo",
        "paid": True,
        "notes": "Test expense via API"
    }
    
    response = session.post(f"{BACKEND_URL}/expenses", json=expense_data)
    print(f"Expense creation response: {response.status_code}")
    if response.status_code == 200:
        print("✅ Direct expense creation works!")
        expense_result = response.json()
        print(f"   Expense ID: {expense_result.get('_id')}")
    else:
        print(f"❌ Direct expense creation failed: {response.text}")
        return False
    
    # Verify records exist
    print("\n📊 Verifying records in database...")
    
    # Check sales
    response = session.get(f"{BACKEND_URL}/sales")
    if response.status_code == 200:
        sales = response.json()
        print(f"✅ Found {len(sales)} sales in database")
        for sale in sales[-2:]:  # Show last 2
            print(f"   - ${sale['total']} - {sale['customer_name']} - {sale['payment_method']}")
    
    # Check expenses
    response = session.get(f"{BACKEND_URL}/expenses")
    if response.status_code == 200:
        expenses = response.json()
        print(f"✅ Found {len(expenses)} expenses in database")
        for expense in expenses[-2:]:  # Show last 2
            print(f"   - ${expense['amount']} - {expense['category']} - {expense['payment_method']}")
    
    return True

if __name__ == "__main__":
    success = test_core_apis()
    if success:
        print("\n🎉 Core APIs are working correctly!")
    else:
        print("\n❌ Core APIs have issues!")