import requests
import os

BASE_URL = 'http://localhost:5000/api'
AUTH_URL = f'{BASE_URL}/auth'
UPLOAD_URL = f'{BASE_URL}/upload'

# Test User
USERNAME = "freemium_api_test"
EMAIL = "freemium_api@test.com"
PASSWORD = "password123"

def register_and_login():
    # Register
    requests.post(f'{AUTH_URL}/register', json={
        "username": USERNAME,
        "email": EMAIL,
        "password": PASSWORD
    })
    
    # Login
    resp = requests.post(f'{AUTH_URL}/login', json={
        "username": USERNAME,
        "password": PASSWORD
    })
    
    if resp.status_code == 200:
        return resp.json()['access_token']
    else:
        print(f"Login failed: {resp.text}")
        return None

def upload_file(token, filepath):
    print(f"DEBUG: Inside upload_file for {filepath}", flush=True)
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}", flush=True)
        return None
        
    print("DEBUG: Opening file...", flush=True)
    with open(filepath, 'rb') as f:
        files = {'file': f}
        headers = {'Authorization': f'Bearer {token}'}
        print("DEBUG: Sending POST request...", flush=True)
        try:
            resp = requests.post(UPLOAD_URL, files=files, headers=headers)
            print(f"DEBUG: Request sent. Status: {resp.status_code}", flush=True)
            return resp
        except Exception as e:
            print(f"DEBUG: Exception in POST: {e}", flush=True)
            raise e

def run_test():
    print("--- Starting Freemium Logic Verification ---")
    print(f"CWD: {os.getcwd()}")
    print(f"Files in CWD: {os.listdir('.')}")
    
    token = register_and_login()
    if not token:
        return

    files = [
        "Boulangerie.csv",
        "Electricien.csv",
        "backend/uploads/PME_Cabanes_Detaille.xlsx"
    ]

    for i, filepath in enumerate(files):
        exists = os.path.exists(filepath)
        print(f"\nAttempting Upload {i+1}: {filepath} (Exists: {exists})", flush=True)
        try:
            resp = upload_file(token, filepath)
            if resp:
                print(f"Status Code: {resp.status_code}", flush=True)
                if resp.status_code == 200:
                    print("Result: SUCCESS", flush=True)
                elif resp.status_code == 403:
                    print("Result: BLOCKED (Expected for 3rd upload)", flush=True)
                    print(f"Response: {resp.json()}", flush=True)
                else:
                    print(f"Result: UNEXPECTED ERROR - {resp.text}", flush=True)
            else:
                print("No response object returned.", flush=True)
        except Exception as e:
            print(f"Exception during upload: {e}", flush=True)

if __name__ == "__main__":
    run_test()
