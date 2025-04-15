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
                <button className="dropdown-button" onClick={toggleDropdown}>
                  <i className="fa-solid fa-file"></i>
                  <div>File</div>
                  <i
                    className={`fa-solid fa-chevron-${
                      dropdownOpen ? "up" : "down"
                    } noRotate`}
                  ></i>
                </button>
                <div
                  className="dropdown-content"
                  style={{
                    position: "absolute",
                    top: "calc(100% + 5px)",
                    zIndex: 1000,
                    flexDirection: "column",
                    alignContent: "center",
                    alignItems: "center",
                    justifyItems: "center",
                    justifyContent: "center",
                    gap: "5px",
                    display: dropdownOpen ? "flex" : "none",
                  }}
                >
                  <button id="save" onClick={toggleDropdown}>
                    <i className="fa-solid fa-floppy-disk"></i>
                    Save File
                  </button>
                  <button id="load" onClick={toggleDropdown}>
                    <i className="fa-solid fa-upload"></i>
                    Load File
                  </button>
                </div>
              </div>
              <button id="showCode">
                <i className="fa-brands fa-square-js"></i>
                <div>Show Code</div>
              </button>
              <button onClick={showSecrets}>
                <i className="fa-solid fa-key"></i>
                <div>Secrets</div>
              </button>
              <button id="templates">
                <i className="fa-solid fa-shapes"></i>
                <div>Templates</div>
              </button>
              {/* <button id="blockBuddy">
                <i className="fa-solid fa-robot"></i>
                <div>BlockBuddy</div>
              </button> */}
            </ul>
          </div>
          <div className="right">
            <ul>
              <i className="indicator" id="blocks-indicator"></i>
              <i className="indicator" id="autosave-indicator">
                Autosave
              </i>
              <button className="export">
                <div>Export</div>
                <i className="fa-solid fa-download"></i>
              </button>
              <a rel="noreferrer" target="_blank" href="https://dsc.gg/disfuse">
                <button>
                  <i className="fa-brands fa-discord"></i>
                </button>
              </a>
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
