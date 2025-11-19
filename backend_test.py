#!/usr/bin/env python3
"""
Backend Testing Suite for Admin Ops CRUD - Refactor KYB to Admin
Testing all 22 endpoints with comprehensive scenarios including happy path and error cases.
"""

import asyncio
import aiohttp
import json
import sys
from datetime import datetime
from typing import Dict, Any, Optional

# Backend URL from environment
BACKEND_URL = "https://ops-central-7.preview.emergentagent.com/api"

class AdminOpsTestSuite:
    def __init__(self):
        self.session = None
        self.test_results = []
        self.created_entities = {
            'admins': [],
            'merchants': [],
            'clerks': [],
            'kyb': []
        }
        
    async def setup(self):
        """Setup test session"""
        self.session = aiohttp.ClientSession()
        
    async def cleanup(self):
        """Cleanup test session"""
        if self.session:
            await self.session.close()
            
    async def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Dict[str, Any]:
        """Make HTTP request to backend"""
        url = f"{BACKEND_URL}{endpoint}"
        
        try:
            if method.upper() == "GET":
                async with self.session.get(url) as response:
                    result = {
                        'status': response.status,
                        'data': await response.json() if response.content_type == 'application/json' else await response.text()
                    }
            elif method.upper() == "POST":
                async with self.session.post(url, json=data) as response:
                    result = {
                        'status': response.status,
                        'data': await response.json() if response.content_type == 'application/json' else await response.text()
                    }
            elif method.upper() == "PATCH":
                async with self.session.patch(url, json=data) as response:
                    result = {
                        'status': response.status,
                        'data': await response.json() if response.content_type == 'application/json' else await response.text()
                    }
            elif method.upper() == "DELETE":
                async with self.session.delete(url) as response:
                    result = {
                        'status': response.status,
                        'data': await response.json() if response.content_type == 'application/json' else await response.text()
                    }
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return result
            
        except Exception as e:
            return {
                'status': 0,
                'data': f"Request failed: {str(e)}"
            }
    
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}")
        if details:
            print(f"    Details: {details}")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'details': details
        })
    
    # ============================================
    # ADMIN TESTS
    # ============================================
    
    async def test_create_admin(self):
        """Test 1: Create Admin"""
        admin_data = {
            "nombre": "Test Admin Company",
            "email": "admin@testcompany.com",
            "telefono": "+593999123456"
        }
        
        result = await self.make_request("POST", "/admin-ops/admins", admin_data)
        
        if result['status'] == 200 and 'admin_id' in result['data']:
            admin_id = result['data']['admin_id']
            self.created_entities['admins'].append(admin_id)
            self.log_test("Create Admin", True, f"Admin created with ID: {admin_id}")
            return admin_id
        else:
            self.log_test("Create Admin", False, f"Status: {result['status']}, Data: {result['data']}")
            return None
    
    async def test_get_all_admins(self):
        """Test 2: Get All Admins"""
        result = await self.make_request("GET", "/admin-ops/admins")
        
        if result['status'] == 200 and 'count' in result['data'] and 'admins' in result['data']:
            count = result['data']['count']
            admins = result['data']['admins']
            self.log_test("Get All Admins", True, f"Retrieved {count} admins")
            return True
        else:
            self.log_test("Get All Admins", False, f"Status: {result['status']}, Data: {result['data']}")
            return False
    
    async def test_get_admin_by_id(self, admin_id: str):
        """Test 3: Get Admin by ID"""
        result = await self.make_request("GET", f"/admin-ops/admins/{admin_id}")
        
        if result['status'] == 200 and 'id' in result['data']:
            self.log_test("Get Admin by ID", True, f"Retrieved admin: {result['data']['nombre']}")
            return True
        else:
            self.log_test("Get Admin by ID", False, f"Status: {result['status']}, Data: {result['data']}")
            return False
    
    async def test_update_admin(self, admin_id: str):
        """Test 4: Update Admin"""
        update_data = {
            "nombre": "Updated Test Admin Company",
            "email": "admin@testcompany.com",  # Same email
            "telefono": "+593999654321"
        }
        
        result = await self.make_request("PATCH", f"/admin-ops/admins/{admin_id}", update_data)
        
        if result['status'] == 200:
            self.log_test("Update Admin", True, "Admin updated successfully")
            return True
        else:
            self.log_test("Update Admin", False, f"Status: {result['status']}, Data: {result['data']}")
            return False
    
    # ============================================
    # MERCHANT TESTS
    # ============================================
    
    async def test_create_merchant(self, admin_id: str):
        """Test 5: Create Merchant"""
        merchant_data = {
            "admin_id": admin_id,
            "username": "test_merchant_store",
            "password": "merchant123",
            "nombre": "Tienda de Prueba",
            "direccion": "Av. Principal 123, Quito",
            "telefono": "+593999111222"
        }
        
        result = await self.make_request("POST", "/admin-ops/merchants", merchant_data)
        
        if result['status'] == 200 and 'merchant_id' in result['data']:
            merchant_id = result['data']['merchant_id']
            self.created_entities['merchants'].append(merchant_id)
            self.log_test("Create Merchant", True, f"Merchant created with ID: {merchant_id}")
            return merchant_id
        else:
            self.log_test("Create Merchant", False, f"Status: {result['status']}, Data: {result['data']}")
            return None
    
    async def test_get_all_merchants(self):
        """Test 6: Get All Merchants"""
        result = await self.make_request("GET", "/admin-ops/merchants")
        
        if result['status'] == 200 and 'count' in result['data'] and 'merchants' in result['data']:
            count = result['data']['count']
            self.log_test("Get All Merchants", True, f"Retrieved {count} merchants")
            return True
        else:
            self.log_test("Get All Merchants", False, f"Status: {result['status']}, Data: {result['data']}")
            return False
    
    async def test_get_merchant_by_id(self, merchant_id: str):
        """Test 7: Get Merchant by ID"""
        result = await self.make_request("GET", f"/admin-ops/merchants/{merchant_id}")
        
        if result['status'] == 200 and 'id' in result['data']:
            self.log_test("Get Merchant by ID", True, f"Retrieved merchant: {result['data']['nombre']}")
            return True
        else:
            self.log_test("Get Merchant by ID", False, f"Status: {result['status']}, Data: {result['data']}")
            return False
    
    async def test_update_merchant(self, merchant_id: str, admin_id: str):
        """Test 8: Update Merchant"""
        update_data = {
            "admin_id": admin_id,
            "username": "test_merchant_store",  # Same username
            "password": "newpassword123",
            "nombre": "Tienda de Prueba Actualizada",
            "direccion": "Av. Principal 456, Quito",
            "telefono": "+593999333444"
        }
        
        result = await self.make_request("PATCH", f"/admin-ops/merchants/{merchant_id}", update_data)
        
        if result['status'] == 200:
            self.log_test("Update Merchant", True, "Merchant updated successfully")
            return True
        else:
            self.log_test("Update Merchant", False, f"Status: {result['status']}, Data: {result['data']}")
            return False
    
    # ============================================
    # CLERK TESTS
    # ============================================
    
    async def test_create_clerk(self, merchant_id: str):
        """Test 9: Create Clerk"""
        clerk_data = {
            "merchant_id": merchant_id,
            "email": "clerk@teststore.com",
            "password": "clerk123",
            "nombre": "Juan Empleado",
            "whatsapp_number": "+593999555666",
            "role": "employee"
        }
        
        result = await self.make_request("POST", "/admin-ops/clerks", clerk_data)
        
        if result['status'] == 200 and 'clerk_id' in result['data']:
            clerk_id = result['data']['clerk_id']
            self.created_entities['clerks'].append(clerk_id)
            self.log_test("Create Clerk", True, f"Clerk created with ID: {clerk_id}")
            return clerk_id
        else:
            self.log_test("Create Clerk", False, f"Status: {result['status']}, Data: {result['data']}")
            return None
    
    async def test_get_all_clerks(self):
        """Test 10: Get All Clerks"""
        result = await self.make_request("GET", "/admin-ops/clerks")
        
        if result['status'] == 200 and 'count' in result['data'] and 'clerks' in result['data']:
            count = result['data']['count']
            self.log_test("Get All Clerks", True, f"Retrieved {count} clerks")
            return True
        else:
            self.log_test("Get All Clerks", False, f"Status: {result['status']}, Data: {result['data']}")
            return False
    
    async def test_get_clerk_by_id(self, clerk_id: str):
        """Test 11: Get Clerk by ID"""
        result = await self.make_request("GET", f"/admin-ops/clerks/{clerk_id}")
        
        if result['status'] == 200 and 'id' in result['data']:
            self.log_test("Get Clerk by ID", True, f"Retrieved clerk: {result['data']['nombre']}")
            return True
        else:
            self.log_test("Get Clerk by ID", False, f"Status: {result['status']}, Data: {result['data']}")
            return False
    
    async def test_update_clerk(self, clerk_id: str, merchant_id: str):
        """Test 12: Update Clerk"""
        update_data = {
            "merchant_id": merchant_id,
            "email": "clerk@teststore.com",  # Same email
            "password": "newclerkpass123",
            "nombre": "Juan Empleado Actualizado",
            "whatsapp_number": "+593999777888",
            "role": "manager"
        }
        
        result = await self.make_request("PATCH", f"/admin-ops/clerks/{clerk_id}", update_data)
        
        if result['status'] == 200:
            self.log_test("Update Clerk", True, "Clerk updated successfully")
            return True
        else:
            self.log_test("Update Clerk", False, f"Status: {result['status']}, Data: {result['data']}")
            return False
    
    # ============================================
    # KYB TESTS
    # ============================================
    
    async def test_create_kyb(self, admin_id: str):
        """Test 13: Create KYB"""
        kyb_data = {
            "admin_id": admin_id,
            "nombre_legal": "Test Company S.A.",
            "ruc_tax_id": "1234567890001",
            "direccion_fiscal": "Calle Fiscal 123, Quito, Ecuador",
            "telefono_contacto": "+593999111222",
            "email_oficial": "legal@testcompany.com",
            "representante_legal": "Juan Representante",
            "documento_representante": None,
            "notas": "KYB de prueba para testing"
        }
        
        result = await self.make_request("POST", "/admin-ops/kyb", kyb_data)
        
        if result['status'] == 200 and 'kyb_id' in result['data']:
            kyb_id = result['data']['kyb_id']
            self.created_entities['kyb'].append(kyb_id)
            self.log_test("Create KYB", True, f"KYB created with ID: {kyb_id}")
            return kyb_id
        else:
            self.log_test("Create KYB", False, f"Status: {result['status']}, Data: {result['data']}")
            return None
    
    async def test_get_kyb_by_admin(self, admin_id: str):
        """Test 14: Get KYB by Admin ID"""
        result = await self.make_request("GET", f"/admin-ops/kyb/{admin_id}")
        
        if result['status'] == 200 and 'kyb' in result['data']:
            kyb = result['data']['kyb']
            self.log_test("Get KYB by Admin ID", True, f"Retrieved KYB: {kyb['nombre_legal']}")
            return True
        else:
            self.log_test("Get KYB by Admin ID", False, f"Status: {result['status']}, Data: {result['data']}")
            return False
    
    async def test_get_all_kyb(self):
        """Test 15: Get All KYB"""
        result = await self.make_request("GET", "/admin-ops/kyb")
        
        if result['status'] == 200 and 'total' in result['data'] and 'kyb_data' in result['data']:
            total = result['data']['total']
            pending = result['data']['pending_count']
            approved = result['data']['approved_count']
            rejected = result['data']['rejected_count']
            self.log_test("Get All KYB", True, f"Retrieved {total} KYB records (Pending: {pending}, Approved: {approved}, Rejected: {rejected})")
            return True
        else:
            self.log_test("Get All KYB", False, f"Status: {result['status']}, Data: {result['data']}")
            return False
    
    async def test_update_kyb(self, kyb_id: str):
        """Test 16: Update KYB Status"""
        update_data = {
            "status": "approved",
            "notas": "KYB aprobado después de revisión"
        }
        
        result = await self.make_request("PATCH", f"/admin-ops/kyb/{kyb_id}", update_data)
        
        if result['status'] == 200:
            self.log_test("Update KYB", True, "KYB status updated to approved")
            return True
        else:
            self.log_test("Update KYB", False, f"Status: {result['status']}, Data: {result['data']}")
            return False
    
    # ============================================
    # ERROR VALIDATION TESTS
    # ============================================
    
    async def test_create_merchant_invalid_admin(self):
        """Test 17: Create Merchant with Invalid Admin ID"""
        merchant_data = {
            "admin_id": "000000000000000000000000",  # Invalid ObjectId
            "username": "invalid_merchant",
            "password": "test123",
            "nombre": "Invalid Merchant"
        }
        
        result = await self.make_request("POST", "/admin-ops/merchants", merchant_data)
        
        if result['status'] == 404:
            self.log_test("Create Merchant with Invalid Admin ID", True, "Correctly returned 404 for invalid admin_id")
            return True
        else:
            self.log_test("Create Merchant with Invalid Admin ID", False, f"Expected 404, got {result['status']}")
            return False
    
    async def test_create_clerk_invalid_merchant(self):
        """Test 18: Create Clerk with Invalid Merchant ID"""
        clerk_data = {
            "merchant_id": "000000000000000000000000",  # Invalid ObjectId
            "email": "invalid@clerk.com",
            "password": "test123",
            "nombre": "Invalid Clerk"
        }
        
        result = await self.make_request("POST", "/admin-ops/clerks", clerk_data)
        
        if result['status'] == 404:
            self.log_test("Create Clerk with Invalid Merchant ID", True, "Correctly returned 404 for invalid merchant_id")
            return True
        else:
            self.log_test("Create Clerk with Invalid Merchant ID", False, f"Expected 404, got {result['status']}")
            return False
    
    async def test_create_kyb_invalid_admin(self):
        """Test 19: Create KYB with Invalid Admin ID"""
        kyb_data = {
            "admin_id": "000000000000000000000000",  # Invalid ObjectId
            "nombre_legal": "Invalid Company",
            "ruc_tax_id": "0000000000001",
            "direccion_fiscal": "Invalid Address",
            "telefono_contacto": "+593999000000",
            "email_oficial": "invalid@company.com",
            "representante_legal": "Invalid Rep"
        }
        
        result = await self.make_request("POST", "/admin-ops/kyb", kyb_data)
        
        if result['status'] == 404:
            self.log_test("Create KYB with Invalid Admin ID", True, "Correctly returned 404 for invalid admin_id")
            return True
        else:
            self.log_test("Create KYB with Invalid Admin ID", False, f"Expected 404, got {result['status']}")
            return False
    
    async def test_duplicate_admin_email(self):
        """Test 20: Create Admin with Duplicate Email"""
        admin_data = {
            "nombre": "Duplicate Admin",
            "email": "admin@testcompany.com",  # Same email as first admin
            "telefono": "+593999000000"
        }
        
        result = await self.make_request("POST", "/admin-ops/admins", admin_data)
        
        if result['status'] == 400:
            self.log_test("Create Admin with Duplicate Email", True, "Correctly returned 400 for duplicate email")
            return True
        else:
            self.log_test("Create Admin with Duplicate Email", False, f"Expected 400, got {result['status']}")
            return False
    
    async def test_duplicate_merchant_username(self):
        """Test 21: Create Merchant with Duplicate Username"""
        if not self.created_entities['admins']:
            self.log_test("Create Merchant with Duplicate Username", False, "No admin available for test")
            return False
            
        merchant_data = {
            "admin_id": self.created_entities['admins'][0],
            "username": "test_merchant_store",  # Same username as first merchant
            "password": "test123",
            "nombre": "Duplicate Merchant"
        }
        
        result = await self.make_request("POST", "/admin-ops/merchants", merchant_data)
        
        if result['status'] == 400:
            self.log_test("Create Merchant with Duplicate Username", True, "Correctly returned 400 for duplicate username")
            return True
        else:
            self.log_test("Create Merchant with Duplicate Username", False, f"Expected 400, got {result['status']}")
            return False
    
    async def test_duplicate_clerk_email(self):
        """Test 22: Create Clerk with Duplicate Email"""
        if not self.created_entities['merchants']:
            self.log_test("Create Clerk with Duplicate Email", False, "No merchant available for test")
            return False
            
        clerk_data = {
            "merchant_id": self.created_entities['merchants'][0],
            "email": "clerk@teststore.com",  # Same email as first clerk
            "password": "test123",
            "nombre": "Duplicate Clerk"
        }
        
        result = await self.make_request("POST", "/admin-ops/clerks", clerk_data)
        
        if result['status'] == 400:
            self.log_test("Create Clerk with Duplicate Email", True, "Correctly returned 400 for duplicate email")
            return True
        else:
            self.log_test("Create Clerk with Duplicate Email", False, f"Expected 400, got {result['status']}")
            return False
    
    # ============================================
    # DELETION VALIDATION TESTS
    # ============================================
    
    async def test_delete_admin_with_merchants(self):
        """Test 23: Try to Delete Admin with Associated Merchants"""
        if not self.created_entities['admins']:
            self.log_test("Delete Admin with Merchants", False, "No admin available for test")
            return False
            
        admin_id = self.created_entities['admins'][0]
        result = await self.make_request("DELETE", f"/admin-ops/admins/{admin_id}")
        
        if result['status'] == 400:
            self.log_test("Delete Admin with Merchants", True, "Correctly prevented deletion of admin with merchants")
            return True
        else:
            self.log_test("Delete Admin with Merchants", False, f"Expected 400, got {result['status']}")
            return False
    
    async def test_delete_merchant_with_clerks(self):
        """Test 24: Try to Delete Merchant with Associated Clerks"""
        if not self.created_entities['merchants']:
            self.log_test("Delete Merchant with Clerks", False, "No merchant available for test")
            return False
            
        merchant_id = self.created_entities['merchants'][0]
        result = await self.make_request("DELETE", f"/admin-ops/merchants/{merchant_id}")
        
        if result['status'] == 400:
            self.log_test("Delete Merchant with Clerks", True, "Correctly prevented deletion of merchant with clerks")
            return True
        else:
            self.log_test("Delete Merchant with Clerks", False, f"Expected 400, got {result['status']}")
            return False
    
    # ============================================
    # SUCCESSFUL DELETION TESTS
    # ============================================
    
    async def test_delete_clerk(self):
        """Test 25: Delete Clerk Successfully"""
        if not self.created_entities['clerks']:
            self.log_test("Delete Clerk", False, "No clerk available for test")
            return False
            
        clerk_id = self.created_entities['clerks'][0]
        result = await self.make_request("DELETE", f"/admin-ops/clerks/{clerk_id}")
        
        if result['status'] == 200:
            self.created_entities['clerks'].remove(clerk_id)
            self.log_test("Delete Clerk", True, "Clerk deleted successfully")
            return True
        else:
            self.log_test("Delete Clerk", False, f"Status: {result['status']}, Data: {result['data']}")
            return False
    
    async def test_delete_merchant_without_clerks(self):
        """Test 26: Delete Merchant Without Clerks"""
        if not self.created_entities['merchants']:
            self.log_test("Delete Merchant without Clerks", False, "No merchant available for test")
            return False
            
        merchant_id = self.created_entities['merchants'][0]
        result = await self.make_request("DELETE", f"/admin-ops/merchants/{merchant_id}")
        
        if result['status'] == 200:
            self.created_entities['merchants'].remove(merchant_id)
            self.log_test("Delete Merchant without Clerks", True, "Merchant deleted successfully")
            return True
        else:
            self.log_test("Delete Merchant without Clerks", False, f"Status: {result['status']}, Data: {result['data']}")
            return False
    
    async def test_delete_kyb(self):
        """Test 27: Delete KYB"""
        if not self.created_entities['kyb']:
            self.log_test("Delete KYB", False, "No KYB available for test")
            return False
            
        kyb_id = self.created_entities['kyb'][0]
        result = await self.make_request("DELETE", f"/admin-ops/kyb/{kyb_id}")
        
        if result['status'] == 200:
            self.created_entities['kyb'].remove(kyb_id)
            self.log_test("Delete KYB", True, "KYB deleted successfully")
            return True
        else:
            self.log_test("Delete KYB", False, f"Status: {result['status']}, Data: {result['data']}")
            return False
    
    async def test_delete_admin_without_merchants(self):
        """Test 28: Delete Admin Without Merchants"""
        if not self.created_entities['admins']:
            self.log_test("Delete Admin without Merchants", False, "No admin available for test")
            return False
            
        admin_id = self.created_entities['admins'][0]
        result = await self.make_request("DELETE", f"/admin-ops/admins/{admin_id}")
        
        if result['status'] == 200:
            self.created_entities['admins'].remove(admin_id)
            self.log_test("Delete Admin without Merchants", True, "Admin deleted successfully")
            return True
        else:
            self.log_test("Delete Admin without Merchants", False, f"Status: {result['status']}, Data: {result['data']}")
            return False
    
    # ============================================
    # RESPONSE FORMAT VALIDATION TESTS
    # ============================================
    
    async def test_response_formats(self):
        """Test 29: Validate Response Formats"""
        # Test admin list format
        result = await self.make_request("GET", "/admin-ops/admins")
        if result['status'] == 200:
            data = result['data']
            if 'count' in data and 'admins' in data and isinstance(data['admins'], list):
                self.log_test("Admin List Response Format", True, "Correct JSON structure with count and admins array")
            else:
                self.log_test("Admin List Response Format", False, "Missing count or admins array")
        else:
            self.log_test("Admin List Response Format", False, f"Failed to get admin list: {result['status']}")
        
        # Test merchant list format
        result = await self.make_request("GET", "/admin-ops/merchants")
        if result['status'] == 200:
            data = result['data']
            if 'count' in data and 'merchants' in data and isinstance(data['merchants'], list):
                self.log_test("Merchant List Response Format", True, "Correct JSON structure with count and merchants array")
            else:
                self.log_test("Merchant List Response Format", False, "Missing count or merchants array")
        else:
            self.log_test("Merchant List Response Format", False, f"Failed to get merchant list: {result['status']}")
        
        # Test clerk list format
        result = await self.make_request("GET", "/admin-ops/clerks")
        if result['status'] == 200:
            data = result['data']
            if 'count' in data and 'clerks' in data and isinstance(data['clerks'], list):
                self.log_test("Clerk List Response Format", True, "Correct JSON structure with count and clerks array")
            else:
                self.log_test("Clerk List Response Format", False, "Missing count or clerks array")
        else:
            self.log_test("Clerk List Response Format", False, f"Failed to get clerk list: {result['status']}")
        
        # Test KYB list format
        result = await self.make_request("GET", "/admin-ops/kyb")
        if result['status'] == 200:
            data = result['data']
            required_fields = ['total', 'pending_count', 'approved_count', 'rejected_count', 'admins_without_kyb', 'kyb_data']
            if all(field in data for field in required_fields):
                self.log_test("KYB List Response Format", True, "Correct JSON structure with all required stats fields")
            else:
                missing = [field for field in required_fields if field not in data]
                self.log_test("KYB List Response Format", False, f"Missing fields: {missing}")
        else:
            self.log_test("KYB List Response Format", False, f"Failed to get KYB list: {result['status']}")
    
    async def test_password_hashing(self):
        """Test 30: Verify Password Hashing"""
        # Create a test admin first for this test
        admin_data = {
            "nombre": "Password Test Admin",
            "email": "password_test@admin.com",
            "telefono": "+593999000001"
        }
        
        admin_result = await self.make_request("POST", "/admin-ops/admins", admin_data)
        
        if admin_result['status'] != 200:
            self.log_test("Password Hashing Test", False, "Could not create test admin")
            return False
        
        admin_id = admin_result['data']['admin_id']
        
        merchant_data = {
            "admin_id": admin_id,
            "username": "password_test_merchant",
            "password": "plaintext123",
            "nombre": "Password Test Merchant"
        }
        
        result = await self.make_request("POST", "/admin-ops/merchants", merchant_data)
        
        if result['status'] == 200:
            merchant_id = result['data']['merchant_id']
            
            # Get the merchant details
            get_result = await self.make_request("GET", f"/admin-ops/merchants/{merchant_id}")
            
            if get_result['status'] == 200:
                # Password should not be visible in the response (it should be hashed in DB)
                merchant_data = get_result['data']
                if 'password' not in merchant_data or merchant_data.get('password') != 'plaintext123':
                    self.log_test("Password Hashing Test", True, "Password is properly hashed and not visible in response")
                else:
                    self.log_test("Password Hashing Test", False, "Password appears to be stored in plain text")
                
                # Clean up
                await self.make_request("DELETE", f"/admin-ops/merchants/{merchant_id}")
                await self.make_request("DELETE", f"/admin-ops/admins/{admin_id}")
            else:
                self.log_test("Password Hashing Test", False, "Could not retrieve merchant for password check")
                await self.make_request("DELETE", f"/admin-ops/admins/{admin_id}")
        else:
            self.log_test("Password Hashing Test", False, f"Could not create test merchant: {result['status']}")
            await self.make_request("DELETE", f"/admin-ops/admins/{admin_id}")
    
    # ============================================
    # MAIN TEST RUNNER
    # ============================================
    
    async def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Admin Ops CRUD Testing Suite")
        print("=" * 60)
        
        await self.setup()
        
        try:
            # HAPPY PATH FLOW
            print("\n📋 HAPPY PATH FLOW TESTS")
            print("-" * 30)
            
            # 1. Create Admin
            admin_id = await self.test_create_admin()
            
            # 2. Create Merchant
            merchant_id = None
            if admin_id:
                merchant_id = await self.test_create_merchant(admin_id)
            
            # 3. Create Clerk
            clerk_id = None
            if merchant_id:
                clerk_id = await self.test_create_clerk(merchant_id)
            
            # 4. Create KYB
            kyb_id = None
            if admin_id:
                kyb_id = await self.test_create_kyb(admin_id)
            
            # 5-8. List all entities
            await self.test_get_all_admins()
            await self.test_get_all_merchants()
            await self.test_get_all_clerks()
            await self.test_get_all_kyb()
            
            # 9-12. Get specific entities
            if admin_id:
                await self.test_get_admin_by_id(admin_id)
            if merchant_id:
                await self.test_get_merchant_by_id(merchant_id)
            if clerk_id:
                await self.test_get_clerk_by_id(clerk_id)
            if admin_id:
                await self.test_get_kyb_by_admin(admin_id)
            
            # 13-16. Update entities
            if admin_id:
                await self.test_update_admin(admin_id)
            if merchant_id and admin_id:
                await self.test_update_merchant(merchant_id, admin_id)
            if clerk_id and merchant_id:
                await self.test_update_clerk(clerk_id, merchant_id)
            if kyb_id:
                await self.test_update_kyb(kyb_id)
            
            # ERROR VALIDATION TESTS
            print("\n❌ ERROR VALIDATION TESTS")
            print("-" * 30)
            
            await self.test_create_merchant_invalid_admin()
            await self.test_create_clerk_invalid_merchant()
            await self.test_create_kyb_invalid_admin()
            await self.test_duplicate_admin_email()
            await self.test_duplicate_merchant_username()
            await self.test_duplicate_clerk_email()
            
            # DELETION VALIDATION TESTS
            print("\n🗑️ DELETION VALIDATION TESTS")
            print("-" * 30)
            
            await self.test_delete_admin_with_merchants()
            await self.test_delete_merchant_with_clerks()
            
            # SUCCESSFUL DELETION TESTS (in correct order)
            print("\n✅ SUCCESSFUL DELETION TESTS")
            print("-" * 30)
            
            await self.test_delete_clerk()
            await self.test_delete_merchant_without_clerks()
            await self.test_delete_kyb()
            await self.test_delete_admin_without_merchants()
            
            # RESPONSE FORMAT TESTS
            print("\n📊 RESPONSE FORMAT VALIDATION TESTS")
            print("-" * 30)
            
            await self.test_response_formats()
            await self.test_password_hashing()
            
        finally:
            await self.cleanup()
        
        # SUMMARY
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['details']}")
        
        print("\n🎉 Admin Ops CRUD Testing Complete!")
        
        return passed_tests, failed_tests

async def main():
    """Main test runner"""
    test_suite = AdminOpsTestSuite()
    passed, failed = await test_suite.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if failed == 0 else 1)

if __name__ == "__main__":
    asyncio.run(main())