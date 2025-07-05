import time
import uuid
import requests
from authlib.jose import jwt
from Crypto.PublicKey import ECC
import threading
import logging

logger = logging.getLogger(__name__)

# Global token cache to share tokens between instances
_global_token_cache = {}
_global_cache_lock = threading.Lock()

class AppleSchoolManagerAPI:
    def __init__(self, pem_path, client_id, team_id, key_id, scope="school.api", manager_type="school"):
        self.pem_path = pem_path
        self.client_id = client_id
        self.team_id = team_id
        self.key_id = key_id
        self.manager_type = manager_type
        
        # Create a unique key for this configuration
        self.cache_key = f"{client_id}:{team_id}:{key_id}:{manager_type}"
        
        # Set scope and API URL based on manager type
        if manager_type == "business":
            self.scope = scope.replace("school.api", "business.api") if "school.api" in scope else "business.api"
            self.api_url = "https://api-business.apple.com/v1"
        else:
            self.scope = scope if "school.api" in scope else "school.api"
            self.api_url = "https://api-school.apple.com/v1"
            
        self.token_url = "https://account.apple.com/auth/oauth2/v2/token"
        self._min_token_interval = 120  # Increased to 2 minutes between token requests

    def _generate_jwt(self):
        now = int(time.time())
        exp = now + 86400 * 180  # 180 days expiry for JWT
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
        """Get access token with global caching and rate limiting"""
        with _global_cache_lock:
            current_time = time.time()
            
            # Check global cache first
            cache_entry = _global_token_cache.get(self.cache_key)
            if cache_entry:
                token, expiry, last_request = cache_entry
                
                # Check if we have a valid token with sufficient buffer time (10 minutes)
                if current_time < expiry - 600:  # 10 minute buffer
                    logger.debug(f"Using cached global token, expires in {expiry - current_time:.0f} seconds")
                    return token
                
                # Rate limiting: don't request tokens too frequently
                time_since_last_request = current_time - last_request
                if time_since_last_request < self._min_token_interval:
                    if token and current_time < expiry:
                        # Use existing token even if close to expiry
                        logger.warning(f"Rate limiting token requests, using existing token")
                        return token
                    else:
                        # Wait if we absolutely need a new token
                        wait_time = self._min_token_interval - time_since_last_request
                        logger.warning(f"Rate limiting: waiting {wait_time:.1f} seconds before token request")
                        time.sleep(wait_time)
            
            try:
                logger.info(f"Requesting new access token from Apple for {self.cache_key}")
                
                assertion = self._generate_jwt()
                data = {
                    "grant_type": "client_credentials",
                    "client_id": self.client_id,
                    "client_assertion_type": "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
                    "client_assertion": assertion,
                    "scope": self.scope
                }
                
                response = requests.post(self.token_url, data=data, timeout=30)
                
                if response.status_code == 429:
                    logger.error("Rate limited by Apple. Waiting 120 seconds before retry.")
                    time.sleep(120)  # Wait longer for rate limits
                    response = requests.post(self.token_url, data=data, timeout=30)
                
                response.raise_for_status()
                json_data = response.json()
                
                access_token = json_data["access_token"]
                expires_in = json_data.get("expires_in", 3600)  # Default 1 hour
                token_expiry = int(time.time()) + expires_in
                
                # Store in global cache
                _global_token_cache[self.cache_key] = (access_token, token_expiry, time.time())
                
                logger.info(f"New token acquired and cached, expires in {expires_in} seconds")
                return access_token
                
            except requests.exceptions.RequestException as e:
                logger.error(f"Failed to get access token: {e}")
                # Try to use any existing token from cache as last resort
                cache_entry = _global_token_cache.get(self.cache_key)
                if cache_entry and cache_entry[0]:
                    logger.warning("Using existing cached token despite refresh failure")
                    return cache_entry[0]
                raise

    @property
    def token_expiry(self):
        """Get token expiry from global cache"""
        cache_entry = _global_token_cache.get(self.cache_key)
        return cache_entry[1] if cache_entry else 0

    def _auth_headers(self):
        return {
            "Authorization": f"Bearer {self.get_access_token()}",
            "Accept": "application/json"
        }

    def _make_api_request(self, endpoint, method='GET', **kwargs):
        """Make API request with retry logic for token refresh"""
        max_retries = 2
        
        for attempt in range(max_retries):
            try:
                headers = self._auth_headers()
                url = f"{self.api_url}{endpoint}"
                
                # Merge headers if provided in kwargs
                if 'headers' in kwargs:
                    headers.update(kwargs.pop('headers'))
                
                if method == 'GET':
                    response = requests.get(url, headers=headers, timeout=30, **kwargs)
                elif method == 'POST':
                    response = requests.post(url, headers=headers, timeout=30, **kwargs)
                else:
                    raise ValueError(f"Unsupported method: {method}")
                
                if response.status_code == 401 and attempt < max_retries - 1:
                    logger.warning("Got 401, clearing cached token and retrying")
                    # Clear cached token for this configuration
                    with _global_cache_lock:
                        if self.cache_key in _global_token_cache:
                            del _global_token_cache[self.cache_key]
                    continue
                
                if response.status_code == 429:
                    logger.warning(f"Rate limited (429), waiting before retry (attempt {attempt + 1})")
                    time.sleep(120)  # Wait longer for rate limits
                    continue
                    
                response.raise_for_status()
                return response.json()
                
            except requests.exceptions.Timeout as e:
                logger.error(f"Request timeout on attempt {attempt + 1}: {e}")
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)
                    continue
                raise
            except requests.exceptions.ConnectionError as e:
                logger.error(f"Connection error on attempt {attempt + 1}: {e}")
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)
                    continue
                raise
            except requests.exceptions.RequestException as e:
                if attempt < max_retries - 1:
                    logger.warning(f"API request failed (attempt {attempt + 1}), retrying: {e}")
                    time.sleep(2 ** attempt)
                    continue
                logger.error(f"API request failed after {max_retries} attempts: {e}")
                raise

    # def get_orgs(self):
    #     # This endpoint doesn't exist in Apple School Manager API
    #     return self._make_api_request("/orgs")

    def get_all_devices(self):
        return self._make_api_request("/orgDevices")

    def get_device_by_id(self, device_id):
        return self._make_api_request(f"/orgDevices/{device_id}")

    def get_assigned_server(self, device_id):
        """Get the MDM server assigned to a specific device"""
        try:
            return self._make_api_request(f"/orgDevices/{device_id}/assignedServer")
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 404:
                # Device is not assigned to any server
                logger.debug(f"Device {device_id} is not assigned to any MDM server")
                return {"data": None}
            else:
                # Re-raise other HTTP errors
                raise

    def get_mdm_servers(self, limit=100, fields=None):
        params = {"limit": str(limit)}
        if fields:
            params["fields[mdmServers]"] = ",".join(fields)
        return self._make_api_request("/mdmServers", params=params)

    def test_connection(self):
        """Test if the API connection works by fetching MDM servers"""
        try:
            result = self.get_mdm_servers(limit=1)
            return {"status": "success", "message": "Connection successful"}
        except Exception as e:
            return {"status": "error", "message": str(e)}

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

    def create_org_device_activity(self, payload):
        """Create an orgDeviceActivity (e.g., ASSIGN_DEVICES)"""
        return self._make_api_request(
            "/orgDeviceActivities", 
            method='POST',
            json=payload,
            headers={"Content-Type": "application/json"}
        )

    def get_org_device_activity(self, activity_id):
        """Get a specific orgDeviceActivity by ID"""
        return self._make_api_request(f"/orgDeviceActivities/{activity_id}")

    # function to assign devices to a server
    def unassign_devices(self, mdm_server_id, device_ids):
        """
        Unassign devices from a server by sending an ASSIGN_DEVICES activity with mdmServer = null.
        """
        payload = {
            "data": {
                "type": "orgDeviceActivities",
                "attributes": {
                    "activityType": "ASSIGN_DEVICES"
                },
                "relationships": {
                    "mdmServer": {
                        "data": None
                    },
                    "devices": {
                        "data": [
                            {"type": "orgDevices", "id": device_id}
                            for device_id in device_ids
                        ]
                    }
                }
            }
        }
        return self.create_org_device_activity(payload)