import * as Blockly from "blockly";
import beautify from "beautify";
import { javascriptGenerator } from "blockly/javascript";
import Swal from "sweetalert2";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import "../hljs.css";

hljs.registerLanguage("javascript", javascript);

export function updateCode(
  workspace,
  project,
  workspaceId,
  onlyWarning = false
) {
  const workspaceCodeEle = document.querySelector(".workspace.code code");
  const projectCodeEle = document.querySelector(".project.code code");
  const blocksIndicator = document.querySelector(
    ".workspace-navbar #blocks-indicator"
  );

  const tempWorkspace = getWholeProjectWorkspace(
    project,
    workspace,
    workspaceId
  );

  var projectBlocks = tempWorkspace.getAllBlocks(true);
  var workspaceCode, projectCode;

  if (blocksIndicator) blocksIndicator.innerHTML = `<i class="fa-solid fa-cube"></i><div>
  ${projectBlocks?.length ?? '??'}
  </div>`

  if (!onlyWarning) {
    projectCode = setUpCode(project, tempWorkspace, projectBlocks);
  }

  var currentBlocks = workspace.getAllBlocks(true);
  workspaceCode = setUpCode(project, workspace, currentBlocks, onlyWarning);

  if (!onlyWarning) {
    workspaceCodeEle.innerHTML = hljs.highlight(workspaceCode, {
      language: "javascript",
    }).value;

    projectCodeEle.innerHTML = hljs.highlight(projectCode, {
      language: "javascript",
    }).value;
  }

  tempWorkspace.dispose();
}

function setUpCode(project, workspace, blocks, onlyWarning = false) {
  function tokenAlertCheck() {
    if (project.private) return;

    let mainToken = blocks.find((b) => b.type === "main_token");

    if (!mainToken || window.tokenAlertPopupAppeared === true) return;

    let tokenCode = javascriptGenerator.blockToCode(mainToken);

    if (
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

  const blockImports = {
    fs_: ["fs", "path"],
    music_: "lyrics-finder",
    db_: "easy-json-database",
    game_: "discord-gamecord",
    events_: { type: "code", value: 'require("discord-logs")(client);\n' },
    captcha_: {
      type: "code",
      value: 'const Captcha = require("@haileybot/captcha-generator")',
    },
    fetch_: "axios",
    time_: "ms"
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

    if (Array.isArray(importName)) {
      importName.forEach((i) => {
        blockImportCode += `const ${fixImport(i)} = require("${i}");\n`;
      });
    } else if (typeof importName === "object") {
      if (importName["type"] === "code") blockImportCode += importName["value"];
    } else {
      blockImportCode += `const ${fixImport(
        importName
      )} = require("${importName}");\n`;
    }
  });

  tokenAlertCheck();

  let mobilePresenceBot = false;
  let mainTokenBlock = blocks.find((b) => b.type === "main_token");
  if (mainTokenBlock) {
    mobilePresenceBot = mainTokenBlock.getField("mobile").getValue() === "TRUE";
  }

  let js = `require("dotenv").config();
    const Discord = require("discord.js");
    const client = new Discord.Client({
      intents: 3276799
    });
    ${mobilePresenceBot
      ? '\nDiscord.DefaultWebSocketManagerOptions.identifyProperties.browser = "Discord iOS";\n'
      : ""
    }
    const databases = {};
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const process = require("process");
    process.on("uncaughtException", (e) => {
      console.error(e);
    });
    ${blockImportCode !== "" ? "\n" + blockImportCode : ""} ${topBlocksCode !== "" ? "\n" + topBlocksCode + "\n" : ""
    }
    client.setMaxListeners(0);
        
    client.on("ready", async () => {
      console.log(client.user.tag + " is logged in!");
    });
        
    ${code}`;

  return beautify(js, { format: "js" });
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
