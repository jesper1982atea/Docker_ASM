// import React from 'react';


// export default function PriceComparisonTable({ summary, calculated }) {
//   console.log('PriceComparisonTable calculated:', calculated);

//   if (!summary || !calculated) return null;

//   const format = (val) =>
//     val !== undefined && val !== null && !isNaN(val)
//       ? val.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })
//       : '-';
//   const formatPct = (val) =>
//     val !== undefined && val !== null && !isNaN(val)
//       ? `${Number(val).toFixed(2)}%`
//       : '-';

//   return (
//     <div className="card" style={{ marginTop: '2rem', padding: '1.5rem', background: '#fff', borderRadius: '1rem', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
//       <h3 style={{ marginBottom: '1rem' }}>Prisjämförelse: Kundens produkter och Apple-alternativ</h3>
//       <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1rem' }}>
//         <thead>
//           <tr style={{ background: '#f8f8f8' }}>
//             <th style={cellStyle}>Produkt/Alternativ</th>
//             <th style={cellStyle}>Pris</th>
//             <th style={cellStyle}>Inköpspris</th>
//             <th style={cellStyle}>Marginal (kr)</th>
//             <th style={cellStyle}>Marginal (%)</th>
//           </tr>
//         </thead>
//         <tbody>
//           {summary.map((row) => {
//             const kundMarginalKr =
//               row.avgStyckpris !== undefined && row.avgInkopPris !== undefined && row.avgStyckpris !== null && row.avgInkopPris !== null
//                 ? row.avgStyckpris - row.avgInkopPris
//                 : null;
//             const kundMarginalPct =
//               kundMarginalKr !== null && row.avgStyckpris !== undefined && row.avgStyckpris !== 0
//                 ? (kundMarginalKr / row.avgStyckpris) * 100
//                 : null;
//             return (
//               <tr key={row.part} style={{ background: '#eaf6ff' }}>
//                 <td style={cellStyle}><b>{row.name} ({row.part})</b></td>
//                 <td style={cellStyle}>{format(row.avgStyckpris)}</td>
//                 <td style={cellStyle}>{format(row.avgInkopPris)}</td>
//                 <td style={cellStyle}>{format(kundMarginalKr)}</td>
//                 <td style={cellStyle}>{formatPct(kundMarginalPct)}</td>
//               </tr>
//             );
//           })}

//           {/* Apple Kontant */}
//           {calculated.kontant && typeof calculated.kontant.forsaljningspris === 'number' && !isNaN(calculated.kontant.forsaljningspris) && (
//             <tr>
//               <td style={cellStyle}>Apple Kontant</td>
//               <td style={cellStyle}>{format(calculated.kontant.forsaljningspris)}</td>
//               <td style={cellStyle}>{format(calculated.kontant.inköpspris)}</td>
//               <td style={cellStyle}>{format(calculated.kontant.marginal)}</td>
//               <td style={cellStyle}>{formatPct(calculated.kontant.marginal_procent)}</td>
//             </tr>
//           )}
//           {/* Apple Leasing 24 mån */}
//           {calculated.leasing && calculated.leasing['24'] && typeof calculated.leasing['24'].manadskostnad === 'number' && !isNaN(calculated.leasing['24'].manadskostnad) && (
//             <tr>
//               <td style={cellStyle}>Apple Leasing (24 mån)</td>
//               <td style={cellStyle}>
//                 {format(calculated.leasing['24'].manadskostnad)} / mån<br />
//                 <small style={{ color: '#666' }}>Totalt {format(calculated.leasing['24'].manadskostnad * 24)}</small>
//               </td>
//               <td style={cellStyle}>{format(calculated.leasing['24'].inköpspris)}</td>
//               <td style={cellStyle}>{format(calculated.leasing['24'].marginal)}</td>
//               <td style={cellStyle}>{formatPct(calculated.leasing['24'].marginal_procent)}</td>
//             </tr>
//           )}
//           {/* Apple Leasing 36 mån */}
//           {calculated.leasing && calculated.leasing['36'] && typeof calculated.leasing['36'].manadskostnad === 'number' && !isNaN(calculated.leasing['36'].manadskostnad) && (
//             <tr>
//               <td style={cellStyle}>Apple Leasing (36 mån)</td>
//               <td style={cellStyle}>
//                 {format(calculated.leasing['36'].manadskostnad)} / mån<br />
//                 <small style={{ color: '#666' }}>Totalt {format(calculated.leasing['36'].manadskostnad * 36)}</small>
//               </td>
//               <td style={cellStyle}>{format(calculated.leasing['36'].inköpspris)}</td>
//               <td style={cellStyle}>{format(calculated.leasing['36'].marginal)}</td>
//               <td style={cellStyle}>{formatPct(calculated.leasing['36'].marginal_procent)}</td>
//             </tr>
//           )}
//           {/* Apple Leasing 48 mån */}
//           {calculated.leasing && calculated.leasing['48'] && typeof calculated.leasing['48'].manadskostnad === 'number' && !isNaN(calculated.leasing['48'].manadskostnad) && (
//             <tr>
//               <td style={cellStyle}>Apple Leasing (48 mån)</td>
//               <td style={cellStyle}>
//                 {format(calculated.leasing['36'].manadskostnad)} / mån<br />
//                 <small style={{ color: '#666' }}>Totalt {format(calculated.leasing['36'].manadskostnad * 36)}</small>
//               </td>
//               <td style={cellStyle}>{format(calculated.leasing['48'].inköpspris)}</td>
//               <td style={cellStyle}>{format(calculated.leasing['48'].marginal)}</td>
//               <td style={cellStyle}>{formatPct(calculated.leasing['48'].marginal_procent)}</td>
//             </tr>
//           )}
//           {/* Apple Cirkulär */}
//           {calculated.cirkular && typeof calculated.cirkular.faktura_1 === 'number' && !isNaN(calculated.cirkular.faktura_1) && (
//             <tr>
//               <td style={cellStyle}>Apple Cirkulär</td>
//               <td style={cellStyle}>
//                 Faktura 1: {format(calculated.cirkular.faktura_1)}<br />
//                 Faktura 2: {format(calculated.cirkular.faktura_2)}
//               </td>
//               <td style={cellStyle}>{format(calculated.cirkular.inkopspris)}</td>
//               <td style={cellStyle}>{format(calculated.cirkular.marginal)}</td>
//               <td style={cellStyle}>{formatPct(calculated.cirkular.marginal_procent)}</td>
//             </tr>
//           )}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// const cellStyle = {
//   padding: '0.8rem',
//   border: '1px solid #ddd',
//   textAlign: 'left',
//   verticalAlign: 'top',
// };

// ny kod 

import React from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function PriceComparisonCards({ summary, calculated }) {
  if (!summary || summary.length === 0 || !calculated) return null;

  const format = (val) =>
    val !== undefined && val !== null && !isNaN(val)
      ? val.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })
      : '-';
  const formatPct = (val) =>
    val !== undefined && val !== null && !isNaN(val)
      ? `${Number(val).toFixed(2)}%`
      : '-';
  const diffStyle = (val) => ({ color: val < 0 ? 'red' : 'green', fontWeight: 600 });

  const exportToPDF = (product, apple, model) => {
    const doc = new jsPDF();
    const rows = [];

    const kundMarginalKr = product.avgStyckpris - product.avgInkopPris;
    const kundMarginalPct = (kundMarginalKr / product.avgStyckpris) * 100;

    rows.push([
      'Kund',
      format(product.avgStyckpris),
      format(product.avgInkopPris),
      format(kundMarginalKr),
      formatPct(kundMarginalPct),
    ]);

    if (model === 'kontant' && apple.kontant) {
      const a = apple.kontant;
      rows.push([
        'Apple Kontant',
        format(a.forsaljningspris),
        format(a.inköpspris),
        format(a.marginal),
        formatPct(a.marginal_procent),
      ]);
    }

    if (model === 'leasing' && apple.leasing?.['36']) {
      const a = apple.leasing['36'];
      rows.push([
        'Apple Leasing (36)',
        format(a.manadskostnad * 36),
        format(a.inköpspris),
        format(a.marginal),
        formatPct(a.marginal_procent),
      ]);
    }

    if (model === 'circular' && apple.circular) {
      const a = apple.circular;
      rows.push([
        'Apple Cirkulär',
        format(a.faktura_1 + a.faktura_2),
        format(a.inköpspris),
        format(a.marginal),
        formatPct(a.marginal_procent),
      ]);
    }

    autoTable(doc, {
      head: [['Typ', 'Pris', 'Inköpspris', 'Marginal (kr)', 'Marginal (%)']],
      body: rows,
    });

    doc.save(`${product.name}_${model}_jämförelse.pdf`);
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <h2 style={{ marginBottom: '1.5rem' }}>Prisjämförelse per produkt</h2>
      {summary.map((product) => {
        const apple = calculated;
        const kundMarginalKr = product.avgStyckpris - product.avgInkopPris;
        const kundMarginalPct = (kundMarginalKr / product.avgStyckpris) * 100;
        const calcDiff = (applePrice) => applePrice - product.avgStyckpris;

        return (
          <div
            key={product.part}
            style={{
              marginBottom: '2rem',
              border: '1px solid #ddd',
              borderRadius: '1rem',
              background: '#fefefe',
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #eee' }}>
              <h3 style={{ margin: 0 }}>{product.name} ({product.part}) Antal {product.count}</h3>
              <p style={{ marginTop: '0.5rem', color: '#555' }}>
                Kundens försäljningspris: <b>{format(product.avgStyckpris)}</b>, inköpspris: <b>{format(product.avgInkopPris)}</b><br />
                Marginal: <b>{format(kundMarginalKr)}</b> ({formatPct(kundMarginalPct)})
              </p>
              <p style={{
                marginTop: '1rem',
                padding: '1rem',
                background: '#f5f7fa',
                borderRadius: '0.75rem',
                color: '#333',
                lineHeight: 1.6,
                fontSize: '1rem'
              }}>
                <b>Köphistorik:</b><br />
                Kunden har köpt <b>{product.count} st</b> <b>{product.name}</b> (<code>{product.part}</code>)<br />
                Total försäljningsintäkt: <b>{format(product.avgStyckpris * product.count)}</b><br />
                Inköpskostnad: <b>{format(product.avgInkopPris * product.count)}</b><br />
                Total intjäning: <b style={{ color: '#1a7f37' }}>{format(kundMarginalKr * product.count)}</b>
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', padding: '1.5rem', alignItems: 'stretch' }}>
              {/* Apple Kontant */}
              {apple.kontant && (
                <div style={cardStyle}>
                  <h4>Apple Kontant</h4>
                  <p>Pris: <b>{format(apple.kontant.forsaljningspris)}</b></p>
                  <p>Inköpspris: <b>{format(apple.kontant.inköpspris)}</b></p>
                  <p>Marginal: <b>{format(apple.kontant.marginal)}</b> ({formatPct(apple.kontant.marginal_procent)})</p>
                  <p>Skillnad mot kundpris: <span style={diffStyle(calcDiff(apple.kontant.forsaljningspris))}>{format(calcDiff(apple.kontant.forsaljningspris))}</span></p>
                  <button onClick={() => exportToPDF(product, apple, 'kontant')}>Exportera PDF</button>
                </div>
              )}

              {/* Apple Leasing 36 mån */}
              {apple.leasing && apple.leasing['36'] && (
                <div style={cardStyle}>
                  <h4>Apple Leasing (36 mån)</h4>
                  <p>Månad: <b>{format(apple.leasing['36'].manadskostnad)}</b></p>
                  <p>Totalt: <b>{format(apple.leasing['36'].manadskostnad * 36)}</b></p>
                  <p>Inköpspris: <b>{format(apple.leasing['36'].inköpspris)}</b></p>
                  <p>Marginal: <b>{format(apple.leasing['36'].marginal)}</b> ({formatPct(apple.leasing['36'].marginal_procent)})</p>
                  <p>Skillnad mot kundpris: <span style={diffStyle(calcDiff(apple.leasing['36'].manadskostnad * 36))}>{format(calcDiff(apple.leasing['36'].manadskostnad * 36))}</span></p>
                  <button onClick={() => exportToPDF(product, apple, 'leasing')}>Exportera PDF</button>
                </div>
              )}

              {/* Apple Cirkulär */}
              {apple.circular && (
                <div style={cardStyle}>
                  <h4>Apple Cirkulär</h4>
                  <p>Faktura 1: <b>{format(apple.circular.faktura_1)}</b></p>
                  <p>Faktura 2: <b>{format(apple.circular.faktura_2)}</b></p>
                  <p>Totalt: <b>{format(apple.circular.faktura_1 + apple.circular.faktura_2)}</b></p>
                  <p>Inköpspris: <b>{format(apple.circular.inköpspris)}</b></p>
                  <p>Marginal: <b>{format(apple.circular.marginal)}</b> ({formatPct(apple.circular.marginal_procent)})</p>
                  <p>Skillnad mot kundpris: <span style={diffStyle(calcDiff(apple.circular.faktura_1 + apple.circular.faktura_2))}>{format(calcDiff(apple.circular.faktura_1 + apple.circular.faktura_2))}</span></p>
                  <button onClick={() => exportToPDF(product, apple, 'circular')}>Exportera PDF</button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const cardStyle = {
  flex: 1,
  minWidth: 220,
  background: '#f5f7fa',
  borderRadius: '0.75rem',
  padding: '1.2rem',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  height: '100%',
};