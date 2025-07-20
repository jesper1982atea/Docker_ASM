import json
import requests

# === KONFIGURATION ===
DEVICE_ID = "MX5D4F0Y33"
API_KEY = "B93C197B-40F6-471A-A997-D6D9ACF78E12"  # ← byt ut mot din riktiga nyckel
API_URL = f"https://api.flexvalg.dk/internalApi/v1/services/593/AppleGSX?deviceid={DEVICE_ID}"

# === API-ANROP ===
headers = {"ApiKey": API_KEY}

try:
    response = requests.get(API_URL, headers=headers)
    response.raise_for_status()
    raw_text = response.text
except Exception as e:
    print("Kunde inte hämta från GSX API:", e)
    exit(1)

# === PARSNING ===
try:
    step1 = json.loads(raw_text)  # Första lagret – ger JSON-sträng
    print("Step 1 OK")

    # Trimma efter sista }
    last_brace_index = step1.rfind("}")
    if last_brace_index != -1:
        step1 = step1[:last_brace_index + 1]

    step2 = json.loads(step1)  # Andra lagret – till dict
    print("Step 2 OK")

    # Skriv till fil för att slippa truncation i terminalen
    with open("/tmp/gsx_parsed.json", "w", encoding="utf-8") as f:
        json.dump(step2, f, indent=2)

    print("✅ Allt OK – se resultat i /tmp/gsx_parsed.json")

except Exception as e:
    print("🚨 FAILED att parsa JSON:", e)
    with open("/tmp/gsx_raw_failed.txt", "w", encoding="utf-8") as f:
        f.write(raw_text)
    print("🚨 Raw JSON dumpad till /tmp/gsx_raw_failed.txt")