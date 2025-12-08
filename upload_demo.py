import requests

url = 'http://localhost:5000/upload'
files = {'file': open('demo_data.csv', 'rb')}

try:
    response = requests.post(url, files=files)
    print(response.text)
except Exception as e:
    print(f"Error: {e}")
