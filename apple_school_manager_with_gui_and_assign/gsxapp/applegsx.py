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

            # C# logic: jsonFormatted = response.Content.Replace(@"\""", @"""")
            json_formatted = raw_text.replace('\\"', '"')

            # C# logic: 
            # jsonFormatted = jsonFormatted.Substring(1, jsonFormatted.Length - 1);
            # jsonFormatted = jsonFormatted.Substring(0, jsonFormatted.Length - 1);
            # This is equivalent to removing the first and last character.
            if len(json_formatted) >= 2:
                 json_formatted = json_formatted[1:-1]

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
        except requests.exceptions.RequestException as e:
            logger.error(f"Error calling Apple GSX API for device {device_id}: {e}")
            return {"error": str(e)}, 500
            return {"error": str(e)}, 500
            return {"error": str(e)}, 500
