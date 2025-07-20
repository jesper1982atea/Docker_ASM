
const { useState, useEffect, useMemo } = React;



function SalesOrderDetailPage() {
    // Kolla om debugläge är aktivt via URL-param (MÅSTE ligga överst bland hooks!)
    const debugMode = useMemo(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('debug') === 'true';
    }, []);

    const [orderData, setOrderData] = useState(null);
    const [gsxDetails, setGsxDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Ta bort/flytta den gamla "prisberäknings-UI state" och dess hooks om du använder priceUtil-logik.
    // Om du vill behålla avancerad kalkylator, se till att du har:
    // const [priceCalcInput, setPriceCalcInput] = useState(null);

    // Om du inte använder priceCalcInput längre, ta bort/flytta denna useEffect:
    // useEffect(() => {
    //     if (!priceCalcInput) return;
    //     const fetchCalc = async () => {
    //         setPriceCalcLoading(true);
    //         setPriceCalcResult(null);
    //         try {
    //             const res = await fetch('/api/price/calculate-advanced', {
    //                 method: 'POST',
    //                 headers: { 'Content-Type': 'application/json' },
    //                 body: JSON.stringify(priceCalcInput)
    //             });
    //             if (!res.ok) throw new Error('Kalkylfel');
    //             const data = await res.json();
    //             setPriceCalcResult(data);
    //         } catch (e) {
    //             setPriceCalcResult(null);
    //         } finally {
    //             setPriceCalcLoading(false);
    //         }
    //     };
    //     fetchCalc();
    // }, [priceCalcInput]);

    // Enkel kalkylator state
    const [kontantMargin, setKontantMargin] = useState(8);
    const [leasingMargin, setLeasingMargin] = useState(8);
    const [cirkularMargin, setCirkularMargin] = useState(8);
    const [simpleResidual, setSimpleResidual] = useState(15);
    const [simpleResult, setSimpleResult] = useState(null);
    const [simpleLoading, setSimpleLoading] = useState(false);
    const [simpleError, setSimpleError] = useState('');

    // GSX-nyckel state
    const [gsxApiKey, setGsxApiKey] = useState('');
    const [gsxKeyStatus, setGsxKeyStatus] = useState('');

    // Lägg till state för prislistor och vald prislista om det saknas
    const [priceLists, setPriceLists] = useState([]);
    const [selectedPriceList, setSelectedPriceList] = useState('');

    // Lägg till state för rabattprogram och vald rabatt
    const [discounts, setDiscounts] = useState([]);
    const [selectedDiscount, setSelectedDiscount] = useState('');

    // Lägg till state för prisberäkning och prisinfo
    const [priceCalcLoading, setPriceCalcLoading] = useState(false);
    const [priceCalcResult, setPriceCalcResult] = useState(null);
    const [priceCalcInput, setPriceCalcInput] = useState(null);

    const [priceInfo, setPriceInfo] = useState(null);
    const [priceLoading, setPriceLoading] = useState(false);
    const [priceError, setPriceError] = useState('');
    const [priceResult, setPriceResult] = useState(null);



    // Hämta orderdata (sessionStorage eller URL)
    useEffect(() => {
        let order = null;
        try {
            const sessionOrder = sessionStorage.getItem('selectedOrder');
            if (sessionOrder) {
                order = JSON.parse(sessionOrder);
                setOrderData(order);
            }
        } catch (e) { }
        if (!order) {
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
                setError('No order data provided.');
            }
        }
    }, []);

    // Lägg till debug-logg för orderData
    useEffect(() => {
        console.log('[DEBUG] orderData:', orderData);
    }, [orderData]);

    // Hämta prislistor, rabatter
    useEffect(() => {
        const fetchPriceLists = async () => {
            try {
                const res = await fetch('/api/price/list');
                if (!res.ok) return;
                const files = await res.json();
                setPriceLists(files);
                if (files.length > 0) setSelectedPriceList(files[0]);
            } catch { }
        };
        const fetchDiscounts = async () => {
            try {
                const res = await fetch('/api/discounts/');
                if (!res.ok) return;
                const files = await res.json();
                setDiscounts(files);
            } catch { }
        };
        fetchPriceLists();
        fetchDiscounts();
    }, []);

    // Hämta prislistor vid sidladdning om det saknas
    useEffect(() => {
        fetch('/api/price/list')
            .then(res => res.json())
            .then(data => {
                setPriceLists(data);
                if (data.length > 0) setSelectedPriceList(data[0]);
            });
    }, []);

    // // Sätt input till kalkylatorn när order/prislista/rabatt ändras
    // useEffect(() => {
    //     if (!orderData || !selectedPriceList) return;
    //     // Hämta prisdata för artikelnr via API (ingen lokal matchning längre)
    //     const fetchPriceData = async () => {
    //         setPriceCalcLoading(true);
    //         setPriceCalcInput(null);
    //         setPriceCalcResult(null);
    //         try {
    //             const params = new URLSearchParams({
    //                 price_list_file: selectedPriceList,
    //                 part_number: orderData ? (orderData['Artikelnr (tillverkare)'] || '').trim() : '',
    //             });
    //             if (selectedDiscount) {
    //                 params.append('discount_program_name', selectedDiscount);
    //             }
    //             const res = await fetch(`/api/price/calculate?${params.toString()}`);
    //             const data = await res.json();
    //             if (!res.ok) throw new Error(data.error || 'Kunde inte hämta pris.');
    //             // Sätt input till kalkylatorn baserat på API-resultat
    //             setPriceCalcInput({
    //                 listPrice: data.list_price || 0,
    //                 discountedPrice: data.final_price || 0,
    //                 salesPrice: orderData['Tot Förs (SEK)'] ? parseFloat(orderData['Tot Förs (SEK)']) : 0,
    //                 margin: orderData['Tot Förs (SEK)'] && orderData['Tot Kost (SEK)']
    //                     ? parseFloat(orderData['Tot Förs (SEK)']) - parseFloat(orderData['Tot Kost (SEK)'])
    //                     : 0,
    //                 residualValue: 0,
    //                 businessType: 'leasing',
    //                 leasePeriod: 36,
    //                 circularChoice: false
    //             });
    //             setPriceCalcResult(data);
    //         } catch (e) {
    //             setPriceCalcInput(null);
    //             setPriceCalcResult(null);
    //             setError(e.message || 'Fel vid hämtning av pris.');
    //         } finally {
    //             setPriceCalcLoading(false);
    //         }
    //     };
    //     fetchPriceData();
    // }, [orderData, selectedPriceList, selectedDiscount]);

    // // Hämta prisinformation för artikelnummer och prislista (fallback om priceCalcResult saknas)
    useEffect(() => {
        if (!orderData || !selectedPriceList) return;
        const fetchPriceInfo = async () => {
            setPriceLoading(true);
            setPriceInfo(null);
            try {
                const partNumber = orderData ? (orderData['Artikelnr (tillverkare)'] || '').trim() : '';
                const params = new URLSearchParams({
                    part_number: partNumber,
                    price_list: selectedPriceList
                });
                if (selectedDiscount) {
                    // Sätt rabattprogrammet först i queryn som 'program_name'
                    params.delete('part_number');
                    params.delete('price_list');
                    params.append('program_name', selectedDiscount);
                    params.append('part_number', partNumber);
                    params.append('price_list', selectedPriceList);
                }
                const url = `/api/discounts/lookup?${params.toString()}`;
                console.log('[DEBUG] Fetching price info:', url);
                const res = await fetch(url, {
                    method: 'GET',
                    headers: { 'accept': 'application/json' }
                });
                if (!res.ok) {
                    const text = await res.text();
                    setError(`Failed to fetch price info (status ${res.status}): ${text}`);
                    return;
                }
                const data = await res.json();
                setPriceInfo(data);
                console.log('[DEBUG] priceInfo API-resultat:', data);
            } catch (e) {
                setPriceInfo(null);
                setError(e.message || 'Fel vid hämtning av grundpris.');
            } finally {
                setPriceLoading(false);
            }
        };
        fetchPriceInfo();
    }, [orderData, selectedPriceList, selectedDiscount]);

    // Hämta GSX-nyckel vid sidladdning
    useEffect(() => {
        const fetchGsxKey = async () => {
            try {
                // Ändra endpoint till /api/gsx/gsx-api-key
                const res = await fetch('/api/gsx/gsx-api-key');
                if (res.ok) {
                    const data = await res.json();
                    const key = data.api_key || data.apiKey || data.APIKey || '';
                    setGsxApiKey(key);
                    setGsxKeyStatus(key ? 'GSX API-nyckel finns.' : 'GSX API-nyckel saknas.');
                } else {
                    setGsxApiKey('');
                    setGsxKeyStatus('GSX API-nyckel kunde inte hämtas.');
                }
            } catch {
                setGsxApiKey('');
                setGsxKeyStatus('GSX API-nyckel kunde inte hämtas.');
            }
        };
        fetchGsxKey();
    }, []);

    // Hjälpfunktion för att normalisera serienummer
    function normalizeSerial(serial) {
        if (typeof serial !== 'string') return serial;
        // Om serienumret börjar med 'S' och är 11 tecken långt, ta bort 'S'
        if (serial.length === 11 && serial[0].toUpperCase() === 'S') {
            return serial.slice(1);
        }
        return serial;
    }

    // GSX-detaljer (ny metodik)
    const fetchGsxDetails = async () => {
        const serialNumber = orderData?.['Serienr'];
        if (!serialNumber || !gsxApiKey) return;
        setLoading(true);
        setError('');
        setGsxDetails(null);
        let fetchSuccess = false;
        let lastError = null;

        // Testa först med normaliserat serienummer (utan S om 11 tecken och börjar med S)
        const normalized = normalizeSerial(serialNumber);
        if (normalized !== serialNumber) {
            try {
                const fetchOptions = { headers: { 'X-GSX-API-KEY': gsxApiKey } };
                const res = await fetch(`/api/gsx/device-details/${normalized}`, fetchOptions);
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.device) {
                        setGsxDetails(data.device);
                        fetchSuccess = true;
                    }
                } else {
                    lastError = `[GSX] misslyckades (normalized serial): ${normalized}, status: ${res.status}`;
                }
            } catch (e) {
                lastError = `[GSX] exception (normalized serial): ${normalized}, error: ${e}`;
            }
        }
        // Testa alltid även med originalet om normaliserat misslyckades
        if (!fetchSuccess) {
            try {
                const fetchOptions = { headers: { 'X-GSX-API-KEY': gsxApiKey } };
                const res = await fetch(`/api/gsx/device-details/${serialNumber}`, fetchOptions);
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.device) {
                        setGsxDetails(data.device);
                        fetchSuccess = true;
                    }
                } else {
                    lastError = `[GSX] misslyckades (original serial): ${serialNumber}, status: ${res.status}`;
                }
            } catch (e) {
                lastError = `[GSX] exception (original serial): ${serialNumber}, error: ${e}`;
            }
        }
        if (!fetchSuccess) {
            setError('Fel vid hämtning av GSX-data.');
            if (lastError) console.error(lastError);
        }
        setLoading(false);
    };

    // Hämta GSX-detaljer när orderData eller gsxApiKey ändras
    useEffect(() => {
        if (orderData && gsxApiKey) fetchGsxDetails();
    }, [orderData, gsxApiKey]);

    // Export till Excel (oförändrat)
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


    // Hämta prisinformation och beräkna pris med priceUtil-logik
    useEffect(() => {
        if (!selectedPriceList || !(orderData && orderData['Artikelnr (tillverkare)'])) return;
        setPriceLoading(true);
        setPriceError('');
        setPriceResult(null);
        const partNumber = orderData ? (orderData['Artikelnr (tillverkare)'] || '').trim() : '';
        import('/frontend/js/priceUtils.js').then(({ fetchPriceCalculation }) => {
            fetchPriceCalculation({
                partNumber,
                priceList: selectedPriceList,
                discountProgram: selectedDiscount
            })
                .then(setPriceResult)
                .catch(err => setPriceError(err.message))
                .finally(() => setPriceLoading(false));
        });
    }, [selectedPriceList, selectedDiscount, orderData]);

    // Enkel kalkylator (priceUtil-logik)
    const handleSimpleCalc = async () => {
        setSimpleLoading(true);
        setSimpleError('');
        setSimpleResult(null);
        try {
            const alp = parseFloat((priceResult?.list_price ?? orderData['Tot Kost (SEK)'] ?? 0).toString().replace(',', '.')) || orderData['Tot Kost (SEK)'] || 0;
            const inkopspris = parseFloat((priceResult?.new_price ?? orderData['Tot Kost (SEK)'] ?? 0).toString().replace(',', '.')) || orderData['Tot Kost (SEK)'] || 0;
            const { calculateSimplePrice } = await import('/frontend/js/priceUtils.js');
            const result = await calculateSimplePrice({
                inkopspris,
                restvardeProcent: simpleResidual,
                alp_price: alp,
                kontantMargin,
                leasingMargin,
                circularMargin: cirkularMargin
            });
            setSimpleResult(result);
        } catch (err) {
            setSimpleError(err.message);
        } finally {
            setSimpleLoading(false);
        }
    };

    // --- UI ---
    const serialNumber = orderData ? orderData['Serienr'] : '';

   

    // Marginal- och jämförelseberäkning
    const comparison = React.useMemo(() => {
        if (!orderData || !priceInfo) return null;
        // Försök använda inköpspris från orderData om priceInfo.new_price saknas
        const salesPrice = parseFloat(orderData['Tot Förs (SEK)']) || 0;
        const costPrice = parseFloat(orderData['Tot Kost (SEK)']) || 0;
        // Använd priceInfo.new_price om finns, annars orderData['Tot Kost (SEK)']
        const purchasePrice = priceInfo.new_price !== undefined && priceInfo.new_price !== null
            ? parseFloat(priceInfo.new_price) || 0
            : costPrice;

        // const margin = salesPrice - purchasePrice;
        // const marginPercent = salesPrice ? (margin / salesPrice) * 100 : 0;
        const diffToCost = purchasePrice - costPrice;
        const diffToSales = salesPrice - purchasePrice;

        return {
            salesPrice,
            costPrice,
            purchasePrice,
            //   margin,
            //   marginPercent,
            diffToCost,
            diffToSales
        };
    }, [orderData, priceInfo]);

    return (
        <div className="container">
            {/* Visa error högst upp */}
            {error && (
                <div
                    className="alert alert-danger"
                    style={{
                        marginTop: '2rem',
                        marginBottom: '2rem',
                        padding: '1rem 1.5rem',
                        backgroundColor: '#f8d7da',
                        color: '#721c24',
                        border: '1px solid #f5c6cb',
                        borderRadius: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                    }}
                >
                    <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                    <span>{error}</span>
                </div>
            )}

            <header className="atea-header">
                <div className="header-content">
                    <a href="/frontend/"><img src="/frontend/images/logo.jpg" alt="Atea Logo" className="header-logo" style={{ height: '50px' }} /></a>
                    <div>
                        <h1>Orderdetails</h1>
                        <p>Ordernummer: {orderData ? orderData['Ordernr'] : ''}</p>
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
                    <div className="detail-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'flex-start' }}>
                        <div className="detail-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                            <span className="detail-label">Kund</span>
                            <span className="detail-value" style={{ fontSize: '1.1rem', fontWeight: '600' }}>{orderData ? orderData['Kund'] : ''}</span>
                        </div>
                        <div className="detail-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                            <span className="detail-label">Ordernummer</span>
                            <span className="detail-value">{orderData ? orderData['Ordernr'] : ''}</span>
                        </div>
                        <div className="detail-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                            <span className="detail-label">Bokföringsdatum</span>
                            <span className="detail-value">{orderData ? orderData['Bokf datum'] : ''}</span>
                        </div>
                        <div className="detail-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                            <span className="detail-label">Verifikationsnummer</span>
                            <span className="detail-value">{orderData ? orderData['Ver nr'] : ''}</span>
                        </div>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '1.5rem', paddingTop: '1.5rem' }}>
                        <h4 style={{ marginTop: 0, marginBottom: '1rem' }}>Produktspecifikation</h4>
                        <div className="detail-grid" style={{ gridTemplateColumns: '1fr', gap: '1rem' }}>
                            <div className="detail-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                <span className="detail-label">Artikelbenämning</span>
                                <span className="detail-value">{orderData ? orderData['Artikelbenämning (APA)'] : ''}</span>
                            </div>
                            <div className="detail-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                <span className="detail-label">Serienummer</span>
                                <span className="detail-value" style={{ fontWeight: '600' }}>{orderData ? orderData['Serienr'] : ''}</span>
                            </div>
                            <div className="detail-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                <span className="detail-label">Tillverkarens artikelnr.</span>
                                <span className="detail-value">{orderData ? orderData['Artikelnr (tillverkare)'] : ''}</span>
                            </div>
                        </div>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '1.5rem', paddingTop: '1.5rem' }}>
                        <h4 style={{ marginTop: 0, marginBottom: '1rem' }}>Ekonomi</h4>
                        <div className="detail-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                            <div className="detail-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                <span className="detail-label">Antal</span>
                                <span className="detail-value">{orderData ? orderData['Antal'] : ''}</span>
                            </div>
                            <div className="detail-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                <span className="detail-label">Försäljningspris (SEK)</span>
                                <span className="detail-value">{orderData ? orderData['Tot Förs (SEK)'] : ''}</span>
                            </div>
                            <div className="detail-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                <span className="detail-label">Kostnadspris (SEK)</span>
                                <span className="detail-value">{orderData ? orderData['Tot Kost (SEK)'] : ''}</span>
                            </div>
                        </div>

                        {/* Marginalboxar under försäljningspris och kostnadspris */}
                        {orderData && (
                            <div className="detail-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>

                                {renderMarginFromOrderData(parseFloat(orderData['Tot Kost (SEK)']), parseFloat(orderData['Tot Förs (SEK)']))}
                            </div>
                        )}

                        {/* rendera prisinformatio försäljningspris och kostnadspris */}
                        {orderData && (
                            <div
                                className="detail-grid"
                                style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}
                            >
                                {priceInfo && Object.keys(priceInfo).length > 0 && (
                                    <div className="price-info-wrapper" style={{ gridColumn: '1 / -1' }}>
                                        {/* Rabattprogram-dropdown */}
                                        {/* <div
                                            className="rendered-discount-dropdown"
                                            dangerouslySetInnerHTML={{ __html: renderDiscountDropdown() }}
                                        /> */}

                                        {/* Produktprisinfo */}
                                        <div
                                            className="rendered-product-info"
                                            dangerouslySetInnerHTML={{ __html: renderProductPriceInfo(priceInfo) }}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                    </div>

                </div>
                {/* --- GSX-information --- */}
                <div className="section">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '2rem' }}>
                        <h2 style={{ color: 'var(--atea-black)', margin: 0, border: 'none' }}>GSX Information</h2>
                        <span style={{ fontSize: '0.95em', color: '#888' }}>{gsxKeyStatus}</span>
                    </div>
                    {loading && <div className="loading"><div className="spinner"></div><p>Hämtar GSX-detaljer...</p></div>}
                    {/* Ta bort error härifrån, visas nu högst upp */}
                    {gsxDetails ? (
                        <window.GsxDetailsView gsxDetails={gsxDetails} serial={serialNumber} />
                    ) : (
                        !loading && !error && <p>GSX-information saknas för denna enhet.</p>
                    )}
                </div>
            </main>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<SalesOrderDetailPage />);

