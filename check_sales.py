#!/usr/bin/env python3
"""
Check what sales are actually in the database
"""

import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')

# Configuration
BACKEND_URL = os.getenv('EXPO_PUBLIC_BACKEND_URL', 'https://user-flow.preview.emergentagent.com') + "/api"
TEST_EMAIL = "maria.gonzalez@test.com"
TEST_PASSWORD = "MiTienda2025!"

def main():
    session = requests.Session()
    
    # Login
    login_data = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    }
    response = session.post(f"{BACKEND_URL}/auth/login", json=login_data)
    if response.status_code != 200:
        print(f"❌ Login failed: {response.text}")
        return
    
    data = response.json()
    auth_token = data["access_token"]
    session.headers.update({"Authorization": f"Bearer {auth_token}"})
    
    # Get all sales
    response = session.get(f"{BACKEND_URL}/sales")
    if response.status_code == 200:
        sales = response.json()
        print(f"📊 Found {len(sales)} total sales:")
        
        for i, sale in enumerate(sales):
            print(f"\n--- Sale {i+1} ---")
            print(f"ID: {sale.get('_id')}")
            print(f"Total: ${sale.get('total')}")
            print(f"Customer: {sale.get('customer_name')}")
            print(f"Payment: {sale.get('payment_method')}")
            print(f"Paid: {sale.get('paid')}")
            print(f"Notes: {sale.get('notes')}")
            print(f"With Inventory: {sale.get('with_inventory')}")
            print(f"Products: {len(sale.get('products', []))}")
            for product in sale.get('products', []):
                print(f"  - {product.get('product_name')}: {product.get('quantity')} x ${product.get('price')}")
    
    # Get all expenses
    response = session.get(f"{BACKEND_URL}/expenses")
    if response.status_code == 200:
        expenses = response.json()
        print(f"\n📊 Found {len(expenses)} total expenses:")
        
        for i, expense in enumerate(expenses):
            print(f"\n--- Expense {i+1} ---")
            print(f"ID: {expense.get('_id')}")
            print(f"Amount: ${expense.get('amount')}")
            print(f"Category: {expense.get('category')}")
            print(f"Payment: {expense.get('payment_method')}")
            print(f"Paid: {expense.get('paid')}")
            print(f"Notes: {expense.get('notes')}")

if __name__ == "__main__":
    main()