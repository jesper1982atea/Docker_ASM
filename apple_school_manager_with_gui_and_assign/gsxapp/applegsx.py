import requests
import logging
import json
import codecs

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
            
            # The API returns a heavily escaped string.
            raw_text = response.text

            # The string is doubly quoted and escaped.
            # Example: "\"{\\\"key\\\": \\\"value\\\"}\""
            try:
                # First, load it as a JSON string, which will unescape the outer layer.
                # This should turn the example into: "{\"key\": \"value\"}"
                unwrapped_string = json.loads(raw_text)
                
                # Now, the result is a standard JSON string, which we can load.
                data = json.loads(unwrapped_string)
                return data, 200
            except (json.JSONDecodeError, TypeError) as e:
                logger.error(f"Failed to parse JSON from GSX API for device {device_id}: {e}")
                logger.error(f"Raw text was: {raw_text}")
                return {"error": "Received malformed JSON data from GSX API", "details": response.text}, 500

        except requests.exceptions.HTTPError as e:
            logger.error(f"HTTP error calling Apple GSX API for device {device_id}: {e}")
            return {"error": f"Failed to get device details. Status: {e.response.status_code}", "details": e.response.text}, e.response.status_code
        except requests.exceptions.RequestException as e:
            logger.error(f"Error calling Apple GSX API for device {device_id}: {e}")
            return {"error": str(e)}, 500
            logger.error(f"Error calling Apple GSX API for device {device_id}: {e}")
            return {"error": str(e)}, 500
        except requests.exceptions.RequestException as e:
            logger.error(f"Error calling Apple GSX API for device {device_id}: {e}")
            return {"error": str(e)}, 500
            return {"error": str(e)}, 500
            return {"error": str(e)}, 500
