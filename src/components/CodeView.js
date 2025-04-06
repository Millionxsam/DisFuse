import { useEffect, useState } from "react";

export default function CodeView() {
  const [activeCode, setActiveCode] = useState("workspace");

  useEffect(() => {
    if (activeCode === "workspace") {
      document
        .querySelector(".code-view-tabs #currentWorkspace")
        .classList.add("active");
      document
        .querySelector(".code-view-tabs #fullProject")
        .classList.remove("active");

      document.querySelector(".workspace.code").style.display = "block";
      document.querySelector(".project.code").style.display = "none";
    } else if (activeCode === "project") {
      document
        .querySelector(".code-view-tabs #currentWorkspace")
        .classList.remove("active");
      document
        .querySelector(".code-view-tabs #fullProject")
        .classList.add("active");

      document.querySelector(".workspace.code").style.display = "none";
      document.querySelector(".project.code").style.display = "block";
    }
  }, [activeCode]);

  return (
    <div className="code-view">
      <div className="top">
        <h1>JavaScript Code</h1>
        <button id="close" onClick={closeCode}>
          Close
        </button>
        <button id="copy" onClick={() => copyCode(activeCode)}>
          Copy
        </button>
        <i style={{ display: "none" }} className="fa-solid fa-check check"></i>
      </div>
      <div className="code-view-tabs">
        <div id="currentWorkspace" onClick={() => setActiveCode("workspace")}>
          Current Workspace
        </div>
        <div id="fullProject" onClick={() => setActiveCode("project")}>
          Whole Project
        </div>
      </div>
      <pre className="workspace code">
        <code id="codecontent">No blocks are in the workspace</code>
      </pre>
      <pre className="project code">
        <code id="codecontent">No blocks are in the workspace</code>
      </pre>
    </div>
  );
}

function closeCode() {
  document.querySelector(".code-view").style.display = "none";
}

function copyCode(activeCode) {
  navigator.clipboard.writeText(
    document.querySelector(`.${activeCode}.code #codecontent`).innerText
  );

  document.querySelector(".code-view .top .check").style.display = "block";

  setTimeout(() => {
    document.querySelector(".code-view .top .check").style.display = "none";
  }, 3000);
}
