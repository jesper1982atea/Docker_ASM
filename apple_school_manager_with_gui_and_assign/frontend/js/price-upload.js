const { useState, useEffect, useMemo } = React;

function Pagination({ currentPage, totalPages, onPageChange }) {
    if (!totalPages || totalPages <= 1) {
        return null;
    }

    const handlePageClick = (page) => {
        if (page >= 1 && page <= totalPages) {
            onPageChange(page);
        }
    };

    const pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage = 1, endPage = totalPages;

    if (totalPages > maxPagesToShow) {
        const half = Math.floor(maxPagesToShow / 2);
        if (currentPage <= half) {
            startPage = 1;
            endPage = maxPagesToShow;
        } else if (currentPage + half >= totalPages) {
            startPage = totalPages - maxPagesToShow + 1;
            endPage = totalPages;
        } else {
            startPage = currentPage - half;
            endPage = currentPage + half;
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
    }

    return (
        <div className="pagination">
            <button onClick={() => handlePageClick(1)} disabled={currentPage === 1}>&laquo;</button>
            <button onClick={() => handlePageClick(currentPage - 1)} disabled={currentPage === 1}>&lsaquo;</button>
            {startPage > 1 && <span className="page-ellipsis">...</span>}
            {pageNumbers.map(number => (
                <button key={number} onClick={() => handlePageClick(number)} className={currentPage === number ? 'active' : ''}>
                    {number}
                </button>
            ))}
            {endPage < totalPages && <span className="page-ellipsis">...</span>}
            <button onClick={() => handlePageClick(currentPage + 1)} disabled={currentPage === totalPages}>&rsaquo;</button>
            <button onClick={() => handlePageClick(totalPages)} disabled={currentPage === totalPages}>&raquo;</button>
        </div>
    );
}

function PriceUploader() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fileName, setFileName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const [processedFiles, setProcessedFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState('');

    const fetchProcessedFiles = async () => {
        try {
            const response = await fetch('/api/price/list');
            if (!response.ok) throw new Error('Could not fetch price lists');
            const files = await response.json();
            setProcessedFiles(files);
            if (files.length > 0) {
                setSelectedFile(files[0]); // Select the most recent file by default
            }
        } catch (err) {
            setError(err.message);
        }
    };

    useEffect(() => {
        fetchProcessedFiles();
    }, []);

    useEffect(() => {
        if (!selectedFile) {
            setData([]);
            return;
        }
        const loadFileData = async () => {
            setLoading(true);
            setError('');
            try {
                const response = await fetch(`/api/price/data/${selectedFile}`);
                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || 'Failed to load file data');
                }
                const result = await response.json();
                setData(result);
                setFileName(selectedFile);
                setCurrentPage(1);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        loadFileData();
    }, [selectedFile]);

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setLoading(true);
        setError('');
        setFileName(file.name);
        setData([]);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/price/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'File processing failed');
            }

            // After successful upload, refresh the list of files
            // The new file will be selected automatically by the useEffect hook
            await fetchProcessedFiles();

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
            event.target.value = null; // Reset file input
        }
    };

    const categories = useMemo(() => {
        if (!data) return [];
        const uniqueCategories = [...new Set(data.map(item => item.Category))];
        return ['All', ...uniqueCategories.filter(c => c && c !== 'Uncategorized').sort(), 'Uncategorized'];
    }, [data]);

    const smartTags = useMemo(() => {
        if (!data) return [];
        const productLines = [...new Set(data.map(item => item['Product Line']))];
        const screenSizes = [...new Set(data.map(item => item['Screen Size']))];
        const colors = [...new Set(data.map(item => item['Color']))];
        
        return [...productLines, ...screenSizes, ...colors]
            .filter(tag => tag && tag !== 'N/A' && !searchTerm.toLowerCase().includes(tag.toLowerCase()))
            .slice(0, 10); // Show top 10 relevant tags
    }, [data, searchTerm]);

    const filteredData = useMemo(() => {
        let result = data;

        if (selectedCategory && selectedCategory !== 'All') {
            result = result.filter(row => row.Category === selectedCategory);
        }

        if (!searchTerm) return result;
        return result.filter(row =>
            Object.values(row).some(value =>
                String(value).toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    }, [data, searchTerm, selectedCategory]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleRowClick = (rowData) => {
        sessionStorage.setItem('selectedProduct', JSON.stringify(rowData));
        window.location.href = '/product-detail';
    };

    const handleTagClick = (tag) => {
        setSearchTerm(prev => prev ? `${prev} ${tag}` : tag);
        setCurrentPage(1);
    };

    return (
        <div className="container">
            <header className="atea-header">
                <div className="header-content">
                    <a href="/"><img src="/images/logo.jpg" alt="Atea Logo" className="header-logo" style={{ height: '50px' }} /></a>
                    <div>
                        <h1>Apple Price List</h1>
                        <p>Ladda upp och visa prisdata från Apple.</p>
                    </div>
                </div>
                 <div className="header-links">
                    <a href="/" className="header-link">⬅️ Tillbaka till Admin</a>
                </div>
            </header>

            <div className="card" style={{ padding: '2rem', background: 'var(--atea-white)', marginTop: '2rem' }}>
                <div className="upload-section">
                    <div className="form-group">
                        <label htmlFor="file-upload" className="btn btn-primary">Ladda upp ny prisfil</label>
                        <input type="file" id="file-upload" onChange={handleFileUpload} accept=".xlsx, .xls" style={{ display: 'none' }} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="file-select">Eller välj en befintlig prislista</label>
                        <select id="file-select" value={selectedFile} onChange={e => setSelectedFile(e.target.value)} disabled={processedFiles.length === 0}>
                            {processedFiles.length > 0 ? (
                                processedFiles.map(f => <option key={f} value={f}>{f}</option>)
                            ) : (
                                <option>Inga prislistor hittades</option>
                            )}
                        </select>
                    </div>
                </div>
                
                {fileName && <p style={{ marginTop: '1rem', textAlign: 'center' }}>Visar data från: <strong>{fileName}</strong></p>}


                {loading && <div className="loading"><div className="spinner"></div><p>Bearbetar fil...</p></div>}
                {error && <div className="alert alert-danger">{error}</div>}

                {data.length > 0 && (
                    <div style={{ marginTop: '2rem' }}>
                        <div className="filters" style={{padding: '1rem', marginBottom: '1rem'}}>
                            <div className="filter-grid" style={{gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem'}}>
                                <div className="filter-group">
                                    <label htmlFor="search-term">Sök i tabellen</label>
                                    <input
                                        type="text"
                                        id="search-term"
                                        placeholder="Sök på artikelnummer, färg, storlek etc."
                                        value={searchTerm}
                                        onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    />
                                    <div className="smart-tags" style={{ marginTop: '0.5rem' }}>
                                        {smartTags.map(tag => (
                                            <button key={tag} className="btn-tag" onClick={() => handleTagClick(tag)}>
                                                + {tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="filter-group">
                                    <label htmlFor="category-filter">Filtrera på kategori</label>
                                    <select
                                        id="category-filter"
                                        value={selectedCategory}
                                        onChange={e => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                                    >
                                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="table-container" style={{overflowX: 'auto'}}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Part Number</th>
                                        <th>Description</th>
                                        <th>ALP Ex VAT</th>
                                        <th>ALP Inc VAT</th>
                                        <th>NPI</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedData.map((row, index) => (
                                        <tr key={index} onClick={() => handleRowClick(row)} style={{ cursor: 'pointer' }}>
                                            <td>{row['Part Number']}</td>
                                            <td>{row['Description']}</td>
                                            <td>{row['ALP Ex VAT']}</td>
                                            <td>{row['ALP Inc VAT']}</td>
                                            <td>{row['NPI']}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div style={{marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                             <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                             <span>Visar {paginatedData.length} av {filteredData.length} produkter</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function PriceUploadPage() {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [previewData, setPreviewData] = useState(null);

    const handleFileChange = (event) => {
        const f = event.target.files[0];
        if (!f) return;
        setFile(f);
        setError('');
        setSuccessMessage('');
        setPreviewData(null);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);
                setPreviewData(json.slice(0, 10)); // Show preview of first 10 rows
            } catch (err) {
                setError('Kunde inte förhandsgranska filen. Se till att det är en giltig Excel-fil.');
                console.error("File preview error:", err);
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
        setSuccessMessage('');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/price/upload', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Ett okänt fel uppstod.');
            }
            
            setSuccessMessage(`Prislistan "${file.name}" har laddats upp och bearbetats! ${result.length} produkter importerades.`);
            setFile(null);
            setPreviewData(null);
            document.getElementById('file-upload').value = null;

        } catch (err) {
            setError(`Fel vid uppladdning: ${err.message}`);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="container">
            <header className="atea-header">
                <div className="header-content">
                    <a href="/"><img src="/images/logo.jpg" alt="Atea Logo" className="header-logo" style={{ height: '50px' }} /></a>
                    <div>
                        <h1>Ladda upp prislista</h1>
                        <p>Ladda upp en ny prislista i Excel-format.</p>
                    </div>
                </div>
                 <div className="header-links">
                    <a href="/" className="header-link">⬅️ Tillbaka till Admin</a>
                </div>
            </header>

            <div className="card" style={{ padding: '2rem', background: 'var(--atea-white)', marginTop: '2rem' }}>
                <h3>Välj och ladda upp fil</h3>
                <div className="upload-section" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{flexGrow: 1}}>
                        <label htmlFor="file-upload" className="btn btn-primary">Välj Excel-fil</label>
                        <input type="file" id="file-upload" onChange={handleFileChange} accept=".xlsx, .xls" style={{ display: 'none' }} />
                        {file && <span style={{ marginLeft: '1rem' }}>Vald fil: {file.name}</span>}
                    </div>
                    <button onClick={handleUpload} disabled={uploading || !file} className="btn btn-success">
                        {uploading ? 'Laddar upp...' : 'Starta uppladdning'}
                    </button>
                </div>

                {error && <div className="alert alert-danger" style={{marginTop: '1rem'}}>{error}</div>}
                {successMessage && <div className="alert alert-success" style={{marginTop: '1rem'}}>{successMessage}</div>}

                {previewData && (
                    <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '2rem' }}>
                        <h4>Förhandsgranskning (första 10 raderna)</h4>
                        <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
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
                                            {Object.values(row).map((val, i) => <td key={i}>{String(val)}</td>)}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<PriceUploader />);

