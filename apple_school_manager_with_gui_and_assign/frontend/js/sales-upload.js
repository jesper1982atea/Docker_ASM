const { useState, useEffect } = React;

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
    const [headers, setHeaders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

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

    const handleRowClick = (row) => {
        const rowData = encodeURIComponent(JSON.stringify(row));
        window.location.href = `/sales-order-detail?data=${rowData}`;
    };

    const totalPages = data ? Math.ceil(data.length / itemsPerPage) : 0;
    const paginatedData = data ? data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) : [];

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

                {loading && <div className="loading" style={{marginTop: '2rem'}}><div className="spinner"></div><p>Läser filen...</p></div>}

                {data && (
                    <div className="card" style={{ marginTop: '2rem', overflowX: 'auto' }}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem'}}>
                            <h3>Granska data ({data.length} rader)</h3>
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

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<SalesUploader />);
