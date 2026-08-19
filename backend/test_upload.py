import requests

url = "http://localhost:8000/rfp/upload"
files = {'file': ('dummy.pdf', b'dummy content', 'application/pdf')}
data = {'org_id': 'test-org'}

response = requests.post(url, files=files, data=data)
print(response.status_code)
print(response.text)
