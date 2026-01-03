#!/usr/bin/env python3
"""
Backend Testing for Admin Console Endpoints with Merchant Filter Support
Testing the following endpoints:
1. POST /api/onboarding/login/step1 - Admin login
2. GET /api/admin/my-merchants - Get merchants for admin
3. GET /api/admin/analytics - Admin analytics (with/without merchant filter)
4. GET /api/admin/comparisons - Period comparisons (with/without merchant filter)
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://bug-hunter-126.preview.emergentagent.com"
ADMIN_CREDENTIALS = {
    "username": "tiendaclave",
    "password": "Chifle98."
}

class AdminConsoleTestSuite:
    def __init__(self):
        self.base_url = BASE_URL
        self.token = None
        self.merchants = []
        self.test_results = []
        
    def log_test(self, test_name, success, details="", response_data=None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        if response_data:
            result["response_data"] = response_data
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if not success and response_data:
            print(f"   Response: {response_data}")
        print()

    def test_admin_login(self):
        """Test 1: Login as admin user to get token (two-step process)"""
        print("🔐 Testing Admin Login...")
        
        try:
            # Step 1: Get merchant and clerks
            url_step1 = f"{self.base_url}/api/onboarding/login/step1"
            params = {
                "username": ADMIN_CREDENTIALS["username"],
                "password": ADMIN_CREDENTIALS["password"]
            }
            
            response1 = requests.post(url_step1, params=params, timeout=30)
            
            if response1.status_code != 200:
                self.log_test(
                    "Admin Login", 
                    False, 
                    f"Step 1 failed with status {response1.status_code}",
                    {"status_code": response1.status_code, "response": response1.text}
                )
                return False
            
            data1 = response1.json()
            
            # Check if it's a legacy account (direct token)
            if data1.get("legacy_account") and "token" in data1:
                self.token = data1["token"]
                user_info = data1.get("user", {})
                self.log_test(
                    "Admin Login", 
                    True, 
                    f"Successfully logged in as legacy account. Token obtained.",
                    {"status_code": response1.status_code, "user": user_info}
                )
                return True
            
            # New system - need step 2
            if not data1.get("success") or "clerks" not in data1:
                self.log_test(
                    "Admin Login", 
                    False, 
                    "Step 1 response invalid - missing clerks",
                    data1
                )
                return False
            
            # Get first clerk (Carlos Dueño based on response)
            clerks = data1["clerks"]
            if not clerks:
                self.log_test(
                    "Admin Login", 
                    False, 
                    "No clerks available for login",
                    data1
                )
                return False
            
            merchant_id = data1["merchant_id"]
            clerk_id = clerks[0]["clerk_id"]  # Use first clerk
            clerk_name = clerks[0]["name"]
            
            # Step 2: Login with clerk and PIN
            url_step2 = f"{self.base_url}/api/onboarding/login/step2"
            step2_params = {
                "merchant_id": merchant_id,
                "clerk_id": clerk_id,
                "pin": "1234"  # PIN from review request
            }
            
            response2 = requests.post(url_step2, params=step2_params, timeout=30)
            
            if response2.status_code == 200:
                data2 = response2.json()
                if "token" in data2:
                    self.token = data2["token"]
                    user_info = data2.get("user", {})
                    self.log_test(
                        "Admin Login", 
                        True, 
                        f"Successfully logged in as {clerk_name} with PIN. Token obtained.",
                        {"status_code": response2.status_code, "user": user_info}
                    )
                    return True
                else:
                    self.log_test(
                        "Admin Login", 
                        False, 
                        "Step 2 response missing token",
                        data2
                    )
                    return False
            else:
                self.log_test(
                    "Admin Login", 
                    False, 
                    f"Step 2 failed with status {response2.status_code}",
                    {"status_code": response2.status_code, "response": response2.text}
                )
                return False
                
        except Exception as e:
            self.log_test("Admin Login", False, f"Exception: {str(e)}")
            return False

    def test_get_my_merchants(self):
        """Test 2: Get merchants for admin with has_multiple flag"""
        print("🏪 Testing Get My Merchants...")
        
        if not self.token:
            self.log_test("Get My Merchants", False, "No auth token available")
            return False
            
        try:
            url = f"{self.base_url}/api/admin/my-merchants"
            headers = {"Authorization": f"Bearer {self.token}"}
            
            response = requests.get(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                
                # Validate response structure
                if "merchants" in data and "has_multiple" in data:
                    self.merchants = data["merchants"]
                    merchant_count = len(self.merchants)
                    has_multiple = data["has_multiple"]
                    
                    # Validate has_multiple flag logic
                    expected_has_multiple = merchant_count > 1
                    flag_correct = has_multiple == expected_has_multiple
                    
                    details = f"Found {merchant_count} merchants. has_multiple={has_multiple} (correct: {flag_correct})"
                    
                    if flag_correct:
                        self.log_test(
                            "Get My Merchants", 
                            True, 
                            details,
                            {"merchant_count": merchant_count, "has_multiple": has_multiple, "merchants": self.merchants}
                        )
                        return True
                    else:
                        self.log_test(
                            "Get My Merchants", 
                            False, 
                            f"{details} - has_multiple flag incorrect",
                            data
                        )
                        return False
                else:
                    self.log_test(
                        "Get My Merchants", 
                        False, 
                        "Response missing required fields (merchants, has_multiple)",
                        data
                    )
                    return False
            else:
                self.log_test(
                    "Get My Merchants", 
                    False, 
                    f"Request failed with status {response.status_code}",
                    {"status_code": response.status_code, "response": response.text}
                )
                return False
                
        except Exception as e:
            self.log_test("Get My Merchants", False, f"Exception: {str(e)}")
            return False

    def test_admin_analytics_without_filter(self):
        """Test 3: Get admin analytics without merchant filter (all merchants)"""
        print("📊 Testing Admin Analytics (All Merchants)...")
        
        if not self.token:
            self.log_test("Admin Analytics (All)", False, "No auth token available")
            return False
            
        try:
            url = f"{self.base_url}/api/admin/analytics"
            headers = {"Authorization": f"Bearer {self.token}"}
            
            response = requests.get(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                
                # Validate response structure
                required_fields = ["products", "sales", "expenses", "balance", "customers", "suppliers", "debts"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    # Check nested structure
                    products_valid = "total" in data["products"] and "low_stock" in data["products"]
                    sales_valid = "today" in data["sales"] and "week" in data["sales"] and "month" in data["sales"]
                    
                    if products_valid and sales_valid:
                        details = f"Analytics for all merchants: {data['products']['total']} products, ${data['sales']['month']:.2f} monthly sales"
                        self.log_test(
                            "Admin Analytics (All)", 
                            True, 
                            details,
                            {"products_total": data["products"]["total"], "monthly_sales": data["sales"]["month"]}
                        )
                        return True
                    else:
                        self.log_test(
                            "Admin Analytics (All)", 
                            False, 
                            "Response structure invalid (missing nested fields)",
                            data
                        )
                        return False
                else:
                    self.log_test(
                        "Admin Analytics (All)", 
                        False, 
                        f"Response missing required fields: {missing_fields}",
                        data
                    )
                    return False
            else:
                self.log_test(
                    "Admin Analytics (All)", 
                    False, 
                    f"Request failed with status {response.status_code}",
                    {"status_code": response.status_code, "response": response.text}
                )
                return False
                
        except Exception as e:
            self.log_test("Admin Analytics (All)", False, f"Exception: {str(e)}")
            return False

    def test_admin_analytics_with_filter(self):
        """Test 4: Get admin analytics with merchant filter"""
        print("📊 Testing Admin Analytics (Filtered by Merchant)...")
        
        if not self.token:
            self.log_test("Admin Analytics (Filtered)", False, "No auth token available")
            return False
            
        if not self.merchants:
            self.log_test("Admin Analytics (Filtered)", False, "No merchants available for filtering")
            return False
            
        try:
            # Use the first merchant for filtering
            merchant_id = self.merchants[0]["id"]
            merchant_name = self.merchants[0]["name"]
            
            url = f"{self.base_url}/api/admin/analytics"
            headers = {"Authorization": f"Bearer {self.token}"}
            params = {"merchant_id": merchant_id}
            
            response = requests.get(url, headers=headers, params=params, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                
                # Validate response structure (same as unfiltered)
                required_fields = ["products", "sales", "expenses", "balance", "customers", "suppliers", "debts"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    details = f"Analytics for merchant '{merchant_name}': {data['products']['total']} products, ${data['sales']['month']:.2f} monthly sales"
                    self.log_test(
                        "Admin Analytics (Filtered)", 
                        True, 
                        details,
                        {
                            "merchant_id": merchant_id, 
                            "merchant_name": merchant_name,
                            "products_total": data["products"]["total"], 
                            "monthly_sales": data["sales"]["month"]
                        }
                    )
                    return True
                else:
                    self.log_test(
                        "Admin Analytics (Filtered)", 
                        False, 
                        f"Response missing required fields: {missing_fields}",
                        data
                    )
                    return False
            else:
                self.log_test(
                    "Admin Analytics (Filtered)", 
                    False, 
                    f"Request failed with status {response.status_code}",
                    {"status_code": response.status_code, "response": response.text}
                )
                return False
                
        except Exception as e:
            self.log_test("Admin Analytics (Filtered)", False, f"Exception: {str(e)}")
            return False

    def test_admin_comparisons_without_filter(self):
        """Test 5: Get admin comparisons without merchant filter"""
        print("📈 Testing Admin Comparisons (All Merchants)...")
        
        if not self.token:
            self.log_test("Admin Comparisons (All)", False, "No auth token available")
            return False
            
        try:
            url = f"{self.base_url}/api/admin/comparisons"
            headers = {"Authorization": f"Bearer {self.token}"}
            
            response = requests.get(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                
                # Validate response structure
                required_fields = ["week_comparison", "month_comparison", "seasonality"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    # Check nested structure
                    week_valid = all(key in data["week_comparison"] for key in ["this_week", "last_week", "change_percent"])
                    month_valid = all(key in data["month_comparison"] for key in ["this_month", "last_month", "change_percent"])
                    seasonality_valid = "by_day_of_week" in data["seasonality"] and "best_day" in data["seasonality"]
                    
                    if week_valid and month_valid and seasonality_valid:
                        week_change = data["week_comparison"]["change_percent"]
                        month_change = data["month_comparison"]["change_percent"]
                        best_day = data["seasonality"]["best_day"]["day"]
                        
                        details = f"Comparisons for all merchants: Week change {week_change:.1f}%, Month change {month_change:.1f}%, Best day: {best_day}"
                        self.log_test(
                            "Admin Comparisons (All)", 
                            True, 
                            details,
                            {
                                "week_change": week_change,
                                "month_change": month_change,
                                "best_day": best_day
                            }
                        )
                        return True
                    else:
                        self.log_test(
                            "Admin Comparisons (All)", 
                            False, 
                            "Response structure invalid (missing nested comparison fields)",
                            data
                        )
                        return False
                else:
                    self.log_test(
                        "Admin Comparisons (All)", 
                        False, 
                        f"Response missing required fields: {missing_fields}",
                        data
                    )
                    return False
            else:
                self.log_test(
                    "Admin Comparisons (All)", 
                    False, 
                    f"Request failed with status {response.status_code}",
                    {"status_code": response.status_code, "response": response.text}
                )
                return False
                
        except Exception as e:
            self.log_test("Admin Comparisons (All)", False, f"Exception: {str(e)}")
            return False

    def test_admin_comparisons_with_filter(self):
        """Test 6: Get admin comparisons with merchant filter"""
        print("📈 Testing Admin Comparisons (Filtered by Merchant)...")
        
        if not self.token:
            self.log_test("Admin Comparisons (Filtered)", False, "No auth token available")
            return False
            
        if not self.merchants:
            self.log_test("Admin Comparisons (Filtered)", False, "No merchants available for filtering")
            return False
            
        try:
            # Use the first merchant for filtering
            merchant_id = self.merchants[0]["id"]
            merchant_name = self.merchants[0]["name"]
            
            url = f"{self.base_url}/api/admin/comparisons"
            headers = {"Authorization": f"Bearer {self.token}"}
            params = {"merchant_id": merchant_id}
            
            response = requests.get(url, headers=headers, params=params, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                
                # Validate response structure (same as unfiltered)
                required_fields = ["week_comparison", "month_comparison", "seasonality"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    week_change = data["week_comparison"]["change_percent"]
                    month_change = data["month_comparison"]["change_percent"]
                    best_day = data["seasonality"]["best_day"]["day"]
                    
                    details = f"Comparisons for merchant '{merchant_name}': Week change {week_change:.1f}%, Month change {month_change:.1f}%, Best day: {best_day}"
                    self.log_test(
                        "Admin Comparisons (Filtered)", 
                        True, 
                        details,
                        {
                            "merchant_id": merchant_id,
                            "merchant_name": merchant_name,
                            "week_change": week_change,
                            "month_change": month_change,
                            "best_day": best_day
                        }
                    )
                    return True
                else:
                    self.log_test(
                        "Admin Comparisons (Filtered)", 
                        False, 
                        f"Response missing required fields: {missing_fields}",
                        data
                    )
                    return False
            else:
                self.log_test(
                    "Admin Comparisons (Filtered)", 
                    False, 
                    f"Request failed with status {response.status_code}",
                    {"status_code": response.status_code, "response": response.text}
                )
                return False
                
        except Exception as e:
            self.log_test("Admin Comparisons (Filtered)", False, f"Exception: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all admin console tests in sequence"""
        print("🚀 Starting Admin Console Backend Testing...")
        print(f"Backend URL: {self.base_url}")
        print(f"Admin User: {ADMIN_CREDENTIALS['username']}")
        print("=" * 60)
        
        # Test sequence
        tests = [
            self.test_admin_login,
            self.test_get_my_merchants,
            self.test_admin_analytics_without_filter,
            self.test_admin_analytics_with_filter,
            self.test_admin_comparisons_without_filter,
            self.test_admin_comparisons_with_filter
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            if test():
                passed += 1
        
        print("=" * 60)
        print(f"🎯 TEST SUMMARY: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 ALL TESTS PASSED! Admin Console endpoints working correctly.")
        else:
            print(f"⚠️  {total - passed} tests failed. Check details above.")
            
        return passed == total

    def print_detailed_results(self):
        """Print detailed test results"""
        print("\n📋 DETAILED TEST RESULTS:")
        print("=" * 60)
        
        for result in self.test_results:
            status = "✅ PASS" if result["success"] else "❌ FAIL"
            print(f"{status} {result['test']}")
            print(f"   Time: {result['timestamp']}")
            if result["details"]:
                print(f"   Details: {result['details']}")
            if not result["success"] and "response_data" in result:
                print(f"   Response: {json.dumps(result['response_data'], indent=2)}")
            print()

def main():
    """Main test execution"""
    test_suite = AdminConsoleTestSuite()
    
    try:
        success = test_suite.run_all_tests()
        test_suite.print_detailed_results()
        
        # Exit with appropriate code
        sys.exit(0 if success else 1)
        
    except KeyboardInterrupt:
        print("\n⚠️ Testing interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()