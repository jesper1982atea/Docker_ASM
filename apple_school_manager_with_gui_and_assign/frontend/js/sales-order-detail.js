const { useState, useEffect } = React;

function SalesOrderDetailPage() {
    const [orderData, setOrderData] = useState(null);
    const [gsxDetails, setGsxDetails] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Parse order data from URL
        const params = new URLSearchParams(window.location.search);
        const dataParam = params.get('data');
        if (dataParam) {
            try {
                const decodedData = JSON.parse(decodeURIComponent(dataParam));
                setOrderData(decodedData);
            } catch (e) {
                setError('Failed to parse order data from URL.');
            }
        } else {
            setError('No order data provided in URL.');
        }

        // Fetch customers with GSX keys
        const fetchCustomers = async () => {
            try {
                const res = await fetch('/api/customers');
                const allCustomers = await res.json();
                const gsxCustomers = allCustomers.filter(c => c.gsx_api_key);
                setCustomers(gsxCustomers);
                if (gsxCustomers.length > 0) {
                    setSelectedCustomer(gsxCustomers[0].id);
                }
            } catch (e) {
                console.error("Failed to fetch customers", e);
            }
        };
        fetchCustomers();
    }, []);

    useEffect(() => {
        if (orderData && selectedCustomer) {
            fetchGsxDetails();
        }
    }, [orderData, selectedCustomer]);

    const fetchGsxDetails = async () => {
        const serialNumber = orderData?.['Serienr'];
        if (!serialNumber || !selectedCustomer) return;

        setLoading(true);
        setError('');
        setGsxDetails(null);

        try {
            const res = await fetch(`/api/${selectedCustomer}/gsx/device-details/${serialNumber}`);
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || `Failed to fetch GSX details: ${res.statusText}`);
            }
            const data = await res.json();
            if (data && data.device) {
                setGsxDetails(data.device);
            } else {
                throw new Error("Device not found in GSX response.");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!orderData) {
        return <div className="container"><h1>{error || 'Loading...'}</h1></div>;
    }

    const serialNumber = orderData['Serienr'];

    return (
        <div className="container">
            <header className="atea-header">
                <div className="header-content">
                    <a href="/frontend/"><img src="/frontend/images/logo.jpg" alt="Atea Logo" className="header-logo" style={{ height: '50px' }} /></a>
                    <div>
                        <h1>Orderdetails</h1>
                        <p>Ordernummer: {orderData['Ordernr']}</p>
                    </div>
                </div>
                <div className="header-links">
                    <a href="/sales-upload" className="header-link">⬅️ Tillbaka till säljuppladdning</a>
                </div>
            </header>

            <main style={{ marginTop: '2rem' }}>
                <div className="section">
                    <h3>Säljinformation</h3>
                    <div className="detail-grid">
                        {Object.entries(orderData).map(([key, value]) => (
                            <div className="detail-item" key={key}>
                                <div className="detail-label">{key}</div>
                                <div className="detail-value">{value}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="section">
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '2rem'}}>
                        <h2 style={{color: 'var(--atea-black)', margin: 0, border: 'none'}}>GSX Information</h2>
                        <div className="form-group" style={{margin: 0}}>
                            <label htmlFor="customer-select" style={{marginRight: '1rem'}}>Välj kund för GSX-uppslag:</label>
                            <select id="customer-select" value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)} disabled={customers.length === 0}>
                                {customers.length > 0 ? (
                                    customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                                ) : (
                                    <option>Inga kunder med GSX-nyckel hittades</option>
                                )}
                            </select>
                        </div>
                    </div>

                    {loading && <div className="loading"><div className="spinner"></div><p>Hämtar GSX-detaljer...</p></div>}
                    {error && <div className="alert alert-danger">{error}</div>}
                    
                    {gsxDetails ? (
                        <window.GsxDetailsView gsxDetails={gsxDetails} serial={serialNumber} />
                    ) : (
                        !loading && !error && <p>Välj en kund för att se GSX-information.</p>
                    )}
                </div>
            </main>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<SalesOrderDetailPage />);
