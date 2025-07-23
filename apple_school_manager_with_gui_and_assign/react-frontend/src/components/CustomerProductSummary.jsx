// import React, { useMemo, useEffect } from 'react';
// import PriceInfo from './PriceInfo';
// import PriceCalculate from './PriceCalculate';



// function getCustomerInfo(data) {
//   if (!data || data.length === 0) return {};
//   const row = data[0];
//   const fields = [
//     { key: 'Kund', label: 'Kundnamn' },
//     { key: 'Kundnamn', label: 'Kundnamn' },
//     { key: 'Kundnummer', label: 'Kundnummer' },
//     { key: 'Org.nr', label: 'Organisationsnummer' },
//     { key: 'Kontaktperson', label: 'Kontaktperson' },
//     { key: 'E-post', label: 'E-post' },
//     { key: 'Telefon', label: 'Telefon' },
//   ];
//   const info = {};
//   fields.forEach(f => {
//     if (row[f.key]) info[f.label] = row[f.key];
//   });
//   return info;
// }

// function summarizeProducts(data) {
//   if (!data) return [];
//   const map = new Map();
//   data.forEach(row => {
//     const part = row['Artikelnr (tillverkare)'];
//     if (!part) return;
//     const name = row['Artikelbenämning (APA)'] || row['ARTIKELBENÄMNING (APA)'] || row['Produktnamn'] || row['Produkt'] || row['Benämning'] || row['Produktnamn (från fil)'] || '';
//     const totFors = parseFloat((row['Tot Förs (SEK)'] || '').toString().replace(/\s/g, '').replace(',', '.'));
//     const totKost = parseFloat((row['Tot Kost (SEK)'] || '').toString().replace(/\s/g, '').replace(',', '.'));
//     let margin = null;
//     if (!isNaN(totFors) && !isNaN(totKost) && totFors !== 0) {
//       margin = ((totFors - totKost) / totFors) * 100;
//     }
//     if (!map.has(part)) {
//       map.set(part, { part, name, count: 0, totalFors: 0, totalKost: 0, totalMargin: 0, marginCount: 0 });
//     }
//     const entry = map.get(part);
//     entry.count++;
//     if (!isNaN(totFors)) entry.totalFors += totFors;
//     if (!isNaN(totKost)) entry.totalKost += totKost;
//     if (margin !== null && !isNaN(margin)) {
//       entry.totalMargin += margin;
//       entry.marginCount++;
//     }
//   });
//   return Array.from(map.values()).map(e => ({
//     ...e,
//     avgPrice: e.count > 0 ? (e.totalFors / e.count) : 0,
//     avgMargin: e.marginCount > 0 ? (e.totalMargin / e.marginCount) : null,
//     avgStyckpris: e.count > 0 ? (e.totalFors / e.count) : null,
//     avgInkopPris: e.count > 0 ? (e.totalKost / e.count) : null
//   }));
// }

// export function CustomerInfo({ data }) {
//   const customerInfo = useMemo(() => getCustomerInfo(data), [data]);
//   if (!customerInfo || Object.keys(customerInfo).length === 0) {
//     return <p><i>Ingen kundinfo i filen</i></p>;
//   }
//   return (
//     <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.2rem' }}>
//       {Object.entries(customerInfo).map(([k, v]) => (
//         <div className="stat-box" key={k}>
//           <b>{k}:</b> {v}
//         </div>
//       ))}
//     </div>
//   );
// }

// export function ProductSummaryTable({ summary }) {
//   return (
//     <table className="summary-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '2rem', fontSize: '1rem', background: '#fafbfc' }}>
//       <thead>
//         <tr>
//           <th style={{ background: '#f5f5f5', padding: '0.7em 1em', border: '1px solid #e0e0e0' }}>Artikelnr</th>
//           <th style={{ background: '#f5f5f5', padding: '0.7em 1em', border: '1px solid #e0e0e0' }}>Produktnamn</th>
//           <th style={{ background: '#f5f5f5', padding: '0.7em 1em', border: '1px solid #e0e0e0' }}>Antal</th>
//           <th style={{ background: '#f5f5f5', padding: '0.7em 1em', border: '1px solid #e0e0e0' }}>Snitt styckpris</th>
//           <th style={{ background: '#f5f5f5', padding: '0.7em 1em', border: '1px solid #e0e0e0' }}>Snitt inköpspris</th>
//           <th style={{ background: '#f5f5f5', padding: '0.7em 1em', border: '1px solid #e0e0e0' }}>Snittpris (Tot Förs)</th>
//           <th style={{ background: '#f5f5f5', padding: '0.7em 1em', border: '1px solid #e0e0e0' }}>Snittmarginal</th>
//           <th style={{ background: '#f5f5f5', padding: '0.7em 1em', border: '1px solid #e0e0e0' }}>Marginal kr</th>
//         </tr>
//       </thead>
//       <tbody>
//         {summary.map(row => (
//           <tr key={row.part}>
//             <td style={{ padding: '0.5em 1em', border: '1px solid #e0e0e0' }}>{row.part}</td>
//             <td style={{ padding: '0.5em 1em', border: '1px solid #e0e0e0' }}>{row.name}</td>
//             <td style={{ padding: '0.5em 1em', border: '1px solid #e0e0e0', textAlign: 'right' }}>{row.count}</td>
//             <td style={{ padding: '0.5em 1em', border: '1px solid #e0e0e0', textAlign: 'right' }}>{row.avgStyckpris !== null ? row.avgStyckpris.toFixed(2) : '-'}</td>
//             <td style={{ padding: '0.5em 1em', border: '1px solid #e0e0e0', textAlign: 'right' }}>{row.avgInkopPris !== null ? row.avgInkopPris.toFixed(2) : '-'}</td>
//             <td style={{ padding: '0.5em 1em', border: '1px solid #e0e0e0', textAlign: 'right' }}>{row.avgPrice ? row.avgPrice.toFixed(2) : '-'}</td>
//             <td style={{ padding: '0.5em 1em', border: '1px solid #e0e0e0', textAlign: 'right' }}>
//               {row.avgStyckpris && row.avgInkopPris && row.avgStyckpris !== 0
//                 ? (((row.avgStyckpris - row.avgInkopPris) / row.avgStyckpris) * 100).toFixed(2) + ' %'
//                 : '-'}
//             </td>
//             <td style={{ padding: '0.5em 1em', border: '1px solid #e0e0e0', textAlign: 'right' }}>{(row.avgStyckpris - row.avgInkopPris).toFixed(2) + ' Kr'}</td>
//           </tr>
//         ))}
//       </tbody>
//     </table>
//   );
// }

// // ModelComparisonTable: compares each product in summary to Apple price
// function ModelComparisonTable({ summary, calculatedPrices }) {
//   const { kontant, leasing, cirkular, part_number } = calculatedPrices || {};
//   const priceOptions = [
//     { label: 'Apple Kontant', value: kontant },
//     { label: 'Apple Leasing', value: leasing },
//     { label: 'Apple Cirkulär', value: cirkular }
//   ];
//   return (
//     <div style={{ marginTop: '2rem' }}>
//       <h3>Jämförelse mot Apple-priser ({part_number})</h3>
//       <table className="model-comparison-table">
//         <thead>
//           <tr>
//             <th>Modell</th>
//             <th>Kundens Snittpris</th>
//             {priceOptions.map(opt => <th key={opt.label}>{opt.label}</th>)}
//             <th>Skillnad (Kontant)</th>
//             <th>Skillnad (Leasing)</th>
//             <th>Skillnad (Cirkulär)</th>
//             <th>Fördelar/Nackdelar</th>
//           </tr>
//         </thead>
//         <tbody>
//           {summary.map(row => {
//             const diffKontant = row.avgStyckpris !== null && kontant !== undefined ? row.avgStyckpris - kontant : null;
//             const diffLeasing = row.avgStyckpris !== null && leasing !== undefined ? row.avgStyckpris - leasing : null;
//             const diffCirkular = row.avgStyckpris !== null && cirkular !== undefined ? row.avgStyckpris - cirkular : null;
//             let prosCons = '';
//             if (diffKontant !== null) {
//               if (diffKontant > 0) prosCons = 'Dyrare än Apple kontant';
//               else if (diffKontant < 0) prosCons = 'Billigare än Apple kontant';
//               else prosCons = 'Samma pris som Apple kontant';
//             }
//             return (
//               <tr key={row.part}>
//                 <td>{row.name} ({row.part})</td>
//                 <td>{row.avgStyckpris !== null ? row.avgStyckpris.toFixed(2) : '-'}</td>
//                 {priceOptions.map(opt => (
//                   <td key={opt.label}>{opt.value !== undefined && opt.value !== null ? opt.value.toFixed(2) : '-'}</td>
//                 ))}
//                 <td>{diffKontant !== null ? diffKontant.toFixed(2) : '-'}</td>
//                 <td>{diffLeasing !== null ? diffLeasing.toFixed(2) : '-'}</td>
//                 <td>{diffCirkular !== null ? diffCirkular.toFixed(2) : '-'}</td>
//                 <td>{prosCons}</td>
//               </tr>
//             );
//           })}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// export function CustomerProductSummaryView({ data }) {
//   const summary = useMemo(() => summarizeProducts(data), [data]);
//   const [applePriceList, setApplePriceList] = React.useState('');
//   const [appleDiscountProgram, setAppleDiscountProgram] = React.useState('');
//   const [applePartNumber, setApplePartNumber] = React.useState('MC7W4KS/A');
//   const [applePriceData, setApplePriceData] = React.useState(null);
//   const [appleLoading, setAppleLoading] = React.useState(false);
//   const [appleError, setAppleError] = React.useState('');
//   const [calculatedPrices, setCalculatedPrices] = React.useState(null);

//   useEffect(() => {
//     if (!applePartNumber || !applePriceList) return;
//     const fetchPriceInfo = async () => {
//       setAppleLoading(true);
//       setAppleError("");
//       setApplePriceData(null);
//       let url = `http://127.0.0.1:8080/api/discounts/lookup?part_number=${encodeURIComponent(applePartNumber)}&price_list=${encodeURIComponent(applePriceList)}`;
//       if (appleDiscountProgram) url += `&program_name=${encodeURIComponent(appleDiscountProgram)}`;
//       try {
//         const res = await fetch(url);
//         if (!res.ok) throw new Error("Kunde inte hämta prisinfo");
//         const data = await res.json();
//         setApplePriceData(data);
//       } catch (e) {
//         setAppleError(e.message);
//       } finally {
//         setAppleLoading(false);
//       }
//     };
//     fetchPriceInfo();
//   }, [applePartNumber, applePriceList, appleDiscountProgram]);

//   return (
//     <div className="summary-container" style={{ maxWidth: 1100, margin: '2rem auto', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001', padding: '2rem' }}>
//       <div className="apple-comparison" style={{ marginBottom: '2rem', background: '#f5f5f5', borderRadius: 8, padding: '1.2rem 2rem' }}>
//         <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#111' }}>Jämför med Apple</h2>
//         <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
//           <div style={{ minWidth: 220 }}>
//             <PriceInfo
//               priceLists={[]}
//               discountPrograms={[]}
//               selectedPriceList={applePriceList}
//               setSelectedPriceList={setApplePriceList}
//               selectedProgram={appleDiscountProgram}
//               setSelectedProgram={setAppleDiscountProgram}
//               inputPartNumber={applePartNumber}
//               setInputPartNumber={setApplePartNumber}
//               priceData={applePriceData}
//               loading={appleLoading}
//               error={appleError}
//               onFetchPriceInfo={() => {}}
//             />
//           </div>
//         </div>
//         {applePriceData && (
//           <div style={{ marginTop: '2rem' }}>
//             <PriceCalculate priceInfo={applePriceData} loading={false} error={''} onCalculatedPrices={setCalculatedPrices} />
//             {(calculatedPrices && (
//               calculatedPrices.kontant !== undefined && calculatedPrices.kontant !== null ||
//               calculatedPrices.leasing !== undefined && calculatedPrices.leasing !== null ||
//               calculatedPrices.cirkular !== undefined && calculatedPrices.cirkular !== null
//             )) && (
//               <ModelComparisonTable summary={summary} calculatedPrices={calculatedPrices} />
//             )}
//           </div>
//         )}
//       </div>
//       <div className="summary-header" style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem' }}>
//         <div>
//           <h1 style={{ marginBottom: 0, fontSize: '2rem' }}>Kundens Produktsammanställning</h1>
//           <p style={{ marginTop: 0, color: '#555' }}>Översikt av köpta produkter, antal, snittpris, styckpris, inköpspris och marginal.</p>
//         </div>
//       </div>
//       <div className="customer-info">
//         <h3>Kundinformation</h3>
//         <CustomerInfo data={data} />
//       </div>
//       <div>
//         <h3>Produkter</h3>
//         <ProductSummaryTable summary={summary} />
//       </div>
//       <div style={{ marginTop: '2em' }}>
//         <a href="/sales-upload" className="btn btn-secondary">← Tillbaka till uppladdning</a>
//       </div>
//     </div>
//   );
// }

// Updated version of CustomerProductSummaryView.jsx
// import React, { useMemo, useEffect, useState } from 'react';
// import PriceInfo from './PriceInfo';
// import PriceCalculate from './PriceCalculate';

// function getCustomerInfo(data) {
//   if (!data || data.length === 0) return {};
//   const row = data[0];
//   const fields = [
//     { key: 'Kund', label: 'Kundnamn' },
//     { key: 'Kundnamn', label: 'Kundnamn' },
//     { key: 'Kundnummer', label: 'Kundnummer' },
//     { key: 'Org.nr', label: 'Organisationsnummer' },
//     { key: 'Kontaktperson', label: 'Kontaktperson' },
//     { key: 'E-post', label: 'E-post' },
//     { key: 'Telefon', label: 'Telefon' },
//   ];
//   const info = {};
//   fields.forEach(f => {
//     if (row[f.key]) info[f.label] = row[f.key];
//   });
//   return info;
// }

// function summarizeProducts(data) {
//   if (!data) return [];
//   const map = new Map();
//   data.forEach(row => {
//     const part = row['Artikelnr (tillverkare)'];
//     if (!part) return;
//     const name = row['Artikelbenamning (APA)'] || row['ARTIKELBENÄMNING (APA)'] || row['Produktnamn'] || row['Produkt'] || row['Benämning'] || row['Produktnamn (från fil)'] || '';
//     const totFors = parseFloat((row['Tot Förs (SEK)'] || '').toString().replace(/\s/g, '').replace(',', '.'));
//     const totKost = parseFloat((row['Tot Kost (SEK)'] || '').toString().replace(/\s/g, '').replace(',', '.'));
//     let margin = null;
//     if (!isNaN(totFors) && !isNaN(totKost) && totFors !== 0) {
//       margin = ((totFors - totKost) / totFors) * 100;
//     }
//     if (!map.has(part)) {
//       map.set(part, { part, name, count: 0, totalFors: 0, totalKost: 0, totalMargin: 0, marginCount: 0 });
//     }
//     const entry = map.get(part);
//     entry.count++;
//     if (!isNaN(totFors)) entry.totalFors += totFors;
//     if (!isNaN(totKost)) entry.totalKost += totKost;
//     if (margin !== null && !isNaN(margin)) {
//       entry.totalMargin += margin;
//       entry.marginCount++;
//     }
//   });
//   return Array.from(map.values()).map(e => ({
//     ...e,
//     avgPrice: e.count > 0 ? (e.totalFors / e.count) : 0,
//     avgMargin: e.marginCount > 0 ? (e.totalMargin / e.marginCount) : null,
//     avgStyckpris: e.count > 0 ? (e.totalFors / e.count) : null,
//     avgInkopPris: e.count > 0 ? (e.totalKost / e.count) : null
//   }));
// }

// function CustomerInfo({ data }) {
//   const customerInfo = useMemo(() => getCustomerInfo(data), [data]);
//   if (!customerInfo || Object.keys(customerInfo).length === 0) {
//     return <p><i>Ingen kundinfo i filen</i></p>;
//   }
//   return (
//     <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.2rem' }}>
//       {Object.entries(customerInfo).map(([k, v]) => (
//         <div className="stat-box" key={k}>
//           <b>{k}:</b> {v}
//         </div>
//       ))}
//     </div>
//   );
// }

// function ProductSummaryTable({ summary }) {
//   return (
//     <table className="table table-striped" style={{ width: '100%', marginTop: '2rem' }}>
//       <thead>
//         <tr>
//           <th>Artikelnr</th>
//           <th>Produktnamn</th>
//           <th>Antal</th>
//           <th>Styckpris</th>
//           <th>Inköpspris</th>
//           <th>Totalpris</th>
//           <th>Marginal (%)</th>
//           <th>Marginal (kr)</th>
//         </tr>
//       </thead>
//       <tbody>
//         {summary.map(row => (
//           <tr key={row.part}>
//             <td>{row.part}</td>
//             <td>{row.name}</td>
//             <td style={{ textAlign: 'right' }}>{row.count}</td>
//             <td style={{ textAlign: 'right' }}>{row.avgStyckpris?.toFixed(2)}</td>
//             <td style={{ textAlign: 'right' }}>{row.avgInkopPris?.toFixed(2)}</td>
//             <td style={{ textAlign: 'right' }}>{row.avgPrice?.toFixed(2)}</td>
//             <td style={{ textAlign: 'right' }}>{row.avgMargin?.toFixed(2)}</td>
//             <td style={{ textAlign: 'right' }}>{(row.avgStyckpris - row.avgInkopPris).toFixed(2)}</td>
//           </tr>
//         ))}
//       </tbody>
//     </table>
//   );
// }

// function ModelComparisonTable({ summary, calculatedPrices }) {
//   const { kontant, leasing, cirkular, part_number } = calculatedPrices || {};
//   return (
//     <div style={{ marginTop: '2rem' }}>
//       <h3>Jämförelse mot Apple-priser ({part_number})</h3>
//       <table className="table table-bordered">
//         <thead>
//           <tr>
//             <th>Modell</th>
//             <th>Kundens Pris</th>
//             <th>Apple Kontant</th>
//             <th>Apple Leasing</th>
//             <th>Apple Cirkulär</th>
//             <th>Diff (Kontant)</th>
//             <th>Diff (Leasing)</th>
//             <th>Diff (Cirkulär)</th>
//             <th>Kommentar</th>
//           </tr>
//         </thead>
//         <tbody>
//           {summary.map(row => {
//             const diffKontant = row.avgStyckpris - kontant;
//             const diffLeasing = row.avgStyckpris - leasing;
//             const diffCirkular = row.avgStyckpris - cirkular;
//             const getLabel = (val) => val > 0 ? 'Dyrare' : val < 0 ? 'Billigare' : 'Samma';
//             return (
//               <tr key={row.part}>
//                 <td>{row.name} ({row.part})</td>
//                 <td>{row.avgStyckpris?.toFixed(2)}</td>
//                 <td>{kontant?.toFixed(2)}</td>
//                 <td>{leasing?.toFixed(2)}</td>
//                 <td>{cirkular?.toFixed(2)}</td>
//                 <td>{diffKontant?.toFixed(2)}</td>
//                 <td>{diffLeasing?.toFixed(2)}</td>
//                 <td>{diffCirkular?.toFixed(2)}</td>
//                 <td>{getLabel(diffKontant)}</td>
//               </tr>
//             );
//           })}
//         </tbody>
//       </table>
//     </div>
//   );
// }

// export function CustomerProductSummaryView({ data }) {
//   const summary = useMemo(() => summarizeProducts(data), [data]);
//   const [applePriceList, setApplePriceList] = useState('');
//   const [appleDiscountProgram, setAppleDiscountProgram] = useState('');
//   const [applePartNumber, setApplePartNumber] = useState('MC7W4KS/A');
//   const [applePriceData, setApplePriceData] = useState(null);
//   const [appleLoading, setAppleLoading] = useState(false);
//   const [appleError, setAppleError] = useState('');
//   const [calculatedPrices, setCalculatedPrices] = useState(null);

//   useEffect(() => {
//     if (!applePartNumber || !applePriceList) return;
//     const fetchPriceInfo = async () => {
//       setAppleLoading(true);
//       setAppleError("");
//       setApplePriceData(null);
//       let url = `http://127.0.0.1:8080/api/discounts/lookup?part_number=${encodeURIComponent(applePartNumber)}&price_list=${encodeURIComponent(applePriceList)}`;
//       if (appleDiscountProgram) url += `&program_name=${encodeURIComponent(appleDiscountProgram)}`;
//       try {
//         const res = await fetch(url);
//         if (!res.ok) throw new Error("Kunde inte hämta prisinfo");
//         const data = await res.json();
//         setApplePriceData(data);
//       } catch (e) {
//         setAppleError(e.message);
//       } finally {
//         setAppleLoading(false);
//       }
//     };
//     fetchPriceInfo();
//   }, [applePartNumber, applePriceList, appleDiscountProgram]);

//   return (
//     <div style={{ padding: '2rem' }}>
//       <h2>Kunddata</h2>
//       <CustomerInfo data={data} />
//       <ProductSummaryTable summary={summary} />

//       <hr />

//       <h2>Apple Prisdata</h2>
//       <PriceInfo
//         priceLists={[]}
//         discountPrograms={[]}
//         selectedPriceList={applePriceList}
//         setSelectedPriceList={setApplePriceList}
//         selectedProgram={appleDiscountProgram}
//         setSelectedProgram={setAppleDiscountProgram}
//         inputPartNumber={applePartNumber}
//         setInputPartNumber={setApplePartNumber}
//         priceData={applePriceData}
//         loading={appleLoading}
//         error={appleError}
//         onFetchPriceInfo={() => { }}
//       />

//       {applePriceData && (
//         <PriceCalculate
//           priceInfo={applePriceData}
//           loading={false}
//           error={''}
//           onCalculatedPrices={setCalculatedPrices}
//         />
//       )}

//       {calculatedPrices && <ModelComparisonTable summary={summary} calculatedPrices={calculatedPrices} />}
//     </div>
//   );
// }

// Import React and additional libraries
import React, { useMemo, useEffect, useState } from 'react';
import PriceInfo from './PriceInfo';
import PriceCalculate from './PriceCalculate';
import PriceComparisonTable from './PriceComparisonTable';
import ErrorBoundary from './ErrorBoundary';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Utility functions remain the same...
function getCustomerInfo(data) {
  if (!data || data.length === 0) return {};
  const row = data[0];
  const fields = [
    { key: 'Kund', label: 'Kundnamn' },
    { key: 'Kundnamn', label: 'Kundnamn' },
    { key: 'Kundnummer', label: 'Kundnummer' },
    { key: 'Org.nr', label: 'Organisationsnummer' },
    { key: 'Kontaktperson', label: 'Kontaktperson' },
    { key: 'E-post', label: 'E-post' },
    { key: 'Telefon', label: 'Telefon' },
  ];
  const info = {};
  fields.forEach(f => {
    if (row[f.key]) info[f.label] = row[f.key];
  });
  return info;
}

function summarizeProducts(data) {
  if (!data) return [];
  console.log("Summarizing products...", data);
  const map = new Map();
  data.forEach(row => {
    const part = row['Artikelnr (tillverkare)'];
    if (!part) return;
    const name = row['Artikelbenämning (APA)'] || row['ARTIKELBENÄMNING (APA)'] || row['Produktnamn'] || row['Produkt'] || row['Benämning'] || row['Produktnamn (från fil)'] || '';
    const totFors = parseFloat((row['Tot Förs (SEK)'] || '').toString().replace(/\s/g, '').replace(',', '.'));
    const totKost = parseFloat((row['Tot Kost (SEK)'] || '').toString().replace(/\s/g, '').replace(',', '.'));
    let margin = null;
    if (!isNaN(totFors) && !isNaN(totKost) && totFors !== 0) {
      margin = ((totFors - totKost) / totFors) * 100;
    }
    if (!map.has(part)) {
      map.set(part, { part, name, count: 0, totalFors: 0, totalKost: 0, totalMargin: 0, marginCount: 0 });
    }
    const entry = map.get(part);
    entry.count++;
    if (!isNaN(totFors)) entry.totalFors += totFors;
    if (!isNaN(totKost)) entry.totalKost += totKost;
    if (margin !== null && !isNaN(margin)) {
      entry.totalMargin += margin;
      entry.marginCount++;
    }
  });
  return Array.from(map.values()).map(e => ({
    ...e,
    avgPrice: e.count > 0 ? (e.totalFors / e.count) : 0,
    avgMargin: e.marginCount > 0 ? (e.totalMargin / e.marginCount) : null,
    avgStyckpris: e.count > 0 ? (e.totalFors / e.count) : null,
    avgInkopPris: e.count > 0 ? (e.totalKost / e.count) : null
  }));
}

function CustomerInfo({ data }) {
  const customerInfo = useMemo(() => getCustomerInfo(data), [data]);
  if (!customerInfo || Object.keys(customerInfo).length === 0) {
    return <p><i>Ingen kundinfo i filen</i></p>;
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.2rem' }}>
      {Object.entries(customerInfo).map(([k, v]) => (
        <div className="stat-box" key={k}>
          <b>{k}:</b> {v}
        </div>
      ))}
    </div>
  );
}

function ProductSummaryTable({ summary }) {
  return (
    <table className="table table-striped" style={{ width: '100%', marginTop: '2rem' }}>
      <thead>
        <tr>
          <th>Artikelnr</th>
          <th>Produktnamn</th>
          <th>Antal</th>
          <th>Styckpris</th>
          <th>Inköpspris</th>
          <th>Totalpris</th>
          <th>Marginal (%)</th>
          <th>Marginal (kr)</th>
        </tr>
      </thead>
      <tbody>
        {summary.map(row => (
          <tr key={row.part}>
            <td>{row.part}</td>
            <td>{row.name}</td>
            <td style={{ textAlign: 'right' }}>{row.count}</td>
            <td style={{ textAlign: 'right' }}>{row.avgStyckpris?.toFixed(2)}</td>
            <td style={{ textAlign: 'right' }}>{row.avgInkopPris?.toFixed(2)}</td>
            <td style={{ textAlign: 'right' }}>{row.avgPrice?.toFixed(2)}</td>
            <td style={{ textAlign: 'right' }}>{row.avgMargin?.toFixed(2)}</td>
            <td style={{ textAlign: 'right' }}>{(row.avgStyckpris - row.avgInkopPris).toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}




// ModelComparisonTable updated with export and highlight features
function ModelComparisonTable({ summary, calculatedPrices }) {
  const { kontant, leasing, cirkular, part_number } = calculatedPrices || {};
  const priceOptions = [
    { label: 'Apple Kontant', value: kontant },
    { label: 'Apple Leasing', value: leasing },
    { label: 'Apple Cirkulär', value: cirkular }
  ];

  const rows = summary.map(row => {
    const diffKontant = row.avgStyckpris !== null && kontant !== undefined ? row.avgStyckpris - kontant : null;
    const diffLeasing = row.avgStyckpris !== null && leasing !== undefined ? row.avgStyckpris - leasing : null;
    const diffCirkular = row.avgStyckpris !== null && cirkular !== undefined ? row.avgStyckpris - cirkular : null;
    return {
      Modell: `${row.name} (${row.part})`,
      Snittpris: row.avgStyckpris !== null ? row.avgStyckpris.toFixed(2) : '-',
      Kontant: kontant?.toFixed(2) || '-',
      Leasing: leasing?.toFixed(2) || '-',
      Cirkulär: cirkular?.toFixed(2) || '-',
      'Diff Kontant': diffKontant !== null ? diffKontant.toFixed(2) : '-',
      'Diff Leasing': diffLeasing !== null ? diffLeasing.toFixed(2) : '-',
      'Diff Cirkulär': diffCirkular !== null ? diffCirkular.toFixed(2) : '-',
    };
  });

  const exportToPDF = () => {
    const doc = new jsPDF();
    autoTable(doc, {
      head: [Object.keys(rows[0])],
      body: rows.map(r => Object.values(r))
    });
    doc.save('jämförelse.pdf');
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Jämförelse');
    XLSX.writeFile(wb, 'jämförelse.xlsx');
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3>Jämförelse mot Apple-priser ({part_number})</h3>
      <div style={{ marginBottom: '1rem' }}>
        <button className="btn btn-outline-secondary" onClick={exportToPDF}>Exportera till PDF</button>{' '}
        <button className="btn btn-outline-secondary" onClick={exportToExcel}>Exportera till Excel</button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="table table-bordered">
          <thead className="table-light">
            <tr>
              <th>Modell</th>
              <th>Kundens Snittpris</th>
              {priceOptions.map(opt => <th key={opt.label}>{opt.label}</th>)}
              <th>Skillnad (Kontant)</th>
              <th>Skillnad (Leasing)</th>
              <th>Skillnad (Cirkulär)</th>
            </tr>
          </thead>
          <tbody>
            {summary.map(row => {
              const diffKontant = row.avgStyckpris !== null && kontant !== undefined ? row.avgStyckpris - kontant : null;
              const diffLeasing = row.avgStyckpris !== null && leasing !== undefined ? row.avgStyckpris - leasing : null;
              const diffCirkular = row.avgStyckpris !== null && cirkular !== undefined ? row.avgStyckpris - cirkular : null;
              return (
                <tr key={row.part} className={diffKontant > 0 ? 'table-warning' : diffKontant < 0 ? 'table-success' : ''}>
                  <td>{row.name} ({row.part})</td>
                  <td>{row.avgStyckpris !== null ? row.avgStyckpris.toFixed(2) : '-'}</td>
                  <td>{kontant !== undefined ? kontant.toFixed(2) : '-'}</td>
                  <td>{leasing !== undefined ? leasing.toFixed(2) : '-'}</td>
                  <td>{cirkular !== undefined ? cirkular.toFixed(2) : '-'}</td>
                  <td>{diffKontant !== null ? diffKontant.toFixed(2) : '-'}</td>
                  <td>{diffLeasing !== null ? diffLeasing.toFixed(2) : '-'}</td>
                  <td>{diffCirkular !== null ? diffCirkular.toFixed(2) : '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// In CustomerProductSummaryView, insert this spinner logic + ensure comparison renders
export function CustomerProductSummaryView({ data }) {
  const summary = useMemo(() => summarizeProducts(data), [data]);
  const [applePriceList, setApplePriceList] = useState('');
  const [appleDiscountProgram, setAppleDiscountProgram] = useState('');
  const [applePartNumber, setApplePartNumber] = useState('MC7W4KS/A');
  const [applePriceData, setApplePriceData] = useState(null);
  const [applePriceProduct, setApplePriceProduct] = useState(null);
  const [appleLoading, setAppleLoading] = useState(false);
  const [appleError, setAppleError] = useState('');
  const [calculatedPrices, setCalculatedPrices] = useState(null);

  useEffect(() => {
    if (!applePartNumber || !applePriceList) return;
    const fetchPriceInfo = async () => {
      setAppleLoading(true);
      setAppleError("");
      setApplePriceData(null);
      let url = `http://127.0.0.1:8080/api/discounts/lookup?part_number=${encodeURIComponent(applePartNumber)}&price_list=${encodeURIComponent(applePriceList)}`;
      if (appleDiscountProgram) url += `&program_name=${encodeURIComponent(appleDiscountProgram)}`;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Kunde inte hämta prisinfo");
        const data = await res.json();
        setApplePriceData(data);
      } catch (e) {
        setAppleError(e.message);
      } finally {
        setAppleLoading(false);
      }
    };
    fetchPriceInfo();
  }, [applePartNumber, applePriceList, appleDiscountProgram]);

  return (
    <div className="summary-container" style={{ maxWidth: 1100, margin: '2rem auto', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001', padding: '2rem' }}>
      <div className="apple-comparison" style={{ marginBottom: '2rem', background: '#f5f5f5', borderRadius: 8, padding: '1.2rem 2rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#111' }}>Jämför med Apple</h2>
        <PriceInfo
          priceLists={[]}
          discountPrograms={[]}
          selectedPriceList={applePriceList}
          setSelectedPriceList={setApplePriceList}
          selectedProgram={appleDiscountProgram}
          setSelectedProgram={setAppleDiscountProgram}
          inputPartNumber={applePartNumber}
          setInputPartNumber={setApplePartNumber}
          priceData={applePriceData}
          loading={appleLoading}
          error={appleError}
          onFetchPriceInfo={() => {applePriceProduct && setApplePriceData(applePriceProduct)}}
        />
       
        {applePriceData && (
          <div style={{ marginTop: '2rem' }}>
            {/* {console.log('Apple Price Data:', applePriceProduct)} */}
            <PriceCalculate priceInfo={applePriceData} loading={false} error={''} onCalculatedPrices={setCalculatedPrices} />
            {calculatedPrices && summary.length > 0 && (
              // Only render if at least one Apple price is a valid number
              
                <ErrorBoundary>
                  <PriceComparisonTable
                    summary={summary}
                    calculated={calculatedPrices}
                    appleproduct={applePriceData}
                  />
                </ErrorBoundary>
              
            )}
          </div>
        )}
        {appleLoading && <div className="spinner-border text-primary mt-3" role="status"><span className="visually-hidden">Laddar...</span></div>}
      </div>

      <div className="summary-header" style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ marginBottom: 0, fontSize: '2rem' }}>Kundens Produktsammanställning</h1>
          <p style={{ marginTop: 0, color: '#555' }}>Översikt av köpta produkter, antal, snittpris, styckpris, inköpspris och marginal.</p>
        </div>
      </div>

      <div className="customer-info">
        <h3>Kundinformation</h3>
        <CustomerInfo data={data} />
      </div>

      <div>
        <h3>Produkter</h3>
        <ProductSummaryTable summary={summary} />
      </div>

      <div style={{ marginTop: '2em' }}>
        <a href="/sales-upload" className="btn btn-secondary">← Tillbaka till uppladdning</a>
      </div>
    </div>
  );
}