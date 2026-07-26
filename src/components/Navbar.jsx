import { Link, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

const links = [
  { to: "/", label: "Home", icon: "fa-house" },
  { to: "/projects", label: "Dashboard", icon: "fa-table-list" },
  { to: "/explore", label: "Explore", icon: "fa-magnifying-glass" },
  { to: "/staff", label: "Staff", icon: "fa-user-tie" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <>
      <header className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="logo">
            <img src="/media/disfuse-clear.png" alt="" />
            <span>DisFuse</span>
          </Link>

          <nav className="nav-links">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`underline-effect ${location.pathname === l.to ? "active" : ""}`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="navbar-actions">
            <Link
              className="discord-pill"
              target="_blank"
              rel="noopener"
              to="https://discord.gg/Xwx4zkQcmJ"
            >
              <i className="fa-brands fa-discord"></i>
              <span>Discord</span>
            </Link>
            <button
              className={`nav-toggle ${open ? "active" : ""}`}
              onClick={() => setOpen((o) => !o)}
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>

        <div className={`nav-drawer ${open ? "open" : ""}`}>
          {links.map((l) => (
            <Link key={l.to} to={l.to}>
              <i className={`fa-solid ${l.icon}`}></i> {l.label}
            </Link>
          ))}
          <Link
            target="_blank"
            rel="noopener"
            to="https://discord.gg/Xwx4zkQcmJ"
          >
            <i className="fa-brands fa-discord"></i> Join our Discord
          </Link>
        </div>
      </header>
      <Outlet />
    </>
  );
}
