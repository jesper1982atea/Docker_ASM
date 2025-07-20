import React, { useState } from "react";
import { setGsxApiKey } from "./api";

const GsxApiKeyManager = ({ apiKey, setApiKey, setApiKeySaved, reloadApiKey }) => {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const handleSave = async (e) => {
    e.preventDefault();
    setSaved(false);
    setError("");
    try {
      const data = await setGsxApiKey(apiKey);
      if (data.success) {
        setSaved(true);
        setApiKeySaved(true);
        if (reloadApiKey) reloadApiKey();
      } else {
        setError(data.error || "Fel vid sparande");
      }
    } catch (err) {
      setError("Nätverksfel vid sparande");
    }
  };
  return (
    <form onSubmit={handleSave} style={{ marginBottom: "2rem", background: "var(--atea-light-grey)", padding: "1.5rem", borderRadius: "10px", maxWidth: 500 }}>
      <h3>GSX API-nyckel</h3>
      <input type="text" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Klistra in GSX API-nyckel" style={{ width: "100%", padding: "0.5rem", fontSize: "1rem", borderRadius: "6px", border: "1px solid #ccc" }} />
      <button type="submit" style={{ marginTop: "1rem", background: "var(--atea-green)", color: "#fff", border: "none", borderRadius: "6px", padding: "0.5rem 1.5rem", fontWeight: 600, fontSize: "1rem", cursor: "pointer" }}>Spara</button>
      {saved && <span style={{ color: "var(--atea-green)", marginLeft: "1rem" }}>Sparat!</span>}
      {error && <span style={{ color: "red", marginLeft: "1rem" }}>{error}</span>}
    </form>
  );
};

export default GsxApiKeyManager;
