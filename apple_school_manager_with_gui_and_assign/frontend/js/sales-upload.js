const { useState, useEffect } = React;

function SalesUploader() {
    const [file, setFile] = useState(null);
    const [data, setData] = useState(null);
    const [headers, setHeaders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
        setData(null);
        setError('');
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file first.');
            return;
        }

        setLoading(true);
        setError('');
        setData(null);

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
                setHeaders(Object.keys(result[0]));
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

    return (
        <div className="container" style={{ maxWidth: '95%', margin: '2rem auto' }}>
            <header className="atea-header">
                <div className="header-content">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <a href="/frontend/"><img src="/frontend/images/logo.jpg" alt="Atea Logo" className="header-logo" style={{ height: '50px' }} /></a>
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
                </div>

                {loading && <p style={{ marginTop: '2rem', textAlign: 'center' }}>Läser filen...</p>}

                {data && (
                    <div className="card" style={{ marginTop: '2rem', overflowX: 'auto' }}>
                        <h3 style={{ padding: '1rem' }}>Granska data ({data.length} rader)</h3>
                        <table className="table">
                            <thead>
                                <tr>
                                    {headers.map(header => <th key={header}>{header}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((row, index) => (
                                    <tr key={index}>
                                        {headers.map(header => <td key={`${index}-${header}`}>{row[header]}</td>)}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<SalesUploader />);
