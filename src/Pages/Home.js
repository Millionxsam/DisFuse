import { Link } from "react-router-dom";

export default function Home() {
  return (
    <>
      <div className="home-container">
        <div className="head">
          <div className="logo">
            <img src="/media/disfuse.png" alt="" />
          </div>
          <h1>DisFuse</h1>
          <p>
            Create your own <strong>advanced</strong> Discord bot by using
            <strong> simple</strong>, easy-to-use block coding
          </p>
          <div className="buttons">
            <Link to="/projects">
              <button>
                <i class="fa-solid fa-table-list"></i> Dashboard
              </button>
            </Link>
            <Link to="/explore">
              <button>
                <i class="fa-solid fa-magnifying-glass"></i> Explore
              </button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
