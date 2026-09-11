import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import { premiumLogo } from "../../../config/premiumPlans";

import DocsLink from "../../../components/DocsLink.jsx";
import { DOCS } from "../../../config/docs.js";

const tabs = [
  { to: "/settings/workspace", key: "workspace", label: "Workspace" },
  { to: "/settings/notifications", key: "notifications", label: "Notifications" },
  { to: "/settings/optimization", key: "optimization", label: "Optimization" },
  {
    to: "/settings/premium",
    key: "premium",
    label: "Premium",
    image: premiumLogo,
  },
];

export default function Settings() {
  const [category, setCategory] = useState(
    window.location.pathname.split("/")[2] || "workspace",
  );

  return (
    <div className="df-settings-page">
      {/* Fallback title — each settings tab renders its own Helmet, which
          takes precedence once it has finished loading. */}
      <Helmet>
        <title>Settings | DisFuse</title>
      </Helmet>
      <h1>
        <i className="fa-solid fa-gear"></i> Settings
        <DocsLink page={DOCS.settings} />
      </h1>

      <div className="df-settings-body">
        <ul className="df-settings-tabs">
          {tabs.map((tab) => (
            <Link to={tab.to} key={tab.key}>
              <li
                onClick={() => setCategory(tab.key)}
                className={category === tab.key ? "active" : ""}
              >
                {tab.image && <img src={tab.image} alt="" />}
                {tab.label}
              </li>
            </Link>
          ))}
        </ul>

        <div className="df-settings-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
