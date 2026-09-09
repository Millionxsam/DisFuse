import * as Blockly from "blockly";
import { javascriptGenerator } from "blockly/javascript";
import Swal from "sweetalert2";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import "../hljs.css";
import packageDependenciesFromBlocks from "./packageDependenciesFromBlocks";
import { utilFunctions } from "../blocks/lib/generatorUtils.js";
import { dashboardHelpers } from "../blocks/dashboard";
import insightsCode from "./insightsCode";
import { format } from "./pretty";
import { parseDfWorkspaceData } from "./dfFile";

hljs.registerLanguage("javascript", javascript);

export async function updateCode(workspace, project, workspaceId, onlyWarning = false) {
  javascriptGenerator.init(workspace);

  const workspaceCodeEle = document.querySelector(".workspace.code code");
  const projectCodeEle = document.querySelector(".project.code code");

  const tempWorkspace = getWholeProjectWorkspace(project, workspace, workspaceId);

  try {
    if (!onlyWarning) {
      const projectCode = await setUpCode(
        project,
        tempWorkspace,
        tempWorkspace.getAllBlocks(true),
      );
      const workspaceCode = await setUpCode(
        project,
        workspace,
        workspace.getAllBlocks(true),
      );

      /* Guarded because this also runs on the project-loading path,
         where the code view may not be mounted yet — an unguarded
         `.innerHTML` there threw and stopped the project opening. */
      if (workspaceCodeEle)
        workspaceCodeEle.innerHTML = hljs.highlight(workspaceCode, {
          language: "javascript",
        }).value;

      if (projectCodeEle)
        projectCodeEle.innerHTML = hljs.highlight(projectCode, {
          language: "javascript",
        }).value;

      return;
    }

    await setUpCode(project, workspace, workspace.getAllBlocks(true), true);
  } finally {
    /* An injected workspace holds on to DOM and listeners until it is
       disposed of. It used to leak whenever anything above threw. */
    tempWorkspace.dispose();
  }
}

function fixPackageName(packageName = "") {
  let validName = packageName.replace(/[-.@/]/g, "_");

  if (/^\d/.test(validName)) {
    validName = "_" + validName;
  }

  return validName;
}

async function setUpCode(project, workspace, blocks, onlyWarning = false) {
  javascriptGenerator.init(workspace);

  function tokenAlertCheck() {
    if (project.private) return;

    let mainToken = blocks.find(b => b.type === "main_token");

    if (!mainToken || window.tokenAlertPopupAppeared === true) return;

    let tokenCode = javascriptGenerator.blockToCode(mainToken);

    if (
      // eslint-disable-next-line no-useless-escape
      /[A-Za-z0-9_\-]{24}\.[A-Za-z0-9_\-]{6}\.[A-Za-z0-9_\-]{27}/.test(tokenCode)
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
      }).then(alert => {
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

  topBlocks.forEach(topBlock => {
    let existingBlocks = blocks.filter(b => b.type === topBlock);
    if (!existingBlocks?.length) return;

    existingBlocks.forEach(block => {
      code = code.replace(javascriptGenerator.blockToCode(block), "");
    });
  });

  let topBlocksCode = blocks
    .filter(b => topBlocks.includes(b.type))
    .map(b => javascriptGenerator.blockToCode(b))
    .join("\n");

  const blockImportCode = blockImports
    .map(value =>
      value.code ? value.code : `const ${fixPackageName(value)} = require("${value}");`,
    )
    .join("\n");

  tokenAlertCheck();

  /* The dashboard helper is only emitted when the project actually uses
     Dashboard blocks, so existing projects generate byte-identical code. */
  const usesDashboard = blocks.some(b => b.type?.startsWith("dashboard_"));

  /* Insights, on the other hand, is emitted for every project whatever
     its blocks are: it is how a bot reports its own usage back to
     DisFuse, not something the user builds. See ./insightsCode.js. */
  const insights = insightsCode(project);

  let mobilePresenceBot = false;
  let mainTokenBlock = blocks.find(b => b.type === "main_token");
  if (mainTokenBlock)
    mobilePresenceBot = mainTokenBlock.getField("mobile").getValue() === "TRUE";

  let js = `require("dotenv").config();
    const Discord = require("discord.js");
    let client = new Discord.Client({
      intents: Object.values(Discord.GatewayIntentBits)
    });
    ${
      mobilePresenceBot === true
        ? '\nDiscord.DefaultWebSocketManagerOptions.identifyProperties.browser = "Discord iOS";\n'
        : ""
    }
    const process = require("process");
    process.on("uncaughtException", (e) => {
      console.error(e);
    });

    const databases = {};

    ${utilFunctions}
    ${usesDashboard ? "\n" + dashboardHelpers : ""}
    ${insights.length > 0 ? "\n" + insights : ""}
    ${blockImportCode.length > 0 ? "\n" + blockImportCode : ""}
    ${topBlocksCode?.length > 0 ? "\n" + topBlocksCode : ""}
    
    client.setMaxListeners(0);
        
    client.on("clientReady", async () => {
      console.log(client.user.tag + " is logged in!");
    });
        
    ${code}
    
    client.login(process.env.DISFUSE_SECURE_BOT_TOKEN);
    `;
  return await format(js);
}

/**
 * A throwaway workspace holding the blocks of a whole set of workspaces.
 *
 * `getWholeProjectWorkspace` above does this for the project as it is on
 * screen — the live workspace plus its siblings' saved data. This one
 * works from saved data alone, which is what exporting a version the
 * user isn't currently editing needs.
 *
 * Dispose of the result when you're done with it.
 */
export function buildWorkspaceFromData(workspaces = []) {
  const tempWorkspace = Blockly.inject(document.querySelector(".invisibleWs"));

  const combined = { blocks: { blocks: [] }, variables: [] };
  const seenVariables = new Set();

  workspaces.forEach(ws => {
    if (!ws?.data?.length) return;

    let parsed;
    try {
      parsed = JSON.parse(ws.data);
    } catch {
      return;
    }

    combined.blocks.blocks.push(...(parsed.blocks?.blocks || []));

    /* Variables travel with the blocks that use them; without them a
       merged workspace can't be loaded back. */
    (parsed.variables || []).forEach(variable => {
      if (seenVariables.has(variable.id)) return;
      seenVariables.add(variable.id);
      combined.variables.push(variable);
    });
  });

  if (!combined.variables.length) delete combined.variables;

  Blockly.serialization.workspaces.load(combined, tempWorkspace);

  return tempWorkspace;
}

/**
 * The bot's index.js for one workspace, exactly as the export and the
 * code view build it. Used when exporting a version other than the one
 * on screen, where there is no rendered code to read.
 */
export async function generateWorkspaceCode(project, workspace) {
  return await setUpCode(project, workspace, workspace.getAllBlocks(true));
}

export function getWholeProjectWorkspace(project, currentWorkspace, workspaceId) {
  javascriptGenerator.init(currentWorkspace);

  const tempWorkspace = Blockly.inject(document.querySelector(".invisibleWs"));
  const tempData = Blockly.serialization.workspaces.save(currentWorkspace);

  if (!tempData.blocks?.blocks) tempData.blocks = { blocks: [] };
  if (!tempData.variables) tempData.variables = [];

  (project?.workspaces ?? [])
    .filter(ws => String(ws._id) !== String(workspaceId))
    .forEach(ws => {
      /* Parsed defensively: a single corrupt sibling workspace used to
         throw here and take down code generation and export for the
         whole project. */
      const data = parseDfWorkspaceData(ws.data);
      if (!data?.blocks?.blocks?.length) return;

      tempData.blocks.blocks.push(...data.blocks.blocks);

      // Blocks point at their variables by id, so the variables of every
      // workspace have to come along too. Without them Blockly makes up a new
      // name for each one and the exported code loses the original names
      mergeVariables(tempData.variables, data.variables);
    });

  Blockly.serialization.workspaces.load(tempData, tempWorkspace);

  return tempWorkspace;
}

/**
 * Adds the variables of another workspace to the ones already merged. Blockly
 * refuses to load two variables that share a name, so variables that clash with
 * one from another workspace are numbered instead. Their ids stay the same, so
 * the blocks using them still work.
 */
function mergeVariables(variables, otherVariables = []) {
  otherVariables.forEach(variable => {
    if (!variable?.id) return;
    if (variables.some(v => v.id === variable.id)) return;

    const taken = name =>
      variables.some(
        v =>
          (v.type || "") === (variable.type || "") &&
          `${v.name}`.toLowerCase() === `${name}`.toLowerCase(),
      );

    let name = variable.name;

    for (let i = 2; taken(name); i++) name = `${variable.name}${i}`;

    variables.push({ ...variable, name });
  });
}
