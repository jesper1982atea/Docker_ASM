const { useState, useMemo } = React;

function PriceCalculator({ listPrice, discountRate = 0 }) {
    const [calcMode, setCalcMode] = useState('monthly'); // 'monthly', 'circular', 'margin'
    const [residualValuePercent, setResidualValuePercent] = useState(10);
    const [leasePeriodMonths, setLeasePeriodMonths] = useState(36);
    const [targetMarginPercent, setTargetMarginPercent] = useState(15);
    const [customSalesPrice, setCustomSalesPrice] = useState('');

    const discountedAlp = useMemo(() => (parseFloat(listPrice) || 0) * (1 - discountRate), [listPrice, discountRate]);

    const calculations = useMemo(() => {
        const residualValue = discountedAlp * (residualValuePercent / 100);
        const netPurchasePrice = discountedAlp - residualValue;
        const monthlyCost = leasePeriodMonths > 0 ? netPurchasePrice / leasePeriodMonths : 0;

        // For margin target mode
        const requiredSalesPrice = discountedAlp / (1 - (targetMarginPercent / 100));
        const requiredMarginValue = requiredSalesPrice - discountedAlp;

        // For custom sales price
        const customMargin = parseFloat(customSalesPrice) - discountedAlp;
        const customMarginPercent = customSalesPrice > 0 ? (customMargin / parseFloat(customSalesPrice)) * 100 : 0;

        return {
            residualValue,
            netPurchasePrice,
            monthlyCost,
            requiredSalesPrice,
            requiredMarginValue,
            customMargin,
            customMarginPercent
        };
    }, [discountedAlp, residualValuePercent, leasePeriodMonths, targetMarginPercent, customSalesPrice]);

    const renderResults = () => {
        switch (calcMode) {
            case 'monthly':
                return (
                    <div className="detail-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                        <div className="detail-item price-box"><span className="detail-label">Netto inköpspris</span><span>{calculations.netPurchasePrice.toFixed(2)} SEK</span></div>
                        <div className="detail-item price-box"><span className="detail-label">Leasingperiod</span><span>{leasePeriodMonths} mån</span></div>
                        <div className="detail-item price-box final-price"><span className="detail-label">Månadskostnad</span><span>{calculations.monthlyCost.toFixed(2)} SEK/mån</span></div>
                    </div>
                );
            case 'circular':
                return (
                     <div className="detail-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                        <div className="detail-item price-box"><span className="detail-label">Faktura 1 (Pris - Restvärde)</span><span>{calculations.netPurchasePrice.toFixed(2)} SEK</span></div>
                        <div className="detail-item price-box"><span className="detail-label">Restvärde</span><span>{calculations.residualValue.toFixed(2)} SEK</span></div>
                        <div className="detail-item price-box final-price"><span className="detail-label">Faktura 2 (vid behåll)</span><span>{calculations.residualValue.toFixed(2)} SEK</span></div>
                    </div>
                );
            case 'margin':
                return (
                    <div className="detail-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                        <div className="detail-item price-box"><span className="detail-label">Målmarginal</span><span>{targetMarginPercent}%</span></div>
                        <div className="detail-item price-box"><span className="detail-label">Marginal i SEK</span><span style={{color: 'var(--atea-green)'}}>{calculations.requiredMarginValue.toFixed(2)} SEK</span></div>
                        <div className="detail-item price-box final-price"><span className="detail-label">Krävt försäljningspris</span><span>{calculations.requiredSalesPrice.toFixed(2)} SEK</span></div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="price-calculator">
            <div className="calculator-controls" style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="form-group" style={{flex: 1}}>
                    <label>Kalkylmodell</label>
                    <select value={calcMode} onChange={e => setCalcMode(e.target.value)}>
                        <option value="monthly">Månadskostnad (Leasing)</option>
                        <option value="circular">Cirkulärt köp</option>
                        <option value="margin">Hitta försäljningspris (Målmarginal)</option>
                    </select>
                </div>
                <div className="form-group" style={{flex: 1}}>
                    <label>Inköpspris (efter rabatt)</label>
                    <input type="text" value={`${discountedAlp.toFixed(2)} SEK`} disabled />
                </div>
            </div>

            <div className="calculator-inputs" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                { (calcMode === 'monthly' || calcMode === 'circular') &&
                    <div className="form-group">
                        <label htmlFor="residual-value">Restvärde (%)</label>
                        <input type="number" id="residual-value" value={residualValuePercent} onChange={e => setResidualValuePercent(parseFloat(e.target.value) || 0)} />
                    </div>
                }
                { calcMode === 'monthly' &&
                    <div className="form-group">
                        <label htmlFor="lease-period">Leasingperiod (månader)</label>
                        <input type="number" id="lease-period" value={leasePeriodMonths} onChange={e => setLeasePeriodMonths(parseInt(e.target.value, 10) || 0)} />
                    </div>
                }
                { calcMode === 'margin' &&
                    <div className="form-group">
                        <label htmlFor="target-margin">Önskad marginal (%)</label>
                        <input type="number" id="target-margin" value={targetMarginPercent} onChange={e => setTargetMarginPercent(parseFloat(e.target.value) || 0)} />
                    </div>
                }
            </div>

            <div className="calculator-results">
                <h4 style={{ marginTop: 0, marginBottom: '1rem' }}>Resultat</h4>
                {renderResults()}
            </div>
            
            <div style={{borderTop: '1px solid var(--border-color)', marginTop: '1.5rem', paddingTop: '1.5rem'}}>
                 <h4 style={{ marginTop: 0, marginBottom: '1rem' }}>Testa eget försäljningspris</h4>
                 <div className="detail-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    <div className="form-group" style={{gridColumn: 'span 1'}}>
                        <label htmlFor="custom-sales-price">Försäljningspris (ex. moms)</label>
                        <input type="number" id="custom-sales-price" value={customSalesPrice} onChange={e => setCustomSalesPrice(e.target.value)} placeholder="Ange kundpris"/>
                    </div>
                    {customSalesPrice && (
                        <React.Fragment>
                            <div className="detail-item price-box"><span className="detail-label">Marginal</span><span style={{color: calculations.customMargin < 0 ? 'var(--atea-red)' : 'var(--atea-green)'}}>{calculations.customMargin.toFixed(2)} SEK</span></div>
                            <div className="detail-item price-box"><span className="detail-label">Marginal (%)</span><span style={{color: calculations.customMarginPercent < 0 ? 'var(--atea-red)' : 'var(--atea-green)'}}>{calculations.customMarginPercent.toFixed(2)}%</span></div>
                        </React.Fragment>
                    )}
                 </div>
            </div>
        </div>
    );
}

window.PriceCalculator = PriceCalculator;
