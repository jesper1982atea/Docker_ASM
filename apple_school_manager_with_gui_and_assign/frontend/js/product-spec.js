const { useState, useEffect } = React;

function ProductSpecPage() {
    const [product, setProduct] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        try {
            const productData = sessionStorage.getItem('selectedProduct');
            if (productData) {
                setProduct(JSON.parse(productData));
            } else {
                setError('Ingen produktdata hittades. Gå tillbaka till prislistan och välj en produkt.');
            }
        } catch (e) {
            setError('Kunde inte läsa produktdata. Informationen kan vara korrupt.');
        }
    }, []);

    if (error) {
        return React.createElement("div", { className: "container" },
            React.createElement("div", { className: "alert alert-danger" }, error),
            React.createElement("a", { href: "/price-detail", className: "btn" }, "Tillbaka till prislistan")
        );
    }

    if (!product) {
        return React.createElement("div", { className: "container" },
            React.createElement("div", { className: "loading" },
                React.createElement("div", { className: "spinner" }),
                React.createElement("p", null, "Laddar produktinformation...")
            )
        );
    }

    const formatPrice = (price) => {
        if (typeof price !== 'number') return price;
        return price.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK', minimumFractionDigits: 2 });
    };

    return (
        React.createElement("div", { className: "container" },
            React.createElement("header", { className: "atea-header" },
                React.createElement("div", { className: "header-content" },
                    React.createElement("a", { href: "/" },
                        React.createElement("img", { src: "/images/logo.jpg", alt: "Atea Logo", className: "header-logo", style: { height: '50px' } })
                    ),
                    React.createElement("div", null,
                        React.createElement("h1", null, "Produktspecifikation")
                    )
                ),
                React.createElement("div", { className: "header-links" },
                    React.createElement("a", { href: "/price-detail", className: "header-link" }, "⬅️ Tillbaka till Prislistan")
                )
            ),

            React.createElement("div", { className: "product-card" },
                React.createElement("div", { className: "product-header" },
                    React.createElement("h2", null, product['Product Description']),
                    React.createElement("p", null, `Artikelnummer: ${product['Part Number']}`)
                ),
                React.createElement("div", { className: "product-details-grid" },
                    React.createElement("div", { className: "detail-item" },
                        React.createElement("strong", null, "Kategori"),
                        React.createElement("span", null, product['Category'])
                    ),
                    React.createElement("div", { className: "detail-item" },
                        React.createElement("strong", null, "Produktklass"),
                        React.createElement("span", null, product['Product Class'])
                    ),
                    React.createElement("div", { className: "detail-item" },
                        React.createElement("strong", null, "Listpris (exkl. moms)"),
                        React.createElement("span", null, formatPrice(product['List Price']))
                    ),
                    React.createElement("div", { className: "detail-item" },
                        React.createElement("strong", null, "Rabatt"),
                        React.createElement("span", null, product['Discount'])
                    ),
                    React.createElement("div", { className: "detail-item" },
                        React.createElement("strong", null, "Rabattkälla"),
                        React.createElement("span", null, product['Discount Source'])
                    ),
                    React.createElement("div", { className: "detail-item price-highlight" },
                        React.createElement("strong", null, "Ditt pris (exkl. moms)"),
                        React.createElement("span", null, formatPrice(product['Final Price']))
                    )
                )
            )
        )
    );
}

const domContainer = document.getElementById('root');
const root = ReactDOM.createRoot(domContainer);
root.render(React.createElement(ProductSpecPage));
