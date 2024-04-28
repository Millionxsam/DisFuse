import { useEffect } from "react";

export default function CodeView() {
  useEffect(() => {
    document.getElementById(
      "code"
    ).innerText = `const Discord = require("discord.js");
    const moment = require("moment");
    const gamecord = require("discord-gamecord");
    const client = new Discord.Client({ intents: 3276799 });
    
    client.setMaxListeners(0);
    
    client.on("ready", () => {
      console.log(client.user.username + " is logged in");
    });
    `;
  }, []);

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
