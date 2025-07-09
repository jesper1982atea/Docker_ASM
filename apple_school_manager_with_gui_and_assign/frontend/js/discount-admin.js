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

    // State for global functional discounts
    const [functionalDiscounts, setFunctionalDiscounts] = useState([]);
    const [loadingFunctional, setLoadingFunctional] = useState(true);

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
                
                // Konvertera kalkylblad till JSON, med rubriker från rad 3 (index 2)
                let json = XLSX.utils.sheet_to_json(worksheet, { header: 2 });

                // Helper to trim whitespace from object keys
                const trimKeys = (arr) => arr.map(obj => 
                    Object.keys(obj).reduce((acc, key) => {
                        acc[key.trim()] = obj[key];
                        return acc;
                    }, {})
                );

                json = trimKeys(json);
                setRawPreviewData(json); // Save raw data for debugging view

                if (json.length > 0) {
                    console.log("DEBUG: Kolumnnamn som hittades i första raden:", Object.keys(json[0]));
                }

                // Hämta programnamnet från första raden med data
                const programNameFromFile = json.length > 0 && json[0]['Program Name'] ? json[0]['Program Name'] : f.name.replace(/\.(xlsx|xls)$/, '');
                setProgramName(programNameFromFile);

                const sanitizedData = json
                    .filter(row => row['Product Class'] && row['Rebate Rate (%)'] !== undefined)
                    .map(row => {
                        let rate = row['Rebate Rate (%)'];
                        if (typeof rate === 'string') {
                            rate = rate.replace('%', '').trim();
                        }
                        const rateFloat = parseFloat(rate);
                        const finalRate = !isNaN(rateFloat) ? (rateFloat > 1 ? rateFloat / 100 : rateFloat) : 0;

                        return {
                            'Product Class': row['Product Class'],
                            'Rebate Rate': finalRate
                        };
                    });

                setPreviewData(sanitizedData);

                if (sanitizedData.length === 0 && json.length > 0) {
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
        // The program name is now derived from the file on the backend, so no need to check it here.

        setUploading(true);
        setError('');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/discounts/upload', {
                method: 'POST',
                body: formData, // Send the file as multipart/form-data
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Kunde inte spara programmet.');
            }
            // Reset fields and refresh list
            setFile(null);
            setPreviewData(null);
            setProgramName('');
            fetchDiscounts();
            alert('Rabattprogrammet har laddats upp!');
        } catch (err) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (programNameToDelete) => {
        if (!window.confirm(`Är du säker på att du vill radera rabattprogrammet "${programNameToDelete}"?`)) {
            return;
        }
        try {
            const response = await fetch(`/api/discounts/${programNameToDelete}`, {
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

    return (
        <div className="container">
            <header className="atea-header">
                <div className="header-content">
                    <a href="/frontend/"><img src="/frontend/images/logo.jpg" alt="Atea Logo" className="header-logo" style={{ height: '50px' }} /></a>
                    <div>
                        <h1>Hantera Rabattprogram</h1>
                        <p>Ladda upp och administrera rabattavtal.</p>
                    </div>
                </div>
                <div className="header-links">
                    <a href="/frontend/" className="header-link">⬅️ Tillbaka till Admin</a>
                </div>
            </header>

            {/* --- Global Functional Discounts Card --- */}
            <div className="card" style={{ padding: '2rem', background: 'var(--atea-white)', marginTop: '2rem' }}>
                <h3>Globala Funktionella Rabatter</h3>
                <p style={{marginTop: '-0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)'}}>
                    Dessa rabatter läggs automatiskt på alla produkter i en kategori, för alla rabattprogram.
                </p>
                {loadingFunctional ? (
                    <div className="loading"><div className="spinner-small"></div><p>Laddar...</p></div>
                ) : (
                    <div>
                        {functionalDiscounts.map((item, index) => (
                            <div key={index} style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <select 
                                    value={item.category} 
                                    onChange={e => handleFunctionalDiscountChange(index, 'category', e.target.value)}
                                    style={{flex: 1}}
                                >
                                    <option value="Mac">Mac</option>
                                    <option value="iPad">iPad</option>
                                    <option value="iPhone">iPhone</option>
                                    <option value="Watch">Watch</option>
                                    <option value="Accessories">Tillbehör</option>
                                </select>
                                <input 
                                    type="number" 
                                    value={(item.discount * 100).toFixed(2)} // Display as percentage
                                    onChange={e => handleFunctionalDiscountChange(index, 'discount', e.target.value)}
                                    placeholder="Rabatt %"
                                    style={{flex: 1}}
                                />
                                <span>%</span>
                                <button onClick={() => handleRemoveFunctionalDiscount(index)} className="btn-delete">&times;</button>
                            </div>
                        ))}
                        <div style={{marginTop: '1rem', display: 'flex', gap: '1rem'}}>
                            <button onClick={handleAddFunctionalDiscount} className="btn">+ Lägg till rad</button>
                            <button onClick={handleSaveFunctionalDiscounts} className="btn btn-primary">Spara globala rabatter</button>
                        </div>
                    </div>
                )}
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
                            <label htmlFor="program-name">Namn på rabattprogram</label>
                            <input 
                                type="text" 
                                id="program-name" 
                                value={programName} 
                                onChange={e => setProgramName(e.target.value)} 
                                placeholder="Ange ett namn för programmet"
                            />
                        </div>
                        <div className="table-container" style={{ marginTop: '1.5rem', maxHeight: '400px', overflowY: 'auto' }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Product Class</th>
                                        <th>Rebate Rate</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.map((row, index) => (
                                        <tr key={index}>
                                            <td>{row['Product Class']}</td>
                                            <td>{(row['Rebate Rate'] * 100).toFixed(2)}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button onClick={handleUpload} disabled={uploading || !programName} className="btn btn-success" style={{ marginTop: '1rem' }}>
                            {uploading ? 'Sparar...' : 'Spara program'}
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
                                <span>{name}</span>
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



