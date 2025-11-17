#!/usr/bin/env python3
"""
Backend Test Suite for Super Dashboard KPI Endpoints
Testing all KPI endpoints with comprehensive scenarios
"""

import asyncio
import aiohttp
import json
from datetime import datetime, timedelta
from typing import Dict, Any

# Configuration
BASE_URL = "https://streetbiz.preview.emergentagent.com/api"
TEST_USER_EMAIL = "admin@superdashboard.com"
TEST_USER_PASSWORD = "SuperDash2025!"
TEST_STORE_NAME = "Super Dashboard Test Store"
TEST_WHATSAPP = "+593999123456"

class DashboardTester:
    def __init__(self):
        self.session = None
        self.auth_token = None
        self.user_data = None
        
    async def setup(self):
        """Initialize test session"""
        self.session = aiohttp.ClientSession()
        print("🚀 Starting Super Dashboard KPI Testing...")
        
    async def cleanup(self):
        """Clean up test session"""
        if self.session:
            await self.session.close()
            
    async def register_test_user(self):
        """Register a test user for authentication"""
        try:
            user_data = {
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD,
                "store_name": TEST_STORE_NAME,
                "whatsapp_number": TEST_WHATSAPP
            }
            
            async with self.session.post(f"{BASE_URL}/auth/register", json=user_data) as response:
                if response.status == 200:
                    data = await response.json()
                    self.auth_token = data["access_token"]
                    self.user_data = data["user"]
                    print(f"✅ Test user registered successfully: {TEST_USER_EMAIL}")
                    return True
                elif response.status == 400:
                    # User already exists, try login
                    return await self.login_test_user()
                else:
                    print(f"❌ Registration failed: {response.status}")
                    return False
        except Exception as e:
            print(f"❌ Registration error: {e}")
            return False
            
    async def login_test_user(self):
        """Login with test user"""
        try:
            login_data = {
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            }
            
            async with self.session.post(f"{BASE_URL}/auth/login", json=login_data) as response:
                if response.status == 200:
                    data = await response.json()
                    self.auth_token = data["access_token"]
                    self.user_data = data["user"]
                    print(f"✅ Test user logged in successfully: {TEST_USER_EMAIL}")
                    return True
                else:
                    print(f"❌ Login failed: {response.status}")
                    return False
        except Exception as e:
            print(f"❌ Login error: {e}")
            return False
            
    def get_auth_headers(self):
        """Get authorization headers"""
        return {"Authorization": f"Bearer {self.auth_token}"}
        
    async def test_main_kpis_endpoint(self):
        """Test GET /api/dashboard/kpis - PRINCIPAL ENDPOINT"""
        print("\n🎯 TESTING MAIN KPIs ENDPOINT (MOST IMPORTANT)")
        print("=" * 60)
        
        test_cases = [
            {
                "name": "Default period (30d)",
                "params": {},
                "expected_keys": ["period", "active_merchants", "new_merchants", "active_clerks", "feature_usage", "churn", "hierarchy"]
            },
            {
                "name": "7 days period",
                "params": {"period": "7d"},
                "expected_keys": ["period", "active_merchants", "new_merchants", "active_clerks", "feature_usage", "churn", "hierarchy"]
            },
            {
                "name": "Today period",
                "params": {"period": "today"},
                "expected_keys": ["period", "active_merchants", "new_merchants", "active_clerks", "feature_usage", "churn", "hierarchy"]
            },
            {
                "name": "This month period",
                "params": {"period": "this_month"},
                "expected_keys": ["period", "active_merchants", "new_merchants", "active_clerks", "feature_usage", "churn", "hierarchy"]
            },
            {
                "name": "Custom date range",
                "params": {
                    "start_date": (datetime.now() - timedelta(days=15)).isoformat(),
                    "end_date": datetime.now().isoformat()
                },
                "expected_keys": ["period", "active_merchants", "new_merchants", "active_clerks", "feature_usage", "churn", "hierarchy"]
            }
        ]
        
        results = []
        
        for test_case in test_cases:
            try:
                print(f"\n📊 Testing: {test_case['name']}")
                
                async with self.session.get(
                    f"{BASE_URL}/dashboard/kpis",
                    params=test_case["params"],
                    headers=self.get_auth_headers()
                ) as response:
                    
                    status = response.status
                    print(f"   Status: {status}")
                    
                    if status == 200:
                        data = await response.json()
                        
                        # Validate JSON structure
                        missing_keys = []
                        for key in test_case["expected_keys"]:
                            if key not in data:
                                missing_keys.append(key)
                        
                        if missing_keys:
                            print(f"   ❌ Missing keys: {missing_keys}")
                            results.append({"test": test_case["name"], "status": "FAIL", "error": f"Missing keys: {missing_keys}"})
                        else:
                            print(f"   ✅ All required keys present")
                            
                            # Validate data structure
                            validation_errors = self.validate_kpi_structure(data)
                            if validation_errors:
                                print(f"   ⚠️  Structure issues: {validation_errors}")
                                results.append({"test": test_case["name"], "status": "PARTIAL", "issues": validation_errors})
                            else:
                                print(f"   ✅ JSON structure valid")
                                results.append({"test": test_case["name"], "status": "PASS", "data": data})
                                
                                # Print key metrics
                                self.print_kpi_summary(data, test_case["name"])
                    else:
                        error_text = await response.text()
                        print(f"   ❌ Request failed: {error_text}")
                        results.append({"test": test_case["name"], "status": "FAIL", "error": f"HTTP {status}: {error_text}"})
                        
            except Exception as e:
                print(f"   ❌ Exception: {e}")
                results.append({"test": test_case["name"], "status": "ERROR", "error": str(e)})
        
        return results
        
    def validate_kpi_structure(self, data: Dict[str, Any]) -> list[str]:
        """Validate KPI response structure"""
        errors = []
        
        # Validate period
        if "period" in data:
            period = data["period"]
            required_period_keys = ["start", "end", "previous_start", "previous_end"]
            for key in required_period_keys:
                if key not in period:
                    errors.append(f"period.{key} missing")
        
        # Validate active_merchants
        if "active_merchants" in data:
            am = data["active_merchants"]
            if "count" not in am or not isinstance(am["count"], int):
                errors.append("active_merchants.count invalid")
            if "merchants" not in am or not isinstance(am["merchants"], list):
                errors.append("active_merchants.merchants invalid")
        
        # Validate new_merchants
        if "new_merchants" in data:
            nm = data["new_merchants"]
            if "count" not in nm or not isinstance(nm["count"], int):
                errors.append("new_merchants.count invalid")
            if "change_percentage" in nm and nm["change_percentage"] is not None:
                if not isinstance(nm["change_percentage"], (int, float)):
                    errors.append("new_merchants.change_percentage invalid type")
        
        # Validate active_clerks
        if "active_clerks" in data:
            ac = data["active_clerks"]
            required_clerk_keys = ["count", "new_count", "existing_count", "clerks"]
            for key in required_clerk_keys:
                if key not in ac:
                    errors.append(f"active_clerks.{key} missing")
        
        # Validate churn
        if "churn" in data:
            churn = data["churn"]
            if "merchants" not in churn or "clerks" not in churn:
                errors.append("churn structure invalid")
            else:
                for entity in ["merchants", "clerks"]:
                    entity_data = churn[entity]
                    required_keys = ["churned_count", "churn_rate", "details"]
                    for key in required_keys:
                        if key not in entity_data:
                            errors.append(f"churn.{entity}.{key} missing")
        
        # Validate hierarchy
        if "hierarchy" in data:
            hierarchy = data["hierarchy"]
            required_keys = ["total_admins", "total_merchants", "total_clerks", "merchants_per_admin", "clerks_per_merchant"]
            for key in required_keys:
                if key not in hierarchy:
                    errors.append(f"hierarchy.{key} missing")
        
        return errors
        
    def print_kpi_summary(self, data: Dict[str, Any], test_name: str):
        """Print a summary of KPI data"""
        print(f"   📈 KPI Summary for {test_name}:")
        
        if "active_merchants" in data:
            print(f"      • Active Merchants: {data['active_merchants']['count']}")
        
        if "new_merchants" in data:
            nm = data["new_merchants"]
            change = nm.get("change_percentage", "N/A")
            print(f"      • New Merchants: {nm['count']} (Change: {change}%)")
        
        if "active_clerks" in data:
            ac = data["active_clerks"]
            print(f"      • Active Clerks: {ac['count']} (New: {ac.get('new_count', 0)}, Existing: {ac.get('existing_count', 0)})")
        
        if "churn" in data:
            churn = data["churn"]
            print(f"      • Merchant Churn: {churn['merchants']['churn_rate']}% ({churn['merchants']['churned_count']} churned)")
            print(f"      • Clerk Churn: {churn['clerks']['churn_rate']}% ({churn['clerks']['churned_count']} churned)")
        
        if "hierarchy" in data:
            h = data["hierarchy"]
            print(f"      • Hierarchy: {h['total_admins']} admins, {h['total_merchants']} merchants, {h['total_clerks']} clerks")
            
    async def test_individual_endpoints(self):
        """Test individual KPI endpoints"""
        print("\n🔍 TESTING INDIVIDUAL KPI ENDPOINTS")
        print("=" * 50)
        
        endpoints = [
            {
                "name": "Active Merchants",
                "url": "/dashboard/merchants/active",
                "expected_keys": ["count", "merchants"]
            },
            {
                "name": "New Merchants",
                "url": "/dashboard/merchants/new",
                "expected_keys": ["count", "merchants", "change_percentage"]
            },
            {
                "name": "Active Clerks",
                "url": "/dashboard/clerks/active",
                "expected_keys": ["count", "new_count", "existing_count", "clerks"]
            },
            {
                "name": "Churn Details",
                "url": "/dashboard/churn",
                "expected_keys": ["merchants", "clerks"]
            },
            {
                "name": "Hierarchy Breakdown",
                "url": "/dashboard/hierarchy",
                "expected_keys": ["total_admins", "total_merchants", "total_clerks", "merchants_per_admin", "clerks_per_merchant"]
            }
        ]
        
        results = []
        
        for endpoint in endpoints:
            try:
                print(f"\n📊 Testing: {endpoint['name']}")
                
                # Test with default period
                async with self.session.get(
                    f"{BASE_URL}{endpoint['url']}",
                    params={"period": "30d"},
                    headers=self.get_auth_headers()
                ) as response:
                    
                    status = response.status
                    print(f"   Status: {status}")
                    
                    if status == 200:
                        data = await response.json()
                        
                        # Check required keys
                        missing_keys = []
                        for key in endpoint["expected_keys"]:
                            if key not in data:
                                missing_keys.append(key)
                        
                        if missing_keys:
                            print(f"   ❌ Missing keys: {missing_keys}")
                            results.append({"endpoint": endpoint["name"], "status": "FAIL", "error": f"Missing keys: {missing_keys}"})
                        else:
                            print(f"   ✅ Structure valid")
                            results.append({"endpoint": endpoint["name"], "status": "PASS", "data": data})
                            
                            # Print summary
                            if "count" in data:
                                print(f"   📊 Count: {data['count']}")
                    else:
                        error_text = await response.text()
                        print(f"   ❌ Request failed: {error_text}")
                        results.append({"endpoint": endpoint["name"], "status": "FAIL", "error": f"HTTP {status}: {error_text}"})
                        
            except Exception as e:
                print(f"   ❌ Exception: {e}")
                results.append({"endpoint": endpoint["name"], "status": "ERROR", "error": str(e)})
        
        return results
        
    async def test_period_filters(self):
        """Test different period filters"""
        print("\n📅 TESTING PERIOD FILTERS")
        print("=" * 40)
        
        periods = ["30d", "7d", "today", "this_month", "last_month"]
        results = []
        
        for period in periods:
            try:
                print(f"\n🕒 Testing period: {period}")
                
                async with self.session.get(
                    f"{BASE_URL}/dashboard/kpis",
                    params={"period": period},
                    headers=self.get_auth_headers()
                ) as response:
                    
                    status = response.status
                    print(f"   Status: {status}")
                    
                    if status == 200:
                        data = await response.json()
                        
                        # Validate period dates make sense
                        period_data = data.get("period", {})
                        start = period_data.get("start")
                        end = period_data.get("end")
                        
                        if start and end:
                            start_dt = datetime.fromisoformat(start.replace('Z', '+00:00'))
                            end_dt = datetime.fromisoformat(end.replace('Z', '+00:00'))
                            
                            if start_dt <= end_dt:
                                print(f"   ✅ Period dates valid: {start_dt.date()} to {end_dt.date()}")
                                results.append({"period": period, "status": "PASS", "start": start_dt, "end": end_dt})
                            else:
                                print(f"   ❌ Invalid period dates: start > end")
                                results.append({"period": period, "status": "FAIL", "error": "Invalid date range"})
                        else:
                            print(f"   ❌ Missing period dates")
                            results.append({"period": period, "status": "FAIL", "error": "Missing period dates"})
                    else:
                        error_text = await response.text()
                        print(f"   ❌ Request failed: {error_text}")
                        results.append({"period": period, "status": "FAIL", "error": f"HTTP {status}: {error_text}"})
                        
            except Exception as e:
                print(f"   ❌ Exception: {e}")
                results.append({"period": period, "status": "ERROR", "error": str(e)})
        
        return results
        
    async def test_custom_date_ranges(self):
        """Test custom date ranges"""
        print("\n📆 TESTING CUSTOM DATE RANGES")
        print("=" * 45)
        
        test_ranges = [
            {
                "name": "Last 15 days",
                "start": (datetime.now() - timedelta(days=15)).isoformat(),
                "end": datetime.now().isoformat()
            },
            {
                "name": "Last 60 days",
                "start": (datetime.now() - timedelta(days=60)).isoformat(),
                "end": datetime.now().isoformat()
            },
            {
                "name": "Specific week",
                "start": (datetime.now() - timedelta(days=14)).isoformat(),
                "end": (datetime.now() - timedelta(days=7)).isoformat()
            }
        ]
        
        results = []
        
        for test_range in test_ranges:
            try:
                print(f"\n📊 Testing: {test_range['name']}")
                
                params = {
                    "start_date": test_range["start"],
                    "end_date": test_range["end"]
                }
                
                async with self.session.get(
                    f"{BASE_URL}/dashboard/kpis",
                    params=params,
                    headers=self.get_auth_headers()
                ) as response:
                    
                    status = response.status
                    print(f"   Status: {status}")
                    
                    if status == 200:
                        data = await response.json()
                        print(f"   ✅ Custom range accepted")
                        
                        # Validate returned period matches request
                        period_data = data.get("period", {})
                        returned_start = period_data.get("start")
                        returned_end = period_data.get("end")
                        
                        if returned_start and returned_end:
                            print(f"   📅 Returned period: {returned_start} to {returned_end}")
                            results.append({"range": test_range["name"], "status": "PASS", "data": data})
                        else:
                            print(f"   ⚠️  Missing period in response")
                            results.append({"range": test_range["name"], "status": "PARTIAL", "issue": "Missing period data"})
                    else:
                        error_text = await response.text()
                        print(f"   ❌ Request failed: {error_text}")
                        results.append({"range": test_range["name"], "status": "FAIL", "error": f"HTTP {status}: {error_text}"})
                        
            except Exception as e:
                print(f"   ❌ Exception: {e}")
                results.append({"range": test_range["name"], "status": "ERROR", "error": str(e)})
        
        return results
        
    async def test_data_consistency(self):
        """Test data consistency and logical validation"""
        print("\n🔍 TESTING DATA CONSISTENCY")
        print("=" * 40)
        
        try:
            # Get main KPIs
            async with self.session.get(
                f"{BASE_URL}/dashboard/kpis",
                params={"period": "30d"},
                headers=self.get_auth_headers()
            ) as response:
                
                if response.status != 200:
                    print("❌ Cannot fetch main KPIs for consistency test")
                    return [{"test": "data_consistency", "status": "FAIL", "error": "Cannot fetch main KPIs"}]
                
                main_data = await response.json()
                
                issues = []
                
                # Check for negative values
                if "active_merchants" in main_data:
                    count = main_data["active_merchants"]["count"]
                    if count < 0:
                        issues.append("Active merchants count is negative")
                    print(f"   ✅ Active merchants count: {count} (valid)")
                
                if "new_merchants" in main_data:
                    count = main_data["new_merchants"]["count"]
                    if count < 0:
                        issues.append("New merchants count is negative")
                    print(f"   ✅ New merchants count: {count} (valid)")
                
                if "active_clerks" in main_data:
                    ac = main_data["active_clerks"]
                    total = ac["count"]
                    new_count = ac.get("new_count", 0)
                    existing_count = ac.get("existing_count", 0)
                    
                    if total < 0 or new_count < 0 or existing_count < 0:
                        issues.append("Clerk counts contain negative values")
                    
                    if new_count + existing_count != total:
                        issues.append(f"Clerk count mismatch: {new_count} + {existing_count} != {total}")
                    else:
                        print(f"   ✅ Clerk counts consistent: {new_count} + {existing_count} = {total}")
                
                # Check churn rates
                if "churn" in main_data:
                    churn = main_data["churn"]
                    
                    for entity in ["merchants", "clerks"]:
                        if entity in churn:
                            churn_rate = churn[entity]["churn_rate"]
                            if churn_rate < 0 or churn_rate > 100:
                                issues.append(f"{entity} churn rate invalid: {churn_rate}%")
                            else:
                                print(f"   ✅ {entity.title()} churn rate valid: {churn_rate}%")
                
                # Check hierarchy totals
                if "hierarchy" in main_data:
                    h = main_data["hierarchy"]
                    
                    for key in ["total_admins", "total_merchants", "total_clerks"]:
                        if key in h and h[key] < 0:
                            issues.append(f"{key} is negative: {h[key]}")
                        else:
                            print(f"   ✅ {key}: {h.get(key, 0)} (valid)")
                    
                    # Check averages
                    merchants_per_admin = h.get("merchants_per_admin", 0)
                    clerks_per_merchant = h.get("clerks_per_merchant", 0)
                    
                    if merchants_per_admin < 0 or clerks_per_merchant < 0:
                        issues.append("Negative averages in hierarchy")
                    else:
                        print(f"   ✅ Averages valid: {merchants_per_admin} merchants/admin, {clerks_per_merchant} clerks/merchant")
                
                if issues:
                    print(f"\n⚠️  Data consistency issues found:")
                    for issue in issues:
                        print(f"   • {issue}")
                    return [{"test": "data_consistency", "status": "FAIL", "issues": issues}]
                else:
                    print(f"\n✅ All data consistency checks passed")
                    return [{"test": "data_consistency", "status": "PASS"}]
                    
        except Exception as e:
            print(f"❌ Data consistency test failed: {e}")
            return [{"test": "data_consistency", "status": "ERROR", "error": str(e)}]
            
    def print_final_summary(self, all_results):
        """Print final test summary"""
        print("\n" + "=" * 80)
        print("🎯 SUPER DASHBOARD KPI TESTING SUMMARY")
        print("=" * 80)
        
        total_tests = 0
        passed_tests = 0
        failed_tests = 0
        partial_tests = 0
        
        categories = [
            ("Main KPIs Endpoint", "main_kpis"),
            ("Individual Endpoints", "individual"),
            ("Period Filters", "periods"),
            ("Custom Date Ranges", "custom_ranges"),
            ("Data Consistency", "consistency")
        ]
        
        for category_name, category_key in categories:
            if category_key in all_results:
                results = all_results[category_key]
                print(f"\n📊 {category_name}:")
                
                for result in results:
                    total_tests += 1
                    status = result.get("status", "UNKNOWN")
                    
                    if status == "PASS":
                        passed_tests += 1
                        print(f"   ✅ {result.get('test', result.get('endpoint', result.get('period', result.get('range', 'Unknown'))))}")
                    elif status == "FAIL":
                        failed_tests += 1
                        error = result.get("error", result.get("issues", "Unknown error"))
                        print(f"   ❌ {result.get('test', result.get('endpoint', result.get('period', result.get('range', 'Unknown'))))}: {error}")
                    elif status == "PARTIAL":
                        partial_tests += 1
                        issue = result.get("issues", result.get("issue", "Unknown issue"))
                        print(f"   ⚠️  {result.get('test', result.get('endpoint', result.get('period', result.get('range', 'Unknown'))))}: {issue}")
                    else:
                        failed_tests += 1
                        print(f"   ❓ {result.get('test', result.get('endpoint', result.get('period', result.get('range', 'Unknown'))))}: {status}")
        
        print(f"\n📈 OVERALL RESULTS:")
        print(f"   Total Tests: {total_tests}")
        print(f"   ✅ Passed: {passed_tests}")
        print(f"   ❌ Failed: {failed_tests}")
        print(f"   ⚠️  Partial: {partial_tests}")
        
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        print(f"   🎯 Success Rate: {success_rate:.1f}%")
        
        if failed_tests == 0 and partial_tests == 0:
            print(f"\n🎉 ALL TESTS PASSED! Super Dashboard KPIs are fully functional!")
        elif failed_tests == 0:
            print(f"\n✅ Core functionality working with minor issues to address")
        else:
            print(f"\n⚠️  Critical issues found that need attention")
            
        return {
            "total": total_tests,
            "passed": passed_tests,
            "failed": failed_tests,
            "partial": partial_tests,
            "success_rate": success_rate
        }
        
    async def run_all_tests(self):
        """Run all Super Dashboard KPI tests"""
        await self.setup()
        
        try:
            # Authenticate
            if not await self.register_test_user():
                print("❌ Authentication failed - cannot proceed with tests")
                return
            
            all_results = {}
            
            # Run all test suites
            all_results["main_kpis"] = await self.test_main_kpis_endpoint()
            all_results["individual"] = await self.test_individual_endpoints()
            all_results["periods"] = await self.test_period_filters()
            all_results["custom_ranges"] = await self.test_custom_date_ranges()
            all_results["consistency"] = await self.test_data_consistency()
            
            # Print final summary
            summary = self.print_final_summary(all_results)
            
            return summary
            
        finally:
            await self.cleanup()

async def main():
    """Main test runner"""
    tester = DashboardTester()
    summary = await tester.run_all_tests()
    
    # Exit with appropriate code
    if summary and summary["failed"] == 0:
        exit(0)  # Success
    else:
        exit(1)  # Failure

if __name__ == "__main__":
    asyncio.run(main())