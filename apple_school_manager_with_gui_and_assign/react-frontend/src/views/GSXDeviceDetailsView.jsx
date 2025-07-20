import React, { useState, useEffect, useRef } from "react";
import GsxDetailsView from "../components/GsxDetailsView";
import { getGsxApiKey, getGsxDeviceDetails } from "../components/api";

const GSXDeviceDetailsView = ({ serial }) => {
  const [gsxDetails, setGsxDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pageRef = useRef(null);

  useEffect(() => {
    if (!serial) {
      setError("Serial Number is missing.");
      setLoading(false);
      return;
    }
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const keyData = await getGsxApiKey();
        const apiKey = keyData.api_key;
        if (!apiKey) {
          setError("Ingen GSX API-nyckel sparad. Gå tillbaka och spara en nyckel först.");
          setLoading(false);
          return;
        }
        const data = await getGsxDeviceDetails(serial, apiKey);
        if (data && data.device) {
          setGsxDetails(data.device);
        } else {
          setError("Device details not found.");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [serial]);

  // Exportfunktioner kan läggas till här

  if (loading) {
    return <div className="loading"><div className="spinner"></div><p>Loading GSX device details...</p></div>;
  }
  if (error) {
    return <div className="container"><h1>Error</h1><p>{error}</p></div>;
  }
  if (!gsxDetails) {
    return <div className="container"><h1>Error</h1><p>Could not load device details.</p></div>;
  }
  return (
    <div className="container" ref={pageRef}>
      <GsxDetailsView gsxDetails={gsxDetails} serial={serial} />
    </div>
  );
};

export default GSXDeviceDetailsView;
