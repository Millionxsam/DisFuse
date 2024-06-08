import beautify from "beautify";
import { javascriptGenerator } from "blockly/javascript";

export default function updateCode(workspace) {
  const codeEle = document.getElementById("code");

  const topBlocks = ["db_create"];

  let code = javascriptGenerator.workspaceToCode(workspace);

  topBlocks.forEach((topBlock) => {
    let c = workspace.getAllBlocks().find((b) => b.type === topBlock);
    if (!c) return;

    code = code.replace(javascriptGenerator.blockToCode(c), "");
  });

  let js = `
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
