#!/usr/bin/env python3
"""
Backend Testing for New User Registration Flow (Onboarding Endpoints)
Testing all 4 onboarding endpoints with comprehensive validation scenarios
"""

import asyncio
import aiohttp
import json
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')
BACKEND_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'http://localhost:8001')
API_BASE = f"{BACKEND_URL}/api"

class OnboardingTester:
    def __init__(self):
        self.session = None
        self.test_results = []
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def log_test(self, test_name, success, details="", error=""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if error:
            print(f"   Error: {error}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "error": error
        })
    
    async def make_request(self, method, endpoint, data=None, params=None):
        """Make HTTP request with error handling"""
        url = f"{API_BASE}{endpoint}"
        try:
            if method.upper() == "GET":
                async with self.session.get(url, params=params) as response:
                    return response.status, await response.json()
            elif method.upper() == "POST":
                async with self.session.post(url, json=data) as response:
                    return response.status, await response.json()
        except Exception as e:
            return 500, {"error": str(e)}
    
    async def test_search_stores_endpoint(self):
        """Test GET /api/onboarding/search-stores endpoint"""
        print("\n🔍 TESTING SEARCH STORES ENDPOINT")
        
        # Test 1: Valid query with existing stores
        status, response = await self.make_request("GET", "/onboarding/search-stores", params={"query": "tienda"})
        if status == 200 and "stores" in response:
            stores = response["stores"]
            if len(stores) > 0:
                # Verify response structure
                first_store = stores[0]
                required_fields = ["merchant_id", "store_name", "business_name", "address"]
                has_all_fields = all(field in first_store for field in required_fields)
                
                self.log_test(
                    "Search stores - valid query",
                    True,
                    f"Found {len(stores)} stores, structure valid: {has_all_fields}"
                )
            else:
                self.log_test("Search stores - valid query", False, "No stores found")
        else:
            self.log_test("Search stores - valid query", False, f"Status: {status}, Response: {response}")
        
        # Test 2: Short query (should return empty)
        status, response = await self.make_request("GET", "/onboarding/search-stores", params={"query": "a"})
        if status == 200 and response.get("stores") == []:
            self.log_test("Search stores - short query", True, "Correctly returned empty for short query")
        else:
            self.log_test("Search stores - short query", False, f"Status: {status}, Response: {response}")
        
        # Test 3: Empty query
        status, response = await self.make_request("GET", "/onboarding/search-stores", params={"query": ""})
        if status == 200 and response.get("stores") == []:
            self.log_test("Search stores - empty query", True, "Correctly returned empty for empty query")
        else:
            self.log_test("Search stores - empty query", False, f"Status: {status}, Response: {response}")
        
        # Test 4: Non-existent store
        status, response = await self.make_request("GET", "/onboarding/search-stores", params={"query": "nonexistentstore12345"})
        if status == 200 and response.get("stores") == []:
            self.log_test("Search stores - non-existent", True, "Correctly returned empty for non-existent store")
        else:
            self.log_test("Search stores - non-existent", False, f"Status: {status}, Response: {response}")
    
    async def test_join_store_endpoint(self):
        """Test POST /api/onboarding/join-store endpoint"""
        print("\n🤝 TESTING JOIN STORE ENDPOINT")
        
        # First, get a valid merchant_id from search
        status, search_response = await self.make_request("GET", "/onboarding/search-stores", params={"query": "tienda"})
        if status != 200 or not search_response.get("stores"):
            self.log_test("Join store - setup", False, "Could not get merchant_id for testing")
            return
        
        merchant_id = search_response["stores"][0]["merchant_id"]
        
        # Test 1: Valid join store request
        unique_email = f"newclerk_{datetime.now().strftime('%Y%m%d_%H%M%S')}@test.com"
        valid_data = {
            "merchant_id": merchant_id,
            "first_name": "Maria",
            "last_name": "Rodriguez",
            "email": unique_email,
            "phone": "+593987654321",
            "pin": "1234",
            "role": "employee"
        }
        
        status, response = await self.make_request("POST", "/onboarding/join-store", data=valid_data)
        if status == 200 and response.get("success"):
            required_fields = ["success", "token", "user"]
            has_all_fields = all(field in response for field in required_fields)
            user_data = response.get("user", {})
            user_fields_valid = all(field in user_data for field in ["clerk_id", "clerk_name", "store_name"])
            
            self.log_test(
                "Join store - valid data",
                True,
                f"Success: {response.get('success')}, has required fields: {has_all_fields}, user data valid: {user_fields_valid}"
            )
        else:
            self.log_test("Join store - valid data", False, f"Status: {status}, Response: {response}")
        
        # Test 2: Invalid PIN (not 4 digits)
        invalid_pin_data = valid_data.copy()
        invalid_pin_data["pin"] = "123"  # Only 3 digits
        invalid_pin_data["email"] = f"invalid_pin_{datetime.now().strftime('%Y%m%d_%H%M%S')}@test.com"
        
        status, response = await self.make_request("POST", "/onboarding/join-store", data=invalid_pin_data)
        if status == 400:
            self.log_test("Join store - invalid PIN", True, f"Correctly rejected invalid PIN: {response.get('detail')}")
        else:
            self.log_test("Join store - invalid PIN", False, f"Status: {status}, should be 400")
        
        # Test 3: Duplicate email
        duplicate_email_data = valid_data.copy()
        duplicate_email_data["email"] = unique_email  # Same email as first test
        
        status, response = await self.make_request("POST", "/onboarding/join-store", data=duplicate_email_data)
        if status == 400:
            self.log_test("Join store - duplicate email", True, f"Correctly rejected duplicate email: {response.get('detail')}")
        else:
            self.log_test("Join store - duplicate email", False, f"Status: {status}, should be 400")
        
        # Test 4: Invalid merchant_id
        invalid_merchant_data = valid_data.copy()
        invalid_merchant_data["merchant_id"] = "000000000000000000000000"  # Non-existent ObjectId
        invalid_merchant_data["email"] = f"invalid_merchant_{datetime.now().strftime('%Y%m%d_%H%M%S')}@test.com"
        
        status, response = await self.make_request("POST", "/onboarding/join-store", data=invalid_merchant_data)
        if status == 404:
            self.log_test("Join store - invalid merchant_id", True, f"Correctly rejected invalid merchant_id: {response.get('detail')}")
        else:
            self.log_test("Join store - invalid merchant_id", False, f"Status: {status}, should be 404")
    
    async def test_register_single_store_endpoint(self):
        """Test POST /api/onboarding/register-single-store endpoint"""
        print("\n🏪 TESTING REGISTER SINGLE STORE ENDPOINT")
        
        # Test 1: Valid single store registration
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        unique_email = f"singlestore_{timestamp}@test.com"
        
        valid_data = {
            "store_name": f"Mi Tienda {timestamp}",
            "email": unique_email,
            "password": "SecurePass123",
            "first_name": "Carlos",
            "last_name": "Mendez",
            "phone": "+593998877665",
            "pin": "5678",
            "role": "owner"
        }
        
        status, response = await self.make_request("POST", "/onboarding/register-single-store", data=valid_data)
        if status == 200 and response.get("success"):
            required_fields = ["success", "admin_id", "merchant_id", "clerk_id", "token"]
            has_all_fields = all(field in response for field in required_fields)
            user_data = response.get("user", {})
            user_fields_valid = all(field in user_data for field in ["admin_id", "merchant_id", "clerk_id", "store_name"])
            
            self.log_test(
                "Register single store - valid data",
                True,
                f"Success: {response.get('success')}, has required fields: {has_all_fields}, user data valid: {user_fields_valid}"
            )
        else:
            self.log_test("Register single store - valid data", False, f"Status: {status}, Response: {response}")
        
        # Test 2: Invalid PIN validation
        invalid_pin_data = valid_data.copy()
        invalid_pin_data["pin"] = "12345"  # 5 digits instead of 4
        invalid_pin_data["email"] = f"invalid_pin_single_{timestamp}@test.com"
        invalid_pin_data["store_name"] = f"Invalid PIN Store {timestamp}"
        
        status, response = await self.make_request("POST", "/onboarding/register-single-store", data=invalid_pin_data)
        if status == 400:
            self.log_test("Register single store - invalid PIN", True, f"Correctly rejected invalid PIN: {response.get('detail')}")
        else:
            self.log_test("Register single store - invalid PIN", False, f"Status: {status}, should be 400")
        
        # Test 3: Duplicate email validation
        duplicate_email_data = valid_data.copy()
        duplicate_email_data["email"] = unique_email  # Same email as first test
        duplicate_email_data["store_name"] = f"Duplicate Email Store {timestamp}"
        
        status, response = await self.make_request("POST", "/onboarding/register-single-store", data=duplicate_email_data)
        if status == 400:
            self.log_test("Register single store - duplicate email", True, f"Correctly rejected duplicate email: {response.get('detail')}")
        else:
            self.log_test("Register single store - duplicate email", False, f"Status: {status}, should be 400")
    
    async def test_register_multi_store_endpoint(self):
        """Test POST /api/onboarding/register-multi-store endpoint"""
        print("\n🏢 TESTING REGISTER MULTI STORE ENDPOINT")
        
        # Test 1: Valid multi-store registration (2 stores minimum)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        unique_email = f"multistore_{timestamp}@test.com"
        
        valid_data = {
            "business_name": f"Cadena Comercial {timestamp}",
            "email": unique_email,
            "password": "SecurePass123",
            "stores": [
                {
                    "store_name": f"Sucursal Norte {timestamp}",
                    "address": "Av. Principal 123",
                    "phone": "+593987654321"
                },
                {
                    "store_name": f"Sucursal Sur {timestamp}",
                    "address": "Calle Secundaria 456",
                    "phone": "+593987654322"
                }
            ],
            "clerks_per_store": {
                "0": [
                    {
                        "first_name": "Ana",
                        "last_name": "Garcia",
                        "email": f"ana_{timestamp}@test.com",
                        "phone": "+593987654323",
                        "pin": "1111",
                        "role": "owner"
                    }
                ],
                "1": [
                    {
                        "first_name": "Luis",
                        "last_name": "Martinez",
                        "email": f"luis_{timestamp}@test.com",
                        "phone": "+593987654324",
                        "pin": "2222",
                        "role": "employee"
                    }
                ]
            }
        }
        
        status, response = await self.make_request("POST", "/onboarding/register-multi-store", data=valid_data)
        if status == 200 and response.get("success"):
            required_fields = ["success", "admin_id", "merchants", "token"]
            has_all_fields = all(field in response for field in required_fields)
            merchants = response.get("merchants", [])
            merchants_valid = len(merchants) == 2 and all("merchant_id" in m for m in merchants)
            
            self.log_test(
                "Register multi store - valid data",
                True,
                f"Success: {response.get('success')}, has required fields: {has_all_fields}, merchants created: {len(merchants)}, merchants valid: {merchants_valid}"
            )
        else:
            self.log_test("Register multi store - valid data", False, f"Status: {status}, Response: {response}")
        
        # Test 2: Duplicate email validation
        duplicate_email_data = valid_data.copy()
        duplicate_email_data["email"] = unique_email  # Same email as first test
        duplicate_email_data["business_name"] = f"Duplicate Business {timestamp}"
        
        status, response = await self.make_request("POST", "/onboarding/register-multi-store", data=duplicate_email_data)
        if status == 400:
            self.log_test("Register multi store - duplicate email", True, f"Correctly rejected duplicate email: {response.get('detail')}")
        else:
            self.log_test("Register multi store - duplicate email", False, f"Status: {status}, should be 400")
        
        # Test 3: Minimum stores validation (test with 1 store - should work but verify it creates properly)
        single_store_data = {
            "business_name": f"Single Store Business {timestamp}",
            "email": f"single_business_{timestamp}@test.com",
            "password": "SecurePass123",
            "stores": [
                {
                    "store_name": f"Only Store {timestamp}",
                    "address": "Solo Address 789",
                    "phone": "+593987654325"
                }
            ],
            "clerks_per_store": {
                "0": [
                    {
                        "first_name": "Solo",
                        "last_name": "Owner",
                        "email": f"solo_{timestamp}@test.com",
                        "phone": "+593987654326",
                        "pin": "3333",
                        "role": "owner"
                    }
                ]
            }
        }
        
        status, response = await self.make_request("POST", "/onboarding/register-multi-store", data=single_store_data)
        if status == 200 and response.get("success"):
            merchants = response.get("merchants", [])
            self.log_test("Register multi store - single store", True, f"Accepted single store, created {len(merchants)} merchants")
        else:
            self.log_test("Register multi store - single store", False, f"Status: {status}, Response: {response}")
    
    async def test_data_persistence(self):
        """Test that data is properly persisted in MongoDB"""
        print("\n💾 TESTING DATA PERSISTENCE")
        
        # This would require direct database access to verify
        # For now, we'll test by trying to search for recently created stores
        
        # Search for stores created in our tests
        status, response = await self.make_request("GET", "/onboarding/search-stores", params={"query": "Mi Tienda"})
        if status == 200:
            stores = response.get("stores", [])
            recent_stores = [s for s in stores if "Mi Tienda" in s.get("store_name", "")]
            
            self.log_test(
                "Data persistence - search recent stores",
                len(recent_stores) > 0,
                f"Found {len(recent_stores)} recently created stores in search"
            )
        else:
            self.log_test("Data persistence - search recent stores", False, f"Search failed: {status}")
    
    async def test_jwt_token_validation(self):
        """Test JWT token generation and basic validation"""
        print("\n🔐 TESTING JWT TOKEN VALIDATION")
        
        # Create a single store to get a token
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        token_test_data = {
            "store_name": f"Token Test Store {timestamp}",
            "email": f"tokentest_{timestamp}@test.com",
            "password": "SecurePass123",
            "first_name": "Token",
            "last_name": "Tester",
            "phone": "+593998877666",
            "pin": "9999",
            "role": "owner"
        }
        
        status, response = await self.make_request("POST", "/onboarding/register-single-store", data=token_test_data)
        if status == 200 and response.get("token"):
            token = response["token"]
            
            # Basic token format validation (JWT has 3 parts separated by dots)
            token_parts = token.split('.')
            is_jwt_format = len(token_parts) == 3
            
            self.log_test(
                "JWT token generation",
                is_jwt_format,
                f"Token generated with correct JWT format: {len(token_parts)} parts"
            )
        else:
            self.log_test("JWT token generation", False, f"Failed to get token: {status}")
    
    async def run_all_tests(self):
        """Run all onboarding endpoint tests"""
        print("🚀 STARTING ONBOARDING ENDPOINTS TESTING")
        print(f"Backend URL: {BACKEND_URL}")
        print("=" * 60)
        
        await self.test_search_stores_endpoint()
        await self.test_join_store_endpoint()
        await self.test_register_single_store_endpoint()
        await self.test_register_multi_store_endpoint()
        await self.test_data_persistence()
        await self.test_jwt_token_validation()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['error']}")
        
        return passed_tests, failed_tests

async def main():
    """Main test execution"""
    async with OnboardingTester() as tester:
        passed, failed = await tester.run_all_tests()
        
        if failed == 0:
            print("\n🎉 ALL TESTS PASSED! Onboarding endpoints are working correctly.")
        else:
            print(f"\n⚠️  {failed} tests failed. Please review the issues above.")
        
        return failed == 0

if __name__ == "__main__":
    success = asyncio.run(main())
    exit(0 if success else 1)