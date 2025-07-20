import { useState } from 'react';
import { useGsxApiKey } from './gsx-api-key.js';

export default function GsxSettingsPage() {
    const { gsxApiKey, loading, error } = useGsxApiKey();
    const [input, setInput] = useState(gsxApiKey);
    const [saved, setSaved] = useState(false);
    const [saveError, setSaveError] = useState('');

    const handleSave = async (e) => {
        e.preventDefault();
        setSaved(false);
        setSaveError('');
        try {
            const res = await fetch('/gsx-api-key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ api_key: input })
            });
            const data = await res.json();
            if (data.success) setSaved(true);
            else setSaveError(data.error || 'Fel vid sparande');
        } catch {
            setSaveError('Nätverksfel vid sparande');
        }
    };

    if (loading) return <div>Hämtar GSX API-nyckel...</div>;
    return (
        <form onSubmit={handleSave} style={{margin: '2rem auto', background: 'var(--atea-light-grey)', padding: '2rem', borderRadius: '10px', maxWidth: 500}}>
            <h2>GSX API-nyckel</h2>
            <input type="text" value={input} onChange={e=>setInput(e.target.value)} placeholder="Klistra in GSX API-nyckel" style={{width: '100%', padding: '0.5rem', fontSize: '1rem', borderRadius: '6px', border: '1px solid #ccc'}} />
            <button type="submit" style={{marginTop: '1rem', background: 'var(--atea-green)', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.5rem 1.5rem', fontWeight: 600, fontSize: '1rem', cursor: 'pointer'}}>Spara</button>
            {saved && <span style={{color: 'var(--atea-green)', marginLeft: '1rem'}}>Sparat!</span>}
            {(error || saveError) && <span style={{color: 'red', marginLeft: '1rem'}}>{error || saveError}</span>}
        </form>
    );
}
