import requests

BASE_URL = "https://financial-dashboard-2rsd.onrender.com/api"
USERNAME = "hzmplpdnku@test.com"
PASSWORD = "TestPassword123!"

def activate_user():
    print(f"Logging in as {USERNAME}...")
    resp = requests.post(f"{BASE_URL}/auth/login", json={
        "username": USERNAME,
        "password": PASSWORD
    })
    if resp.status_code != 200:
        print(f"Login failed: {resp.text}")
        return

    token = resp.json().get('access_token')
    headers = {"Authorization": f"Bearer {token}"}
    
    print("Activating user...")
    resp = requests.post(f"{BASE_URL}/admin/promote-me", headers=headers)
    print(f"Status: {resp.status_code}")
    print(f"Response: {resp.text}")

if __name__ == "__main__":
    activate_user()
