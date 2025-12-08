import requests
import os
import random
import string
import time

BASE_URL = "https://financial-dashboard-2rsd.onrender.com/api"
FILES_DIR = r"c:\Users\zaxod\OneDrive\Documents\APPS\financial-dashboard\backend\uploads"

# Files to upload
FILES = [
    os.path.join(FILES_DIR, "Boulangerie.csv"),
    os.path.join(FILES_DIR, "electricien.xlsx"),
    os.path.join(FILES_DIR, "PME_Cabanes_Detaille.xlsx")
]

def generate_random_email():
    return ''.join(random.choices(string.ascii_lowercase, k=10)) + "@test.com"

def run_test():
    # email = generate_random_email()
    email = "hzmplpdnku@test.com" # Use the user we just paid for
    password = "TestPassword123!"
    username = email.split('@')[0]
    
    print(f"=== STARTING E2E TEST ===")
    print(f"User: {email}")
    
    # 1. Register
    print("\n1. Registering... (Skipping for existing user)")
    # resp = requests.post(f"{BASE_URL}/auth/register", json={
    #     "username": username,
    #     "email": email,
    #     "password": password
    # })
    # if resp.status_code != 201:
    #     print(f"Registration failed: {resp.text}")
    #     return
    # print("Registration successful.")
    
    # 2. Login
    print("\n2. Logging in...")
    resp = requests.post(f"{BASE_URL}/auth/login", json={
        "username": email,
        "password": password
    })
    token = resp.json().get('access_token')
    headers = {"Authorization": f"Bearer {token}"}
    print("Login successful.")
    
    # 3. Upload Files
    for i, file_path in enumerate(FILES):
        print(f"\n3.{i+1} Uploading {os.path.basename(file_path)}...")
        
        if not os.path.exists(file_path):
            print(f"File not found: {file_path}")
            continue
            
        with open(file_path, 'rb') as f:
            files = {'file': f}
            resp = requests.post(f"{BASE_URL}/upload", headers=headers, files=files)
            
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            print("Upload successful.")
        elif resp.status_code == 403:
            print("LIMIT REACHED (Expected for 3rd file).")
            print(resp.json())
        else:
            print(f"Error: {resp.text}")

    # 4. Create Checkout Session
    print("\n4. Creating Checkout Session...")
    resp = requests.post(f"{BASE_URL}/payment/create-checkout-session", headers=headers)
    if resp.status_code == 200:
        url = resp.json().get('url')
        print(f"Checkout URL: {url}")
        print("\n>>> PAYMENT SIMULATED IN BROWSER <<<")
        
        # 5. Verify Subscription Status (Poll for Webhook)
        print("\n5. Verifying Subscription Status (Waiting for Webhook)...")
        max_retries = 10
        for i in range(max_retries):
            time.sleep(5) # Wait 5s between checks
            resp = requests.get(f"{BASE_URL}/auth/me", headers=headers)
            user_data = resp.json()
            status = user_data.get('subscription_status')
            print(f"Attempt {i+1}/{max_retries}: Status = {status}")
            
            if status == 'active':
                print("Subscription is ACTIVE!")
                break
        else:
            print("Timeout: Subscription status did not update to 'active'. Webhook might be missing or delayed.")
            return

        # 6. Retry 3rd Upload
        print("\n6. Retrying 3rd Upload (PME_Cabanes_Detaille.xlsx)...")
        file_path = FILES[2]
        with open(file_path, 'rb') as f:
            files = {'file': f}
            resp = requests.post(f"{BASE_URL}/upload", headers=headers, files=files)
            
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            print("SUCCESS: 3rd file uploaded after payment!")
        else:
            print(f"FAILURE: Could not upload 3rd file. {resp.text}")

    else:
        print(f"Failed to create session: {resp.text}")

if __name__ == "__main__":
    run_test()
