import * as Blockly from "blockly";
import { js as beautifyJs } from "js-beautify";
import { javascriptGenerator } from "blockly/javascript";
import Swal from "sweetalert2";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import "../hljs.css";
import packageDependenciesFromBlocks from "./packageDependenciesFromBlocks";

hljs.registerLanguage("javascript", javascript);

export function updateCode(
  workspace,
  project,
  workspaceId,
  onlyWarning = false
) {
  javascriptGenerator.init(workspace);

  const workspaceCodeEle = document.querySelector(".workspace.code code");
  const projectCodeEle = document.querySelector(".project.code code");

  const tempWorkspace = getWholeProjectWorkspace(
    project,
    workspace,
    workspaceId
  );

  var projectBlocks = tempWorkspace.getAllBlocks(true);
  var workspaceCode, projectCode;

  if (!onlyWarning) projectCode = setUpCode(project, tempWorkspace, projectBlocks);

  var currentBlocks = workspace.getAllBlocks(true);
  workspaceCode = setUpCode(project, workspace, currentBlocks, onlyWarning);

  if (!onlyWarning) {
    workspaceCodeEle.innerHTML =
      hljs.highlight(workspaceCode, {
        language: "javascript",
      }).value;

    projectCodeEle.innerHTML =
      hljs.highlight(projectCode, {
        language: "javascript",
      }).value;
  }

  tempWorkspace.dispose();
}

function fixPackageName(packageName = "") {
  let validName = packageName.replace(/[-.@/]/g, "_");

  if (/^\d/.test(validName)) {
    validName = "_" + validName;
  }

  return validName;
}

function setUpCode(project, workspace, blocks, onlyWarning = false) {
  javascriptGenerator.init(workspace);

  function tokenAlertCheck() {
    if (project.private) return;

    let mainToken = blocks.find((b) => b.type === "main_token");

    if (!mainToken || window.tokenAlertPopupAppeared === true) return;

    let tokenCode = javascriptGenerator.blockToCode(mainToken);

    if (
      // eslint-disable-next-line no-useless-escape
      /[A-Za-z0-9_\-]{24}\.[A-Za-z0-9_\-]{6}\.[A-Za-z0-9_\-]{27}/.test(
        tokenCode
      )
    ) {
      Swal.fire({
        icon: "warning",
        title: "Security Warning",
        text: "It appears there's a Discord token in your project. To prevent potential security risks when your project is public, ensure to remove and securely manage any Discord tokens using secrets or other ways.",
        confirmButtonText: "Continue",
        denyButtonText: "Don't show again",
        animation: true,
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false,
        showConfirmButton: true,
        showDenyButton: true,
      }).then((alert) => {
        window.tokenAlertPopupAppeared = true;

        if (alert.isDenied) {
          localStorage.setItem("showTokenAlert", "false");
        }
      });
    }
  }

  if (onlyWarning) {
    tokenAlertCheck();
    return;
  }

  let code = javascriptGenerator.workspaceToCode(workspace);

  const blockImports = packageDependenciesFromBlocks(blocks);

  const topBlocks = ["db_create"];

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

  const blockImportCode = blockImports
    .map((value) =>
      value.code
        ? value.code
        : `const ${fixPackageName(value)} = require("${value}");`
    )
    .join("\n");

  tokenAlertCheck();

  let mobilePresenceBot = false;
  let mainTokenBlock = blocks.find((b) => b.type === "main_token");
  if (mainTokenBlock)
    mobilePresenceBot = mainTokenBlock.getField("mobile").getValue() === "TRUE";

  let js = `require("dotenv").config();
    const Discord = require("discord.js");
    let client = new Discord.Client({
      intents: 3276799
    });
    ${
      mobilePresenceBot === true
        ? '\nDiscord.DefaultWebSocketManagerOptions.identifyProperties.browser = "Discord iOS";\n'
        : ""
    }
    const databases = {};
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const process = require("process");
    process.on("uncaughtException", (e) => {
      console.error(e);
    });
    ${blockImportCode.length > 0 ? "\n" + blockImportCode : ""}
    ${topBlocksCode?.length > 0 ? "\n" + topBlocksCode : ""} 
    ${
      blockImportCode.includes("const discord_logs =")
        ? "\ndiscord_logs(client);"
        : ""
    }
    client.setMaxListeners(0);
        
    client.on("ready", async () => {
      console.log(client.user.tag + " is logged in!");
    });
        
    ${code}`;
  return beautifyJs(js, {
    indent_size: 2,
    preserve_newlines: true,
    max_preserve_newlines: 2,
  });
}

export function getWholeProjectWorkspace(
  project,
  currentWorkspace,
  workspaceId
) {
  javascriptGenerator.init(currentWorkspace);

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
