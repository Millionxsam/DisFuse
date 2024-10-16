import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as Blockly from 'blockly';

export default function WorkspaceBar({ workspace }) {
  const [active, setActive] = useState(false);

  function showCode() {
    document.querySelector('.code-view').style.display = 'flex';
  }

  function showSecrets() {
    document.querySelector('.secrets-view').showModal();
  }

  function openMenu() {
    if (!active) {
      if (document.body.clientWidth <= 396) {
        document.querySelector(
          '.workspace-navbar .content-container'
        ).style.height = '45%';
      } else {
        document.querySelector(
          '.workspace-navbar .content-container'
        ).style.height = '30vh';
      }

      setActive(true);
    } else {
      document.querySelector(
        '.workspace-navbar .content-container'
      ).style.height = '0';

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
        <div className="projectName"><p></p></div>
        <div id="workspace-tabs-open-container">
          <i
            onClick={() => openWorkspaceTabs(workspace)}
            class="workspace-tabs-open fa-solid fa-chevron-down"
          ></i>
        </div>
        <div className="content-container">
          <div className="left">
            <ul>
              <button id="save" style={{ height: '3rem' }}>
                <i class="fa-solid fa-floppy-disk"></i>
                <div>Save File</div>
              </button>
              <button id="load" style={{ height: '3rem' }}>
                <i class="fa-solid fa-upload"></i>
                <div>Load File</div>
              </button>
              <button onClick={showCode} style={{ height: '3rem' }}>
                <i class="fa-brands fa-square-js"></i>
                <div>Show Code</div>
              </button>
              <button onClick={showSecrets} style={{ height: '3rem' }}>
                <i class="fa-solid fa-key"></i>
                <div>Secrets</div>
              </button>
              <button id="templates" style={{ height: '3rem' }}>
                <i class="fa-solid fa-shapes"></i>
                <div>Templates</div>
              </button>
            </ul>
          </div>
          <div className="right">
            <ul>
              <i id="autosave-indicator"></i>
              <a rel="noreferrer" target="_blank" href="https://dsc.gg/disfuse">
                <button style={{ height: '3rem' }}>
                  <i class="fa-brands fa-discord"></i>
                </button>
              </a>
              <button className="export" style={{ height: '3rem' }}>
                <div>Export</div>
                <i class="fa-solid fa-download"></i>
              </button>
            </ul>
          </div>
        </div>
        <i onClick={openMenu} class="fa-solid fa-bars menu"></i>
      </div>
    </>
  );
}

function openWorkspaceTabs(workspace) {
  document.querySelector('.workspace-tabs').style.height = '5vh';
  document.querySelector(
    '.workspace-navbar .workspace-tabs-open'
  ).style.opacity = '0';
  document.getElementById('workspace-tabs-open-container').style.width = '0';

  setTimeout(() => {
    document.querySelector('#workspace').style.height = '87.5vh';
    Blockly.svgResize(workspace);
  }, 310);
}
