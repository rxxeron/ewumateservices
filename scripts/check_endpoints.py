import requests
import json

url = 'https://ewumate-parser.azurewebsites.net/api/'
actions = ['generate_schedules', 'parse_calendar', 'parse_faculty', 'generate_pdf']
headers = {'Content-Type': 'application/json'}

print(f"Checking endpoints at {url}...")
for a in actions:
    try:
        # We use a POST request with an empty body to see how the server responds
        res = requests.post(url + a, json={}, timeout=10)
        print(f"Action {a:20} : Status {res.status_code}")
        if res.status_code == 200:
             print(f"  - SUCCESS (Response: {res.text[:50]}...)")
        elif res.status_code == 404:
             print(f"  - NOT DEPLOYED or WRONG PATH")
        elif res.status_code == 401 or res.status_code == 403:
             print(f"  - AUTH REQUIRED (But exists)")
    except Exception as e:
        print(f"Action {a:20} : Error {e}")
