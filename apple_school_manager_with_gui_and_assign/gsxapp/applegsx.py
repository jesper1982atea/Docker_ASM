import requests
import logging
import json

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
            
            data = response.json()

            # Handle cases where the response is a dictionary with a single key
            # whose value is a JSON string.
            if isinstance(data, dict) and len(data) == 1:
                key = next(iter(data))
                value = data[key]
                if isinstance(value, str):
                    try:
                        # The value is a JSON string, so we parse it.
                        return {key: json.loads(value)}, 200
                    except json.JSONDecodeError:
                        logger.error(f"GSX API returned a dictionary with a malformed JSON string for device {device_id}")
                        # Fall through to return original data if parsing fails
            
            # Handle cases where the entire response is a JSON string.
            if isinstance(data, str):
                try:
                    # If data is a string, it's likely double-encoded JSON.
                    return json.loads(data), 200
                except json.JSONDecodeError:
                    # If it's not valid JSON, return it as is with an error indicator.
                    logger.error(f"GSX API returned a string that is not valid JSON for device {device_id}")
                    return {"error": "Received malformed data from GSX API", "details": data}, 500
            
            return data, 200
        except requests.exceptions.HTTPError as e:
            logger.error(f"HTTP error calling Apple GSX API for device {device_id}: {e}")
            return {"error": f"Failed to get device details. Status: {e.response.status_code}", "details": e.response.text}, e.response.status_code
        except requests.exceptions.RequestException as e:
            logger.error(f"Error calling Apple GSX API for device {device_id}: {e}")
            return {"error": str(e)}, 500
