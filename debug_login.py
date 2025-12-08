import requests
import json

BASE_URL = 'http://localhost:5000/api/auth'

def test_login_email():
    print("Attempting to login with EMAIL...")
    payload = {
        "username": "francois.labrousse75@sfr.fr", # Sending email in username field
        "password": "password123" # Assuming this is the password, or I can't really test success if I don't know it.
        # Wait, I don't know the admin's password. The user created it.
        # But I can test if I get 401 (Invalid credentials) vs 500 or 404.
        # If I get 401, it means the server IS running and processed the request.
        # If I get "User not found" (if I hadn't fixed it), well the code returns 401 for both.
    }
    
    # Actually, I can't verify SUCCESS without the password.
    # But I can verify the server is responding.
    
    try:
        response = requests.post(f"{BASE_URL}/login", json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_login_email()
