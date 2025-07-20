import React, { useEffect, useState } from 'react';
import { CustomerProductSummaryView } from '../components/CustomerProductSummary';

export default function CustomerProductSummaryPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Hämta data från sessionStorage (eller API om du vill)
    try {
      const raw = sessionStorage.getItem('customerProductSummaryData');
      if (raw) setData(JSON.parse(raw));
    } catch (e) {
      setData(null);
    }
  }, []);

  if (!data) {
    return (
      <div style={{ color: 'red', padding: '2em' }}>
        <div>Ingen data hittades. Gå tillbaka och ladda upp en fil.</div>
        <div>
          Om du kom hit via bokmärke, gå till <a href="/sales-upload">uppladdningssidan</a> först.
        </div>
      </div>
    );
  }

  return <CustomerProductSummaryView data={data} />;
}
