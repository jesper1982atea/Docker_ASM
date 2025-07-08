import requests
import logging
import json
import re
from typing import Optional, Tuple, Union
from gsxapp.gsxmodel import GSXResponse  # <- Importera modellen

logger = logging.getLogger(__name__)

def clear_json(json_str: str) -> str:
    """
    Removes empty or default values from a JSON-like string, mimicking .NET clearJSON.
    """
    pattern = r'(\"[^\"]*\"\s*:\s*(\[\]|\{\}|\"\"|0|\"0000-00-00\"|\"0000000000\"),?)'
    result = json_str
    while re.search(pattern, result):
        result = re.sub(pattern, '', result)

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
                # 1. Trimma bort skräp efter sista } ifall det finns
                last_brace = raw_text.rfind("}")
                if last_brace != -1:
                    raw_text = raw_text[:last_brace + 1]

                # 2. Avkoda yttre JSON-strängen (detta är en serialiserad sträng)
                inner_json_str = json.loads(raw_text)

                # 3. Rensa skräpfält
                cleaned_json_str = clear_json(inner_json_str)

                # 4. Konvertera till Python dict
                cleaned_data = json.loads(cleaned_json_str)

                # 5. Returnera direkt – utan Pydantic
                return cleaned_data, 200

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
            
    