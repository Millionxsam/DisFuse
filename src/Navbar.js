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
            <li id="save">Save</li>
            <li id="load">Load</li>
            <li onClick={showCode}>Show JavaScript Code</li>
          </ul>
        </div>
        <div className="right">
          <ul>
            <li>
              <input placeholder="Project Name" id="projectName" type="text" />
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
