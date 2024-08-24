import { useState } from "react";
import { Link, Outlet } from "react-router-dom";

export default function WorkspaceBar() {
  const [active, setActive] = useState(false);

  function showCode() {
    document.querySelector(".code-view").style.display = "flex";
  }

  function showSecrets() {
    document.querySelector(".secrets-view").showModal();
  }

  function openMenu() {
    if (!active) {
      document.querySelector(
        ".workspace-navbar .content-container"
      ).style.height = "55%";
      setActive(true);
    } else {
      document.querySelector(
        ".workspace-navbar .content-container"
      ).style.height = "0";
      setActive(false);
    }
  }

  return (
    <>
      <div className="workspace-navbar">
        <div className="logo">
          <Link to="/projects">
            <img src="/media/disfuse-clear.png" alt="" />
          </Link>
        </div>
        <div className="projectName"></div>
        <div className="content-container">
          <div className="left">
            <ul>
              <button id="save" style={{ height: "3rem" }}>
                <i class="fa-solid fa-floppy-disk"></i>
                <div>Save to File</div>
              </button>
              <button onClick={showCode} style={{ height: "3rem" }}>
                <i class="fa-brands fa-square-js"></i>
                <div>Show Code</div>
              </button>
              <button onClick={showSecrets} style={{ height: "3rem" }}>
                <i class="fa-solid fa-key"></i>
                <div>Secrets</div>
              </button>
              <button id="templates" style={{ height: "3rem" }}>
                <i class="fa-solid fa-shapes"></i>
                <div>Templates</div>
              </button>
            </ul>
          </div>
          <div className="right">
            <ul>
              <i id="autosave-indicator"></i>
              <a rel="noreferrer" target="_blank" href="https://dsc.gg/disfuse">
                <button style={{ height: "3rem" }}>
                  <i class="fa-brands fa-discord"></i>
                </button>
              </a>
              <button className="export" style={{ height: "3rem" }}>
                <div>Export</div>
                <i class="fa-solid fa-download"></i>
              </button>
            </ul>
          </div>
        </div>
        <i onClick={openMenu} class="fa-solid fa-bars menu"></i>
      </div>
      <Outlet />
    </>
  );
}
