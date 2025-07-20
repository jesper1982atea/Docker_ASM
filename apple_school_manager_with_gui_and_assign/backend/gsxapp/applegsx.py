import requests
import logging
import json
import os

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
        params = {"deviceid": device_id}
        try:
            response = self.session.get(self.base_url, params=params)
            response.raise_for_status()
            raw_text = response.text

            # Första JSON-lagret: avkoda till inre sträng
            step1 = json.loads(raw_text)

            # Trimma bort allt efter sista }
            last_brace = step1.rfind("}")
            if last_brace != -1:
                step1 = step1[:last_brace + 1]

            # Andra JSON-lagret: nu ska det vara en riktig dict
            data = json.loads(step1)

            return data, 200

        except Exception as e:
            logger.error(f"Failed to parse JSON from GSX API for device {device_id}: {e}")
            error_dump_path = f"/tmp/gsx_error_{device_id}.txt"
            try:
                with open(error_dump_path, "w", encoding="utf-8") as f:
                    f.write(raw_text)
                logger.error(f"Raw text written to {error_dump_path}")
            except Exception as file_error:
                logger.error(f"Failed to write raw text to file: {file_error}")

            return {"error": "Malformed JSON from GSX", "details": str(e)}, 500

        except requests.exceptions.HTTPError as e:
            logger.error(f"HTTP error calling Apple GSX API for device {device_id}: {e}")
            return {"error": f"Failed to get device details. Status: {e.response.status_code}", "details": e.response.text}, e.response.status_code

        except requests.exceptions.RequestException as e:
            logger.error(f"Error calling Apple GSX API for device {device_id}: {e}")
            return {"error": str(e)}, 500