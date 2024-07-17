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
          <br></br>
          <h2>With DisFuse, you can enjoy:</h2>
          <div className="cardsMainPage">
            <div>Private/public projects</div>
            <div>View and comment on other people's public projects</div>
            <div>Like, clone, and add projects to your favorites</div>
            <div>Build-in secrets (environment variables)</div>
            <div>Advanced Discord features</div>
            <div>Easy-to-use and organized environment</div>
            <div>Workspace settings</div>
            <div>Custom blocks (coming soon)</div>
          </div>
        </div>
      </div>
    </>
  );
}
