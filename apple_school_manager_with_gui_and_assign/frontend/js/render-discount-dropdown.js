import React, { useState, useEffect } from 'react';

export default function DiscountDropdown({ selected, onChange }) {
  const [programs, setPrograms] = useState([]);

  useEffect(() => {
    fetch('/api/discounts/')
      .then((res) => res.json())
      .then((data) => setPrograms(data))
      .catch((err) => console.error('Error loading discount programs:', err));
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
        {programs.map((program) => (
          <option key={program} value={program}>
            {program}
          </option>
        ))}
      </select>
    </div>
  );
}