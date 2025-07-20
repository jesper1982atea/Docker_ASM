const handleBulkExport = async () => {
        if (!augmentedData || augmentedData.length === 0) {
            alert("Ingen data att exportera.");
            return;
        }
        if (!gsxEnabled) {
            alert("GSX är inte aktiverat eller API-nyckel saknas.");
            return;
        }
        setIsExporting(true);
        setExportProgress(0);
        const exportData = [];
        const totalRows = augmentedData.length;
        for (let i = 0; i < totalRows; i++) {
            const row = augmentedData[i];
            exportData.push({ ...row });
            setExportProgress(((i + 1) / totalRows) * 100);
        }
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Säljdata med GSX");
        const colWidths = Object.keys(exportData[0] || {}).map(key => ({ wch: Math.max(key.length, 18) }));
        worksheet["!cols"] = colWidths;
        XLSX.writeFile(workbook, "Säljdata_Export.xlsx");
        setIsExporting(false);
    };
console.log('[sales-upload] sales-upload.js loaded!');

if (typeof window.useGsxApiKey !== 'function') {
    const root = document.getElementById('root');
    if (root) {
        root.innerHTML = '<div style="color:red;padding:2em">Fel: window.useGsxApiKey är inte laddad!<br>Kontrollera att gsx-api-key.js laddas innan sales-upload.js.</div>';
    }
    console.error('[sales-upload] Fel: window.useGsxApiKey är inte laddad!');
    // Stoppa vidare körning
    throw new Error('window.useGsxApiKey är inte laddad!');
}

const { useState, useEffect, useMemo } = React;
const useGsxApiKey = window.useGsxApiKey;

function Pagination({ currentPage, totalPages, onPageChange }) {
    if (totalPages <= 1) {
        return null;
    }

    const handlePageClick = (page) => {
        if (page >= 1 && page <= totalPages) {
            onPageChange(page);
        }
    };

    const pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage, endPage;

    if (totalPages <= maxPagesToShow) {
        startPage = 1;
        endPage = totalPages;
    } else {
        if (currentPage <= Math.ceil(maxPagesToShow / 2)) {
            startPage = 1;
            endPage = maxPagesToShow;
        } else if (currentPage + Math.floor(maxPagesToShow / 2) >= totalPages) {
            startPage = totalPages - maxPagesToShow + 1;
            endPage = totalPages;
        } else {
            startPage = currentPage - Math.floor(maxPagesToShow / 2);
            endPage = currentPage + Math.floor(maxPagesToShow / 2);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
    }

    return (
        <nav className="pagination">
            <button onClick={() => handlePageClick(currentPage - 1)} disabled={currentPage === 1}>
                &laquo; Föregående
            </button>
            
            {startPage > 1 && (
                <React.Fragment>
                    <button onClick={() => handlePageClick(1)}>1</button>
                    {startPage > 2 && <span className="page-ellipsis">...</span>}
                </React.Fragment>
            )}

            {pageNumbers.map(number => (
                <button 
                    key={number} 
                    onClick={() => handlePageClick(number)} 
                    className={currentPage === number ? 'active' : ''}
                >
                    {number}
                </button>
            ))}

            {endPage < totalPages && (
                <React.Fragment>
                    {endPage < totalPages - 1 && <span className="page-ellipsis">...</span>}
                    <button onClick={() => handlePageClick(totalPages)}>{totalPages}</button>
                </React.Fragment>
            )}

            <button onClick={() => handlePageClick(currentPage + 1)} disabled={currentPage === totalPages}>
                Nästa &raquo;
            </button>
        </nav>
    );
}


function SalesUploader() {
    const [file, setFile] = useState(null);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;
    // (customers och selectedCustomer behövs ej)
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);

    // New state for price list integration
    const [priceLists, setPriceLists] = useState([]);
    const [selectedPriceList, setSelectedPriceList] = useState('');
    const [priceMap, setPriceMap] = useState(new Map());


    // GSX API-nyckel state och hantering (samma logik som gsx-search.js)
    const { gsxApiKey, loading: gsxLoading, error: gsxError } = useGsxApiKey({ redirectIfMissing: false });
    const [gsxApiKeyInput, setGsxApiKeyInput] = useState('');
    const [gsxApiKeySaved, setGsxApiKeySaved] = useState(false);
    const [gsxSaveError, setGsxSaveError] = useState('');
    const [gsxEnabled, setGsxEnabled] = useState(false);
    const [gsxTested, setGsxTested] = useState(false);
    const [gsxStatusMsg, setGsxStatusMsg] = useState('');

    // Ladda in nuvarande nyckel till inputfältet när den hämtats
    useEffect(() => {
        if (gsxApiKey !== undefined && gsxApiKey !== null) {
            setGsxApiKeyInput(gsxApiKey);
        }
    }, [gsxApiKey]);

    // Spara GSX API-nyckel
    const handleGsxApiKeySave = async (e) => {
        e.preventDefault();
        setGsxApiKeySaved(false);
        setGsxSaveError('');
        try {
            const res = await fetch('/api/gsx/gsx-api-key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ api_key: gsxApiKeyInput })
            });
            const data = await res.json();
            if (data.success) {
                setGsxApiKeySaved(true);
            } else {
                setGsxSaveError(data.error || 'Fel vid sparande');
            }
        } catch {
            setGsxSaveError('Nätverksfel vid sparande');
        }
    };

    // Logga varför exportknappen är inaktiv
    useEffect(() => {
        if (!data) {
            console.log('[sales-upload] Exportknapp inaktiv: ingen data');
        } else if (!gsxEnabled) {
            console.log('[sales-upload] Exportknapp inaktiv: GSX ej aktiverat');
        } else if (isExporting) {
            console.log('[sales-upload] Exportknapp inaktiv: export pågår');
        } else {
            console.log('[sales-upload] Exportknapp AKTIV');
        }
    }, [data, gsxEnabled, isExporting]);

    useEffect(() => {
        // Fetch available price lists
        const fetchPriceLists = async () => {
            try {
                const res = await fetch('/api/price/list');
                if (!res.ok) throw new Error('Could not fetch price lists');
                const files = await res.json();
                setPriceLists(files);
                if (files.length > 0) {
                    setSelectedPriceList(files[0]); // Select the most recent one
                }
            } catch (e) {
                console.error("Failed to fetch price lists", e);
            }
        };
        // Hämta GSX API-nyckel och inställning från backend (fixad endpoint)
        const fetchGsxConfig = async () => {
            try {
                const res = await fetch('/api/gsx/gsx-api-key');
                if (res.ok) {
                    let data = null;
                    try {
                        data = await res.json();
                    } catch (jsonErr) {
                        setGsxEnabled(false);
                        setGsxStatusMsg('GSX API-nyckel kunde inte tolkas (ej JSON).');
                        console.log('[sales-upload] GSX API-nyckel kunde inte tolkas (ej JSON):', jsonErr);
                        return;
                    }
                    // Hämta nyckel oavsett stavning
                    const key = data.api_key || data.apiKey || data.APIKey || '';
                    console.log('[sales-upload] /api/gsx/gsx-api-key response:', data, 'Tolkat key:', key);
                    if (key) {
                        setGsxEnabled(true);
                        setGsxStatusMsg('GSX API-nyckel finns. Export är aktiverad.');
                        setGsxApiKeyInput(key);
                        console.log('[sales-upload] GSX aktiverad, apiKey:', key);
                    } else {
                        setGsxEnabled(false);
                        setGsxStatusMsg('GSX API-nyckel saknas.');
                        console.log('[sales-upload] GSX INTE aktiverad, apiKey saknas');
                    }
                } else {
                    setGsxEnabled(false);
                    setGsxStatusMsg('GSX API-nyckel kunde inte hämtas.');
                    console.log('[sales-upload] GSX API-nyckel kunde inte hämtas (HTTP error)');
                }
            } catch (err) {
                setGsxEnabled(false);
                setGsxStatusMsg('GSX API-nyckel kunde inte hämtas.');
                console.log('[sales-upload] GSX API-nyckel kunde inte hämtas (exception):', err);
            } finally {
                setGsxTested(true);
            }
        };

        fetchPriceLists();
        fetchGsxConfig();
    }, []);

    // Effect to load the selected price list data and create a lookup map
    useEffect(() => {
        if (!selectedPriceList) {
            setPriceMap(new Map());
            return;
        }
        const loadPriceData = async () => {
            try {
                const res = await fetch(`/api/price/data/${selectedPriceList}`);
                if (!res.ok) throw new Error(`Failed to load price data for ${selectedPriceList}`);
                const priceData = await res.json();
                const newPriceMap = new Map(priceData.map(item => [item['Part Number'], item['ALP Ex VAT']]));
                setPriceMap(newPriceMap);
                console.log(`Price map created with ${newPriceMap.size} entries.`);
            } catch (e) {
                console.error(e);
                setError(`Error loading price list: ${e.message}`);
                setPriceMap(new Map());
            }
        };
        loadPriceData();
    }, [selectedPriceList]);


    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
        setData(null);
        setError('');
        setCurrentPage(1);
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file first.');
            return;
        }

        setLoading(true);
        setError('');
        setData(null);
        setCurrentPage(1);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/sales/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if (result && result.length > 0) {
                setData(result);
            } else {
                setError('No data found in the file or file is empty.');
            }
        } catch (e) {
            setError(`Upload failed: ${e.message}`);
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const augmentedData = useMemo(() => {
        if (!data) return null;
        if (priceMap.size === 0) return data;
        return data.map(row => {
            const partNumber = row['Artikelnr (tillverkare)'];
            const alpPrice = priceMap.get(partNumber);
            return {
                ...row,
                'ALP Ex VAT': alpPrice !== undefined ? alpPrice : 'N/A'
            };
        });
    }, [data, priceMap]);

    const headers = useMemo(() => {
        if (!augmentedData || augmentedData.length === 0) return [];
        const originalHeaders = Object.keys(augmentedData[0]).filter(h => h !== 'ALP Ex VAT');
        const finalHeaders = [...originalHeaders];
        if (priceMap.size > 0) {
            finalHeaders.push('ALP Ex VAT');
        }
        return finalHeaders;
    }, [augmentedData, priceMap]);

    // Hjälpfunktion för att normalisera serienummer
    function normalizeSerial(serial) {
        if (typeof serial !== 'string') return serial;
        // Om serienumret börjar med S och är längre än 12 tecken, ta bort S
        if (serial.length > 12 && serial[0].toUpperCase() === 'S') {
            return serial.slice(1);
        }
        return serial;
    }


    const handleRowClick = (row) => {
        const rowData = encodeURIComponent(JSON.stringify(row));
        window.location.href = `/sales-order-detail?data=${rowData}`;
    };

    const totalPages = augmentedData ? Math.ceil(augmentedData.length / itemsPerPage) : 0;
    const paginatedData = augmentedData ? augmentedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) : [];

    return (
        <div className="container" style={{ maxWidth: '95%', margin: '2rem auto' }}>
            <header className="atea-header">
                <div className="header-content">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <a href="/"><img src="/images/logo.jpg" alt="Atea Logo" className="header-logo" style={{ height: '50px' }} /></a>
                        <div>
                            <h1>Atea Sales Data</h1>
                            <p>Ladda upp och granska Excel-fil med säljinformation</p>
                        </div>
                    </div>
                </div>
            </header>
            
            <main style={{ marginTop: '2rem' }}>
                <div className="card" style={{ padding: '2rem' }}>
                    <h3>Ladda upp Excel-fil</h3>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1rem' }}>
                        <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="form-control" />
                        <button onClick={handleUpload} disabled={loading || !file} className="btn btn-primary">
                            {loading ? 'Laddar upp...' : 'Ladda upp och granska'}
                        </button>
                    </div>
                    {error && <p style={{ color: 'var(--atea-red)', marginTop: '1rem' }}>{error}</p>}

                    <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '2rem', paddingTop: '1.5rem' }}>
                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem'}}>
                            <div>
                                <h4>Exportera med GSX-data</h4>
                                <p style={{color: gsxEnabled ? 'var(--atea-green)' : 'var(--atea-red)'}}>
                                    {gsxTested ? gsxStatusMsg : 'Kontrollerar GSX-konfiguration...'}
                                </p>
                                <div style={{display:'flex', gap:'1em', flexWrap:'wrap', alignItems:'center'}}>
                                    <button
                                        onClick={handleBulkExport}
                                        disabled={!augmentedData || !gsxEnabled || isExporting}
                                        className="btn btn-success"
                                    >
                                        {isExporting ? `Exporterar... (${Math.round(exportProgress)}%)` : 'Exportera allt till Excel'}
                                    </button>
                                    <button className="btn btn-info" style={{minWidth:'220px'}} onClick={() => {
                                        try {
                                            if (!augmentedData || !Array.isArray(augmentedData) || augmentedData.length === 0) {
                                                alert('Ingen data att visa. Ladda upp och granska en fil först.');
                                                return;
                                            }
                                            const json = JSON.stringify(augmentedData);
                                            // Kontrollera storlek (ca 5MB gräns för sessionStorage)
                                            if (json.length > 4_500_000) {
                                                alert('Data är för stor för att visas i sammanställningen. Prova med en mindre fil.');
                                                return;
                                            }
                                            sessionStorage.setItem('customerProductSummaryData', json);
                                            window.location.href = '/customer-product-summary';
                                        } catch (e) {
                                            alert('Kunde inte spara data i sessionStorage. Prova en mindre fil.');
                                            return;
                                        }
                                    }}>
                                        Visa produktsammanställning
                                    </button>
                                </div>
                                {isExporting && (
                                    <div className="progress-bar" style={{marginTop: '1rem'}}>
                                        <div className="progress-bar-inner" style={{width: `${exportProgress}%`}}></div>
                                    </div>
                                )}
                            </div>
                            <div>
                                <h4>Prisuppslag</h4>
                                <p>Välj en prislista för att se kostnadspris (ALP Ex VAT) för varje artikel.</p>
                                <div className="form-group">
                                    <label>Välj prislista</label>
                                    <select value={selectedPriceList} onChange={e => setSelectedPriceList(e.target.value)} disabled={priceLists.length === 0}>
                                        {priceLists.length > 0 ? (
                                            priceLists.map(f => <option key={f} value={f}>{f}</option>)
                                        ) : (
                                            <option>Inga prislistor hittades</option>
                                        )}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {loading && <div className="loading" style={{marginTop: '2rem'}}><div className="spinner"></div><p>Läser filen...</p></div>}

                {augmentedData && (
                    <div className="card" style={{ marginTop: '2rem', overflowX: 'auto' }}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem'}}>
                            <h3>Granska data ({augmentedData.length} rader)</h3>
                            <Pagination 
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                        <table className="table">
                            <thead>
                                <tr>
                                    {headers.map(header => <th key={header}>{header}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedData.map((row, index) => (
                                    <tr key={index} onClick={() => handleRowClick(row)} style={{cursor: 'pointer'}}>
                                        {headers.map(header => <td key={`${index}-${header}`}>{row[header]}</td>)}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem'}}>
                            <Pagination 
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

// Se till att window.useGsxApiKey är laddad innan SalesUploader används
function waitForGsxApiKeyHook(cb) {
    if (typeof window.useGsxApiKey === 'function') {
        cb(window.useGsxApiKey);
    } else {
        setTimeout(() => waitForGsxApiKeyHook(cb), 50);
    }
}

waitForGsxApiKeyHook(function(useGsxApiKey) {
    try {
        console.log('[sales-upload] waitForGsxApiKeyHook triggered');
        const container = document.getElementById('root');
        if (!container) {
            console.error('[sales-upload] #root element not found');
            return;
        }
        if (!container._reactRootContainer) {
            container._reactRootContainer = ReactDOM.createRoot(container);
            console.log('[sales-upload] React root created');
        } else {
            console.log('[sales-upload] React root already exists');
        }
        // Rendera riktiga appen direkt
        container._reactRootContainer.render(<SalesUploader />);
        console.log('[sales-upload] SalesUploader rendered');
    } catch (err) {
        console.error('[sales-upload] Fatal error during root render:', err);
        if (container) {
            container.innerHTML = '<div style="color:red;padding:2em">Fel vid root-rendering: ' + (err && err.message ? err.message : err) + '</div>';
        }
    }
});

