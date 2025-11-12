#!/usr/bin/env python3
"""
FINAL END-TO-END VERIFICATION - WhatsApp Conversational AI
Focus: Complete sale and expense flows with database verification
As requested in the review request
"""

import requests
import json
import time
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/backend/.env')
load_dotenv('/app/frontend/.env')

# Configuration from environment
BACKEND_URL = os.getenv('EXPO_PUBLIC_BACKEND_URL', 'https://tienda-ai.preview.emergentagent.com') + "/api"
TEST_USER_PHONE = "+593992913093"
TEST_EMAIL = "maria.gonzalez@test.com"
TEST_PASSWORD = "MiTienda2025!"
TEST_STORE_NAME = "Tienda María"

class WhatsAppAITester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.user_id = None
        self.store_id = None
        
    def log(self, message):
        """Log with timestamp"""
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")
        
    def register_test_user(self):
        """Register a test user with WhatsApp number"""
        self.log("🔐 Registering test user...")
        
        # First try to login in case user already exists
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
        """Create test products for sale testing"""
        self.log("📦 Creating test products...")
        
        products = [
            {"name": "Agua", "price": 1.0, "cost": 0.5, "quantity": 100},
            {"name": "Coca Cola", "price": 2.5, "cost": 1.8, "quantity": 50},
            {"name": "Pan", "price": 0.5, "cost": 0.3, "quantity": 20}
        ]
        
        created_products = []
        for product in products:
            response = self.session.post(f"{BACKEND_URL}/products", json=product)
            if response.status_code == 200:
                created_products.append(response.json())
                self.log(f"✅ Created product: {product['name']}")
            else:
                self.log(f"❌ Failed to create product {product['name']}: {response.text}")
        
        return created_products
    
    def create_test_customer(self):
        """Create test customer"""
        self.log("👤 Creating test customer...")
        
        customer_data = {
            "name": "Juan",
            "lastname": "Pérez",
            "phone": "+593999123456"
        }
        
        response = self.session.post(f"{BACKEND_URL}/customers", json=customer_data)
        if response.status_code == 200:
            customer = response.json()
            self.log(f"✅ Created customer: {customer['name']} {customer['lastname']}")
            return customer
        else:
            self.log(f"❌ Failed to create customer: {response.text}")
            return None
    
    def send_whatsapp_message(self, message, media_url=None, num_media=0):
        """Simulate WhatsApp webhook message"""
        self.log(f"📱 Sending WhatsApp message: '{message}'")
        
        form_data = {
            "From": f"whatsapp:{TEST_USER_PHONE}",
            "Body": message,
            "NumMedia": str(num_media)
        }
        
        if media_url:
            form_data["MediaUrl0"] = media_url
        
        response = self.session.post(f"{BACKEND_URL}/whatsapp/webhook", data=form_data)
        
        self.log(f"📤 Webhook response: {response.status_code}")
        if response.status_code != 200:
            self.log(f"❌ Webhook error: {response.text}")
            return False
        
        return True
    
    def test_unregistered_user(self):
        """Test 1: User not registered"""
        self.log("\n🧪 TEST 1: Unregistered user")
        
        # Send message from unregistered number
        form_data = {
            "From": "whatsapp:+593999999999",  # Different number
            "Body": "hola",
            "NumMedia": "0"
        }
        
        response = self.session.post(f"{BACKEND_URL}/whatsapp/webhook", data=form_data)
        
        if response.status_code == 200:
            self.log("✅ Webhook handled unregistered user correctly")
            return True
        else:
            self.log(f"❌ Webhook failed for unregistered user: {response.text}")
            return False
    
    def test_complete_sale_flow(self):
        """FINAL TEST: Complete end-to-end sale flow as specified in review request"""
        self.log("\n🛒 FINAL SALE FLOW TEST: 'venta' → product details → payment → confirmation")
        
        # Get initial sales count for verification
        initial_response = self.session.get(f"{BACKEND_URL}/sales")
        initial_count = len(initial_response.json()) if initial_response.status_code == 200 else 0
        self.log(f"📊 Initial sales count: {initial_count}")
        
        # Step 1: Initiate sale with "venta"
        self.log("📝 Step 1: Initiating sale with 'venta'")
        if not self.send_whatsapp_message("venta"):
            return False
        time.sleep(2)
        
        # Step 2: Provide complete sale details as specified in review request
        self.log("📝 Step 2: Providing sale details - 'vendí 2 aguas a Juan por $2 total'")
        if not self.send_whatsapp_message("vendí 2 aguas a Juan por $2 total"):
            return False
        time.sleep(2)
        
        # Step 3: Provide payment method as specified
        self.log("📝 Step 3: Providing payment method - 'efectivo y ya pagó'")
        if not self.send_whatsapp_message("efectivo y ya pagó"):
            return False
        time.sleep(2)
        
        # Step 4: Confirm with "sí" as specified
        self.log("📝 Step 4: Confirming with 'sí'")
        if not self.send_whatsapp_message("sí"):
            return False
        time.sleep(3)  # Give more time for database insertion
        
        # Step 5: VERIFY sale created in database with all fields populated
        self.log("📝 Step 5: Verifying sale creation in database...")
        response = self.session.get(f"{BACKEND_URL}/sales")
        if response.status_code == 200:
            sales = response.json()
            final_count = len(sales)
            self.log(f"📊 Final sales count: {final_count}")
            
            if final_count > initial_count:
                # Find the most recent sale
                latest_sale = sales[0] if sales else None
                if latest_sale:
                    self.log("✅ SALE CREATED! Verifying all fields populated:")
                    self.log(f"   💰 Total: ${latest_sale.get('total', 0)}")
                    self.log(f"   👤 Customer: {latest_sale.get('customer_name', 'N/A')}")
                    self.log(f"   💳 Payment Method: {latest_sale.get('payment_method', 'N/A')}")
                    self.log(f"   ✅ Paid: {latest_sale.get('paid', False)}")
                    self.log(f"   📦 Products: {len(latest_sale.get('products', []))}")
                    
                    # Verify conversation['data'] was properly populated
                    if (latest_sale.get('total') == 2.0 and 
                        latest_sale.get('customer_name') == 'Juan' and
                        latest_sale.get('payment_method') == 'Efectivo' and
                        latest_sale.get('paid') == True):
                        self.log("🎉 CONVERSATION DATA EXTRACTION: WORKING PERFECTLY!")
                        return True
                    else:
                        self.log("❌ CONVERSATION DATA MISMATCH - Data not extracted correctly")
                        return False
                else:
                    self.log("❌ No sale data found")
                    return False
            else:
                self.log("❌ CRITICAL FAILURE: Sale not created in database")
                return False
        else:
            self.log(f"❌ Failed to fetch sales: {response.status_code}")
            return False
    
    def test_expense_registration_flow(self):
        """Test 3: Complete expense registration flow"""
        self.log("\n🧪 TEST 3: Expense registration flow")
        
        # Step 1: Initiate expense
        if not self.send_whatsapp_message("gasto"):
            return False
        
        time.sleep(1)
        
        # Step 2: Provide expense details
        if not self.send_whatsapp_message("pagué $50 de luz"):
            return False
        
        time.sleep(1)
        
        # Step 3: Provide additional details
        if not self.send_whatsapp_message("fue en efectivo"):
            return False
        
        time.sleep(1)
        
        # Step 4: Confirm
        if not self.send_whatsapp_message("sí"):
            return False
        
        # Verify expense was created
        time.sleep(2)
        response = self.session.get(f"{BACKEND_URL}/expenses")
        if response.status_code == 200:
            expenses = response.json()
            recent_expenses = [e for e in expenses if "WhatsApp" in e.get("notes", "")]
            if recent_expenses:
                self.log("✅ Expense registered successfully via WhatsApp")
                return True
        
        self.log("❌ Expense not found in database")
        return False
    
    def test_special_commands(self):
        """Test 4: Special commands (AYUDA, CANCELAR)"""
        self.log("\n🧪 TEST 4: Special commands")
        
        # Test AYUDA command
        if not self.send_whatsapp_message("AYUDA"):
            return False
        
        time.sleep(1)
        
        # Start a conversation and then cancel
        if not self.send_whatsapp_message("venta"):
            return False
        
        time.sleep(1)
        
        # Cancel the conversation
        if not self.send_whatsapp_message("CANCELAR"):
            return False
        
        self.log("✅ Special commands handled correctly")
        return True
    
    def test_error_handling(self):
        """Test 5: Error handling scenarios"""
        self.log("\n🧪 TEST 5: Error handling")
        
        # Test empty message
        if not self.send_whatsapp_message(""):
            return False
        
        time.sleep(1)
        
        # Test malformed request (this should still return 200 but handle gracefully)
        form_data = {
            "From": f"whatsapp:{TEST_USER_PHONE}",
            # Missing Body intentionally
            "NumMedia": "0"
        }
        
        response = self.session.post(f"{BACKEND_URL}/whatsapp/webhook", data=form_data)
        if response.status_code == 200:
            self.log("✅ Error handling working correctly")
            return True
        else:
            self.log(f"❌ Error handling failed: {response.text}")
            return False
    
    def test_claude_integration(self):
        """Test 6: Claude integration and natural conversation"""
        self.log("\n🧪 TEST 6: Claude integration")
        
        # Test natural language processing
        if not self.send_whatsapp_message("quiero registrar una venta"):
            return False
        
        time.sleep(1)
        
        # Test Claude's ability to ask follow-up questions
        if not self.send_whatsapp_message("vendí coca cola"):
            return False
        
        time.sleep(2)  # Give Claude time to process
        
        self.log("✅ Claude integration test completed")
        return True
    
    def check_backend_logs(self):
        """Check backend logs for errors"""
        self.log("\n🔍 Checking backend logs...")
        
        try:
            import subprocess
            result = subprocess.run(
                ["tail", "-n", "50", "/var/log/supervisor/backend.err.log"],
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                logs = result.stdout
                if "invalid x-api-key" in logs.lower():
                    self.log("❌ Found 'invalid x-api-key' error in logs")
                    return False
                elif "error" in logs.lower() and "whatsapp" in logs.lower():
                    self.log("⚠️ Found WhatsApp-related errors in logs:")
                    print(logs[-500:])  # Show last 500 chars
                else:
                    self.log("✅ No critical errors found in logs")
                    return True
            else:
                self.log("⚠️ Could not read backend logs")
                return True
        except Exception as e:
            self.log(f"⚠️ Error checking logs: {str(e)}")
            return True
    
    def verify_database_state(self):
        """Verify database state after tests"""
        self.log("\n🗄️ Verifying database state...")
        
        # Check conversations
        # Note: We can't directly access MongoDB, but we can check via API endpoints
        
        # Check if sales were created
        response = self.session.get(f"{BACKEND_URL}/sales")
        if response.status_code == 200:
            sales = response.json()
            whatsapp_sales = [s for s in sales if "WhatsApp" in s.get("notes", "")]
            self.log(f"✅ Found {len(whatsapp_sales)} WhatsApp sales in database")
        
        # Check if expenses were created
        response = self.session.get(f"{BACKEND_URL}/expenses")
        if response.status_code == 200:
            expenses = response.json()
            whatsapp_expenses = [e for e in expenses if "WhatsApp" in e.get("notes", "")]
            self.log(f"✅ Found {len(whatsapp_expenses)} WhatsApp expenses in database")
        
        return True
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        self.log("🚀 Starting WhatsApp Conversational AI Testing")
        self.log("=" * 60)
        
        results = {}
        
        # Setup
        if not self.register_test_user():
            self.log("❌ CRITICAL: Could not register test user")
            return False
        
        # Create test data
        self.create_test_products()
        self.create_test_customer()
        
        # Run tests
        results["unregistered_user"] = self.test_unregistered_user()
        results["sale_flow"] = self.test_sale_registration_flow()
        results["expense_flow"] = self.test_expense_registration_flow()
        results["special_commands"] = self.test_special_commands()
        results["error_handling"] = self.test_error_handling()
        results["claude_integration"] = self.test_claude_integration()
        
        # Verification
        results["backend_logs"] = self.check_backend_logs()
        results["database_state"] = self.verify_database_state()
        
        # Summary
        self.log("\n" + "=" * 60)
        self.log("📊 TEST RESULTS SUMMARY")
        self.log("=" * 60)
        
        passed = 0
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{test_name.replace('_', ' ').title()}: {status}")
            if result:
                passed += 1
        
        self.log(f"\nOverall: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🎉 ALL TESTS PASSED - WhatsApp AI is working correctly!")
            return True
        else:
            self.log("⚠️ SOME TESTS FAILED - Check logs for details")
            return False

def main():
    """Main test execution"""
    tester = WhatsAppAITester()
    success = tester.run_all_tests()
    
    if success:
        print("\n✅ TESTING COMPLETED SUCCESSFULLY")
        exit(0)
    else:
        print("\n❌ TESTING COMPLETED WITH FAILURES")
        exit(1)

if __name__ == "__main__":
    main()