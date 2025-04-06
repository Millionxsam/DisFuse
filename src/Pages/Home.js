import axios from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
const { apiUrl } = require("../config/config.json");

export default function Home() {
  const [users, setUsers] = useState(Number);
  const [projects, setProjects] = useState(Number);

  useEffect(() => {
    axios.get(apiUrl + "/stats").then(({ data }) => {
      setUsers(data.users);
      setProjects(data.projects);

      const usersEle = document.querySelectorAll(
        ".home-container .stats div"
      )[0];
      const projectsEle = document.querySelectorAll(
        ".home-container .stats div"
      )[1];

      const animationMs = 2000;

      let i = 0;

      let intervalId = setInterval(() => {
        usersEle.innerHTML = i + " Users";
        i++;
        if (i === data.users) clearInterval(intervalId);
      }, animationMs / data.users);

      let y = 0;

      let intervalId2 = setInterval(() => {
        projectsEle.innerHTML = y + " Projects";
        y++;
        if (y === data.projects) clearInterval(intervalId2);
      }, animationMs / data.projects);
    });
  }, []);

  return (
    <>
      <div className="home-container">
        <div className="head">
          <div className="logo">
            <img src="/media/disfuse.png" alt="" />
          </div>
          <h1>DisFuse</h1>
          <div className="stats hidden">
            <div>{users} Users</div>
            <div>{projects} Projects</div>
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
              <i className="fa-solid fa-cubes"></i>Built-in and user-made templates
            </div>
            <div className="hidden">
              <i className="fa-brands fa-square-js"></i>Advanced Discord features
            </div>
            <div className="hidden">
              <i className="fa-solid fa-desktop"></i>Easy-to-use and organized
              environment
            </div>
            <div className="hidden">
              <i className="fa-solid fa-gears"></i>Workspace settings
            </div>
            <div className="hidden">
              <i className="fa-solid fa-shapes"></i>Custom blocks (coming soon)
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
