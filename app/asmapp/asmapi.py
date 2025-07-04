import time
import uuid
import requests
from authlib.jose import jwt
from Crypto.PublicKey import ECC
import threading

class AppleSchoolManagerAPI:
    def __init__(self, pem_path, client_id, team_id, key_id, scope="school.api", manager_type="school"):
        self.pem_path = pem_path
        self.client_id = client_id
        self.team_id = team_id
        self.key_id = key_id
        self.manager_type = manager_type
        
        # Set scope and API URL based on manager type
        if manager_type == "business":
            self.scope = scope.replace("school.api", "business.api") if "school.api" in scope else "business.api"
            self.api_url = "https://api-business.apple.com/v1"
        else:
            self.scope = scope if "school.api" in scope else "school.api"
            self.api_url = "https://api-school.apple.com/v1"
            
        self.token_url = "https://account.apple.com/auth/oauth2/v2/token"
        self.access_token = None
        self.token_expiry = 0
        self._token_lock = threading.Lock()

    def _generate_jwt(self):
        now = int(time.time())
        exp = now + 86400 * 180
        headers = {
            "alg": "ES256",
            "kid": self.key_id
        }
        payload = {
            "sub": self.client_id,
            "aud": self.token_url,
            "iat": now,
            "exp": exp,
            "jti": str(uuid.uuid4()),
            "iss": self.team_id
        }
        with open(self.pem_path, 'rt') as f:
            private_key = ECC.import_key(f.read())
        return jwt.encode(headers, payload, private_key.export_key(format='PEM')).decode()

    def get_access_token(self):
        # Undvik race conditions vid parallella requests
        with self._token_lock:
            if self.access_token and time.time() < self.token_expiry - 60:
                return self.access_token
            assertion = self._generate_jwt()
            data = {
                "grant_type": "client_credentials",
                "client_id": self.client_id,
                "client_assertion_type": "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
                "client_assertion": assertion,
                "scope": self.scope
            }
            response = requests.post(self.token_url, data=data)
            response.raise_for_status()
            json_data = response.json()
            self.access_token = json_data["access_token"]
            self.token_expiry = int(time.time()) + json_data.get("expires_in", 3600)
            return self.access_token

    def _auth_headers(self):
        return {
            "Authorization": f"Bearer {self.get_access_token()}",
            "Accept": "application/json"
        }

    def get_orgs(self):
        r = requests.get(f"{self.api_url}/orgs", headers=self._auth_headers())
        r.raise_for_status()
        return r.json()

    def get_all_devices(self):
        r = requests.get(f"{self.api_url}/orgDevices", headers=self._auth_headers())
        r.raise_for_status()
        return r.json()

    def get_device_by_id(self, device_id):
        r = requests.get(f"{self.api_url}/orgDevices/{device_id}", headers=self._auth_headers())
        r.raise_for_status()
        return r.json()

    def get_assigned_server(self, device_id):
        r = requests.get(f"{self.api_url}/orgDevices/{device_id}/assignedServer", headers=self._auth_headers())
        r.raise_for_status()
        return r.json()

    def get_mdm_servers(self, limit=100, fields=None):
        params = {
            "limit": str(limit)
        }
        if fields:
            params["fields[mdmServers]"] = ",".join(fields)
        response = requests.get(
            f"{self.api_url}/mdmServers",
            headers=self._auth_headers(),
            params=params
        )
        response.raise_for_status()
        return response.json()

    def get_unassigned_devices(self):
        all_devices = self.get_all_devices()
        # Hantera både "data" som lista och direkt lista
        devices = all_devices.get("data", all_devices)
        unassigned = [d for d in devices if d.get("attributes", {}).get("status") == "UNASSIGNED"]
        return {"data": unassigned}

    def get_assigned_devices(self):
        all_devices = self.get_all_devices()
        devices = all_devices.get("data", all_devices)
        assigned = [d for d in devices if d.get("attributes", {}).get("status") == "ASSIGNED"]
        return {"data": assigned}

    def get_manually_added_devices(self):
        all_devices = self.get_all_devices()
        devices = all_devices.get("data", all_devices)
        manually_added = [d for d in devices if d.get("attributes", {}).get("purchaseSourceType") == "MANUALLY_ADDED"]
        return {"data": manually_added}

    def get_reseller_devices(self):
        all_devices = self.get_all_devices()
        devices = all_devices.get("data", all_devices)
        reseller = [d for d in devices if d.get("attributes", {}).get("purchaseSourceType") == "RESELLER"]
        return {"data": reseller}