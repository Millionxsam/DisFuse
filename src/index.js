import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "./fontawesome/css/all.css";
import Navbar from "./Navbar";
import CodeView from "./CodeView";
import Workspace from "./Workspace";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <>
    {/* <React.StrictMode> */}
    <Navbar />
    <CodeView />
    <Workspace />
    {/* </React.StrictMode> */}
  </>
);
