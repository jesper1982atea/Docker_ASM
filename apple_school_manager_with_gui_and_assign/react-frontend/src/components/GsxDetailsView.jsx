import React from "react";

const GsxDetailsView = ({ gsxDetails, serial }) => {
  if (!gsxDetails) return null;
  const { productDescription, warrantyInfo, soldToName, productImageURL, activationDetails, identifiers, caseDetails, configDescription, configCode, loaner, consumerLawInfo, messages, productLine } = gsxDetails;
  // ...lägg in JSX från originalet här, se till att använda props
  return (
    <React.Fragment>
      {/* General Information */}
      <div className="result-card success" style={{borderLeft: 'none', padding: '1.5rem', background: 'var(--atea-light-grey, #f7f7f7)'}}>
        <div className="result-header">
          <span><span role="img" aria-label="Serial">🔎</span> {serial}</span>
          {productImageURL && <img src={productImageURL} alt="Product Image" />}
        </div>
        <div className="detail-grid">
          <div className="detail-item"><span className="detail-label">📝 Description</span><span className="detail-value">{productDescription}</span></div>
          <div className="detail-item"><span className="detail-label">⚙️ Configuration</span><span className="detail-value">{configDescription}</span></div>
          <div className="detail-item"><span className="detail-label">👤 Sold To</span><span className="detail-value">{soldToName}</span></div>
          <div className="detail-item"><span className="detail-label">🌍 Purchase Country</span><span className="detail-value">{warrantyInfo?.purchaseCountryDesc} ({warrantyInfo?.purchaseCountryCode})</span></div>
          <div className="detail-item"><span className="detail-label">🔄 Loaner Device</span><span className="detail-value">{loaner ? 'Yes' : 'No'}</span></div>
        </div>
      </div>

          <div className="section">
              <h3>Warranty Details</h3>
              <div className="detail-grid">
                  <div className="detail-item"><div className="detail-label">Status</div><div className="detail-value" style={{ color: warrantyInfo?.warrantyStatusCode !== 'OO' ? 'green' : 'red' }}>{warrantyInfo?.warrantyStatusDescription}</div></div>
                  <div className="detail-item"><div className="detail-label">Purchase Date</div><div className="detail-value">{new Date(warrantyInfo?.purchaseDate).toLocaleDateString()}</div></div>
                  <div className="detail-item"><div className="detail-label">Registration Date</div><div className="detail-value">{new Date(warrantyInfo?.registrationDate).toLocaleDateString()}</div></div>
                  <div className="detail-item"><div className="detail-label">Days Remaining</div><div className="detail-value">{warrantyInfo?.daysRemaining}</div></div>
                  <div className="detail-item"><div className="detail-label">Labor Covered</div><div className="detail-value">{warrantyInfo?.laborCovered ? 'Yes' : 'No'}</div></div>
                  <div className="detail-item"><div className="detail-label">Part Covered</div><div className="detail-value">{warrantyInfo?.partCovered ? 'Yes' : 'No'}</div></div>
                  <div className="detail-item"><div className="detail-label">Onsite Coverage</div><div className="detail-value">{warrantyInfo?.onsiteCoverage ? 'Yes' : 'No'}</div></div>
              </div>
              {warrantyInfo?.deviceCoverageDetails && (
                  <div style={{ marginTop: '1rem' }}>
                      <h4>Coverage Details</h4>
                      <ul className="message-list">
                          {warrantyInfo.deviceCoverageDetails.map((msg, i) => <li key={i} className="message-item">{msg}</li>)}
                      </ul>
                  </div>
              )}
          </div>

           {activationDetails && <div className="section">
                <h3>Activation & Carrier</h3>
                <div className="detail-grid">
                    <div className="detail-item"><div className="detail-label">First Activation</div><div className="detail-value">{activationDetails.firstActivationDate ? new Date(activationDetails.firstActivationDate).toLocaleString() : 'N/A'}</div></div>
                    <div className="detail-item"><div className="detail-label">Unlocked</div><div className="detail-value" style={{ color: activationDetails.unlocked ? 'green' : 'orange' }}>{activationDetails.unlocked ? 'Yes' : 'No'}</div></div>
                    <div className="detail-item"><div className="detail-label">Carrier</div><div className="detail-value">{activationDetails.carrierName || 'N/A'}</div></div>
                    <div className="detail-item"><div className="detail-label">Last Restore</div><div className="detail-value">{activationDetails.lastRestoreDate ? new Date(activationDetails.lastRestoreDate).toLocaleString() : 'N/A'}</div></div>
                    <div className="detail-item"><div className="detail-label">Unlock Date</div><div className="detail-value">{activationDetails.unlockDate ? new Date(activationDetails.unlockDate).toLocaleString() : 'N/A'}</div></div>
                    <div className="detail-item"><div className="detail-label">OS Version</div><div className="detail-value">{activationDetails.productVersion}</div></div>
                    <div className="detail-item"><div className="detail-label">Last Unbrick OS</div><div className="detail-value">{activationDetails.lastUnbrickOsBuild}</div></div>
                </div>
            </div>}
            
            {activationDetails && <div className="section">
                <h3>Activation Policy</h3>
                <div className="detail-grid">
                    <div className="detail-item"><div className="detail-label">Initial Policy</div><div className="detail-value">{activationDetails.initialActivationPolicyDetails} ({activationDetails.initialActivationPolicyID})</div></div>
                    <div className="detail-item"><div className="detail-label">Applied Policy</div><div className="detail-value">{activationDetails.appliedActivationDetails} ({activationDetails.appliedActivationPolicyID})</div></div>
                    <div className="detail-item"><div className="detail-label">Next Tether Policy</div><div className="detail-value">{activationDetails.nextTetherPolicyDetails} ({activationDetails.nextTetherPolicyID})</div></div>
                </div>
            </div>}

            {identifiers && <div className="section">
                <h3>Product Information</h3>
                <div className="detail-grid">
                    <div className="detail-item"><div className="detail-label">Serial Number</div><div className="detail-value">{identifiers.serial || serial}</div></div>
                    {identifiers.imei && <div className="detail-item"><div className="detail-label">IMEI</div><div className="detail-value">{identifiers.imei}</div></div>}
                    {identifiers.imei2 && <div className="detail-item"><div className="detail-label">IMEI 2</div><div className="detail-value">{identifiers.imei2}</div></div>}
                    <div className="detail-item"><div className="detail-label">Config Code</div><div className="detail-value">{configCode}</div></div>
                    <div className="detail-item"><div className="detail-label">Product Line</div><div className="detail-value">{productLine}</div></div>
                </div>
            </div>}
            
            {messages && messages.length > 0 && <div className="section">
                <h3>Messages</h3>
                <ul className="message-list">
                    {messages.map((msg, i) => (
                        <li key={i} className="message-item">
                            <div className="detail-label">{msg.type}</div>
                            <div className="detail-value">{msg.message}</div>
                        </li>
                    ))}
                </ul>
            </div>}

            {caseDetails && caseDetails.length > 0 && <div className="section">
                <h3>Repair Cases ({caseDetails.length})</h3>
                <div className="detail-grid">
                    {caseDetails.map(c => (
                        <div key={c.caseId} className="detail-item">
                            <div className="detail-label">Case {c.caseId} ({new Date(c.createdDateTime).toLocaleDateString()})</div>
                            <div className="detail-value">{c.summary}</div>
                        </div>
                    ))}
                </div>
            </div>}


      
      {/* ...lägg in resterande JSX från originalet här... */}
    </React.Fragment>
  );
};

export default GsxDetailsView;
