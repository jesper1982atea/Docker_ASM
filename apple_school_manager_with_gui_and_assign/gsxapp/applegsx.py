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
            
            # The API returns a string that is a JSON string, including outer quotes.
            # We need to get the raw text and parse it carefully.
            raw_text = response.text.strip()

            # If the string is quoted, unquote it.
            if raw_text.startswith('"') and raw_text.endswith('"'):
                raw_text = raw_text[1:-1]

            # The string inside is escaped, so we can now load it as JSON.
            try:
                # The string might have python-style escapes, so we decode it.
                data = json.loads(raw_text)
                return data, 200
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON from GSX API for device {device_id}: {e}")
                return {"error": "Received malformed JSON data from GSX API", "details": response.text}, 500

        except requests.exceptions.HTTPError as e:
            logger.error(f"HTTP error calling Apple GSX API for device {device_id}: {e}")
            return {"error": f"Failed to get device details. Status: {e.response.status_code}", "details": e.response.text}, e.response.status_code
        except requests.exceptions.RequestException as e:
            logger.error(f"Error calling Apple GSX API for device {device_id}: {e}")
            return {"error": str(e)}, 500
                    return {"error": "Received malformed data from GSX API", "details": data}, 500
            
            return data, 200
        except requests.exceptions.HTTPError as e:
            logger.error(f"HTTP error calling Apple GSX API for device {device_id}: {e}")
            return {"error": f"Failed to get device details. Status: {e.response.status_code}", "details": e.response.text}, e.response.status_code
        except requests.exceptions.RequestException as e:
            logger.error(f"Error calling Apple GSX API for device {device_id}: {e}")
            return {"error": str(e)}, 500
