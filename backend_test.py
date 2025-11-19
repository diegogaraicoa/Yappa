#!/usr/bin/env python3
"""
Backend Testing Script for KYB Module Endpoints
Testing all KYB CRUD operations and functionality
"""

import asyncio
import aiohttp
import json
import os
import sys
from datetime import datetime
from pathlib import Path

# Add backend to path for imports
sys.path.append('/app/backend')

# Configuration
BACKEND_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://ops-central-7.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

class KYBTester:
    def __init__(self):
        self.session = None
        self.auth_token = None
        self.test_results = []
        self.merchant_id = None
        self.kyb_id = None
        
    async def setup(self):
        """Setup test session and authentication"""
        self.session = aiohttp.ClientSession()
        
        # Register a test user to get auth token
        register_data = {
            "email": "kyb_tester@test.com",
            "password": "testpass123",
            "store_name": "KYB Test Store",
            "whatsapp_number": "+593999123456"
        }
        
        try:
            async with self.session.post(f"{API_BASE}/auth/register", json=register_data) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    self.auth_token = data["access_token"]
                    print("✅ Authentication setup successful")
                elif resp.status == 400:
                    # User might already exist, try login
                    login_data = {
                        "email": "kyb_tester@test.com",
                        "password": "testpass123"
                    }
                    async with self.session.post(f"{API_BASE}/auth/login", json=login_data) as login_resp:
                        if login_resp.status == 200:
                            data = await login_resp.json()
                            self.auth_token = data["access_token"]
                            print("✅ Authentication via login successful")
                        else:
                            print(f"❌ Login failed: {login_resp.status}")
                            return False
                else:
                    print(f"❌ Registration failed: {resp.status}")
                    return False
        except Exception as e:
            print(f"❌ Auth setup error: {e}")
            return False
            
        return True
    
    async def get_headers(self):
        """Get authorization headers"""
        return {
            "Authorization": f"Bearer {self.auth_token}",
            "Content-Type": "application/json"
        }
    
    async def find_test_merchant(self):
        """Find an existing merchant to use for testing"""
        try:
            # First, let's check if we have merchants in the database
            # We'll use the database connection directly
            from main import get_database
            db = get_database()
            
            # Look for merchants with specific usernames mentioned in the request
            test_usernames = ["tienda_demo", "tienda_norte"]
            
            for username in test_usernames:
                merchant = await db.merchants.find_one({"username": username})
                if merchant:
                    self.merchant_id = str(merchant["_id"])
                    print(f"✅ Found test merchant: {username} (ID: {self.merchant_id})")
                    return True
            
            # If no specific merchants found, get any merchant
            merchant = await db.merchants.find_one({})
            if merchant:
                self.merchant_id = str(merchant["_id"])
                print(f"✅ Using merchant: {merchant.get('username', 'N/A')} (ID: {self.merchant_id})")
                return True
            
            # If no merchants exist, create one for testing
            merchant_data = {
                "username": "test_merchant_kyb",
                "nombre": "Test Merchant for KYB",
                "email": "test@merchant.com",
                "created_at": datetime.utcnow()
            }
            result = await db.merchants.insert_one(merchant_data)
            self.merchant_id = str(result.inserted_id)
            print(f"✅ Created test merchant (ID: {self.merchant_id})")
            return True
            
        except Exception as e:
            print(f"❌ Error finding/creating merchant: {e}")
            return False
    
    async def test_create_kyb(self):
        """Test POST /api/kyb - Create KYB"""
        print("\n🧪 Testing POST /api/kyb - Create KYB")
        
        kyb_data = {
            "merchant_id": self.merchant_id,
            "nombre_legal": "Test Business Legal S.A.",
            "ruc_tax_id": "1234567890001",
            "direccion_fiscal": "Av. Test 123, Quito, Ecuador",
            "telefono_contacto": "+593999123456",
            "email_oficial": "legal@testbusiness.com",
            "representante_legal": "Juan Test Pérez",
            "notas": "Datos de prueba para KYB testing"
        }
        
        try:
            headers = await self.get_headers()
            async with self.session.post(f"{API_BASE}/kyb", json=kyb_data, headers=headers) as resp:
                status = resp.status
                data = await resp.json()
                
                if status == 201 or status == 200:
                    self.kyb_id = data.get("kyb_id")
                    print(f"✅ KYB created successfully - ID: {self.kyb_id}")
                    self.test_results.append(("POST /api/kyb - Create", True, f"Created with ID: {self.kyb_id}"))
                    return True
                else:
                    print(f"❌ Create KYB failed: {status} - {data}")
                    self.test_results.append(("POST /api/kyb - Create", False, f"Status: {status}, Response: {data}"))
                    return False
                    
        except Exception as e:
            print(f"❌ Create KYB error: {e}")
            self.test_results.append(("POST /api/kyb - Create", False, f"Exception: {e}"))
            return False
    
    async def test_get_kyb_by_merchant(self):
        """Test GET /api/kyb/{merchant_id} - Get KYB by merchant"""
        print(f"\n🧪 Testing GET /api/kyb/{self.merchant_id} - Get KYB by merchant")
        
        try:
            headers = await self.get_headers()
            async with self.session.get(f"{API_BASE}/kyb/{self.merchant_id}", headers=headers) as resp:
                status = resp.status
                data = await resp.json()
                
                if status == 200:
                    kyb = data.get("kyb", {})
                    merchant = data.get("merchant", {})
                    
                    # Verify all required fields are present
                    required_fields = ["id", "merchant_id", "nombre_legal", "ruc_tax_id", 
                                     "direccion_fiscal", "telefono_contacto", "email_oficial", 
                                     "representante_legal", "status"]
                    
                    missing_fields = [field for field in required_fields if field not in kyb]
                    
                    if not missing_fields:
                        print(f"✅ KYB retrieved successfully - Status: {kyb.get('status')}")
                        print(f"   Merchant: {merchant.get('nombre')} ({merchant.get('username')})")
                        self.test_results.append(("GET /api/kyb/{merchant_id}", True, "All fields present"))
                        return True
                    else:
                        print(f"❌ Missing fields in response: {missing_fields}")
                        self.test_results.append(("GET /api/kyb/{merchant_id}", False, f"Missing fields: {missing_fields}"))
                        return False
                else:
                    print(f"❌ Get KYB by merchant failed: {status} - {data}")
                    self.test_results.append(("GET /api/kyb/{merchant_id}", False, f"Status: {status}"))
                    return False
                    
        except Exception as e:
            print(f"❌ Get KYB by merchant error: {e}")
            self.test_results.append(("GET /api/kyb/{merchant_id}", False, f"Exception: {e}"))
            return False
    
    async def test_get_all_kyb(self):
        """Test GET /api/kyb - List all KYB"""
        print("\n🧪 Testing GET /api/kyb - List all KYB")
        
        # Test without filters
        try:
            headers = await self.get_headers()
            async with self.session.get(f"{API_BASE}/kyb", headers=headers) as resp:
                status = resp.status
                data = await resp.json()
                
                if status == 200:
                    required_stats = ["total", "pending_count", "approved_count", "rejected_count", "merchants_without_kyb"]
                    missing_stats = [stat for stat in required_stats if stat not in data]
                    
                    if not missing_stats and "kyb_data" in data:
                        print(f"✅ All KYB retrieved - Total: {data['total']}, Pending: {data['pending_count']}")
                        self.test_results.append(("GET /api/kyb - All", True, f"Total: {data['total']}"))
                    else:
                        print(f"❌ Missing stats in response: {missing_stats}")
                        self.test_results.append(("GET /api/kyb - All", False, f"Missing stats: {missing_stats}"))
                        return False
                else:
                    print(f"❌ Get all KYB failed: {status} - {data}")
                    self.test_results.append(("GET /api/kyb - All", False, f"Status: {status}"))
                    return False
        except Exception as e:
            print(f"❌ Get all KYB error: {e}")
            self.test_results.append(("GET /api/kyb - All", False, f"Exception: {e}"))
            return False
        
        # Test with status filter
        print("\n🧪 Testing GET /api/kyb?status=pending - Filter by status")
        try:
            async with self.session.get(f"{API_BASE}/kyb?status=pending", headers=headers) as resp:
                status = resp.status
                data = await resp.json()
                
                if status == 200:
                    # Verify all returned items have pending status
                    kyb_data = data.get("kyb_data", [])
                    non_pending = [item for item in kyb_data if item.get("status") != "pending"]
                    
                    if not non_pending:
                        print(f"✅ Filtered KYB retrieved - Pending items: {len(kyb_data)}")
                        self.test_results.append(("GET /api/kyb?status=pending", True, f"Pending: {len(kyb_data)}"))
                        return True
                    else:
                        print(f"❌ Filter not working - Found non-pending items: {len(non_pending)}")
                        self.test_results.append(("GET /api/kyb?status=pending", False, "Filter not working"))
                        return False
                else:
                    print(f"❌ Get filtered KYB failed: {status}")
                    self.test_results.append(("GET /api/kyb?status=pending", False, f"Status: {status}"))
                    return False
        except Exception as e:
            print(f"❌ Get filtered KYB error: {e}")
            self.test_results.append(("GET /api/kyb?status=pending", False, f"Exception: {e}"))
            return False
    
    async def test_update_kyb_status(self):
        """Test PATCH /api/kyb/{kyb_id} - Update status"""
        print(f"\n🧪 Testing PATCH /api/kyb/{self.kyb_id} - Update status")
        
        if not self.kyb_id:
            print("❌ No KYB ID available for update test")
            self.test_results.append(("PATCH /api/kyb/{kyb_id}", False, "No KYB ID"))
            return False
        
        update_data = {
            "status": "approved",
            "notas": "Aprobado después de testing - updated at " + datetime.now().isoformat()
        }
        
        try:
            headers = await self.get_headers()
            async with self.session.patch(f"{API_BASE}/kyb/{self.kyb_id}", json=update_data, headers=headers) as resp:
                status = resp.status
                data = await resp.json()
                
                if status == 200:
                    print("✅ KYB status updated successfully")
                    self.test_results.append(("PATCH /api/kyb/{kyb_id}", True, "Status updated to approved"))
                    
                    # Verify the update by getting the KYB again
                    async with self.session.get(f"{API_BASE}/kyb/{self.merchant_id}", headers=headers) as verify_resp:
                        if verify_resp.status == 200:
                            verify_data = await verify_resp.json()
                            kyb = verify_data.get("kyb", {})
                            if kyb.get("status") == "approved":
                                print("✅ Status update verified")
                                return True
                            else:
                                print(f"❌ Status not updated correctly: {kyb.get('status')}")
                                return False
                else:
                    print(f"❌ Update KYB failed: {status} - {data}")
                    self.test_results.append(("PATCH /api/kyb/{kyb_id}", False, f"Status: {status}"))
                    return False
                    
        except Exception as e:
            print(f"❌ Update KYB error: {e}")
            self.test_results.append(("PATCH /api/kyb/{kyb_id}", False, f"Exception: {e}"))
            return False
    
    async def test_csv_template_download(self):
        """Test GET /api/kyb/template/download - CSV template"""
        print("\n🧪 Testing GET /api/kyb/template/download - CSV template")
        
        try:
            headers = await self.get_headers()
            async with self.session.get(f"{API_BASE}/kyb/template/download", headers=headers) as resp:
                status = resp.status
                content_type = resp.headers.get('content-type', '')
                
                if status == 200 and 'text/csv' in content_type:
                    content = await resp.text()
                    
                    # Verify CSV headers
                    lines = content.strip().split('\n')
                    if len(lines) >= 2:  # Header + example row
                        headers_line = lines[0]
                        expected_headers = [
                            "merchant_username", "nombre_legal", "ruc_tax_id", 
                            "direccion_fiscal", "telefono_contacto", "email_oficial",
                            "representante_legal", "documento_representante_url", "notas"
                        ]
                        
                        # Check if all expected headers are present
                        headers_present = all(header in headers_line for header in expected_headers)
                        
                        if headers_present:
                            print("✅ CSV template downloaded successfully")
                            print(f"   Headers: {headers_line}")
                            self.test_results.append(("GET /api/kyb/template/download", True, "CSV template valid"))
                            return True
                        else:
                            print(f"❌ CSV headers incomplete: {headers_line}")
                            self.test_results.append(("GET /api/kyb/template/download", False, "Headers incomplete"))
                            return False
                    else:
                        print("❌ CSV content insufficient")
                        self.test_results.append(("GET /api/kyb/template/download", False, "Content insufficient"))
                        return False
                else:
                    print(f"❌ CSV template download failed: {status}, Content-Type: {content_type}")
                    self.test_results.append(("GET /api/kyb/template/download", False, f"Status: {status}"))
                    return False
                    
        except Exception as e:
            print(f"❌ CSV template download error: {e}")
            self.test_results.append(("GET /api/kyb/template/download", False, f"Exception: {e}"))
            return False
    
    async def test_update_existing_kyb(self):
        """Test POST /api/kyb - Update existing (same endpoint, different behavior)"""
        print(f"\n🧪 Testing POST /api/kyb - Update existing KYB")
        
        # Try to create/update with same merchant_id
        updated_kyb_data = {
            "merchant_id": self.merchant_id,
            "nombre_legal": "Updated Test Business Legal S.A.",
            "ruc_tax_id": "1234567890001",  # Same RUC
            "direccion_fiscal": "Av. Updated Test 456, Quito, Ecuador",  # Updated address
            "telefono_contacto": "+593999654321",  # Updated phone
            "email_oficial": "updated@testbusiness.com",  # Updated email
            "representante_legal": "Juan Updated Pérez",
            "notas": "Datos actualizados para KYB testing"
        }
        
        try:
            headers = await self.get_headers()
            async with self.session.post(f"{API_BASE}/kyb", json=updated_kyb_data, headers=headers) as resp:
                status = resp.status
                data = await resp.json()
                
                if status == 200:
                    # Should return update message, not create
                    if "actualizado" in data.get("message", "").lower():
                        print("✅ Existing KYB updated successfully (no duplicate created)")
                        self.test_results.append(("POST /api/kyb - Update existing", True, "Updated existing"))
                        
                        # Verify the update
                        async with self.session.get(f"{API_BASE}/kyb/{self.merchant_id}", headers=headers) as verify_resp:
                            if verify_resp.status == 200:
                                verify_data = await verify_resp.json()
                                kyb = verify_data.get("kyb", {})
                                if kyb.get("direccion_fiscal") == "Av. Updated Test 456, Quito, Ecuador":
                                    print("✅ Update verified - address changed")
                                    return True
                                else:
                                    print("❌ Update not reflected in data")
                                    return False
                        return True
                    else:
                        print(f"❌ Expected update but got: {data.get('message')}")
                        self.test_results.append(("POST /api/kyb - Update existing", False, "Not updated"))
                        return False
                else:
                    print(f"❌ Update existing KYB failed: {status} - {data}")
                    self.test_results.append(("POST /api/kyb - Update existing", False, f"Status: {status}"))
                    return False
                    
        except Exception as e:
            print(f"❌ Update existing KYB error: {e}")
            self.test_results.append(("POST /api/kyb - Update existing", False, f"Exception: {e}"))
            return False
    
    async def test_delete_kyb(self):
        """Test DELETE /api/kyb/{kyb_id} - Delete KYB"""
        print(f"\n🧪 Testing DELETE /api/kyb/{self.kyb_id} - Delete KYB")
        
        if not self.kyb_id:
            print("❌ No KYB ID available for delete test")
            self.test_results.append(("DELETE /api/kyb/{kyb_id}", False, "No KYB ID"))
            return False
        
        try:
            headers = await self.get_headers()
            async with self.session.delete(f"{API_BASE}/kyb/{self.kyb_id}", headers=headers) as resp:
                status = resp.status
                data = await resp.json()
                
                if status == 200:
                    print("✅ KYB deleted successfully")
                    self.test_results.append(("DELETE /api/kyb/{kyb_id}", True, "Deleted successfully"))
                    
                    # Verify deletion by trying to get the KYB
                    async with self.session.get(f"{API_BASE}/kyb/{self.merchant_id}", headers=headers) as verify_resp:
                        if verify_resp.status == 404:
                            print("✅ Deletion verified - KYB not found")
                            return True
                        else:
                            print("❌ KYB still exists after deletion")
                            return False
                else:
                    print(f"❌ Delete KYB failed: {status} - {data}")
                    self.test_results.append(("DELETE /api/kyb/{kyb_id}", False, f"Status: {status}"))
                    return False
                    
        except Exception as e:
            print(f"❌ Delete KYB error: {e}")
            self.test_results.append(("DELETE /api/kyb/{kyb_id}", False, f"Exception: {e}"))
            return False
    
    async def test_validation_errors(self):
        """Test validation scenarios"""
        print("\n🧪 Testing validation scenarios")
        
        # Test with non-existent merchant_id
        try:
            headers = await self.get_headers()
            fake_merchant_id = "507f1f77bcf86cd799439011"  # Valid ObjectId format but non-existent
            
            async with self.session.get(f"{API_BASE}/kyb/{fake_merchant_id}", headers=headers) as resp:
                if resp.status == 404:
                    print("✅ Validation: Non-existent merchant returns 404")
                    self.test_results.append(("Validation - Non-existent merchant", True, "404 as expected"))
                else:
                    print(f"❌ Validation: Expected 404 for non-existent merchant, got {resp.status}")
                    self.test_results.append(("Validation - Non-existent merchant", False, f"Got {resp.status}"))
                    
        except Exception as e:
            print(f"❌ Validation test error: {e}")
            self.test_results.append(("Validation - Non-existent merchant", False, f"Exception: {e}"))
    
    async def cleanup(self):
        """Cleanup test session"""
        if self.session:
            await self.session.close()
    
    def print_summary(self):
        """Print test results summary"""
        print("\n" + "="*60)
        print("🧪 KYB MODULE TESTING SUMMARY")
        print("="*60)
        
        passed = sum(1 for _, success, _ in self.test_results if success)
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total*100):.1f}%" if total > 0 else "0%")
        
        print("\nDetailed Results:")
        for test_name, success, details in self.test_results:
            status = "✅ PASS" if success else "❌ FAIL"
            print(f"{status} {test_name}: {details}")
        
        return passed == total

async def main():
    """Main testing function"""
    print("🚀 Starting KYB Module Backend Testing")
    print(f"Backend URL: {BACKEND_URL}")
    
    tester = KYBTester()
    
    try:
        # Setup
        if not await tester.setup():
            print("❌ Setup failed, aborting tests")
            return False
        
        # Find test merchant
        if not await tester.find_test_merchant():
            print("❌ Could not find/create test merchant, aborting tests")
            return False
        
        # Run all tests in sequence
        test_functions = [
            tester.test_create_kyb,
            tester.test_get_kyb_by_merchant,
            tester.test_get_all_kyb,
            tester.test_update_kyb_status,
            tester.test_csv_template_download,
            tester.test_update_existing_kyb,
            tester.test_validation_errors,
            tester.test_delete_kyb,  # Delete last
        ]
        
        for test_func in test_functions:
            await test_func()
            await asyncio.sleep(0.5)  # Small delay between tests
        
        # Print summary
        all_passed = tester.print_summary()
        
        return all_passed
        
    except Exception as e:
        print(f"❌ Testing error: {e}")
        return False
    finally:
        await tester.cleanup()

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)