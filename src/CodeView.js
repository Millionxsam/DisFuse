import { useEffect } from "react";

export default function CodeView() {
  return (
    <div className="code-view">
      <div className="top">
        <h1>JavaScript Code</h1>
        <button id="close" onClick={closeCode}>
          Close
        </button>
        <button id="copy" onClick={copyCode}>
          Copy
        </button>
        <i style={{ display: "none" }} className="fa-solid fa-check check"></i>
      </div>
      <p id="code"></p>
    </div>
  );
}

function closeCode() {
  document.querySelector(".code-view").style.display = "none";
}

function copyCode() {
  navigator.clipboard.writeText(
    document.querySelector(".code-view #code").innerText
  );

  document.querySelector(".code-view .top .check").style.display = "block";

  setTimeout(() => {
    document.querySelector(".code-view .top .check").style.display = "none";
  }, 3000);
}
