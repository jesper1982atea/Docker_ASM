import React from 'react';
import { useLocation } from 'react-router-dom';
import AteaSalesOrderDetail from '../components/AteaSalesOrderDetail';

export default function AteaSalesOrderDetailView() {
  // Get order from location state or sessionStorage
  const location = useLocation();
  let order = location.state?.order;
  if (!order) {
    // Fallback: try sessionStorage
    const stored = sessionStorage.getItem('selectedSalesOrder');
    if (stored) {
      try {
        order = JSON.parse(stored);
      } catch {}
    }
  }
  return <AteaSalesOrderDetail order={order} />;
}
