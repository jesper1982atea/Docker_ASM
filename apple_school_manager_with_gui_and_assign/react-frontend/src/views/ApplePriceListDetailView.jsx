import React, { useState, useEffect, useMemo } from "react";
import ApplePriceListItem from "../components/ApplePriceListItem";
import PriceInfo from '../components/PriceInfo';
import PriceCalculate from '../components/PriceCalculate';


const fetchLatestPriceList = async () => {
  const response = await fetch("http://127.0.0.1:8080/api/price/list");
  if (!response.ok) throw new Error("Kunde inte hämta prislistan");
  return await response.json();
};

const fetchAllDiscountPrograms = async () => {
  const response = await fetch("http://127.0.0.1:8080/api/discounts");
  if (!response.ok) throw new Error("Kunde inte hämta rabattprogram");
  return await response.json();
};

const fetchFunctionalDiscounts = async () => {
  const response = await fetch("http://127.0.0.1:8080/api/discounts/functional-discount/MC654KS%2FA");
  if (!response.ok) throw new Error("Kunde inte hämta funktionsrabatter");
  return await response.json();
};

const calculatePrice = (product, allDiscountPrograms, selectedDiscount, functionalDiscounts) => {
  // Dummy implementation, replace with real logic
  const listPrice = product["List Price"] || product["ALP Ex VAT"] || 0;
  let appliedDiscountRate = 0;
  let discountSource = "none";
  if (selectedDiscount !== "none" && allDiscountPrograms[selectedDiscount]) {
    appliedDiscountRate = allDiscountPrograms[selectedDiscount].rate || 0;
    discountSource = selectedDiscount;
  }
  // Add functional discount logic if needed
  const finalPrice = listPrice * (1 - appliedDiscountRate);
  return { finalPrice, appliedDiscountRate, discountSource, listPrice };
};

const ApplePriceListDetailView = () => {
  // Try to get selected product from sessionStorage
  let selectedProduct = null;
  try {
    const stored = sessionStorage.getItem("selectedProduct");
    if (stored) selectedProduct = JSON.parse(stored);
  } catch (e) {
    selectedProduct = null;
  }

  if (!selectedProduct) {
    return (
      <div className="container">
        <header className="atea-header">
          <div className="header-content">
            {/* <img src="/images/logo.jpg" alt="Atea Logo" className="header-logo" style={{ height: '50px' }} /> */}
            <div>
              <h1>Produktdetaljer</h1>
              <p>Ingen produkt vald. Gå tillbaka och välj en produkt från prislistan.</p>
            </div>
          </div>
          <div className="header-links">
            <a href="/apple-price-list" className="header-link">⬅️ Tillbaka till Prislista</a>
          </div>
        </header>
      </div>
    );
  }

  // Block definitions
  // State for price list, program, part number, and price data
  const [selectedPriceList, setSelectedPriceList] = useState("ALP Ex VAT");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [inputPartNumber, setInputPartNumber] = useState(selectedProduct["Part Number"] || "");
  const [priceData, setPriceData] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState("");

  // Fetch price info when any input changes
  useEffect(() => {
    if (!inputPartNumber || !selectedPriceList) return;
    const fetchPriceInfo = async () => {
      setPriceLoading(true);
      setPriceError("");
      setPriceData(null);
      let url = `http://127.0.0.1:8080/api/discounts/lookup?part_number=${encodeURIComponent(inputPartNumber)}&price_list=${encodeURIComponent(selectedPriceList)}`;
      if (selectedProgram) url += `&program_name=${encodeURIComponent(selectedProgram)}`;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Kunde inte hämta prisinfo");
        const data = await res.json();
        setPriceData(data);
      } catch (e) {
        setPriceError(e.message);
      } finally {
        setPriceLoading(false);
      }
    };
    fetchPriceInfo();
  }, [inputPartNumber, selectedPriceList, selectedProgram]);
  const blocks = [
    {
      key: "general",
      title: "Generell Information",
      fields: [
        "Part Number", "Description", "Category", "RAM", "Storage", "UPC/EAN", "Copyright Levy", "Material Price Group", "Basic Material", "COO", "Marketing Flag", "NPI", "Reprice Indicator"
      ]
    },
    {
      key: "dimensions",
      title: "Dimensioner & Vikt",
      fields: [
        "Weight(kg)", "Length(cm)", "Width(cm)", "Height(cm)", "Weight(lb) - EA", "Length(in) - EA", "Width(in) - EA", "Height(in) - EA"
      ]
    },
    {
      key: "packaging",
      title: "Förpackning & Pall",
      fields: [
        "Multi pack Qty", "Master Pack Qty", "Multi pack Weight(kg)", "Multi pack Length(cm)", "Multi pack Width(cm)", "Multi pack Height(cm)", "Pallet Qty", "Pallet of Master Pack Qty", "Pallet of Single Shippers", "Pallet of Multi Pack Length", "Pallet of Multi Pack Width", "Pallet of Multi Pack Height", "Pallet of Single Shippers Qty"
      ]
    },
    {
      key: "pricing",
      title: "Prisuppgifter",
      fields: ["ALP Ex VAT", "ALP Inc VAT"]
    }
  ];

  // State for toggling blocks
  const [visibleBlocks, setVisibleBlocks] = React.useState(() => {
    const initial = {};
    blocks.forEach(b => { initial[b.key] = true; });
    return initial;
  });

  const toggleBlock = (key) => {
    setVisibleBlocks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="container">
      <header className="atea-header">
        <div className="header-content">
          {/* <img src="/images/logo.jpg" alt="Atea Logo" className="header-logo" style={{ height: '50px' }} /> */}
          <div>
            <h1>Produktdetaljer</h1>
            <p>Information om vald produkt.</p>
          </div>
        </div>
        <div className="header-links">
          <a href="/apple-price-list" className="header-link">⬅️ Tillbaka till Prislista</a>
        </div>
      </header>
      <div className="card" style={{ padding: '2rem', background: 'var(--atea-white)', marginTop: '2rem', maxWidth: 900, marginLeft: 'auto', marginRight: 'auto', boxShadow: '0 2px 12px #0002', borderRadius: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 350px' }}>
            <h2 style={{ marginBottom: '0.5rem', fontWeight: 700 }}>{selectedProduct["Description"] || selectedProduct["Part Number"]}</h2>
            <div style={{ color: '#888', fontSize: '1.1em', marginBottom: '0.5rem' }}>{selectedProduct["Category"]}</div>
            <div style={{ fontSize: '1.1em', marginBottom: '0.5rem' }}>
              <strong>Artikelnummer:</strong> {selectedProduct["Part Number"]}
            </div>
            <div style={{ fontSize: '1.1em', marginBottom: '0.5rem' }}>
              <strong>RAM:</strong> {selectedProduct["RAM"]} &nbsp; <strong>Lagring:</strong> {selectedProduct["Storage"]}
            </div>
            <div style={{ fontSize: '1.1em', marginBottom: '0.5rem' }}>
              <strong>Pris exkl moms:</strong> {selectedProduct["ALP Ex VAT"]} kr &nbsp; <strong>Pris inkl moms:</strong> {selectedProduct["ALP Inc VAT"]} kr
            </div>
          </div>
          <div style={{ flex: '0 0 120px', textAlign: 'center' }}>
            <div style={{ background: '#f4f4f4', borderRadius: 8, padding: '1rem', fontSize: '1.2em', fontWeight: 600 }}>
              <div>Vikt: {selectedProduct["Weight(kg)"]} kg</div>
              <div>Mått: {selectedProduct["Length(cm)"]} x {selectedProduct["Width(cm)"]} x {selectedProduct["Height(cm)"]} cm</div>
            </div>
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
        {/* Debug panel for troubleshooting, only if debug=true in URL */}
        {(() => {
          const params = new URLSearchParams(window.location.search);
          if (params.get('debug') === 'true') {
            return (
              <div style={{ background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 8, padding: '1rem', margin: '2rem 0', fontSize: '0.95em' }}>
                <strong>Debug Info:</strong>
                <div>API loading: {String(priceLoading)}</div>
                <div>API error: {priceError || 'Ingen'}</div>
                <div>priceData:
                  <pre style={{ background: '#f6f8fa', padding: '0.5rem', borderRadius: 4, overflowX: 'auto' }}>{JSON.stringify(priceData, null, 2)}</pre>
                </div>
                {(!priceData || priceData.new_price == null || priceData.list_price == null) && (
                  <div style={{ color: '#d4380d', marginTop: '0.5rem' }}>
                    <b>VARNING:</b> priceData saknar nödvändiga fält (new_price, list_price)!
                  </div>
                )}
              </div>
            );
          }
          return null;
        })()}
        {blocks.map(block => {
          // Only show block if it has at least one value
          const hasValue = block.fields.some(f => selectedProduct[f] !== undefined && selectedProduct[f] !== "");
          if (!hasValue) return null;
          return (
            <div key={block.key} style={{ marginBottom: '2rem', border: '1px solid #eee', borderRadius: 8, boxShadow: '0 2px 8px #0001', background: '#fafcff' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid #eee', cursor: 'pointer' }} onClick={() => toggleBlock(block.key)}>
                <h3 style={{ margin: 0 }}>{block.title}</h3>
                <span style={{ fontSize: '1.2em', color: '#005eb8' }}>{visibleBlocks[block.key] ? '−' : '+'}</span>
              </div>
              {visibleBlocks[block.key] && (
                <table className="table" style={{ margin: 0, background: 'transparent' }}>
                  <tbody>
                    {block.fields.map(f => (
                      selectedProduct[f] !== undefined && selectedProduct[f] !== "" ? (
                        <tr key={f}>
                          <td style={{ fontWeight: 600, width: '40%' }}>{f}</td>
                          <td>{selectedProduct[f]}</td>
                        </tr>
                      ) : null
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ApplePriceListDetailView;
