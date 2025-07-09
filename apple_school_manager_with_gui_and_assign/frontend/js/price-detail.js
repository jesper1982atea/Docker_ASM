const { useState, useEffect } = React;

function PriceDetailPage() {
    const [productData, setProductData] = useState(null);
    const [error, setError] = useState('');
    const [customerPrice, setCustomerPrice] = useState('');
    const [marginPercent, setMarginPercent] = useState('');
    const [discounts, setDiscounts] = useState([]);
    const [selectedDiscount, setSelectedDiscount] = useState('');
    const [discountData, setDiscountData] = useState(null);

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
                const res = await fetch('/api/discounts');
                if (res.ok) {
                    const data = await res.json();
                    setDiscounts(data);
                }
            } catch (err) {
                console.error("Failed to fetch discounts", err);
            }
        };
        fetchDiscounts();
    }, []);

    useEffect(() => {
        if (!selectedDiscount) {
            setDiscountData(null);
            return;
        }
        const fetchDiscountData = async () => {
            try {
                const res = await fetch(`/api/discounts/${selectedDiscount}`);
                if (res.ok) {
                    const data = await res.json();
                    setDiscountData(data);
                } else {
                    const errData = await res.json();
                    setError(`Error loading discount: ${errData.error}`);
                    setDiscountData(null);
                }
            } catch (err) {
                console.error("Failed to fetch discount data", err);
                setError("Failed to fetch discount data.");
                setDiscountData(null);
            }
        };
        fetchDiscountData();
    }, [selectedDiscount]);

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
    const productCategory = productData['Category'];
    
    // New discount logic: Match productData.Category with discountData[ProductClass]
    const appliedDiscountRate = (discountData && productCategory && discountData[productCategory]) ? discountData[productCategory] : 0;
    const discountedBasePrice = basePrice * (1 - appliedDiscountRate);
    const appliedDiscountPercent = appliedDiscountRate * 100;

    const handleCustomerPriceChange = (e) => {
        const newPriceStr = e.target.value;
        setCustomerPrice(newPriceStr);

        const newPriceNum = parseFloat(String(newPriceStr).replace(',', '.')) || 0;
        if (newPriceNum > 0 && discountedBasePrice > 0 && newPriceNum >= discountedBasePrice) {
            const profit = newPriceNum - discountedBasePrice;
            const newMargin = (profit / newPriceNum) * 100;
            setMarginPercent(newMargin.toFixed(2));
        } else {
            setMarginPercent('');
        }
    };

    const handleMarginChange = (e) => {
        const newMarginStr = e.target.value;
        setMarginPercent(newMarginStr);

        const newMarginNum = parseFloat(newMarginStr) || 0;
        if (newMarginNum > 0 && newMarginNum < 100 && discountedBasePrice > 0) {
            const newPrice = discountedBasePrice / (1 - (newMarginNum / 100));
            setCustomerPrice(newPrice.toFixed(2));
        } else if (newMarginNum === 0) {
            setCustomerPrice(discountedBasePrice.toFixed(2));
        } else {
            setCustomerPrice('');
        }
    };

    const customerPriceNum = parseFloat(String(customerPrice).replace(',', '.')) || 0;
    const profitSEK = (customerPriceNum > 0 && discountedBasePrice > 0 && customerPriceNum >= discountedBasePrice) ? customerPriceNum - discountedBasePrice : 0;
    const displayMargin = (customerPriceNum > 0 && discountedBasePrice > 0 && customerPriceNum >= discountedBasePrice) ? (profitSEK / customerPriceNum) * 100 : 0;

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
                                <label>Välj rabattprogram</label>
                                <select value={selectedDiscount} onChange={e => setSelectedDiscount(e.target.value)}>
                                    <option value="">Inget rabattprogram</option>
                                    {discounts.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div className="price-item">
                                <label>Inköpspris (ALP Ex. moms)</label>
                                <div className="price-value" style={{ textDecoration: appliedDiscountRate > 0 ? 'line-through' : 'none' }}>
                                    {formatNumber(basePrice)} kr
                                </div>
                            </div>
                            {appliedDiscountRate > 0 && (
                                <div className="price-item" style={{color: 'var(--atea-green)'}}>
                                    <label>Rabatterat inköpspris ({appliedDiscountPercent.toFixed(2)}% rabatt på kategori '{productCategory}')</label>
                                    <div className="price-value" style={{fontWeight: 'bold'}}>{formatNumber(discountedBasePrice)} kr</div>
                                </div>
                            )}
                            
                            <div className="price-item">
                                <label htmlFor="customer-price">Ange kundpris (Ex. moms)</label>
                                <input
                                    type="number"
                                    id="customer-price"
                                    value={customerPrice}
                                    onChange={handleCustomerPriceChange}
                                    placeholder="0.00"
                                    step="0.01"
                                />
                            </div>

                            <div className="price-item">
                                <label htmlFor="margin-percent">Ange marginal (%)</label>
                                <input
                                    type="number"
                                    id="margin-percent"
                                    value={marginPercent}
                                    onChange={handleMarginChange}
                                    placeholder="0.00"
                                    step="0.01"
                                    max="99.99"
                                />
                                <input
                                    type="range"
                                    min="0"
                                    max="50"
                                    step="0.5"
                                    value={marginPercent || 0}
                                    onChange={handleMarginChange}
                                    style={{marginTop: '0.5rem'}}
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
                                    <div className={`result-value ${displayMargin > 0 ? 'profit' : ''}`}>
                                        {formatNumber(displayMargin)} %
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
