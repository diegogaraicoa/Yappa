#!/usr/bin/env python3
"""
Comprehensive Backend API Testing Suite
Tests all endpoints for pre-deployment validation
"""

import requests
import json
import sys
import time
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://playstore-prep-9.preview.emergentagent.com/api"
TEST_CREDENTIALS = {
    "username": "tiendaclave",
    "password": "Chifle98."
}

class BackendTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.auth_token = None
        self.test_results = []
        self.failed_tests = []
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} | {test_name}")
        if details:
            print(f"    Details: {details}")
        if not success:
            self.failed_tests.append(result)
            
    def make_request(self, method: str, endpoint: str, data: Dict = None, params: Dict = None, 
                    auth_required: bool = True) -> requests.Response:
        """Make HTTP request with optional authentication"""
        url = f"{self.base_url}{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        if auth_required and self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
            
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=headers, params=params, timeout=30)
            elif method.upper() == "POST":
                response = self.session.post(url, headers=headers, json=data, params=params, timeout=30)
            elif method.upper() == "PUT":
                response = self.session.put(url, headers=headers, json=data, timeout=30)
            elif method.upper() == "PATCH":
                response = self.session.patch(url, headers=headers, json=data, timeout=30)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            raise

    # ==================== AUTHENTICATION TESTS ====================
    
    def test_login_step1(self):
        """Test login step 1 with valid credentials"""
        try:
            response = self.make_request(
                "POST", 
                "/onboarding/login/step1",
                params={"username": TEST_CREDENTIALS["username"], "password": TEST_CREDENTIALS["password"]},
                auth_required=False
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("token"):
                    self.auth_token = data["token"]
                    self.log_test("Login Step 1", True, f"Token obtained for legacy account")
                    return True
                elif data.get("success") and data.get("clerks"):
                    # Store data for step 2
                    self.merchant_id = data.get("merchant_id")
                    self.clerks = data.get("clerks", [])
                    self.log_test("Login Step 1", True, f"Found {len(data['clerks'])} clerks, needs step 2")
                    return True
                else:
                    self.log_test("Login Step 1", False, f"Unexpected response format: {data}")
                    return False
            else:
                self.log_test("Login Step 1", False, f"Status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Login Step 1", False, f"Exception: {str(e)}")
            return False

    def test_login_step2(self):
        """Test login step 2 with PIN (if needed)"""
        if hasattr(self, 'clerks') and self.clerks and hasattr(self, 'merchant_id'):
            try:
                # Use first clerk with PIN 1234 (from review request)
                clerk_id = self.clerks[0]["clerk_id"]
                
                response = self.make_request(
                    "POST",
                    "/onboarding/login/step2",
                    params={
                        "merchant_id": self.merchant_id,
                        "clerk_id": clerk_id,
                        "pin": "1234"
                    },
                    auth_required=False
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and data.get("token"):
                        self.auth_token = data["token"]
                        self.log_test("Login Step 2", True, f"Token obtained for clerk")
                        return True
                    else:
                        self.log_test("Login Step 2", False, f"No token in response: {data}")
                        return False
                else:
                    self.log_test("Login Step 2", False, f"Status {response.status_code}: {response.text}")
                    return False
                    
            except Exception as e:
                self.log_test("Login Step 2", False, f"Exception: {str(e)}")
                return False
        else:
            self.log_test("Login Step 2", True, "Skipped - no clerks from step 1")
            return True

    def test_invalid_login(self):
        """Test login with invalid credentials"""
        try:
            response = self.make_request(
                "POST",
                "/onboarding/login/step1", 
                params={"username": "invalid", "password": "invalid"},
                auth_required=False
            )
            
            if response.status_code == 401:
                self.log_test("Invalid Login", True, "Correctly rejected invalid credentials")
                return True
            else:
                self.log_test("Invalid Login", False, f"Expected 401, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Invalid Login", False, f"Exception: {str(e)}")
            return False

    # ==================== ONBOARDING TESTS ====================
    
    def test_search_stores(self):
        """Test store search functionality"""
        try:
            # Test with valid query
            response = self.make_request("GET", "/onboarding/search-stores", params={"query": "tienda"}, auth_required=False)
            
            if response.status_code == 200:
                data = response.json()
                stores = data.get("stores", [])
                self.log_test("Search Stores - Valid Query", True, f"Found {len(stores)} stores")
            else:
                self.log_test("Search Stores - Valid Query", False, f"Status {response.status_code}")
                return False
                
            # Test with short query
            response = self.make_request("GET", "/onboarding/search-stores", params={"query": "a"}, auth_required=False)
            if response.status_code == 200:
                data = response.json()
                self.log_test("Search Stores - Short Query", True, f"Correctly handled short query")
            else:
                self.log_test("Search Stores - Short Query", False, f"Status {response.status_code}")
                
            return True
            
        except Exception as e:
            self.log_test("Search Stores", False, f"Exception: {str(e)}")
            return False

    def test_register_single_store(self):
        """Test single store registration"""
        try:
            test_data = {
                "store_name": f"Test Store {int(time.time())}",
                "email": f"test{int(time.time())}@example.com",
                "password": "testpass123",
                "first_name": "Test",
                "last_name": "User",
                "phone": "+593999123456",
                "pin": "1234",
                "role": "owner"
            }
            
            response = self.make_request("POST", "/onboarding/register-single-store", data=test_data, auth_required=False)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success") and data.get("token"):
                    self.log_test("Register Single Store", True, f"Created store: {data.get('username')}")
                    return True
                else:
                    self.log_test("Register Single Store", False, f"Missing success/token in response")
                    return False
            else:
                self.log_test("Register Single Store", False, f"Status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Register Single Store", False, f"Exception: {str(e)}")
            return False

    # ==================== CORE APP FUNCTIONALITY TESTS ====================
    
    def test_balance_endpoint(self):
        """Test balance/reports endpoint"""
        try:
            # Test without date range
            response = self.make_request("GET", "/balance", auth_required=False)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["ingresos", "egresos", "balance", "resumen_ingresos", "resumen_egresos"]
                if all(field in data for field in required_fields):
                    self.log_test("Balance Endpoint", True, f"Balance: ${data.get('balance', 0):.2f}")
                else:
                    missing = [f for f in required_fields if f not in data]
                    self.log_test("Balance Endpoint", False, f"Missing fields: {missing}")
                    return False
            else:
                self.log_test("Balance Endpoint", False, f"Status {response.status_code}")
                return False
                
            # Test with date range
            end_date = datetime.now().isoformat()
            start_date = (datetime.now() - timedelta(days=30)).isoformat()
            
            response = self.make_request("GET", "/balance", 
                                       params={"start_date": start_date, "end_date": end_date},
                                       auth_required=False)
            
            if response.status_code == 200:
                self.log_test("Balance Endpoint - Date Range", True, "Date filtering works")
            else:
                self.log_test("Balance Endpoint - Date Range", False, f"Status {response.status_code}")
                
            return True
            
        except Exception as e:
            self.log_test("Balance Endpoint", False, f"Exception: {str(e)}")
            return False

    def test_customers_endpoint(self):
        """Test customers CRUD operations"""
        try:
            # Test GET customers
            response = self.make_request("GET", "/customers", auth_required=False)
            
            if response.status_code == 200:
                customers = response.json()
                self.log_test("Get Customers", True, f"Found {len(customers)} customers")
                
                # Test customer structure
                if customers:
                    customer = customers[0]
                    required_fields = ["_id", "nombre"]
                    if all(field in customer for field in required_fields):
                        self.log_test("Customer Structure", True, "Customer fields present")
                    else:
                        self.log_test("Customer Structure", False, f"Missing fields in customer")
                        
                return True
            else:
                self.log_test("Get Customers", False, f"Status {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Customers Endpoint", False, f"Exception: {str(e)}")
            return False

    def test_suppliers_endpoint(self):
        """Test suppliers endpoint"""
        try:
            response = self.make_request("GET", "/suppliers")
            
            if response.status_code in [200, 401]:  # 401 expected without auth
                if response.status_code == 401:
                    self.log_test("Suppliers Endpoint", True, "Correctly requires authentication")
                else:
                    suppliers = response.json()
                    self.log_test("Suppliers Endpoint", True, f"Found {len(suppliers)} suppliers")
                return True
            else:
                self.log_test("Suppliers Endpoint", False, f"Status {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Suppliers Endpoint", False, f"Exception: {str(e)}")
            return False

    def test_products_endpoint(self):
        """Test products endpoint"""
        try:
            response = self.make_request("GET", "/products", auth_required=False)
            
            if response.status_code == 200:
                products = response.json()
                self.log_test("Get Products", True, f"Found {len(products)} products")
                
                # Test product structure
                if products:
                    product = products[0]
                    # Note: API uses Spanish field names
                    expected_fields = ["_id", "nombre"]
                    if all(field in product for field in expected_fields):
                        self.log_test("Product Structure", True, "Product fields present")
                    else:
                        self.log_test("Product Structure", False, f"Missing fields in product")
                        
                return True
            else:
                self.log_test("Products Endpoint", False, f"Status {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Products Endpoint", False, f"Exception: {str(e)}")
            return False

    def test_low_stock_alerts(self):
        """Test low stock alerts endpoint"""
        try:
            response = self.make_request("GET", "/alerts/low-stock", auth_required=False)
            
            if response.status_code == 200:
                alerts = response.json()
                self.log_test("Low Stock Alerts", True, f"Found {len(alerts)} low stock alerts")
                
                # Test alert structure
                if alerts:
                    alert = alerts[0]
                    required_fields = ["_id", "nombre", "alert_level", "min_stock_alert"]
                    if all(field in alert for field in required_fields):
                        self.log_test("Alert Structure", True, "Alert fields present")
                    else:
                        missing = [f for f in required_fields if f not in alert]
                        self.log_test("Alert Structure", False, f"Missing fields: {missing}")
                        
                return True
            else:
                self.log_test("Low Stock Alerts", False, f"Status {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Low Stock Alerts", False, f"Exception: {str(e)}")
            return False

    # ==================== AI & ANALYTICS TESTS ====================
    
    def test_ai_insights_endpoints(self):
        """Test AI insights endpoints"""
        try:
            # Test all insights
            response = self.make_request("GET", "/ai/all-insights", auth_required=False)
            
            if response.status_code == 200:
                data = response.json()
                insights = data.get("insights", [])
                self.log_test("AI All Insights", True, f"Found {len(insights)} insights")
                
                # Test insight structure
                if insights:
                    insight = insights[0]
                    required_fields = ["id", "type", "category", "icon", "color", "title", "message", "cta_text", "cta_action", "priority"]
                    if all(field in insight for field in required_fields):
                        self.log_test("AI Insight Structure", True, "All required fields present")
                    else:
                        missing = [f for f in required_fields if f not in insight]
                        self.log_test("AI Insight Structure", False, f"Missing fields: {missing}")
            else:
                self.log_test("AI All Insights", False, f"Status {response.status_code}")
                return False
                
            # Test insight of the day
            response = self.make_request("GET", "/ai/insight-of-the-day", auth_required=False)
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["type", "category", "icon", "color", "title", "message", "cta_text", "cta_action", "priority"]
                if all(field in data for field in required_fields):
                    self.log_test("AI Insight of the Day", True, f"Type: {data.get('type')}")
                else:
                    missing = [f for f in required_fields if f not in data]
                    self.log_test("AI Insight of the Day", False, f"Missing fields: {missing}")
            else:
                self.log_test("AI Insight of the Day", False, f"Status {response.status_code}")
                
            # Test quick actions
            response = self.make_request("GET", "/ai/quick-actions", auth_required=False)
            
            if response.status_code == 200:
                data = response.json()
                actions = data.get("actions", [])
                self.log_test("AI Quick Actions", True, f"Found {len(actions)} quick actions")
            else:
                self.log_test("AI Quick Actions", False, f"Status {response.status_code}")
                
            return True
            
        except Exception as e:
            self.log_test("AI Insights Endpoints", False, f"Exception: {str(e)}")
            return False

    # ==================== ADMIN OPS TESTS ====================
    
    def test_admin_ops_alert_settings(self):
        """Test admin ops alert settings endpoints"""
        try:
            # Test GET alert settings
            response = self.make_request("GET", "/admin-ops/alert-settings", auth_required=False)
            
            if response.status_code == 200:
                data = response.json()
                expected_fields = ["email", "whatsapp_number", "stock_alert_email", "daily_email", "weekly_email", "monthly_email"]
                if all(field in data for field in expected_fields):
                    self.log_test("Get Alert Settings", True, "All settings fields present")
                else:
                    missing = [f for f in expected_fields if f not in data]
                    self.log_test("Get Alert Settings", False, f"Missing fields: {missing}")
                    return False
            else:
                self.log_test("Get Alert Settings", False, f"Status {response.status_code}")
                return False
                
            # Test POST alert settings
            test_settings = {
                "email": "test@example.com",
                "whatsapp_number": "+593999123456",
                "stock_alert_email": True,
                "stock_alert_whatsapp": True,
                "stock_alert_push": True,
                "debt_alert_push": True,
                "daily_email": False,
                "daily_whatsapp": False,
                "daily_push": False,
                "weekly_email": False,
                "weekly_whatsapp": False,
                "weekly_push": True,
                "monthly_email": False,
                "monthly_whatsapp": False
            }
            
            response = self.make_request("POST", "/admin-ops/alert-settings", data=test_settings, auth_required=False)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    self.log_test("Save Alert Settings", True, "Settings saved successfully")
                else:
                    self.log_test("Save Alert Settings", False, "Success flag not returned")
            else:
                self.log_test("Save Alert Settings", False, f"Status {response.status_code}")
                
            return True
            
        except Exception as e:
            self.log_test("Admin Ops Alert Settings", False, f"Exception: {str(e)}")
            return False

    def test_dashboard_kpis(self):
        """Test dashboard KPI endpoints"""
        try:
            # Test main KPIs endpoint
            response = self.make_request("GET", "/dashboard/kpis", params={"period": "30d"}, auth_required=False)
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("Dashboard KPIs - 30d", True, f"KPIs retrieved for 30d period")
            else:
                self.log_test("Dashboard KPIs - 30d", False, f"Status {response.status_code}")
                return False
                
            # Test 7d period
            response = self.make_request("GET", "/dashboard/kpis", params={"period": "7d"}, auth_required=False)
            
            if response.status_code == 200:
                self.log_test("Dashboard KPIs - 7d", True, f"KPIs retrieved for 7d period")
            else:
                self.log_test("Dashboard KPIs - 7d", False, f"Status {response.status_code}")
                
            # Test new merchants endpoint
            response = self.make_request("GET", "/dashboard/merchants/new", auth_required=False)
            
            if response.status_code == 200:
                self.log_test("Dashboard New Merchants", True, "New merchants endpoint working")
            else:
                self.log_test("Dashboard New Merchants", False, f"Status {response.status_code}")
                
            # Test active merchants endpoint
            response = self.make_request("GET", "/dashboard/merchants/active", auth_required=False)
            
            if response.status_code == 200:
                self.log_test("Dashboard Active Merchants", True, "Active merchants endpoint working")
            else:
                self.log_test("Dashboard Active Merchants", False, f"Status {response.status_code}")
                
            # Test active clerks endpoint
            response = self.make_request("GET", "/dashboard/clerks/active", auth_required=False)
            
            if response.status_code == 200:
                self.log_test("Dashboard Active Clerks", True, "Active clerks endpoint working")
            else:
                self.log_test("Dashboard Active Clerks", False, f"Status {response.status_code}")
                
            return True
            
        except Exception as e:
            self.log_test("Dashboard KPIs", False, f"Exception: {str(e)}")
            return False

    # ==================== NOTIFICATIONS & ALERTS TESTS ====================
    
    def test_notification_endpoints(self):
        """Test notification endpoints"""
        try:
            # Test scheduler status
            response = self.make_request("GET", "/notifications/scheduler/status", auth_required=False)
            
            if response.status_code == 200:
                self.log_test("Notification Scheduler Status", True, "Scheduler status endpoint working")
            else:
                self.log_test("Notification Scheduler Status", False, f"Status {response.status_code}")
                
            # Test notification tokens endpoint
            response = self.make_request("GET", "/notifications/tokens", auth_required=False)
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("Notification Tokens", True, f"Found {len(data)} tokens")
            else:
                self.log_test("Notification Tokens", False, f"Status {response.status_code}")
                
            return True
            
        except Exception as e:
            self.log_test("Notification Endpoints", False, f"Exception: {str(e)}")
            return False

    # ==================== PUT ENDPOINTS TESTS ====================
    
    def test_put_endpoints_with_auth(self):
        """Test PUT endpoints with authentication"""
        if not self.auth_token:
            self.log_test("PUT Endpoints Auth", False, "No auth token available")
            return False
            
        try:
            # Test PUT product update
            response = self.make_request("GET", "/products", auth_required=False)
            if response.status_code == 200:
                products = response.json()
                if products:
                    product_id = products[0]["_id"]
                    
                    # Test PUT with auth
                    update_data = {"stock": 100.0, "quantity": 100.0}
                    response = self.make_request("PUT", f"/products/{product_id}", data=update_data, auth_required=True)
                    
                    if response.status_code == 200:
                        self.log_test("PUT Product with Auth", True, "Product updated successfully")
                    else:
                        self.log_test("PUT Product with Auth", False, f"Status {response.status_code}")
                        
                    # Test PUT without auth (should fail)
                    response = self.make_request("PUT", f"/products/{product_id}", data=update_data, auth_required=False)
                    
                    if response.status_code in [401, 403]:
                        self.log_test("PUT Product without Auth", True, "Correctly rejected unauthenticated request")
                    else:
                        self.log_test("PUT Product without Auth", False, f"Expected 401/403, got {response.status_code}")
                        
            # Test PUT customer update
            response = self.make_request("GET", "/customers", auth_required=False)
            if response.status_code == 200:
                customers = response.json()
                if customers:
                    customer_id = customers[0]["_id"]
                    
                    # Test PUT with auth
                    update_data = {"deuda_total": 50.0}
                    response = self.make_request("PUT", f"/customers/{customer_id}", data=update_data, auth_required=True)
                    
                    if response.status_code == 200:
                        self.log_test("PUT Customer with Auth", True, "Customer updated successfully")
                    else:
                        self.log_test("PUT Customer with Auth", False, f"Status {response.status_code}")
                        
            return True
            
        except Exception as e:
            self.log_test("PUT Endpoints Auth", False, f"Exception: {str(e)}")
            return False

    # ==================== MAIN TEST RUNNER ====================
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Comprehensive Backend API Testing")
        print(f"Base URL: {self.base_url}")
        print("=" * 60)
        
        # Authentication Tests
        print("\n📋 AUTHENTICATION & ONBOARDING TESTS")
        self.test_login_step1()
        self.test_login_step2()
        self.test_invalid_login()
        
        # Onboarding Tests
        print("\n📋 ONBOARDING FLOW TESTS")
        self.test_search_stores()
        self.test_register_single_store()
        
        # Core App Functionality Tests
        print("\n📋 CORE APP FUNCTIONALITY TESTS")
        self.test_balance_endpoint()
        self.test_customers_endpoint()
        self.test_suppliers_endpoint()
        self.test_products_endpoint()
        self.test_low_stock_alerts()
        
        # AI & Analytics Tests
        print("\n📋 AI & ANALYTICS TESTS")
        self.test_ai_insights_endpoints()
        
        # Admin Ops Tests
        print("\n📋 ADMIN OPS TESTS")
        self.test_admin_ops_alert_settings()
        self.test_dashboard_kpis()
        
        # Notifications Tests
        print("\n📋 NOTIFICATIONS & ALERTS TESTS")
        self.test_notification_endpoints()
        
        # PUT Endpoints with Auth Tests
        print("\n📋 AUTHENTICATED PUT ENDPOINTS TESTS")
        self.test_put_endpoints_with_auth()
        
        # Summary
        self.print_summary()

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t["success"]])
        failed_tests = len(self.failed_tests)
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        
        if self.failed_tests:
            print("\n🔍 FAILED TESTS DETAILS:")
            for test in self.failed_tests:
                print(f"❌ {test['test']}: {test['details']}")
        
        print("\n🎯 CRITICAL ENDPOINTS STATUS:")
        critical_endpoints = [
            "Login Step 1",
            "Get Customers", 
            "Get Products",
            "Balance Endpoint",
            "AI All Insights",
            "Get Alert Settings"
        ]
        
        for endpoint in critical_endpoints:
            test_result = next((t for t in self.test_results if t["test"] == endpoint), None)
            if test_result:
                status = "✅" if test_result["success"] else "❌"
                print(f"{status} {endpoint}")
            else:
                print(f"⚠️ {endpoint} - Not tested")
                
        print("\n" + "=" * 60)
        
        if failed_tests == 0:
            print("🎉 ALL TESTS PASSED! Backend is ready for deployment.")
        else:
            print(f"⚠️ {failed_tests} tests failed. Review issues before deployment.")
            
        return failed_tests == 0


def main():
    """Main function"""
    tester = BackendTester()
    
    try:
        success = tester.run_all_tests()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️ Testing interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n💥 Testing failed with exception: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()