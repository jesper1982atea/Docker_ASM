import requests
import logging
import json
from typing import Optional, Tuple, Union
from gsxmodel import GSXResponse  # <- Importera modellen

logger = logging.getLogger(__name__)

class AppleGSXAPI:
    def __init__(self, api_key: str):
        if not api_key:
            raise ValueError("Apple GSX API Key must be provided.")
        self.base_url = "https://api.flexvalg.dk/internalApi/v1/services/593/AppleGSX"
        self.api_key = api_key
        self.session = requests.Session()
        self.session.headers.update({"ApiKey": self.api_key})

    def get_device_details(self, device_id: str) -> Tuple[Union[GSXResponse, dict], int]:
        params = {"deviceid": device_id}
        try:
            response = self.session.get(self.base_url, params=params)
            response.raise_for_status()

            raw_text = response.text

            try:
                # Dubbelt serialiserad JSON-sträng
                inner_json = json.loads(json.loads(raw_text))
                parsed = GSXResponse(**inner_json)
                return parsed, 200
            except (json.JSONDecodeError, TypeError, ValueError) as e:
                logger.error(f"Failed to parse JSON from GSX API for device {device_id}: {e}")
                logger.error(f"Raw text was: {raw_text}")
                return {"error": "Received malformed JSON data from GSX API", "details": raw_text}, 500

        except requests.exceptions.HTTPError as e:
            logger.error(f"HTTP error calling Apple GSX API for device {device_id}: {e}")
            return {"error": f"Failed to get device details. Status: {e.response.status_code}", "details": e.response.text}, e.response.status_code
        except requests.exceptions.RequestException as e:
            logger.error(f"Error calling Apple GSX API for device {device_id}: {e}")
            return {"error": str(e)}, 500