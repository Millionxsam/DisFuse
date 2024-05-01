export default function Navbar() {
  function showCode() {
    document.querySelector(".code-view").style.display = "flex";
  }

  return (
    <>
      <div className="navbar">
        <div className="left">
          <div className="logo">
            <img src="/media/disfuse.png" alt="" />
            <h1>DisFuse</h1>
          </div>
          <ul>
            <li className="button" id="save">
              Save
            </li>
            <li className="button" id="load">
              Load
            </li>
            <li className="button" id="recover">
              Recover
            </li>
            <li className="button" onClick={showCode}>
              Show JavaScript Code
            </li>
          </ul>
        </div>
        <div className="right">
          <ul>
            <a
              className="button"
              rel="noopener"
              target="_blank"
              href="https://dsc.gg/disfuse"
            >
              <i class="fa-brands fa-discord"></i>
            </a>
            <li className="button export">
              <div>Export</div>
              <i class="fa-solid fa-download"></i>
            </li>
            <li>
              <input placeholder="Project Name" id="projectName" type="text" />
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
