#!/usr/bin/env python
"""
Quick test script for JWT Authentication

Usage:
    python test_auth.py

This script tests the authentication flow:
1. Register a new user
2. Login and get tokens
3. Get current user info
4. Test role-based access
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000/api"

def print_section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")

def test_register():
    print_section("TEST 1: Register Admin User")
    
    payload = {
        "username": "admin_user",
        "password": "AdminPass123!",
        "email": "admin@example.com",
        "role": "ADMIN"
    }
    
    response = requests.post(f"{BASE_URL}/auth/register/", json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    return response.json() if response.status_code == 201 else None


def test_register_employee():
    print_section("TEST 2: Register Employee User")
    
    payload = {
        "username": "emp_user",
        "password": "EmpPass123!",
        "email": "employee@example.com",
        "role": "EMPLOYEE",
        "employee_id": 1  # Assuming employee with ID 1 exists
    }
    
    response = requests.post(f"{BASE_URL}/auth/register/", json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    return response.json() if response.status_code == 201 else None


def test_login(username, password):
    print_section(f"TEST 3: Login as {username}")
    
    payload = {
        "username": username,
        "password": password
    }
    
    response = requests.post(f"{BASE_URL}/auth/login/", json=payload)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Access Token: {data['access'][:50]}...")
        print(f"Refresh Token: {data['refresh'][:50]}...")
        
        # Decode token to show payload
        import base64
        try:
            # JWT format: header.payload.signature
            payload_part = data['access'].split('.')[1]
            # Add padding if needed
            padding = 4 - len(payload_part) % 4
            if padding != 4:
                payload_part += '=' * padding
            
            decoded = base64.urlsafe_b64decode(payload_part)
            print(f"Token Payload: {json.dumps(json.loads(decoded), indent=2)}")
        except Exception as e:
            print(f"Could not decode token: {e}")
        
        return data['access']
    else:
        print(f"Error: {response.json()}")
        return None


def test_get_current_user(token):
    print_section("TEST 4: Get Current User Info")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    response = requests.get(f"{BASE_URL}/auth/me/", headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    return response.json()


def test_list_employees(token, should_succeed=True):
    print_section("TEST 5: List Employees (Admin Only)")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    response = requests.get(f"{BASE_URL}/learner/employees/", headers=headers)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Found {len(data)} employees")
        if data:
            print(f"First employee: {json.dumps(data[0], indent=2)}")
    else:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if should_succeed and response.status_code != 200:
        print("⚠️  Admin should be able to list employees!")
    elif not should_succeed and response.status_code == 200:
        print("⚠️  Non-admin should NOT be able to list employees!")


def test_refresh_token(refresh_token):
    print_section("TEST 6: Refresh Access Token")
    
    payload = {
        "refresh": refresh_token
    }
    
    response = requests.post(f"{BASE_URL}/auth/refresh/", json=payload)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"New Access Token: {data['access'][:50]}...")
        return data['access']
    else:
        print(f"Error: {response.json()}")
        return None


def main():
    print("\n" + "="*60)
    print("  JWT AUTHENTICATION TEST SUITE")
    print("  " + datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    print("="*60)
    
    # Test 1: Register admin
    admin_data = test_register()
    
    # Test 2: Register employee
    emp_data = test_register_employee()
    
    # Test 3: Login as admin
    admin_token = test_login("admin_user", "AdminPass123!")
    
    if not admin_token:
        print("\n❌ Failed to login admin user. Stopping tests.")
        return
    
    # Test 4: Get current user
    user_info = test_get_current_user(admin_token)
    
    # Test 5: List employees (admin should succeed)
    test_list_employees(admin_token, should_succeed=True)
    
    # Test 6: Refresh token
    if admin_data:
        # Need to login to get refresh token
        login_response = requests.post(
            f"{BASE_URL}/auth/login/",
            json={"username": "admin_user", "password": "AdminPass123!"}
        )
        if login_response.status_code == 200:
            refresh_token = login_response.json()['refresh']
            new_token = test_refresh_token(refresh_token)
    
    # Test 7: Login as employee and verify access control
    emp_token = test_login("emp_user", "EmpPass123!")
    
    if emp_token:
        test_get_current_user(emp_token)
        # Employee should NOT be able to list employees
        test_list_employees(emp_token, should_succeed=False)
    
    print("\n" + "="*60)
    print("  TESTS COMPLETED")
    print("="*60 + "\n")


if __name__ == "__main__":
    try:
        main()
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Could not connect to server at", BASE_URL)
        print("   Make sure Django dev server is running:")
        print("   python manage.py runserver")
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
