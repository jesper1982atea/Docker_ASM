// API utility for GSX
export async function getGsxApiKey() {
  const res = await fetch("http://127.0.0.1:8080/api/gsx/gsx-api-key", {
    method: "GET",
    headers: { "accept": "application/json" }
  });
  if (!res.ok) throw new Error("Failed to fetch GSX API key");
  return await res.json();
}

export async function setGsxApiKey(apiKey) {
  const res = await fetch("http://127.0.0.1:8080/api/gsx/gsx-api-key", {
    method: "POST",
    headers: { "Content-Type": "application/json", "accept": "application/json" },
    body: JSON.stringify({ api_key: apiKey })
  });
  if (!res.ok) throw new Error("Failed to save GSX API key");
  return await res.json();
}

export async function getGsxDeviceDetails(serial, apiKey) {
  const res = await fetch(`http://127.0.0.1:8080/api/gsx/device-details/${serial}`, {
    method: "GET",
    headers: {
      "accept": "application/json",
      "X-GSX-API-KEY": apiKey
    }
  });
  if (!res.ok) throw new Error("Failed to fetch device details");
  return await res.json();
}
