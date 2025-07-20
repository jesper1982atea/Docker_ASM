import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Pagination from './Pagination';
import './AteaSalesUpload.css';

export default function AteaSalesUpload() {
  const [file, setFile] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [priceLists, setPriceLists] = useState([]);
  const [selectedPriceList, setSelectedPriceList] = useState('');
  const [priceMap, setPriceMap] = useState(new Map());
  const [gsxApiKey, setGsxApiKey] = useState('');
  const [gsxEnabled, setGsxEnabled] = useState(false);
  const [gsxTested, setGsxTested] = useState(false);
  const [gsxStatusMsg, setGsxStatusMsg] = useState('');

  useEffect(() => {
    // Fetch available price lists
    const fetchPriceLists = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8080/api/price/list');
        if (!res.ok) throw new Error('Could not fetch price lists');
        const files = await res.json();
        setPriceLists(files);
        if (files.length > 0) {
          setSelectedPriceList(files[0]);
        }
      } catch (e) {
        console.error('Failed to fetch price lists', e);
      }
    };
    fetchPriceLists();
  }, []);

  useEffect(() => {
    // Fetch GSX API key
    const fetchGsxConfig = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8080/api/gsx/gsx-api-key');
        if (res.ok) {
          let data = null;
          try {
            data = await res.json();
          } catch (jsonErr) {
            setGsxEnabled(false);
            setGsxStatusMsg('GSX API-nyckel kunde inte tolkas (ej JSON).');
            return;
          }
          const key = data.api_key || data.apiKey || data.APIKey || '';
          if (key) {
            setGsxEnabled(true);
            setGsxStatusMsg('GSX API-nyckel finns. Export är aktiverad.');
            setGsxApiKey(key);
          } else {
            setGsxEnabled(false);
            setGsxStatusMsg('GSX API-nyckel saknas.');
          }
        } else {
          setGsxEnabled(false);
          setGsxStatusMsg('GSX API-nyckel kunde inte hämtas.');
        }
      } catch (err) {
        setGsxEnabled(false);
        setGsxStatusMsg('GSX API-nyckel kunde inte hämtas.');
      } finally {
        setGsxTested(true);
      }
    };
    fetchGsxConfig();
  }, []);

  useEffect(() => {
    if (!selectedPriceList) {
      setPriceMap(new Map());
      return;
    }
    const loadPriceData = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8080/api/price/data/${selectedPriceList}`);
        if (!res.ok) throw new Error(`Failed to load price data for ${selectedPriceList}`);
        const priceData = await res.json();
        const newPriceMap = new Map(priceData.map(item => [item['Part Number'], item['ALP Ex VAT']]));
        setPriceMap(newPriceMap);
      } catch (e) {
        setError(`Error loading price list: ${e.message}`);
        setPriceMap(new Map());
      }
    };
    loadPriceData();
  }, [selectedPriceList]);

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
      const response = await fetch('http://127.0.0.1:8080/api/sales/upload', {
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
      } else {
        setError('No data found in the file or file is empty.');
      }
    } catch (e) {
      setError(`Upload failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const augmentedData = useMemo(() => {
    if (!data) return null;
    if (priceMap.size === 0) return data;
    return data.map(row => {
      const partNumber = row['Artikelnr (tillverkare)'];
      const alpPrice = priceMap.get(partNumber);
      return {
        ...row,
        'ALP Ex VAT': alpPrice !== undefined ? alpPrice : 'N/A'
      };
    });
  }, [data, priceMap]);

  // All possible headers
  const allHeaders = useMemo(() => {
    if (!augmentedData || augmentedData.length === 0) return [];
    return Object.keys(augmentedData[0]);
  }, [augmentedData]);

  // Default visible headers
  const defaultVisibleHeaders = useMemo(() => {
    if (!augmentedData || augmentedData.length === 0) return [];
    // Show all except some technical columns by default
    return allHeaders.filter(h => h !== 'ALP Ex VAT');
  }, [allHeaders]);

  // State for visible headers and column selector
  const [visibleHeaders, setVisibleHeaders] = useState(() => {
    // Try to load from localStorage
    const saved = localStorage.getItem('ateaSalesUploadVisibleHeaders');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return defaultVisibleHeaders;
  });
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  // Persist visibleHeaders in localStorage
  useEffect(() => {
    localStorage.setItem('ateaSalesUploadVisibleHeaders', JSON.stringify(visibleHeaders));
  }, [visibleHeaders]);

  // Update visibleHeaders if data changes and headers are missing
  useEffect(() => {
    if (!augmentedData || augmentedData.length === 0) return;
    // If new headers appear, add them to visibleHeaders
    setVisibleHeaders(prev => {
      const missing = allHeaders.filter(h => !prev.includes(h));
      if (missing.length > 0) return [...prev, ...missing];
      // If headers disappear, remove them
      return prev.filter(h => allHeaders.includes(h));
    });
  }, [allHeaders]);

  // Drag-and-drop reordering for visibleHeaders
  const handleHeaderToggle = (header) => {
    setVisibleHeaders(prev =>
      prev.includes(header)
        ? prev.filter(h => h !== header)
        : [...prev, header]
    );
  };

  // Drag state for reordering
  const [draggedHeader, setDraggedHeader] = useState(null);

  const handleDragStart = (header) => {
    setDraggedHeader(header);
  };
  const handleDragOver = (e, header) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const handleDrop = (e, targetHeader) => {
    e.preventDefault();
    if (draggedHeader && draggedHeader !== targetHeader) {
      setVisibleHeaders(prev => {
        const newOrder = [...prev];
        const fromIdx = newOrder.indexOf(draggedHeader);
        const toIdx = newOrder.indexOf(targetHeader);
        if (fromIdx === -1 || toIdx === -1) return newOrder;
        newOrder.splice(fromIdx, 1);
        newOrder.splice(toIdx, 0, draggedHeader);
        return newOrder;
      });
    }
    setDraggedHeader(null);
  };

  function normalizeSerial(serial) {
    if (typeof serial !== 'string') return serial;
    if (serial.length > 12 && serial[0].toUpperCase() === 'S') {
      return serial.slice(1);
    }
    return serial;
  }

  const navigate = useNavigate();
  const handleRowClick = (row) => {
    // Save to sessionStorage for fallback
    sessionStorage.setItem('selectedSalesOrder', JSON.stringify(row));
    navigate('/sales-order-detail', { state: { order: row } });
  };

  const totalPages = augmentedData ? Math.ceil(augmentedData.length / itemsPerPage) : 0;
  const paginatedData = augmentedData ? augmentedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) : [];

  const handleBulkExport = async () => {
    if (!augmentedData || augmentedData.length === 0) {
      alert('Ingen data att exportera.');
      return;
    }
    if (!gsxEnabled) {
      alert('GSX är inte aktiverat eller API-nyckel saknas.');
      return;
    }
    setIsExporting(true);
    setExportProgress(0);
    const exportData = [];
    const totalRows = augmentedData.length;
    for (let i = 0; i < totalRows; i++) {
      const row = augmentedData[i];
      exportData.push({ ...row });
      setExportProgress(((i + 1) / totalRows) * 100);
    }
    // XLSX export logic should be implemented here
    setIsExporting(false);
  };

  return (
    <div className="container" style={{ maxWidth: '95%', margin: '2rem auto' }}>
      <header className="atea-header">
        <div className="header-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {/* <a href="/"><img src="/images/logo.jpg" alt="Atea Logo" className="header-logo" style={{ height: '50px' }} /></a> */}
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
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem'}}>
              <div>
                <h4>Exportera med GSX-data</h4>
                <p style={{color: gsxEnabled ? 'var(--atea-green)' : 'var(--atea-red)'}}>
                  {gsxTested ? gsxStatusMsg : 'Kontrollerar GSX-konfiguration...'}
                </p>
                <div style={{display:'flex', gap:'1em', flexWrap:'wrap', alignItems:'center'}}>
                  <button
                    onClick={handleBulkExport}
                    disabled={!augmentedData || !gsxEnabled || isExporting}
                    className="btn btn-success"
                  >
                    {isExporting ? `Exporterar... (${Math.round(exportProgress)}%)` : 'Exportera allt till Excel'}
                  </button>
                  <button className="btn btn-info" style={{minWidth:'220px'}} onClick={() => {
                    try {
                      if (!augmentedData || !Array.isArray(augmentedData) || augmentedData.length === 0) {
                        alert('Ingen data att visa. Ladda upp och granska en fil först.');
                        return;
                      }
                      const json = JSON.stringify(augmentedData);
                      if (json.length > 4_500_000) {
                        alert('Data är för stor för att visas i sammanställningen. Prova med en mindre fil.');
                        return;
                      }
                      sessionStorage.setItem('customerProductSummaryData', json);
                      window.location.href = '/customer-product-summary';
                    } catch (e) {
                      alert('Kunde inte spara data i sessionStorage. Prova en mindre fil.');
                      return;
                    }
                  }}>
                    Visa produktsammanställning
                  </button>
                </div>
                {isExporting && (
                  <div className="progress-bar" style={{marginTop: '1rem'}}>
                    <div className="progress-bar-inner" style={{width: `${exportProgress}%`}}></div>
                  </div>
                )}
              </div>
              <div>
                <h4>Prisuppslag</h4>
                <p>Välj en prislista för att se kostnadspris (ALP Ex VAT) för varje artikel.</p>
                <div className="form-group">
                  <label>Välj prislista</label>
                  <select value={selectedPriceList} onChange={e => setSelectedPriceList(e.target.value)} disabled={priceLists.length === 0}>
                    {priceLists.length > 0 ? (
                      priceLists.map(f => <option key={f} value={f}>{f}</option>)
                    ) : (
                      <option>Inga prislistor hittades</option>
                    )}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
        {loading && <div className="loading" style={{marginTop: '2rem'}}><div className="spinner"></div><p>Läser filen...</p></div>}
        {augmentedData && (
          <div className="card" style={{ marginTop: '2rem', overflowX: 'auto' }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem'}}>
              <h3>Granska data ({augmentedData.length} rader)</h3>
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
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
                  <strong>Välj och sortera kolumner:</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1em', marginTop: '0.5em' }}>
                    {visibleHeaders.map((header, idx) => (
                      <div
                        key={header}
                        draggable
                        onDragStart={() => handleDragStart(header)}
                        onDragOver={e => handleDragOver(e, header)}
                        onDrop={e => handleDrop(e, header)}
                        style={{
                          marginRight: '1em',
                          fontWeight: 600,
                          background: draggedHeader === header ? '#e0f7fa' : '#fff',
                          border: '1px solid #ddd',
                          borderRadius: 4,
                          padding: '0.3em 0.7em',
                          cursor: 'move',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5em',
                        }}
                        title="Dra för att flytta kolumnen"
                      >
                        <span style={{fontSize:'1.1em',opacity:0.6}}>↕️</span>
                        <input
                          type="checkbox"
                          checked={true}
                          onChange={() => handleHeaderToggle(header)}
                          style={{ marginRight: '0.4em' }}
                        />
                        {header}
                      </div>
                    ))}
                    {/* Show unchecked headers at the end, not draggable */}
                    {allHeaders.filter(h => !visibleHeaders.includes(h)).map(header => (
                      <label key={header} style={{ marginRight: '1em', fontWeight: 400, opacity: 0.7 }}>
                        <input
                          type="checkbox"
                          checked={false}
                          onChange={() => handleHeaderToggle(header)}
                          style={{ marginRight: '0.4em' }}
                        />
                        {header}
                      </label>
                    ))}
                  </div>
                  <div style={{marginTop:'0.5em',fontSize:'0.95em',color:'#888'}}>Dra och släpp för att ändra ordning på kolumnerna.</div>
                </div>
              )}
            </div>
            <div className="table-container" style={{overflowX: 'auto'}}>
              <table className="table">
                <thead>
                  <tr>
                    {visibleHeaders.map(header => <th key={header}>{header}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((row, index) => (
                    <tr key={index} onClick={() => handleRowClick(row)} style={{cursor: 'pointer'}}>
                      {visibleHeaders.map(header => <td key={`${index}-${header}`}>{row[header]}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
