import React, { useState } from 'react';
import GradingInfoPopup from './GradingInfoPopup';

export default function PriceCalculate({ priceInfo, loading, error }) {
  // Default values
  const [restvarde, setRestvarde] = useState(25);
  const [kontantMarginal, setKontantMarginal] = useState(5);
  const [leasingMarginal, setLeasingMarginal] = useState(5);
  const [cirkularMarginal, setCirkularMarginal] = useState(5);
  const [result, setResult] = useState(null);
  const [gradingOpen, setGradingOpen] = useState(false);

  // Helper to determine best option
  function markBestOptions(data) {
    if (!data) return data;
    let bestCustomer = null;
    let bestAtea = null;
    let minCustomerValue = Infinity;
    let maxAteaValue = -Infinity;
    // For customer: choose lowest total cost (kontant, leasing, circular)
    if (data.kontant && data.kontant.forsaljningspris < minCustomerValue) {
      minCustomerValue = data.kontant.forsaljningspris;
      bestCustomer = 'kontant';
    }
    if (data.leasing && data.leasing['36'] && (data.leasing['36'].manadskostnad * 36) < minCustomerValue) {
      minCustomerValue = data.leasing['36'].manadskostnad * 36;
      bestCustomer = 'leasing';
    }
    if (data.circular && data.circular.faktura_1 < minCustomerValue) {
      minCustomerValue = data.circular.faktura_1;
      bestCustomer = 'circular';
    }
    // For Atea: choose highest margin
    if (data.kontant && data.kontant.marginal > maxAteaValue) {
      maxAteaValue = data.kontant.marginal;
      bestAtea = 'kontant';
    }
    if (data.leasing && data.leasing['36'] && data.leasing['36'].marginal > maxAteaValue) {
      maxAteaValue = data.leasing['36'].marginal;
      bestAtea = 'leasing';
    }
    if (data.circular && data.circular.marginal > maxAteaValue) {
      maxAteaValue = data.circular.marginal;
      bestAtea = 'circular';
    }
    // Set flags
    if (data.kontant) {
      data.kontant.isBest = bestCustomer === 'kontant';
      data.kontant.isBestAtea = bestAtea === 'kontant';
    }
    if (data.leasing && data.leasing['36']) {
      // Only set isBest/isBestAtea on the 36 month period object
      data.leasing['36'].isBest = bestCustomer === 'leasing';
      data.leasing['36'].isBestAtea = bestAtea === 'leasing';
    }
    if (data.circular) {
      data.circular.isBest = bestCustomer === 'circular';
      data.circular.isBestAtea = bestAtea === 'circular';
    }
    return data;
  }

  const handleCalculate = async () => {
    if (!priceInfo) {
      setResult({ error: "Ingen prisinfo tillgänglig." });
      return;
    }
    setResult(null);
    const inkopspris = priceInfo.new_price;
    const alpPrice = priceInfo.list_price;
    if (inkopspris == null || alpPrice == null) {
      setResult({ error: `Saknar prisdata: inköpspris=${inkopspris}, ALP=${alpPrice}` });
      console.error("Saknar prisdata", { inkopspris, alpPrice, priceInfo });
      return;
    }
    const url = `http://127.0.0.1:8080/api/price/calculate?inkopspris=${encodeURIComponent(inkopspris)}&restvarde=${encodeURIComponent(restvarde)}&alp_price=${encodeURIComponent(alpPrice)}&kontant_marginal_procent=${encodeURIComponent(kontantMarginal)}&leasing_marginal_procent=${encodeURIComponent(leasingMarginal)}&cirkular_marginal_procent=${encodeURIComponent(cirkularMarginal)}`;
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'accept': 'application/json' }, body: '' });
      if (!res.ok) throw new Error("Kunde inte beräkna pris");
      let data = await res.json();
      data = markBestOptions(data);
      setResult(data);
    } catch (e) {
      setResult({ error: e.message });
    }
  };

  return (
  
<div className="card price-calculator-module" style={{
  position: 'relative',
  padding: '2rem',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  marginBottom: '2rem',
  borderRadius: '1rem',
  background: '#fff'
}}>
  <h2 style={{ marginBottom: '1.5rem' }}>Prisberäkning</h2>

  {/* Slider inputs */}
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1.2rem',
    marginBottom: '2rem'
  }}>
    {[ 
      { label: 'Restvärde', value: restvarde, setter: setRestvarde, max: 100 },
      { label: 'Kontant marginal', value: kontantMarginal, setter: setKontantMarginal, max: 20 },
      { label: 'Leasing marginal', value: leasingMarginal, setter: setLeasingMarginal, max: 20 },
      { label: 'Cirkulär marginal', value: cirkularMarginal, setter: setCirkularMarginal, max: 20 }
    ].map((item, i) => (
      <div key={i} className="form-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <label style={{ fontWeight: 600, marginBottom: 8 }}>{item.label}: {item.value}%</label>
        <input
          type="range"
          min="0"
          max={item.max}
          value={item.value}
          onChange={e => { item.setter(Number(e.target.value)); setResult(null); }}
          style={{ width: '100%' }}
        />
      </div>
    ))}
  </div>

  {/* Calculate button */}
  <button
    className="btn btn-primary"
    style={{ marginBottom: '2rem', padding: '0.75rem 1.5rem', fontSize: '1rem', borderRadius: '8px' }}
    onClick={handleCalculate}
  >
    Beräkna pris
  </button>

  {/* Error message */}
  {result?.error && (
    <div className="alert alert-danger" style={{
      backgroundColor: '#ffe0e0',
      border: '1px solid #f5c2c7',
      padding: '1rem',
      borderRadius: '0.5rem',
      marginBottom: '1rem',
      color: '#842029'
    }}>
      {result.error}
    </div>
  )}

  {/* Results */}
  {result && !result.error && (
    <div className="price-result" style={{
      display: 'grid',
      gap: '1.5rem',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))'
    }}>
      {/* Kontant */}
      {result.kontant && (
        <div className="result-item card" style={{ padding: '1.2rem', background: '#f9f9f9', borderRadius: '0.75rem', textAlign: 'left' }}>
          <div style={{ fontWeight: 700, color: '#1a7f37', marginBottom: '0.5rem', textAlign: 'left' }}>Kontant</div>
          <div style={{ textAlign: 'left' }}>Försäljningspris: <b>{result.kontant.forsaljningspris.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })}</b></div>
          <div style={{ textAlign: 'left' }}>Ateas intjäning: <b>{result.kontant.marginal.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })}</b> <span style={{ color: '#888' }}>({result.kontant.marginal_procent.toFixed(2)}%)</span></div>
          <div className="info-text" style={{ color: '#888', marginTop: '0.5rem', textAlign: 'left' }}>{result.kontant.info}</div>
          {result.kontant.isBest && (
            <div className="badge" style={{
              background: '#1a7f37',
              color: 'white',
              borderRadius: '999px',
              padding: '0.4em 1.1em',
              marginTop: '0.7em',
              fontWeight: 700,
              fontSize: '1em',
              boxShadow: '0 2px 8px rgba(26,127,55,0.10)',
              display: 'inline-block',
              letterSpacing: '0.03em',
              border: 'none'
            }}>Bäst för kund</div>
          )}
          {result.kontant.isBestAtea && (
            <div className="badge" style={{
              background: '#4f46e5',
              color: 'white',
              borderRadius: '999px',
              padding: '0.4em 1.1em',
              marginTop: '0.7em',
              fontWeight: 700,
              fontSize: '1em',
              boxShadow: '0 2px 8px rgba(79,70,229,0.10)',
              display: 'inline-block',
              letterSpacing: '0.03em',
              border: 'none'
            }}>Bäst för Atea</div>
          )}
        </div>
      )}

      {/* Leasing */}
      {result.leasing && (
        <div className="result-item card" style={{ padding: '1.2rem', background: '#f9f9f9', borderRadius: '0.75rem', textAlign: 'left' }}>
          <div style={{ fontWeight: 700, color: '#4f46e5', marginBottom: '0.5rem', textAlign: 'left' }}>Hyra</div>
          <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                <th>Mån</th><th>Månadskostnad</th>
              </tr>
            </thead>
            <tbody>
              {['24', '36', '48'].map(period => (
                result.leasing[period] && (
                  <tr key={period} style={{ textAlign: 'left' }}>
                    <td>{period}</td>
                    <td>{result.leasing[period].manadskostnad.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })}</td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
          {/* Totalkostnad for default period (e.g. 36 months) */}
          {result.leasing['36'] && (
            <>
              <div style={{ marginTop: '1rem', fontWeight: 600, color: '#1a7f37', textAlign: 'left' }}>
                Totalkostnad: {(result.leasing['36'].manadskostnad * 36).toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })}
              </div>
              <div style={{ marginTop: '0.5rem', textAlign: 'left', color: '#444', fontSize: '0.98em' }}>
                Restvärde: <b>{result.leasing['36'].restvarde.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })}</b>
              </div>
              <div style={{ marginTop: '0.2rem', textAlign: 'left', color: '#444', fontSize: '0.98em' }}>
                Ateas intjäning: <b>{result.leasing['36'].marginal.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })}</b>
                <span style={{ color: '#888', marginLeft: '0.5em' }}>({result.leasing['36'].marginal_procent.toFixed(2)}%)</span>
              </div>
              <br></br>
               <div style={{ marginTop: '0.2rem', textAlign: 'left', color: '#444', fontSize: '0.98em' }}>
                Förutsätter att man lämnar tillbaka datorn efter hyresperioden. Samt att enheten har ett bra skick antingen gradering A eller B
                
              </div>
            </>
          )}
          <div className="info-text" style={{ color: '#888', marginTop: '0.5rem', textAlign: 'left' }}>{result.leasing.info}</div>
          {/* Show badges only for 36 month period */}
          {result.leasing['36']?.isBest && (
            <div className="badge" style={{
              background: '#1a7f37',
              color: 'white',
              borderRadius: '999px',
              padding: '0.4em 1.1em',
              marginTop: '0.7em',
              fontWeight: 700,
              fontSize: '1em',
              boxShadow: '0 2px 8px rgba(26,127,55,0.10)',
              display: 'inline-block',
              letterSpacing: '0.03em',
              border: 'none'
            }}>Bäst för kund</div>
          )}
          {result.leasing['36']?.isBestAtea && (
            <div className="badge" style={{
              background: '#4f46e5',
              color: 'white',
              borderRadius: '999px',
              padding: '0.4em 1.1em',
              marginTop: '0.7em',
              fontWeight: 700,
              fontSize: '1em',
              boxShadow: '0 2px 8px rgba(79,70,229,0.10)',
              display: 'inline-block',
              letterSpacing: '0.03em',
              border: 'none'
            }}>Bäst för Atea</div>
          )}
        </div>
      )}

      {/* Cirkulär */}
      {result.circular && (
        <div className="result-item card" style={{ padding: '1.2rem', background: '#f9f9f9', borderRadius: '0.75rem', textAlign: 'left' }}>
          <div style={{ fontWeight: 700, color: '#0b5340', marginBottom: '0.5rem', textAlign: 'left' }}>Cirkulär</div>
          <div style={{ textAlign: 'left', color: '#0b5340' }}>Kundpris: <b>{result.circular.faktura_1.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })}</b></div>
          <br></br>
          <div style={{ textAlign: 'left' }}>Faktura 1: <b>{result.circular.faktura_1.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })}</b></div>
          <div style={{ textAlign: 'left' }}>Faktura 2: <b>{result.circular.faktura_2.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })}</b></div>
          <br></br>
          <div style={{ textAlign: 'left' }}>Ateas intjäning: <b>{result.circular.marginal.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })}</b> <span style={{ color: '#888' }}>({result.circular.marginal_procent.toFixed(2)}%)</span></div>
             <div className="info-text" style={{ color: '#888', marginTop: '0.5rem', textAlign: 'left' }}    >
                Förutsätter att man lämnar tillbaka datorn efter avtalsperioden 36 månader. Samt att enheten har ett bra skick antingen gradering A eller B
                
          </div>
          <div className="info-text" style={{ color: '#888', marginTop: '0.5rem', textAlign: 'left' }}>
  Förutsätter att man lämnar tillbaka datorn efter avtalsperioden 36 månader. Samt att enheten har ett bra skick antingen gradering A eller B
  <button
    type="button"
    style={{
      marginLeft: 8,
      background: 'none',
      color: '#1a7f37',
      border: 'none',
      textDecoration: 'underline',
      cursor: 'pointer',
      fontSize: '0.98em',
      padding: 0
    }}
    onClick={() => setGradingOpen(true)}
  >Vad betyder gradering?</button>
</div>
      <GradingInfoPopup open={gradingOpen} onClose={() => setGradingOpen(false)} />
      <GradingInfoPopup open={gradingOpen} onClose={() => setGradingOpen(false)} />
          <div className="info-text" style={{ color: '#888', marginTop: '0.5rem', textAlign: 'left' }}>{result.circular.info}</div>
          {result.circular.isBest && (
            <div className="badge" style={{
              background: '#1a7f37',
              color: 'white',
              borderRadius: '999px',
              padding: '0.4em 1.1em',
              marginTop: '0.7em',
              fontWeight: 700,
              fontSize: '1em',
              boxShadow: '0 2px 8px rgba(26,127,55,0.10)',
              display: 'inline-block',
              letterSpacing: '0.03em',
              border: 'none'
            }}>Bäst för kund</div>
          )}
          {result.circular.isBestAtea && (
            <div className="badge" style={{
              background: '#4f46e5',
              color: 'white',
              borderRadius: '999px',
              padding: '0.4em 1.1em',
              marginTop: '0.7em',
              fontWeight: 700,
              fontSize: '1em',
              boxShadow: '0 2px 8px rgba(79,70,229,0.10)',
              display: 'inline-block',
              letterSpacing: '0.03em',
              border: 'none'
            }}>Bäst för Atea</div>
          )}
        </div>
      )}
    </div>
  )}
</div>
    );
    }   

