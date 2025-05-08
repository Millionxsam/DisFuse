import axios from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { userCache } from "../cache.ts";
const { apiUrl } = require("../config/config.json");

export default function Home() {
  const [users, setUsers] = useState(null);
  const [projects, setProjects] = useState(null);

  useEffect(() => {
    if (users !== null && projects !== null) return;

    if (userCache.stats) {
      setUsers(userCache.stats.users);
      setProjects(userCache.stats.projects);
    } else {
      axios
        .get(apiUrl + "/stats")
        .then(({ data }) => {
          setUsers(data.users);
          setProjects(data.projects);
        })
        .catch(() => {
          setUsers(228);
          setProjects(348);
        });
    }
  }, [users, projects]);

  useEffect(() => {
    if (users === null || projects === null) return;

    let animationFrameId;

    const statsDivs = document.querySelectorAll(".home-container .stats div");
    const usersEle = statsDivs[0];
    const projectsEle = statsDivs[1];

    const animationMs = 2000;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / animationMs, 1);

      const currentUsers = Math.floor(users * progress);
      const currentProjects = Math.floor(projects * progress);

      usersEle.innerHTML = `${currentUsers} Users`;
      projectsEle.innerHTML = `${currentProjects} Projects`;

      if (progress < 1 && window.location.pathname !== "/home") {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [users, projects]);

  return (
    <>
      <div className="home-container">
        <div className="head">
          <div className="logo">
            <img src="/media/disfuse.png" alt="" />
          </div>
          <h1>DisFuse</h1>
          <div className="stats hidden">
            <div>{users ?? "0"} Users</div>
            <div>{projects ?? "0"} Projects</div>
          </div>
          <p>
            Create your own <strong>advanced</strong> Discord bot by using
            <strong> simple</strong>, easy-to-use block coding
          </p>
          <div className="buttons hidden">
            <Link to="/projects">
              <button>
                <i className="fa-solid fa-table-list"></i> Dashboard
              </button>
            </Link>
            <Link to="/explore">
              <button>
                <i className="fa-solid fa-magnifying-glass"></i> Explore
              </button>
            </Link>
          </div>
        </div>
        <div
          onClick={() => {
            window.scrollTo({
              top: window.outerHeight,
              left: 0,
              behavior: "smooth",
            });
          }}
          className="hidden scrollDownBtn"
        >
          <i className="fa-solid fa-circle-chevron-down"></i>
        </div>
        <div className="body">
          <h2 className="hidden">Why DisFuse?</h2>
          <div className="features">
            <div className="hidden">
              <i className="fa-solid fa-eye-slash"></i>
              Private/public projects
            </div>
            <div className="hidden">
              <i className="fa-solid fa-shapes"></i>
              Custom & community-made blocks
            </div>
            <div className="hidden">
              <i class="fa-solid fa-user-group"></i>
              Multi-user Collaboration
            </div>
            <div className="hidden">
              <i className="fa-solid fa-comments"></i>
              View and comment on other projects
            </div>
            <div className="hidden">
              <i className="fa-solid fa-lock"></i>
              Built-in secrets (environment variables)
            </div>
            <div className="hidden">
              <i className="fa-solid fa-cubes"></i>
              Built-in and user-made templates
            </div>
            <div className="hidden">
              <i className="fa-brands fa-square-js"></i>
              Advanced Discord features
            </div>
            <div className="hidden">
              <i className="fa-solid fa-desktop"></i>
              Easy-to-use and organized environment
            </div>
            <div className="hidden">
              <i className="fa-solid fa-gears"></i>
              Workspace settings
            </div>
          </div>
          <h2 className="hidden">Reviews</h2>
          <div className="reviews">
            <div className="userReview hidden">
              <h1>izorc</h1>
              <p>
                ⭐⭐⭐⭐⭐Disfuse is a very good platform to code your discord
                bots. I'm getting good customer support and it has a great
                userface. The management team actually listens to their
                customers's suggestion.
              </p>
            </div>

            <div className="reviewGroup">
              <div className="userReview hidden" style={{ width: "55%" }}>
                <h1>WhisPro</h1>
                <p>
                  Very epic! They listen to the community and update Disfuse
                  very often :D ⭐ ⭐ ⭐ ⭐ ⭐
                </p>
              </div>

              <div className="userReview hidden" style={{ width: "45%" }}>
                <h1>Aggareth</h1>
                <p>
                  ⭐️⭐️⭐️⭐️⭐️ ["Great Service","Best Support","Friendly
                  Community ","LOVE"]
                </p>
              </div>
            </div>
            <div className="userReview hidden">
              <h1>bubbel</h1>
              <p>
                Definitely ⭐️⭐️⭐️⭐️⭐️. I wouldn’t have been able to make
                this bot without it. I know it might be a bit unstable but it’s
                a new project so it makes sense for bugs! I haven’t encountered
                any myself yet so that’s good
              </p>
            </div>

            <div className="reviewGroup">
              <div className="userReview hidden" style={{ width: "45%" }}>
                <h1>reem</h1>
                <p>⭐️⭐️⭐️⭐️⭐️ It's much better than S4D</p>
              </div>
              <div className="userReview hidden" style={{ width: "55%" }}>
                <h1>schvarts11</h1>
                <p>⭐️⭐️⭐️⭐️⭐️ You are the best!!!!!!!!!!!!!</p>
              </div>
            </div>

            <div className="reviewGroup">
              <div className="userReview hidden">
                <h1>flipflop99</h1>
                <p>⭐⭐⭐⭐⭐ very good</p>
              </div>
              <div className="userReview hidden">
                <h1>ItzCherokee</h1>
                <p>⭐️⭐️⭐️⭐️⭐️ Just Great.</p>
              </div>
              <div className="userReview hidden">
                <h1>Alejo.14</h1>
                <p>⭐⭐⭐⭐⭐ cuz is cool</p>
              </div>
            </div>
            <div className="userReview hidden">
              <h1>Arci</h1>
              <p>
                Disfuse is an amazing community! The members are incredibly
                helpful and friendly, and I've received a lot of valuable
                support here. If you're into coding and looking for a welcoming
                place to learn and collaborate, I highly recommend joining
                Disfuse! ⭐ ⭐ ⭐ ⭐ ⭐
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
