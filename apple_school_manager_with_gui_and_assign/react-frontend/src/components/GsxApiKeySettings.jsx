import React, { useState, useEffect } from "react";
import { setGsxApiKey, getGsxApiKey } from "./api";

const GsxApiKeySettings = () => {
  const [gsxApiKey, setGsxApiKeyState] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getGsxApiKey()
      .then(data => {
        setGsxApiKeyState(data.api_key || "");
        setLoading(false);
      })
      .catch(() => {
        setError("Kunde inte hämta GSX API-nyckel.");
        setLoading(false);
      });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaved(false);
    setError("");
    try {
      const data = await setGsxApiKey(gsxApiKey);
      if (data.success) {
        setSaved(true);
      } else {
        setError(data.error || "Fel vid sparande");
      }
    } catch {
      setError("Nätverksfel vid sparande");
    }
  };

  if (loading) return <div className="loading"><div className="spinner"></div><p>Laddar...</p></div>;

  return (
    <div className="container">
      <h2>GSX API-nyckel inställningar</h2>
      <form onSubmit={handleSave} style={{ maxWidth: 500, margin: "2rem auto", background: "var(--atea-light-grey)", padding: "1.5rem", borderRadius: "10px" }}>
        <input type="text" value={gsxApiKey} onChange={e => setGsxApiKeyState(e.target.value)} placeholder="Klistra in GSX API-nyckel" style={{ width: "100%", padding: "0.5rem", fontSize: "1rem", borderRadius: "6px", border: "1px solid #ccc" }} />
        <button type="submit" style={{ marginTop: "1rem", background: "var(--atea-green)", color: "#fff", border: "none", borderRadius: "6px", padding: "0.5rem 1.5rem", fontWeight: 600, fontSize: "1rem", cursor: "pointer" }}>Spara</button>
        {saved && <span style={{ color: "var(--atea-green)", marginLeft: "1rem" }}>Sparat!</span>}
        {error && <span style={{ color: "red", marginLeft: "1rem" }}>{error}</span>}
      </form>
    </div>
  );
};

export default GsxApiKeySettings;
