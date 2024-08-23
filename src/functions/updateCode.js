import beautify from "beautify";
import { javascriptGenerator } from "blockly/javascript";
import Swal from "sweetalert2";

import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import '../hljs.css';

hljs.registerLanguage('javascript', javascript);

function hasToken(input) {
  return /[A-Za-z0-9_\-]{24}\.[A-Za-z0-9_\-]{6}\.[A-Za-z0-9_\-]{27}/.test(
    input
  );
}

export default function updateCode(workspace, project) {
  const allBlocks = workspace.getAllBlocks();
  const codeEle = document.getElementById("codecontent");

  const blockImports = {
    "fs_": ["fs", "path"],
    "music_": "lyrics-finder",
    "db_": "easy-json-database",
    "game_": "discord-gamecord"
  };
  let blockImportCode = "";

  const topBlocks = ["db_create"];

  let code = javascriptGenerator.workspaceToCode(workspace);

  topBlocks.forEach((topBlock) => {
    let c = allBlocks.find((b) => b.type === topBlock);
    if (!c) return;

    code = code.replace(javascriptGenerator.blockToCode(c), "");
  });

  let topBlocksCode = allBlocks
    .filter((b) => topBlocks.includes(b.type))
    .map((b) => javascriptGenerator.blockToCode(b))
    .join("\n");

  Object.keys(blockImports).forEach((importBlock) => {
    let c = allBlocks.find((b) => b.type.startsWith(importBlock));
    if (!c) return;

    function fixImport(module = '') {
      return module.replaceAll('-', '');
    }

    const importName = blockImports[importBlock];

    if (Array.isArray(importName)) {
      importName.forEach(i => {
        blockImportCode += `const ${fixImport(i)} = require("${i}");\n`;
      });
    } else {
      blockImportCode += `const ${fixImport(importName)} = require("${importName}");\n`;
    }
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

  let js = `require("dotenv").config();
    const Discord = require("discord.js");
    const process = require("process");
    ${blockImportCode}
    process.on("uncaughtException", (e) => {
      console.error(e);
    });
    
    const databases = {};
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    ${topBlocksCode !== '' ? '\n' + topBlocksCode + '\n' : ''}
    const client = new Discord.Client({ intents: 3276799 });
        
    client.setMaxListeners(0);
        
    client.on("ready", () => {
      console.log(client.user.tag + " is logged in!");
    });
        
    ${code}`;

  js = beautify(js, { format: "js" });

  workspace.jsCodeOutput = js;
  codeEle.innerHTML = hljs.highlight(js, { language: 'javascript' }).value
}
