const { useState, useEffect } = React;

function PriceDetailPage() {
    const [productData, setProductData] = useState(null);
    const [error, setError] = useState('');
    
    // New state for discounts
    const [discounts, setDiscounts] = useState([]);
    const [selectedDiscount, setSelectedDiscount] = useState('');
    const [discountMap, setDiscountMap] = useState(new Map());
    const [loadingDiscounts, setLoadingDiscounts] = useState(false);

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

        // Fetch available discount programs
        const fetchDiscounts = async () => {
            try {
                const res = await fetch('/api/discounts/');
                if (!res.ok) throw new Error('Could not fetch discounts');
                const discountList = await res.json();
                setDiscounts(discountList);
            } catch (e) {
                console.error("Failed to fetch discounts", e);
            }
        };
        fetchDiscounts();
    }, []);

    // Effect to load selected discount data
    useEffect(() => {
        if (!selectedDiscount) {
            setDiscountMap(new Map());
            return;
        }
        const loadDiscountData = async () => {
            setLoadingDiscounts(true);
            try {
                const res = await fetch(`/api/discounts/${selectedDiscount}`);
                if (!res.ok) throw new Error(`Failed to load discount data for ${selectedDiscount}`);
                const discountData = await res.json();
                const newDiscountMap = new Map(discountData.map(item => [item['Product Class'], item['Rebate Rate']]));
                setDiscountMap(newDiscountMap);
            } catch (e) {
                console.error(e);
                setError(`Error loading discount: ${e.message}`);
                setDiscountMap(new Map());
            } finally {
                setLoadingDiscounts(false);
            }
        };
        loadDiscountData();
    }, [selectedDiscount]);

    if (error) {
        return <div className="container"><h1>Error</h1><p>{error}</p></div>;
    }

    if (!productData) {
        return <div className="container"><h1>Loading...</h1></div>;
    }

    const {
        'Part Number': partNumber,
        Description,
        'ALP Ex VAT': alpExVat,
        Category,
    } = productData;

    const rebateRate = discountMap.get(Category) || 0;
    const discountedPrice = parseFloat(alpExVat) * (1 - rebateRate);

    return (
        <div className="container">
            <header className="atea-header">
                <div className="header-content">
                    <a href="/frontend/"><img src="/frontend/images/logo.jpg" alt="Atea Logo" className="header-logo" style={{ height: '50px' }} /></a>
                    <div>
                        <h1>{Description || 'Product Details'}</h1>
                        <p>Part Number: {partNumber}</p>
                    </div>
                </div>
                <div className="header-links">
                    <a href="/price-upload" className="header-link">⬅️ Tillbaka till prislistan</a>
                </div>
            </header>

            <main style={{ marginTop: '2rem' }}>
                <window.ProductDetailView productData={productData} />

                <div className="card" style={{ padding: '2rem', marginTop: '2rem' }}>
                     <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
                        <h3 style={{ margin: 0 }}>Pris & Rabatt</h3>
                        <div className="form-group" style={{margin: 0}}>
                            <label htmlFor="discount-select" style={{marginRight: '1rem'}}>Rabattprogram:</label>
                            <select id="discount-select" value={selectedDiscount} onChange={e => setSelectedDiscount(e.target.value)} disabled={discounts.length === 0}>
                                <option value="">Ingen rabatt</option>
                                {discounts.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    {loadingDiscounts ? (
                         <div className="loading"><div className="spinner-small"></div><p>Laddar rabatt...</p></div>
                    ) : (
                        <div className="detail-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                            <div className="detail-item price-box">
                                <span className="detail-label">Listpris (ALP Ex VAT)</span>
                                <span className="detail-value">{parseFloat(alpExVat).toFixed(2)} SEK</span>
                            </div>
                            <div className="detail-item price-box">
                                <span className="detail-label">Rabatt ({selectedDiscount || 'N/A'})</span>
                                <span className="detail-value" style={{color: 'var(--atea-red)'}}>-{(rebateRate * 100).toFixed(2)}%</span>
                            </div>
                            <div className="detail-item price-box final-price">
                                <span className="detail-label">Pris efter rabatt</span>
                                <span className="detail-value">{discountedPrice.toFixed(2)} SEK</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- New Price Calculator --- */}
                <div className="card" style={{ padding: '2rem', marginTop: '2rem' }}>
                    <h3 style={{ margin: 0, marginBottom: '1.5rem' }}>Priskalkylator för affärsmodeller</h3>
                    <window.PriceCalculator listPrice={alpExVat} discountRate={rebateRate} />
                </div>
            </main>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<PriceDetailPage />);
         
