const { useState, useEffect } = React;

function PriceDetailPage() {
    const [productData, setProductData] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const dataParam = params.get('data');
        if (dataParam) {
            try {
                const decodedData = JSON.parse(decodeURIComponent(dataParam));
                setProductData(decodedData);
            } catch (e) {
                setError('Failed to parse product data from URL.');
            }
        } else {
            setError('No product data provided in URL.');
        }
    }, []);

    if (error) {
        return <div className="container"><h1>{error}</h1></div>;
    }

    if (!productData) {
        return <div className="container"><h1>Loading...</h1></div>;
    }

    const renderValue = (value) => {
        if (typeof value === 'boolean') {
            return value ? 'Yes' : 'No';
        }
        if (value === '' || value === null || value === undefined) {
            return <span style={{color: 'var(--atea-grey)'}}>N/A</span>;
        }
        return String(value);
    };

    return (
        <div className="container">
            <header className="atea-header">
                <div className="header-content">
                    <a href="/frontend/"><img src="/frontend/images/logo.jpg" alt="Atea Logo" className="header-logo" style={{ height: '50px' }} /></a>
                    <div>
                        <h1>Produktdetaljer</h1>
                        <p>{productData['Part Number']} - {productData['Description']}</p>
                    </div>
                </div>
                <div className="header-links">
                    <a href="/price-upload" className="header-link">⬅️ Tillbaka till prislistan</a>
                </div>
            </header>

            <main style={{ marginTop: '2rem' }}>
                <div className="card" style={{ padding: '2rem', background: 'var(--atea-white)' }}>
                    <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                        Allmän Information
                    </h3>
                    <div className="detail-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {Object.entries(productData).map(([key, value]) => (
                            <div className="detail-item" key={key} style={{background: 'var(--atea-light-grey)', border: 'none'}}>
                                <div className="detail-label">{key}</div>
                                <div className="detail-value">{renderValue(value)}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<PriceDetailPage />);
