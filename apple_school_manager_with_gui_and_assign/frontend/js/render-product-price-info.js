

export function renderProductPriceInfo(data) {
    if (!data || typeof data !== 'object') {
        return '<div class="card section"><b>Ogiltig produktdata</b></div>';
    }

    const formatCurrency = value => {
        return typeof value === 'number'
            ? value.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })
            : '-';
    };

    const formatPercent = value => {
        return typeof value === 'number'
            ? (value * 100).toFixed(2) + '%'
            : '-';
    };

    const listPrice = formatCurrency(data.list_price);
    const discountedPrice = formatCurrency(data.new_price);
    const discountAmount = formatCurrency(data.discount_amount);
    const totalDiscountPercent = formatPercent(data.total_discount);
    const programName = data.program_name || '-';

    const discountsList = Array.isArray(data.discounts) && data.discounts.length > 0
        ? `<ul style="margin: 0px; padding-left: 1.2em;">` +
          data.discounts.map(d => `<li>${d.source}: ${(d.value * 100).toFixed(2)}%</li>`).join('') +
          `</ul>`
        : '<i>Inga rabatter</i>';

    return `
        <div class="card section" style="margin-top: 1.5rem; margin-bottom: 1.5rem;">
            <div class="price-result-grid">
                <div style="font-size: 1.5rem; font-weight: 700; color: var(--atea-green);">
                    Ditt pris: ${discountedPrice}
                </div>
                <div style="margin-top: 0.5rem; color: rgb(102, 102, 102);">
                    Listpris: ${listPrice}
                </div>
                <div style="margin-top: 0.5rem;">
                    Rabatter: ${discountsList}
                </div>
                <div>Total rabatt: <b>${totalDiscountPercent}</b></div>
                <div>Rabattbelopp: <b>${discountAmount}</b></div>
                <div>Rabattkälla: <b>${programName}</b></div>
            </div>
        </div>
    `;
}