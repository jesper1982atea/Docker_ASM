// priceUtils.js

export async function fetchPriceCalculation({ partNumber, priceList, discountProgram }) {
    const params = new URLSearchParams();
    params.append('part_number', partNumber);
    params.append('price_list', priceList);
    if (discountProgram && discountProgram !== 'none') {
        params.append('program_name', discountProgram);
    }

    const url = `/api/discounts/lookup?${params.toString()}`;
    const response = await fetch(url);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Kunde inte hämta pris');
    }
    return response.json(); // innehåller list_price, new_price, total_discount etc.
}

export async function calculateSimplePrice({
    inkopspris,
    restvardeProcent,
    alp_price,
    kontantMargin,
    leasingMargin,
    circularMargin
}) {
    const payload = {
        inkopspris,
        restvarde: restvardeProcent,
        alp_price,
        kontant_marginal_procent: kontantMargin,
        leasing_marginal_procent: leasingMargin,
        cirkular_marginal_procent: circularMargin
    };

    const response = await fetch('/api/price/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Fel vid prisberäkning');
    }

    return response.json(); // innehåller kontant, leasing, circular
}