import React, { useState, useEffect } from 'react';

export default function PriceInfo(props) {
  const {
    priceLists: propPriceLists,
    discountPrograms: propDiscountPrograms,
    selectedPriceList,
    setSelectedPriceList,
    selectedProgram,
    setSelectedProgram,
    inputPartNumber,
    setInputPartNumber,
    priceData,
    loading,
    error,
    onFetchPriceInfo
  } = props;
  // Local state for fetched lists if not provided
  const [priceLists, setPriceLists] = useState(propPriceLists ?? []);
  const [discountPrograms, setDiscountPrograms] = useState(propDiscountPrograms ?? []);
  const [listsLoading, setListsLoading] = useState(false);
  const [programsLoading, setProgramsLoading] = useState(false);

  // Auto-select first price list and fetch price info if available
  useEffect(() => {
    if (priceLists.length > 0 && !selectedPriceList) {
      setSelectedPriceList(priceLists[0]);
      // Only fetch if part number is filled
      if (inputPartNumber) {
        onFetchPriceInfo(priceLists[0]);
      }
    }
  }, [priceLists, selectedPriceList, inputPartNumber, setSelectedPriceList, onFetchPriceInfo]);

  useEffect(() => {
    if (!propPriceLists || propPriceLists.length === 0) {
      setListsLoading(true);
      fetch('http://127.0.0.1:8080/api/price/list', { headers: { 'accept': 'application/json' } })
        .then(res => res.json())
        .then(data => setPriceLists(data))
        .catch(() => setPriceLists([]))
        .finally(() => setListsLoading(false));
    }
  }, [propPriceLists]);

  useEffect(() => {
    if (!propDiscountPrograms || propDiscountPrograms.length === 0) {
      setProgramsLoading(true);
      fetch('http://127.0.0.1:8080/api/discounts/', { headers: { 'accept': 'application/json' } })
        .then(res => res.json())
        .then(data => setDiscountPrograms(data))
        .catch(() => setDiscountPrograms([]))
        .finally(() => setProgramsLoading(false));
    }
  }, [propDiscountPrograms]);

  return (
    // <div className="price-info card" style={{ width: '100%', marginBottom: '2rem', boxSizing: 'border-box' }}>
    //   <h2>Prisinfo</h2>
    //   <div className="form-group">
    //     <label>Välj prislista:</label><br />
    //     <select className="form-control" value={selectedPriceList} onChange={e => setSelectedPriceList(e.target.value)}>
    //       <option value="">{listsLoading ? 'Hämtar prislistor...' : 'Välj...'}</option>
    //       {priceLists.length > 0 ? priceLists.map(pl => (
    //         <option key={pl} value={pl}>{pl}</option>
    //       )) : null}
    //     </select>
    //     {listsLoading && <div style={{ color: '#888', fontSize: '0.95em', marginTop: '0.5em' }}>Prislistor hämtas...</div>}
    //   </div>
    //   <div className="form-group">
    //     <label>Välj rabattprogram (valfritt):</label><br />
    //     <select className="form-control" value={selectedProgram} onChange={e => setSelectedProgram(e.target.value)}>
    //       <option value="">{programsLoading ? 'Hämtar rabattprogram...' : 'Ingen rabatt'}</option>
    //       {discountPrograms.length > 0 ? discountPrograms.map(dp => (
    //         <option key={dp} value={dp}>{dp}</option>
    //       )) : null}
    //     </select>
    //     {programsLoading && <div style={{ color: '#888', fontSize: '0.95em', marginTop: '0.5em' }}>Rabattprogram hämtas...</div>}
    //   </div>
    //   <div className="form-group">
    //     <label>Part Number:</label><br />
    //     <input className="form-control" value={inputPartNumber} onChange={e => setInputPartNumber(e.target.value)} placeholder="Ange artikelnummer" />
    //   </div>
    //   <button className="btn btn-primary" style={{ marginBottom: '1.5rem' }} onClick={onFetchPriceInfo} disabled={loading || !inputPartNumber || !selectedPriceList}>
    //     {loading ? 'Hämtar...' : 'Visa prisinfo'}
    //   </button>
    //   {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}
    //   {priceData && (
    //     <div className="card" style={{ width: '100%', padding: '2rem', marginTop: '1rem', boxSizing: 'border-box', background: '#f8fafc' }}>
    //       <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
    //         <span style={{ fontWeight: 600, fontSize: '1.2rem', color: '#2c3e50', marginRight: '1rem' }}>
    //           {priceData.program_name || 'Ingen rabatt'}
    //         </span>
    //         <span style={{ background: '#e0e7ff', color: '#1e293b', borderRadius: '6px', padding: '0.3rem 0.7rem', fontWeight: 500, fontSize: '0.95rem' }}>
    //           {priceData.discounts?.map((d, i) => (
    //             <span key={i} style={{ marginRight: '0.7rem' }}>{d.source}: <span style={{ color: '#6366f1', fontWeight: 600 }}>{(d.value * 100).toFixed(2)}%</span></span>
    //           ))}
    //         </span>
    //       </div>
    //       <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '1.2rem' }}>
    //         <div style={{ flex: 1 }}>
    //           <div style={{ fontSize: '1.1rem', color: '#64748b' }}>Listpris:</div>
    //           <div style={{ fontSize: '1.3rem', color: '#64748b', textDecoration: 'line-through' }}>{priceData.list_price?.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })}</div>
    //         </div>
    //         <div style={{ flex: 1 }}>
    //           <div style={{ fontSize: '1.1rem', color: '#0f766e' }}>Ditt pris:</div>
    //           <div style={{ fontSize: '2rem', color: '#0f766e', fontWeight: 700, background: '#d1fae5', borderRadius: '8px', padding: '0.5rem 1rem', boxShadow: '0 2px 8px rgba(16, 185, 129, 0.08)' }}>
    //             {priceData.new_price?.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })}
    //           </div>
    //         </div>
    //       </div>
    //       <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.2rem' }}>
    //         <div style={{ flex: 1 }}>
    //           <div style={{ fontSize: '1.1rem', color: '#6366f1' }}>Total rabatt:</div>
    //           <div style={{ fontSize: '1.3rem', color: '#6366f1', fontWeight: 600 }}>{(priceData.total_discount * 100).toFixed(2)}%</div>
    //         </div>
    //         <div style={{ flex: 1 }}>
    //           <div style={{ fontSize: '1.1rem', color: '#be185d' }}>Rabattbelopp:</div>
    //           <div style={{ fontSize: '1.3rem', color: '#be185d', fontWeight: 600 }}>{priceData.discount_amount?.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })}</div>
    //         </div>
    //       </div>
    //     </div>
   <div className="price-info card" style={{ width: '100%', padding: '2rem', marginBottom: '2rem', borderRadius: '1rem', background: '#ffffff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
  <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '2rem', color: '#111827' }}>Prisinfo</h2>

  {/* Inputformulär */}
  <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: '1fr 1fr 1fr', marginBottom: '2rem' }}>
    <div className="form-group">
      <label>Prislista</label>
      <select className="form-control" value={selectedPriceList} onChange={e => setSelectedPriceList(e.target.value)}>
        <option value="">{listsLoading ? 'Hämtar prislistor...' : 'Välj prislista'}</option>
        {priceLists.map(pl => <option key={pl} value={pl}>{pl}</option>)}
      </select>
    </div>

    <div className="form-group">
      <label>Rabattprogram</label>
      <select className="form-control" value={selectedProgram} onChange={e => setSelectedProgram(e.target.value)}>
        <option value="">{programsLoading ? 'Hämtar program...' : 'Ingen rabatt'}</option>
        {discountPrograms.map(dp => <option key={dp} value={dp}>{dp}</option>)}
      </select>
    </div>
    <br></br>
    <div className="form-group">
      <label>Part Number</label>
      <input className="form-control" placeholder="Ange artikelnummer" value={inputPartNumber} onChange={e => setInputPartNumber(e.target.value)} />
    </div>
  </div>

  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
    <button className="btn btn-primary" onClick={onFetchPriceInfo} disabled={loading || !inputPartNumber || !selectedPriceList}>
      {loading ? 'Hämtar...' : 'Visa prisinfo'}
    </button>
  </div>

  {error && <div className="alert alert-danger">{error}</div>}

  {/* Prisdata */}
  {priceData && (
    <div className="price-details" style={{ background: '#f9fafb', borderRadius: '1rem', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
       
      </div>

      {/* Pris */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ fontSize: '1rem', color: '#6b7280' }}>Listpris</div>
          <div style={{ textDecoration: 'line-through', fontSize: '1.5rem', fontWeight: 500, color: '#9ca3af' }}>
            {priceData.list_price?.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '1rem', color: '#6b7280' }}>Ditt pris</div>
          <div style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: '#1f2937',
            background: '#e0f2fe',
            padding: '0.6rem 1.2rem',
            borderRadius: '0.6rem'
          }}>
            {priceData.new_price?.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })}
          </div>
        </div>
      </div>

      {/* Sammanställning */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div>
          <div style={{ fontSize: '1rem', color: '#6b7280' }}>Total rabatt</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>
            {(priceData.total_discount * 100).toFixed(2)}%
          </div>
        </div>
        <div>
          <div style={{ fontSize: '1rem', color: '#6b7280' }}>Rabattbelopp</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>
            {priceData.discount_amount?.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })}
          </div>
        </div>
      </div>
      <br></br>
      <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>Rabattprogram: {priceData.program_name || 'Ingen rabatt'}</div>
      <br></br>
    
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {priceData.discounts?.map((d, i) => (
            <span key={i} style={{
              background: '#e5e7eb',
              color: '#111827',
              padding: '0.3rem 0.7rem',
              borderRadius: '6px',
              fontSize: '0.9rem'
            }}>
              {d.source}: <b>{(d.value * 100).toFixed(2)}%</b>
            </span>
          ))}
      </div>
    </div>
  )}
</div>
  )}
  
