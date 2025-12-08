#!/usr/bin/env python3
"""
Additional Edge Case Tests for Stock Alerts API
"""

import requests
import json
from datetime import datetime

BASE_URL = "https://user-flow.preview.emergentagent.com/api"

def log(message, level="INFO"):
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {level}: {message}")

def test_edge_cases():
    """Test edge cases for the alerts API"""
    log("🔍 Testing Edge Cases for Alerts API")
    log("=" * 40)
    
    # Register user
    user_data = {
        "email": f"edgetest_{datetime.now().strftime('%Y%m%d_%H%M%S')}@test.com",
        "password": "TestPassword123!",
        "store_name": "Edge Test Store"
    }
    
    response = requests.post(f"{BASE_URL}/auth/register", json=user_data)
    if response.status_code != 200:
        log("❌ Failed to register user", "ERROR")
        return False
    
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test 1: Empty store (no products)
    log("Test 1: Empty store - should return empty alerts")
    response = requests.get(f"{BASE_URL}/alerts/low-stock", headers=headers)
    if response.status_code == 200 and len(response.json()) == 0:
        log("✅ Empty store returns empty alerts correctly")
    else:
        log("❌ Empty store test failed", "ERROR")
        return False
    
    # Test 2: Product with decimal quantities
    log("Test 2: Decimal quantities")
    product_data = {
        "name": "Producto Decimal",
        "quantity": 2.5,
        "price": 10.0,
        "cost": 5.0
    }
    
    response = requests.post(f"{BASE_URL}/products", json=product_data, headers=headers)
    if response.status_code != 200:
        log("❌ Failed to create decimal product", "ERROR")
        return False
    
    product = response.json()
    
    # Set alert threshold higher than current quantity
    alert_response = requests.put(
        f"{BASE_URL}/products/{product['_id']}/alert-settings",
        params={"min_stock_alert": 3.0, "alert_enabled": True},
        headers=headers
    )
    
    if alert_response.status_code == 200:
        # Check alerts
        alerts_response = requests.get(f"{BASE_URL}/alerts/low-stock", headers=headers)
        alerts = alerts_response.json()
        
        if len(alerts) == 1 and alerts[0]['alert_level'] == 'warning':
            log("✅ Decimal quantities handled correctly")
        else:
            log("❌ Decimal quantities test failed", "ERROR")
            return False
    
    # Test 3: Very high threshold
    log("Test 3: Very high alert threshold")
    high_threshold_response = requests.put(
        f"{BASE_URL}/products/{product['_id']}/alert-settings",
        params={"min_stock_alert": 1000.0, "alert_enabled": True},
        headers=headers
    )
    
    if high_threshold_response.status_code == 200:
        alerts_response = requests.get(f"{BASE_URL}/alerts/low-stock", headers=headers)
        alerts = alerts_response.json()
        
        if len(alerts) == 1 and alerts[0]['alert_level'] == 'warning':
            log("✅ High threshold handled correctly")
        else:
            log("❌ High threshold test failed", "ERROR")
            return False
    
    # Test 4: Zero threshold
    log("Test 4: Zero alert threshold")
    zero_threshold_response = requests.put(
        f"{BASE_URL}/products/{product['_id']}/alert-settings",
        params={"min_stock_alert": 0.0, "alert_enabled": True},
        headers=headers
    )
    
    if zero_threshold_response.status_code == 200:
        alerts_response = requests.get(f"{BASE_URL}/alerts/low-stock", headers=headers)
        alerts = alerts_response.json()
        
        # Should not be in alerts since quantity (2.5) > threshold (0.0)
        if len(alerts) == 0:
            log("✅ Zero threshold handled correctly")
        else:
            log("❌ Zero threshold test failed", "ERROR")
            return False
    
    # Cleanup
    requests.delete(f"{BASE_URL}/products/{product['_id']}", headers=headers)
    
    log("=" * 40)
    log("🎉 All edge case tests passed!")
    return True

if __name__ == "__main__":
    success = test_edge_cases()
    exit(0 if success else 1)