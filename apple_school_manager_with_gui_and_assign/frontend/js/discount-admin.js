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
        try {
            setLoading(true);
            const response = await fetch('/api/discounts');
            if (!response.ok) throw new Error('Failed to fetch discounts');
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
        if (!selectedFile) {
            setPreviewData(null);
            setProgramName('');
            setFile(null);
            return;
        }
        setFile(selectedFile);
        setError('');

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                // Headers are on row 3, so we skip the first 2 rows (index 0, 1)
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { range: 2 });

                if (jsonData.length === 0) {
                    setError("The selected file is empty or has an invalid format.");
                    setPreviewData(null);
                    return;
                }

                const firstRow = jsonData[0];
                const progName = firstRow['Program Name'];
                if (!progName) {
                    setError("Could not find 'Program Name' column in the file.");
                    setPreviewData(null);
                    return;
                }
                
                setProgramName(progName);
                setPreviewData(jsonData);

            } catch (err) {
                console.error("File parsing error:", err);
                setError("Failed to parse the Excel file. Please ensure it's a valid format.");
                setPreviewData(null);
            }
        };
        reader.readAsArrayBuffer(selectedFile);
    };

    const handleUpload = async () => {
        if (!file || !programName) {
            setError('Please select a valid file with a Program Name.');
            return;
        }
        setUploading(true);
        setError('');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('program_name', programName);

        try {
            const response = await fetch('/api/discounts/upload', {
                method: 'POST',
                body: formData,
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Upload failed');
            }
            // Refresh list after upload
            fetchDiscounts();
            setFile(null); // Clear file input
            setPreviewData(null);
            setProgramName('');
            document.getElementById('file-upload').value = null;
        } catch (err) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (filename) => {
        if (!confirm(`Are you sure you want to delete ${filename}?`)) return;

        try {
            const response = await fetch(`/api/discounts/${filename}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete file');
            // Refresh list
            setDiscounts(discounts.filter(d => d !== filename));
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
                        <input type="file" id="file-upload" accept=".xlsx, .xls" onChange={handleFileChange} />
                    </div>
                    {error && <p className="alert alert-danger" style={{ marginTop: '1rem' }}>{error}</p>}
                </div>

                {previewData && (
                    <div className="card" style={{ marginTop: '2rem' }}>
                        <h3>Förhandsgranskning: {programName}</h3>
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
                            {discounts.map(filename => (
                                <li key={filename} className="item-list-item">
                                    <span>{filename}</span>
                                    <button onClick={() => handleDelete(filename)} className="btn btn-danger btn-sm">Ta bort</button>
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
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<DiscountAdminPage />);
