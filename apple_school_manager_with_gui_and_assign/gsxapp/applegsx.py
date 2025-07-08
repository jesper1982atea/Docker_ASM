import requests
import logging
import json
import re
from typing import Optional, Tuple, Union
from gsxapp.gsxmodel import GSXResponse  # <- Importera modellen

logger = logging.getLogger(__name__)

def clear_json(data: str) -> str:
    # Rensa matchningar av: tomma listor, tomma strängar, 0, "0000-00-00", "0000000000", tomma objekt
    pattern = r'(\"[^\"]*\"\s*:\s*(\[\]|\{\}|\"\"|0|\"0000-00-00\"|\"0000000000\"),?)'
    result = data
    while re.search(pattern, result):
        result = re.sub(pattern, '', result)

    # Städa bort överflödiga kommatecken
    result = result.replace(',}', '}').replace(',]', ']')
    return result
        

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
                # 1. Dubbel-avkoda JSON-strängen (API returnerar serialiserad JSON)
                inner_json_str = json.loads(raw_text)
                logger.debug(f"Inner JSON string for device {device_id}: {inner_json_str}")

                # 2. Rensa upp stränginnehållet från tomma fält osv
                cleaned_json_str = clear_json(response.text)
                logger.debug(f"Cleaned JSON string for device {device_id}: {cleaned_json_str}")

                # 3. Ladda det som en riktig dict
                data = json.loads(cleaned_json_str)
                logger.debug(f"Parsed data for device {device_id}: {data}")

                # 4. Mappa till pydantic-modellen
                parsed = GSXResponse(**data)
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
            
    