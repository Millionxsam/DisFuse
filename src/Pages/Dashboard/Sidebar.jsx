import axios from "axios";
import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { userCache } from "../../cache.ts";

import { apiUrl } from "../../config/config.js";

const navItems = [
  { to: "/projects", label: "Projects", icon: "fa-solid fa-cubes" },
  { to: "/explore", label: "Explore", icon: "fa-solid fa-earth-americas" },
  { to: "/favorites", label: "Favorites", icon: "fa-solid fa-star" },
  { to: "/workshop", label: "Workshop", icon: "fa-solid fa-tools" },
  { to: "/inbox", label: "Inbox", icon: "fa-solid fa-inbox" },
  { to: "/settings", label: "Settings", icon: "fa-solid fa-gear" },
];

export default function Sidebar() {
  const [active, setActive] = useState(false);
  const [user, setUser] = useState({});
  const [isStaff, setIsStaff] = useState(userCache?.isStaff ?? false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setActive(false);
  }, [location.pathname]);

  useEffect(() => {
    if (userCache.user) {
      setUser(userCache.user);
      setIsStaff(userCache?.isStaff ?? false);
    } else {
      const token = localStorage.getItem("disfuse-token");
      axios
        .post(`${apiUrl}/users`, null, {
          headers: { Authorization: token },
        })
        .then(({ data: foundUser }) => {
          setUser(foundUser);
          userCache.user = foundUser;

          axios.get(`${apiUrl}/users/staff`).then(({ data: staff }) => {
            let isStaff = staff.users.some((i) => i?.id === foundUser?.id);
            setIsStaff(isStaff);
            userCache.isStaff = isStaff;
          });
        });
    }
  }, []);

  const unread = user.inbox?.filter((i) => !i.read).length || 0;

  const sidebarLinks = (
    <ul className="df-nav-list">
      {navItems.map((item) => (
        <li key={item.to}>
          <Link
            to={item.to}
            className={location.pathname.startsWith(item.to) ? "active" : ""}
          >
            <i className={item.icon}></i>
            <span>{item.label}</span>
            {item.to === "/inbox" && unread > 0 && (
              <span className="badge">{unread}</span>
            )}
          </Link>
        </li>
      ))}
      {isStaff && (
        <li>
          <Link
            to="/staff/panel"
            className={
              location.pathname.startsWith("/staff/panel") ? "active" : ""
            }
          >
            <i className="fa-solid fa-user-tie"></i>
            <span>Staff</span>
          </Link>
        </li>
      )}
    </ul>
  );

  return (
    <div className="df-shell">
      <div className="df-mobile-bar">
        <button className="icon-btn" onClick={() => setActive(true)}>
          <i className="fa-solid fa-bars"></i>
        </button>
        <Link to="/" className="brand">
          <img src="/media/disfuse.png" alt="" style={{ height: "1.7rem", borderRadius: "50%" }} />
          DisFuse
        </Link>
        <div style={{ width: "2.4rem" }} />
      </div>

      <aside className={`df-sidebar ${active ? "active" : ""}`}>
        <div className="df-sidebar-top">
          <div className="df-sidebar-brand">
            <button className="df-sidebar-close" onClick={() => setActive(false)}>
              <i className="fa-solid fa-xmark"></i>
            </button>
            <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
              <img src="/media/disfuse.png" alt="" />
              <span>DisFuse</span>
            </Link>
          </div>
          {sidebarLinks}
        </div>

        <div className="df-sidebar-bottom">
          <div className="df-nametag" onClick={() => navigate(`/@${user.username}`)}>
            <img src={user?.avatar} alt="" />
            <div className="name">{user?.global_name || user.username}</div>
            <i
              onClick={logout}
              className="fa-solid fa-arrow-right-from-bracket"
            ></i>
          </div>
        </div>
      </aside>

      <div
        className={`df-overlay ${active ? "active" : ""}`}
        onClick={() => setActive(false)}
      ></div>

      <div className="df-shell-main">
        <Outlet />
      </div>
    </div>
  );
}

function logout(e) {
  e.stopPropagation();
  localStorage.removeItem("disfuse-token");
  window.location.replace("/");
}
