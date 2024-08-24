import axios from "axios";
import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const { discordUrl, apiUrl } = require("../../config/config.json");

export default function Sidebar() {
  const [active, setActive] = useState(false);
  const [user, setUser] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    if (!active)
      document.querySelector(".sidebar-container").classList.remove("active");
    else document.querySelector(".sidebar-container").classList.add("active");
  }, [active]);

  useEffect(() => {
    axios
      .get(discordUrl + "/users/@me", {
        headers: {
          Authorization: localStorage.getItem("disfuse-token"),
        },
      })
      .then(({ data }) => {
        axios.get(apiUrl + "/users").then(({ data: users }) => {
          let user = users.find((u) => u.id === data.id);
          setUser(user);
        });
      });
  }, []);

  return (
    <>
      <div className="dashboard-container">
        <div onClick={() => setActive(true)} className="hamburger">
          <i class="fa-solid fa-bars"></i>
          <div>DisFuse</div>
        </div>
        <div className="sidebar-container">
          <div className="top">
            <i
              style={{ fontSize: "2rem" }}
              onClick={() => setActive(false)}
              class="fa-solid fa-xmark close-sidebar"
            ></i>
            <Link to="/">
              <div className="logo">
                <img src="/media/disfuse.png" alt="" />
                <div>DisFuse</div>
              </div>
            </Link>
            <ul>
              <Link
                onClick={() => setActive(false)}
                className="underline-effect"
                to="/projects"
              >
                <li>
                  <i class="fa-solid fa-cubes"></i>
                  <div>Projects</div>
                </li>
              </Link>
              <Link
                onClick={() => setActive(false)}
                className="underline-effect"
                to="/explore"
              >
                <li>
                  <i class="fa-solid fa-earth-americas"></i> <div>Explore</div>
                </li>
              </Link>
              <Link
                onClick={() => setActive(false)}
                className="underline-effect"
                to="/favorites"
              >
                <li>
                  <i class="fa-solid fa-star"></i> <div>Favorites</div>
                </li>
              </Link>
              <Link
                onClick={() => setActive(false)}
                className="underline-effect"
                to="/inbox"
              >
                <li>
                  <i class="fa-solid fa-inbox"></i> <div>Inbox</div>
                  {user.inbox?.filter((i) => !i.read).length ? (
                    <span>{user.inbox?.filter((i) => !i.read).length}</span>
                  ) : (
                    ""
                  )}
                </li>
              </Link>
              <Link
                onClick={() => setActive(false)}
                className="underline-effect"
                to="/settings"
              >
                <li>
                  <i class="fa-solid fa-gear"></i> <div>Settings</div>
                </li>
              </Link>
            </ul>
          </div>
          <div className="bottom">
            <div
              className="nametag"
              onClick={() => navigate(`/@${user.username}`)}
            >
              <img src={user.avatar} alt="" />
              <div>{user.username}</div>
              <i
                onClick={logout}
                class="fa-solid fa-arrow-right-from-bracket"
              ></i>
            </div>
          </div>
        </div>
        <Outlet />
      </div>
    </>
  );
}

function logout(e) {
  e.stopPropagation();
  localStorage.removeItem("disfuse-token");
  window.location = "/";
}
