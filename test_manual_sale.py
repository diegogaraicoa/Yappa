#!/usr/bin/env python3
"""
Test manual sale registration to verify the core functionality works
"""

import requests
import json
from datetime import datetime

# Configuration
BACKEND_URL = "https://smarte-reports.preview.emergentagent.com/api"
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "testpass123"

def test_manual_sale_registration():
    """Test manual sale registration via API to verify core functionality"""
    
    print("🧪 Testing Manual Sale Registration")
    print("=" * 50)
    
    # Login
    session = requests.Session()
    login_data = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }
    response = session.post(f"{BACKEND_URL}/auth/login", json=login_data)
    if response.status_code != 200:
        print("❌ Login failed")
        return False
    
    data = response.json()
    auth_token = data["access_token"]
    session.headers.update({"Authorization": f"Bearer {auth_token}"})
    print("✅ Logged in successfully")
    
    # Get products
    products_response = session.get(f"{BACKEND_URL}/products")
    if products_response.status_code != 200:
        print("❌ Failed to get products")
        return False
    
    products = products_response.json()
    if not products:
        print("❌ No products found")
        return False
    
    agua_product = None
    for product in products:
        if product["name"].lower() == "agua":
            agua_product = product
            break
    
    if not agua_product:
        print("❌ Agua product not found")
        return False
    
    print(f"✅ Found Agua product: {agua_product['name']} - ${agua_product['price']}")
    
    # Create a manual sale
    sale_data = {
        "products": [
            {
                "product_id": agua_product["_id"],
                "product_name": agua_product["name"],
                "quantity": 2,
                "price": agua_product["price"],
                "total": 2 * agua_product["price"]
            }
        ],
        "total": 2 * agua_product["price"],
        "payment_method": "Efectivo",
        "paid": True,
        "customer_name": "Juan",
        "notes": "Test sale via API",
        "with_inventory": True
    }
    
    response = session.post(f"{BACKEND_URL}/sales", json=sale_data)
    if response.status_code == 200:
        sale = response.json()
        print(f"✅ Sale created successfully: ID {sale['_id']}, Total: ${sale['total']}")
        return True
    else:
        print(f"❌ Sale creation failed: {response.status_code} - {response.text}")
        return False

if __name__ == "__main__":
    success = test_manual_sale_registration()
    if success:
        print("\n✅ Manual sale registration works - Core functionality is OK")
        print("❌ Issue is in WhatsApp conversation data extraction from Claude")
    else:
        print("\n❌ Manual sale registration failed - Core functionality has issues")