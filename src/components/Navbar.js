import { Link, Outlet } from "react-router-dom";

export default function Navbar() {
  return (
    <>
      <div className="navbar">
        <Link to="/" className="logo">
          <img src="/media/disfuse-clear.png" alt="" />
        </Link>
        <ul className="pages">
          <li key="home" className="underline-effect">
            <Link to="/">Home</Link>
          </li>
          <li key="dashboard" className="underline-effect">
            <Link to="/projects">Dashboard</Link>
          </li>
          <li key="explore" className="underline-effect">
            <Link to="/explore">Explore</Link>
          </li>
          <li key="staff" className="underline-effect">
            <Link to="/staff">Staff</Link>
          </li>
        </ul>
        <ul className="buttons">
          <li key="discord" id="discord">
            <Link target="_blank" rel="noopener" to="https://dsc.gg/disfuse">
              <i className="fa-brands fa-discord"></i> Discord
            </Link>
          </li>
        </ul>
      </div>
      <Outlet />
    </>
  );
}
