const { React } = window;

function ProductDetailView({ productData }) {
    if (!productData) return null;

    const {
        'Part Number': partNumber,
        Description,
        Category,
        'Product Line': productLine,
        'Screen Size': screenSize,
        RAM,
        Storage,
        Color,
        Processor
    } = productData;

    return (
        <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>Produktdetaljer</h3>
            <div className="detail-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="detail-item"><span className="detail-label">Part Number</span><span className="detail-value">{partNumber}</span></div>
                <div className="detail-item"><span className="detail-label">Description</span><span className="detail-value">{Description}</span></div>
                <div className="detail-item"><span className="detail-label">Category</span><span className="detail-value">{Category}</span></div>
                <div className="detail-item"><span className="detail-label">Product Line</span><span className="detail-value">{productLine || 'N/A'}</span></div>
                <div className="detail-item"><span className="detail-label">Processor</span><span className="detail-value">{Processor || 'N/A'}</span></div>
                <div className="detail-item"><span className="detail-label">Screen Size</span><span className="detail-value">{screenSize || 'N/A'}</span></div>
                <div className="detail-item"><span className="detail-label">RAM</span><span className="detail-value">{RAM || 'N/A'}</span></div>
                <div className="detail-item"><span className="detail-label">Storage</span><span className="detail-value">{Storage || 'N/A'}</span></div>
                <div className="detail-item"><span className="detail-label">Color</span><span className="detail-value">{Color || 'N/A'}</span></div>
            </div>
        </div>
    );
}

window.ProductDetailView = ProductDetailView;
