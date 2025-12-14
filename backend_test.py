#!/usr/bin/env python3
"""
Backend API Testing for PUT Endpoints - Actionable Modals
Testing critical PUT endpoints for product stock updates and customer debt updates
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://ai-frontend-revamp.preview.emergentagent.com/api"
LOGIN_CREDENTIALS = {
    "username": "tiendaclave", 
    "password": "Chifle98."
}

class BackendTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.auth_token = None
        self.test_results = []
        
    def log_test(self, test_name, success, details="", error=""):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "error": error,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        if error:
            print(f"   Error: {error}")
        print()

    def authenticate(self):
        """Authenticate with the backend using tiendaclave credentials"""
        try:
            login_url = f"{self.base_url}/onboarding/login/step1"
            response = self.session.post(login_url, params=LOGIN_CREDENTIALS)
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get("token")
                if self.auth_token:
                    self.session.headers.update({
                        "Authorization": f"Bearer {self.auth_token}"
                    })
                    self.log_test("Authentication", True, f"Successfully logged in as {LOGIN_CREDENTIALS['username']}")
                    return True
                else:
                    self.log_test("Authentication", False, error="No access token in response")
                    return False
            else:
                self.log_test("Authentication", False, error=f"Login failed with status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Authentication", False, error=f"Authentication error: {str(e)}")
            return False

    def test_get_products(self):
        """Test GET /api/products to get available products"""
        try:
            url = f"{self.base_url}/products"
            response = self.session.get(url)
            
            if response.status_code == 200:
                products = response.json()
                if isinstance(products, list) and len(products) > 0:
                    self.log_test("GET /api/products", True, f"Retrieved {len(products)} products")
                    return products
                else:
                    self.log_test("GET /api/products", False, error="No products found or invalid response format")
                    return []
            else:
                self.log_test("GET /api/products", False, error=f"Status {response.status_code}: {response.text}")
                return []
                
        except Exception as e:
            self.log_test("GET /api/products", False, error=f"Exception: {str(e)}")
            return []

    def test_put_product_stock(self, product_id, original_stock):
        """Test PUT /api/products/{product_id} to update stock"""
        try:
            url = f"{self.base_url}/products/{product_id}"
            
            # Calculate new stock value (add 10 to original)
            new_stock = float(original_stock) + 10.0
            
            # Test data - using both 'stock' and 'quantity' fields for compatibility
            update_data = {
                "stock": new_stock,
                "quantity": new_stock
            }
            
            # Make PUT request (no auth required as per instructions)
            response = requests.put(url, json=update_data)
            
            if response.status_code == 200:
                updated_product = response.json()
                
                # Check if stock was updated correctly
                updated_stock = updated_product.get("stock", updated_product.get("quantity", 0))
                
                if float(updated_stock) == new_stock:
                    self.log_test(
                        f"PUT /api/products/{product_id}", 
                        True, 
                        f"Stock updated successfully: {original_stock} → {updated_stock}"
                    )
                    return True
                else:
                    self.log_test(
                        f"PUT /api/products/{product_id}", 
                        False, 
                        error=f"Stock not updated correctly. Expected: {new_stock}, Got: {updated_stock}"
                    )
                    return False
            else:
                self.log_test(
                    f"PUT /api/products/{product_id}", 
                    False, 
                    error=f"Status {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_test(f"PUT /api/products/{product_id}", False, error=f"Exception: {str(e)}")
            return False

    def test_get_customers(self):
        """Test GET /api/customers to get available customers"""
        try:
            url = f"{self.base_url}/customers"
            response = self.session.get(url)
            
            if response.status_code == 200:
                customers = response.json()
                if isinstance(customers, list) and len(customers) > 0:
                    self.log_test("GET /api/customers", True, f"Retrieved {len(customers)} customers")
                    return customers
                else:
                    self.log_test("GET /api/customers", False, error="No customers found or invalid response format")
                    return []
            else:
                self.log_test("GET /api/customers", False, error=f"Status {response.status_code}: {response.text}")
                return []
                
        except Exception as e:
            self.log_test("GET /api/customers", False, error=f"Exception: {str(e)}")
            return []

    def test_put_customer_debt(self, customer_id, original_debt):
        """Test PUT /api/customers/{customer_id} to update debt"""
        try:
            url = f"{self.base_url}/customers/{customer_id}"
            
            # Calculate new debt value (add 50 to original, or set to 50 if no original debt)
            new_debt = float(original_debt or 0) + 50.0
            
            # Test data - using 'deuda_total' field as specified
            update_data = {
                "deuda_total": new_debt
            }
            
            # Make PUT request (no auth required as per instructions)
            response = requests.put(url, json=update_data)
            
            if response.status_code == 200:
                updated_customer = response.json()
                
                # Check if debt was updated correctly
                updated_debt = updated_customer.get("deuda_total", 0)
                
                if float(updated_debt) == new_debt:
                    self.log_test(
                        f"PUT /api/customers/{customer_id}", 
                        True, 
                        f"Debt updated successfully: {original_debt or 0} → {updated_debt}"
                    )
                    return True
                else:
                    self.log_test(
                        f"PUT /api/customers/{customer_id}", 
                        False, 
                        error=f"Debt not updated correctly. Expected: {new_debt}, Got: {updated_debt}"
                    )
                    return False
            else:
                self.log_test(
                    f"PUT /api/customers/{customer_id}", 
                    False, 
                    error=f"Status {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_test(f"PUT /api/customers/{customer_id}", False, error=f"Exception: {str(e)}")
            return False

    def run_actionable_modals_tests(self):
        """Run comprehensive tests for actionable modals PUT endpoints"""
        print("🚀 STARTING ACTIONABLE MODALS PUT ENDPOINTS TESTING")
        print("=" * 60)
        print()
        
        # Step 1: Authenticate
        if not self.authenticate():
            print("❌ Authentication failed. Cannot proceed with tests.")
            return False
        
        # Step 2: Test Products Flow
        print("📦 TESTING PRODUCTS STOCK UPDATE FLOW")
        print("-" * 40)
        
        products = self.test_get_products()
        if products:
            # Test with first available product
            test_product = products[0]
            product_id = test_product.get("_id")
            original_stock = test_product.get("stock", test_product.get("quantity", 0))
            
            print(f"Testing with product: {test_product.get('name', test_product.get('nombre', 'Unknown'))}")
            print(f"Product ID: {product_id}")
            print(f"Original stock: {original_stock}")
            print()
            
            self.test_put_product_stock(product_id, original_stock)
        else:
            print("❌ No products available for testing")
        
        print()
        
        # Step 3: Test Customers Flow
        print("👥 TESTING CUSTOMERS DEBT UPDATE FLOW")
        print("-" * 40)
        
        customers = self.test_get_customers()
        if customers:
            # Test with first available customer
            test_customer = customers[0]
            customer_id = test_customer.get("_id")
            original_debt = test_customer.get("deuda_total", 0)
            
            print(f"Testing with customer: {test_customer.get('name', test_customer.get('nombre', 'Unknown'))} {test_customer.get('lastname', test_customer.get('apellido', ''))}")
            print(f"Customer ID: {customer_id}")
            print(f"Original debt: {original_debt}")
            print()
            
            self.test_put_customer_debt(customer_id, original_debt)
        else:
            print("❌ No customers available for testing")
        
        print()
        
        # Summary
        self.print_summary()
        
        # Return overall success
        failed_tests = [t for t in self.test_results if not t["success"]]
        return len(failed_tests) == 0

    def print_summary(self):
        """Print test summary"""
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t["success"]])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%" if total_tests > 0 else "0%")
        print()
        
        if failed_tests > 0:
            print("❌ FAILED TESTS:")
            for test in self.test_results:
                if not test["success"]:
                    print(f"  - {test['test']}: {test['error']}")
            print()
        
        print("🎯 CRITICAL ENDPOINTS STATUS:")
        product_tests = [t for t in self.test_results if "PUT /api/products/" in t["test"]]
        customer_tests = [t for t in self.test_results if "PUT /api/customers/" in t["test"]]
        
        if product_tests:
            product_status = "✅ WORKING" if product_tests[0]["success"] else "❌ FAILING"
            print(f"  - Product Stock Updates: {product_status}")
        
        if customer_tests:
            customer_status = "✅ WORKING" if customer_tests[0]["success"] else "❌ FAILING"
            print(f"  - Customer Debt Updates: {customer_status}")
        
        print()

def main():
    """Main test execution"""
    tester = BackendTester()
    success = tester.run_actionable_modals_tests()
    
    if success:
        print("🎉 ALL TESTS PASSED! Actionable modals PUT endpoints are working correctly.")
        sys.exit(0)
    else:
        print("⚠️  SOME TESTS FAILED! Check the summary above for details.")
        sys.exit(1)

if __name__ == "__main__":
    main()