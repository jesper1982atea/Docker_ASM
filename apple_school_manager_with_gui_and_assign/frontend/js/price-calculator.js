const { useState, useMemo } = React;

function PriceCalculator({ listPrice, discountRate = 0, originalDeal = null }) {
    const [targetMarginPercent, setTargetMarginPercent] = useState(15);
    const [residualValuePercent, setResidualValuePercent] = useState(10);
    const [leasePeriodMonths, setLeasePeriodMonths] = useState(36);

    const discountedAlp = useMemo(() => (parseFloat(listPrice) || 0) * (1 - discountRate), [listPrice, discountRate]);

    const newDeal = useMemo(() => {
        if (discountedAlp === 0) return null;

        const newSalesPrice = discountedAlp / (1 - (targetMarginPercent / 100));
        const newMarginValue = newSalesPrice - discountedAlp;
        
        const residualValueAmount = newSalesPrice * (residualValuePercent / 100);
        const financingAmount = newSalesPrice - residualValueAmount;
        const monthlyCost = leasePeriodMonths > 0 ? financingAmount / leasePeriodMonths : 0;

        return {
            salesPrice: newSalesPrice,
            marginValue: newMarginValue,
            marginPercent: targetMarginPercent,
            monthlyCost: monthlyCost,
        };
    }, [discountedAlp, targetMarginPercent, residualValuePercent, leasePeriodMonths]);

    const comparison = useMemo(() => {
        if (!originalDeal || !newDeal) return null;

        const priceDiff = newDeal.salesPrice - originalDeal.sales;
        const marginDiff = newDeal.marginValue - originalDeal.margin;

        return {
            priceDiff,
            marginDiff,
        };
    }, [originalDeal, newDeal]);

    if (discountedAlp === 0) {
        return <p>Väntar på prisinformation för att kunna starta kalkylatorn...</p>;
    }

    return (
        <div className="price-calculator">
            <div className="calculator-inputs" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', alignItems: 'flex-end', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                    <label>Inköpspris (efter rabatt)</label>
                    <input type="text" value={`${discountedAlp.toFixed(2)} SEK`} disabled />
                </div>
                <div className="form-group">
                    <label htmlFor="target-margin">Önskad marginal (%)</label>
                    <input type="number" id="target-margin" value={targetMarginPercent} onChange={e => setTargetMarginPercent(parseFloat(e.target.value) || 0)} />
                </div>
                <div className="form-group">
                    <label htmlFor="residual-value">Restvärde (%)</label>
                    <input type="number" id="residual-value" value={residualValuePercent} onChange={e => setResidualValuePercent(parseFloat(e.target.value) || 0)} />
                </div>
                 <div className="form-group">
                    <label htmlFor="lease-period">Leasingperiod (mån)</label>
                    <input type="number" id="lease-period" value={leasePeriodMonths} onChange={e => setLeasePeriodMonths(parseInt(e.target.value, 10) || 0)} />
                </div>
            </div>

            {newDeal && (
                <div className="calculator-results">
                    <h4 style={{ marginTop: 0, marginBottom: '1rem' }}>Nytt affärsförslag (Leasing)</h4>
                    <div className="detail-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                        <div className="detail-item price-box">
                            <span className="detail-label">Nytt försäljningspris</span>
                            <span className="detail-value">{newDeal.salesPrice.toFixed(2)} SEK</span>
                        </div>
                        <div className="detail-item price-box">
                            <span className="detail-label">Ny marginal</span>
                            <span className="detail-value" style={{color: 'var(--atea-green)'}}>{newDeal.marginValue.toFixed(2)} SEK ({newDeal.marginPercent.toFixed(2)}%)</span>
                        </div>
                        <div className="detail-item price-box final-price">
                            <span className="detail-label">Månadskostnad för kund</span>
                            <span className="detail-value">{newDeal.monthlyCost.toFixed(2)} SEK/mån</span>
                        </div>
                    </div>
                </div>
            )}

            {comparison && originalDeal && (
                <div style={{borderTop: '1px solid var(--border-color)', marginTop: '1.5rem', paddingTop: '1.5rem'}}>
                    <h4 style={{ marginTop: 0, marginBottom: '1rem' }}>Jämförelse med ursprunglig affär</h4>
                     <div className="detail-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                        <div className="detail-item price-box" style={{background: 'var(--atea-light-grey)'}}>
                            <span className="detail-label">Skillnad totalpris (kund)</span>
                            <span className="detail-value" style={{color: comparison.priceDiff > 0 ? 'var(--atea-red)' : 'var(--atea-green)'}}>
                                {comparison.priceDiff.toFixed(2)} SEK
                            </span>
                        </div>
                        <div className="detail-item price-box" style={{background: 'var(--atea-light-grey)'}}>
                            <span className="detail-label">Skillnad marginal (Atea)</span>
                             <span className="detail-value" style={{color: comparison.marginDiff > 0 ? 'var(--atea-green)' : 'var(--atea-red)'}}>
                                {comparison.marginDiff.toFixed(2)} SEK
                            </span>
                        </div>
                         <div className="detail-item price-box" style={{background: 'var(--atea-light-grey)'}}>
                            <span className="detail-label">Ny vs. Gammal marginal</span>
                             <span className="detail-value" style={{color: 'var(--atea-green)'}}>
                                {newDeal.marginPercent.toFixed(2)}% vs. {originalDeal.marginPercent.toFixed(2)}%
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

window.PriceCalculator = PriceCalculator;
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
