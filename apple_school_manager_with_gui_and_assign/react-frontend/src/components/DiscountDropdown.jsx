import React, { useEffect, useState } from 'react';

export default function DiscountDropdown({ selected, onChange }) {
  const [programs, setPrograms] = useState([]);

  useEffect(() => {
    fetch('http://127.0.0.1:8080/api/discounts/')
      .then((res) => res.json())
      .then(setPrograms)
      .catch(console.error);
  }, []);

  return (
    <div style={{ marginBottom: '1rem' }}>
      <label htmlFor="discount-select" style={{ fontWeight: 600, marginRight: 8 }}>
        Rabattprogram:
      </label>
      <select
        id="discount-select"
        value={selected}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Inget rabattprogram</option>
        {programs.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
    </div>
  );
}