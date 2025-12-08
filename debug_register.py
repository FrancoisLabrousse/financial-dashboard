import requests
import json

BASE_URL = 'http://localhost:5000/api/auth'

def test_register():
    print("Attempting to register new user...")
    payload = {
        "username": "test_user_1",
        "email": "test_user_1@example.com",
        "password": "password123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/register", json=payload)
        print(f"Status Code: {response.status_code}")
        try:
            print(f"Response JSON: {json.dumps(response.json(), indent=2)}")
        except:
            print(f"Response Text: {response.text}")
            
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_register()
