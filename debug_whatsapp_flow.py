#!/usr/bin/env python3
"""
Debug WhatsApp AI Flow - Focus on database registration
This test bypasses Twilio and focuses on the core conversation logic
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://user-flow.preview.emergentagent.com/api"
TEST_USER_PHONE = "+593992913093"
TEST_EMAIL = "debug@example.com"
TEST_PASSWORD = "debugpass123"
TEST_STORE_NAME = "Debug Store"

class WhatsAppDebugger:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.user_id = None
        self.store_id = None
        
    def log(self, message):
        """Log with timestamp"""
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")
        
    def setup_user(self):
        """Setup test user"""
        self.log("🔐 Setting up debug user...")
        
        # Try login first
        try:
            login_data = {
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            }
            response = self.session.post(f"{BACKEND_URL}/auth/login", json=login_data)
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data["access_token"]
                self.user_id = data["user"]["id"]
                self.store_id = data["user"]["store_id"]
                self.session.headers.update({"Authorization": f"Bearer {self.auth_token}"})
                self.log("✅ Logged in with existing user")
                return True
        except:
            pass
            
        # Register new user
        register_data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "store_name": TEST_STORE_NAME,
            "whatsapp_number": TEST_USER_PHONE
        }
        
        response = self.session.post(f"{BACKEND_URL}/auth/register", json=register_data)
        
        if response.status_code == 200:
            data = response.json()
            self.auth_token = data["access_token"]
            self.user_id = data["user"]["id"]
            self.store_id = data["user"]["store_id"]
            self.session.headers.update({"Authorization": f"Bearer {self.auth_token}"})
            self.log("✅ User registered successfully")
            return True
        else:
            self.log(f"❌ Registration failed: {response.status_code} - {response.text}")
            return False
    
    def create_test_products(self):
        """Create test products"""
        self.log("📦 Creating test products...")
        
        products = [
            {"name": "agua", "price": 1.0, "cost": 0.5, "quantity": 100},
            {"name": "coca cola", "price": 2.5, "cost": 1.8, "quantity": 50}
        ]
        
        for product in products:
            response = self.session.post(f"{BACKEND_URL}/products", json=product)
            if response.status_code == 200:
                self.log(f"✅ Created product: {product['name']}")
            else:
                self.log(f"❌ Failed to create product {product['name']}: {response.text}")
    
    def send_webhook_message(self, message):
        """Send message to webhook and return response details"""
        self.log(f"📱 Sending: '{message}'")
        
        form_data = {
            "From": f"whatsapp:{TEST_USER_PHONE}",
            "Body": message,
            "NumMedia": "0"
        }
        
        response = self.session.post(f"{BACKEND_URL}/whatsapp/webhook", data=form_data)
        
        self.log(f"📤 Webhook response: {response.status_code}")
        return response.status_code == 200
    
    def get_sales_count(self):
        """Get current sales count"""
        response = self.session.get(f"{BACKEND_URL}/sales")
        if response.status_code == 200:
            sales = response.json()
            return len(sales)
        return 0
    
    def get_expenses_count(self):
        """Get current expenses count"""
        response = self.session.get(f"{BACKEND_URL}/expenses")
        if response.status_code == 200:
            expenses = response.json()
            return len(expenses)
        return 0
    
    def get_latest_sales(self, count=5):
        """Get latest sales"""
        response = self.session.get(f"{BACKEND_URL}/sales")
        if response.status_code == 200:
            sales = response.json()
            return sales[:count]  # Already sorted by date desc
        return []
    
    def get_latest_expenses(self, count=5):
        """Get latest expenses"""
        response = self.session.get(f"{BACKEND_URL}/expenses")
        if response.status_code == 200:
            expenses = response.json()
            return expenses[:count]  # Already sorted by date desc
        return []
    
    def test_exact_sale_flow(self):
        """Test the exact sale flow from the review request"""
        self.log("\n🧪 TESTING EXACT SALE FLOW: 'venta' → 'vendí 2 aguas a Juan por $2 total' → 'fue en efectivo y ya pagó' → 'sí'")
        self.log("=" * 80)
        
        # Get initial count
        initial_count = self.get_sales_count()
        self.log(f"📊 Initial sales count: {initial_count}")
        
        # Step 1: Start sale
        if not self.send_webhook_message("venta"):
            self.log("❌ Failed at step 1")
            return False
        time.sleep(2)
        
        # Step 2: Provide complete sale info
        if not self.send_webhook_message("vendí 2 aguas a Juan por $2 total"):
            self.log("❌ Failed at step 2")
            return False
        time.sleep(2)
        
        # Step 3: Payment info
        if not self.send_webhook_message("fue en efectivo y ya pagó"):
            self.log("❌ Failed at step 3")
            return False
        time.sleep(2)
        
        # Step 4: Confirm
        if not self.send_webhook_message("sí"):
            self.log("❌ Failed at step 4")
            return False
        time.sleep(3)  # Give more time for processing
        
        # Check results
        final_count = self.get_sales_count()
        self.log(f"📊 Final sales count: {final_count}")
        
        if final_count > initial_count:
            self.log("✅ SALE CREATED SUCCESSFULLY!")
            latest_sales = self.get_latest_sales(1)
            if latest_sales:
                sale = latest_sales[0]
                self.log(f"   Sale ID: {sale.get('_id')}")
                self.log(f"   Total: ${sale.get('total')}")
                self.log(f"   Customer: {sale.get('customer_name')}")
                self.log(f"   Payment: {sale.get('payment_method')}")
                self.log(f"   Paid: {sale.get('paid')}")
                self.log(f"   Products: {len(sale.get('products', []))}")
                return True
        else:
            self.log("❌ NO SALE WAS CREATED")
            return False
    
    def test_exact_expense_flow(self):
        """Test the exact expense flow from the review request"""
        self.log("\n🧪 TESTING EXACT EXPENSE FLOW: 'gasto' → 'pagué $50 de luz' → 'efectivo, servicios' → 'sí'")
        self.log("=" * 80)
        
        # Get initial count
        initial_count = self.get_expenses_count()
        self.log(f"📊 Initial expenses count: {initial_count}")
        
        # Step 1: Start expense
        if not self.send_webhook_message("gasto"):
            self.log("❌ Failed at step 1")
            return False
        time.sleep(2)
        
        # Step 2: Provide expense info
        if not self.send_webhook_message("pagué $50 de luz"):
            self.log("❌ Failed at step 2")
            return False
        time.sleep(2)
        
        # Step 3: Payment and category
        if not self.send_webhook_message("efectivo, servicios"):
            self.log("❌ Failed at step 3")
            return False
        time.sleep(2)
        
        # Step 4: Confirm
        if not self.send_webhook_message("sí"):
            self.log("❌ Failed at step 4")
            return False
        time.sleep(3)  # Give more time for processing
        
        # Check results
        final_count = self.get_expenses_count()
        self.log(f"📊 Final expenses count: {final_count}")
        
        if final_count > initial_count:
            self.log("✅ EXPENSE CREATED SUCCESSFULLY!")
            latest_expenses = self.get_latest_expenses(1)
            if latest_expenses:
                expense = latest_expenses[0]
                self.log(f"   Expense ID: {expense.get('_id')}")
                self.log(f"   Amount: ${expense.get('amount')}")
                self.log(f"   Category: {expense.get('category')}")
                self.log(f"   Payment: {expense.get('payment_method')}")
                self.log(f"   Paid: {expense.get('paid')}")
                self.log(f"   Notes: {expense.get('notes')}")
                return True
        else:
            self.log("❌ NO EXPENSE WAS CREATED")
            return False
    
    def test_manual_sale_creation(self):
        """Test manual sale creation to verify API works"""
        self.log("\n🧪 TESTING MANUAL SALE CREATION (API verification)")
        self.log("=" * 60)
        
        sale_data = {
            "products": [
                {
                    "product_id": "",  # Empty for generic product
                    "product_name": "agua",
                    "quantity": 2,
                    "price": 1.0,
                    "total": 2.0
                }
            ],
            "total": 2.0,
            "payment_method": "Efectivo",
            "paid": True,
            "customer_name": "Juan",
            "notes": "Manual test sale"
        }
        
        response = self.session.post(f"{BACKEND_URL}/sales", json=sale_data)
        
        if response.status_code == 200:
            sale = response.json()
            self.log("✅ Manual sale created successfully!")
            self.log(f"   Sale ID: {sale.get('_id')}")
            return True
        else:
            self.log(f"❌ Manual sale creation failed: {response.status_code} - {response.text}")
            return False
    
    def run_debug_tests(self):
        """Run all debug tests"""
        self.log("🚀 Starting WhatsApp AI Debug Tests")
        self.log("=" * 60)
        
        # Setup
        if not self.setup_user():
            self.log("❌ CRITICAL: Could not setup user")
            return False
        
        self.create_test_products()
        
        # Test manual API first
        manual_api_works = self.test_manual_sale_creation()
        
        # Test WhatsApp flows
        sale_flow_works = self.test_exact_sale_flow()
        expense_flow_works = self.test_exact_expense_flow()
        
        # Summary
        self.log("\n" + "=" * 60)
        self.log("📊 DEBUG TEST RESULTS")
        self.log("=" * 60)
        self.log(f"Manual Sale API: {'✅ PASS' if manual_api_works else '❌ FAIL'}")
        self.log(f"WhatsApp Sale Flow: {'✅ PASS' if sale_flow_works else '❌ FAIL'}")
        self.log(f"WhatsApp Expense Flow: {'✅ PASS' if expense_flow_works else '❌ FAIL'}")
        
        if manual_api_works and not (sale_flow_works or expense_flow_works):
            self.log("\n🔍 ANALYSIS: Manual API works but WhatsApp flows don't.")
            self.log("   This indicates the issue is in the conversation service logic,")
            self.log("   not in the core sale/expense registration APIs.")
        elif sale_flow_works and expense_flow_works:
            self.log("\n🎉 SUCCESS: All flows working correctly!")
        else:
            self.log("\n⚠️ MIXED RESULTS: Some components working, others not.")
        
        return sale_flow_works and expense_flow_works

def main():
    """Main debug execution"""
    debugger = WhatsAppDebugger()
    success = debugger.run_debug_tests()
    
    if success:
        print("\n✅ DEBUG COMPLETED - WhatsApp AI flows working!")
        exit(0)
    else:
        print("\n❌ DEBUG COMPLETED - Issues found in WhatsApp AI flows")
        exit(1)

if __name__ == "__main__":
    main()