import React from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import ErrorBoundary from './ErrorBoundary';

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

  // const exportAllToPDF = () => {
  //   const doc = new jsPDF();
  //   summary.forEach((product, i) => {
  //     const kundMarginalKr = product.avgStyckpris - product.avgInkopPris;
  //     const kundMarginalPct = (kundMarginalKr / product.avgStyckpris) * 100;

  //     autoTable(doc, {
  //       startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 20,
  //       head: [[
  //         'Produkt', 'Pris', 'Inköpspris', 'Marginal (kr)', 'Marginal (%)'
  //       ]],
  //       body: [[
  //         `${product.name} (${product.part})`,
  //         format(product.avgStyckpris),
  //         format(product.avgInkopPris),
  //         format(kundMarginalKr),
  //         formatPct(kundMarginalPct)
  //       ]]
  //     });

  //     const apple = calculated;

  //     if (apple.kontant) {
  //       autoTable(doc, {
  //         startY: doc.lastAutoTable.finalY + 5,
  //         head: [['Apple Kontant', 'Pris', 'Inköpspris', 'Marginal (kr)', 'Marginal (%)']],
  //         body: [[
  //           '',
  //           format(apple.kontant.forsaljningspris),
  //           format(apple.kontant.inköpspris),
  //           format(apple.kontant.marginal),
  //           formatPct(apple.kontant.marginal_procent)
  //         ]]
  //       });
  //     }

  //     if (apple.leasing?.['36']) {
  //       const a = apple.leasing['36'];
  //       autoTable(doc, {
  //         startY: doc.lastAutoTable.finalY + 5,
  //         head: [['Apple Leasing (36 mån)', 'Totalt Pris', 'Inköpspris', 'Marginal (kr)', 'Marginal (%)']],
  //         body: [[
  //           '',
  //           format(a.manadskostnad * 36),
  //           format(a.inköpspris),
  //           format(a.marginal),
  //           formatPct(a.marginal_procent)
  //         ]]
  //       });
  //     }

  //     if (apple.circular) {
  //       const a = apple.circular;
  //       autoTable(doc, {
  //         startY: doc.lastAutoTable.finalY + 5,
  //         head: [['Apple Cirkulär', 'Totalt Pris', 'Inköpspris', 'Marginal (kr)', 'Marginal (%)']],
  //         body: [[
  //           '',
  //           format(a.faktura_1 + a.faktura_2),
  //           format(a.inköpspris),
  //           format(a.marginal),
  //           formatPct(a.marginal_procent)
  //         ]]
  //       });
  //     }

  //     doc.setFontSize(10);
  //     doc.setTextColor(80);
  //     doc.text('Apple-alternativen är beräknade utifrån leasing/kontant/cirkulärmodell och ger ofta en högre marginal och lägre kostnad för kunden.', 14, doc.lastAutoTable.finalY + 10, { maxWidth: 180 });

  //     if (i < summary.length - 1) {
  //       doc.addPage();
  //     }
  //   });

  //   doc.save('prisjämförelse_alla_produkter.pdf');
  // };

  const exportAllToPDF = (summary, calculated) => {
  const doc = new jsPDF();

  const format = (val) =>
    val !== undefined && val !== null && !isNaN(val)
      ? val.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })
      : '-';

  const formatPct = (val) =>
    val !== undefined && val !== null && !isNaN(val)
      ? `${Number(val).toFixed(2)}%`
      : '-';

  summary.forEach((product, i) => {
    const kundMarginalKr = product.avgStyckpris - product.avgInkopPris;
    const kundMarginalPct = (kundMarginalKr / product.avgStyckpris) * 100;

    // Kundens produkt
    autoTable(doc, {
      startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 20,
      head: [[
        'Produkt', 'Antal', 'Pris/st', 'Inköpspris/st', 'Marginal/st (kr)', 'Marginal (%)'
      ]],
      body: [[
        `${product.name} (${product.part})`,
        product.count,
        format(product.avgStyckpris),
        format(product.avgInkopPris),
        format(kundMarginalKr),
        formatPct(kundMarginalPct)
      ]]
    });

    // Apple-alternativ
    if (calculated?.kontant) {
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [['Apple Kontant', 'Pris', 'Inköpspris', 'Marginal (kr)', 'Marginal (%)']],
        body: [[
          appleproduct?.product?.Description || 'Apple Kontant',
          format(calculated.kontant.forsaljningspris),
          format(calculated.kontant.inköpspris),
          format(calculated.kontant.marginal),
          formatPct(calculated.kontant.marginal_procent)
        ]]
      });
    }

    if (calculated?.leasing?.['36']) {
      const leasing = calculated.leasing['36'];
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [['Apple Leasing (36 mån)', 'Totalt Pris', 'Inköpspris', 'Marginal (kr)', 'Marginal (%)']],
        body: [[
          appleproduct?.product?.Description || 'Apple Kontant',
          format(leasing.manadskostnad * 36),
          format(leasing.inköpspris),
          format(leasing.marginal),
          formatPct(leasing.marginal_procent)
        ]]
      });
    }

    if (calculated?.circular) {
      const circ = calculated.circular;
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 10,
        head: [['Apple Cirkulär', 'Totalt Pris', 'Inköpspris', 'Marginal (kr)', 'Marginal (%)']],
        body: [[
          appleproduct?.product?.Description || 'Apple Kontant',
          format(circ.faktura_1 + circ.faktura_2),
          format(circ.inköpspris),
          format(circ.marginal),
          formatPct(circ.marginal_procent)
        ]]
      });
    }

    // Infotext
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text(
      'Apple-alternativen visar ofta lägre total kostnad för kund och högre marginal för er. Cirkulär modell kräver återlämning efter 36 månader.',
      14,
      doc.lastAutoTable.finalY + 10,
      { maxWidth: 180 }
    );

    if (i < summary.length - 1) {
      doc.addPage();
    }
  });

  doc.save('prisjämförelse_alla_produkter.pdf');
};

  return (

    
    <div style={{ marginTop: '2rem' }}>
      <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
        <button onClick={() => exportAllToPDF(summary, calculated)}>
    Ladda ner PDF för alla produkter
  </button>
      </div>

      {summary.map((product) => {
        const kundMarginalKr = product.avgStyckpris - product.avgInkopPris;
        const kundMarginalPct = (kundMarginalKr / product.avgStyckpris) * 100;
        const calcDiff = (val) => val - product.avgStyckpris;
        const apple = calculated;

        return (
          <div key={product.part} style={{ border: '1px solid #ccc', borderRadius: '1rem', marginBottom: '2rem', padding: '1.5rem' }}>
            {/* <h3>{product.name} ({product.part})</h3>
            <p style={{ color: '#555' }}>
              Försäljningspris: <b>{format(product.avgStyckpris)}</b>, Inköpspris: <b>{format(product.avgInkopPris)}</b><br />
              Marginal: <b>{format(kundMarginalKr)}</b> ({formatPct(kundMarginalPct)})
              
            </p>
            <h3>{appleproduct?.product?.Description} ({product.part})</h3>
            <p style={{ color: '#555' }}>
              Inköpspris: <b>{format(appleproduct?.new_price)}</b><br />
         
            </p> */}

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '2rem',
                padding: '1rem 0',
                alignItems: 'flex-start',
                flexWrap: 'wrap'
              }}>
                {console.log('Product:', product)}
                {/* Kundens data */}
                <div style={{ flex: '1 1 45%', background: '#f8f9fb', padding: '1rem', borderRadius: '0.75rem' }}>
                  <p style={{ color: '#555', marginBottom: '0.5rem' }}>
                    <b>PC: {product.name}</b><br />
                    Artikelnummer: <b>{product.part}</b><br />
                    
                    Försäljningspris: <b>{format(product.avgStyckpris)}</b><br />
                    Inköpspris: <b>{format(product.avgInkopPris)}</b><br />
                    Marginal: <b>{format(kundMarginalKr)}</b> ({formatPct(kundMarginalPct)})
                  </p>
                </div>

                {/* Apple-produktdata */}
                <div style={{ flex: '1 1 45%', background: '#f8f9fb', padding: '1rem', borderRadius: '0.75rem' }}>
                  <h3 style={{ marginTop: 0 }}>Mac: {appleproduct?.product?.Description}</h3>
                  <p style={{ color: '#555' }}>
                    Artikelnummer: <b>{appleproduct?.part_number}</b><br />
                    Inköpspris: <b>{format(appleproduct?.new_price)}</b><br></br>
                    Listpris: <b>{format(appleproduct?.list_price)}</b>
                  </p>
                </div>
              </div>

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
