import React, { useEffect, useState } from 'react';

export default function DiscountLookupResult({ programName, partNumber, priceList }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!programName || !partNumber || !priceList) return;

        const fetchData = async () => {
            try {
                const url = `/api/discounts/lookup?program_name=${encodeURIComponent(programName)}&part_number=${encodeURIComponent(partNumber)}&price_list=${encodeURIComponent(priceList)}`;
                const res = await fetch(url);
                if (!res.ok) throw new Error('Kunde inte hämta data');
                const json = await res.json();
                setData(json);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [programName, partNumber, priceList]);

    if (loading) return <div>Hämtar rabattdata...</div>;
    if (error) return <div style={{ color: 'red' }}>Fel: {error}</div>;
    if (!data) return null;

    const {
        product,
        discounts,
        total_discount,
        list_price,
        new_price,
        discount_amount
    } = data;

    return (
        <div className="card section" style={{ marginTop: '2rem' }}>
            <h3>{product.Description}</h3>
            <div className="price-result-grid">
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--atea-green)' }}>
                    Ditt pris: {new_price.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })}
                </div>
                <div style={{ marginTop: '0.5rem', color: '#666' }}>
                    Listpris: {list_price.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })}
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                    Rabatter:
                    <ul style={{ margin: 0, paddingLeft: '1.2em' }}>
                        {discounts.map((d, i) => (
                            <li key={i}>{d.source}: {(d.value * 100).toFixed(2)}%</li>
                        ))}
                    </ul>
                </div>
                <div>Total rabatt: <b>{(total_discount * 100).toFixed(2)}%</b></div>
                <div>Rabattbelopp: <b>{discount_amount.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })}</b></div>
                <div>Rabattkälla: <b>{data.program_name || '-'}</b></div>
            </div>
        </div>
    );
}