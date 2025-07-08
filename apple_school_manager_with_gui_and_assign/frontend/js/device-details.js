const { useState, useEffect } = React;

function DeviceDetailsPage() {
    const [device, setDevice] = useState(null);
    const [gsxDetails, setGsxDetails] = useState(null);
    const [mdmServers, setMdmServers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedMdm, setSelectedMdm] = useState('');
    const [customerInfo, setCustomerInfo] = useState(null);

    const params = new URLSearchParams(window.location.search);
    const customerId = params.get('customer');
    const deviceId = params.get('device');

    const fetchData = async () => {
        if (!customerId || !deviceId) {
            setError("Customer ID or Device ID is missing from URL.");
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            // Fetch device details and MDM servers in parallel
            const [deviceRes, mdmServersRes, customerInfoRes] = await Promise.all([
                fetch(`/api/${customerId}/devices/${deviceId}`),
                fetch(`/api/${customerId}/mdmServers`),
                fetch(`/api/customers/${customerId}`)
            ]);

            if (!deviceRes.ok) throw new Error(`Failed to fetch device: ${deviceRes.statusText}`);
            if (!mdmServersRes.ok) throw new Error(`Failed to fetch MDM servers: ${mdmServersRes.statusText}`);
            if (!customerInfoRes.ok) throw new Error(`Failed to fetch customer info: ${customerInfoRes.statusText}`);

            const deviceData = await deviceRes.json();
            const mdmServersData = await mdmServersRes.json();
            const customerInfoData = await customerInfoRes.json();
            
            // If device is assigned, fetch the server details
            if (deviceData.data?.attributes?.status === 'ASSIGNED') {
                try {
                    const serverRes = await fetch(`/api/${customerId}/devices/${deviceId}/assignedServer`);
                    if (serverRes.ok) {
                        deviceData.assignedServer = await serverRes.json();
                    }
                } catch (e) {
                    console.warn("Could not fetch assigned server info:", e);
                }
            }

            setDevice(deviceData);
            setMdmServers(mdmServersData.data || []);
            setCustomerInfo(customerInfoData);

            // Fetch GSX details if possible
            try {
                const gsxRes = await fetch(`/api/${customerId}/gsx/device-details/${deviceId}`);
                if (gsxRes.ok) {
                    const gsxData = await gsxRes.json();
                    // The API returns {"device": {...}}, so we use gsxData.device
                    if (gsxData && gsxData.device) {
                        setGsxDetails(gsxData.device);
                    }
                } else {
                    console.log("GSX details not available or API key not configured.");
                }
            } catch (e) {
                console.warn("Could not fetch GSX details:", e);
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [customerId, deviceId]);

    const assignDeviceToMDM = async () => {
        if (!selectedMdm) {
            alert("Please select an MDM server.");
            return;
        }
        try {
            const payload = {
                data: {
                    type: "orgDeviceActivities",
                    attributes: { activityType: "ASSIGN_DEVICES" },
                    relationships: {
                        mdmServer: { data: { type: "mdmServers", id: selectedMdm } },
                        devices: { data: [{ type: "orgDevices", id: deviceId }] }
                    }
                }
            };
            const response = await fetch(`/api/${customerId}/orgDeviceActivities`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                alert('Device assigned successfully!');
                fetchData(); // Refresh data
            } else {
                const errorData = await response.json();
                alert(`Error assigning device: ${errorData.error || response.statusText}`);
            }
        } catch (err) {
            alert('Error assigning device: ' + err.message);
        }
    };

    const unassignDevice = async () => {
        if (!window.confirm('Are you sure you want to unassign this device?')) return;
        try {
            const response = await fetch(`/api/${customerId}/orgDeviceActivities/unassign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ device_ids: [deviceId] })
            });
            if (response.ok) {
                alert('Device unassigned successfully!');
                fetchData(); // Refresh data
            } else {
                const errorData = await response.json();
                alert(`Failed to unassign device: ${errorData.error || response.statusText}`);
            }
        } catch (err) {
            alert('Error unassigning device: ' + err.message);
        }
    };

    if (loading) {
        return <div className="loading"><div className="spinner"></div><p>Loading device details...</p></div>;
    }

    if (error) {
        return <div className="container"><h1>Error</h1><p>{error}</p></div>;
    }

    if (!device || !device.data) {
        return <div className="container"><h1>Error</h1><p>Device not found.</p></div>;
    }

    const attributes = device.data.attributes;
    const assignedServerInfo = device.assignedServer?.data?.attributes;
    const assignedServerId = device.assignedServer?.data?.id;

    return (
        <div className="container">
            <div className="header">
                <div className="header-content">
                    <img src="/frontend/assets/atea-logo.svg" alt="Atea Logo" className="header-logo" style={{filter: 'brightness(0) invert(1)'}}/>
                    <div>
                        <h1>{attributes.deviceModel || 'Device Details'}</h1>
                        <p>Serial Number: {attributes.serialNumber || 'N/A'}</p>
                    </div>
                </div>
                <div className="header-links">
                    <a href={`/frontend/customer-devices.html?customer=${customerId}`} className="header-link">
                        ⬅️ Back to Device List
                    </a>
                    {customerInfo?.gsx_api_key && (
                        <a href={`/frontend/gsx-search.html?customer=${customerId}`} className="header-link">
                            🔍 GSX Search
                        </a>
                    )}
                     <a href="/frontend/" className="header-link">
                        🏠 Admin Panel
                    </a>
                </div>
            </div>

            <div className="detail-grid">
                <div className="detail-item"><div className="detail-label">Status</div><div className="detail-value">{attributes.status}</div></div>
                <div className="detail-item"><div className="detail-label">OS</div><div className="detail-value">{attributes.os}</div></div>
                <div className="detail-item"><div className="detail-label">Color</div><div className="detail-value">{attributes.color || 'N/A'}</div></div>
                <div className="detail-item"><div className="detail-label">Storage</div><div className="detail-value">{attributes.storage || 'N/A'}</div></div>
                <div className="detail-item"><div className="detail-label">Purchase Source</div><div className="detail-value">{attributes.purchaseSourceType}</div></div>
                <div className="detail-item"><div className="detail-label">Device ID</div><div className="detail-value">{device.data.id}</div></div>
            </div>

            {gsxDetails && (
                <div className="management-section">
                    <h3>GSX Information</h3>
                    <div className="detail-grid">
                        <div className="detail-item">
                            <div className="detail-label">Product Description</div>
                            <div className="detail-value">{gsxDetails.productDescription}</div>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label">Warranty Status</div>
                            <div className="detail-value" style={{ color: gsxDetails.warrantyInfo?.warrantyStatusCode !== 'OO' ? 'green' : 'red' }}>
                                {gsxDetails.warrantyInfo?.warrantyStatusDescription}
                            </div>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label">Purchase Date</div>
                            <div className="detail-value">{new Date(gsxDetails.warrantyInfo?.purchaseDate).toLocaleDateString()}</div>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label">First Activation</div>
                            <div className="detail-value">{gsxDetails.activationDetails?.firstActivationDate ? new Date(gsxDetails.activationDetails.firstActivationDate).toLocaleDateString() : 'N/A'}</div>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label">Sold To</div>
                            <div className="detail-value">{gsxDetails.soldToName}</div>
                        </div>
                        <div className="detail-item">
                            <div className="detail-label">Unlocked</div>
                            <div className="detail-value" style={{ color: gsxDetails.activationDetails?.unlocked ? 'green' : 'orange' }}>
                                {gsxDetails.activationDetails?.unlocked ? 'Yes' : 'No'}
                            </div>
                        </div>
                        {gsxDetails.identifiers?.imei && (
                            <div className="detail-item">
                                <div className="detail-label">IMEI</div>
                                <div className="detail-value">{gsxDetails.identifiers.imei}</div>
                            </div>
                        )}
                        {gsxDetails.productImageURL && (
                            <div className="detail-item">
                                <div className="detail-label">Image</div>
                                <img src={gsxDetails.productImageURL} alt="Product Image" style={{ maxWidth: '72px', borderRadius: '4px' }} />
                            </div>
                        )}
                    </div>
                    {gsxDetails.caseDetails && gsxDetails.caseDetails.length > 0 && (
                        <div style={{marginTop: '1.5rem'}}>
                            <h4>Repair Cases</h4>
                            <div className="detail-grid">
                                {gsxDetails.caseDetails.map(caseItem => (
                                    <div key={caseItem.caseId} className="detail-item">
                                        <div className="detail-label">Case ID: {caseItem.caseId}</div>
                                        <div className="detail-value">{caseItem.summary}</div>
                                        <small style={{color: '#6b7280'}}>{new Date(caseItem.createdDateTime).toLocaleString()}</small>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="management-section">
                <h3>Device Assignment</h3>
                {attributes.status === 'ASSIGNED' ? (
                    <div>
                        <p>Currently assigned to:</p>
                        <div className="detail-item">
                            <div className="detail-label">MDM Server</div>
                            <div className="detail-value">{assignedServerInfo?.serverName || assignedServerInfo?.name || assignedServerId || 'Loading...'}</div>
                        </div>
                        <div className="form-group">
                            <button className="btn btn-danger" onClick={unassignDevice}>Unassign Device</button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <p>This device is currently unassigned. Select a server to assign it to.</p>
                        <div className="form-group">
                            <select value={selectedMdm} onChange={e => setSelectedMdm(e.target.value)}>
                                <option value="">Select a server...</option>
                                {mdmServers.map(server => (
                                    <option key={server.id} value={server.id}>
                                        {server.attributes?.serverName || server.attributes?.name || server.id}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <button className="btn btn-primary" onClick={assignDeviceToMDM} disabled={!selectedMdm}>
                                Assign to Server
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="footer-actions">
                {/* This link is now in the header */}
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<DeviceDetailsPage />);
