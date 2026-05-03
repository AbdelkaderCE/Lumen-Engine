import urllib.request
import json
import sys

url = "http://localhost:8080/api/search"
payload = {
    "query": "information AND retrieval",
    "model": "boolean",
    "p": 2.0,
    "top_k": 5
}
data = json.dumps(payload).encode("utf-8")
req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})

print(f"Testing Boolean search at {url}...")
try:
    with urllib.request.urlopen(req) as response:
        body = response.read().decode("utf-8")
        data = json.loads(body)
        print("\n--- RESPONSE DEBUG OBJECT ---")
        print(json.dumps(data.get("debug", {}), indent=2))
        print("\n--- TOP RESULT SCORE ---")
        if data.get("results"):
            print(f"Top Result: {data['results'][0]['filename']}, Score: {data['results'][0]['score']}")
        else:
            print("No results found.")
except Exception as e:
    print(f"Error: {e}")
