import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import BodyView from "./views/BodyView";
import GSXSearchView from "./views/GSXSearchView";
import GSXDeviceDetailsView from "./views/GSXDeviceDetailsView";
import GSXApiKeySettingsView from "./views/GSXApiKeySettingsView";
import ApplePriceList from "./views/ApplePriceList";
import ApplePriceListDetailView from "./views/ApplePriceListDetailView";
import "./style.css";
import { BrowserRouter as Router, Routes, Route, useParams, useLocation } from "react-router-dom";
import AteaSalesUploadView from "./views/AteaSalesUploadView";
import AteaSalesOrderDetailView from "./views/AteaSalesOrderDetailView";
import CustomerProductSummaryPage from './views/CustomerProductSummaryPage';

const logoUrl = "../images/logo.jpg";

function GSXDeviceDetailsRoute() {
  const { serial } = useParams();
  return <GSXDeviceDetailsView serial={serial} />;
}

const AppContent = () => {
  const location = useLocation();
  const [page, setPage] = useState("price");

  useEffect(() => {
    // Sätt page baserat på path
    if (location.pathname.startsWith("/gsx-search")) setPage("gsx");
    else if (location.pathname.startsWith("/gsx-device-details")) setPage("gsx");
    else if (location.pathname.startsWith("/gsx-api-key-settings")) setPage("settings");
    else setPage("price");
  }, [location.pathname]);

  return (
    <div className="atea-app-shell">
      <header className="header atea-header">
        <div className="header-content">
          <img src={logoUrl} alt="Atea Logo" className="header-logo" />
          <div>
            <h1>Atea Device Portal</h1>
            <p style={{ margin: 0, color: "var(--atea-white)", fontWeight: 400 }}>
              Prislista, Sales, Apple GSX & ASM/ABM
            </p>
          </div>
        </div>
      </header>
      <Navbar page={page} setPage={setPage} />
      <main className="atea-main-content" style={{ padding: 0 }}>
        <Routes>
          <Route path="/" element={<BodyView page={page} />} />
          <Route path="/gsx-search" element={<GSXSearchView />} />
          <Route path="/gsx-device-details/:serial" element={<GSXDeviceDetailsRoute />} />
          <Route path="/gsx-api-key-settings" element={<GSXApiKeySettingsView />} />
          <Route path="/apple-price-list" element={<ApplePriceList />} />
          <Route path="/apple-price-list-detail" element={<ApplePriceListDetailView />} />
          <Route path="/sales-upload" element={<AteaSalesUploadView />} />
          <Route path="/customer-product-summary" element={<CustomerProductSummaryPage />} />
          <Route path="/sales-order-detail" element={<AteaSalesOrderDetailView />} />
        </Routes>
      </main>
    </div>
  );
};

const App = () => (
  <Router>
    <AppContent />
  </Router>
);

export default App;