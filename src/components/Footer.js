import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <div className="footer">
      <div className="left">
        <Link to="/">
          <img src="/media/disfuse.png" alt="" />
          <div>
            <h1>DisFuse</h1>
            <em>© 2025 DisFuse</em>
          </div>
        </Link>
      </div>
      <div className="list">
        <h2>Pages</h2>
        <ul>
          <li>
            <Link to="/staff">Staff</Link>
          </li>
          <li>
            <Link to="/tos">Terms of Service</Link>
          </li>
          <li>
            <Link to="/pp">Privacy Policy</Link>
          </li>
        </ul>
      </div>
      <div className="list">
        <h2>Dashboard</h2>
        <ul>
          <li>
            <Link to="/projects">Projects</Link>
          </li>
          <li>
            <Link to="/explore">Explore</Link>
          </li>
          <li>
            <Link to="/favorites">Favorites</Link>
          </li>
          <li>
            <Link to="/workshop">Workshop</Link>
          </li>
          <li>
            <Link to="/inbox">Inbox</Link>
          </li>
          <li>
            <Link to="/settings">Settings</Link>
          </li>
        </ul>
      </div>
      <div className="list">
        <h2>Links</h2>
        <ul>
          <li>
            <a target="_blank" rel="noreferrer" href="https://dsc.gg/disfuse">
              Discord Server
            </a>
          </li>
          <li>
            <a
              target="_blank"
              rel="noreferrer"
              href="https://youtube.com/millioncodes"
            >
              YouTube
            </a>
          </li>
          <li>
            <a
              target="_blank"
              rel="noreferrer"
              href="https://github.com/Millionxsam/DisFuse/blob/main/LICENSE.md"
            >
              License
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
