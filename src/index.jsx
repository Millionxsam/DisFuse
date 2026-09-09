import React from "react";
import ReactDOM from "react-dom/client";
import "./components/fontawesome/css/all.css";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { HelmetProvider } from "react-helmet-async";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <BrowserRouter
    future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    }}
  >
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </BrowserRouter>,
);
