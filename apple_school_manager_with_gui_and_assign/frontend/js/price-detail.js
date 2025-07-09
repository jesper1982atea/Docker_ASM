const { useState, useEffect } = React;

function PriceDetailPage() {
    const [productData, setProductData] = useState(null);
    const [error, setError] = useState('');
    const [customerPrice, setCustomerPrice] = useState('');

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

    const formatNumber = (num) => {
        if (isNaN(num) || num === null) return '0.00';
        return num.toLocaleString('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const basePrice = parseFloat(String(productData['ALP Ex VAT']).replace(',', '.')) || 0;
    const customerPriceNum = parseFloat(String(customerPrice).replace(',', '.')) || 0;

    let profitSEK = 0;
    let profitMargin = 0;

    if (customerPriceNum > 0 && basePrice > 0 && customerPriceNum >= basePrice) {
        profitSEK = customerPriceNum - basePrice;
        if (customerPriceNum !== 0) {
            profitMargin = (profitSEK / customerPriceNum) * 100;
        }
    }
    
    const renderValue = (value) => {
        if (typeof value === 'boolean') {
            return value ? 'Ja' : 'Nej';
        }
        if (value === '' || value === null || value === undefined || Number.isNaN(value)) {
            return <span style={{color: 'var(--atea-grey)'}}>N/A</span>;
        }
        return String(value);
    };

    const keyDetails = {
        'Part Number': productData['Part Number'],
        'UPC/EAN': productData['UPC/EAN'],
        'Marketing Flag': productData['Marketing Flag'],
        'NPI': productData['NPI'],
        'Reprice Indicator': productData['Reprice Indicator'],
        'Copyright Levy': productData['Copyright Levy'],
        'Country of Origin': productData['COO'],
    };

    const physicalDetails = {
        'Vikt (kg)': productData['Weight(kg)'],
        'Mått (cm)': `${renderValue(productData['Length(cm)'])} x ${renderValue(productData['Width(cm)'])} x ${renderValue(productData['Height(cm)'])}`,
        'Vikt (PCE, kg)': productData['Weight(kg) - PCE'],
        'Mått (PCE, cm)': `${renderValue(productData['Length(cm) - PCE'])} x ${renderValue(productData['Width(cm) - PCE'])} x ${renderValue(productData['Height(cm) - PCE'])}`,
    };

    const packagingDetails = {
        'Multi-pack Antal': productData['Multi pack Qty'],
        'Master Pack Antal': productData['Master Pack Qty'],
        'Pall Antal': productData['Pallet Qty'],
    };

    return (
        <div className="container">
            <header className="atea-header">
                <div className="header-content">
                    <a href="/frontend/"><img src="/frontend/images/logo.jpg" alt="Atea Logo" className="header-logo" style={{ height: '50px' }} /></a>
                    <div>
                        <h1>Produktdatablad</h1>
                        <p>{productData['Part Number']} - {productData['Description']}</p>
                    </div>
                </div>
                <div className="header-links">
                    <a href="/price-upload" className="header-link">⬅️ Tillbaka till prislistan</a>
                </div>
            </header>

            <main style={{ marginTop: '2rem' }}>
                <div className="product-sheet-grid">
                    <div className="product-details-main">
                        <div className="card">
                            <h3>{productData['Description']}</h3>
                            <p>{productData['SAP Part Description']}</p>
                        </div>
                        <div className="card">
                            <h3>Nyckelinformation</h3>
                            <div className="detail-grid-condensed">
                                {Object.entries(keyDetails).map(([key, value]) => (
                                    <div className="detail-item" key={key}>
                                        <div className="detail-label">{key}</div>
                                        <div className="detail-value">{renderValue(value)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="card">
                            <h3>Fysiska Egenskaper</h3>
                             <div className="detail-grid-condensed">
                                {Object.entries(physicalDetails).map(([key, value]) => (
                                    <div className="detail-item" key={key}>
                                        <div className="detail-label">{key}</div>
                                        <div className="detail-value">{value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                         <div className="card">
                            <h3>Förpackningsinformation</h3>
                             <div className="detail-grid-condensed">
                                {Object.entries(packagingDetails).map(([key, value]) => (
                                    <div className="detail-item" key={key}>
                                        <div className="detail-label">{key}</div>
                                        <div className="detail-value">{renderValue(value)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="price-calculator-module">
                        <div className="card">
                            <h3>Priskalkylator</h3>
                            <div className="price-item">
                                <label>Inköpspris (ALP Ex. moms)</label>
                                <div className="price-value">{formatNumber(basePrice)} kr</div>
                            </div>
                            <div className="price-item">
                                <label htmlFor="customer-price">Ange kundpris (Ex. moms)</label>
                                <input
                                    type="number"
                                    id="customer-price"
                                    value={customerPrice}
                                    onChange={(e) => setCustomerPrice(e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="price-result">
                                <div className="result-item">
                                    <label>Vinst (kr)</label>
                                    <div className={`result-value ${profitSEK > 0 ? 'profit' : ''}`}>
                                        {formatNumber(profitSEK)} kr
                                    </div>
                                </div>
                                <div className="result-item">
                                    <label>Marginal (%)</label>
                                    <div className={`result-value ${profitMargin > 0 ? 'profit' : ''}`}>
                                        {formatNumber(profitMargin)} %
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<PriceDetailPage />);
