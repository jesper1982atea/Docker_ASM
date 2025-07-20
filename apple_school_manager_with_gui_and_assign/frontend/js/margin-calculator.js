import { debug } from "console";
import '../css/margin-calculator.css';
//import '../css/atea-style.css';

// export function renderMarginFromOrderData(ink, fors, debug = false) {
//     if (isNaN(fors) || isNaN(ink)) {
//         return React.createElement('div', {
//             className: 'detail-item',
//             style: { flexDirection: 'column', alignItems: 'flex-start' }
//         }, [
//             React.createElement('span', { className: 'detail-label' }, 'Marginal'),
//             React.createElement('span', { className: 'detail-value' }, '-')
//         ]);
//     }

//     const { marginal, marginal_procent } = calculateMargin(fors, ink);
//     const isNegative = marginal < 0;
//     const color = isNegative ? '#c0392b' : '#1a7f37';

//     const currencyFormat = (value) =>
//         value.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK', minimumFractionDigits: 0 });

//     return React.createElement('div', {
//         className: 'detail-item',
//         style: {
//             flexDirection: 'column',
//             alignItems: 'flex-start',
//             display: 'flex',
//             gap: '0.25rem'
//         }
//     }, [
//         React.createElement('span', { className: 'detail-label' }, 'Marginalanalys'),

//         React.createElement('span', {
//             className: 'detail-value',
//             style: { fontSize: '0.95rem', color: '#555' }
//         }, `Försäljningspris: ${currencyFormat(fors)}`),

//         React.createElement('span', {
//             className: 'detail-value',
//             style: { fontSize: '0.95rem', color: '#555' }
//         }, `Inköpspris: ${currencyFormat(ink)}`),

//         React.createElement('span', {
//             className: 'detail-value',
//             style: { fontWeight: 'bold', color }
//         }, `Marginal: ${currencyFormat(marginal)}`),

//         React.createElement('span', {
//             className: 'detail-value',
//             style: { color }
//         }, `Marginal: ${marginal_procent.toFixed(2)}%`)
//     ]);
// }

// export function renderMarginFromOrderData(ink, fors, debug = false) {
//     if (isNaN(fors) || isNaN(ink)) {
//         return (
//             <div className="detail-item">
//                 <span className="detail-label">Marginal</span>
//                 <span className="detail-value">-</span>
//             </div>
//         );
//     }

//     const { marginal, marginal_procent } = calculateMargin(fors, ink);
//     const isNegative = marginal < 0;
//     const currencyFormat = (value) =>
//         value.toLocaleString('sv-SE', { style: 'currency', currency: 'SEK', minimumFractionDigits: 0 });

//     return (
//         <div className="detail-item">
//             <span className="detail-label">Marginalanalys</span>
//             <span className="detail-value">{`Försäljningspris: ${currencyFormat(fors)}`}</span>
//             <span className="detail-value">{`Inköpspris: ${currencyFormat(ink)}`}</span>
//             <span className={`detail-marginal-positive ${isNegative ? 'negative' : ''}`}>
//                 {`Marginal: ${currencyFormat(marginal)}`}
//             </span>
//             <span className={`detail-marginal-positive ${isNegative ? 'negative' : ''}`}>
//                 {`Marginal: ${marginal_procent.toFixed(2)}%`}
//             </span>
//         </div>
//     );
// }

export function renderMarginFromOrderData(ink, fors, debug = false) {
    if (isNaN(fors) || isNaN(ink)) {
        return (
            <div className="detail-item" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <span className="detail-label">Marginal</span>
                <span className="detail-value">-</span>
            </div>
        );
    }

    const { marginal, marginal_procent } = calculateMargin(fors, ink);
    const isNegative = marginal < 0;

    const currencyFormat = (value) =>
        value.toLocaleString('sv-SE', {
            style: 'currency',
            currency: 'SEK',
            minimumFractionDigits: 0
        });

    return (
        <div className="detail-item" style={{ flexDirection: 'column', alignItems: 'flex-start', display: 'flex', gap: '0.25rem' }}>
            <span className="detail-label">Marginalanalys</span>
            <span className="detail-value">{`Försäljningspris: ${currencyFormat(fors)}`}</span>
            <span className="detail-value">{`Inköpspris: ${currencyFormat(ink)}`}</span>

            {/* Marginal i kr */}
            {/* <span
                className={`detail-marginal${isNegative ? ' negative' : '-positive'}`}
            >
                {`Marginal: ${currencyFormat(marginal)}`}
            </span> */}

            {/* Marginal i % */}
            <span className={`detail-marginal ${isNegative ? 'negative' : 'positive'}`}>
                {`Marginal: ${currencyFormat(marginal)}`}
            </span>

            <span className={`detail-marginal ${isNegative ? 'negative' : 'positive'}`}>
                {`Marginal: ${marginal_procent.toFixed(2)}%`}
            </span>
        </div>
    );
}


// function för att räkna ut magrinal och jämförelseberäkning
function calculateMargin(forsaljningspris, inkopspris, debug = false) {
    
    if (debug) {
        console.log('[DEBUG] calculateMargin called with:', { forsaljningspris, inkopspris });
    }

    if (typeof forsaljningspris !== 'number' || typeof inkopspris !== 'number') {
        throw new Error('Både försäljningspris och inköpspris måste vara siffror.');
    }

    const marginal = forsaljningspris - inkopspris;
    const marginal_procent = forsaljningspris !== 0
        ? (marginal / forsaljningspris) * 100
        : 0;
    if (debug) {
        console.log('[DEBUG] calculateMargin results:', { marginal, marginal_procent });
    }
  //  console.log('[DEBUG] calculateMargin marginal marginal procent:', { marginal, marginal_procent });
    
    return {
        marginal,
        marginal_procent
    };
}