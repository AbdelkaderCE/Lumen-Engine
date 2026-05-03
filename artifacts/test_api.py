import urllib.request
import json

url = "http://localhost:8080/api/search"
payload = {
    "query": "information",
    "model": "vectorial",
    "similarity": "cosine",
    "top_k": 1
}
data = json.dumps(payload).encode("utf-8")
req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})

try:
    with urllib.request.urlopen(req) as response:
        body = response.read().decode("utf-8")
        data = json.loads(body)
        print("Keys in response:", data.keys())
        if "debug" in data:
            print("Debug info present!")
        else:
            print("Debug info MISSING!")
        
        if data.get("results") and "debug" in data["results"][0]:
            print("Result debug info present!")
        else:
            print("Result debug info MISSING!")
except Exception as e:
    print(f"Error: {e}")
