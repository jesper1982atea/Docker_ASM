import React, { useState, useEffect } from "react";
import ResultCard from "../components/ResultCard";
import GsxApiKeyManager from "../components/GsxApiKeyManager";
import { getGsxApiKey, getGsxDeviceDetails } from "../components/api";

const GSXSearchView = () => {
  const [serials, setSerials] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // customerId och customerInfo borttaget, används ej
  const [apiKey, setApiKey] = useState("");
  const [apiKeySaved, setApiKeySaved] = useState(false);

  // customerId borttaget, används ej

  // Helper to reload API key from backend
  const reloadApiKey = async () => {
    try {
      const data = await getGsxApiKey();
      setApiKey(data.api_key || "");
    } catch {
      setApiKey("");
    }
  };

  useEffect(() => {
    reloadApiKey();
  }, [apiKeySaved]);

  const handleSearch = async () => {
    if (!serials.trim()) {
      setResults([]);
      return;
    }
    if (!apiKey) {
      setError("Ingen GSX API-nyckel angiven.");
      setLoading(false);
      return;
    }
    const serialList = serials.trim().split(/\s|,|\n/).filter(Boolean);
    setLoading(true);
    setResults([]);
    setError(null);
    const promises = serialList.map((serial) =>
      getGsxDeviceDetails(serial, apiKey)
        .then((data) => ({ serial, data, ok: true }))
        .catch((err) => ({ serial, data: { error: err.message }, ok: false }))
    );
    const settledResults = await Promise.allSettled(promises);
    const finalResults = settledResults.map((res) => {
      if (res.status === "fulfilled") {
        return res.value;
      }
      return { serial: "Unknown", data: { error: "Request failed" }, ok: false };
    });
    setResults(finalResults);
    setLoading(false);
  };

  // Exportfunktion kräver xlsx-paket, kan läggas till senare
  const handleExport = () => {
    alert("Exportfunktion kräver xlsx-paket och kan implementeras vid behov.");
  };

  if (!apiKey) {
    return (
      <div className="container">
        <GsxApiKeyManager apiKey={apiKey} setApiKey={setApiKey} setApiKeySaved={setApiKeySaved} reloadApiKey={reloadApiKey} />
        <p>Fyll i din GSX API-nyckel ovan för att använda sökningen.</p>
      </div>
    );
  }
  return (
    <div className="container">
      <div className="search-controls">
        <textarea
          value={serials}
          onChange={(e) => setSerials(e.target.value)}
          placeholder="Enter serial numbers (separated by space, comma, or new line)..."
        />
        <div className="search-buttons">
          <button className="btn btn-primary" onClick={handleSearch} disabled={loading || (!apiKey)}>
            {loading ? "Searching..." : "Search"}
          </button>
          <button className="btn btn-secondary" onClick={handleExport} disabled={results.length === 0}>
            Export to Excel
          </button>
        </div>
      </div>
      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Fetching details...</p>
        </div>
      )}
      {results.length > 0 && (
        <div className="results-grid">
          {results.map(({ serial, data, ok }) => (
            <ResultCard key={serial} serial={serial} data={data} ok={ok} />
          ))}
        </div>
      )}
    </div>
  );
};

export default GSXSearchView;
