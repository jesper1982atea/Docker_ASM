import { useEffect, useMemo, useState } from 'react';
import ErrorBoundary from './ErrorBoundary';
import GsxDetailsView from './GsxDetailsView';
import PriceInfo from './PriceInfo';
import PriceCalculate from './PriceCalculate';
import { getGsxApiKey, getGsxDeviceDetails } from './api';

function AteaSalesOrderDetailInner({ order }) {
  const [gsxDetails, setGsxDetails] = useState(order?.gsxDetails || null);
  const [gsxLoading, setGsxLoading] = useState(false);
  const [gsxError, setGsxError] = useState('');

  // Price info states
  const [selectedPriceList, setSelectedPriceList] = useState('ALP Ex VAT');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [inputPartNumber, setInputPartNumber] = useState(order?.['Artikelnr (tillverkare)'] || order?.['Serienr'] || '');
  const [priceData, setPriceData] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState('');

  // Helper for margin
  const margin = useMemo(() => {
    if (!order) return null;
    const sales = parseFloat(order['Tot Förs (SEK)']) || 0;
    const cost = parseFloat(order['Tot Kost (SEK)']) || 0;
    return { value: sales - cost, percent: sales ? ((sales - cost) / sales) * 100 : 0 };
  }, [order]);

  const serial = order?.['Serienr'] || '';

  // Fetch GSX details if not present
  useEffect(() => {
    if (!gsxDetails && serial) {
      setGsxLoading(true);
      setGsxError('');
      getGsxApiKey()
        .then(apiKeyData => {
          const apiKey = apiKeyData.api_key;
          if (!apiKey) throw new Error('GSX API-nyckel saknas.');
          return getGsxDeviceDetails(serial, apiKey);
        })
        .then(data => {
          if (data && data.device) {
            setGsxDetails(data.device);
          } else {
            setGsxError('GSX-information saknas för denna enhet.');
          }
        })
        .catch(err => setGsxError(err.message))
        .finally(() => setGsxLoading(false));
    }
  }, [gsxDetails, serial]);

  // Fetch price info when part number or price list changes
  useEffect(() => {
    if (!inputPartNumber || !selectedPriceList) return;
    setPriceLoading(true);
    setPriceError('');
    setPriceData(null);
    let url = `http://127.0.0.1:8080/api/discounts/lookup?part_number=${encodeURIComponent(inputPartNumber)}&price_list=${encodeURIComponent(selectedPriceList)}`;
    if (selectedProgram) url += `&program_name=${encodeURIComponent(selectedProgram)}`;
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('Kunde inte hämta prisinfo');
        return res.json();
      })
      .then(data => setPriceData(data))
      .catch(e => setPriceError(e.message))
      .finally(() => setPriceLoading(false));
  }, [inputPartNumber, selectedPriceList, selectedProgram]);

  if (!order) return <div className="container"><p>Ingen orderdata tillgänglig.</p></div>;

  return (
    <div className="container" style={{ maxWidth: '900px', margin: '2rem auto' }}>
      <header className="atea-header">
        <div className="header-content">
          <h1>Orderdetaljer</h1>
          <p>Ordernummer: {order['Ordernr']}</p>
        </div>
        <div className="header-links">
          <a href="/sales-upload" className="header-link">⬅️ Tillbaka till säljuppladdning</a>
        </div>
      </header>
      <main style={{ marginTop: '2rem' }}>
        <div className="card" style={{ padding: '2rem', background: 'var(--atea-white)' }}>
          <h3>Säljinformation</h3>
          <div className="detail-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div><span className="detail-label">Kund</span><span className="detail-value">{order['Kund']}</span></div>
            <div><span className="detail-label">Ordernummer</span><span className="detail-value">{order['Ordernr']}</span></div>
            <div><span className="detail-label">Bokföringsdatum</span><span className="detail-value">{order['Bokf datum']}</span></div>
            <div><span className="detail-label">Verifikationsnummer</span><span className="detail-value">{order['Ver nr']}</span></div>
          </div>
          <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '1.5rem', paddingTop: '1.5rem' }}>
            <h4>Produktspecifikation</h4>
            <div className="detail-grid" style={{ gridTemplateColumns: '1fr', gap: '1rem' }}>
              <div><span className="detail-label">Artikelbenämning</span><span className="detail-value">{order['Artikelbenämning (APA)']}</span></div>
              <div><span className="detail-label">Serienummer</span><span className="detail-value">{order['Serienr']}</span></div>
              <div><span className="detail-label">Tillverkarens artikelnr.</span><span className="detail-value">{order['Artikelnr (tillverkare)']}</span></div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '1.5rem', paddingTop: '1.5rem' }}>
            <h4>Ekonomi</h4>
            <div className="detail-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div><span className="detail-label">Antal</span><span className="detail-value">{order['Antal']}</span></div>
              <div><span className="detail-label">Försäljningspris (SEK)</span><span className="detail-value">{order['Tot Förs (SEK)']}</span></div>
              <div><span className="detail-label">Kostnadspris (SEK)</span><span className="detail-value">{order['Tot Kost (SEK)']}</span></div>
            </div>
            {margin && (
              <div style={{ marginTop: '1rem' }}>
                <strong>Marginal:</strong> {margin.value.toFixed(2)} SEK ({margin.percent.toFixed(1)}%)
              </div>
            )}
          </div>
        </div>

           <PriceInfo
          selectedPriceList={selectedPriceList}
          setSelectedPriceList={setSelectedPriceList}
          selectedProgram={selectedProgram}
          setSelectedProgram={setSelectedProgram}
          inputPartNumber={inputPartNumber}
          setInputPartNumber={setInputPartNumber}
          priceData={priceData}
          loading={priceLoading}
          error={priceError}
          onFetchPriceInfo={() => {}}
        />
        <PriceCalculate priceInfo={priceData} loading={priceLoading} error={priceError} />

        <div className="card" style={{ marginTop: '2rem', padding: '2rem' }}>
          <h3>GSX Information</h3>
          {gsxLoading && <div className="loading"><div className="spinner"></div><p>Hämtar GSX-detaljer...</p></div>}
          {gsxDetails ? (
            <GsxDetailsView gsxDetails={gsxDetails} serial={serial} />
          ) : (
            <p>{gsxError || 'GSX-information saknas för denna enhet.'}</p>
          )}
        </div>

     
      </main>
    </div>
  );
}

export default function AteaSalesOrderDetail(props) {
  return (
    <ErrorBoundary>
      <AteaSalesOrderDetailInner {...props} />
    </ErrorBoundary>
  );
}
