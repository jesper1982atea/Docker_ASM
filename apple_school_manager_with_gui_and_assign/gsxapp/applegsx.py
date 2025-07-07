import requests
import logging

logger = logging.getLogger(__name__)

class AppleGSXAPI:
    def __init__(self, api_key):
        if not api_key:
            raise ValueError("Apple GSX API Key must be provided.")
        self.base_url = "https://api.flexvalg.dk/internalApi/v1/services/593/AppleGSX"
        self.api_key = api_key
        self.session = requests.Session()
        self.session.headers.update({"ApiKey": self.api_key})

    def get_device_details(self, device_id):
        """
        Get device details from Apple GSX API.
        """
        params = {"deviceid": device_id}
        try:
            response = self.session.get(self.base_url, params=params)
            response.raise_for_status()  # Raise an exception for bad status codes
            return response.json(), 200
        except requests.exceptions.HTTPError as e:
            logger.error(f"HTTP error calling Apple GSX API for device {device_id}: {e}")
            return {"error": f"Failed to get device details. Status: {e.response.status_code}", "details": e.response.text}, e.response.status_code
        except requests.exceptions.RequestException as e:
            logger.error(f"Error calling Apple GSX API for device {device_id}: {e}")
            return {"error": str(e)}, 500
