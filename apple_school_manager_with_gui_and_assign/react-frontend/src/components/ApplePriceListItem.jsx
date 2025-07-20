import React from "react";

const ApplePriceListItem = ({ product, headers, onClick }) => (
  <tr onClick={() => onClick(product)} style={{ cursor: "pointer" }}>
    {headers.map(header => {
      let value = product[header];
      if (typeof value === "number" && header.toLowerCase().includes("price")) {
        value = value.toFixed(2);
      }
      return <td key={header}>{value === null || value === undefined ? "" : String(value)}</td>;
    })}
  </tr>
);

export default ApplePriceListItem;
