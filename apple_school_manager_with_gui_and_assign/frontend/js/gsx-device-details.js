const { useState, useEffect, useRef } = React;

// Reusable view component for displaying GSX details
function GsxDetailsView({ gsxDetails, serial }) {
    if (!gsxDetails) return null;

    const { productDescription, warrantyInfo, soldToName, productImageURL, activationDetails, identifiers, caseDetails, configDescription, configCode, loaner, consumerLawInfo, messages, productLine } = gsxDetails;

    return (
        <React.Fragment>
            <div className="result-card success" style={{borderLeft: 'none', padding: '1.5rem', background: 'var(--atea-light-grey)'}}>
                <div className="result-header">
                    <span>{serial}</span>
                    {productImageURL && <img src={productImageURL} alt="Product Image" />}
                </div>
                <div className="detail-grid">
                    <div className="detail-item">
                        <span className="detail-label">Description</span>
                        <span className="detail-value">{productDescription}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Configuration</span>
                        <span className="detail-value">{configDescription}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Sold To</span>
                        <span className="detail-value">{soldToName}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Purchase Country</span>
                        <span className="detail-value">{warrantyInfo?.purchaseCountryDesc} ({warrantyInfo?.purchaseCountryCode})</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Loaner Device</span>
                        <span className="detail-value">{loaner ? 'Yes' : 'No'}</span>
                    </div>
                </div>
            </div>

            <div className="section">
                <h3>Warranty Details</h3>
                <div className="detail-grid">
                     <div className="detail-item"><div className="detail-label">Status</div><div className="detail-value" style={{ color: warrantyInfo?.warrantyStatusCode !== 'OO' ? 'green' : 'red' }}>{warrantyInfo?.warrantyStatusDescription}</div></div>
                    <div className="detail-item"><div className="detail-label">Purchase Date</div><div className="detail-value">{new Date(warrantyInfo?.purchaseDate).toLocaleDateString()}</div></div>
                    <div className="detail-item"><div className="detail-label">Registration Date</div><div className="detail-value">{new Date(warrantyInfo?.registrationDate).toLocaleDateString()}</div></div>
                    <div className="detail-item"><div className="detail-label">Days Remaining</div><div className="detail-value">{warrantyInfo?.daysRemaining}</div></div>
                    <div className="detail-item"><div className="detail-label">Labor Covered</div><div className="detail-value">{warrantyInfo?.laborCovered ? 'Yes' : 'No'}</div></div>
                    <div className="detail-item"><div className="detail-label">Part Covered</div><div className="detail-value">{warrantyInfo?.partCovered ? 'Yes' : 'No'}</div></div>
                    <div className="detail-item"><div className="detail-label">Onsite Coverage</div><div className="detail-value">{warrantyInfo?.onsiteCoverage ? 'Yes' : 'No'}</div></div>
                </div>
                {warrantyInfo?.deviceCoverageDetails && (
                    <div style={{marginTop: '1rem'}}>
                        <h4>Coverage Details</h4>
                        <ul className="message-list">
                            {warrantyInfo.deviceCoverageDetails.map((msg, i) => <li key={i} className="message-item">{msg}</li>)}
                        </ul>
                    </div>
                )}
            </div>

            {activationDetails && <div className="section">
                <h3>Activation & Carrier</h3>
                <div className="detail-grid">
                    <div className="detail-item"><div className="detail-label">First Activation</div><div className="detail-value">{activationDetails.firstActivationDate ? new Date(activationDetails.firstActivationDate).toLocaleString() : 'N/A'}</div></div>
                    <div className="detail-item"><div className="detail-label">Unlocked</div><div className="detail-value" style={{ color: activationDetails.unlocked ? 'green' : 'orange' }}>{activationDetails.unlocked ? 'Yes' : 'No'}</div></div>
                    <div className="detail-item"><div className="detail-label">Carrier</div><div className="detail-value">{activationDetails.carrierName || 'N/A'}</div></div>
                    <div className="detail-item"><div className="detail-label">Last Restore</div><div className="detail-value">{activationDetails.lastRestoreDate ? new Date(activationDetails.lastRestoreDate).toLocaleString() : 'N/A'}</div></div>
                    <div className="detail-item"><div className="detail-label">Unlock Date</div><div className="detail-value">{activationDetails.unlockDate ? new Date(activationDetails.unlockDate).toLocaleString() : 'N/A'}</div></div>
                    <div className="detail-item"><div className="detail-label">OS Version</div><div className="detail-value">{activationDetails.productVersion}</div></div>
                    <div className="detail-item"><div className="detail-label">Last Unbrick OS</div><div className="detail-value">{activationDetails.lastUnbrickOsBuild}</div></div>
                </div>
            </div>}
            
            {activationDetails && <div className="section">
                <h3>Activation Policy</h3>
                <div className="detail-grid">
                    <div className="detail-item"><div className="detail-label">Initial Policy</div><div className="detail-value">{activationDetails.initialActivationPolicyDetails} ({activationDetails.initialActivationPolicyID})</div></div>
                    <div className="detail-item"><div className="detail-label">Applied Policy</div><div className="detail-value">{activationDetails.appliedActivationDetails} ({activationDetails.appliedActivationPolicyID})</div></div>
                    <div className="detail-item"><div className="detail-label">Next Tether Policy</div><div className="detail-value">{activationDetails.nextTetherPolicyDetails} ({activationDetails.nextTetherPolicyID})</div></div>
                </div>
            </div>}

            {identifiers && <div className="section">
                <h3>Product Information</h3>
                <div className="detail-grid">
                    <div className="detail-item"><div className="detail-label">Serial Number</div><div className="detail-value">{identifiers.serial || serial}</div></div>
                    {identifiers.imei && <div className="detail-item"><div className="detail-label">IMEI</div><div className="detail-value">{identifiers.imei}</div></div>}
                    {identifiers.imei2 && <div className="detail-item"><div className="detail-label">IMEI 2</div><div className="detail-value">{identifiers.imei2}</div></div>}
                    <div className="detail-item"><div className="detail-label">Config Code</div><div className="detail-value">{configCode}</div></div>
                    <div className="detail-item"><div className="detail-label">Product Line</div><div className="detail-value">{productLine}</div></div>
                </div>
            </div>}
            
            {messages && messages.length > 0 && <div className="section">
                <h3>Messages</h3>
                <ul className="message-list">
                    {messages.map((msg, i) => (
                        <li key={i} className="message-item">
                            <div className="detail-label">{msg.type}</div>
                            <div className="detail-value">{msg.message}</div>
                        </li>
                    ))}
                </ul>
            </div>}

            {caseDetails && caseDetails.length > 0 && <div className="section">
                <h3>Repair Cases ({caseDetails.length})</h3>
                <div className="detail-grid">
                    {caseDetails.map(c => (
                        <div key={c.caseId} className="detail-item">
                            <div className="detail-label">Case {c.caseId} ({new Date(c.createdDateTime).toLocaleDateString()})</div>
                            <div className="detail-value">{c.summary}</div>
                        </div>
                    ))}
                </div>
            </div>}
        </React.Fragment>
    );
}

// Make the view component available globally
window.GsxDetailsView = GsxDetailsView;


// Page component that fetches data and renders the view
function GsxDeviceDetailsPage() {
    const [gsxDetails, setGsxDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const params = new URLSearchParams(window.location.search);
    const customerId = params.get('customer');
    const serial = params.get('serial');
    const pageRef = useRef(null);

    useEffect(() => {
        if (!customerId || !serial) {
            setError("Customer ID or Serial Number is missing from URL.");
            setLoading(false);
            return;
        }
        
        const fetchDetails = async () => {
            try {
                setLoading(true);
                const res = await fetch(`/api/${customerId}/gsx/device-details/${serial}`);
                if (!res.ok) throw new Error(`Failed to fetch GSX details: ${res.statusText}`);
                const data = await res.json();
                if (data && data.device) {
                    setGsxDetails(data.device);
                } else {
                    throw new Error("Device not found in GSX response.");
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [customerId, serial]);

    const handleExportExcel = () => {
        if (!gsxDetails) return;

        const data = [
            { Category: 'General Information', Key: 'Product Description', Value: gsxDetails.productDescription },
            { Category: 'General Information', Key: 'Configuration', Value: gsxDetails.configDescription },
            { Category: 'General Information', Key: 'Sold To', Value: gsxDetails.soldToName },
            { Category: 'General Information', Key: 'Purchase Country', Value: `${gsxDetails.warrantyInfo?.purchaseCountryDesc} (${gsxDetails.warrantyInfo?.purchaseCountryCode})` },
            { Category: 'General Information', Key: 'Loaner Device', Value: gsxDetails.loaner ? 'Yes' : 'No' },
            
            { Category: 'Warranty Details', Key: 'Status', Value: gsxDetails.warrantyInfo?.warrantyStatusDescription },
            { Category: 'Warranty Details', Key: 'Purchase Date', Value: new Date(gsxDetails.warrantyInfo?.purchaseDate).toLocaleDateString() },
            { Category: 'Warranty Details', Key: 'Registration Date', Value: new Date(gsxDetails.warrantyInfo?.registrationDate).toLocaleDateString() },
            { Category: 'Warranty Details', Key: 'Days Remaining', Value: gsxDetails.warrantyInfo?.daysRemaining },
            
            { Category: 'Activation & Carrier', Key: 'First Activation', Value: gsxDetails.activationDetails?.firstActivationDate ? new Date(gsxDetails.activationDetails.firstActivationDate).toLocaleString() : 'N/A' },
            { Category: 'Activation & Carrier', Key: 'Unlocked', Value: gsxDetails.activationDetails?.unlocked ? 'Yes' : 'No' },
            { Category: 'Activation & Carrier', Key: 'Carrier', Value: gsxDetails.activationDetails?.carrierName || 'N/A' },

            { Category: 'Product Information', Key: 'Serial Number', Value: gsxDetails.identifiers?.serial || serial },
            { Category: 'Product Information', Key: 'IMEI', Value: gsxDetails.identifiers?.imei || 'N/A' },
            { Category: 'Product Information', Key: 'IMEI 2', Value: gsxDetails.identifiers?.imei2 || 'N/A' },
        ];

        (gsxDetails.caseDetails || []).forEach((c, i) => {
            data.push({ Category: 'Repair Cases', Key: `Case ${i+1} ID`, Value: c.caseId });
            data.push({ Category: 'Repair Cases', Key: `Case ${i+1} Summary`, Value: c.summary });
            data.push({ Category: 'Repair Cases', Key: `Case ${i+1} Created`, Value: new Date(c.createdDateTime).toLocaleString() });
        });

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Device Details");
        worksheet["!cols"] = [{wch:25}, {wch:25}, {wch:40}];
        XLSX.writeFile(workbook, `GSX_Details_${serial}.xlsx`);
    };

    const handleExportPdf = () => {
        if (!pageRef.current) return;
        
        html2canvas(pageRef.current, { scale: 2 }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jspdf.jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4'
            });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasWidth / canvasHeight;
            const height = pdfWidth / ratio;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, height);
            pdf.save(`GSX_Details_${serial}.pdf`);
        });
    };

    if (loading) {
        return <div className="loading"><div className="spinner"></div><p>Loading GSX device details...</p></div>;
    }

    if (error) {
        return <div className="container"><h1>Error</h1><p>{error}</p></div>;
    }

    if (!gsxDetails) {
        return <div className="container"><h1>Error</h1><p>Could not load device details.</p></div>;
    }

    return (
        <div className="container" ref={pageRef}>
            <div className="header atea-header">
                <div className="header-content">
                    <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
                        <img src="/frontend/images/logo.jpg" alt="Atea Logo" className="header-logo" style={{height: '40px'}}/>
                        <div>
                            <h1>GSX Device Details</h1>
                            <p>
                                {gsxDetails.productDescription} ({serial})
                            </p>
                        </div>
                    </div>
                </div>
                <div className="header-links">
                    <a href={`/frontend/gsx-search.html?customer=${customerId}`} className="header-link">
                        ⬅️ Back to GSX Search
                    </a>
                    <a href={`/frontend/customer-devices.html?customer=${customerId}`} className="header-link">
                        📦 Device List
                    </a>
                     <a href="/frontend/" className="header-link">
                        🏠 Admin Panel
                    </a>
                    <button onClick={handleExportExcel} className="header-link">Export to Excel</button>
                    <button onClick={handleExportPdf} className="header-link">Export to PDF</button>
                </div>
            </div>
            <GsxDetailsView gsxDetails={gsxDetails} serial={serial} />
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<GsxDeviceDetailsPage />);

