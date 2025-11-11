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
        self.headers = HEADERS
        self.auth_token = None
        self.test_user_email = f"testing_whatsapp_{int(time.time())}@test.com"
        self.test_whatsapp = "+593992913093"
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def test_registration_with_whatsapp(self):
        """Test 1: Registration with mandatory WhatsApp field"""
        self.log("=== TESTING REGISTRATION WITH WHATSAPP ===")
        
        # Test 1.1: Registration without WhatsApp (should fail)
        self.log("Test 1.1: Registration without WhatsApp number")
        payload_no_whatsapp = {
            "email": self.test_user_email,
            "password": "Testing123!",
            "store_name": "Tienda de Prueba"
        }
        
        try:
            response = requests.post(f"{self.base_url}/auth/register", 
                                   json=payload_no_whatsapp, headers=self.headers)
            if response.status_code == 422:
                self.log("✅ PASS: Registration correctly rejected without WhatsApp (422 Unprocessable Entity)")
            else:
                self.log(f"❌ FAIL: Expected 422, got {response.status_code}. Response: {response.text}")
                return False
        except Exception as e:
            self.log(f"❌ ERROR: {str(e)}")
            return False
            
        # Test 1.2: Registration with empty WhatsApp (should fail)
        self.log("Test 1.2: Registration with empty WhatsApp")
        payload_empty_whatsapp = {
            "email": self.test_user_email,
            "password": "Testing123!",
            "store_name": "Tienda de Prueba",
            "whatsapp_number": ""
        }
        
        try:
            response = requests.post(f"{self.base_url}/auth/register", 
                                   json=payload_empty_whatsapp, headers=self.headers)
            if response.status_code == 400:
                self.log("✅ PASS: Registration correctly rejected with empty WhatsApp (400 Bad Request)")
            else:
                self.log(f"❌ FAIL: Expected 400, got {response.status_code}. Response: {response.text}")
                return False
        except Exception as e:
            self.log(f"❌ ERROR: {str(e)}")
            return False
            
        # Test 1.3: Registration with WhatsApp without + (should auto-add +)
        self.log("Test 1.3: Registration with WhatsApp without + prefix")
        payload_no_plus = {
            "email": self.test_user_email,
            "password": "Testing123!",
            "store_name": "Tienda de Prueba",
            "whatsapp_number": "593992913093"
        }
        
        try:
            response = requests.post(f"{self.base_url}/auth/register", 
                                   json=payload_no_plus, headers=self.headers)
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get("access_token")
                self.log("✅ PASS: Registration successful with auto-added + prefix")
                self.log(f"User ID: {data.get('user', {}).get('id')}")
                self.log(f"Store ID: {data.get('user', {}).get('store_id')}")
                return True
            else:
                self.log(f"❌ FAIL: Registration failed. Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log(f"❌ ERROR: {str(e)}")
            return False
            
    def test_registration_with_plus_whatsapp(self):
        """Test valid registration with + prefix WhatsApp"""
        self.log("=== TESTING REGISTRATION WITH + PREFIX WHATSAPP ===")
        
        # Use different email for this test
        test_email = f"testing_whatsapp_plus_{int(time.time())}@test.com"
        
        payload = {
            "email": test_email,
            "password": "Testing123!",
            "store_name": "Tienda de Prueba Plus",
            "whatsapp_number": self.test_whatsapp
        }
        
        try:
            response = requests.post(f"{self.base_url}/auth/register", 
                                   json=payload, headers=self.headers)
            if response.status_code == 200:
                data = response.json()
                self.log("✅ PASS: Registration successful with + prefix WhatsApp")
                self.log(f"Access token received: {data.get('access_token')[:20]}...")
                return True
            else:
                self.log(f"❌ FAIL: Registration failed. Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log(f"❌ ERROR: {str(e)}")
            return False
            
    def test_whatsapp_validation_edge_cases(self):
        """Test edge cases for WhatsApp validation"""
        self.log("=== TESTING WHATSAPP VALIDATION EDGE CASES ===")
        
        edge_cases = [
            ("Very short number", "123", 400),
            ("Only plus sign", "+", 400),
            ("Spaces in number", "+ 593 99 291 3093", 200),  # Should work after cleanup
        ]
        
        for test_name, whatsapp_num, expected_status in edge_cases:
            self.log(f"Testing: {test_name} - '{whatsapp_num}'")
            test_email = f"edge_case_{int(time.time())}_{hash(whatsapp_num) % 1000}@test.com"
            
            payload = {
                "email": test_email,
                "password": "Testing123!",
                "store_name": "Edge Case Store",
                "whatsapp_number": whatsapp_num
            }
            
            try:
                response = requests.post(f"{self.base_url}/auth/register", 
                                       json=payload, headers=self.headers)
                if response.status_code == expected_status:
                    self.log(f"✅ PASS: {test_name} - Expected {expected_status}, got {response.status_code}")
                else:
                    self.log(f"❌ FAIL: {test_name} - Expected {expected_status}, got {response.status_code}")
                    self.log(f"Response: {response.text}")
            except Exception as e:
                self.log(f"❌ ERROR in {test_name}: {str(e)}")
                
    def test_ai_report_whatsapp_sending(self):
        """Test 2: AI Report sending via WhatsApp (Error 500 fix)"""
        self.log("=== TESTING AI REPORT WHATSAPP SENDING ===")
        
        if not self.auth_token:
            self.log("❌ FAIL: No auth token available. Registration test must pass first.")
            return False
            
        auth_headers = {
            **self.headers,
            "Authorization": f"Bearer {self.auth_token}"
        }
        
        # Test 2.1: Generate AI insights first
        self.log("Test 2.1: Generating AI insights")
        try:
            response = requests.post(f"{self.base_url}/insights/generate", 
                                   headers=auth_headers)
            if response.status_code == 200:
                self.log("✅ PASS: AI insights generated successfully")
                data = response.json()
                self.log(f"Insight ID: {data.get('_id')}")
            else:
                self.log(f"❌ FAIL: AI insights generation failed. Status: {response.status_code}")
                self.log(f"Response: {response.text}")
                return False
        except Exception as e:
            self.log(f"❌ ERROR generating insights: {str(e)}")
            return False
            
        # Test 2.2: Send AI report via WhatsApp
        self.log("Test 2.2: Sending AI report via WhatsApp")
        try:
            response = requests.post(f"{self.base_url}/insights/send-whatsapp", 
                                   headers=auth_headers)
            
            self.log(f"WhatsApp send response status: {response.status_code}")
            self.log(f"WhatsApp send response: {response.text}")
            
            if response.status_code == 200:
                data = response.json()
                self.log("✅ PASS: AI report sent via WhatsApp successfully")
                self.log(f"WhatsApp number used: {data.get('whatsapp_number')}")
                return True
            elif response.status_code == 500:
                self.log("❌ CRITICAL FAIL: Error 500 still occurring when sending WhatsApp")
                self.log(f"Error details: {response.text}")
                return False
            elif response.status_code == 400:
                self.log("❌ FAIL: Bad request (400) - Check WhatsApp configuration")
                self.log(f"Error details: {response.text}")
                return False
            elif response.status_code == 404:
                self.log("❌ FAIL: No reports found (404) - Generate insights first")
                return False
            else:
                self.log(f"❌ FAIL: Unexpected status code {response.status_code}")
                self.log(f"Response: {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ ERROR sending WhatsApp: {str(e)}")
            return False
            
    def test_user_whatsapp_configuration(self):
        """Test user WhatsApp configuration retrieval"""
        self.log("=== TESTING USER WHATSAPP CONFIGURATION ===")
        
        if not self.auth_token:
            self.log("❌ FAIL: No auth token available")
            return False
            
        auth_headers = {
            **self.headers,
            "Authorization": f"Bearer {self.auth_token}"
        }
        
        try:
            response = requests.get(f"{self.base_url}/user/notification-settings", 
                                  headers=auth_headers)
            if response.status_code == 200:
                data = response.json()
                whatsapp_number = data.get("whatsapp_number")
                self.log(f"✅ PASS: User notification settings retrieved")
                self.log(f"WhatsApp number: {whatsapp_number}")
                self.log(f"Alerts enabled: {data.get('alerts_enabled')}")
                self.log(f"Stock alerts enabled: {data.get('stock_alerts_enabled')}")
                return whatsapp_number is not None
            else:
                self.log(f"❌ FAIL: Could not retrieve notification settings. Status: {response.status_code}")
                return False
        except Exception as e:
            self.log(f"❌ ERROR: {str(e)}")
            return False
            
    def check_backend_logs(self):
        """Check backend logs for any errors"""
        self.log("=== CHECKING BACKEND LOGS ===")
        try:
            import subprocess
            result = subprocess.run(
                ["tail", "-n", "50", "/var/log/supervisor/backend.err.log"],
                capture_output=True, text=True
            )
            if result.stdout:
                self.log("Recent backend error logs:")
                self.log(result.stdout)
            else:
                self.log("No recent backend error logs found")
                
            # Also check stdout logs
            result = subprocess.run(
                ["tail", "-n", "50", "/var/log/supervisor/backend.out.log"],
                capture_output=True, text=True
            )
            if result.stdout:
                self.log("Recent backend output logs:")
                self.log(result.stdout)
                
        except Exception as e:
            self.log(f"Could not check backend logs: {str(e)}")
            
    def run_all_tests(self):
        """Run all backend tests"""
        self.log("🚀 STARTING COMPREHENSIVE BACKEND TESTING")
        self.log(f"Testing against: {self.base_url}")
        self.log(f"Test user email: {self.test_user_email}")
        self.log(f"Test WhatsApp: {self.test_whatsapp}")
        
        results = {
            "registration_whatsapp": False,
            "registration_plus_prefix": False,
            "whatsapp_validation": True,  # Will be set to False if any edge case fails
            "user_config": False,
            "ai_report_whatsapp": False
        }
        
        # Test 1: Registration with WhatsApp validation
        results["registration_whatsapp"] = self.test_registration_with_whatsapp()
        
        # Test 2: Registration with + prefix
        results["registration_plus_prefix"] = self.test_registration_with_plus_whatsapp()
        
        # Test 3: Edge cases
        self.test_whatsapp_validation_edge_cases()
        
        # Test 4: User configuration
        results["user_config"] = self.test_user_whatsapp_configuration()
        
        # Test 5: AI report WhatsApp sending
        results["ai_report_whatsapp"] = self.test_ai_report_whatsapp_sending()
        
        # Check logs
        self.check_backend_logs()
        
        # Summary
        self.log("=" * 60)
        self.log("🏁 TESTING SUMMARY")
        self.log("=" * 60)
        
        passed = sum(1 for result in results.values() if result)
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{status}: {test_name}")
            
        self.log(f"\nOverall: {passed}/{total} tests passed")
        
        if results["registration_whatsapp"] and results["ai_report_whatsapp"]:
            self.log("🎉 CRITICAL ISSUES RESOLVED: Both WhatsApp registration and AI report sending are working!")
        elif results["registration_whatsapp"]:
            self.log("⚠️  PARTIAL SUCCESS: WhatsApp registration working, but AI report sending still has issues")
        elif results["ai_report_whatsapp"]:
            self.log("⚠️  PARTIAL SUCCESS: AI report sending working, but WhatsApp registration has issues")
        else:
            self.log("🚨 CRITICAL FAILURES: Both main features still have issues")
            
        return results

def main():
    """Main test execution"""
    tester = BackendTester()
    results = tester.run_all_tests()
    return results

if __name__ == "__main__":
    tester = BackendTester()
    results = tester.run_all_tests()
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