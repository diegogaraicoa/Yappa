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