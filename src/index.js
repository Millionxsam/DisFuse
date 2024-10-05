import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import "./components/fontawesome/css/all.css";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

// move this to the workspace.js
import "./blocks/events/members";
import "./blocks/logic";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </>
);
