import React, { useState } from 'react';
import DiscountDropdown from '../components/DiscountDropdown';
import PriceInfo from '../components/PriceInfo';

export default function ProductDetailView({ priceInfo }) {
  const [selectedProgram, setSelectedProgram] = useState('');

 

  return (
    <div className="product-detail-view">
      <DiscountDropdown selected={selectedProgram} onChange={setSelectedProgram} />
      {priceInfo && <PriceInfo data={priceInfo} discountProgram={selectedProgram} />}
    </div>

    
  );
}

