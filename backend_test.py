#!/usr/bin/env python3
"""
Backend Testing for Admin Console Dashboard - Analytics and Comparisons Endpoints
Testing the specific endpoints mentioned in the review request.
"""

import requests
import json
import sys
from datetime import datetime

# Get backend URL from environment
BACKEND_URL = "https://bug-hunter-126.preview.emergentagent.com/api"

# Test credentials from review request
USERNAME = "tiendaclave"
PASSWORD = "Chifle98."
PIN = "1234"

class AdminConsoleTest:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.merchant_id = None
        self.clerk_id = None
        
    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")
        
    def test_login_flow(self):
        """Test the 2-step login flow as specified in review request"""
        self.log("🔐 Testing Login Flow...")
        
        # Step 1: Login with username and password
        self.log(f"Step 1: POST /onboarding/login/step1?username={USERNAME}&password={PASSWORD}")
        
        step1_url = f"{BACKEND_URL}/onboarding/login/step1"
        step1_params = {
            "username": USERNAME,
            "password": PASSWORD
        }
        
        try:
            response = self.session.post(step1_url, params=step1_params)
            self.log(f"Step 1 Response Status: {response.status_code}")
            
            if response.status_code != 200:
                self.log(f"❌ Step 1 Failed: {response.text}")
                return False
                
            step1_data = response.json()
            self.log(f"Step 1 Response: {json.dumps(step1_data, indent=2)}")
            
            # Check if it's a legacy account (direct token)
            if step1_data.get("legacy_account"):
                self.log("✅ Legacy account detected - using direct token")
                self.token = step1_data.get("token")
                self.merchant_id = step1_data.get("user", {}).get("merchant_id")
                return True
            
            # New system - get merchant_id and clerk_id for step 2
            self.merchant_id = step1_data.get("merchant_id")
            clerks = step1_data.get("clerks", [])
            
            if not clerks:
                self.log("❌ No clerks found for step 2")
                return False
                
            # Use first clerk for testing
            self.clerk_id = clerks[0]["clerk_id"]
            self.log(f"Using clerk: {clerks[0]['name']} (ID: {self.clerk_id})")
            
            # Step 2: Login with merchant_id, clerk_id, and PIN
            self.log(f"Step 2: POST /onboarding/login/step2?merchant_id={self.merchant_id}&clerk_id={self.clerk_id}&pin={PIN}")
            
            step2_url = f"{BACKEND_URL}/onboarding/login/step2"
            step2_params = {
                "merchant_id": self.merchant_id,
                "clerk_id": self.clerk_id,
                "pin": PIN
            }
            
            response = self.session.post(step2_url, params=step2_params)
            self.log(f"Step 2 Response Status: {response.status_code}")
            
            if response.status_code != 200:
                self.log(f"❌ Step 2 Failed: {response.text}")
                return False
                
            step2_data = response.json()
            self.log(f"Step 2 Response: {json.dumps(step2_data, indent=2)}")
            
            self.token = step2_data.get("token")
            
            if not self.token:
                self.log("❌ No token received from step 2")
                return False
                
            self.log("✅ Login flow completed successfully")
            return True
            
        except Exception as e:
            self.log(f"❌ Login flow failed with exception: {str(e)}")
            return False
    
    def test_admin_analytics(self):
        """Test GET /api/admin/analytics endpoint"""
        self.log("📊 Testing Admin Analytics Endpoint...")
        
        if not self.token:
            self.log("❌ No token available for analytics test")
            return False
            
        url = f"{BACKEND_URL}/admin/analytics"
        headers = {"Authorization": f"Bearer {self.token}"}
        
        try:
            response = self.session.get(url, headers=headers)
            self.log(f"Analytics Response Status: {response.status_code}")
            
            if response.status_code != 200:
                self.log(f"❌ Analytics Failed: {response.text}")
                return False
                
            data = response.json()
            self.log(f"Analytics Response: {json.dumps(data, indent=2)}")
            
            # Check success criteria from review request
            success = True
            
            # Check top_products array
            top_products = data.get("top_products", [])
            if len(top_products) < 1:
                self.log("❌ FAIL: top_products.length < 1")
                success = False
            else:
                self.log(f"✅ PASS: top_products.length = {len(top_products)} >= 1")
                
                # Check each product has required fields
                for i, product in enumerate(top_products):
                    required_fields = ["product_name", "quantity_sold", "revenue"]
                    for field in required_fields:
                        if field not in product:
                            self.log(f"❌ FAIL: top_products[{i}] missing field '{field}'")
                            success = False
                        else:
                            self.log(f"✅ PASS: top_products[{i}].{field} = {product[field]}")
            
            # Check sales.month > 0
            sales_month = data.get("sales", {}).get("month", 0)
            if sales_month <= 0:
                self.log(f"❌ FAIL: sales.month = {sales_month} <= 0")
                success = False
            else:
                self.log(f"✅ PASS: sales.month = {sales_month} > 0")
            
            return success
            
        except Exception as e:
            self.log(f"❌ Analytics test failed with exception: {str(e)}")
            return False
    
    def test_admin_comparisons(self):
        """Test GET /api/admin/comparisons endpoint"""
        self.log("📈 Testing Admin Comparisons Endpoint...")
        
        if not self.token:
            self.log("❌ No token available for comparisons test")
            return False
            
        url = f"{BACKEND_URL}/admin/comparisons"
        headers = {"Authorization": f"Bearer {self.token}"}
        
        try:
            response = self.session.get(url, headers=headers)
            self.log(f"Comparisons Response Status: {response.status_code}")
            
            if response.status_code != 200:
                self.log(f"❌ Comparisons Failed: {response.text}")
                return False
                
            data = response.json()
            self.log(f"Comparisons Response: {json.dumps(data, indent=2)}")
            
            # Check success criteria from review request
            success = True
            
            # Check weekly.this_week > 0
            weekly_this_week = data.get("weekly", {}).get("this_week", 0)
            if weekly_this_week <= 0:
                self.log(f"❌ FAIL: weekly.this_week = {weekly_this_week} <= 0")
                success = False
            else:
                self.log(f"✅ PASS: weekly.this_week = {weekly_this_week} > 0")
            
            # Check monthly.this_month > 0
            monthly_this_month = data.get("monthly", {}).get("this_month", 0)
            if monthly_this_month <= 0:
                self.log(f"❌ FAIL: monthly.this_month = {monthly_this_month} <= 0")
                success = False
            else:
                self.log(f"✅ PASS: monthly.this_month = {monthly_this_month} > 0")
            
            # Check seasonality.best_day.day != "N/A"
            best_day = data.get("seasonality", {}).get("best_day", {}).get("day", "N/A")
            if best_day == "N/A":
                self.log(f"❌ FAIL: seasonality.best_day.day = 'N/A'")
                success = False
            else:
                self.log(f"✅ PASS: seasonality.best_day.day = '{best_day}' != 'N/A'")
            
            return success
            
        except Exception as e:
            self.log(f"❌ Comparisons test failed with exception: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        self.log("🚀 Starting Admin Console Dashboard Testing...")
        self.log(f"Backend URL: {BACKEND_URL}")
        self.log(f"Credentials: {USERNAME} / {PASSWORD} / PIN: {PIN}")
        
        results = {}
        
        # Test 1: Login Flow
        results["login_flow"] = self.test_login_flow()
        
        if not results["login_flow"]:
            self.log("❌ Login failed - skipping other tests")
            return results
        
        # Test 2: Admin Analytics
        results["admin_analytics"] = self.test_admin_analytics()
        
        # Test 3: Admin Comparisons
        results["admin_comparisons"] = self.test_admin_comparisons()
        
        # Summary
        self.log("\n" + "="*60)
        self.log("📋 TEST SUMMARY")
        self.log("="*60)
        
        total_tests = len(results)
        passed_tests = sum(1 for result in results.values() if result)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{status} {test_name}")
        
        self.log(f"\nOverall: {passed_tests}/{total_tests} tests passed")
        
        if passed_tests == total_tests:
            self.log("🎉 ALL TESTS PASSED - Admin Console Dashboard endpoints working correctly!")
        else:
            self.log("⚠️ SOME TESTS FAILED - Check logs above for details")
        
        return results

def main():
    """Main test execution"""
    tester = AdminConsoleTest()
    results = tester.run_all_tests()
    
    # Exit with appropriate code
    all_passed = all(results.values())
    sys.exit(0 if all_passed else 1)

if __name__ == "__main__":
    main()