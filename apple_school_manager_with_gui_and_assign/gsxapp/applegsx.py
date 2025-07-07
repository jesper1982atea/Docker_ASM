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
            
            # Replicating the .NET logic to handle the specific string format from Flexvalg API.
            raw_text = response.text

            # 1. Replace escaped quotes and backslashes
            # In Python, json.loads handles this, but we can be explicit like the C# code.
            # The C# code seems to be doing what json.loads does, but let's try a more direct translation.
            # The raw string from Flexvalg is like: "\"{\\\"device\\\":...}\""
            
            # First, remove potential outer quotes if response.text is the full quoted string
            if raw_text.startswith('"') and raw_text.endswith('"'):
                json_formatted = raw_text[1:-1]
            else:
                json_formatted = raw_text

            # Replace escaped quotes `\"` with `"`
            json_formatted = json_formatted.replace('\\"', '"')
            
            try:
                data = json.loads(json_formatted)
                return data, 200
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON from GSX API for device {device_id} after cleaning: {e}")
                logger.error(f"Cleaned string was: {json_formatted}")
                return {"error": "Received malformed JSON data from GSX API", "details": response.text}, 500

        except requests.exceptions.HTTPError as e:
            logger.error(f"HTTP error calling Apple GSX API for device {device_id}: {e}")
            return {"error": f"Failed to get device details. Status: {e.response.status_code}", "details": e.response.text}, e.response.status_code
        except requests.exceptions.RequestException as e:
            logger.error(f"Error calling Apple GSX API for device {device_id}: {e}")
            return {"error": str(e)}, 500
            return {"error": str(e)}, 500
