import requests
import logging
import json
import re
from typing import Optional, Tuple, Union
from gsxapp.gsxmodel import GSXResponse  # <- Importera modellen

logger = logging.getLogger(__name__)

def parse_gsx_json(raw_text: str):
    try:
        # 1. Ta bort skräp som extra suffix efter sista avslutande }
        match = re.search(r'^"({.*})"\s*[%]*$', raw_text.strip())
        if not match:
            raise ValueError("Regex did not match double-encoded JSON")

        cleaned_outer = match.group(1)

        # 2. Unescape inner JSON string
        inner_json = json.loads(cleaned_outer)

        # 3. Nu är inner_json en sträng som innehåller riktig JSON
        return json.loads(inner_json)

    except Exception as e:
        raise ValueError(f"Could not parse cleaned GSX JSON: {e}")
        

class AppleGSXAPI:
    def __init__(self, api_key: str):
        if not api_key:
            raise ValueError("Apple GSX API Key must be provided.")
        self.base_url = "https://api.flexvalg.dk/internalApi/v1/services/593/AppleGSX"
        self.api_key = api_key
        self.session = requests.Session()
        self.session.headers.update({"ApiKey": self.api_key})
    
    

    def get_device_details(self, device_id):
        params = {"deviceid": device_id}
        try:
            response = self.session.get(self.base_url, params=params)
            response.raise_for_status()

            raw_text = response.text

            try:
                data = parse_gsx_json(raw_text)
                parsed = GSXResponse(**data)  # Pydantic
                return parsed, 200
            except Exception as e:
                logger.error(f"Failed to parse JSON from GSX API for device {device_id}: {e}")
                logger.error(f"Raw text was: {raw_text[:1000]}")
                return {"error": "Malformed JSON from GSX", "details": str(e)}, 500

        except requests.exceptions.HTTPError as e:
            logger.error(f"HTTP error calling Apple GSX API for device {device_id}: {e}")
            return {"error": f"Failed to get device details. Status: {e.response.status_code}", "details": e.response.text}, e.response.status_code
        except requests.exceptions.RequestException as e:
            logger.error(f"Error calling Apple GSX API for device {device_id}: {e}")
            return {"error": str(e)}, 500
        
    