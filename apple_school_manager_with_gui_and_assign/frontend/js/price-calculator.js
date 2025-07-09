const { useState, useMemo } = React;

function PriceCalculator({ listPrice, discountRate = 0 }) {
    const [residualValuePercent, setResidualValuePercent] = useState(10);
    const [leasePeriodMonths, setLeasePeriodMonths] = useState(36);
    const [customSalesPrice, setCustomSalesPrice] = useState('');

    const calculations = useMemo(() => {
        const alp = parseFloat(listPrice) || 0;
        const salesPrice = parseFloat(customSalesPrice) || 0;

        const discountedAlp = alp * (1 - discountRate);
        const residualValue = discountedAlp * (residualValuePercent / 100);
        const netPurchasePrice = discountedAlp - residualValue;
        const monthlyCost = leasePeriodMonths > 0 ? netPurchasePrice / leasePeriodMonths : 0;
        
        const margin = salesPrice > 0 ? salesPrice - discountedAlp : null;
        const marginPercent = salesPrice > 0 ? (margin / salesPrice) * 100 : null;

        return {
            discountedAlp,
            residualValue,
            netPurchasePrice,
            monthlyCost,
            margin,
            marginPercent
        };
    }, [listPrice, discountRate, residualValuePercent, leasePeriodMonths, customSalesPrice]);

    return (
        <div className="price-calculator">
            <div className="calculator-inputs">
                <div className="form-group">
                    <label htmlFor="residual-value">Restvärde (%)</label>
                    <input
                        type="number"
                        id="residual-value"
                        value={residualValuePercent}
                        onChange={e => setResidualValuePercent(parseFloat(e.target.value) || 0)}
                        placeholder="t.ex. 10"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="lease-period">Leasingperiod (månader)</label>
                    <input
                        type="number"
                        id="lease-period"
                        value={leasePeriodMonths}
                        onChange={e => setLeasePeriodMonths(parseInt(e.target.value, 10) || 0)}
                        placeholder="t.ex. 36"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="custom-sales-price">Eget försäljningspris (för marginal)</label>
                    <input
                        type="number"
                        id="custom-sales-price"
                        value={customSalesPrice}
                        onChange={e => setCustomSalesPrice(e.target.value)}
                        placeholder="Ange kundpris ex. moms"
                    />
                </div>
            </div>

            <div className="calculator-results">
                <div className="detail-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    <div className="detail-item price-box">
                        <span className="detail-label">Inköpspris (efter rabatt)</span>
                        <span className="detail-value">{calculations.discountedAlp.toFixed(2)} SEK</span>
                    </div>
                    <div className="detail-item price-box">
                        <span className="detail-label">Restvärde</span>
                        <span className="detail-value" style={{color: 'var(--atea-orange)'}}>-{calculations.residualValue.toFixed(2)} SEK</span>
                    </div>
                    <div className="detail-item price-box">
                        <span className="detail-label">Netto inköpspris (för leasing)</span>
                        <span className="detail-value">{calculations.netPurchasePrice.toFixed(2)} SEK</span>
                    </div>
                </div>
                <div className="detail-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '1rem' }}>
                     <div className="detail-item price-box final-price">
                        <span className="detail-label">Månadskostnad</span>
                        <span className="detail-value">{calculations.monthlyCost.toFixed(2)} SEK/mån</span>
                    </div>
                    {calculations.margin !== null ? (
                        <React.Fragment>
                            <div className="detail-item price-box">
                                <span className="detail-label">Marginal</span>
                                <span className="detail-value" style={{color: calculations.margin < 0 ? 'var(--atea-red)' : 'var(--atea-green)'}}>
                                    {calculations.margin.toFixed(2)} SEK
                                </span>
                            </div>
                            <div className="detail-item price-box">
                                <span className="detail-label">Marginal (%)</span>
                                <span className="detail-value" style={{color: calculations.marginPercent < 0 ? 'var(--atea-red)' : 'var(--atea-green)'}}>
                                    {calculations.marginPercent.toFixed(2)}%
                                </span>
                            </div>
                        </React.Fragment>
                    ) : (
                        <div className="detail-item price-box" style={{gridColumn: 'span 2'}}>
                            <span className="detail-label">Ange försäljningspris för att se marginal</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

window.PriceCalculator = PriceCalculator;
