import * as Blockly from "blockly";
import beautify from "beautify";
import { javascriptGenerator } from "blockly/javascript";
import Swal from "sweetalert2";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import "../hljs.css";

hljs.registerLanguage("javascript", javascript);

export function updateCode(workspace, project, workspaceId) {
  const workspaceCodeEle = document.querySelector(".workspace.code code");
  const projectCodeEle = document.querySelector(".project.code code");

  const tempWorkspace = getWholeProjectWorkspace(
    project,
    workspace,
    workspaceId
  );

  const currentBlocks = workspace.getAllBlocks(true);
  const projectBlocks = tempWorkspace.getAllBlocks(true);

  let workspaceCode = setUpCode(workspace, currentBlocks);
  let projectCode = setUpCode(tempWorkspace, projectBlocks);

  workspaceCodeEle.innerHTML = hljs.highlight(workspaceCode, {
    language: "javascript",
  }).value;

  projectCodeEle.innerHTML = hljs.highlight(projectCode, {
    language: "javascript",
  }).value;

  tempWorkspace.dispose();
}

function setUpCode(workspace, blocks) {
  const blockImports = {
    fs_: ["fs", "path"],
    music_: "lyrics-finder",
    db_: "easy-json-database",
    game_: "discord-gamecord",
    events_: { type: "code", value: 'require("discord-logs")(client);\n' },
  };

  let blockImportCode = "";

  const topBlocks = ["db_create"];

  let code = javascriptGenerator.workspaceToCode(workspace);

  topBlocks.forEach((topBlock) => {
    let existingBlocks = blocks.filter((b) => b.type === topBlock);
    if (!existingBlocks?.length) return;

    existingBlocks.forEach((block) => {
      code = code.replace(javascriptGenerator.blockToCode(block), "");
    });
  });

  let topBlocksCode = blocks
    .filter((b) => topBlocks.includes(b.type))
    .map((b) => javascriptGenerator.blockToCode(b))
    .join("\n");

  Object.keys(blockImports).forEach((importBlock) => {
    let c = blocks.find((b) => b.type.startsWith(importBlock));
    if (!c) return;

    function fixImport(module = "") {
      return module.replaceAll("-", "");
    }

    const importName = blockImports[importBlock];

    if (typeof importName === "object") {
      if (importName["type"] === "code") blockImportCode += importName["value"];
    } else if (Array.isArray(importName)) {
      importName.forEach((i) => {
        blockImportCode += `const ${fixImport(i)} = require("${i}");\n`;
      });
    } else {
      blockImportCode += `const ${fixImport(
        importName
      )} = require("${importName}");\n`;
    }
  });

  if (hasToken(code) && !workspace.tokenAlertPopupAppeared) {
    Swal.fire({
      icon: "warning",
      title: "Warning",
      text: "It appears there's a Discord token in your project. To prevent potential security risks when your project is public, ensure to remove and securely manage any Discord tokens using secrets or other ways.\nThe token has been removed from your project.",
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
    const client = new Discord.Client({ intents: 3276799 });
    const databases = {};
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const process = require("process");
    process.on("uncaughtException", (e) => {
      console.error(e);
    });
    ${blockImportCode !== "" ? "\n" + blockImportCode : ""} ${
    topBlocksCode !== "" ? "\n" + topBlocksCode + "\n" : ""
  }
    client.setMaxListeners(0);
        
    client.on("ready", () => {
      console.log(client.user.tag + " is logged in!");
    });
        
    ${code}`;

  return beautify(js, { format: "js" });
}

function hasToken(input) {
  return /[A-Za-z0-9_\-]{24}\.[A-Za-z0-9_\-]{6}\.[A-Za-z0-9_\-]{27}/.test(
    input
  );
}

export function getWholeProjectWorkspace(
  project,
  currentWorkspace,
  workspaceId
) {
  const tempWorkspace = Blockly.inject(document.querySelector(".invisibleWs"));

  const tempData = Blockly.serialization.workspaces.save(currentWorkspace);

  project.workspaces
    .filter((ws) => ws._id !== workspaceId)
    .forEach((ws) => {
      if (!ws.data?.length) return;
      if (!JSON.parse(ws.data)?.blocks?.blocks) return;
      if (!tempData.blocks?.blocks) tempData.blocks = { blocks: [] };

      tempData.blocks.blocks =
        tempData.blocks.blocks.concat(...JSON.parse(ws.data).blocks.blocks) ||
        tempData.blocks.blocks;
    });

  Blockly.serialization.workspaces.load(tempData, tempWorkspace);

  return tempWorkspace;
}
