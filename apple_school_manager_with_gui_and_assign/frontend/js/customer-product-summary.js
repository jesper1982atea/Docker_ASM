console.log('[customer-product-summary] Loaded');


// Ta bort import-raden om du laddar filen direkt i browsern utan bundler/Babel/ESM!
//import { fetchPriceCalculation, calculateSimplePrice } from './priceUtils.js';

// Istället: Lägg till <script type="module" src="/js/priceUtils.js"></script> FÖRE denna fil i din HTML.
// Då finns fetchPriceCalculation och calculateSimplePrice på window-objektet.

// Ändra alla anrop till:
// window.fetchPriceCalculation(...)
// window.calculateSimplePrice(...)

// Exempel i ApplePriceCalculator:
    // React.useEffect(() => {
    //     fetch('/api/price/list')
    //         .then(res => res.json())
    //         .then(data => {
    //             setPriceLists(data);
    //             if (data.length > 0) setSelectedPriceList(data[0]);
    //         });
    //     fetch('/api/discounts/')
    //         .then(res => res.json())
    //         .then(setDiscountPrograms);
    // }, []);

    // React.useEffect(() => {
    //     if (!selectedPriceList || !partNumber) return;
    //     setPriceLoading(true);
    //     setPriceError('');
    //     setPriceResult(null);
    //     if (window.fetchPriceCalculation) {
    //         window.fetchPriceCalculation({ partNumber, priceList: selectedPriceList, discountProgram: selectedDiscount })
    //             .then(setPriceResult)
    //             .catch(err => setPriceError(err.message))
    //             .finally(() => setPriceLoading(false));
    //     } else {
    //         setPriceError('fetchPriceCalculation saknas');
    //         setPriceLoading(false);
    //     }
    // }, [selectedPriceList, selectedDiscount, partNumber]);

    const handleSimpleCalc = async () => {
        setSimpleLoading(true);
        setSimpleError('');
        setSimpleResult(null);
        try {
            const alp = parseFloat((priceResult?.list_price ?? inkopspris).toString().replace(',', '.')) || inkopspris;
            if (window.calculateSimplePrice) {
                const result = await window.calculateSimplePrice({
                    inkopspris,
                    restvardeProcent: simpleResidual,
                    alp_price: alp,
                    kontantMargin,
                    leasingMargin,
                    circularMargin: cirkularMargin
                });
                setSimpleResult(result);
            } else {
                throw new Error('calculateSimplePrice saknas');
            }
        } catch (err) {
            setSimpleError(err.message);
        } finally {
            setSimpleLoading(false);
        }
    };

async function fetchPriceCalculation({ partNumber, priceList, discountProgram }) {
    const params = new URLSearchParams();
    params.append('part_number', partNumber);
    params.append('price_list', priceList);
    if (discountProgram && discountProgram !== 'none') {
        params.append('program_name', discountProgram);
    }

    const url = `/api/discounts/lookup?${params.toString()}`;
    const response = await fetch(url);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Kunde inte hämta pris');
    }
    return response.json(); // innehåller list_price, new_price, total_discount etc.
}

async function calculateSimplePrice({
    inkopspris,
    restvardeProcent,
    alp_price,
    kontantMargin,
    leasingMargin,
    circularMargin
}) {
    const payload = {
        inkopspris,
        restvarde: restvardeProcent,
        alp_price,
        kontant_marginal_procent: kontantMargin,
        leasing_marginal_procent: leasingMargin,
        cirkular_marginal_procent: circularMargin
    };

    const response = await fetch('/api/price/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Fel vid prisberäkning');
    }

    return response.json(); // innehåller kontant, leasing, circular
}

// Utility functions (utan hooks!)
function getDataFromSession() {
    try {
        const raw = sessionStorage.getItem('customerProductSummaryData');
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

function getCustomerInfo(data) {
    if (!data || data.length === 0) return {};
    const row = data[0];
    const fields = [
        { key: 'Kund', label: 'Kundnamn' },
        { key: 'Kundnamn', label: 'Kundnamn' },
        { key: 'Kundnummer', label: 'Kundnummer' },
        { key: 'Org.nr', label: 'Organisationsnummer' },
        { key: 'Kontaktperson', label: 'Kontaktperson' },
        { key: 'E-post', label: 'E-post' },
        { key: 'Telefon', label: 'Telefon' },
    ];
    const info = {};
    fields.forEach(f => {
        if (row[f.key]) info[f.label] = row[f.key];
    });
    return info;
}

function summarizeProducts(data) {
    if (!data) return [];
    const map = new Map();
    data.forEach(row => {
        const part = row['Artikelnr (tillverkare)'];
        if (!part) return;
        const name = row['Artikelbenämning (APA)'] || row['ARTIKELBENÄMNING (APA)'] || row['Produktnamn'] || row['Produkt'] || row['Benämning'] || row['Produktnamn (från fil)'] || '';
        const totFors = parseFloat((row['Tot Förs (SEK)'] || '').toString().replace(/\s/g, '').replace(',', '.'));
        const totKost = parseFloat((row['Tot Kost (SEK)'] || '').toString().replace(/\s/g, '').replace(',', '.'));
        let margin = null;
        if (!isNaN(totFors) && !isNaN(totKost) && totFors !== 0) {
            margin = ((totFors - totKost) / totFors) * 100;
        }
        if (!map.has(part)) {
            map.set(part, { part, name, count: 0, totalFors: 0, totalKost: 0, totalMargin: 0, marginCount: 0 });
        }
        const entry = map.get(part);
        entry.count++;
        if (!isNaN(totFors)) entry.totalFors += totFors;
        if (!isNaN(totKost)) entry.totalKost += totKost;
        if (margin !== null && !isNaN(margin)) {
            entry.totalMargin += margin;
            entry.marginCount++;
        }
    });
    return Array.from(map.values()).map(e => ({
        ...e,
        avgPrice: e.count > 0 ? (e.totalFors / e.count) : 0,
        avgMargin: e.marginCount > 0 ? (e.totalMargin / e.marginCount) : null,
        avgStyckpris: e.count > 0 ? (e.totalFors / e.count) : null,
        avgInkopPris: e.count > 0 ? (e.totalKost / e.count) : null
    }));
}

function MC6T4KSAPriceComparison({ summary }) {
    const [priceLists, setPriceLists] = React.useState([]);
    const [discountPrograms, setDiscountPrograms] = React.useState([]);
    const [selectedPriceList, setSelectedPriceList] = React.useState('');
    const [selectedDiscount, setSelectedDiscount] = React.useState('');
    const [partNumber] = React.useState('MC6T4KS/A');
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [result, setResult] = React.useState(null);

    const [simpleMargin, setSimpleMargin] = React.useState(8);
    const [simpleResidual, setSimpleResidual] = React.useState(15);
    const [simpleResult, setSimpleResult] = React.useState(null);
    const [simpleLoading, setSimpleLoading] = React.useState(false);
    const [simpleError, setSimpleError] = React.useState('');

    React.useEffect(() => {
        fetch('/api/price/list')
            .then(res => res.json())
            .then(data => {
                setPriceLists(data);
                if (data.length > 0) setSelectedPriceList(data[0]);
            })
            .catch(() => setError('Kunde inte hämta prislistor.'));
        fetch('/api/discounts/')
            .then(res => res.json())
            .then(data => setDiscountPrograms(data))
            .catch(() => setError('Kunde inte hämta rabattprogram.'));
    }, []);

    React.useEffect(() => {
        if (!selectedPriceList || !partNumber) return;
        setLoading(true);
        setError('');
        setResult(null);
        const params = new URLSearchParams();
        if (selectedDiscount) params.append('program_name', selectedDiscount);
        params.append('part_number', partNumber);
        params.append('price_list', selectedPriceList);
        const url = `/api/discounts/lookup?${params.toString()}`;
        fetch(url)
            .then(res => res.json().then(data => ({ ok: res.ok, data })))
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.error || 'Ett okänt fel uppstod.');
                setResult(data);
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [selectedDiscount, selectedPriceList, partNumber]);

    const productSummary = summary.find(row => row.part === partNumber);
    const avgStyckpris = productSummary ? productSummary.avgStyckpris : null;
    const avgInkopPris = productSummary ? productSummary.avgInkopPris : null;
    const count = productSummary ? productSummary.count : 0;

    const handleSimpleCalc = async () => {
        setSimpleLoading(true);
        setSimpleError('');
        setSimpleResult(null);
        try {
            let inkopspris = avgInkopPris || 0;
            let forsaljningspris = avgStyckpris || 0;
            if (!forsaljningspris) {
                forsaljningspris = Number(inkopspris) * (1 + Number(simpleMargin)/100);
            }
            let alp_price = result?.list_price ?? 0;
            alp_price = typeof alp_price === 'string' ? parseFloat(alp_price.replace(/[^0-9.,-]/g, '').replace(',', '.')) : Number(alp_price) || 0;
            inkopspris = typeof inkopspris === 'string' ? parseFloat(inkopspris.replace(/[^0-9.,-]/g, '').replace(',', '.')) : Number(inkopspris) || 0;
            forsaljningspris = typeof forsaljningspris === 'string' ? parseFloat(forsaljningspris.replace(/[^0-9.,-]/g, '').replace(',', '.')) : Number(forsaljningspris) || 0;
            const restvarde = Number(simpleResidual) / 100 * forsaljningspris;

            const params = new URLSearchParams({
                inkopspris: inkopspris,
                forsaljningspris: forsaljningspris,
                restvarde: restvarde,
                alp_price: alp_price
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

    const formatPrice = (price) => typeof price === 'number' && !isNaN(price)
        ? price.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK', minimumFractionDigits: 2 })
        : '-';

    const priceTable = React.createElement('table', { className: 'price-compare-table', style: { margin: '1em 0', width: '100%', borderCollapse: 'collapse' } },
        React.createElement('thead', null,
            React.createElement('tr', null,
                React.createElement('th', null, 'Källa'),
                React.createElement('th', null, 'Antal'),
                React.createElement('th', null, 'Snittpris'),
                React.createElement('th', null, 'Inköpspris'),
                React.createElement('th', null, 'Kommentar')
            )
        ),
        React.createElement('tbody', null,
            React.createElement('tr', null,
                React.createElement('td', null, 'Köphistorik'),
                React.createElement('td', null, count),
                React.createElement('td', null, avgStyckpris !== null ? formatPrice(avgStyckpris) : '-'),
                React.createElement('td', null, avgInkopPris !== null ? formatPrice(avgInkopPris) : '-'),
                React.createElement('td', null, 'Historiskt snitt')
            ),
            result && React.createElement('tr', { style: { background: '#e6f7e6' } },
                React.createElement('td', null, 'Nytt förslag'),
                React.createElement('td', null, '-'),
                React.createElement('td', null, formatPrice(result.new_price)),
                React.createElement('td', null, result.list_price !== undefined ? formatPrice(result.list_price) : '-'),
                React.createElement('td', null, result.new_price < avgStyckpris ? 'Lägre än historik' : 'Högre än historik')
            )
        )
    );

    let comparisonNode = null;
    if (simpleResult) {
        comparisonNode = React.createElement(
            'div',
            { className: 'price-result-comparison', style: { marginTop: '2rem' } },
            React.createElement('div', {
                style: { display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center' }
            },
                // Köp kontant
                React.createElement('div', { className: 'comparison-card', style: {
                    background: '#f8fafc',
                    border: '1px solid #d1e7dd',
                    borderRadius: 8,
                    padding: '1.5rem 2rem',
                    minWidth: 260,
                    flex: '1 1 260px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }},
                    React.createElement('h4', { style: { color: '#1a7f37', marginBottom: 12 } }, 'Köp kontant'),
                    React.createElement('div', null, React.createElement('b', null, 'Pris till kund:'), ' ',
                        simpleResult.kontant?.forsaljningspris !== undefined
                            ? simpleResult.kontant.forsaljningspris.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })
                            : '-'
                    ),
                    React.createElement('div', null, React.createElement('b', null, 'Marginal:'), ' ',
                        simpleResult.kontant?.marginal !== undefined
                            ? simpleResult.kontant.marginal.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })
                            : '-', ' (',
                        simpleResult.kontant?.marginal_procent !== undefined
                            ? simpleResult.kontant.marginal_procent.toFixed(2)
                            : '-', '%)'
                    )
                ),
                // Leasing
                React.createElement('div', { className: 'comparison-card', style: {
                    background: '#f8f5ff',
                    border: '1px solid #d6c8f5',
                    borderRadius: 8,
                    padding: '1.5rem 2rem',
                    minWidth: 260,
                    flex: '1 1 260px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }},
                    React.createElement('h4', { style: { color: '#5f3dc4', marginBottom: 12 } }, 'Leasing'),
                    React.createElement('table', { style: { width: '100%', fontSize: '1rem', borderCollapse: 'collapse' } },
                        React.createElement('thead', null,
                            React.createElement('tr', null,
                                React.createElement('th', { style: { textAlign: 'left' } }, 'Period'),
                                React.createElement('th', { style: { textAlign: 'right' } }, 'Månadskostnad')
                            )
                        ),
                        React.createElement('tbody', null,
                            ["24", "36", "48"].map(months =>
                                React.createElement('tr', { key: months },
                                    React.createElement('td', null, months + ' mån'),
                                    React.createElement('td', { style: { textAlign: 'right' } },
                                        simpleResult.leasing?.[months]?.manadskostnad !== undefined
                                            ? simpleResult.leasing[months].manadskostnad.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })
                                            : '-'
                                    )
                                )
                            )
                        )
                    ),
                    React.createElement('div', { style: { marginTop: 12 } },
                        React.createElement('b', null, 'Marginal:'), ' ',
                        simpleResult.leasing?.["24"]?.marginal !== undefined
                            ? simpleResult.leasing["24"].marginal.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })
                            : '-', ' (',
                        simpleResult.leasing?.["24"]?.marginal_procent !== undefined
                            ? simpleResult.leasing["24"].marginal_procent.toFixed(2)
                            : '-', '%)'
                    )
                ),
                // Cirkulärt
                React.createElement('div', { className: 'comparison-card', style: {
                    background: '#e6f0ec',
                    border: '1px solid #b2d8c7',
                    borderRadius: 8,
                    padding: '1.5rem 2rem',
                    minWidth: 260,
                    flex: '1 1 260px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }},
                    React.createElement('h4', { style: { color: '#0b5340', marginBottom: 12 } }, 'Cirkulärt (2 fakturor)'),
                    React.createElement('div', null, React.createElement('b', null, 'Faktura 1:'), ' ',
                        Number.isFinite(simpleResult.circular?.faktura_1)
                            ? simpleResult.circular.faktura_1.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })
                            : '-'
                    ),
                    React.createElement('div', null, React.createElement('b', null, 'Faktura 2:'), ' ',
                        Number.isFinite(simpleResult.circular?.faktura_2)
                            ? simpleResult.circular.faktura_2.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })
                            : '-'
                    ),
                    React.createElement('div', { style: { marginTop: 12 } },
                        React.createElement('b', null, 'Marginal:'), ' ',
                        Number.isFinite(simpleResult.circular?.marginal)
                            ? simpleResult.circular.marginal.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })
                            : '-', ' (',
                        Number.isFinite(simpleResult.circular?.marginal_procent)
                            ? simpleResult.circular.marginal_procent.toFixed(2)
                            : '-', '%)'
                    )
                )
            ),
            React.createElement('div', { style: { marginTop: '2rem', textAlign: 'center', color: '#888', fontSize: '1.05em' } },
                React.createElement('b', null, 'Jämför alternativen:'), ' Kontantköp ger direktkostnad, leasing fördelar kostnaden över tid, cirkulärt upplägg delar upp betalningen i två fakturor.'
            )
        );
    }

    return React.createElement(
        'div',
        { className: 'mc6t4ksa-comparison', style: { margin: '2em 0', padding: '1em', border: '1px solid #ccc', borderRadius: '8px', background: '#f9f9f9' } },
        React.createElement('h3', null, 'Prisjämförelse: MC6T4KS/A'),
        React.createElement('div', { style: { display: 'flex', gap: '2em', marginBottom: '1em', flexWrap: 'wrap' } },
            React.createElement('div', null,
                React.createElement('label', null, 'Prislista:'),
                React.createElement('select', {
                    value: selectedPriceList,
                    onChange: e => setSelectedPriceList(e.target.value)
                },
                    priceLists.length === 0 ? React.createElement('option', { value: '' }, 'Inga prislistor') : null,
                    priceLists.map(pl => React.createElement('option', { key: pl, value: pl }, pl))
                )
            ),
            React.createElement('div', null,
                React.createElement('label', null, 'Rabattprogram:'),
                React.createElement('select', {
                    value: selectedDiscount,
                    onChange: e => setSelectedDiscount(e.target.value)
                },
                    React.createElement('option', { value: '' }, 'Välj rabattprogram'),
                    discountPrograms.map(prog => React.createElement('option', { key: prog, value: prog }, prog))
                )
            )
        ),
        error && React.createElement('div', { style: { color: 'red', marginBottom: '1em' } }, error),
        loading && React.createElement('div', null, 'Hämtar pris...'),
        React.createElement('div', { className: 'price-calculator-module card section', style: {marginTop:'2rem'} },
            React.createElement('h3', { style: {marginBottom:'1.5rem'} }, 'Enkel leasingkalkylator'),
            React.createElement('div', { className: 'detail-grid-condensed', style: {marginBottom:'1.5rem'} },
                React.createElement('div', { className: 'detail-item' },
                    React.createElement('label', { className: 'detail-label' }, `Marginal: `, React.createElement('b', null, simpleMargin + '%')),
                    React.createElement('input', {
                        type: 'range', min: 0, max: 50, step: 1, value: simpleMargin,
                        onChange: e => setSimpleMargin(Number(e.target.value))
                    })
                ),
                React.createElement('div', { className: 'detail-item' },
                    React.createElement('label', { className: 'detail-label' }, `Restvärde: `, React.createElement('b', null, simpleResidual + '%')),
                    React.createElement('input', {
                        type: 'range', min: 0, max: 50, step: 1, value: simpleResidual,
                        onChange: e => setSimpleResidual(Number(e.target.value))
                    })
                )
            ),
            React.createElement('button', {
                className: 'btn btn-primary',
                style: {marginTop:'1rem', minWidth:180},
                onClick: handleSimpleCalc,
                disabled: simpleLoading
            }, simpleLoading ? 'Beräknar...' : 'Räkna ut pris'),
            simpleError && React.createElement('div', { className: 'alert alert-danger', style: {marginTop:'1rem'} }, simpleError),
            comparisonNode
        ),
        priceTable
    );
}

// Utility för att formatera SEK
function formatSEK(v) {
    if (v === undefined || v === null || isNaN(v)) return '-';
    return Number(v).toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' });
}

function ApplePriceCalculator({ partNumber, inkopspris }) {
    const [priceLists, setPriceLists] = React.useState([]);
    const [selectedPriceList, setSelectedPriceList] = React.useState('');
    const [discountPrograms, setDiscountPrograms] = React.useState([]);
    const [selectedDiscount, setSelectedDiscount] = React.useState('');
    const [priceResult, setPriceResult] = React.useState(null);
    const [priceLoading, setPriceLoading] = React.useState(false);
    const [priceError, setPriceError] = React.useState('');

    const [kontantMargin, setKontantMargin] = React.useState(8);
    const [leasingMargin, setLeasingMargin] = React.useState(8);
    const [cirkularMargin, setCirkularMargin] = React.useState(8);
    const [simpleResidual, setSimpleResidual] = React.useState(15);
    const [simpleResult, setSimpleResult] = React.useState(null);
    const [simpleLoading, setSimpleLoading] = React.useState(false);
    const [simpleError, setSimpleError] = React.useState('');

    React.useEffect(() => {
        fetch('/api/price/list')
            .then(res => res.json())
            .then(data => {
                setPriceLists(data);
                if (data.length > 0) setSelectedPriceList(data[0]);
            });
        fetch('/api/discounts/')
            .then(res => res.json())
            .then(setDiscountPrograms);
    }, []);

    React.useEffect(() => {
        if (!selectedPriceList || !partNumber) return;
        setPriceLoading(true);
        setPriceError('');
        setPriceResult(null);
        if (window.fetchPriceCalculation) {
            window.fetchPriceCalculation({ partNumber, priceList: selectedPriceList, discountProgram: selectedDiscount })
                .then(setPriceResult)
                .catch(err => setPriceError(err.message))
                .finally(() => setPriceLoading(false));
        } else {
            setPriceError('fetchPriceCalculation saknas');
            setPriceLoading(false);
        }
    }, [selectedPriceList, selectedDiscount, partNumber]);

    const handleSimpleCalc = async () => {
        setSimpleLoading(true);
        setSimpleError('');
        setSimpleResult(null);
        try {
            const alp = parseFloat((priceResult?.list_price ?? inkopspris).toString().replace(',', '.')) || inkopspris;
            if (window.calculateSimplePrice) {
                const result = await window.calculateSimplePrice({
                    inkopspris,
                    restvardeProcent: simpleResidual,
                    alp_price: alp,
                    kontantMargin,
                    leasingMargin,
                    circularMargin: cirkularMargin
                });
                setSimpleResult(result);
            } else {
                throw new Error('calculateSimplePrice saknas');
            }
        } catch (err) {
            setSimpleError(err.message);
        } finally {
            setSimpleLoading(false);
        }
    };

    return React.createElement('div', null,
        React.createElement('div', { className: 'card section', style: { marginTop: '1.5rem', marginBottom: '1.5rem' } },
            React.createElement('div', { style: { marginBottom: '1rem' } },
                React.createElement('label', { htmlFor: 'discount-select', style: { fontWeight: 600, marginRight: 8 } }, 'Rabattprogram:'),
                React.createElement('select', {
                    id: 'discount-select', value: selectedDiscount,
                    onChange: e => setSelectedDiscount(e.target.value)
                },
                    React.createElement('option', { value: '' }, 'Inget rabattprogram'),
                    discountPrograms.map(prog => React.createElement('option', { key: prog, value: prog }, prog))
                )
            ),
            
            priceLoading && React.createElement('div', { style: { color: '#888' } }, 'Laddar pris...'),
            priceError && React.createElement('div', { className: 'alert alert-danger' }, priceError),
            priceResult && React.createElement('div', { className: 'price-result-grid' },
                React.createElement('div', { style: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--atea-green)' } },
                    'Ditt pris: ',
                    priceResult.new_price !== undefined && priceResult.new_price !== null
                        ? priceResult.new_price.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })
                        : '-'
                ),
                React.createElement('div', { style: { marginTop: '0.5rem', color: '#666' } },
                    'Listpris: ',
                    priceResult.list_price !== undefined && priceResult.list_price !== null
                        ? priceResult.list_price.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })
                        : '-'
                ),
                React.createElement('div', { style: { marginTop: '0.5rem' } }, 'Rabatter:',
                    React.createElement('ul', { style: { margin: 0, paddingLeft: '1.2em' } },
                        Array.isArray(priceResult.discounts) && priceResult.discounts.length > 0
                            ? priceResult.discounts.map((d, i) =>
                                React.createElement('li', { key: i }, d.source + ': ' + ((parseFloat(d.value) || 0) * 100).toFixed(2) + '%'))
                            : React.createElement('li', null, 'Inga rabatter')
                    )
                ),
                React.createElement('div', null, 'Total rabatt: ',
                    React.createElement('b', null, ((priceResult.total_discount || 0) * 100).toFixed(2) + '%')
                ),
                React.createElement('div', null, 'Rabattbelopp: ',
                    React.createElement('b', null,
                        priceResult.discount_amount !== undefined && priceResult.discount_amount !== null
                            ? priceResult.discount_amount.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })
                            : '-'
                    )
                ),
                React.createElement('div', null, 'Rabattkälla: ',
                    React.createElement('b', null, priceResult.discount_source || '-')
                )
            ),
            React.createElement('div', { className: 'price-calculator-module card section', style: { marginTop: '2rem' } },
                React.createElement('h3', { style: { marginBottom: '1.5rem' } }, 'Enkel leasingkalkylator'),
                React.createElement('div', {
                    className: 'detail-grid-condensed',
                    style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }
                },
                    React.createElement('div', { className: 'detail-item' },
                        React.createElement('label', { className: 'detail-label' }, 'Marginal kontant: ', React.createElement('b', null, kontantMargin + '%')),
                        React.createElement('input', { type: 'range', min: 0, max: 50, step: 1, value: kontantMargin, onChange: e => setKontantMargin(Number(e.target.value)) })
                    ),
                    React.createElement('div', { className: 'detail-item' },
                        React.createElement('label', { className: 'detail-label' }, 'Marginal leasing: ', React.createElement('b', null, leasingMargin + '%')),
                        React.createElement('input', { type: 'range', min: 0, max: 50, step: 1, value: leasingMargin, onChange: e => setLeasingMargin(Number(e.target.value)) })
                    ),
                    React.createElement('div', { className: 'detail-item' },
                        React.createElement('label', { className: 'detail-label' }, 'Marginal cirkulärt: ', React.createElement('b', null, cirkularMargin + '%')),
                        React.createElement('input', { type: 'range', min: 0, max: 50, step: 1, value: cirkularMargin, onChange: e => setCirkularMargin(Number(e.target.value)) })
                    ),
                    React.createElement('div', { className: 'detail-item' },
                        React.createElement('label', { className: 'detail-label' }, 'Restvärde: ', React.createElement('b', null, simpleResidual + '%')),
                        React.createElement('input', { type: 'range', min: 0, max: 50, step: 1, value: simpleResidual, onChange: e => setSimpleResidual(Number(e.target.value)) })
                    )
                ),
                React.createElement('button', {
                    className: 'btn btn-primary', style: { marginTop: '1rem', minWidth: 180 },
                    onClick: handleSimpleCalc, disabled: simpleLoading
                }, simpleLoading ? 'Beräknar...' : 'Räkna ut pris'),
                simpleError && React.createElement('div', { className: 'alert alert-danger', style: { marginTop: '1rem' } }, simpleError),
                simpleResult && React.createElement('div', { className: 'price-result-comparison', style: { marginTop: '2rem' } },
                    React.createElement('div', {
                        style: { display: 'flex', flexWrap: 'wrap', gap: '2rem', justifyContent: 'center' }
                    },
                        // Köp kontant
                        React.createElement('div', { className: 'comparison-card', style: {
                            background: '#f8fafc',
                            border: '1px solid #d1e7dd',
                            borderRadius: 8,
                            padding: '1.5rem 2rem',
                            minWidth: 260,
                            flex: '1 1 260px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                        }},
                            React.createElement('h4', { style: { color: '#1a7f37', marginBottom: 12 } }, 'Köp kontant'),
                            React.createElement('div', null, React.createElement('b', null, 'Pris till kund:'), ' ',
                                simpleResult.kontant?.forsaljningspris !== undefined
                                    ? simpleResult.kontant.forsaljningspris.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })
                                    : '-'
                            ),
                            React.createElement('div', null, React.createElement('b', null, 'Marginal:'), ' ',
                                simpleResult.kontant?.marginal !== undefined
                                    ? simpleResult.kontant.marginal.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })
                                    : '-', ' (',
                                simpleResult.kontant?.marginal_procent !== undefined
                                    ? simpleResult.kontant.marginal_procent.toFixed(2)
                                    : '-', '%)'
                            )
                        ),
                        // Leasing
                        React.createElement('div', { className: 'comparison-card', style: {
                            background: '#f8f5ff',
                            border: '1px solid #d6c8f5',
                            borderRadius: 8,
                            padding: '1.5rem 2rem',
                            minWidth: 260,
                            flex: '1 1 260px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                        }},
                            React.createElement('h4', { style: { color: '#5f3dc4', marginBottom: 12 } }, 'Leasing'),
                            React.createElement('table', { style: { width: '100%', fontSize: '1rem', borderCollapse: 'collapse' } },
                                React.createElement('thead', null,
                                    React.createElement('tr', null,
                                        React.createElement('th', { style: { textAlign: 'left' } }, 'Period'),
                                        React.createElement('th', { style: { textAlign: 'right' } }, 'Månadskostnad')
                                    )
                                ),
                                React.createElement('tbody', null,
                                    ["24", "36", "48"].map(months =>
                                        React.createElement('tr', { key: months },
                                            React.createElement('td', null, months + ' mån'),
                                            React.createElement('td', { style: { textAlign: 'right' } },
                                                simpleResult.leasing?.[months]?.manadskostnad !== undefined
                                                    ? simpleResult.leasing[months].manadskostnad.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })
                                                    : '-'
                                            )
                                        )
                                    )
                                )
                            ),
                            React.createElement('div', { style: { marginTop: 12 } },
                                React.createElement('b', null, 'Marginal:'), ' ',
                                simpleResult.leasing?.["24"]?.marginal !== undefined
                                    ? simpleResult.leasing["24"].marginal.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })
                                    : '-', ' (',
                                simpleResult.leasing?.["24"]?.marginal_procent !== undefined
                                    ? simpleResult.leasing["24"].marginal_procent.toFixed(2)
                                    : '-', '%)'
                            )
                        ),
                        // Cirkulärt
                        React.createElement('div', { className: 'comparison-card', style: {
                            background: '#e6f0ec',
                            border: '1px solid #b2d8c7',
                            borderRadius: 8,
                            padding: '1.5rem 2rem',
                            minWidth: 260,
                            flex: '1 1 260px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                        }},
                            React.createElement('h4', { style: { color: '#0b5340', marginBottom: 12 } }, 'Cirkulärt (2 fakturor)'),
                            React.createElement('div', null, React.createElement('b', null, 'Faktura 1:'), ' ',
                                Number.isFinite(simpleResult.circular?.faktura_1)
                                    ? simpleResult.circular.faktura_1.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })
                                    : '-'
                            ),
                            React.createElement('div', null, React.createElement('b', null, 'Faktura 2:'), ' ',
                                Number.isFinite(simpleResult.circular?.faktura_2)
                                    ? simpleResult.circular.faktura_2.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })
                                    : '-'
                            ),
                            React.createElement('div', { style: { marginTop: 12 } },
                                React.createElement('b', null, 'Marginal:'), ' ',
                                Number.isFinite(simpleResult.circular?.marginal)
                                    ? simpleResult.circular.marginal.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })
                                    : '-', ' (',
                                Number.isFinite(simpleResult.circular?.marginal_procent)
                                    ? simpleResult.circular.marginal_procent.toFixed(2)
                                    : '-', '%)'
                            )
                        )
                    ),
                    React.createElement('div', { style: { marginTop: '2rem', textAlign: 'center', color: '#888', fontSize: '1.05em' } },
                        React.createElement('b', null, 'Jämför alternativen:'), ' Kontantköp ger direktkostnad, leasing fördelar kostnaden över tid, cirkulärt upplägg delar upp betalningen i två fakturor.'
                    )
                )
            )
        )
    );
}

// Justera logotyp och tabell-layout i CustomerProductSummary
function CustomerProductSummary() {
    // Ta bort all kod utanför komponenter som anropar React.useState, React.useEffect etc.
    // Flytta ALLA React.useState, React.useEffect, React.useMemo-anrop inuti funktionskomponenter.
    // Kontrollera att du INTE anropar hooks utanför komponentfunktioner eller i vanliga funktioner.

    // Exempel på korrekt struktur:

    // ...utility functions (utan hooks)...

    // Alla hooks här inne!
    const [data] = React.useState(getDataFromSession());
    const customerInfo = React.useMemo(() => getCustomerInfo(data), [data]);
    const summary = React.useMemo(() => summarizeProducts(data), [data]);

    if (!data) {
        return React.createElement(
            'div',
            { style: { color: 'red', padding: '2em' } },
            React.createElement('div', null, 'Ingen data hittades. Gå tillbaka och ladda upp en fil.'),
            React.createElement(
                'div',
                null,
                'Om du kom hit via bokmärke, gå till ',
                React.createElement('a', { href: '/sales-upload' }, 'uppladdningssidan'),
                ' först.'
            )
        );
    }

    // Justera logotyp-storlek och tabell-stil
    let customerInfoNode;
    if (Object.keys(customerInfo).length === 0) {
        customerInfoNode = React.createElement('p', null, React.createElement('i', null, 'Ingen kundinfo i filen'));
    } else {
        customerInfoNode = React.createElement(
            'div',
            { style: { display: 'flex', flexWrap: 'wrap' } },
            Object.entries(customerInfo).map(([k, v]) =>
                React.createElement('div', { className: 'stat-box', key: k },
                    React.createElement('b', null, k + ':'), ' ', v)
            )
        );
    }

    const summaryRows = summary.map(row =>
        React.createElement('tr', { key: row.part },
            React.createElement('td', { style: { padding: '0.5em 1em', border: '1px solid #e0e0e0' } }, row.part),
            React.createElement('td', { style: { padding: '0.5em 1em', border: '1px solid #e0e0e0' } }, row.name),
            React.createElement('td', { style: { padding: '0.5em 1em', border: '1px solid #e0e0e0', textAlign: 'right' } }, row.count),
            React.createElement('td', { style: { padding: '0.5em 1em', border: '1px solid #e0e0e0', textAlign: 'right' } }, row.avgStyckpris !== null ? row.avgStyckpris.toFixed(2) : '-'),
            React.createElement('td', { style: { padding: '0.5em 1em', border: '1px solid #e0e0e0', textAlign: 'right' } }, row.avgInkopPris !== null ? row.avgInkopPris.toFixed(2) : '-'),
            React.createElement('td', { style: { padding: '0.5em 1em', border: '1px solid #e0e0e0', textAlign: 'right' } }, row.avgPrice ? row.avgPrice.toFixed(2) : '-'),
            React.createElement('td', { style: { padding: '0.5em 1em', border: '1px solid #e0e0e0', textAlign: 'right' } }, row.avgMargin !== null ? row.avgMargin.toFixed(2) + ' %' : '-')
        )
    );

    return React.createElement(
        'div',
        { className: 'summary-container', style: { maxWidth: 1100, margin: '2rem auto', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001', padding: '2rem' } },
        React.createElement(
            'div', { className: 'summary-header', style: { display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem' } },
            React.createElement('a', { href: '/' },
                React.createElement('img', {
                    src: '/images/logo.jpg',
                    alt: 'Atea Logo',
                    style: { height: '48px', maxWidth: '180px', objectFit: 'contain', marginRight: '1rem' }
                })
            ),
            React.createElement('div', null,
                React.createElement('h1', { style: { marginBottom: 0, fontSize: '2rem' } }, 'Kundens Produktsammanställning'),
                React.createElement('p', { style: { marginTop: 0, color: '#555' } }, 'Översikt av köpta produkter, antal, snittpris, styckpris, inköpspris och marginal.')
            )
        ),
        React.createElement(
            'div', { className: 'customer-info' },
            React.createElement('h3', null, 'Kundinformation'),
            customerInfoNode
        ),
        React.createElement(
            'div', null,
            React.createElement('h3', null, 'Produkter'),
            React.createElement(
                'table',
                {
                    className: 'summary-table',
                    style: {
                        width: '100%',
                        borderCollapse: 'collapse',
                        marginTop: '2rem',
                        fontSize: '1rem',
                        background: '#fafbfc'
                    }
                },
                React.createElement(
                    'thead', null,
                    React.createElement(
                        'tr', null,
                        React.createElement('th', { style: { background: '#f5f5f5', padding: '0.7em 1em', border: '1px solid #e0e0e0' } }, 'Artikelnr'),
                        React.createElement('th', { style: { background: '#f5f5f5', padding: '0.7em 1em', border: '1px solid #e0e0e0' } }, 'Produktnamn'),
                        React.createElement('th', { style: { background: '#f5f5f5', padding: '0.7em 1em', border: '1px solid #e0e0e0' } }, 'Antal'),
                        React.createElement('th', { style: { background: '#f5f5f5', padding: '0.7em 1em', border: '1px solid #e0e0e0' } }, 'Snitt styckpris'),
                        React.createElement('th', { style: { background: '#f5f5f5', padding: '0.7em 1em', border: '1px solid #e0e0e0' } }, 'Snitt inköpspris'),
                        React.createElement('th', { style: { background: '#f5f5f5', padding: '0.7em 1em', border: '1px solid #e0e0e0' } }, 'Snittpris (Tot Förs)'),
                        React.createElement('th', { style: { background: '#f5f5f5', padding: '0.7em 1em', border: '1px solid #e0e0e0' } }, 'Snittmarginal')
                    )
                ),
                React.createElement('tbody', null, summaryRows)
            )
        ),
        React.createElement(
            'div', { style: { marginTop: '2em' } },
            React.createElement('a', { href: '/sales-upload', className: 'btn btn-secondary' }, '\u2190 Tillbaka till uppladdning')
        ),
        React.createElement(ApplePriceCalculator, { partNumber: 'MC6T4KS/A', inkopspris: summary.find(row => row.part === 'MC6T4KS/A')?.avgInkopPris || 0 })
    );
}

const root = document.getElementById('root');
if (root) {
    ReactDOM.createRoot(root).render(
        React.createElement(CustomerProductSummary)
    );
}


