const { useState, useEffect } = React;

function DiscountAdminPage() {
    // State for program list and upload
    const [discounts, setDiscounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [programName, setProgramName] = useState('');
    const [rawPreviewData, setRawPreviewData] = useState(null); // For debugging

    // State for viewing a program
    const [viewedProgramData, setViewedProgramData] = useState(null);
    const [viewedProgramName, setViewedProgramName] = useState('');
    const [loadingView, setLoadingView] = useState(false);

    // State for global functional discounts
    const [functionalDiscounts, setFunctionalDiscounts] = useState([]);
    const [loadingFunctional, setLoadingFunctional] = useState(true);

    // State for price lists and category discounts
    const [priceLists, setPriceLists] = useState([]);
    const [selectedPriceList, setSelectedPriceList] = useState('');
    const [categories, setCategories] = useState([]);
    const [categoryDiscounts, setCategoryDiscounts] = useState([]);

    const fetchDiscounts = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/discounts/');
            if (!res.ok) throw new Error('Could not fetch discount programs');
            const data = await res.json();
            setDiscounts(data);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchFunctionalDiscounts = async () => {
        setLoadingFunctional(true);
        try {
            const res = await fetch('/api/discounts/functional');
            if (!res.ok) throw new Error('Could not fetch functional discounts');
            const data = await res.json();
            setFunctionalDiscounts(data);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoadingFunctional(false);
        }
    };

    // Hämta prislistor vid start
    useEffect(() => {
        fetch('/api/price/list')
            .then(res => res.json())
            .then(data => {
                setPriceLists(data);
                if (data.length > 0) setSelectedPriceList(data[0]);
            });
    }, []);

    // Hämta kategorier när prislista väljs
    useEffect(() => {
        if (!selectedPriceList) return;
        fetch(`/api/price/data/${selectedPriceList}`)
            .then(res => res.json())
            .then(data => {
                const cats = [...new Set(data.map(row => row.Category).filter(Boolean))].sort();
                setCategories(cats);
                // Initiera rabatter om de inte finns
                setCategoryDiscounts(cats.map(cat => {
                    const existing = functionalDiscounts.find(fd => fd.category === cat);
                    return { category: cat, discount: existing ? existing.discount : 0 };
                }));
            });
    }, [selectedPriceList, functionalDiscounts]);

    useEffect(() => {
        fetchDiscounts();
        fetchFunctionalDiscounts();
    }, []);

    const handleFileChange = (event) => {
        const f = event.target.files[0];
        if (!f) return;
        setFile(f);
        setError(''); // Clear previous errors
        setPreviewData(null);
        setRawPreviewData(null);
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // Explicitly skip the first two rows and use the third row (index 2) as the header.
                // The `range` option tells the parser where to start reading data from.
                const json = XLSX.utils.sheet_to_json(worksheet, { range: 2 });

                // Helper to trim whitespace from object keys
                const trimKeys = (arr) => arr.map(obj => 
                    Object.keys(obj).reduce((acc, key) => {
                        acc[key.trim()] = obj[key];
                        return acc;
                    }, {})
                );

                const cleanedJson = trimKeys(json);
                setRawPreviewData(cleanedJson); // Save raw data for debugging view

                if (cleanedJson.length > 0) {
                    console.log("DEBUG: Kolumnnamn som hittades i första raden:", Object.keys(cleanedJson[0]));
                }

                // Hämta programnamnet från första raden med data
                const programNameFromFile = cleanedJson.length > 0 && cleanedJson[0]['Program Name'] ? cleanedJson[0]['Program Name'] : f.name.replace(/\.(xlsx|xls)$/, '');
                setProgramName(programNameFromFile);

                // Keep all data, but ensure key columns exist for filtering
                const sanitizedData = cleanedJson
                    .filter(row => row['Product Class'] && row['Rebate Rate (%)'] !== undefined)
                    .map(row => {
                        // Create a new object to avoid modifying the raw data
                        const newRow = {...row};
                        let rate = newRow['Rebate Rate (%)'];
                        if (typeof rate === 'string') {
                            rate = rate.replace('%', '').trim();
                        }
                        const rateFloat = parseFloat(rate);
                        // Overwrite the original column with the calculated decimal rate
                        newRow['Rebate Rate (%)'] = !isNaN(rateFloat) ? (rateFloat > 1 ? rateFloat / 100 : rateFloat) : 0;
                        return newRow;
                    });

                setPreviewData(sanitizedData);

                if (sanitizedData.length === 0 && cleanedJson.length > 0) {
                    setError("Filen lästes in, men inga giltiga rader med både 'Product Class' och 'Rebate Rate (%)' hittades. Granska rådatan nedan för att verifiera kolumnrubriker och innehåll.");
                }

            } catch (err) {
                setError('Kunde inte läsa filen. Se till att den är i rätt format och att rubrikerna är på rad 3.');
                console.error("FEL vid inläsning av fil i handleFileChange:", err);
            }
        };
        reader.readAsArrayBuffer(f);
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Välj en fil att ladda upp.');
            return;
        }

        setUploading(true);
        setError('');

        const formData = new FormData();
        formData.append('file', file);

        console.log("DEBUG: Skickar fil till /api/discounts/upload:", file.name);

        try {
            const response = await fetch('/api/discounts/upload', {
                method: 'POST',
                body: formData, // Send the file directly
            });
            if (!response.ok) {
                let errorText = 'Kunde inte ladda upp och spara programmet.';
                // Read the response body once as text to avoid "Body is disturbed" error.
                const responseText = await response.text();
                try {
                    // Try to parse the text as JSON.
                    const errData = JSON.parse(responseText);
                    errorText = errData.error || JSON.stringify(errData);
                } catch (e) {
                    // If parsing fails, the error is likely plain text.
                    errorText = responseText;
                }
                throw new Error(errorText);
            }
            // Reset fields and refresh list
            setFile(null);
            setPreviewData(null);
            setProgramName('');
            setRawPreviewData(null);
            fetchDiscounts();
            const result = await response.json();
            alert(result.message || 'Rabattprogrammet har laddats upp!');
        } catch (err) {
            console.error("FEL vid uppladdning:", err);
            setError(`Ett fel uppstod vid uppladdning: ${err.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (programNameToDelete) => {
        if (!window.confirm(`Är du säker på att du vill radera rabattprogrammet "${programNameToDelete}"?`)) {
            return;
        }
        try {
            // The name from the list is already sanitized, so we just need to encode it for the URL.
            const encodedProgramName = encodeURIComponent(programNameToDelete);
            const response = await fetch(`/api/discounts/${encodedProgramName}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Kunde inte radera programmet.');
            }
            fetchDiscounts(); // Refresh the list
        } catch (err) {
            setError(err.message);
        }
    };

    const handleViewProgram = async (programName) => {
        setLoadingView(true);
        setViewedProgramData(null); // Clear previous data
        setViewedProgramName(programName);
        setError('');
        try {
            // The name from the list is already sanitized, so we just need to encode it for the URL.
            // The backend will handle adding the .json extension.
            const encodedProgramName = encodeURIComponent(programName);
            const res = await fetch(`/api/discounts/${encodedProgramName}`);
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || `Kunde inte hämta programmet ${programName}`);
            }
            const data = await res.json();
            setViewedProgramData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingView(false);
        }
    };

    // --- Handlers for Functional Discounts ---
    const handleAddFunctionalDiscount = () => {
        setFunctionalDiscounts([...functionalDiscounts, { category: 'Mac', discount: 0.125 }]);
    };

    const handleFunctionalDiscountChange = (index, field, value) => {
        const updated = [...functionalDiscounts];
        if (field === 'discount') {
            // Convert percentage from input to decimal for saving
            updated[index][field] = (parseFloat(value) || 0) / 100;
        } else {
            updated[index][field] = value;
        }
        setFunctionalDiscounts(updated);
    };

    const handleRemoveFunctionalDiscount = (index) => {
        const updated = functionalDiscounts.filter((_, i) => i !== index);
        setFunctionalDiscounts(updated);
    };

    const handleSaveFunctionalDiscounts = async () => {
        setLoadingFunctional(true);
        try {
            const res = await fetch('/api/discounts/functional', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(functionalDiscounts)
            });
            if (!res.ok) throw new Error('Failed to save functional discounts');
            alert('Globala funktionella rabatter har sparats!');
            fetchFunctionalDiscounts(); // Refresh to confirm
        } catch (e) {
            setError(e.message);
        } finally {
            setLoadingFunctional(false);
        }
    };

    // Hantera ändring av rabatt för kategori
    const handleCategoryDiscountChange = (index, value) => {
        const updated = [...categoryDiscounts];
        updated[index].discount = (parseFloat(value) || 0) / 100;
        setCategoryDiscounts(updated);
    };

    // Spara kategori-rabatter som nya funktionella rabatter
    const handleSaveCategoryDiscounts = async () => {
        setLoadingFunctional(true);
        try {
            const res = await fetch('/api/discounts/functional', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(categoryDiscounts)
            });
            if (!res.ok) throw new Error('Failed to save functional discounts');
            alert('Kategori-rabatter har sparats!');
            fetchFunctionalDiscounts();
        } catch (e) {
            setError(e.message);
        } finally {
            setLoadingFunctional(false);
        }
    };

    return (
        <div className="container">
            <header className="atea-header">
                <div className="header-content">
                    <a href="/"><img src="/frontend/images/logo.jpg" alt="Atea Logo" className="header-logo" style={{ height: '50px' }} /></a>
                    <div>
                        <h1>Hantera Rabattprogram</h1>
                        <p>Ladda upp och administrera rabattavtal.</p>
                    </div>
                </div>
                <div className="header-links">
                    <a href="/" className="header-link">⬅️ Tillbaka till Admin</a>
                </div>
            </header>

            {/* --- View Program Modal --- */}
            {viewedProgramName && (
                <div className="modal-overlay" onClick={() => setViewedProgramName('')}>
                    <div className="modal-content card" onClick={e => e.stopPropagation()}>
                        <h3>Granskar program: {viewedProgramName}</h3>
                        {loadingView ? (
                            <div className="loading"><div className="spinner-small"></div><p>Laddar...</p></div>
                        ) : viewedProgramData && viewedProgramData.length > 0 ? (
                            <div className="table-container" style={{ marginTop: '1.5rem', maxHeight: '60vh', overflowY: 'auto' }}>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            {Object.keys(viewedProgramData[0]).map(key => <th key={key}>{key}</th>)}
                                            <th>Total rabatt (%)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {viewedProgramData.map((row, index) => {
                                            // Hitta funktionell rabatt för denna kategori
                                            const func = categoryDiscounts.find(fd => fd.category === row['Product Class'] || fd.category === row['Category']);
                                            const funcDiscount = func ? func.discount : 0;
                                            const fileDiscount = typeof row['Rebate Rate (%)'] === 'number' ? row['Rebate Rate (%)'] : 0;
                                            const totalDiscount = ((funcDiscount + fileDiscount) * 100).toFixed(2);
                                            return (
                                                <tr key={index}>
                                                    {Object.keys(row).map(key => {
                                                        let value = row[key];
                                                        // Format the rebate rate column specifically as a percentage
                                                        if (key.toLowerCase().includes('rebate rate') && typeof value === 'number') {
                                                            value = `${(value * 100).toFixed(2)}%`;
                                                        } else if (value === null || value === undefined) {
                                                            value = ''; // Display empty string for null/undefined
                                                        }
                                                        return <td key={key}>{String(value)}</td>;
                                                    })}
                                                    <td>{totalDiscount}%</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : <p>Kunde inte ladda programdata eller så är programmet tomt.</p>}
                        <button onClick={() => setViewedProgramName('')} className="btn" style={{ marginTop: '1rem' }}>Stäng</button>
                    </div>
                </div>
            )}

            {/* --- Global Functional Discounts Card --- */}
            <div className="card" style={{ padding: '2rem', background: 'var(--atea-white)', marginTop: '2rem' }}>
                <h3>Funktionella Rabatter per Kategori (från vald prislista)</h3>
                <div style={{ marginBottom: '1rem' }}>
                    <label htmlFor="price-list-select">Välj prislista:</label>
                    <select
                        id="price-list-select"
                        value={selectedPriceList}
                        onChange={e => setSelectedPriceList(e.target.value)}
                        style={{ marginLeft: '1rem' }}
                    >
                        {priceLists.map(list => (
                            <option key={list} value={list}>{list}</option>
                        ))}
                    </select>
                </div>
                {categories.length === 0 ? (
                    <div>Inga kategorier funna i vald prislista.</div>
                ) : (
                    <table className="table" style={{ maxWidth: 500 }}>
                        <thead>
                            <tr>
                                <th>Kategori</th>
                                <th>Funktionell rabatt (%)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categoryDiscounts.map((item, idx) => (
                                <tr key={item.category}>
                                    <td>{item.category}</td>
                                    <td>
                                        <input
                                            type="number"
                                            value={(item.discount * 100).toFixed(2)}
                                            onChange={e => handleCategoryDiscountChange(idx, e.target.value)}
                                            style={{ width: 80 }}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                <button
                    onClick={handleSaveCategoryDiscounts}
                    className="btn btn-primary"
                    style={{ marginTop: '1rem' }}
                    disabled={loadingFunctional}
                >
                    Spara kategori-rabatter
                </button>
            </div>

            {/* --- Upload New Program Card --- */}
            <div className="card" style={{ padding: '2rem', background: 'var(--atea-white)', marginTop: '2rem' }}>
                <h3>Ladda upp nytt rabattprogram</h3>
                <div className="upload-section" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{flexGrow: 1}}>
                        <label htmlFor="file-upload" className="btn btn-primary">Välj Excel-fil</label>
                        <input type="file" id="file-upload" onChange={handleFileChange} accept=".xlsx, .xls" style={{ display: 'none' }} />
                        {file && <span style={{ marginLeft: '1rem' }}>Vald fil: {file.name}</span>}
                    </div>
                </div>

                {previewData && (
                    <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
                        <h4>Förhandsgranskning och Spara</h4>
                        <div className="form-group">
                            <label htmlFor="program-name">Namn på rabattprogram (från fil)</label>
                            <input 
                                type="text" 
                                id="program-name" 
                                value={programName} 
                                readOnly
                                placeholder="Programnamn läses från filen"
                            />
                        </div>
                        <div className="table-container" style={{ marginTop: '1.5rem', maxHeight: '400px', overflowY: 'auto' }}>
                            <table className="table">
                                <thead>
                                    {previewData.length > 0 && (
                                        <tr>
                                            {Object.keys(previewData[0]).map(key => <th key={key}>{key}</th>)}
                                        </tr>
                                    )}
                                </thead>
                                <tbody>
                                    {previewData.map((row, index) => (
                                        <tr key={index}>
                                            {Object.keys(row).map(key => {
                                                let value = row[key];
                                                // Format the rebate rate column specifically as a percentage
                                                if (key.toLowerCase().includes('rebate rate') && typeof value === 'number') {
                                                    value = `${(value * 100).toFixed(2)}%`;
                                                }
                                                return <td key={key}>{String(value)}</td>;
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button onClick={handleUpload} disabled={uploading || !file} className="btn btn-success" style={{ marginTop: '1rem' }}>
                            {uploading ? 'Sparar...' : 'Ladda upp och spara program'}
                        </button>
                    </div>
                )}

                {error && rawPreviewData && rawPreviewData.length > 0 && (
                    <div style={{ marginTop: '2rem', borderTop: '2px solid var(--atea-red)', paddingTop: '1rem' }}>
                        <h4 style={{color: 'var(--atea-red)'}}>Felsökning: Rådata från Excel-fil</h4>
                        <p>Detta är den exakta datan som lästs från filen. Kontrollera att kolumnrubrikerna (t.ex. 'Product Class') stämmer exakt.</p>
                        <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        {Object.keys(rawPreviewData[0]).map(key => <th key={key}>{key}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rawPreviewData.map((row, index) => (
                                        <tr key={index}>
                                            {Object.values(row).map((val, i) => <td key={i}>{String(val)}</td>)}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* --- Existing Programs Card --- */}
            <div className="card" style={{ padding: '2rem', background: 'var(--atea-white)', marginTop: '2rem' }}>
                <h3>Befintliga rabattprogram</h3>
                {loading ? (
                    <div className="loading"><div className="spinner-small"></div><p>Laddar program...</p></div>
                ) : error ? (
                    <div className="alert alert-danger">{error}</div>
                ) : (
                    <ul className="file-list">
                        {discounts.map(name => (
                            <li key={name}>
                                <a href="#" className="program-name-link" onClick={(e) => { e.preventDefault(); handleViewProgram(name); }}>
                                    {name}
                                </a>
                                <button onClick={() => handleDelete(name)} className="btn-delete">&times;</button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

const domContainer = document.getElementById('root');
const root = ReactDOM.createRoot(domContainer);
root.render(<DiscountAdminPage />);




