import requests
import json

BASE_URL = "https://financial-dashboard-2rsd.onrender.com/api"
USERNAME = "francois.labrousse75@sfr.fr"
PASSWORD = "Vb44sjrkm!"

def promote_user():
    print(f"Logging in as {USERNAME}...")
    try:
        # 1. Login
        login_resp = requests.post(f"{BASE_URL}/auth/login", json={
            "username": USERNAME,
            "password": PASSWORD
        })
        
        if login_resp.status_code != 200:
            print(f"Login failed: {login_resp.status_code}")
            print(login_resp.text)
            return

        token = login_resp.json().get('access_token')
        print("Login successful. Token obtained.")
        
        # 2. Promote Self
        print("Attempting to promote self to Admin...")
        headers = {"Authorization": f"Bearer {token}"}
        promote_resp = requests.post(f"{BASE_URL}/admin/promote-me", headers=headers)
        
        print(f"Status Code: {promote_resp.status_code}")
        print(f"Response: {promote_resp.text}")
        
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    promote_user()
