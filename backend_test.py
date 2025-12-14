#!/usr/bin/env python3
"""
Backend API Testing Script
Tests the endpoints requested in the review:
1. AI Insights endpoints
2. Admin Ops Alert Settings
3. Customers endpoint
4. Products endpoint
"""

import requests
import json
import sys
import os

# Get backend URL from frontend .env
BACKEND_URL = "https://ai-frontend-revamp.preview.emergentagent.com/api"

# Test credentials
USERNAME = "tiendaclave"
PASSWORD = "Chifle98."

class BackendTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.token = None
        self.session = requests.Session()
        
    def login(self):
        """Login with provided credentials"""
        print("🔐 Logging in...")
        
        # Use the onboarding login endpoint as specified
        url = f"{self.base_url}/onboarding/login/step1"
        params = {
            "username": USERNAME,
            "password": PASSWORD
        }
        
        try:
            response = self.session.post(url, params=params)
            print(f"Login response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"Login response: {json.dumps(data, indent=2)}")
                
                # Check if it's a legacy account (no clerks)
                if data.get("legacy_account"):
                    self.token = data.get("token")
                    print("✅ Login successful (legacy account)")
                    return True
                else:
                    print("❌ New account with clerks - need step 2")
                    return False
            else:
                print(f"❌ Login failed: {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Login error: {str(e)}")
            return False
    
    def get_headers(self):
        """Get headers with authorization token"""
        if not self.token:
            return {}
        return {"Authorization": f"Bearer {self.token}"}
    
    def test_ai_insights_endpoints(self):
        """Test AI Insights endpoints"""
        print("\n🤖 Testing AI Insights endpoints...")
        
        endpoints = [
            "/ai/all-insights",
            "/ai/insight-of-the-day", 
            "/ai/quick-actions"
        ]
        
        results = {}
        
        for endpoint in endpoints:
            print(f"\n📍 Testing GET {endpoint}")
            url = f"{self.base_url}{endpoint}"
            
            try:
                response = self.session.get(url, headers=self.get_headers())
                print(f"Status: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"✅ Success - Response keys: {list(data.keys())}")
                    
                    # Validate expected fields for each endpoint
                    if endpoint == "/ai/all-insights":
                        if "insights" in data and isinstance(data["insights"], list):
                            print(f"   Found {len(data['insights'])} insights")
                            if data["insights"]:
                                insight = data["insights"][0]
                                expected_fields = ["id", "type", "category", "icon", "color", "title", "message", "cta_text", "cta_action", "cta_data", "priority", "timestamp"]
                                missing_fields = [f for f in expected_fields if f not in insight]
                                if missing_fields:
                                    print(f"   ⚠️ Missing fields in insight: {missing_fields}")
                                else:
                                    print("   ✅ All expected fields present")
                        
                    elif endpoint == "/ai/insight-of-the-day":
                        expected_fields = ["type", "category", "icon", "color", "title", "message", "cta_text", "cta_action", "cta_data", "priority"]
                        missing_fields = [f for f in expected_fields if f not in data]
                        if missing_fields:
                            print(f"   ⚠️ Missing fields: {missing_fields}")
                        else:
                            print("   ✅ All expected fields present")
                    
                    elif endpoint == "/ai/quick-actions":
                        if "actions" in data and isinstance(data["actions"], list):
                            print(f"   Found {len(data['actions'])} quick actions")
                        
                    results[endpoint] = {"status": "success", "data": data}
                    
                elif response.status_code == 401:
                    print("❌ Unauthorized - token may be invalid")
                    results[endpoint] = {"status": "unauthorized", "error": "401"}
                elif response.status_code == 403:
                    print("❌ Forbidden")
                    results[endpoint] = {"status": "forbidden", "error": "403"}
                elif response.status_code == 500:
                    print("❌ Internal Server Error")
                    print(f"Error: {response.text}")
                    results[endpoint] = {"status": "server_error", "error": response.text}
                else:
                    print(f"❌ Unexpected status: {response.status_code}")
                    print(f"Response: {response.text}")
                    results[endpoint] = {"status": "error", "code": response.status_code, "error": response.text}
                    
            except Exception as e:
                print(f"❌ Request error: {str(e)}")
                results[endpoint] = {"status": "exception", "error": str(e)}
        
        return results
    
    def test_admin_ops_alert_settings(self):
        """Test Admin Ops Alert Settings endpoints"""
        print("\n⚙️ Testing Admin Ops Alert Settings...")
        
        results = {}
        
        # Test GET alert-settings
        print(f"\n📍 Testing GET /admin_ops/alert-settings")
        url = f"{self.base_url}/admin_ops/alert-settings"
        
        try:
            response = self.session.get(url, headers=self.get_headers())
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Success - Response keys: {list(data.keys())}")
                expected_fields = ["email", "whatsapp_number", "stock_alert_email", "daily_email"]
                missing_fields = [f for f in expected_fields if f not in data]
                if missing_fields:
                    print(f"   ⚠️ Missing fields: {missing_fields}")
                else:
                    print("   ✅ All expected fields present")
                results["GET_alert_settings"] = {"status": "success", "data": data}
            else:
                print(f"❌ Failed: {response.status_code}")
                print(f"Response: {response.text}")
                results["GET_alert_settings"] = {"status": "error", "code": response.status_code, "error": response.text}
                
        except Exception as e:
            print(f"❌ Request error: {str(e)}")
            results["GET_alert_settings"] = {"status": "exception", "error": str(e)}
        
        # Test POST alert-settings
        print(f"\n📍 Testing POST /admin_ops/alert-settings")
        
        test_settings = {
            "email": "test@example.com",
            "whatsapp_number": "+593999123456",
            "stock_alert_email": True,
            "stock_alert_whatsapp": True,
            "daily_email": False,
            "daily_whatsapp": True,
            "weekly_email": True,
            "weekly_whatsapp": False,
            "monthly_email": True,
            "monthly_whatsapp": True
        }
        
        try:
            response = self.session.post(url, json=test_settings, headers=self.get_headers())
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Success - Response: {data}")
                if data.get("success"):
                    print("   ✅ Settings saved successfully")
                results["POST_alert_settings"] = {"status": "success", "data": data}
            else:
                print(f"❌ Failed: {response.status_code}")
                print(f"Response: {response.text}")
                results["POST_alert_settings"] = {"status": "error", "code": response.status_code, "error": response.text}
                
        except Exception as e:
            print(f"❌ Request error: {str(e)}")
            results["POST_alert_settings"] = {"status": "exception", "error": str(e)}
        
        return results
    
    def test_customers_endpoint(self):
        """Test Customers endpoint"""
        print("\n👥 Testing Customers endpoint...")
        
        print(f"\n📍 Testing GET /customers")
        url = f"{self.base_url}/customers"
        
        try:
            response = self.session.get(url, headers=self.get_headers())
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Success - Found {len(data)} customers")
                
                if data:
                    customer = data[0]
                    print(f"   Sample customer keys: {list(customer.keys())}")
                    expected_fields = ["_id", "name", "lastname"]
                    missing_fields = [f for f in expected_fields if f not in customer]
                    if missing_fields:
                        print(f"   ⚠️ Missing fields in customer: {missing_fields}")
                    else:
                        print("   ✅ Basic customer fields present")
                else:
                    print("   ℹ️ No customers found (empty list)")
                
                return {"status": "success", "data": data}
            else:
                print(f"❌ Failed: {response.status_code}")
                print(f"Response: {response.text}")
                return {"status": "error", "code": response.status_code, "error": response.text}
                
        except Exception as e:
            print(f"❌ Request error: {str(e)}")
            return {"status": "exception", "error": str(e)}
    
    def test_products_endpoint(self):
        """Test Products endpoint"""
        print("\n📦 Testing Products endpoint...")
        
        print(f"\n📍 Testing GET /products")
        url = f"{self.base_url}/products"
        
        try:
            response = self.session.get(url, headers=self.get_headers())
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Success - Found {len(data)} products")
                
                if data:
                    product = data[0]
                    print(f"   Sample product keys: {list(product.keys())}")
                    expected_fields = ["_id", "name", "price", "quantity"]
                    missing_fields = [f for f in expected_fields if f not in product]
                    if missing_fields:
                        print(f"   ⚠️ Missing fields in product: {missing_fields}")
                    else:
                        print("   ✅ Basic product fields present")
                else:
                    print("   ℹ️ No products found (empty list)")
                
                return {"status": "success", "data": data}
            else:
                print(f"❌ Failed: {response.status_code}")
                print(f"Response: {response.text}")
                return {"status": "error", "code": response.status_code, "error": response.text}
                
        except Exception as e:
            print(f"❌ Request error: {str(e)}")
            return {"status": "exception", "error": str(e)}
    
    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Backend API Tests")
        print(f"Backend URL: {self.base_url}")
        print(f"Username: {USERNAME}")
        
        # Login first
        if not self.login():
            print("❌ Cannot proceed without authentication")
            return False
        
        print(f"✅ Authentication successful, token: {self.token[:20]}...")
        
        # Run all tests
        results = {
            "ai_insights": self.test_ai_insights_endpoints(),
            "admin_ops_alert_settings": self.test_admin_ops_alert_settings(),
            "customers": self.test_customers_endpoint(),
            "products": self.test_products_endpoint()
        }
        
        # Summary
        print("\n" + "="*60)
        print("📊 TEST SUMMARY")
        print("="*60)
        
        total_tests = 0
        passed_tests = 0
        failed_tests = 0
        
        for category, category_results in results.items():
            print(f"\n{category.upper()}:")
            
            if isinstance(category_results, dict):
                if "status" in category_results:
                    # Single test result
                    total_tests += 1
                    if category_results["status"] == "success":
                        print(f"  ✅ PASSED")
                        passed_tests += 1
                    else:
                        print(f"  ❌ FAILED - {category_results.get('error', 'Unknown error')}")
                        failed_tests += 1
                else:
                    # Multiple test results
                    for test_name, test_result in category_results.items():
                        total_tests += 1
                        if test_result["status"] == "success":
                            print(f"  ✅ {test_name} - PASSED")
                            passed_tests += 1
                        else:
                            print(f"  ❌ {test_name} - FAILED - {test_result.get('error', 'Unknown error')}")
                            failed_tests += 1
        
        print(f"\n📈 OVERALL RESULTS:")
        print(f"   Total Tests: {total_tests}")
        print(f"   Passed: {passed_tests}")
        print(f"   Failed: {failed_tests}")
        print(f"   Success Rate: {(passed_tests/total_tests*100):.1f}%" if total_tests > 0 else "   Success Rate: 0%")
        
        if failed_tests > 0:
            print(f"\n⚠️ {failed_tests} tests failed. Check the detailed output above for specific errors.")
        else:
            print(f"\n🎉 All tests passed!")
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)