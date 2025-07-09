const { useState, useEffect, useMemo } = React;

function PriceAnalysisBlock({ priceInfo, discountMap, discountLoading }) {
    const { cost, sales, actualCost, category } = priceInfo;

    const rebateRate = discountMap.get(category) || 0;
    const discountedAlp = cost * (1 - rebateRate);
    const diff = actualCost - discountedAlp;
    const diffPercent = cost !== 0 ? (diff / cost) * 100 : 0;

    const marginActual = sales - actualCost;
    const marginPercentActual = sales !== 0 ? (marginActual / sales) * 100 : 0;

    return (
        <div>
            <div className="detail-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <div className="detail-item price-box">
                    <span className="detail-label">Försäljningspris (Kund)</span>
                    <span className="detail-value">{sales.toFixed(2)} SEK</span>
                </div>
                <div className="detail-item price-box">
                    <span className="detail-label">Faktiskt inköpspris</span>
                    <span className="detail-value">{actualCost.toFixed(2)} SEK</span>
                </div>
                <div className="detail-item price-box final-price">
                    <span className="detail-label">Faktisk marginal</span>
                    <span className="detail-value" style={{ color: marginActual < 0 ? 'var(--atea-red)' : 'var(--atea-green)' }}>
                        {marginActual.toFixed(2)} SEK ({marginPercentActual.toFixed(2)}%)
                    </span>
                </div>
            </div>
            <div style={{borderTop: '1px solid var(--border-color)', marginTop: '1.5rem', paddingTop: '1.5rem'}}>
                <h4 style={{marginTop: 0}}>Rabattanalys vs. Prislista</h4>
                {discountLoading ? (
                    <div className="loading"><div className="spinner-small"></div><p>Laddar rabatt...</p></div>
                ) : (
                    <div className="detail-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                        <div className="detail-item price-box">
                            <span className="detail-label">Listpris (ALP Ex VAT)</span>
                            <span className="detail-value">{cost.toFixed(2)} SEK</span>
                        </div>
                        <div className="detail-item price-box">
                            <span className="detail-label">Rabatt ({(rebateRate * 100).toFixed(1)}%)</span>
                            <span className="detail-value" style={{color: 'var(--atea-red)'}}>-{(cost * rebateRate).toFixed(2)} SEK</span>
                        </div>
                        <div className="detail-item price-box">
                            <span className="detail-label">Beräknat inköpspris</span>
                            <span className="detail-value">{discountedAlp.toFixed(2)} SEK</span>
                        </div>
                        <div className="detail-item price-box" style={{ background: Math.abs(diffPercent) > 1 ? 'var(--atea-light-yellow)' : 'var(--atea-light-green)'}}>
                            <span className="detail-label">Diff vs. faktiskt inköp</span>
                            <span className="detail-value" style={{ color: diff !== 0 ? 'var(--atea-orange)' : 'inherit' }}>
                                {diff.toFixed(2)} SEK ({diffPercent.toFixed(2)}%)
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function SalesOrderDetailPage() {
    const [orderData, setOrderData] = useState(null);
    const [gsxDetails, setGsxDetails] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // New state for price lookup
    const [priceLists, setPriceLists] = useState([]);
    const [selectedPriceList, setSelectedPriceList] = useState('');
    const [priceInfo, setPriceInfo] = useState(null);
    const [priceLoading, setPriceLoading] = useState(false);

    // New state for discount programs
    const [discounts, setDiscounts] = useState([]);
    const [selectedDiscount, setSelectedDiscount] = useState('');
    const [discountMap, setDiscountMap] = useState(new Map());
    const [discountLoading, setDiscountLoading] = useState(false);

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
        
        // Fetch available price lists
        const fetchPriceLists = async () => {
            try {
                const res = await fetch('/api/price/list');
                if (!res.ok) return;
                const files = await res.json();
                setPriceLists(files);
                if (files.length > 0) {
                    setSelectedPriceList(files[0]); // Default to the latest
                }
            } catch (e) {
                console.error("Failed to fetch price lists", e);
            }
        };

        // Fetch available discount programs
        const fetchDiscounts = async () => {
            try {
                const res = await fetch('/api/discounts/');
                if (!res.ok) return;
                const files = await res.json();
                setDiscounts(files);
            } catch (e) {
                console.error("Failed to fetch discounts", e);
            }
        };

        fetchCustomers();
        fetchPriceLists();
        fetchDiscounts();
    }, []);

    useEffect(() => {
        if (orderData && selectedCustomer) {
            fetchGsxDetails();
        }
    }, [orderData, selectedCustomer]);

    // Effect to find price when price list or order data changes
    useEffect(() => {
        if (!selectedPriceList || !orderData) {
            setPriceInfo(null);
            return;
        }

        const findPrice = async () => {
            setPriceLoading(true);
            setPriceInfo(null);
            try {
                const res = await fetch(`/api/price/data/${selectedPriceList}`);
                if (!res.ok) throw new Error('Failed to load price data');
                const priceData = await res.json();
                
                const partNumber = orderData['Artikelnr (tillverkare)'];
                const productPriceInfo = priceData.find(item => item['Part Number'] === partNumber);

                if (productPriceInfo) {
                    const costPrice = parseFloat(productPriceInfo['ALP Ex VAT']);
                    const salesPrice = parseFloat(orderData['Tot Förs (SEK)']);
                    const actualCost = parseFloat(orderData['Tot Kost (SEK)']);

                    if (!isNaN(costPrice) && !isNaN(salesPrice) && !isNaN(actualCost)) {
                        setPriceInfo({
                            cost: costPrice,
                            sales: salesPrice,
                            actualCost: actualCost,
                            category: productPriceInfo.Category,
                        });
                    } else {
                        // If any value is not a number, we treat it as not found to avoid partial data issues.
                        setPriceInfo(null); 
                    }
                } else {
                    setPriceInfo(null); // Not found
                }
            } catch (e) {
                console.error("Error fetching or processing price data", e);
                setPriceInfo({ error: 'Could not process price data.' });
            } finally {
                setPriceLoading(false);
            }
        };

        findPrice();
    }, [selectedPriceList, orderData]);

    // Effect to load discount data
    useEffect(() => {
        if (!selectedDiscount) {
            setDiscountMap(new Map());
            return;
        }
        const loadDiscountData = async () => {
            setDiscountLoading(true);
            try {
                const res = await fetch(`/api/discounts/${selectedDiscount}`);
                if (!res.ok) throw new Error('Failed to load discount data');
                const discountData = await res.json();
                const newDiscountMap = new Map(discountData.map(item => [item['Product Class'], item['Rebate Rate']]));
                setDiscountMap(newDiscountMap);
            } catch (e) {
                console.error("Error loading discount data", e);
            } finally {
                setDiscountLoading(false);
            }
        };
        loadDiscountData();
    }, [selectedDiscount]);

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

    const handleExportExcel = () => {
        if (!orderData || !gsxDetails) {
            alert("Vänta tills all data har laddats innan du exporterar.");
            return;
        }

        const data = [];

        // Sales Information
        data.push({ Kategori: 'Säljinformation', Egenskap: 'Kund', Värde: orderData['Kund'] });
        data.push({ Kategori: 'Säljinformation', Egenskap: 'Ordernummer', Värde: orderData['Ordernr'] });
        data.push({ Kategori: 'Säljinformation', Egenskap: 'Bokföringsdatum', Värde: orderData['Bokf datum'] });
        data.push({ Kategori: 'Säljinformation', Egenskap: 'Artikelbenämning', Värde: orderData['Artikelbenämning (APA)'] });
        data.push({ Kategori: 'Säljinformation', Egenskap: 'Serienummer', Värde: orderData['Serienr'] });
        data.push({ Kategori: 'Säljinformation', Egenskap: 'Försäljningspris (SEK)', Värde: orderData['Tot Förs (SEK)'] });

        // Spacer
        data.push({});

        // GSX General Information
        data.push({ Kategori: 'GSX - Allmän Information', Egenskap: 'Produktbeskrivning', Värde: gsxDetails.productDescription });
        data.push({ Kategori: 'GSX - Allmän Information', Egenskap: 'Konfiguration', Värde: gsxDetails.configDescription });
        data.push({ Kategori: 'GSX - Allmän Information', Egenskap: 'Såld till', Värde: gsxDetails.soldToName });
        data.push({ Kategori: 'GSX - Allmän Information', Egenskap: 'Inköpsland', Värde: `${gsxDetails.warrantyInfo?.purchaseCountryDesc} (${gsxDetails.warrantyInfo?.purchaseCountryCode})` });

        // Spacer
        data.push({});

        // GSX Warranty Details
        data.push({ Kategori: 'GSX - Garanti', Egenskap: 'Status', Värde: gsxDetails.warrantyInfo?.warrantyStatusDescription });
        data.push({ Kategori: 'GSX - Garanti', Egenskap: 'Inköpsdatum', Värde: new Date(gsxDetails.warrantyInfo?.purchaseDate).toLocaleDateString() });
        data.push({ Kategori: 'GSX - Garanti', Egenskap: 'Registreringsdatum', Värde: new Date(gsxDetails.warrantyInfo?.registrationDate).toLocaleDateString() });
        data.push({ Kategori: 'GSX - Garanti', Egenskap: 'Dagar kvar', Värde: gsxDetails.warrantyInfo?.daysRemaining });

        // Spacer
        data.push({});

        // GSX Activation Details
        if (gsxDetails.activationDetails) {
            data.push({ Kategori: 'GSX - Aktivering', Egenskap: 'Första aktivering', Värde: gsxDetails.activationDetails.firstActivationDate ? new Date(gsxDetails.activationDetails.firstActivationDate).toLocaleString() : 'N/A' });
            data.push({ Kategori: 'GSX - Aktivering', Egenskap: 'Upplåst', Värde: gsxDetails.activationDetails.unlocked ? 'Ja' : 'Nej' });
            data.push({ Kategori: 'GSX - Aktivering', Egenskap: 'Operatör', Värde: gsxDetails.activationDetails.carrierName || 'N/A' });
        }

        // Spacer
        data.push({});

        // GSX Identifiers
        if (gsxDetails.identifiers) {
            data.push({ Kategori: 'GSX - Identifierare', Egenskap: 'Serienummer', Värde: gsxDetails.identifiers.serial || orderData['Serienr'] });
            data.push({ Kategori: 'GSX - Identifierare', Egenskap: 'IMEI', Värde: gsxDetails.identifiers.imei || 'N/A' });
            data.push({ Kategori: 'GSX - Identifierare', Egenskap: 'IMEI 2', Värde: gsxDetails.identifiers.imei2 || 'N/A' });
        }

        // Spacer
        data.push({});

        // GSX Repair Cases
        if (gsxDetails.caseDetails && gsxDetails.caseDetails.length > 0) {
            gsxDetails.caseDetails.forEach((c, i) => {
                data.push({ Kategori: 'GSX - Serviceärenden', Egenskap: `Ärende ${i + 1} ID`, Värde: c.caseId });
                data.push({ Kategori: 'GSX - Serviceärenden', Egenskap: `Ärende ${i + 1} Skapat`, Värde: new Date(c.createdDateTime).toLocaleString() });
                data.push({ Kategori: 'GSX - Serviceärenden', Egenskap: `Ärende ${i + 1} Sammanfattning`, Värde: c.summary });
            });
        }

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Enhetsdetaljer");

        // Set column widths for better readability
        worksheet["!cols"] = [{ wch: 25 }, { wch: 30 }, { wch: 40 }];

        XLSX.writeFile(workbook, `Enhetsrapport_${orderData['Serienr']}.xlsx`);
    };

    if (!orderData) {
        return <div className="container"><h1>{error || 'Loading...'}</h1></div>;
    }

    const serialNumber = orderData['Serienr'];

    const productDetailData = useMemo(() => {
        if (!priceInfo || !orderData) return null;
        return {
            'Part Number': orderData['Artikelnr (tillverkare)'],
            'Description': orderData['Artikelbenämning (APA)'],
            'Category': priceInfo.category,
            // Add other fields if they become available in orderData or priceInfo
        };
    }, [orderData, priceInfo]);

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
                    <button onClick={handleExportExcel} className="header-link" disabled={!gsxDetails}>Exportera till Excel</button>
                </div>
            </header>

            <main style={{ marginTop: '2rem' }}>
                <div className="card" style={{ padding: '2rem', background: 'var(--atea-white)' }}>
                    <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>Säljinformation</h3>
                    
                    {/* Customer & Order Info */}
                    <div className="detail-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'flex-start' }}>
                        <div className="detail-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                            <span className="detail-label">Kund</span>
                            <span className="detail-value" style={{ fontSize: '1.1rem', fontWeight: '600' }}>{orderData['Kund']}</span>
                        </div>
                        <div className="detail-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                            <span className="detail-label">Ordernummer</span>
                            <span className="detail-value">{orderData['Ordernr']}</span>
                        </div>
                        <div className="detail-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                            <span className="detail-label">Bokföringsdatum</span>
                            <span className="detail-value">{orderData['Bokf datum']}</span>
                        </div>
                        <div className="detail-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                            <span className="detail-label">Verifikationsnummer</span>
                            <span className="detail-value">{orderData['Ver nr']}</span>
                        </div>
                    </div>

                    {/* Product Info - Now using a component if priceInfo is available */}
                    <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '1.5rem', paddingTop: '1.5rem' }}>
                         {priceInfo && productDetailData ? (
                            <window.ProductDetailView productData={productDetailData} />
                         ) : (
                            <div>
                                <h4 style={{ marginTop: 0, marginBottom: '1rem' }}>Produktspecifikation</h4>
                                <div className="detail-grid" style={{ gridTemplateColumns: '1fr', gap: '1rem' }}>
                                    <div className="detail-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                        <span className="detail-label">Artikelbenämning</span>
                                        <span className="detail-value">{orderData['Artikelbenämning (APA)']}</span>
                                    </div>
                                    <div className="detail-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                        <span className="detail-label">Serienummer</span>
                                        <span className="detail-value" style={{ fontWeight: '600' }}>{orderData['Serienr']}</span>
                                    </div>
                                    <div className="detail-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                        <span className="detail-label">Tillverkarens artikelnr.</span>
                                        <span className="detail-value">{orderData['Artikelnr (tillverkare)']}</span>
                                    </div>
                                </div>
                            </div>
                         )}
                    </div>

                    {/* Financial Info */}
                    <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '1.5rem', paddingTop: '1.5rem' }}>
                        <h4 style={{ marginTop: 0, marginBottom: '1rem' }}>Ekonomi</h4>
                        <div className="detail-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                            <div className="detail-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                <span className="detail-label">Antal</span>
                                <span className="detail-value">{orderData['Antal']}</span>
                            </div>
                            <div className="detail-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                <span className="detail-label">Försäljningspris (SEK)</span>
                                <span className="detail-value">{orderData['Tot Förs (SEK)']}</span>
                            </div>
                            <div className="detail-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                <span className="detail-label">Kostnadspris (SEK)</span>
                                <span className="detail-value">{orderData['Tot Kost (SEK)']}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- Price & Margin Information --- */}
                <div className="card" style={{ padding: '2rem', background: 'var(--atea-white)', marginTop: '2rem' }}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
                        <h3 style={{ margin: 0 }}>Pris, Marginal & Rabattanalys</h3>
                        <div style={{display: 'flex', gap: '1rem'}}>
                            <div className="form-group" style={{margin: 0}}>
                                <label htmlFor="price-list-select" style={{marginRight: '1rem'}}>Prislista:</label>
                                <select id="price-list-select" value={selectedPriceList} onChange={e => setSelectedPriceList(e.target.value)} disabled={priceLists.length === 0}>
                                    {priceLists.length > 0 ? (
                                        priceLists.map(f => <option key={f} value={f}>{f}</option>)
                                    ) : (
                                        <option>Inga prislistor</option>
                                    )}
                                </select>
                            </div>
                             <div className="form-group" style={{margin: 0}}>
                                <label htmlFor="discount-select" style={{marginRight: '1rem'}}>Rabattprogram:</label>
                                <select id="discount-select" value={selectedDiscount} onChange={e => setSelectedDiscount(e.target.value)} disabled={discounts.length === 0}>
                                    <option value="">Inget</option>
                                    {discounts.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    {priceLoading ? (
                        <div className="loading"><div className="spinner-small"></div><p>Hämtar pris...</p></div>
                    ) : priceInfo ? (
                        <PriceAnalysisBlock priceInfo={priceInfo} discountMap={discountMap} discountLoading={discountLoading} />
                    ) : (
                        <p>Inget pris hittades för artikelnummer <strong>{orderData['Artikelnr (tillverkare)']}</strong> i den valda prislistan.</p>
                    )}
                </div>

                {/* --- Price Calculator for business models --- */}
                {priceInfo && (
                    <div className="card" style={{ padding: '2rem', background: 'var(--atea-white)', marginTop: '2rem' }}>
                        <h3 style={{ margin: 0, marginBottom: '1.5rem' }}>Kalkylator för alternativa affärsmodeller</h3>
                        <p style={{marginTop: '-1rem', marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)'}}>
                            Använd kalkylatorn för att jämföra med den faktiska affären och se hur priset påverkas av restvärde och leasing.
                        </p>
                        <window.PriceCalculator 
                            listPrice={priceInfo.cost} 
                            discountRate={discountMap.get(priceInfo.category) || 0}
                            originalDeal={{
                                sales: priceInfo.sales,
                                margin: priceInfo.sales - priceInfo.actualCost
                                // marginPercent is now calculated inside the calculator based on its own logic
                            }}
                        />
                    </div>
                )}


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
