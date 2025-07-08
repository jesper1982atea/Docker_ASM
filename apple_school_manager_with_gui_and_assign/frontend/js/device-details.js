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
            <div className="header atea-header">
                <div className="header-content">
                    <img src="/frontend/images/logo.jpg" alt="Atea Logo" className="header-logo"/>
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

            {/* --- Apple School/Business Manager Information --- */}
            <div className="result-card" style={{borderLeft: '4px solid var(--atea-green)', padding: '1.5rem', background: 'var(--atea-white)', marginBottom: '2rem'}}>
                <div className="result-header" style={{paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)'}}>
                    <h3 style={{margin: 0, fontSize: '1.25rem'}}>Apple School Manager Details</h3>
                </div>
                <div className="detail-grid" style={{gridTemplateColumns: '1fr', gap: 0}}>
                    <div className="detail-item" style={{padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)'}}>
                        <span className="detail-label">Status</span>
                        <span className="detail-value">{attributes.status}</span>
                    </div>
                    <div className="detail-item" style={{padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)'}}>
                        <span className="detail-label">OS</span>
                        <span className="detail-value">{attributes.os}</span>
                    </div>
                    <div className="detail-item" style={{padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)'}}>
                        <span className="detail-label">Color</span>
                        <span className="detail-value">{attributes.color || 'N/A'}</span>
                    </div>
                    <div className="detail-item" style={{padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)'}}>
                        <span className="detail-label">Storage</span>
                        <span className="detail-value">{attributes.storage || 'N/A'}</span>
                    </div>
                    <div className="detail-item" style={{padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)'}}>
                        <span className="detail-label">Purchase Source</span>
                        <span className="detail-value">{attributes.purchaseSourceType}</span>
                    </div>
                    <div className="detail-item" style={{padding: '0.75rem 0', borderBottom: 'none'}}>
                        <span className="detail-label">Device ID</span>
                        <span className="detail-value">{device.data.id}</span>
                    </div>
                </div>
            </div>

            {/* --- GSX Information --- */}
            {gsxDetails && (
                <React.Fragment>
                    <h2 style={{color: 'var(--atea-black)', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem', fontSize: '1.5rem'}}>GSX Information</h2>
                    <window.GsxDetailsView gsxDetails={gsxDetails} serial={attributes.serialNumber} />
                </React.Fragment>
            )}

            {/* --- Device Assignment --- */}
            <div className="section">
                <h3>Device Assignment</h3>
                {attributes.status === 'ASSIGNED' ? (
                    <div>
                        <p>Currently assigned to:</p>
                        <div className="detail-item" style={{background: 'var(--atea-white)', padding: '1rem', borderRadius: '5px', border: '1px solid var(--border-color)'}}>
                            <div className="detail-label" style={{textTransform: 'uppercase', fontSize: '0.8rem'}}>MDM Server</div>
                            <div className="detail-value" style={{fontSize: '1rem'}}>{assignedServerInfo?.serverName || assignedServerInfo?.name || assignedServerId || 'Loading...'}</div>
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

