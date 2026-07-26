import { useState } from "react";
import { Link, Outlet } from "react-router-dom";

const tabs = [
  { to: "/settings/workspace", key: "workspace", label: "Workspace" },
  { to: "/settings/notifications", key: "notifications", label: "Notifications" },
  { to: "/settings/optimization", key: "optimization", label: "Optimization" },
];

export default function Settings() {
  const [category, setCategory] = useState(
    window.location.pathname.split("/")[2] || "workspace",
  );

  return (
    <div className="df-settings-page">
      <h1>
        <i className="fa-solid fa-gear"></i> Settings
      </h1>

      <div className="df-settings-body">
        <ul className="df-settings-tabs">
          {tabs.map((tab) => (
            <Link to={tab.to} key={tab.key}>
              <li
                onClick={() => setCategory(tab.key)}
                className={category === tab.key ? "active" : ""}
              >
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
