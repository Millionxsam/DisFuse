import { Link, Outlet } from "react-router-dom";

export default function WorkspaceBar() {
  function showCode() {
    document.querySelector(".code-view").style.display = "flex";
  }

  function showSecrets() {
    document.querySelector(".secrets-view").showModal();
  }

  return (
    <>
      <div className="workspace-navbar">
        <div className="left">
          <div className="logo">
            <Link to="/projects">
              <img src="/media/disfuse-clear.png" alt="" />
            </Link>
          </div>
          <div className="projectName"></div>
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
            <a rel="noopener" target="_blank" href="https://dsc.gg/disfuse">
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
      <Outlet />
    </>
  );
}
