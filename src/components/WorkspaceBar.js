import { useState } from "react";
import { Link } from "react-router-dom";
import * as Blockly from "blockly";

export default function WorkspaceBar({ workspace }) {
  const [active, setActive] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  function showSecrets() {
    document.querySelector(".secrets-view").showModal();
  }

  function openMenu() {
    if (!active) {
      if (document.body.clientWidth <= 396) {
        document.querySelector(
          ".workspace-navbar .content-container"
        ).style.height = "45%";
      } else {
        document.querySelector(
          ".workspace-navbar .content-container"
        ).style.height = "30vh";
      }

      setActive(true);
    } else {
      document.querySelector(
        ".workspace-navbar .content-container"
      ).style.height = "0";

      setActive(false);
    }
  }

  function toggleDropdown() {
    setDropdownOpen(!dropdownOpen);
  }

  return (
    <>
      <div className="workspace-navbar">
        <div className="logo">
          <Link to="/projects">
            <img src="/media/disfuse-clear.png" alt="" />
          </Link>
        </div>
        <div className="projectName">
          <p></p>
        </div>
        <div id="workspace-tabs-open-container">
          <i
            onClick={() => openWorkspaceTabs(workspace)}
            className="workspace-tabs-open fa-solid fa-chevron-down"
          ></i>
        </div>
        <div className="content-container">
          <div className="left">
            <ul>
              <div className="dropdown" style={{ position: "relative" }}>
                <button
                  className="dropdown-button"
                  onClick={toggleDropdown}
                  style={{ height: "3rem" }}
                >
                  <i className="fa-solid fa-file"></i>
                  <div>File</div>
                  <i
                    className={`fa-solid fa-chevron-${dropdownOpen ? "up" : "down"
                      } noRotate`}
                  ></i>
                </button>
                <div
                  className="dropdown-content"
                  style={{
                    position: "absolute",
                    top: "calc(100% + 5px)",
                    left: "0",
                    zIndex: 1000,
                    flexDirection: "column",
                    gap: "5px",
                    display: dropdownOpen ? "flex" : "none",
                  }}
                >
                  <button
                    id="save"
                    style={{ height: "3rem" }}
                    onClick={toggleDropdown}
                  >
                    <i className="fa-solid fa-floppy-disk"></i>
                    <div>Save File</div>
                  </button>
                  <button
                    id="load"
                    style={{ height: "3rem" }}
                    onClick={toggleDropdown}
                  >
                    <i className="fa-solid fa-upload"></i>
                    <div>Load File</div>
                  </button>
                </div>
              </div>
              <button id="showCode" style={{ height: "3rem" }}>
                <i className="fa-brands fa-square-js"></i>
                <div>Show Code</div>
              </button>
              <button onClick={showSecrets} style={{ height: "3rem" }}>
                <i className="fa-solid fa-key"></i>
                <div>Secrets</div>
              </button>
              <button id="templates" style={{ height: "3rem" }}>
                <i className="fa-solid fa-shapes"></i>
                <div>Templates</div>
              </button>
            </ul>
          </div>
          <div className="right">
            <ul>
              <i className="indicator" id="blocks-indicator"></i>
              <i className="indicator" id="autosave-indicator"></i>
              <a rel="noreferrer" target="_blank" href="https://dsc.gg/disfuse">
                <button style={{ height: "3rem" }}>
                  <i className="fa-brands fa-discord"></i>
                </button>
              </a>
              <button className="export" style={{ height: "3rem" }}>
                <div>Export</div>
                <i className="fa-solid fa-download"></i>
              </button>
            </ul>
          </div>
        </div>
        <i onClick={openMenu} className="fa-solid fa-bars menu"></i>
      </div>
    </>
  );
}

function openWorkspaceTabs(workspace) {
  document.querySelector(".workspace-tabs").style.height = "5vh";
  document.querySelector(
    ".workspace-navbar .workspace-tabs-open"
  ).style.opacity = "0";

  Blockly.svgResize(workspace);

  setTimeout(() => {
    document.getElementById("workspace-tabs-open-container").style.width = "0";
    document.querySelector("#workspace").style.height = "87.5vh";

    Blockly.svgResize(workspace);

    setTimeout(() => {
      Blockly.svgResize(workspace);
    }, 310);
  }, 310);
}
