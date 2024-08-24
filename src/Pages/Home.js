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
          <div className="buttons hidden">
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
        <div
          onClick={() => {
            window.scrollTo({
              top: window.innerHeight,
              left: 0,
              behavior: "smooth",
            });
          }}
          className="hidden scrollDownBtn"
        >
          <i class="fa-solid fa-circle-chevron-down"></i>
        </div>
        <div className="body">
          <h2 className="hidden">Why DisFuse?</h2>
          <div className="features">
            <div className="hidden">
              <i class="fa-solid fa-eye-slash"></i>
              Private/public projects
            </div>
            <div className="hidden">
              <i class="fa-solid fa-comments"></i>
              View and comment on others' public projects
            </div>
            <div className="hidden">
              <i class="fa-solid fa-star"></i>
              Like, clone, and add projects to your favorites
            </div>
            <div className="hidden">
              <i class="fa-solid fa-lock"></i>
              Built-in secrets (environment variables)
            </div>
            <div className="hidden">
              <i class="fa-solid fa-cubes"></i>Built-in and user-made templates
            </div>
            <div className="hidden">
              <i class="fa-brands fa-square-js"></i>Advanced Discord features
            </div>
            <div className="hidden">
              <i class="fa-solid fa-desktop"></i>Easy-to-use and organized
              environment
            </div>
            <div className="hidden">
              <i class="fa-solid fa-gears"></i>Workspace settings
            </div>
            <div className="hidden">
              <i class="fa-solid fa-shapes"></i>Custom blocks (coming soon)
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
