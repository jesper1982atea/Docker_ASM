const { useState, useEffect } = React;

function DiscountAdminPage() {
    const [discounts, setDiscounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [programName, setProgramName] = useState('');

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
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);
                setPreviewData(json);
            } catch (err) {
                setError('Failed to read or parse the Excel file.');
                setPreviewData(null);
            }
        };
        reader.readAsArrayBuffer(selectedFile);
    };

    const handleUpload = async () => {
        if (!previewData || !programName) {
            setError('No data to upload or program name is missing.');
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
        if (!confirm(`Are you sure you want to delete ${programNameToDelete}?`)) return;

        try {
            const response = await fetch(`/api/discounts/${programNameToDelete}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete file');
            // Refresh list
            await fetchDiscounts();
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
                        <p>Ladda upp och ta bort rabattfiler (Excel).</p>
                    </div>
                </div>
                <div className="header-links">
                    <a href="/frontend/" className="header-link">⬅️ Tillbaka till Admin</a>
                </div>
            </header>

            <main style={{ marginTop: '2rem' }}>
                <div className="card" style={{ padding: '2rem' }}>
                    <h3>Ladda upp nytt rabattprogram</h3>
                    <p>Välj en Excel-fil för att förhandsgranska och ladda upp.</p>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1rem' }}>
                        <input type="file" id="file-upload" accept=".xlsx, .xls" onChange={handleFileChange} className="form-control" />
                    </div>
                    {error && <p className="alert alert-danger" style={{ marginTop: '1rem' }}>{error}</p>}
                </div>

                {previewData && (
                    <div className="card" style={{ marginTop: '2rem' }}>
                        <h3>Förhandsgranskning</h3>
                        <div className="form-group" style={{margin: '1rem 0'}}>
                            <label htmlFor="program-name">Programnamn</label>
                            <input 
                                type="text" 
                                id="program-name" 
                                value={programName} 
                                onChange={e => setProgramName(e.target.value)}
                                placeholder="Ange ett namn för rabattprogrammet"
                            />
                        </div>
                        <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Product Class</th>
                                        <th>Rebate Rate (%)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.filter(row => row['Product Class'] && row['Rebate Rate (%)'] !== undefined).map((row, index) => (
                                        <tr key={index}>
                                            <td>{row['Product Class']}</td>
                                            <td>{row['Rebate Rate (%)']}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={handleUpload} disabled={uploading} className="btn btn-primary">
                                {uploading ? 'Sparar...' : `Spara program "${programName}"`}
                            </button>
                        </div>
                    </div>
                )}

                <div className="card" style={{ marginTop: '2rem' }}>
                    <h3>Tillgängliga Rabattprogram</h3>
                    {loading ? (
                        <p>Laddar...</p>
                    ) : discounts.length > 0 ? (
                        <ul className="item-list">
                            {discounts.map(program => (
                                <li key={program} className="item-list-item">
                                    <span>{program}</span>
                                    <button onClick={() => handleDelete(program)} className="btn btn-danger btn-sm">Ta bort</button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>Inga rabattprogram har laddats upp.</p>
                    )}
                </div>
            </main>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<DiscountAdminPage />);
                                <li key={program} className="item-list-item">
                                    <span>{program}</span>
                                    <button onClick={() => handleDelete(program)} className="btn btn-danger btn-sm">Ta bort</button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>Inga rabattprogram har laddats upp.</p>
                    )}
                </div>
            </main>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<DiscountAdminPage />);

