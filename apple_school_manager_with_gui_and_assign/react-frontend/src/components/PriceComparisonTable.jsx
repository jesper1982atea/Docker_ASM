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

// import React from 'react';
// import { jsPDF } from 'jspdf';
// import autoTable from 'jspdf-autotable';

// export default function PriceComparisonCards({ summary, calculated }) {
//   if (!summary || summary.length === 0 || !calculated) return null;

//   const format = (val) =>
//     val !== undefined && val !== null && !isNaN(val)
//       ? val.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })
//       : '-';
//   const formatPct = (val) =>
//     val !== undefined && val !== null && !isNaN(val)
//       ? `${Number(val).toFixed(2)}%`
//       : '-';
//   const diffStyle = (val) => ({ color: val < 0 ? 'red' : 'green', fontWeight: 600 });

//   const exportToPDF = (product, apple, model) => {
//     const doc = new jsPDF();
//     const rows = [];

//     const kundMarginalKr = product.avgStyckpris - product.avgInkopPris;
//   if (!summary || summary.length === 0 || !calculated) return null;

//   const format = (val) =>
//     val !== undefined && val !== null && !isNaN(val)
//       ? val.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })
//       : '-';
//   const formatPct = (val) =>
//     val !== undefined && val !== null && !isNaN(val)
//       ? `${Number(val).toFixed(2)}%`
//       : '-';
//   const diffStyle = (val) => ({ color: val < 0 ? 'red' : 'green', fontWeight: 600 });

//   const exportToPDF = (product, apple, model) => {
//     const doc = new jsPDF();
//     const rows = [];

//     const kundMarginalKr = product.avgStyckpris - product.avgInkopPris;
//     const kundMarginalPct = (kundMarginalKr / product.avgStyckpris) * 100;

//     rows.push([
//       'Kund',
//       format(product.avgStyckpris),
//       format(product.avgInkopPris),
//       format(kundMarginalKr),
//       formatPct(kundMarginalPct),
//     ]);

//     if (model === 'kontant' && apple.kontant) {
//       const a = apple.kontant;
//       rows.push([
//         'Apple Kontant',
//         format(a.forsaljningspris),
//         format(a.inköpspris),
//         format(a.marginal),
//         formatPct(a.marginal_procent),
//       ]);
//     }

//     if (model === 'leasing' && apple.leasing?.['36']) {
//       const a = apple.leasing['36'];
//       rows.push([
//         'Apple Leasing (36)',
//         format(a.manadskostnad * 36),
//         format(a.inköpspris),
//         format(a.marginal),
//         formatPct(a.marginal_procent),
//       ]);
//     }

//     if (model === 'circular' && apple.circular) {
//       const a = apple.circular;
//       rows.push([
//         'Apple Cirkulär',
//         format(a.faktura_1 + a.faktura_2),
//         format(a.inköpspris),
//         format(a.marginal),
//         formatPct(a.marginal_procent),
//       ]);
//     }

//     autoTable(doc, {
//       head: [['Typ', 'Pris', 'Inköpspris', 'Marginal (kr)', 'Marginal (%)']],
//       body: rows,
//     });

//     doc.save(`${product.name}_${model}_jämförelse.pdf`);
//   };

//   return (
//     <div style={{ marginTop: '2rem' }}>
//       <h2 style={{ marginBottom: '1.5rem' }}>Prisjämförelse per produkt</h2>
//       {summary.map((product) => {
//         const apple = calculated;
//         const kundMarginalKr = product.avgStyckpris - product.avgInkopPris;
//         const kundMarginalPct = (kundMarginalKr / product.avgStyckpris) * 100;
//         const calcDiff = (applePrice) => applePrice - product.avgStyckpris;

//         return (
//           <div
//             key={product.part}
//             style={{
//               marginBottom: '2rem',
//               border: '1px solid #ddd',
//               borderRadius: '1rem',
//               background: '#fefefe',
//               boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
//             }}
//           >
//             <div style={{ padding: '1.5rem', borderBottom: '1px solid #eee' }}>
//               <h3 style={{ margin: 0 }}>{product.name} ({product.part}) Antal {product.count}</h3>
//               <p style={{ marginTop: '0.5rem', color: '#555' }}>
//                 Kundens försäljningspris: <b>{format(product.avgStyckpris)}</b>, inköpspris: <b>{format(product.avgInkopPris)}</b><br />
//                 Marginal: <b>{format(kundMarginalKr)}</b> ({formatPct(kundMarginalPct)})
//               </p>
//               <p style={{
//                 marginTop: '1rem',
//                 padding: '1rem',
//                 background: '#f5f7fa',
//                 borderRadius: '0.75rem',
//                 color: '#333',
//                 lineHeight: 1.6,
//                 fontSize: '1rem'
//               }}>
//                 <b>Köphistorik:</b><br />
//                 Kunden har köpt <b>{product.count} st</b> <b>{product.name}</b> (<code>{product.part}</code>)<br />
//                 Total försäljningsintäkt: <b>{format(product.avgStyckpris * product.count)}</b><br />
//                 Inköpskostnad: <b>{format(product.avgInkopPris * product.count)}</b><br />
//                 Total intjäning: <b style={{ color: '#1a7f37' }}>{format(kundMarginalKr * product.count)}</b>
//               </p>
//             </div>

//             <div style={{ display: 'flex', gap: '1.5rem', padding: '1.5rem', alignItems: 'stretch' }}>
//               {/* Apple Kontant */}
//               {apple.kontant && (
//                 <div style={cardStyle}>
//                   <h4>Apple Kontant</h4>
//                   <p>Pris: <b>{format(apple.kontant.forsaljningspris)}</b></p>
//                   <p>Inköpspris: <b>{format(apple.kontant.inköpspris)}</b></p>
//                   <p>Marginal: <b>{format(apple.kontant.marginal)}</b> ({formatPct(apple.kontant.marginal_procent)})</p>
//                   <p>Skillnad mot kundpris: <span style={diffStyle(calcDiff(apple.kontant.forsaljningspris))}>{format(calcDiff(apple.kontant.forsaljningspris))}</span></p>
//                   <button onClick={() => exportToPDF(product, apple, 'kontant')}>Exportera PDF</button>
//                 </div>
//               )}

//               {/* Apple Leasing 36 mån */}
//               {apple.leasing && apple.leasing['36'] && (
//                 <div style={cardStyle}>
//                   <h4>Apple Leasing (36 mån)</h4>
//                   <p>Månad: <b>{format(apple.leasing['36'].manadskostnad)}</b></p>
//                   <p>Totalt: <b>{format(apple.leasing['36'].manadskostnad * 36)}</b></p>
//                   <p>Inköpspris: <b>{format(apple.leasing['36'].inköpspris)}</b></p>
//                   <p>Marginal: <b>{format(apple.leasing['36'].marginal)}</b> ({formatPct(apple.leasing['36'].marginal_procent)})</p>
//                   <p>Skillnad mot kundpris: <span style={diffStyle(calcDiff(apple.leasing['36'].manadskostnad * 36))}>{format(calcDiff(apple.leasing['36'].manadskostnad * 36))}</span></p>
//                   <button onClick={() => exportToPDF(product, apple, 'leasing')}>Exportera PDF</button>
//                 </div>
//               )}

//               {/* Apple Cirkulär */}
//               {apple.circular && (
//                 <div style={cardStyle}>
//                   <h4>Apple Cirkulär</h4>
//                   <p>Faktura 1: <b>{format(apple.circular.faktura_1)}</b></p>
//                   <p>Faktura 2: <b>{format(apple.circular.faktura_2)}</b></p>
//                   <p>Totalt: <b>{format(apple.circular.faktura_1 + apple.circular.faktura_2)}</b></p>
//                   <p>Inköpspris: <b>{format(apple.circular.inköpspris)}</b></p>
//                   <p>Marginal: <b>{format(apple.circular.marginal)}</b> ({formatPct(apple.circular.marginal_procent)})</p>
//                   <p>Skillnad mot kundpris: <span style={diffStyle(calcDiff(apple.circular.faktura_1 + apple.circular.faktura_2))}>{format(calcDiff(apple.circular.faktura_1 + apple.circular.faktura_2))}</span></p>
//                   <br></br>
//                   <p>Denna modell är cirkulär och ska returneras efter 36 månader. För att betala {format(apple.circular.faktura_1)}</p>
//                   <button onClick={() => exportToPDF(product, apple, 'circular')}>Exportera PDF</button>
//                 </div>
//               )}

//               {/* Sammanfattning */}
//               <div style={cardStyle}>
//                 <h4>Sammanfattning</h4>
//                 <ul style={{ paddingLeft: '1.2rem', margin: '0.5rem 0', color: '#333', fontSize: '1rem', lineHeight: 1.6 }}>
//                   <li><b>Antal köpta:</b> {product.count}</li>
//                   <li><b>Totalt försäljningspris:</b> {format(product.avgStyckpris * product.count)}</li>
//                   <li><b>Totalt inköpspris:</b> {format(product.avgInkopPris * product.count)}</li>
//                   <li><b>Total marginal:</b> <span style={{ color: '#1a7f37' }}>{format((product.avgStyckpris - product.avgInkopPris) * product.count)}</span></li>
//                   <li><b>Marginal per enhet:</b> {format(product.avgStyckpris - product.avgInkopPris)} ({formatPct((product.avgStyckpris - product.avgInkopPris) / product.avgStyckpris * 100)})</li>
//                 </ul>
//                 <div style={{ marginTop: '1rem', fontSize: '0.95rem', color: '#666' }}>
//                   <span>Denna sammanfattning visar total intjäning och marginal för produkten baserat på köphistorik.</span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         );
//       })}


// NY KOD

import React from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function PriceComparisonCards({ summary, calculated, appleproduct}) {
  if (!summary || summary.length === 0 || !calculated) return null;
  console.log("AppleProduct", appleproduct);
  const format = (val) =>
    val !== undefined && val !== null && !isNaN(val)
      ? val.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })
      : '-';
  const formatPct = (val) =>
    val !== undefined && val !== null && !isNaN(val)
      ? `${Number(val).toFixed(2)}%`
      : '-';

  const exportAllToPDF = () => {
    const doc = new jsPDF();
    summary.forEach((product, i) => {
      const kundMarginalKr = product.avgStyckpris - product.avgInkopPris;
      const kundMarginalPct = (kundMarginalKr / product.avgStyckpris) * 100;

      autoTable(doc, {
        startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 20,
        head: [[
          'Produkt', 'Pris', 'Inköpspris', 'Marginal (kr)', 'Marginal (%)'
        ]],
        body: [[
          `${product.name} (${product.part})`,
          format(product.avgStyckpris),
          format(product.avgInkopPris),
          format(kundMarginalKr),
          formatPct(kundMarginalPct)
        ]]
      });

      const apple = calculated;

      if (apple.kontant) {
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 5,
          head: [['Apple Kontant', 'Pris', 'Inköpspris', 'Marginal (kr)', 'Marginal (%)']],
          body: [[
            '',
            format(apple.kontant.forsaljningspris),
            format(apple.kontant.inköpspris),
            format(apple.kontant.marginal),
            formatPct(apple.kontant.marginal_procent)
          ]]
        });
      }

      if (apple.leasing?.['36']) {
        const a = apple.leasing['36'];
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 5,
          head: [['Apple Leasing (36 mån)', 'Totalt Pris', 'Inköpspris', 'Marginal (kr)', 'Marginal (%)']],
          body: [[
            '',
            format(a.manadskostnad * 36),
            format(a.inköpspris),
            format(a.marginal),
            formatPct(a.marginal_procent)
          ]]
        });
      }

      if (apple.circular) {
        const a = apple.circular;
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 5,
          head: [['Apple Cirkulär', 'Totalt Pris', 'Inköpspris', 'Marginal (kr)', 'Marginal (%)']],
          body: [[
            '',
            format(a.faktura_1 + a.faktura_2),
            format(a.inköpspris),
            format(a.marginal),
            formatPct(a.marginal_procent)
          ]]
        });
      }

      doc.setFontSize(10);
      doc.setTextColor(80);
      doc.text('Apple-alternativen är beräknade utifrån leasing/kontant/cirkulärmodell och ger ofta en högre marginal och lägre kostnad för kunden.', 14, doc.lastAutoTable.finalY + 10, { maxWidth: 180 });

      if (i < summary.length - 1) {
        doc.addPage();
      }
    });

    doc.save('prisjämförelse_alla_produkter.pdf');
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
        <button onClick={exportAllToPDF} style={{ padding: '0.6rem 1rem', borderRadius: '0.5rem', backgroundColor: '#0077cc', color: '#fff', border: 'none' }}>
          Ladda ner alla som PDF
        </button>
      </div>

      {summary.map((product) => {
        const kundMarginalKr = product.avgStyckpris - product.avgInkopPris;
        const kundMarginalPct = (kundMarginalKr / product.avgStyckpris) * 100;
        const calcDiff = (val) => val - product.avgStyckpris;
        const apple = calculated;

        return (
          <div key={product.part} style={{ border: '1px solid #ccc', borderRadius: '1rem', marginBottom: '2rem', padding: '1.5rem' }}>
            <h3>{product.name} ({product.part})</h3>
            <p style={{ color: '#555' }}>
              Försäljningspris: <b>{format(product.avgStyckpris)}</b>, Inköpspris: <b>{format(product.avgInkopPris)}</b><br />
              Marginal: <b>{format(kundMarginalKr)}</b> ({formatPct(kundMarginalPct)})
              <p>Apple Produkt {appleproduct.Description}</p>
            </p>

            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
              {/* Apple cards */}
              {apple.kontant && (
                <AppleCard
                  title="Apple Kontant"
                  price={apple.kontant.forsaljningspris}
                  purchase={apple.kontant.inköpspris}
                  margin={apple.kontant.marginal}
                  marginPct={apple.kontant.marginal_procent}
                  diff={calcDiff(apple.kontant.forsaljningspris)}
                  currentMargin={kundMarginalPct}
                  pcPriceCustomer={product.avgStyckpris}
                  count={product.count}
                  kundMarginalKr={kundMarginalKr}
                />
              )}
              {apple.leasing?.['36'] && (
                <AppleCard
                  title="Apple Leasing (36 mån)"
                  price={apple.leasing['36'].manadskostnad * 36}
                  purchase={apple.leasing['36'].inköpspris}
                  margin={apple.leasing['36'].marginal}
                  marginPct={apple.leasing['36'].marginal_procent}
                  diff={calcDiff(apple.leasing['36'].manadskostnad * 36)}
                  currentMargin={kundMarginalPct}
                  pcPriceCustomer={product.avgStyckpris}
                  count={product.count}
                  kundMarginalKr={kundMarginalKr}
                />
              )}
              {apple.circular && (
                <AppleCard
                  title="Apple Cirkulär"
                  price={apple.circular.faktura_1 + apple.circular.faktura_2}
                  purchase={apple.circular.inköpspris}
                  margin={apple.circular.marginal}
                  marginPct={apple.circular.marginal_procent}
                  diff={calcDiff(apple.circular.faktura_1 + apple.circular.faktura_2)}
                  currentMargin={kundMarginalPct}
                  pcPriceCustomer={product.avgStyckpris}
                  count={product.count}
                  kundMarginalKr={kundMarginalKr}
                />
              )}
            </div>

            <div style={{ marginTop: '1rem', padding: '1rem', background: '#f9f9f9', borderRadius: '0.75rem', color: '#444' }}>
              <b>Sammanfattning:</b> Apple-alternativen ger ofta bättre marginal och kan sänka kundens kostnad – särskilt genom cirkulära modeller. Detta möjliggör både hållbarhet och affärsvärde.
              <br></br>
              <br></br>
              {/* <p>Kunden har köpt {product.count} av {product.part} till ett pris av {format(product.avgStyckpris * product.count)} som har gätt en intäckt på {format((kundMarginalKr) * product.count)} </p> */}
              <div
                style={{
                  background: '#f8f9fb',
                  padding: '1rem 1.5rem',
                  borderRadius: '0.75rem',
                  border: '1px solid #ddd',
                  color: '#333',
                  fontSize: '1rem',
                  marginTop: '1rem',
                  lineHeight: 1.6
                }}
              >
                <p style={{ margin: 0 }}>
                  <b>Kunden har köpt:</b> {product.count} st <code>{product.part}</code><br />
                  <b>Totalt pris:</b> {format(product.avgStyckpris * product.count)}<br />
                  <b>Total intäkt (marginal):</b> <span style={{ color: '#1a7f37', fontWeight: 600 }}>
                    {format(kundMarginalKr * product.count)}
                  </span>
                  <br></br>
                  <br></br>
                     <b>Om man hade köpt apple</b> <br />
                  <b>Totalt pris:</b> {format(apple.kontant.forsaljningspris * product.count)}<br />
                  <b>Total intäkt (marginal):</b> <span style={{ color: '#1a7f37', fontWeight: 600 }}>
                    {format(apple.kontant.marginal * product.count)}
                  </span>
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// function AppleCard({ title, price, purchase, margin, marginPct, diff, currentMargin, pcPriceCustomer }) {
//   const format = (val) =>
//     val !== undefined && val !== null && !isNaN(val)
//       ? val.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })
//       : '-';
//   const formatPct = (val) =>
//     val !== undefined && val !== null && !isNaN(val)
//       ? `${Number(val).toFixed(2)}%`
//       : '-';
//   const diffStyle = (val) => ({ color: val < 0 ? 'red' : 'green', fontWeight: 600 });

//   const targetPrice = purchase * (1 + currentMargin / 100);
//   const targetMargin = targetPrice - purchase;
//   const targetMarginPct = (targetMargin / targetPrice) * 100;

//   return (
//     <div style={{ flex: '1 1 250px', background: '#f0f7ff', padding: '1rem', borderRadius: '0.75rem' }}>
//       <h4>{title}</h4>
  


// <p>Pris: <b>{format(price)}</b></p>
// <p>Inköpspris: <b>{format(purchase)}</b></p>
// <p>Marginal ifrån kalkylator: <b>{format(margin)}</b> ({formatPct(marginPct)})</p>

// <div style={{
//   background: '#f5f7fa',
//   padding: '1rem',
//   borderRadius: '0.75rem',
//   marginTop: '1rem',
//   color: '#333'
// }}>
//   <p><b>Pris med kundens nuvarande marginal ({formatPct(currentMargin)}):</b> {format(targetPrice)}</p>
//   <p>Pris skillnad {format(targetPrice - pcPriceCustomer)}</p>
//   <p><b>Beräknad marginal:</b> {format(targetMargin)} ({formatPct(targetMarginPct)})</p>
// </div>

// <p>Skillnad mot kundpris: <span style={diffStyle(diff)}>{format(diff)}</span></p>
//     </div>
//   );
// }


function AppleCard({
  title,
  price,
  purchase,
  margin,
  marginPct,
  diff,
  currentMargin,
  pcPriceCustomer,
  count,
  kundMarginalKr
}) {
  const format = (val) =>
    val !== undefined && val !== null && !isNaN(val)
      ? val.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })
      : '-';

  const formatPct = (val) =>
    val !== undefined && val !== null && !isNaN(val)
      ? `${Number(val).toFixed(2)}%`
      : '-';

  const diffStyle = (val) => ({
    color: val > 0 ? '#c62828' : '#2e7d32',
    fontWeight: 600,
    fontSize: '1.05rem'
  });

  const targetPrice = purchase * (1 + currentMargin / 100);
  const targetMargin = targetPrice - purchase;
  const targetMarginPct = (targetMargin / targetPrice) * 100;
  const priceDiff = targetPrice - pcPriceCustomer;
  const appleDiff = price - pcPriceCustomer;
  const customerSaving = (pcPriceCustomer * count) - (price * count);
  const ateaAppleProfit = (targetMargin) * count;
  const ateaPCProftit = (kundMarginalKr) * count;

  return (
    <div
      style={{
        flex: '1 1 300px',
        background: '#ffffff',
        padding: '1.5rem',
        borderRadius: '1rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}
    >
      <h3 style={{ margin: 0, color: '#1a237e' }}>{title}</h3>

      <div style={{ lineHeight: 1.6 }}>
        <p>📦 <b>Pris:</b> {format(price)}</p>
        <p>🛒 <b>Inköpspris:</b> {format(purchase)}</p>
        <p>📈 <b>Marginal från kalkylator:</b> {format(margin)} ({formatPct(marginPct)})</p>
        <p>🔍 <b>Skillnad mot PC-pris kunden har idag:</b> <span style={diffStyle(appleDiff)}>{format(appleDiff)}</span></p>
      </div>

      <div
        style={{
          background: '#f5f7fa',
          padding: '1rem',
          borderRadius: '0.75rem',
          lineHeight: 1.6
        }}
      >
        <p>💼 <b>Pris med kundens nuvarande marginal ({formatPct(currentMargin)}):</b> {format(targetPrice)}</p>
        <p>🔍 <b>Skillnad mot PC-pris kunden har idag:</b> <span style={diffStyle(priceDiff)}>{format(priceDiff)}</span></p>
        <p>📊 <b>Beräknad marginal:</b> {format(targetMargin)} ({formatPct(targetMarginPct)})</p>

      </div>

      <div>
        <p>🧾 <b>Skillnad mot kundpris:</b> <span style={diffStyle(diff)}>{format(diff)}</span></p>
        <p>💰 <b>Beräknad besparing för kunden:</b> {format(customerSaving)}</p>
        <p>📈 <b>Atea total vinst Apple:</b> {format(ateaAppleProfit)}</p>
        <p>📉 <b>Atea total vinst PC:</b> {format(ateaPCProftit)}</p>
      </div>
    </div>
  );
}
