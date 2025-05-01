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
              <i className="fa-solid fa-comments"></i>
              View and comment on others' public projects
            </div>
            <div className="hidden">
              <i className="fa-solid fa-star"></i>
              Like, clone, and add projects to your favorites
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
        </div>
      </div>
    </>
  );
}
