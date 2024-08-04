import axios from "axios";
import { useEffect, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import Swal from "sweetalert2";

const { discordUrl } = require("../../config/config.json");

export default function Sidebar() {
  const [active, setActive] = useState(false);
  const [user, setUser] = useState({});

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
      .then(({ data }) => setUser(data));
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
              {/* <Link
                onClick={() => setActive(false)}
                className="underline-effect"
                to="/notifications"
              >
                <li>
                  <i class="fa-solid fa-bell"></i> <div>Notifications</div>
                </li>
              </Link> */}
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
            <div className="nametag">
              <img
                src={`https://cdn.discordapp.com/avatars/${user?.id}/${user?.avatar}.webp?size=32`}
                alt=""
              />
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

function logout() {
  localStorage.removeItem("disfuse-token");

  Swal.fire({
    toast: true,
    icon: "success",
    text: "Successfully logged out",
    timer: 3000,
    timerProgressBar: true,
    position: "top-right",
    showConfirmButton: false,
  });

  setTimeout(() => {
    window.location = "/";
  }, 3000);
}
