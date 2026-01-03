#!/usr/bin/env python3
"""
Backend Testing for Admin Console - Comparisons and Top Products Fix
Testing the specific endpoints mentioned in the review request.
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BACKEND_URL = "https://bug-hunter-126.preview.emergentagent.com/api"
CREDENTIALS = {
    "username": "tiendaclave",
    "password": "Chifle98.",
    "pin": "1234"
}

# Test merchant and clerk IDs from the review request
MERCHANT_ID = "69373d809d90dca52da9d583"
CLERK_ID = "6945be279a72c2ed0b05d6d8"

class AdminConsoleTest:
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
        
    def test_login_step2(self):
        """Test POST /api/onboarding/login/step2 with merchant_id, clerk_id and PIN"""
        self.log("🔐 Testing Admin Login Step 2...")
        
        url = f"{BACKEND_URL}/onboarding/login/step2"
        params = {
            "merchant_id": MERCHANT_ID,
            "clerk_id": CLERK_ID,
            "pin": CREDENTIALS["pin"]
        }
        
        try:
            response = self.session.post(url, params=params)
            self.log(f"Login Step 2 Response Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                # Check for both 'access_token' and 'token' field names
                token = data.get("access_token") or data.get("token")
                if token:
                    self.token = token
                    self.session.headers.update({
                        'Authorization': f'Bearer {self.token}'
                    })
                    self.log("✅ Login Step 2 successful - JWT token obtained")
                    self.log(f"Token preview: {self.token[:50]}...")
                    user_info = data.get("user", {})
                    self.log(f"Logged in as: {user_info.get('clerk_name', 'Unknown')} - {user_info.get('store_name', 'Unknown Store')}")
                    return True
                else:
                    self.log("❌ Login Step 2 failed - No access_token or token in response")
                    self.log(f"Response: {data}")
                    return False
            else:
                self.log(f"❌ Login Step 2 failed - Status {response.status_code}")
                try:
                    error_data = response.json()
                    self.log(f"Error details: {error_data}")
                except:
                    self.log(f"Error text: {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Login Step 2 exception: {str(e)}", "ERROR")
            return False
    
    def test_admin_analytics(self):
        """Test GET /api/admin/analytics - should return top_products with non-empty array"""
        self.log("📊 Testing Admin Analytics...")
        
        if not self.token:
            self.log("❌ No token available for analytics test", "ERROR")
            return False
            
        url = f"{BACKEND_URL}/admin/analytics"
        
        try:
            response = self.session.get(url)
            self.log(f"Admin Analytics Response Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                
                # Check top_products
                top_products = data.get("top_products", [])
                self.log(f"Top products count: {len(top_products)}")
                
                if len(top_products) > 0:
                    self.log("✅ Top products array is NOT empty")
                    for i, product in enumerate(top_products[:3]):  # Show first 3
                        self.log(f"  Product {i+1}: {product.get('product_name', 'N/A')} - Qty: {product.get('quantity_sold', 0)} - Revenue: ${product.get('revenue', 0)}")
                else:
                    self.log("❌ Top products array is EMPTY")
                
                # Check sales.month
                sales_month = data.get("sales", {}).get("month", 0)
                self.log(f"Sales this month: ${sales_month}")
                
                if sales_month > 0:
                    self.log("✅ Sales this month > 0")
                else:
                    self.log("❌ Sales this month = 0")
                
                # Show full structure for debugging
                self.log("Analytics structure:")
                self.log(f"  - Products: total={data.get('products', {}).get('total', 0)}, low_stock={data.get('products', {}).get('low_stock', 0)}")
                self.log(f"  - Sales: today=${data.get('sales', {}).get('today', 0)}, week=${data.get('sales', {}).get('week', 0)}, month=${sales_month}")
                self.log(f"  - Customers: {data.get('customers', 0)}")
                self.log(f"  - Suppliers: {data.get('suppliers', 0)}")
                self.log(f"  - Debts: ${data.get('debts', {}).get('total', 0)}")
                
                return len(top_products) > 0 and sales_month > 0
                
            else:
                self.log(f"❌ Admin Analytics failed - Status {response.status_code}")
                try:
                    error_data = response.json()
                    self.log(f"Error details: {error_data}")
                except:
                    self.log(f"Error text: {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Admin Analytics exception: {str(e)}", "ERROR")
            return False
    
    def test_admin_comparisons(self):
        """Test GET /api/admin/comparisons - should return weekly, monthly, and seasonality data"""
        self.log("📈 Testing Admin Comparisons...")
        
        if not self.token:
            self.log("❌ No token available for comparisons test", "ERROR")
            return False
            
        url = f"{BACKEND_URL}/admin/comparisons"
        
        try:
            response = self.session.get(url)
            self.log(f"Admin Comparisons Response Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                
                # Check weekly comparison
                weekly = data.get("weekly", {})
                self.log(f"Weekly comparison: this_week=${weekly.get('this_week', 0)}, last_week=${weekly.get('last_week', 0)}")
                
                # Check monthly comparison  
                monthly = data.get("monthly", {})
                self.log(f"Monthly comparison: this_month=${monthly.get('this_month', 0)}, last_month=${monthly.get('last_month', 0)}")
                
                # Check seasonality
                seasonality = data.get("seasonality", {})
                best_day = seasonality.get("best_day", "N/A")
                worst_day = seasonality.get("worst_day", "N/A")
                avg_sale = seasonality.get("avg_sale", 0)
                peak_hour = seasonality.get("peak_hour", "N/A")
                
                self.log(f"Seasonality: best_day={best_day}, worst_day={worst_day}, avg_sale=${avg_sale}, peak_hour={peak_hour}")
                
                # Validate success criteria
                weekly_valid = weekly.get('this_week', 0) >= 0  # Allow 0 but check structure
                monthly_valid = monthly.get('this_month', 0) >= 0
                seasonality_valid = best_day != "N/A"
                
                if weekly_valid and monthly_valid and seasonality_valid:
                    self.log("✅ Admin Comparisons data structure is valid")
                    return True
                else:
                    self.log("❌ Admin Comparisons data structure has issues")
                    if not weekly_valid:
                        self.log("  - Weekly data missing or invalid")
                    if not monthly_valid:
                        self.log("  - Monthly data missing or invalid") 
                    if not seasonality_valid:
                        self.log("  - Seasonality best_day is N/A")
                    return False
                
            else:
                self.log(f"❌ Admin Comparisons failed - Status {response.status_code}")
                try:
                    error_data = response.json()
                    self.log(f"Error details: {error_data}")
                except:
                    self.log(f"Error text: {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Admin Comparisons exception: {str(e)}", "ERROR")
            return False
    
    def test_admin_my_merchants(self):
        """Test GET /api/admin/my-merchants - should return list of merchants"""
        self.log("🏪 Testing Admin My Merchants...")
        
        if not self.token:
            self.log("❌ No token available for my-merchants test", "ERROR")
            return False
            
        url = f"{BACKEND_URL}/admin/my-merchants"
        
        try:
            response = self.session.get(url)
            self.log(f"Admin My Merchants Response Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                
                merchants = data.get("merchants", [])
                has_multiple = data.get("has_multiple", False)
                
                self.log(f"Merchants count: {len(merchants)}")
                self.log(f"Has multiple: {has_multiple}")
                
                if len(merchants) > 0:
                    self.log("✅ Merchants list is NOT empty")
                    for i, merchant in enumerate(merchants):
                        self.log(f"  Merchant {i+1}: {merchant.get('name', 'N/A')} (ID: {merchant.get('id', 'N/A')})")
                    return True
                else:
                    self.log("❌ Merchants list is EMPTY")
                    return False
                
            else:
                self.log(f"❌ Admin My Merchants failed - Status {response.status_code}")
                try:
                    error_data = response.json()
                    self.log(f"Error details: {error_data}")
                except:
                    self.log(f"Error text: {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Admin My Merchants exception: {str(e)}", "ERROR")
            return False
    
    def run_all_tests(self):
        """Run all admin console tests in sequence"""
        self.log("🚀 Starting Admin Console Backend Testing...")
        self.log(f"Backend URL: {BACKEND_URL}")
        self.log(f"Testing with merchant_id: {MERCHANT_ID}, clerk_id: {CLERK_ID}")
        
        results = {}
        
        # Test 1: Login Step 2
        results['login'] = self.test_login_step2()
        
        if not results['login']:
            self.log("❌ Login failed - skipping other tests", "ERROR")
            return results
        
        # Test 2: Admin Analytics
        results['analytics'] = self.test_admin_analytics()
        
        # Test 3: Admin Comparisons  
        results['comparisons'] = self.test_admin_comparisons()
        
        # Test 4: Admin My Merchants
        results['my_merchants'] = self.test_admin_my_merchants()
        
        # Summary
        self.log("\n" + "="*60)
        self.log("📋 TEST RESULTS SUMMARY:")
        self.log("="*60)
        
        total_tests = len(results)
        passed_tests = sum(1 for result in results.values() if result)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{test_name.upper()}: {status}")
        
        self.log(f"\nOVERALL: {passed_tests}/{total_tests} tests passed")
        
        if passed_tests == total_tests:
            self.log("🎉 ALL TESTS PASSED - Admin Console endpoints are working correctly!")
        else:
            self.log("⚠️  SOME TESTS FAILED - Admin Console has issues that need attention")
        
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