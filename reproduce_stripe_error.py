import requests
import json

BASE_URL = "https://financial-dashboard-2rsd.onrender.com/api"
USERNAME = "zaxodon@gmail.com"
PASSWORD = "Vb44sjrkm!"

def test_stripe_checkout():
    print(f"Logging in as {USERNAME}...")
    try:
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
        
        print("Attempting to create checkout session...")
        headers = {"Authorization": f"Bearer {token}"}
        checkout_resp = requests.post(f"{BASE_URL}/payment/create-checkout-session", headers=headers)
        
        print(f"Status Code: {checkout_resp.status_code}")
        print(f"Response: {checkout_resp.text}")
        
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    test_stripe_checkout()
