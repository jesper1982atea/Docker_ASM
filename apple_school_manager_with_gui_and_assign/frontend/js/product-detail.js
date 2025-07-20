const { useState, useEffect } = React;

function ProductDetailPage() {
    const [product, setProduct] = useState(null);
    // Hämta senaste prislista automatiskt
    const [priceListFile, setPriceListFile] = useState('');
    const [priceLists, setPriceLists] = useState([]);
    // Rabattprogram för prisanalys
    const [selectedDiscount, setSelectedDiscount] = useState('');
    const [discountPrograms, setDiscountPrograms] = useState([]);

    // Prisanalys-resultat (egen JSON-hämtning och vy)
    const [priceResult, setPriceResult] = useState(null);
    const [priceLoading, setPriceLoading] = useState(false);
    const [priceError, setPriceError] = useState('');

    // --- State för avancerad prisberäkning ---
    const [advMargin, setAdvMargin] = useState(10);
    const [advResidual, setAdvResidual] = useState(10);
    const [advLeaseMonths, setAdvLeaseMonths] = useState(36);
    const [advType, setAdvType] = useState('leasing');
    const [advCircular, setAdvCircular] = useState(false);
    const [advResult, setAdvResult] = useState(null);
    const [advLoading, setAdvLoading] = useState(false);
    const [advError, setAdvError] = useState('');

    // --- Ny state för enkel kalkyl ---
    const [simpleMargin, setSimpleMargin] = useState(8);      // Standard 8%
    const [simpleResidual, setSimpleResidual] = useState(15); // Standard 15%
    const [simpleResult, setSimpleResult] = useState(null);
    const [simpleLoading, setSimpleLoading] = useState(false);
    const [simpleError, setSimpleError] = useState('');

    // --- Ny state för separata marginaler ---
    const [kontantMargin, setKontantMargin] = useState(8);
    const [leasingMargin, setLeasingMargin] = useState(8);
    const [cirkularMargin, setCirkularMargin] = useState(8);

    useEffect(() => {
        fetch('/api/price/list')
            .then(res => res.json())
            .then(data => {
                setPriceLists(data);
                if (data.length > 0) setPriceListFile(data[0]);
            });
    }, []);

    useEffect(() => {
        fetch('/api/discounts/')
            .then(res => res.json())
            .then(data => setDiscountPrograms(data));
    }, []);

    useEffect(() => {
        const productData = sessionStorage.getItem('selectedProduct');
        if (productData) {
            setProduct(JSON.parse(productData));
        }
    }, []);

    // Hämta pris och rabatt enligt nya metoden (samma som price-test.js)
    useEffect(() => {
        if (!priceListFile || !partNumber) return;
        setPriceLoading(true);
        setPriceError('');
        setPriceResult(null);

        // Bygg query-parametrar
        const params = new URLSearchParams();
        if (selectedDiscount) params.append('program_name', selectedDiscount);
        params.append('part_number', partNumber);
        params.append('price_list', priceListFile);

        const url = `/api/discounts/lookup?${params.toString()}`;
        fetch(url)
            .then(res => res.json().then(data => ({ ok: res.ok, data })))
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.error || 'Ett okänt fel uppstod.');
                setPriceResult(data);
            })
            .catch(err => setPriceError(err.message))
            .finally(() => setPriceLoading(false));
    }, [priceListFile, partNumber, selectedDiscount]);

    // --- Funktion för att räkna ut kundpris via nya endpointen ---
    const handleAdvancedCalc = async () => {
        setAdvLoading(true);
        setAdvError('');
        setAdvResult(null);
        try {
            // Anpassa till nya JSON-strukturen från /api/discounts/lookup
            // ALP = list_price, apris = new_price
            let alp = priceResult?.list_price ?? product['ALP Ex VAT'] ?? product['List Price'] ?? 0;
            let apris = priceResult?.new_price ?? alp;
            // Säkerställ att dessa är numeriska (float)
            alp = typeof alp === 'string' ? parseFloat(alp.replace(/[^0-9.,-]/g, '').replace(',', '.')) : Number(alp) || 0;
            apris = typeof apris === 'string' ? parseFloat(apris.replace(/[^0-9.,-]/g, '').replace(',', '.')) : Number(apris) || 0;
            const body = {
                alp_price: alp,
                apris: apris,
                margin: Number(advMargin),
                residual_value: Number(advResidual),
                lease_months: Number(advLeaseMonths),
                business_type: advType,
                circular_choice: advCircular
            };
            const res = await fetch('/api/price/calculate-advanced', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Fel vid beräkning.');
            setAdvResult(data);
        } catch (e) {
            setAdvError(e.message);
        } finally {
            setAdvLoading(false);
        }
    };

    // --- Enkel kalkylfunktion ---
    const handleSimpleCalc = async () => {
        setSimpleLoading(true);
        setSimpleError('');
        setSimpleResult(null);
        try {
            let inkopspris = priceResult?.new_price ?? product['Inköpspris'] ?? product['Purchase Price'] ?? product['ALP Ex VAT'] ?? product['List Price'] ?? 0;
            let alp_price = priceResult?.list_price ?? product['ALP Ex VAT'] ?? product['List Price'] ?? 0;
            let restvarde = Number(simpleResidual);

            inkopspris = typeof inkopspris === 'string' ? parseFloat(inkopspris.replace(/[^0-9.,-]/g, '').replace(',', '.')) : Number(inkopspris) || 0;
            alp_price = typeof alp_price === 'string' ? parseFloat(alp_price.replace(/[^0-9.,-]/g, '').replace(',', '.')) : Number(alp_price) || 0;

            const params = new URLSearchParams({
                inkopspris: inkopspris,
                restvarde: restvarde,
                alp_price: alp_price,
                kontant_marginal_procent: kontantMargin,
                leasing_marginal_procent: leasingMargin,
                cirkular_marginal_procent: cirkularMargin
            }).toString();

            const res = await fetch(`/api/price/calculate?${params}`, {
                method: 'POST',
                headers: { 'Accept': 'application/json' }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Fel vid beräkning.');
            setSimpleResult(data);
        } catch (e) {
            setSimpleError(e.message);
        } finally {
            setSimpleLoading(false);
        }
    };

    // Kör automatiskt kalkylen när rabatterat pris eller parametrar ändras
    useEffect(() => {
        if (!product || !priceResult) return;
        handleAdvancedCalc();
        // eslint-disable-next-line
    }, [priceResult?.final_price, advMargin, advResidual, advLeaseMonths, advType, advCircular]);

    if (!product) {
        return (
            <div className="container">
                <p>Ingen produkt vald. Gå tillbaka till <a href="/frontend/price-upload.html">prislistan</a> och välj en produkt.</p>
            </div>
        );
    }

    const formatKey = (key) => {
        return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
    };

    // Försök hitta bild-url i produktdata (t.ex. 'Image', 'image_url', 'Picture')
    const imageUrl = product.Image || product.image_url || product.Picture || null;
    const productName = product['Description'] || product['Product Name'] || product['Name'] || product['Part Number'] || 'Produkt';
    const productDesc = product['Long Description'] || product['Description'] || '';
    const productForCalculator = { ...product, 'List Price': product['ALP Ex VAT'] };

    // Hämta part number från produktdata
    const partNumber = product['Part Number'] || product['PartNumber'] || product['Artikelnummer'];


    return (
        <div className="container">
            <header className="atea-header">
                <div className="header-content">
                    <a href="/frontend/">
                        <img src="/frontend/images/logo.jpg" alt="Atea Logo" className="header-logo" style={{ height: '50px' }} />
                    </a>
                    <div>
                        <h1 style={{ marginBottom: 0 }}>{productName}</h1>
                        <p style={{ marginTop: 0 }}>{productDesc}</p>
                    </div>
                </div>
                <div className="header-links">
                    <a href="/frontend/price-upload.html" className="header-link">⬅️ Tillbaka till Prislistan</a>
                </div>
            </header>

            {/* Prisanalys direkt under headern */}
            {priceListFile && partNumber && (
                <div className="card section" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label htmlFor="discount-select" style={{ fontWeight: 600, marginRight: 8 }}>Rabattprogram:</label>
                        <select id="discount-select" value={selectedDiscount} onChange={e => setSelectedDiscount(e.target.value)}>
                            <option value="">Inget rabattprogram</option>
                            {discountPrograms.map(prog => (
                                <option key={prog} value={prog}>{prog}</option>
                            ))}
                        </select>
                    </div>
                    {priceLoading && <div style={{color:'#888'}}>Laddar pris...</div>}
                    {priceError && <div className="alert alert-danger">{priceError}</div>}
                    {priceResult && (
                        <div className="price-result-grid">
                            <div style={{fontSize:'1.5rem', fontWeight:700, color:'var(--atea-green)'}}>Ditt pris: {priceResult.new_price?.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })}</div>
                            <div style={{marginTop:'0.5rem', color:'#666'}}>Listpris: {priceResult.list_price?.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })}</div>
                            <div style={{marginTop:'0.5rem'}}>Rabatter:
                                <ul style={{margin:0, paddingLeft:'1.2em'}}>
                                    {Array.isArray(priceResult.discounts) && priceResult.discounts.length > 0 ? priceResult.discounts.map((d, i) => (
                                        <li key={i}>{d.source}: {((parseFloat(d.value)||0)*100).toFixed(2)}%</li>
                                    )) : <li>Inga rabatter</li>}
                                </ul>
                            </div>
                            <div>Total rabatt: <b>{((priceResult.total_discount||0)*100).toFixed(2)}%</b></div>
                            <div>Rabattbelopp: <b>{priceResult.discount_amount?.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })}</b></div>
                            <div>Rabattkälla: <b>{priceResult.discount_source || '-'}</b></div>
                        </div>
                    )}
                    

                    {/* --- Enkel leasingkalkylator --- */}
                    <div className="price-calculator-module card section" style={{marginTop:'2rem'}}>
                        <h3 style={{marginBottom:'1.5rem'}}>Enkel leasingkalkylator</h3>
                        <div className="detail-grid-condensed" style={{marginBottom:'1.5rem', display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'1.5rem'}}>
                            <div className="detail-item">
                                <label className="detail-label">Marginal kontant: <b>{kontantMargin}%</b></label>
                                <input type="range" min="0" max="50" step="1" value={kontantMargin} onChange={e=>setKontantMargin(Number(e.target.value))} />
                            </div>
                            <div className="detail-item">
                                <label className="detail-label">Marginal leasing: <b>{leasingMargin}%</b></label>
                                <input type="range" min="0" max="50" step="1" value={leasingMargin} onChange={e=>setLeasingMargin(Number(e.target.value))} />
                            </div>
                            <div className="detail-item">
                                <label className="detail-label">Marginal cirkulärt: <b>{cirkularMargin}%</b></label>
                                <input type="range" min="0" max="50" step="1" value={cirkularMargin} onChange={e=>setCirkularMargin(Number(e.target.value))} />
                            </div>
                            <div className="detail-item">
                                <label className="detail-label">Restvärde: <b>{simpleResidual}%</b></label>
                                <input type="range" min="0" max="50" step="1" value={simpleResidual} onChange={e=>setSimpleResidual(Number(e.target.value))} />
                            </div>
                        </div>
                        <button className="btn btn-primary" style={{marginTop:'1rem', minWidth:180}} onClick={handleSimpleCalc} disabled={simpleLoading}>
                            {simpleLoading ? 'Beräknar...' : 'Räkna ut leasing'}
                        </button>
                        {simpleError && <div className="alert alert-danger" style={{marginTop:'1rem'}}>{simpleError}</div>}
                        {simpleResult && (
                            <div className="price-result-comparison" style={{marginTop:'2rem'}}>
                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: '2rem',
                                    justifyContent: 'center'
                                }}>
                                    {/* Köp kontant */}
                                    <div className="comparison-card" style={{
                                        background: '#f8fafc',
                                        border: '1px solid #d1e7dd',
                                        borderRadius: 8,
                                        padding: '1.5rem 2rem',
                                        minWidth: 260,
                                        flex: '1 1 260px',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                                    }}>
                                        <h4 style={{color:'#1a7f37', marginBottom:12}}>Köp kontant</h4>
                                        <div><b>Pris till kund:</b> {simpleResult.kontant?.forsaljningspris?.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })}</div>
                                        <div><b>Marginal:</b> {simpleResult.kontant?.marginal?.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })} ({simpleResult.kontant?.marginal_procent?.toFixed(2)}%)</div>
                                    </div>
                                    {/* Leasing-alternativ */}
                                    <div className="comparison-card" style={{
                                        background: '#f8f5ff',
                                        border: '1px solid #d6c8f5',
                                        borderRadius: 8,
                                        padding: '1.5rem 2rem',
                                        minWidth: 260,
                                        flex: '1 1 260px',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                                    }}>
                                        <h4 style={{color:'#5f3dc4', marginBottom:12}}>Leasing</h4>
                                        <table style={{width:'100%', fontSize:'1rem', borderCollapse:'collapse'}}>
                                            <thead>
                                                <tr>
                                                    <th style={{textAlign:'left'}}>Period</th>
                                                    <th style={{textAlign:'right'}}>Månadskostnad</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {["24","36","48"].map(months => (
                                                    <tr key={months}>
                                                        <td>{months} mån</td>
                                                        <td style={{textAlign:'right'}}>{simpleResult.leasing[months].manadskostnad?.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })}</td>
                                                </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <div style={{marginTop:12}}><b>Marginal:</b> {simpleResult.leasing["24"]?.marginal?.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })} ({simpleResult.leasing["24"]?.marginal_procent?.toFixed(2)}%)</div>
                                    </div>
                                    {/* Cirkulärt */}
                                    
                                    <div className="comparison-card" style={{
                                        background: '#e6f0ec',
                                        border: '1px solid #b2d8c7',
                                        borderRadius: 8,
                                        padding: '1.5rem 2rem',
                                        minWidth: 260,
                                        flex: '1 1 260px',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                                    }}>
                                        <h4 style={{color:'#0b5340', marginBottom:12}}>Cirkulärt (2 fakturor)</h4>
                                        <div><b>Faktura 1:</b> {Number.isFinite(simpleResult.circular?.faktura_1) ? simpleResult.circular.faktura_1.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' }) : '-'}</div>
                                        <div><b>Faktura 2:</b> {Number.isFinite(simpleResult.circular?.faktura_2) ? simpleResult.circular.faktura_2.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' }) : '-'}</div>
                                        <div style={{marginTop:12}}>
                                        <b>Marginal:</b>{' '}
                                        {Number.isFinite(simpleResult.circular?.marginal)
                                            ? simpleResult.circular.marginal.toLocaleString('sv-SE', {
                                                style: 'currency',
                                                currency: 'SEK'
                                            })
                                            : '-'}{' '}
                                        (
                                        {Number.isFinite(simpleResult.circular?.marginal_procent)
                                            ? simpleResult.circular.marginal_procent.toFixed(2)
                                            : '-'}
                                        %)
                                        </div>
                                        <div style={{marginTop:12, fontSize:'0.95em', color:'#333'}}><i>{simpleResult.circular.info}</i></div>
                                    </div>
                                </div>
                                <div style={{marginTop:'2rem', textAlign:'center', color:'#888', fontSize:'1.05em'}}>
                                    <b>Jämför alternativen:</b> Kontantköp ger direktkostnad, leasing fördelar kostnaden över tid, cirkulärt upplägg delar upp betalningen i två fakturor.
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="product-detail-layout" style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                {imageUrl && (
                    <div style={{ flex: '0 0 300px', alignSelf: 'flex-start' }}>
                        <img src={imageUrl} alt={productName} style={{ width: '100%', maxWidth: 300, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />
                    </div>
                )}
                <div style={{ flex: 1, minWidth: 300 }}>
                    <div className="card section">
                        <h3>Produktspecifikation</h3>
                        <div className="detail-grid">
                            {Object.entries(product).map(([key, value]) => {
                                if (value === null || value === undefined || value === '' || key === 'Image' || key === 'image_url' || key === 'Picture') return null;
                                const formattedValue = (typeof value === 'number' && (key.toLowerCase().includes('price') || key.toLowerCase().includes('vat')))
                                    ? `${value.toFixed(2)} SEK`
                                    : String(value);
                                return (
                                    <div className="detail-item" key={key}>
                                        <span className="detail-label">{formatKey(key)}</span>
                                        <span className="detail-value">{formattedValue}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const domContainer = document.getElementById('root');
const root = ReactDOM.createRoot(domContainer);
root.render(<ProductDetailPage />);

