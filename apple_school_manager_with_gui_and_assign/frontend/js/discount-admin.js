const { useState, useEffect } = React;

function DiscountAdminPage() {
    const [discounts, setDiscounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

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
        setFile(event.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file to upload.');
            return;
        }
        setUploading(true);
        setError('');
        const formData = new FormData();
        formData.append('file', file);

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
                    <p>Filen måste vara i Excel-format med kolumnerna 'Part Number' och 'Discount'.</p>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1rem' }}>
                        <input type="file" id="file-upload" accept=".xlsx, .xls" onChange={handleFileChange} />
                        <button onClick={handleUpload} disabled={uploading || !file} className="btn btn-primary">
                            {uploading ? 'Laddar upp...' : 'Ladda upp'}
                        </button>
                    </div>
                    {error && <p style={{ color: 'var(--atea-red)', marginTop: '1rem' }}>{error}</p>}
                </div>

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
