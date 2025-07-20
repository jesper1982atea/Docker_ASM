import React, { useState, useEffect, useMemo } from "react";
import Pagination from "../components/Pagination";
import ApplePriceListItem from "../components/ApplePriceListItem";
import { useNavigate } from "react-router-dom";


const ApplePriceList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [processedFiles, setProcessedFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState("");

  const fetchProcessedFiles = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8080/api/price/list");
      if (!response.ok) throw new Error("Could not fetch price lists");
      const files = await response.json();
      setProcessedFiles(files);
      if (files.length > 0) {
        setSelectedFile(files[0]);
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
      setError("");
      try {
        const response = await fetch(`http://127.0.0.1:8080/api/price/data/${selectedFile}`);
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Failed to load file data");
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
    setError("");
    setFileName(file.name);
    setData([]);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch("/api/price/upload", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "File processing failed");
      }
      await fetchProcessedFiles();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      event.target.value = null;
    }
  };

  const categories = useMemo(() => {
    if (!data) return [];
    const uniqueCategories = [...new Set(data.map(item => item.Category))];
    return ["All", ...uniqueCategories.filter(c => c && c !== "Uncategorized").sort(), "Uncategorized"];
  }, [data]);

  const smartTags = useMemo(() => {
    if (!data) return [];
    const productLines = [...new Set(data.map(item => item["Product Line"]))];
    const screenSizes = [...new Set(data.map(item => item["Screen Size"]))];
    const colors = [...new Set(data.map(item => item["Color"]))];
    return [...productLines, ...screenSizes, ...colors]
      .filter(tag => tag && tag !== "N/A" && !searchTerm.toLowerCase().includes(tag.toLowerCase()))
      .slice(0, 10);
  }, [data, searchTerm]);

  const filteredData = useMemo(() => {
    let result = data;
    if (selectedCategory && selectedCategory !== "All") {
      result = result.filter(row => row.Category === selectedCategory);
    }
    if (!searchTerm) return result;
    return result.filter(row =>
      Object.values(row).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm, selectedCategory]);


  const allHeaders = data.length > 0 ? Object.keys(data[0]) : [];
  const defaultVisibleHeaders = ["Part Number", "Description", "ALP Ex VAT", "ALP Inc VAT", "NPI"];
  const [visibleHeaders, setVisibleHeaders] = useState(defaultVisibleHeaders);
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  const handleHeaderToggle = (header) => {
    setVisibleHeaders(prev =>
      prev.includes(header)
        ? prev.filter(h => h !== header)
        : [...prev, header]
    );
  };

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const navigate = useNavigate();
  const handleRowClick = (rowData) => {
    sessionStorage.setItem("selectedProduct", JSON.stringify(rowData));
    navigate("/apple-price-list-detail");
  };

  const handleTagClick = (tag) => {
    setSearchTerm(prev => prev ? `${prev} ${tag}` : tag);
    setCurrentPage(1);
  };

  return (
    <div className="container">
      <header className="atea-header">
        <div className="header-content">
          {/* <img src="/images/logo.jpg" alt="Atea Logo" className="header-logo" style={{ height: '50px' }} /> */}
          <div>
            <h1>Apple Price List</h1>
            <p>Ladda upp och visa prisdata från Apple.</p>
          </div>
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
            <div style={{ marginBottom: '1rem', background: '#f8f8f8', borderRadius: 8, boxShadow: '0 2px 8px #0001' }}>
              <button
                className="btn"
                style={{ margin: '1rem 0', fontWeight: 600, background: '#005eb8', color: '#fff', borderRadius: 6, padding: '0.5em 1.2em', border: 'none', cursor: 'pointer' }}
                onClick={() => setShowColumnSelector(v => !v)}
              >
                {showColumnSelector ? 'Dölj kolumnval' : 'Välj kolumner att visa'}
              </button>
              {showColumnSelector && (
                <div style={{ padding: '1rem' }}>
                  <strong>Välj kolumner:</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1em', marginTop: '0.5em' }}>
                    {allHeaders.map(header => (
                      <label key={header} style={{ marginRight: '1em', fontWeight: visibleHeaders.includes(header) ? 600 : 400 }}>
                        <input
                          type="checkbox"
                          checked={visibleHeaders.includes(header)}
                          onChange={() => handleHeaderToggle(header)}
                          style={{ marginRight: '0.4em' }}
                        />
                        {header}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="table-container" style={{overflowX: 'auto'}}>
              <table className="table">
                <thead>
                  <tr>
                    {visibleHeaders.map((header) => (
                      <th key={header}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((row, index) => (
                    <ApplePriceListItem
                      key={index}
                      product={row}
                      headers={visibleHeaders}
                      onClick={handleRowClick}
                    />
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
};

export default ApplePriceList;
