import React from "react";
import IndexView from "./IndexView";
import GSXSearchView from "./GSXSearchView";
import GSXDeviceDetailsView from "./GSXDeviceDetailsView";

const BodyView = ({ page }) => {
  switch (page) {
    case "price":
      return <IndexView />;
    case "gsx":
      return <GSXSearchView />;
    case "gsx-details":
      return <GSXDeviceDetailsView />;
    default:
      return <IndexView />;
  }
};

export default BodyView;
