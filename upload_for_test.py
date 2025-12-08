import requests
import os

BASE_URL = 'http://localhost:5000/api'
AUTH_URL = f'{BASE_URL}/auth'
UPLOAD_URL = f'{BASE_URL}/upload'

USERNAME = "final_test_user_v2"
EMAIL = "final_test_v2@example.com"
PASSWORD = "password123"

def upload_via_api():
    # 1. Login (or Register if needed - but we assume Browser will register)
    # Actually, let's just login. If login fails, we register.
    print(f"Logging in as {USERNAME}...")
    resp = requests.post(f'{AUTH_URL}/login', json={
        "username": USERNAME,
        "password": PASSWORD
    })
    
    token = None
    if resp.status_code == 200:
        token = resp.json()['access_token']
    else:
        print(f"Login failed: {resp.status_code} - {resp.text}")
        print("Attempting registration...")
        resp = requests.post(f'{AUTH_URL}/register', json={
            "username": USERNAME,
            "email": EMAIL,
            "password": PASSWORD
        })
        if resp.status_code == 201:
            print("Registration successful. Logging in...")
            resp = requests.post(f'{AUTH_URL}/login', json={
                "username": USERNAME,
                "password": PASSWORD
            })
            token = resp.json()['access_token']
        else:
            print(f"Registration failed: {resp.text}")
            return

    # 2. Upload File
    filepath = r"c:\Users\zaxod\OneDrive\Documents\APPS\financial-dashboard\Boulangerie.csv"
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return

    print(f"Uploading {filepath}...")
    with open(filepath, 'rb') as f:
        files = {'file': f}
        headers = {'Authorization': f'Bearer {token}'}
        resp = requests.post(UPLOAD_URL, files=files, headers=headers)
        
    if resp.status_code == 200:
        print("Upload Successful!")
        print(resp.json())
    else:
        print(f"Upload Failed: {resp.status_code} - {resp.text}")

if __name__ == "__main__":
    upload_via_api()
