#!/usr/bin/env python3
"""
Backend Testing Suite for WhatsApp Registration and AI Reports
Testing critical user-reported issues:
1. WhatsApp field mandatory in registration
2. Error 500 when sending AI reports via WhatsApp
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "https://vendormate-13.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class BackendTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.token = None
        self.user_data = None
        self.test_products = []
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def register_test_user(self):
        """Register a test user for authentication"""
        self.log("Registering test user...")
        
        user_data = {
            "email": f"alertstest_{datetime.now().strftime('%Y%m%d_%H%M%S')}@test.com",
            "password": "TestPassword123!",
            "store_name": "Alerts Test Store"
        }
        
        try:
            response = requests.post(f"{self.base_url}/auth/register", json=user_data)
            if response.status_code == 200:
                data = response.json()
                self.token = data["access_token"]
                self.user_data = data["user"]
                self.log(f"✅ User registered successfully: {self.user_data['email']}")
                return True
            else:
                self.log(f"❌ Registration failed: {response.status_code} - {response.text}", "ERROR")
                return False
        except Exception as e:
            self.log(f"❌ Registration error: {str(e)}", "ERROR")
            return False
    
    def get_headers(self):
        """Get authorization headers"""
        return {"Authorization": f"Bearer {self.token}"}
    
    def create_test_products(self):
        """Create products with different stock levels for testing"""
        self.log("Creating test products with various stock levels...")
        
        # First create basic products (ProductCreate only supports basic fields)
        test_products_data = [
            {
                "name": "Producto Crítico - Sin Stock",
                "quantity": 0,
                "price": 10.0,
                "cost": 5.0,
                "description": "Producto con stock crítico (0 unidades)"
            },
            {
                "name": "Producto Warning - Stock Bajo",
                "quantity": 3,
                "price": 15.0,
                "cost": 8.0,
                "description": "Producto con stock bajo (3 unidades, umbral 5)"
            },
            {
                "name": "Producto Normal - Stock OK",
                "quantity": 20,
                "price": 12.0,
                "cost": 6.0,
                "description": "Producto con stock normal (20 unidades)"
            },
            {
                "name": "Producto Deshabilitado - Sin Alertas",
                "quantity": 2,
                "price": 8.0,
                "cost": 4.0,
                "description": "Producto con stock bajo pero alertas deshabilitadas"
            },
            {
                "name": "Producto Límite - En el Umbral",
                "quantity": 5,
                "price": 18.0,
                "cost": 9.0,
                "description": "Producto exactamente en el umbral de alerta"
            }
        ]
        
        # Alert settings to apply after creation
        alert_settings = [
            {"min_stock_alert": 5.0, "alert_enabled": True},   # Critical
            {"min_stock_alert": 5.0, "alert_enabled": True},   # Warning
            {"min_stock_alert": 5.0, "alert_enabled": True},   # Normal
            {"min_stock_alert": 5.0, "alert_enabled": False},  # Disabled
            {"min_stock_alert": 5.0, "alert_enabled": True},   # Limit
        ]
        
        created_products = []
        for i, product_data in enumerate(test_products_data):
            try:
                # Create basic product
                response = requests.post(
                    f"{self.base_url}/products",
                    json=product_data,
                    headers=self.get_headers()
                )
                
                if response.status_code == 200:
                    product = response.json()
                    
                    # Update alert settings using the alert settings endpoint
                    alert_response = requests.put(
                        f"{self.base_url}/products/{product['_id']}/alert-settings",
                        params=alert_settings[i],
                        headers=self.get_headers()
                    )
                    
                    if alert_response.status_code == 200:
                        # Get updated product to verify settings
                        get_response = requests.get(
                            f"{self.base_url}/products/{product['_id']}",
                            headers=self.get_headers()
                        )
                        
                        if get_response.status_code == 200:
                            updated_product = get_response.json()
                            created_products.append(updated_product)
                            self.log(f"✅ Created product: {updated_product['name']} (qty: {updated_product['quantity']}, alert: {updated_product.get('alert_enabled', True)}, threshold: {updated_product.get('min_stock_alert', 10)})")
                        else:
                            created_products.append(product)
                            self.log(f"⚠️ Created product but couldn't verify settings: {product['name']}")
                    else:
                        created_products.append(product)
                        self.log(f"⚠️ Created product but couldn't update alert settings: {product['name']} - {alert_response.status_code}")
                else:
                    self.log(f"❌ Failed to create product {product_data['name']}: {response.status_code}", "ERROR")
                    
            except Exception as e:
                self.log(f"❌ Error creating product {product_data['name']}: {str(e)}", "ERROR")
        
        self.test_products = created_products
        return len(created_products) == len(test_products_data)
    
    def test_alerts_endpoint_authentication(self):
        """Test that alerts endpoint requires authentication"""
        self.log("Testing alerts endpoint authentication...")
        
        try:
            # Test without token
            response = requests.get(f"{self.base_url}/alerts/low-stock")
            if response.status_code == 401 or response.status_code == 403:
                self.log("✅ Authentication required - endpoint properly protected")
                return True
            else:
                self.log(f"❌ Authentication not required - got status {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Error testing authentication: {str(e)}", "ERROR")
            return False
    
    def test_alerts_endpoint_functionality(self):
        """Test the main alerts endpoint functionality"""
        self.log("Testing alerts endpoint functionality...")
        
        try:
            response = requests.get(
                f"{self.base_url}/alerts/low-stock",
                headers=self.get_headers()
            )
            
            if response.status_code != 200:
                self.log(f"❌ Alerts endpoint failed: {response.status_code} - {response.text}", "ERROR")
                return False
            
            alerts = response.json()
            self.log(f"📊 Received {len(alerts)} alerts")
            
            # Validate response structure and content
            return self.validate_alerts_response(alerts)
            
        except Exception as e:
            self.log(f"❌ Error testing alerts endpoint: {str(e)}", "ERROR")
            return False
    
    def validate_alerts_response(self, alerts):
        """Validate the alerts response format and content"""
        self.log("Validating alerts response...")
        
        expected_alerts = 0
        critical_alerts = 0
        warning_alerts = 0
        
        # Count expected alerts from our test products
        for product in self.test_products:
            if product.get('alert_enabled', True) and product['quantity'] <= product.get('min_stock_alert', 10):
                expected_alerts += 1
                if product['quantity'] == 0:
                    critical_alerts += 1
                else:
                    warning_alerts += 1
        
        self.log(f"Expected alerts: {expected_alerts} (Critical: {critical_alerts}, Warning: {warning_alerts})")
        
        # Validate number of alerts
        if len(alerts) != expected_alerts:
            self.log(f"❌ Alert count mismatch. Expected: {expected_alerts}, Got: {len(alerts)}", "ERROR")
            return False
        
        # Validate each alert
        actual_critical = 0
        actual_warning = 0
        
        for alert in alerts:
            # Check required fields
            required_fields = ['_id', 'name', 'quantity', 'min_stock_alert', 'alert_level', 'alert_enabled']
            for field in required_fields:
                if field not in alert:
                    self.log(f"❌ Missing field '{field}' in alert response", "ERROR")
                    return False
            
            # Validate alert_level logic
            if alert['quantity'] == 0:
                if alert['alert_level'] != 'critical':
                    self.log(f"❌ Product '{alert['name']}' with 0 quantity should have 'critical' alert_level, got '{alert['alert_level']}'", "ERROR")
                    return False
                actual_critical += 1
            elif alert['quantity'] <= alert['min_stock_alert']:
                if alert['alert_level'] != 'warning':
                    self.log(f"❌ Product '{alert['name']}' with low stock should have 'warning' alert_level, got '{alert['alert_level']}'", "ERROR")
                    return False
                actual_warning += 1
            else:
                self.log(f"❌ Product '{alert['name']}' should not be in alerts (qty: {alert['quantity']}, threshold: {alert['min_stock_alert']})", "ERROR")
                return False
            
            # Validate alert_enabled is True
            if not alert['alert_enabled']:
                self.log(f"❌ Product '{alert['name']}' has alert_enabled=False but appears in alerts", "ERROR")
                return False
            
            self.log(f"✅ Alert validated: {alert['name']} - {alert['alert_level']} (qty: {alert['quantity']})")
        
        # Validate alert level counts
        if actual_critical != critical_alerts:
            self.log(f"❌ Critical alert count mismatch. Expected: {critical_alerts}, Got: {actual_critical}", "ERROR")
            return False
            
        if actual_warning != warning_alerts:
            self.log(f"❌ Warning alert count mismatch. Expected: {warning_alerts}, Got: {actual_warning}", "ERROR")
            return False
        
        self.log("✅ All alerts validated successfully")
        return True
    
    def test_products_not_in_alerts(self):
        """Verify that products with normal stock or disabled alerts are NOT in the response"""
        self.log("Testing that normal stock products are excluded from alerts...")
        
        try:
            response = requests.get(
                f"{self.base_url}/alerts/low-stock",
                headers=self.get_headers()
            )
            
            if response.status_code != 200:
                self.log(f"❌ Failed to get alerts: {response.status_code}", "ERROR")
                return False
            
            alerts = response.json()
            alert_product_ids = [alert['_id'] for alert in alerts]
            
            # Check that products with normal stock are not included
            for product in self.test_products:
                should_be_in_alerts = (
                    product.get('alert_enabled', True) and 
                    product['quantity'] <= product.get('min_stock_alert', 10)
                )
                
                is_in_alerts = product['_id'] in alert_product_ids
                
                if should_be_in_alerts and not is_in_alerts:
                    self.log(f"❌ Product '{product['name']}' should be in alerts but is missing", "ERROR")
                    return False
                elif not should_be_in_alerts and is_in_alerts:
                    self.log(f"❌ Product '{product['name']}' should NOT be in alerts but is included", "ERROR")
                    return False
                elif not should_be_in_alerts:
                    self.log(f"✅ Product '{product['name']}' correctly excluded from alerts")
            
            return True
            
        except Exception as e:
            self.log(f"❌ Error testing excluded products: {str(e)}", "ERROR")
            return False
    
    def cleanup_test_data(self):
        """Clean up test products"""
        self.log("Cleaning up test data...")
        
        for product in self.test_products:
            try:
                response = requests.delete(
                    f"{self.base_url}/products/{product['_id']}",
                    headers=self.get_headers()
                )
                if response.status_code == 200:
                    self.log(f"✅ Deleted product: {product['name']}")
                else:
                    self.log(f"⚠️ Failed to delete product {product['name']}: {response.status_code}")
            except Exception as e:
                self.log(f"⚠️ Error deleting product {product['name']}: {str(e)}")
    
    def run_all_tests(self):
        """Run all alert tests"""
        self.log("🚀 Starting Stock Alerts API Tests")
        self.log("=" * 50)
        
        test_results = []
        
        # Test 1: User Registration
        test_results.append(("User Registration", self.register_test_user()))
        
        if not self.token:
            self.log("❌ Cannot continue without authentication token", "ERROR")
            return False
        
        # Test 2: Create Test Products
        test_results.append(("Create Test Products", self.create_test_products()))
        
        # Test 3: Authentication Required
        test_results.append(("Authentication Required", self.test_alerts_endpoint_authentication()))
        
        # Test 4: Alerts Endpoint Functionality
        test_results.append(("Alerts Endpoint Functionality", self.test_alerts_endpoint_functionality()))
        
        # Test 5: Excluded Products
        test_results.append(("Excluded Products Validation", self.test_products_not_in_alerts()))
        
        # Cleanup
        self.cleanup_test_data()
        
        # Results Summary
        self.log("=" * 50)
        self.log("📋 TEST RESULTS SUMMARY")
        self.log("=" * 50)
        
        passed = 0
        total = len(test_results)
        
        for test_name, result in test_results:
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{test_name}: {status}")
            if result:
                passed += 1
        
        self.log("=" * 50)
        self.log(f"📊 OVERALL: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🎉 ALL TESTS PASSED - Stock Alerts API is working correctly!")
            return True
        else:
            self.log("💥 SOME TESTS FAILED - Stock Alerts API has issues!")
            return False

def main():
    """Main test execution"""
    tester = AlertsAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()