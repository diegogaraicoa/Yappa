#!/usr/bin/env python3
"""
Backend Authentication Flow Testing for PUT Endpoints
Testing the fixed authentication issue where tokens were generated with merchant_id 
but get_current_user was looking for sub (user_id).
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from frontend .env
BACKEND_URL = "https://smarte-reports.preview.emergentagent.com/api"

# Test credentials
USERNAME = "tiendaclave"
PASSWORD = "Chifle98."

class AuthenticationTester:
    def __init__(self):
        self.token = None
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def test_login_and_get_token(self):
        """Test login and save token for subsequent requests"""
        self.log("🔐 Testing login and token generation...")
        
        try:
            # Use query parameters as specified in the review request
            url = f"{BACKEND_URL}/onboarding/login/step1"
            params = {
                'username': USERNAME,
                'password': PASSWORD
            }
            
            response = self.session.post(url, params=params)
            self.log(f"Login request to: {url}")
            self.log(f"Login response status: {response.status_code}")
            
            if response.status_code != 200:
                self.log(f"❌ Login failed with status {response.status_code}", "ERROR")
                self.log(f"Response: {response.text}", "ERROR")
                return False
                
            data = response.json()
            self.log(f"Login response: {json.dumps(data, indent=2)}")
            
            # Check if it's a legacy account (no clerks) - should have token directly
            if data.get('legacy_account') and data.get('token'):
                self.token = data['token']
                self.log(f"✅ Login successful - Legacy account with direct token")
                self.log(f"Token: {self.token[:50]}...")
                return True
            elif data.get('clerks'):
                self.log("❌ Account has clerks - need step 2 login (not supported in this test)", "ERROR")
                return False
            else:
                self.log("❌ Unexpected login response format", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Login failed with exception: {str(e)}", "ERROR")
            return False
    
    def get_products(self):
        """Get products list to obtain a product_id for testing"""
        self.log("📦 Getting products list...")
        
        try:
            url = f"{BACKEND_URL}/products"
            response = self.session.get(url)
            
            if response.status_code != 200:
                self.log(f"❌ Get products failed with status {response.status_code}", "ERROR")
                return None
                
            products = response.json()
            self.log(f"✅ Found {len(products)} products")
            
            if products:
                product = products[0]
                self.log(f"Using product: {product.get('nombre', product.get('name', 'Unknown'))} (ID: {product['_id']})")
                return product
            else:
                self.log("❌ No products found", "ERROR")
                return None
                
        except Exception as e:
            self.log(f"❌ Get products failed: {str(e)}", "ERROR")
            return None
    
    def get_customers(self):
        """Get customers list to obtain a customer_id for testing"""
        self.log("👥 Getting customers list...")
        
        try:
            url = f"{BACKEND_URL}/customers"
            response = self.session.get(url)
            
            if response.status_code != 200:
                self.log(f"❌ Get customers failed with status {response.status_code}", "ERROR")
                return None
                
            customers = response.json()
            self.log(f"✅ Found {len(customers)} customers")
            
            if customers:
                customer = customers[0]
                customer_name = f"{customer.get('nombre', customer.get('name', ''))} {customer.get('apellido', customer.get('lastname', ''))}"
                self.log(f"Using customer: {customer_name.strip()} (ID: {customer['_id']})")
                return customer
            else:
                self.log("❌ No customers found", "ERROR")
                return None
                
        except Exception as e:
            self.log(f"❌ Get customers failed: {str(e)}", "ERROR")
            return None
    
    def test_put_product_with_auth(self, product_id):
        """Test PUT /api/products/{product_id} with authentication"""
        self.log(f"🔧 Testing PUT /api/products/{product_id} with authentication...")
        
        try:
            url = f"{BACKEND_URL}/products/{product_id}"
            headers = {
                'Authorization': f'Bearer {self.token}',
                'Content-Type': 'application/json'
            }
            
            # Test data - update stock
            data = {"stock": 100}
            
            response = self.session.put(url, headers=headers, json=data)
            self.log(f"PUT products request to: {url}")
            self.log(f"Request headers: Authorization: Bearer {self.token[:20]}...")
            self.log(f"Request body: {json.dumps(data)}")
            self.log(f"Response status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                self.log(f"✅ PUT products with auth successful")
                self.log(f"Updated product: {json.dumps(result, indent=2)}")
                return True
            elif response.status_code in [401, 403]:
                self.log(f"❌ PUT products failed - Authentication error {response.status_code}", "ERROR")
                self.log(f"Response: {response.text}", "ERROR")
                return False
            else:
                self.log(f"❌ PUT products failed with status {response.status_code}", "ERROR")
                self.log(f"Response: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ PUT products with auth failed: {str(e)}", "ERROR")
            return False
    
    def test_put_customer_with_auth(self, customer_id):
        """Test PUT /api/customers/{customer_id} with authentication"""
        self.log(f"🔧 Testing PUT /api/customers/{customer_id} with authentication...")
        
        try:
            url = f"{BACKEND_URL}/customers/{customer_id}"
            headers = {
                'Authorization': f'Bearer {self.token}',
                'Content-Type': 'application/json'
            }
            
            # Test data - update debt
            data = {"deuda_total": 50}
            
            response = self.session.put(url, headers=headers, json=data)
            self.log(f"PUT customers request to: {url}")
            self.log(f"Request headers: Authorization: Bearer {self.token[:20]}...")
            self.log(f"Request body: {json.dumps(data)}")
            self.log(f"Response status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                self.log(f"✅ PUT customers with auth successful")
                self.log(f"Updated customer: {json.dumps(result, indent=2)}")
                return True
            elif response.status_code in [401, 403]:
                self.log(f"❌ PUT customers failed - Authentication error {response.status_code}", "ERROR")
                self.log(f"Response: {response.text}", "ERROR")
                return False
            else:
                self.log(f"❌ PUT customers failed with status {response.status_code}", "ERROR")
                self.log(f"Response: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ PUT customers with auth failed: {str(e)}", "ERROR")
            return False
    
    def test_put_product_without_auth(self, product_id):
        """Test PUT /api/products/{product_id} without authentication (should fail)"""
        self.log(f"🚫 Testing PUT /api/products/{product_id} without authentication (should fail)...")
        
        try:
            url = f"{BACKEND_URL}/products/{product_id}"
            # No Authorization header
            data = {"stock": 200}
            
            response = self.session.put(url, json=data)
            self.log(f"PUT products request to: {url} (no auth header)")
            self.log(f"Request body: {json.dumps(data)}")
            self.log(f"Response status: {response.status_code}")
            
            if response.status_code in [401, 403]:
                self.log(f"✅ PUT products without auth correctly failed with {response.status_code}")
                return True
            elif response.status_code == 200:
                self.log(f"❌ PUT products without auth unexpectedly succeeded", "ERROR")
                self.log(f"Response: {response.text}", "ERROR")
                return False
            else:
                self.log(f"❌ PUT products without auth failed with unexpected status {response.status_code}", "ERROR")
                self.log(f"Response: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ PUT products without auth test failed: {str(e)}", "ERROR")
            return False
    
    def run_comprehensive_test(self):
        """Run the complete authentication flow test"""
        self.log("🚀 Starting comprehensive authentication flow test for PUT endpoints")
        self.log("=" * 80)
        
        results = {
            'login': False,
            'put_product_with_auth': False,
            'put_customer_with_auth': False,
            'put_product_without_auth': False
        }
        
        # Step 1: Login and get token
        if not self.test_login_and_get_token():
            self.log("❌ CRITICAL: Login failed - cannot proceed with other tests", "ERROR")
            return results
        results['login'] = True
        
        # Step 2: Get test data
        product = self.get_products()
        customer = self.get_customers()
        
        if not product:
            self.log("❌ CRITICAL: No products available for testing", "ERROR")
            return results
            
        if not customer:
            self.log("❌ CRITICAL: No customers available for testing", "ERROR")
            return results
        
        # Step 3: Test PUT endpoints with authentication
        results['put_product_with_auth'] = self.test_put_product_with_auth(product['_id'])
        results['put_customer_with_auth'] = self.test_put_customer_with_auth(customer['_id'])
        
        # Step 4: Test PUT endpoint without authentication (should fail)
        results['put_product_without_auth'] = self.test_put_product_without_auth(product['_id'])
        
        # Summary
        self.log("=" * 80)
        self.log("📊 TEST RESULTS SUMMARY:")
        self.log("=" * 80)
        
        total_tests = len(results)
        passed_tests = sum(1 for result in results.values() if result)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{test_name}: {status}")
        
        self.log(f"\nOverall: {passed_tests}/{total_tests} tests passed")
        
        if passed_tests == total_tests:
            self.log("🎉 ALL TESTS PASSED - Authentication flow is working correctly!", "SUCCESS")
        else:
            self.log(f"⚠️  {total_tests - passed_tests} test(s) failed - Authentication issues detected", "ERROR")
        
        return results

def main():
    """Main test execution"""
    print("🔐 Backend Authentication Flow Testing for PUT Endpoints")
    print("Testing the fixed authentication issue: merchant_id vs sub token compatibility")
    print("=" * 80)
    
    tester = AuthenticationTester()
    results = tester.run_comprehensive_test()
    
    # Exit with appropriate code
    if all(results.values()):
        sys.exit(0)  # Success
    else:
        sys.exit(1)  # Failure

if __name__ == "__main__":
    main()