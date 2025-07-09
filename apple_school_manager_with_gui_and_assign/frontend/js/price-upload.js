const { useState, useEffect, useMemo } = React;

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
    const [selectedScreenSize, setSelectedScreenSize] = useState('All');
    const [selectedColor, setSelectedColor] = useState('All');
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

    const screenSizes = useMemo(() => {
        if (!data) return [];
        const uniqueSizes = [...new Set(data.map(item => item['Screen Size']))];
        return ['All', ...uniqueSizes.filter(s => s && s !== 'N/A').sort()];
    }, [data]);

    const colors = useMemo(() => {
        if (!data) return [];
        const uniqueColors = [...new Set(data.map(item => item['Color']))];
        return ['All', ...uniqueColors.filter(c => c).sort()];
    }, [data]);

    const filteredData = useMemo(() => {
        let result = data;

        if (selectedCategory && selectedCategory !== 'All') {
            result = result.filter(row => row.Category === selectedCategory);
        }

        if (selectedScreenSize && selectedScreenSize !== 'All') {
            result = result.filter(row => row['Screen Size'] === selectedScreenSize);
        }

        if (selectedColor && selectedColor !== 'All') {
            result = result.filter(row => row['Color'] === selectedColor);
        }

        if (!searchTerm) return result;
        return result.filter(row =>
            Object.values(row).some(value =>
                String(value).toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    }, [data, searchTerm, selectedCategory, selectedScreenSize, selectedColor]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleRowClick = (rowData) => {
        const dataString = encodeURIComponent(JSON.stringify(rowData));
        window.open(`/price-detail?data=${dataString}`, '_blank');
    };

    return (
        <div className="container">
            <header className="atea-header">
                <div className="header-content">
                    <a href="/frontend/"><img src="/frontend/images/logo.jpg" alt="Atea Logo" className="header-logo" style={{ height: '50px' }} /></a>
                    <div>
                        <h1>Apple Price List</h1>
                        <p>Ladda upp och visa prisdata från Apple.</p>
                    </div>
                </div>
                 <div className="header-links">
                    <a href="/frontend/" className="header-link">⬅️ Tillbaka till Admin</a>
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
                                        placeholder="Sök på artikelnummer, beskrivning, etc."
                                        value={searchTerm}
                                        onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    />
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
                            {screenSizes.length > 1 && (
                                <div className="filter-group" style={{marginTop: '1rem'}}>
                                    <label>Skärmstorlek</label>
                                    <div className="button-group">
                                        {screenSizes.map(size => (
                                            <button key={size} className={`btn-filter ${selectedScreenSize === size ? 'active' : ''}`} onClick={() => { setSelectedScreenSize(size); setCurrentPage(1); }}>
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {colors.length > 1 && (
                                <div className="filter-group" style={{marginTop: '1rem'}}>
                                    <label>Färg</label>
                                    <div className="button-group">
                                        {colors.map(color => (
                                            <button key={color} className={`btn-filter ${selectedColor === color ? 'active' : ''}`} onClick={() => { setSelectedColor(color); setCurrentPage(1); }}>
                                                {color}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
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

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<PriceUploader />);
