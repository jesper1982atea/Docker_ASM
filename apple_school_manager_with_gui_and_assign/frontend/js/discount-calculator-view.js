const { useState, useEffect, useMemo } = React;

/**
 * A reusable component to calculate and display discounted prices for a product.
 * @param {object} props
 * @param {object} props.product - The product object to calculate the price for.
 */
function DiscountCalculatorView({ product }) {
    const [allDiscountPrograms, setAllDiscountPrograms] = useState({});
    const [functionalDiscounts, setFunctionalDiscounts] = useState([]);
    const [selectedDiscount, setSelectedDiscount] = useState('none');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadDiscountData = async () => {
            try {
                setLoading(true);
                const [discounts, funcDiscounts] = await Promise.all([
                    fetchAllDiscountPrograms(),
                    fetchFunctionalDiscounts()
                ]);
                setAllDiscountPrograms(discounts);
                setFunctionalDiscounts(funcDiscounts);
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };
        loadDiscountData();
    }, []);

    const calculatedPriceInfo = useMemo(() => {
        if (!product) return null;
        // The calculatePrice function is available globally from price-calculator.js
        return calculatePrice(
            product,
            allDiscountPrograms,
            selectedDiscount,
            functionalDiscounts
        );
    }, [product, selectedDiscount, allDiscountPrograms, functionalDiscounts]);

    if (loading) {
        return React.createElement("div", { className: "loading" }, React.createElement("div", { className: "spinner-small" }), React.createElement("p", null, "Laddar rabatter..."));
    }

    if (error) {
        return React.createElement("div", { className: "alert alert-danger" }, error);
    }

    return (
        React.createElement("div", { className: "discount-calculator" },
            React.createElement("h3", null, "Beräkna pris med rabatt"),
            React.createElement("div", { className: "form-group" },
                React.createElement("label", { htmlFor: "discount-select" }, "Välj Rabattprogram"),
                React.createElement("select", { id: "discount-select", value: selectedDiscount, onChange: e => setSelectedDiscount(e.target.value) },
                    React.createElement("option", { value: "none" }, "Ingen programrabatt"),
                    Object.keys(allDiscountPrograms).map(name => (
                        React.createElement("option", { key: name, value: name }, name)
                    ))
                )
            ),
            calculatedPriceInfo && React.createElement("div", { className: "price-summary", style: { marginTop: '1.5rem' } },
                React.createElement("div", { className: "price-item" },
                    React.createElement("span", null, "Listpris (exkl. moms)"),
                    React.createElement("strong", null, `${calculatedPriceInfo.listPrice.toFixed(2)} SEK`)
                ),
                React.createElement("div", { className: "price-item" },
                    React.createElement("span", null, "Tillämpad rabatt"),
                    React.createElement("strong", null, calculatedPriceInfo.discountSource)
                ),
                React.createElement("div", { className: "price-item final-price" },
                    React.createElement("span", null, "Ditt pris (exkl. moms)"),
                    React.createElement("strong", null, `${calculatedPriceInfo.finalPrice.toFixed(2)} SEK`)
                )
            )
        )
    );
}
