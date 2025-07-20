const { useState, useEffect } = React;

function ProductCard({ result }) {
    if (!result) return null;
    const product = result.product || {};
    const discounts = Array.isArray(result.discounts) ? result.discounts : [];
    // Pris (number)
    const listPrice = typeof result.list_price === 'number' ? result.list_price : 0;
    const totalDiscount = typeof result.total_discount === 'number' ? result.total_discount : 0;
    const newPrice = typeof result.new_price === 'number' ? result.new_price : 0;
    const discountAmount = typeof result.discount_amount === 'number' ? result.discount_amount : 0;
    // Formatterare
    const formatPrice = (price) => typeof price === 'number' && !isNaN(price)
        ? price.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK', minimumFractionDigits: 2 })
        : '-';
    const formatPercent = (val) => typeof val === 'number' && !isNaN(val)
        ? (val * 100).toFixed(2) + '%'
        : '-';

    return (
        <div className="product-card" style={{
            background: '#fff',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            padding: '2rem',
            maxWidth: '600px',
            margin: '2rem auto'
        }}>
            <div style={{ borderBottom: '1px solid #eee', marginBottom: '1.5rem', paddingBottom: '1rem' }}>
                <h2 style={{ margin: 0 }}>{product['Description'] || product['Product Description'] || '-'}</h2>
                <p style={{ margin: 0, color: '#888' }}>Artikelnummer: {product['Part Number'] || product['Product Nr./cid Nr.'] || '-'}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                    <strong>Kategori</strong>
                    <div>{product['Category'] || product['Product Class'] || '-'}</div>
                </div>
                <div>
                    <strong>Listpris (ALP exkl. moms)</strong>
                    <div>{formatPrice(listPrice)}</div>
                </div>
                <div style={{gridColumn:'1 / span 2'}}>
                    <strong>Rabatter</strong>
                    <ul style={{margin:0, paddingLeft:'1.2em'}}>
                        {discounts.length > 0 ? discounts.map((d, i) => (
                            <li key={i}>{d.source}: {formatPercent(parseFloat(d.value))}</li>
                        )) : <li>Inga rabatter</li>}
                    </ul>
                </div>
                <div>
                    <strong>Total rabatt</strong>
                    <div>{formatPercent(totalDiscount)}</div>
                </div>
                <div>
                    <strong>Rabattbelopp</strong>
                    <div>{formatPrice(discountAmount)}</div>
                </div>
                <div style={{
                    background: '#e6f7e6',
                    borderRadius: '6px',
                    padding: '1rem',
                    fontWeight: 'bold',
                    gridColumn: '1 / span 2'
                }}>
                    <strong>Ditt pris (exkl. moms)</strong>
                    <div style={{ fontSize: '1.5rem' }}>{formatPrice(newPrice)}</div>
                </div>
            </div>
        </div>
    );
}

function PriceTestPage() {
    const [priceLists, setPriceLists] = useState([]);
    const [discountPrograms, setDiscountPrograms] = useState([]);
    // Set default values
    const defaultPriceList = 'Price_List_Sweden_L597287A-en_GB-9_2025-07-09.json';
    const defaultPartNumber = 'MC654KS/A';
    const [selectedPriceList, setSelectedPriceList] = useState(defaultPriceList);
    const [selectedDiscount, setSelectedDiscount] = useState('');
    const [partNumber, setPartNumber] = useState(defaultPartNumber);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);
    const [debug, setDebug] = useState(false);

    useEffect(() => {
        // Fetch price lists
        fetch('/api/price/list')
            .then(res => res.json())
            .then(data => {
                setPriceLists(data);
                // If the default is present, select it, else first
                if (data.includes(defaultPriceList)) {
                    setSelectedPriceList(defaultPriceList);
                } else if (data.length > 0) {
                    setSelectedPriceList(data[0]);
                }
            })
            .catch(err => setError('Kunde inte hämta prislistor.'));

        // Fetch discount programs
        fetch('/api/discounts/')
            .then(res => res.json())
            .then(data => {
                setDiscountPrograms(data);
            })
            .catch(err => setError('Kunde inte hämta rabattprogram.'));
    }, []);

    const handleCalculate = async () => {
        if (!selectedDiscount || !partNumber || !selectedPriceList) {
            setError('Du måste välja ett rabattprogram, ange ett artikelnummer och välja en prislista.');
            return;
        }
        setLoading(true);
        setError('');
        setResult(null);
        try {
            // Bygg endpoint enligt /api/discounts/lookup/{programname}/{partnumber}/{pricelist}
            const url = `/api/discounts/lookup/${encodeURIComponent(selectedDiscount)}/${encodeURIComponent(partNumber)}/${encodeURIComponent(selectedPriceList)}`;
            const res = await fetch(url);
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Ett okänt fel uppstod.');
            }
            setResult(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        React.createElement("div", { className: "container" },
            React.createElement("header", { className: "atea-header" },
                React.createElement("div", { className: "header-content" },
                    React.createElement("a", { href: "/" }, 
                        React.createElement("img", { src: "/images/logo.jpg", alt: "Atea Logo", className: "header-logo", style: { height: '50px' } })
                    ),
                    React.createElement("div", null,
                        React.createElement("h1", null, "Testa Rabattprogram-API"),
                        React.createElement("p", null, "Verifiera rabatter med olika rabattprogram och artikelnummer.")
                    )
                ),
                React.createElement("div", { className: "header-links" },
                    React.createElement("a", { href: "/", className: "header-link" }, "⬅️ Tillbaka till Admin")
                )
            ),


            React.createElement("div", { className: "card" },
                React.createElement("div", { className: "form-group" },
                    React.createElement("label", { htmlFor: "pricelist-select" }, "Välj Prislista"),
                    React.createElement("select", { id: "pricelist-select", value: selectedPriceList, onChange: e => setSelectedPriceList(e.target.value) },
                        priceLists.length === 0 ? React.createElement("option", { value: "" }, "Inga prislistor tillgängliga") : null,
                        priceLists.map(pl => React.createElement("option", { key: pl, value: pl }, pl))
                    )
                ),
                React.createElement("div", { className: "form-group" },
                    React.createElement("label", { htmlFor: "discount-select" }, "Välj Rabattprogram"),
                    React.createElement("select", { id: "discount-select", value: selectedDiscount, onChange: e => setSelectedDiscount(e.target.value) },
                        React.createElement("option", { value: "" }, "Välj rabattprogram"),
                        discountPrograms.map(prog => React.createElement("option", { key: prog, value: prog }, prog))
                    )
                ),
                React.createElement("div", { className: "form-group" },
                    React.createElement("label", { htmlFor: "part-number-input" }, "Artikelnummer (Part Number)"),
                    React.createElement("input", { 
                        type: "text", 
                        id: "part-number-input", 
                        value: partNumber, 
                        onChange: e => setPartNumber(e.target.value),
                        placeholder: "t.ex. MMFJ3KS/A"
                    })
                ),
                React.createElement("button", { onClick: handleCalculate, disabled: loading, className: "btn btn-primary" },
                    loading ? 'Hämtar...' : 'Hämta Rabatt'
                ),
                React.createElement("button", {
                    onClick: () => setDebug(d => !d),
                    className: "btn",
                    style: { marginLeft: '1rem' }
                }, debug ? "Dölj Debug" : "Visa Debug")
            ),

            error && React.createElement("div", { className: "alert alert-danger", style: { marginTop: '1rem' } }, error),

            result && (
                debug
                    ? React.createElement("div", { className: "card", style: { marginTop: '1rem' } },
                        React.createElement("h3", null, "Debug JSON"),
                        React.createElement("pre", { style: { background: '#f4f4f4', padding: '1rem', borderRadius: '4px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' } },
                            JSON.stringify(result, null, 2)
                        )
                    )
                    : React.createElement(ProductCard, { result })
            )
        )
    );
}

function ProductPriceAnalysis({ priceListFile, partNumber, discountProgramName, debugButton = true }) {
    const [result, setResult] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [debug, setDebug] = React.useState(false);

    React.useEffect(() => {
        if (!priceListFile || !partNumber) {
            setResult(null);
            setError('');
            return;
        }
        setLoading(true);
        setError('');
        setResult(null);

        const params = new URLSearchParams({
            price_list_file: priceListFile,
            part_number: partNumber,
        });
        if (discountProgramName) {
            params.append('discount_program_name', discountProgramName);
        }

        fetch(`/api/price/calculate?${params.toString()}`)
            .then(res => res.json().then(data => ({ ok: res.ok, data })))
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.error || 'Ett okänt fel uppstod.');
                setResult(data);
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [priceListFile, partNumber, discountProgramName]);

    if (!priceListFile || !partNumber) return null;
    if (loading) return <div>Laddar pris...</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <div>
            {debugButton && (
                <button onClick={() => setDebug(d => !d)} className="btn" style={{ marginBottom: '1rem' }}>
                    {debug ? "Dölj Debug" : "Visa Debug"}
                </button>
            )}
            {result && (
                debug
                    ? <div className="card" style={{ marginTop: '1rem' }}>
                        <h3>Debug JSON</h3>
                        <pre style={{ background: '#f4f4f4', padding: '1rem', borderRadius: '4px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </div>
                    : <ProductCard result={result} />
            )}
        </div>
    );
}

// Gör komponenten tillgänglig globalt för andra sidor
window.ProductPriceAnalysis = ProductPriceAnalysis;

const domContainer = document.getElementById('root');
const root = ReactDOM.createRoot(domContainer);
root.render(React.createElement(PriceTestPage));
