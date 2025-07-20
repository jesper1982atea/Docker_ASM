// Gör hooken tillgänglig globalt för browser-usage
window.useGsxApiKey = function useGsxApiKey({ redirectIfMissing = false } = {}) {
    const [gsxApiKey, setGsxApiKey] = React.useState('');
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');

    React.useEffect(() => {
        fetch('/gsx-api-key')
            .then(res => res.json())
            .then(data => {
                const key = data.api_key || data.apiKey || '';
                setGsxApiKey(key);
                setLoading(false);
                if (!key && redirectIfMissing) {
                    window.location.href = '/frontend/gsx-settings.html';
                }
            })
            .catch(() => {
                setError('Kunde inte hämta GSX API-nyckel.');
                setLoading(false);
                if (redirectIfMissing) {
                    window.location.href = '/frontend/gsx-settings.html';
                }
            });
    }, [redirectIfMissing]);

    return { gsxApiKey, loading, error };
};
