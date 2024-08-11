import beautify from "beautify";
import { javascriptGenerator } from "blockly/javascript";
import Swal from "sweetalert2";

function hasToken(input) {
  return /[A-Za-z0-9_\-]{24}\.[A-Za-z0-9_\-]{6}\.[A-Za-z0-9_\-]{27}/.test(
    input
  );
}

export default function updateCode(workspace, project) {
  const codeEle = document.getElementById("code");

  const topBlocks = ["db_create"];

  let code = javascriptGenerator.workspaceToCode(workspace);

  topBlocks.forEach((topBlock) => {
    let c = workspace.getAllBlocks().find((b) => b.type === topBlock);
    if (!c) return;

    code = code.replace(javascriptGenerator.blockToCode(c), "");
  });

  if (hasToken(code) && !workspace.tokenAlertPopupAppeared) {
    Swal.fire({
      icon: "warning",
      title: "Warning",
      text: "It appears there's a Discord token in your project. To prevent potential security risks when your project is public, ensure to remove and securely manage any Discord tokens using secrets or other ways.",
      confirmButtonText: "Continue",
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
      showConfirmButton: true,
    });

    workspace.tokenAlertPopupAppeared = true;
  }

  let js = `
    require("dotenv").config();
    const Discord = require("discord.js");
    const moment = require("moment");
    const gamecord = require("discord-gamecord");
    const Database = require("easy-json-database");
    const process = require("process");
    
    process.on("uncaughtException", (e) => {
        console.error(e);
    });
    
    const databases = {};
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    ${workspace
      .getAllBlocks()
      .filter((b) => topBlocks.includes(b.type))
      .map((b) => javascriptGenerator.blockToCode(b))
      .join("\n")}
        
        const client = new Discord.Client({ intents: 3276799 });
        
        client.setMaxListeners(0);
        
        client.on("ready", () => {
          console.log(client.user.username + " is logged in");
        });
        
        ${code}
        `;

  js = beautify(js, { format: "js" });

  codeEle.innerText = js;
}
