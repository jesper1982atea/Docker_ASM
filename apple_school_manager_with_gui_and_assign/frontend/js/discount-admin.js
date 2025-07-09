const { useState, useEffect } = React;

function DiscountAdminPage() {
    const [discounts, setDiscounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [programName, setProgramName] = useState('');
    const [originalPreviewData, setOriginalPreviewData] = useState(null); // Store original data

    // State for functional discount
    const [functionalDiscountCategory, setFunctionalDiscountCategory] = useState('Mac');
    const [functionalDiscountValue, setFunctionalDiscountValue] = useState(12.5);

    const fetchDiscounts = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/discounts/');
            if (!response.ok) throw new Error('Could not fetch discounts');
            const data = await response.json();
            setDiscounts(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDiscounts();
    }, []);

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setError('');
        setProgramName(selectedFile.name.replace(/\.(xlsx|xls)$/i, '')); // Suggest name from filename

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);
                
                // Ensure Rebate Rate is a number
                const sanitizedData = json.map(row => ({
                    ...row,
                    'Rebate Rate': parseFloat(row['Rebate Rate']) || 0
                }));

                setPreviewData(sanitizedData);
                setOriginalPreviewData(JSON.parse(JSON.stringify(sanitizedData))); // Deep copy for reset
            } catch (err) {
                setError('Kunde inte läsa filen. Se till att den är i rätt format.');
                console.error(err);
            }
        };
        reader.readAsArrayBuffer(selectedFile);
    };

    const handleApplyFunctionalDiscount = () => {
        if (!previewData || !functionalDiscountCategory || functionalDiscountValue === null) {
            alert("Ladda en fil och välj kategori/värde först.");
            return;
        }

        const categoryKeywords = {
            'Mac': ['mac', 'display'],
            'iPad': ['ipad'],
            'iPhone': ['iphone'],
            'Watch': ['watch'],
            'Accessories': ['magic', 'pencil', 'adapter', 'cable', 'airtag', 'airpods', 'beatsbydre', 'tv', 'homepod']
        };

        const keywords = categoryKeywords[functionalDiscountCategory] || [];
        const discountToAdd = parseFloat(functionalDiscountValue) / 100;

        if (isNaN(discountToAdd)) {
            alert("Ange ett giltigt numeriskt värde för rabatten.");
            return;
        }

        // Use the original data as the base to prevent multiple additions
        const updatedData = originalPreviewData.map(row => {
            const productClass = (row['Product Class'] || '').toLowerCase();
            const shouldApply = keywords.some(keyword => productClass.includes(keyword));

            if (shouldApply) {
                // Add the functional discount to the original rebate rate
                const newRebateRate = (parseFloat(row['Rebate Rate']) || 0) + discountToAdd;
                return { ...row, 'Rebate Rate': newRebateRate };
            }
            return { ...row }; // Return a copy
        });

        setPreviewData(updatedData);
        alert(`Funktionell rabatt på ${functionalDiscountValue}% har applicerats på ${functionalDiscountCategory}-produkter. Den nya totala rabatten visas i tabellen.`);
    };

    const handleUpload = async () => {
        if (!programName || !previewData) {
            setError('Programnamn och förhandsgranskad data får inte vara tom.');
            return;
        }
        setUploading(true);
        setError('');
        try {
            const payload = {
                program_name: programName,
                data: previewData
            };
            const response = await fetch('/api/discounts/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to save discount program.');
            }
            await fetchDiscounts(); // Refresh list
            setPreviewData(null); // Clear preview
            setFile(null);
            setProgramName('');
            document.getElementById('file-upload').value = null; // Reset file input
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

                        {/* Functional Discount Section */}
                        <div className="functional-discount-section" style={{
                            padding: '1rem',
                            border: '1px solid var(--border-color)',
                            borderRadius: '5px',
                            marginTop: '1.5rem',
                            background: 'var(--atea-light-grey)'
                        }}>
                            <h5 style={{marginTop: 0}}>Lägg till funktionell rabatt</h5>
                            <p style={{marginTop: '-0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)'}}>
                                Lägger till den angivna rabatten på alla produkter i den valda kategorin.
                            </p>
                            <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                                <div className="form-group" style={{margin: 0}}>
                                    <label htmlFor="functional-category">Kategori</label>
                                    <select id="functional-category" value={functionalDiscountCategory} onChange={e => setFunctionalDiscountCategory(e.target.value)}>
                                        <option value="Mac">Mac</option>
                                        <option value="iPad">iPad</option>
                                        <option value="iPhone">iPhone</option>
                                        <option value="Watch">Watch</option>
                                        <option value="Accessories">Tillbehör</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{margin: 0}}>
                                    <label htmlFor="functional-value">Rabatt (%)</label>
                                    <input 
                                        type="number" 
                                        id="functional-value" 
                                        value={functionalDiscountValue} 
                                        onChange={e => setFunctionalDiscountValue(e.target.value)}
                                        placeholder="t.ex. 12.5"
                                    />
                                </div>
                                <button onClick={handleApplyFunctionalDiscount} className="btn" style={{alignSelf: 'flex-end'}}>Applicera</button>
                            </div>
                        </div>

                        <div className="table-container" style={{ marginTop: '1.5rem', maxHeight: '400px', overflowY: 'auto' }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Product Class</th>
                                        {JSON.stringify(previewData) !== JSON.stringify(originalPreviewData) && (
                                            <th>Ursprunglig rabatt</th>
                                        )}
                                        <th>Total rabatt</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.map((row, index) => (
                                        <tr key={index}>
                                            <td>{row['Product Class']}</td>
                                            {JSON.stringify(previewData) !== JSON.stringify(originalPreviewData) && (
                                                <td>
                                                    {(originalPreviewData[index]['Rebate Rate'] * 100).toFixed(2)}%
                                                </td>
                                            )}
                                            <td style={{fontWeight: 'bold'}}>{(row['Rebate Rate'] * 100).toFixed(2)}%</td>
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
            </div>

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



