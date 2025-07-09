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
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);

    useEffect(() => {
        // Fetch customers with GSX keys
        const fetchCustomers = async () => {
            try {
                const res = await fetch('/api/customers');
                const allCustomers = await res.json();
                const gsxCustomers = allCustomers.filter(c => c.gsx_api_key);
                setCustomers(gsxCustomers);
                if (gsxCustomers.length > 0) {
                    setSelectedCustomer(gsxCustomers[0].id);
                }
            } catch (e) {
                console.error("Failed to fetch customers", e);
            }
        };
        fetchCustomers();
    }, []);

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

    const handleBulkExport = async () => {
        if (!data || data.length === 0) {
            alert("Ingen data att exportera.");
            return;
        }
        if (!selectedCustomer) {
            alert("Välj en kund för GSX-uppslag.");
            return;
        }
    
        setIsExporting(true);
        setExportProgress(0);
    
        const exportData = [];
        const totalRows = data.length;
    
        for (let i = 0; i < totalRows; i++) {
            const row = data[i];
            const serialNumber = row['Serienr'];
            let gsxData = {};
    
            if (serialNumber) {
                try {
                    const res = await fetch(`/api/${selectedCustomer}/gsx/device-details/${serialNumber}`);
                    if (res.ok) {
                        const result = await res.json();
                        if (result && result.device) {
                            // Flatten GSX data for Excel
                            gsxData = {
                                'GSX Produktbeskrivning': result.device.productDescription,
                                'GSX Konfiguration': result.device.configDescription,
                                'GSX Garantistatus': result.device.warrantyInfo?.warrantyStatusDescription,
                                'GSX Inköpsdatum': result.device.warrantyInfo?.purchaseDate ? new Date(result.device.warrantyInfo.purchaseDate).toLocaleDateString() : 'N/A',
                                'GSX Dagar kvar på garanti': result.device.warrantyInfo?.daysRemaining,
                                'GSX Upplåst': result.device.activationDetails?.unlocked ? 'Ja' : 'Nej',
                            };
                        }
                    }
                } catch (e) {
                    console.error(`Failed to fetch GSX for ${serialNumber}:`, e);
                    gsxData = { 'GSX Produktbeskrivning': 'Fel vid hämtning' };
                }
            }
            
            // Add a small delay to not hammer the API
            await new Promise(resolve => setTimeout(resolve, 200));
    
            exportData.push({ ...row, ...gsxData });
            setExportProgress(((i + 1) / totalRows) * 100);
        }
    
        // Create and download Excel file
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Säljdata med GSX");
    
        // Auto-fit columns by setting a sensible default width
        const colWidths = Object.keys(exportData[0] || {}).map(key => ({ wch: Math.max(key.length, 18) }));
        worksheet["!cols"] = colWidths;
    
        XLSX.writeFile(workbook, "Säljdata_Export.xlsx");
    
        setIsExporting(false);
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

                    <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '2rem', paddingTop: '1.5rem' }}>
                        <h4>Exportera med GSX-data</h4>
                        <p>Välj en kund nedan för att berika exporten med GSX-information för varje serienummer.</p>
                        <div className="form-group">
                            <label>Välj kund för GSX-uppslag</label>
                            <select value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)} disabled={customers.length === 0 || isExporting}>
                                {customers.length > 0 ? (
                                    customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                                ) : (
                                    <option>Inga kunder med GSX-nyckel</option>
                                )}
                            </select>
                        </div>
                        <button onClick={handleBulkExport} disabled={!data || !selectedCustomer || isExporting} className="btn btn-success">
                            {isExporting ? `Exporterar... (${Math.round(exportProgress)}%)` : 'Exportera allt till Excel'}
                        </button>
                        {isExporting && (
                            <div className="progress-bar" style={{marginTop: '1rem'}}>
                                <div className="progress-bar-inner" style={{width: `${exportProgress}%`}}></div>
                            </div>
                        )}
                    </div>
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
