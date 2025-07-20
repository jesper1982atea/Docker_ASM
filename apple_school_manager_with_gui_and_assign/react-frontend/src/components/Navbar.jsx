import React from "react";
import { useNavigate } from "react-router-dom";

const navLinks = [
  { key: "price", label: "Prislista & Kalkylator", icon: "💰" },
  { key: "sales", label: "Atea Sales Analys", icon: "📊" },
  { key: "gsx", label: "Apple GSX", icon: "🔍" },
  { key: "asm", label: "Apple ASM/ABM & Kundkonfiguration", icon: "⚙️" },
];

const Navbar = ({ page, setPage }) => {
  const navigate = useNavigate();
  return (
    <nav
      className="atea-navbar"
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: "1.5rem",
        background: "#fff",
        borderBottom: "2px solid #005eb8",
        padding: "0.75rem 2rem"
      }}
    >
      {navLinks.map((link) => (
        <button
          key={link.key}
          className={page === link.key ? "active atea-nav-btn" : "atea-nav-btn"}
          onClick={() => {
            setPage(link.key);
            if (link.key === "price") navigate("/apple-price-list");
            else if (link.key === "gsx") navigate("/gsx-search");
            else if (link.key === "asm") navigate("/");
            else if (link.key === "sales") navigate("/sales-upload");
          }}
          style={{
            background: page === link.key ? "var(--atea-green)" : "transparent",
            color: page === link.key ? "var(--atea-white)" : "var(--atea-green)",
            border: "none",
            fontWeight: page === link.key ? 700 : 600,
            fontSize: "1.1rem",
            borderRadius: "8px",
            padding: "0.6rem 1.5rem",
            marginRight: "0.5rem",
            transition: "background 0.2s, color 0.2s",
            boxShadow: page === link.key ? "0 2px 8px #0001" : "none",
            outline: page === link.key ? "2px solid var(--atea-green-light)" : "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.7em",
          }}
        >
          <span style={{ fontSize: "1.3em" }}>{link.icon}</span> {link.label}
        </button>
      ))}
      <button
        onClick={() => navigate("/gsx-api-key-settings")}
        style={{
          display: "flex",
          alignItems: "center",
          textDecoration: "none",
          color: "var(--atea-green)",
          fontWeight: 600,
          fontSize: "1.1rem",
          marginLeft: "1.5rem",
          padding: "0.6rem 1.5rem",
          borderRadius: "8px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          transition: "background 0.2s, color 0.2s",
        }}
      >
        <span style={{ fontSize: "1.3em", marginRight: "0.7em" }}>🔑</span>GSX API-inställningar
      </button>
    </nav>
  );
};

export default Navbar;
