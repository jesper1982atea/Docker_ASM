const { useState, useEffect } = React;

function ResultCard({ serial, data, ok, customerId }) {
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

    return (
        <a href={`/frontend/gsx-device-details.html?customer=${customerId}&serial=${serial}`} className="result-card-link">
            <div className="result-card success">
                <div className="result-header">
                    <span>{serial}</span>
                    {productImageURL && <img src={productImageURL} alt="Product Image" />}
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
                        <span className="detail-value">{new Date(warrantyInfo?.purchaseDate).toLocaleDateString()}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Sold To</span>
                        <span className="detail-value">{soldToName}</span>
                    </div>
                </div>
            </div>
        </a>
    );
}

function GsxSearchPage() {
    const [serials, setSerials] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [customerInfo, setCustomerInfo] = useState(null);

    const customerId = new URLSearchParams(window.location.search).get('customer');

    useEffect(() => {
        if (customerId) {
            fetch(`/api/customers/${customerId}`)
                .then(res => res.json())
                .then(data => setCustomerInfo(data))
                .catch(err => console.error("Failed to fetch customer info:", err));
        }
    }, [customerId]);

    const handleSearch = async () => {
        if (!serials.trim()) {
            setResults([]);
            return;
        }
        const serialList = serials.trim().split(/[\s,]+/).filter(Boolean);
        setLoading(true);
        setResults([]);
        setError(null);

        const promises = serialList.map(serial => 
            fetch(`/api/${customerId}/gsx/device-details/${serial}`)
                .then(res => res.json().then(data => ({ serial, data, ok: res.ok })))
                .catch(err => ({ serial, data: { error: err.message }, ok: false }))
        );

        const settledResults = await Promise.allSettled(promises);
        
        const finalResults = settledResults.map(res => {
            if (res.status === 'fulfilled') {
                return res.value;
            }
            return { serial: 'Unknown', data: { error: 'Request failed' }, ok: false };
        });

        setResults(finalResults);
        setLoading(false);
    };

    const handleExport = () => {
        if (results.length === 0) {
            alert("No data to export.");
            return;
        }

        const dataToExport = results.map(({ serial, data, ok }) => {
            if (ok && data.device) {
                const device = data.device;
                const caseSummaries = (device.caseDetails || [])
                    .map(c => `${c.caseId}: ${c.summary} (${new Date(c.createdDateTime).toLocaleDateString()})`)
                    .join('; ');

                return {
                    'Serial Number': serial,
                    'Status': 'Found',
                    'Product Description': device.productDescription,
                    'Config Description': device.configDescription,
                    'Warranty Status': device.warrantyInfo?.warrantyStatusDescription,
                    'Purchase Date': device.warrantyInfo?.purchaseDate ? new Date(device.warrantyInfo.purchaseDate).toLocaleDateString() : 'N/A',
                    'Sold To': device.soldToName,
                    'First Activation': device.activationDetails?.firstActivationDate ? new Date(device.activationDetails.firstActivationDate).toLocaleString() : 'N/A',
                    'Unlocked': device.activationDetails?.unlocked ? 'Yes' : 'No',
                    'Carrier': device.activationDetails?.carrierName || 'N/A',
                    'IMEI': device.identifiers?.imei || 'N/A',
                    'IMEI 2': device.identifiers?.imei2 || 'N/A',
                    'Repair Cases': caseSummaries || 'None'
                };
            } else {
                return {
                    'Serial Number': serial,
                    'Status': 'Error',
                    'Details': data.error || 'Device not found or error fetching details.'
                };
            }
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "GSX_Export");
        
        // Auto-size columns
        const max_width = dataToExport.reduce((w, r) => Math.max(w, ...Object.values(r).map(val => String(val).length)), 10);
        worksheet["!cols"] = Object.keys(dataToExport[0]).map(() => ({ wch: max_width }));

        XLSX.writeFile(workbook, `GSX_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    if (!customerId) {
        return <div className="container"><h1>Error</h1><p>No customer ID specified in URL.</p></div>;
    }

    return (
        <div className="container">
            <div className="header atea-header">
                <div className="header-content">
                    <img src="/frontend/assets/atea-logo.svg" alt="Atea Logo" className="header-logo"/>
                    <div>
                        <h1>GSX Device Search</h1>
                        <p>Enter serial numbers to get device details from GSX.</p>
                    </div>
                </div>
                <div className="header-links">
                    <a href={`/swagger/${customerId}`} target="_blank" className="header-link api-link">
                        📋 API Docs
                    </a>
                    <a href={`/frontend/customer-devices.html?customer=${customerId}`} className="header-link">
                        ⬅️ Back to Device List
                    </a>
                     <a href="/frontend/" className="header-link">
                        🏠 Admin Panel
                    </a>
                </div>
            </div>

            <div className="search-controls">
                <textarea 
                    value={serials}
                    onChange={e => setSerials(e.target.value)}
                    placeholder="Enter serial numbers (separated by space, comma, or new line)..."
                />
                <div className="search-buttons">
                    <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                    <button className="btn btn-secondary" onClick={handleExport} disabled={results.length === 0}>
                        Export to Excel
                    </button>
                </div>
            </div>

            {loading && (
                <div className="loading"><div className="spinner"></div><p>Fetching details...</p></div>
            )}

            {results.length > 0 && (
                <div className="results-grid">
                    {results.map(({ serial, data, ok }) => (
                        <ResultCard key={serial} serial={serial} data={data} ok={ok} customerId={customerId} />
                    ))}
                </div>
            )}
        </div>
    );
}



const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<GsxSearchPage />);
