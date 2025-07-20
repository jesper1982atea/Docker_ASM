import React from "react";

import { useNavigate } from "react-router-dom";

const ResultCard = ({ serial, data, ok }) => {
  const navigate = useNavigate();
  if (!ok || !data.device) {
    return (
      <div className="result-card error">
        <h3 className="result-header">{serial}</h3>
        <p className="error-message">{data.error || 'Device not found or error fetching details.'}</p>
      </div>
    );
  }
  const device = data.device;
  const { productDescription, warrantyInfo, soldToName, productImageURL } = device;
  const handleClick = (e) => {
    e.preventDefault();
    navigate(`/gsx-device-details/${serial}`);
  };
  return (
    <a href={`/gsx-device-details/${serial}`} className="result-card-link" onClick={handleClick}>
      <div className="result-card success">
        <div className="result-header">
          <span>{serial}</span>
          {productImageURL && <img src={productImageURL} alt="Product" />}
        </div>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">Description</span>
            <span className="detail-value">{productDescription}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Warranty</span>
            <span className="detail-value" style={{ color: warrantyInfo?.warrantyStatusCode !== 'OO' ? 'green' : 'red' }}>
              {warrantyInfo?.warrantyStatusDescription}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Purchase Date</span>
            <span className="detail-value">{warrantyInfo?.purchaseDate ? new Date(warrantyInfo.purchaseDate).toLocaleDateString() : ''}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Sold To</span>
            <span className="detail-value">{soldToName}</span>
          </div>
        </div>
      </div>
    </a>
  );
};

export default ResultCard;
