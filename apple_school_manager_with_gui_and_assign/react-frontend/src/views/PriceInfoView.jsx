import React from 'react';
import DiscountLookupResult from '../components/DiscountLookupResult';

export default function ProductPage() {
    return (
        <div className="container">
            <h2>Produktdetaljer</h2>
            <DiscountLookupResult
                programName="AAR_in_AAES_HiEd_Institutions"
                partNumber="MC654KS/A"
                priceList="Price_List_Sweden_L597287A-en_GB-9_2025-07-09.json"
            />
        </div>
    );
}