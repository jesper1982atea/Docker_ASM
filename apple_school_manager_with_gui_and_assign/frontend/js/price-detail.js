const { useState, useEffect, useMemo } = React;

function PriceDetailPage() {
    const [priceListData, setPriceListData] = useState([]);
    const [allDiscountPrograms, setAllDiscountPrograms] = useState({});
    const [functionalDiscounts, setFunctionalDiscounts] = useState([]);
    const [selectedDiscount, setSelectedDiscount] = useState('none');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showDebug, setShowDebug] = useState(false);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setLoading(true);
                const [priceData, discounts, funcDiscounts] = await Promise.all([
                    fetchLatestPriceList(),
                    fetchAllDiscountPrograms(),
                    fetchFunctionalDiscounts()
                ]);
                setPriceListData(priceData);
                setAllDiscountPrograms(discounts);
                setFunctionalDiscounts(funcDiscounts);
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, []);

    const calculatedPrices = useMemo(() => {
        if (loading || priceListData.length === 0) {
            return [];
        }
        return priceListData.map(product => {
            const { finalPrice, appliedDiscountRate, discountSource, listPrice } = calculatePrice(
                product,
                allDiscountPrograms,
                selectedDiscount,
                functionalDiscounts
            );
            return {
                ...product,
                'List Price': listPrice,
                'Discount': `${(appliedDiscountRate * 100).toFixed(2)}%`,
                'Discount Source': discountSource,
                'Final Price': finalPrice,
            };
        });
    }, [priceListData, selectedDiscount, allDiscountPrograms, functionalDiscounts, loading]);

    const handleDiscountChange = (e) => {
        setSelectedDiscount(e.target.value);
    };

    const handleRowClick = (product) => {
        // Store product data in session storage to pass it to the detail page
        sessionStorage.setItem('selectedProduct', JSON.stringify(product));
        window.location.href = '/product-spec';
    };

    if (loading) {
        return React.createElement("div", { className: "container" }, 
            React.createElement("div", { className: "loading" }, 
                React.createElement("div", { className: "spinner" }), 
                React.createElement("p", null, "Laddar pris- och rabattdata...")
            )
        );
    }

    if (error) {
        return React.createElement("div", { className: "container" }, 
            React.createElement("div", { className: "alert alert-danger" }, error)
        );
    }

    const headers = calculatedPrices.length > 0 ? Object.keys(calculatedPrices[0]) : [];

    return (
        React.createElement("div", { className: "container" },
            React.createElement("header", { className: "atea-header" },
                React.createElement("div", { className: "header-content" },
                    React.createElement("a", { href: "/" }, 
                        React.createElement("img", { src: "/images/logo.jpg", alt: "Atea Logo", className: "header-logo", style: { height: '50px' } })
                    ),
                    React.createElement("div", null,
                        React.createElement("h1", null, "Prislista med Rabatter"),
                        React.createElement("p", null, "Visar den senaste prislistan med valda rabatter applicerade.")
                    )
                ),
                React.createElement("div", { className: "header-links" },
                    React.createElement("a", { href: "/", className: "header-link" }, "⬅️ Tillbaka till Admin")
                )
            ),

            React.createElement("div", { className: "card", style: { padding: '2rem', background: 'var(--atea-white)', marginTop: '2rem' } },
                React.createElement("div", { className: "form-group" },
                    React.createElement("label", { htmlFor: "discount-select" }, "Välj Rabattprogram"),
                    React.createElement("select", { id: "discount-select", value: selectedDiscount, onChange: handleDiscountChange },
                        React.createElement("option", { value: "none" }, "Ingen rabatt"),
                        Object.keys(allDiscountPrograms).map(name => (
                            React.createElement("option", { key: name, value: name }, name)
                        ))
                    )
                ),
                React.createElement("button", { 
                    onClick: () => setShowDebug(!showDebug), 
                    className: "btn", 
                    style: { marginTop: '1rem' } 
                }, showDebug ? "Dölj Debug" : "Visa Debug")
            ),

            showDebug && React.createElement("div", { className: "card", style: { padding: '1rem', marginTop: '1rem' } },
                React.createElement("h3", null, "Debug: Beräknad Data"),
                React.createElement("pre", { style: { background: '#f4f4f4', padding: '1rem', borderRadius: '4px', maxHeight: '400px', overflow: 'auto' } },
                    JSON.stringify(calculatedPrices, null, 2)
                )
            ),

            React.createElement("div", { className: "card", style: { padding: '2rem', background: 'var(--atea-white)', marginTop: '2rem' } },
                React.createElement("h3", null, "Prislista"),
                React.createElement("div", { className: "table-container", style: { maxHeight: '70vh', overflow: 'auto' } },
                    React.createElement("table", { className: "table" },
                        React.createElement("thead", null,
                            React.createElement("tr", null,
                                headers.map(h => React.createElement("th", { key: h }, h))
                            )
                        ),
                        React.createElement("tbody", null,
                            calculatedPrices.map((row, index) => (
                                React.createElement("tr", { 
                                    key: index, 
                                    onClick: () => handleRowClick(row),
                                    style: { cursor: 'pointer' } 
                                },
                                    headers.map(header => {
                                        let value = row[header];
                                        if (typeof value === 'number' && (header.toLowerCase().includes('price'))) {
                                            value = value.toFixed(2);
                                        }
                                        return React.createElement("td", { key: header }, value === null || value === undefined ? '' : String(value));
                                    })
                                )
                            ))
                        )
                    )
                )
            )
        )
    );
}

const domContainer = document.getElementById('root');
const root = ReactDOM.createRoot(domContainer);
root.render(React.createElement(PriceDetailPage));
