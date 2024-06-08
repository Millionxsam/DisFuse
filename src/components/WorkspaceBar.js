import { Outlet } from "react-router-dom";

export default function WorkspaceBar() {
  function showCode() {
    document.querySelector(".code-view").style.display = "flex";
  }

  return (
    <>
      <div className="workspace-navbar">
        <div className="left">
          <div className="logo">
            <img src="/media/disfuse.png" alt="" />
            <h1>DisFuse</h1>
          </div>
          <ul>
            <button id="save" style={{ height: "3rem" }}>
              Save To File
            </button>
            <button onClick={showCode} style={{ height: "3rem" }}>
              Show Code
            </button>
            <button id="test" style={{ height: "3rem" }}>
              test
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
