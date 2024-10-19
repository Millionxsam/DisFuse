import { useState } from "react";
import { Link, Outlet } from "react-router-dom";

export default function Settings() {
  const [category, setCategory] = useState(
    window.location.pathname.split("/")[2] || "workspace"
  );

  return (
    <div className="settings-container">
      <div className="head">
        <i class="fa-solid fa-gear"></i> Settings
      </div>
      <div className="body">
        <ul className="categories">
          <Link to="/settings/workspace">
            <li
              onClick={() => setCategory("workspace")}
              className={category === "workspace" ? "active" : ""}
            >
              Workspace
            </li>
          </Link>
          <Link to="/settings/notifications">
            <li
              onClick={() => setCategory("notifications")}
              className={category === "notifications" ? "active" : ""}
            >
              Notifications
            </li>
          </Link>
          <Link to="/settings/optimization">
            <li
              onClick={() => setCategory("optimization")}
              className={category === "optimization" ? "active" : ""}
            >
              Optimization
            </li>
          </Link>
        </ul>
        <Outlet />
      </div>
    </div>
  );
}
