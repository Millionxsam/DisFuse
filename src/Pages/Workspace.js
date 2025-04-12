import { useEffect, useRef, useState } from "react";

import * as Blockly from "blockly";
import { javascriptGenerator } from "blockly/javascript";
import { Backpack } from "@blockly/workspace-backpack";
import beautify from "beautify";
import { WorkspaceSearch } from "@blockly/plugin-workspace-search";
import { ZoomToFitControl } from "@blockly/zoom-to-fit";
import "@blockly/toolbox-search";

import Swal from "sweetalert2";
import JSZip from "jszip";
import axios from "axios";
import registerContextMenus from "../functions/registerContextMenus";

import CodeView from "../components/CodeView";
import SecretsView from "../components/SecretsView";
import LoadingAnim from "../components/LoadingAnim";

import getToolbox from "../config/toolbox";
import { DFTheme } from "../components/themes/DFTheme";
import { DarkerTheme } from "../components/themes/DarkerTheme";
import { LightTheme } from "../components/themes/LightTheme";
import { BlueBlackTheme } from "../components/themes/BlueBlackTheme";
import { CandyTheme } from "../components/themes/CandyTheme";
import { executeRestrictions } from "../functions/restrictions";
import { useParams, useSearchParams } from "react-router-dom";
import autosave from "../functions/autosave";
import addTooltips from "../functions/addTooltips";
import { getWholeProjectWorkspace, updateCode } from "../functions/updateCode";
import modalThemeColor from "../functions/modalThemeColor";

import WorkspaceTabs from "../components/WorkspaceTabs";
import WorkspaceBar from "../components/WorkspaceBar";
import registerCustomBlocks from "../functions/registerCustomBlocks";
import Renderer from "../functions/render";
import getExportFiles from "../config/getExportFiles";
Blockly.blockRendering.register("custom_zelos", Renderer);

require
  .context("../blocks", true, /\.js$/)
  .keys()
  .forEach((key) => {
    key = key.replace("./", "");

    import(`../blocks/${key}`).catch(console.error);
  });

const { apiUrl, discordUrl } = require("../config/config.json");

const requiredBlocks = [
  {
    type: "main_token",
    message: "'Log in with token' in 'main' is required to connect to your bot",
  },
];

export default function Workspace() {
  let { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setLoading] = useState(true);
  const [project, setProject] = useState({});
  const [workspace, setWorkspace] = useState({});
  const [modalColors, setModalColors] = useState();
  const currentWorkspace = useRef({});

  useEffect(() => {
    axios
      .get(discordUrl + "/users/@me", {
        headers: {
          Authorization: localStorage.getItem("disfuse-token"),
        },
      })
      .then(
        ({ data }) => {
          axios
            .get(apiUrl + `/users/${data.id}`, {
              headers: { Authorization: localStorage.getItem("disfuse-token") },
            })
            .then(async ({ data: user }) => {
              const modalColors = modalThemeColor(user, false);
              setModalColors(modalColors);

              let installedBlockPacks = [];

              const responses = await Promise.all(
                user.installedBlockPacks?.map((packId) =>
                  axios.get(apiUrl + `/workshop/${packId}`, {
                    headers: {
                      Authorization: localStorage.getItem("disfuse-token"),
                    },
                  })
                )
              );

              installedBlockPacks = responses.map((response) => response.data);

              axios
                .get(apiUrl + `/projects/${projectId}`, {
                  headers: {
                    Authorization: localStorage.getItem("disfuse-token"),
                  },
                })
                .then(async ({ data: project }) => {
                  setProject(project);

                  if (localStorage.getItem("showTokenAlert") === "false") {
                    window.tokenAlertPopupAppeared = true;
                  } else {
                    window.tokenAlertPopupAppeared = project?.private ?? false;
                  }

                  window.changesUntilSave = Math.max(3, user.settings?.optimization?.changesUntilSave ?? 3);

                  let theme = user.settings?.workspace?.theme || "DFTheme";

                  if (theme === "DFTheme") theme = DFTheme;
                  else if (theme === "DarkerTheme") theme = DarkerTheme;
                  else if (theme === "LightTheme") theme = LightTheme;
                  else if (theme === "BlueBlackTheme") theme = BlueBlackTheme;
                  else if (theme === "CandyTheme") theme = CandyTheme;

                  let zelosBlock = Blockly.Themes.Zelos.blockStyles;

                  theme = {
                    ...theme,
                    blockStyles: {
                      text_blocks: zelosBlock["math_blocks"],
                      math_blocks: {
                        colourPrimary: "#cfa23a",
                        colourSecondary: "#b88e32",
                        colourTertiary: "#9b7329",
                      },
                      colour_blocks: {
                        colourPrimary: "#ad794c",
                        colourSecondary: "#8d5b3d",
                        colourTertiary: "#6b3f2c",
                      },
                      logic_blocks:
                        Blockly.Themes.Zelos.blockStyles["logic_blocks"],
                      loop_blocks:
                        Blockly.Themes.Zelos.blockStyles["loop_blocks"],
                      list_blocks:
                        Blockly.Themes.Zelos.blockStyles["list_blocks"],
                      procedure_blocks:
                        Blockly.Themes.Zelos.blockStyles["procedure_blocks"],
                      variable_blocks:
                        Blockly.Themes.Zelos.blockStyles["variable_blocks"],
                      variable_dynamic_blocks:
                        Blockly.Themes.Zelos.blockStyles[
                        "variable_dynamic_blocks"
                        ],
                      hat_blocks:
                        Blockly.Themes.Zelos.blockStyles["hat_blocks"],
                    },
                  };

                  let renderer = user.settings?.workspace.renderer ?? 'custom_zelos';
                  if (renderer === 'zelos') renderer = 'custom_zelos';
                  let sounds = user.settings?.workspace.sounds ?? true;
                  let showGrid = user.settings?.workspace.grid.enabled ?? true;
                  let snapToGrid = user.settings?.workspace.grid.snap ?? false;
                  let gridSpacing = user.settings?.workspace.grid.spacing ?? 35;

                  let toolboxBtIcons =
                    user.settings?.workspace.toolboxBtIcons ?? true;

                  if (!toolboxBtIcons) {
                    let styleEle = document.createElement("style");
                    styleEle.innerHTML = `
                    .workspace-navbar * button i:not(.fa-discord) {
                      display: none !important;
                    }
                  `;
                    document.head.appendChild(styleEle);
                  }

                  let fastRenderMode =
                    user.settings?.optimization.fastRenderMode ?? false;

                  if (fastRenderMode === true) {
                    let styleEle = document.createElement("style");
                    styleEle.innerHTML = `
                    div#workspace {
                      text-rendering: optimizeSpeed !important;
                      image-rendering: optimizeSpeed !important;
                      shape-rendering: optimizeSpeed !important;
                      font-smooth: none;
                    }
                  `;
                    document.head.appendChild(styleEle);
                  }

                  installedBlockPacks?.forEach((pack) => {
                    registerCustomBlocks(
                      pack.versions[pack.versions.length - 1]?.blocks || []
                    );
                  });

                  // Inject workspace
                  const workspace = Blockly.inject(
                    document.getElementById("workspace"),
                    {
                      toolbox: getToolbox(installedBlockPacks),
                      theme,
                      move: {
                        wheel: true,
                      },
                      renderer,
                      collapse: true,
                      comments: true,
                      disable: true,
                      maxBlocks: Infinity,
                      trashcan: true,
                      horizontalLayout: false,
                      toolboxPosition: "start",
                      css: true,
                      media: "https://blockly-demo.appspot.com/static/media/",
                      rtl: false,
                      scrollbars: true,
                      sounds: sounds,
                      oneBasedIndex: true,
                      grid: showGrid
                        ? {
                          spacing: gridSpacing,
                          length: 5,
                          colour: "#8888886e",
                          snap: snapToGrid,
                        }
                        : false,
                      zoom: {
                        controls: true,
                        wheel: true,
                        startScale: 1,
                        maxScale: 3,
                        minScale: 0.3,
                        scaleSpeed: 1.2,
                      },
                    }
                  );
                  setWorkspace(workspace);

                  Blockly.svgResize(workspace);

                  document.querySelector(
                    ".workspace-navbar .projectName p"
                  ).innerText = project.name;

                  [
                    "Discord",
                    "moment",
                    "gamecord",
                    "discordgamecord",
                    "easyjsondatabase",
                    "Database",
                    "client",
                    "databases",
                    "wait",
                    "process",
                    "emoji",
                    "channel",
                    "channels",
                    "member",
                    "members",
                    "user",
                    "users",
                    "guild",
                    "guilds",
                    "server",
                    "servers",
                    "modalSubmitInteraction",
                    "ForEachemojiInServer",
                    "interaction",
                    "int",
                    "scratchUserProfileInformation",
                    "errorButWithLengthyName",
                    "error",
                    "PollCreator",
                    "leavingMember",
                    "AddMember",
                    "AddServer",
                    "messageDeleted",
                    "messageReaction",
                    "role",
                    "roles",
                    "createdThread",
                    "lyrics",
                    "lyricsFinder",
                    "filePath",
                    "fs",
                    "readData",
                    "err",
                    "files",
                    "filterItem",
                    "localVar",
                    "newWebhook",
                    "captcha",
                    "Captcha",
                    "permsChannel",
                    "errorButWithLengthyName",
                    "variable",
                    "list",
                    "disfuse",
                    "canvas",
                    "ctx",
                  ].forEach((word) =>
                    javascriptGenerator.addReservedWords(word)
                  );

                  if (project.data?.length && !project.workspaces?.length) {
                    const subWorkspacesOnboarding = Swal.mixin({
                      progressSteps: ["1", "2", "3", "4"],
                      confirmButtonText: "Next",
                      allowEscapeKey: false,
                      allowOutsideClick: false,
                      animation: false,
                      footer:
                        "This project needs to be migrated to sub-workspaces. This won't show for new projects.",
                      ...modalColors,
                    });

                    await subWorkspacesOnboarding.fire({
                      title: "Set Up Sub-Workspaces",
                      currentProgressStep: 0,
                      text: "Sub-workspaces are here! You can now create multiple workspaces in a single project to organize your code better.",
                    });

                    await subWorkspacesOnboarding.fire({
                      title: "How it works",
                      currentProgressStep: 1,
                      text: "Use the new tab bar at the top to create a new workspace or switch between workspaces. Each workspace can contain different blocks.",
                    });

                    await subWorkspacesOnboarding.fire({
                      title: "Extra Features",
                      currentProgressStep: 2,
                      text: 'Right-click a block and click "Move to workspace" to move it to a different workspace. Right click anywhere in the view and click "Merge workspace" to merge two workspaces together.',
                    });

                    const { value: wsName } =
                      await subWorkspacesOnboarding.fire({
                        title: "Name your workspace",
                        currentProgressStep: 3,
                        text: "Enter a name for your first workspace. Your current project data will be moved to the new workspace. You can create more workspaces and move blocks to them later.",
                        input: "text",
                        inputPlaceholder: "My workspace",
                        inputValidator: (value) => {
                          if (value.length >= 3) return false;
                          else return "The name must be at least 3 characters";
                        },
                      });

                    axios
                      .post(
                        apiUrl + `/projects/${projectId}/workspaces`,
                        {
                          name: wsName,
                          data: project.data,
                        },
                        {
                          headers: {
                            Authorization:
                              localStorage.getItem("disfuse-token"),
                          },
                        }
                      )
                      .then(() => window.location.reload());

                    return;
                  } else if (!project.workspaces?.length) {
                    return Swal.fire({
                      title: "Name your first workspace",
                      text: "Create multiple workspaces to organize your blocks into separate tabs",
                      input: "text",
                      inputValidator: (value) => {
                        if (value?.length < 3)
                          return "Name needs at least 3 characters";
                      },
                      inputPlaceholder: "Initial workspace",
                      showCancelButton: false,
                      allowEscapeKey: false,
                      confirmButtonText: "Create",
                      allowOutsideClick: false,
                      ...modalColors,
                    }).then((response) => {
                      axios
                        .post(
                          apiUrl + `/projects/${projectId}/workspaces`,
                          { name: response.value },
                          {
                            headers: {
                              Authorization:
                                localStorage.getItem("disfuse-token"),
                            },
                          }
                        )
                        .then(() => window.location.reload());
                    });
                  }

                  if (
                    searchParams.get("id") &&
                    project.workspaces.find(
                      (p) => p._id === searchParams.get("id")
                    )
                  )
                    currentWorkspace.current = project.workspaces.find(
                      (p) => p._id === searchParams.get("id")
                    );
                  else {
                    setSearchParams((params) => {
                      params.set("id", project.workspaces[0]._id);
                      return params;
                    });

                    currentWorkspace.current = project.workspaces[0];
                  }

                  if (project.owner.id !== user.id)
                    return (window.location = "/projects");

                  registerContextMenus(project, currentWorkspace.current);

                  try {
                    Blockly.serialization.workspaces.load(
                      JSON.parse(currentWorkspace.current?.data || "{}"),
                      workspace
                    );
                  } catch (error) {
                    console.error(error);
                    return Swal.fire({
                      title: "Corrupt Project",
                      text: "Part of your project is corrupt and cannot be loaded. This can be because one of your installed block packs is corrupt or your project is trying to load blocks that don't exist. Please join our Discord server and create a post in the support channel to fix this issue.",
                      icon: "error",
                      footer:
                        '<a target="_blank" rel="noopener" style="color: lightblue" href="https://dsc.gg/disfuse">Join our Discord for support</a>',
                      showCancelButton: false,
                      showConfirmButton: false,
                      allowEscapeKey: false,
                      allowOutsideClick: false,
                      ...modalColors,
                    });
                  }

                  // Initiating plugins
                  const backpack = new Backpack(workspace, {
                    allowEmptyBackpackOpen: false,
                    contextMenu: {
                      copyAllToBackpack: true,
                      pasteAllToBackpack: true,
                    },
                  });
                  const workspaceSearch = new WorkspaceSearch(workspace);
                  const zoomToFit = new ZoomToFitControl(workspace);

                  backpack.init();
                  workspaceSearch.init();
                  zoomToFit.init();

                  function setBackpackStorage() {
                    localStorage.setItem(
                      "dfWorkspaceBackpack",
                      JSON.stringify(backpack.getContents() || [])
                    );
                  }

                  backpack.onDragEnter = setBackpackStorage;
                  backpack.onDragExit = setBackpackStorage;
                  backpack.onDrop = setBackpackStorage;

                  try {
                    backpack.setContents(
                      JSON.parse(localStorage.getItem("dfWorkspaceBackpack"))
                    );
                  } catch (_) { }

                  // Disable blocks that are not attached to anything
                  workspace.addChangeListener(Blockly.Events.disableOrphans);

                  setLoading(false);

                  // When workspace changes
                  let changes = 0;
                  workspace.addChangeListener(async (e) => {
                    let ignoredEvents = [
                      Blockly.Events.VIEWPORT_CHANGE,
                      Blockly.Events.SELECTED,
                      Blockly.Events.CLICK,
                      Blockly.Events.TOOLBOX_ITEM_SELECT,
                      Blockly.Events.TRASHCAN_OPEN
                    ];

                    let willSave = e.type !== Blockly.Events.BLOCK_DRAG;

                    if (ignoredEvents.includes(e.type)) return;
                    if (willSave) changes++;

                    reloadContextMenus(project, currentWorkspace.current);
                    setBackpackStorage();
                    addTooltips(workspace);
                    executeRestrictions(workspace);

                    if (willSave && changes >= (window.changesUntilSave ?? 3)) {
                      project = await autosave(
                        workspace,
                        projectId,
                        currentWorkspace.current
                      );
                      changes = 0;
                    }

                    updateCode(
                      workspace,
                      project,
                      currentWorkspace.current._id,
                      true
                    );
                  });

                  // New tab event
                  document
                    .querySelector(".workspace-tabs .newTab")
                    .addEventListener("click", () => {
                      Swal.fire({
                        title: "Create New Workspace",
                        input: "text",
                        text: "Enter a name for your workspace",
                        inputPlaceholder: "Workspace Name",
                        inputValidator: (value) => {
                          if (value.length >= 3) return false;
                          else return "Name must be at least 3 characters";
                        },
                        showCancelButton: true,
                        confirmButtonText: "Create",
                        ...modalColors,
                      }).then((result) => {
                        if (!result.isConfirmed) return;

                        axios
                          .post(
                            apiUrl + `/projects/${project._id}/workspaces`,
                            {
                              name: result.value,
                            },
                            {
                              headers: {
                                Authorization:
                                  localStorage.getItem("disfuse-token"),
                              },
                            }
                          )
                          .then(() => window.location.reload());
                      });
                    });

                  // Show code event
                  document
                    .querySelector("button#showCode")
                    .addEventListener("click", () => {
                      updateCode(
                        workspace,
                        project,
                        currentWorkspace.current._id
                      );
                      document.querySelector(".code-view").style.display =
                        "flex";
                    });

                  // Load from file event
                  document
                    .querySelector("button#load")
                    .addEventListener("click", () => {
                      const fileInput = document.createElement("input");
                      fileInput.type = "file";
                      fileInput.accept = ".df";

                      fileInput.addEventListener("change", (e) => {
                        let file = e.target.files[0];
                        if (!file) return;

                        let reader = new FileReader();

                        reader.onload = async (event) => {
                          let data = event.target.result;

                          let json;
                          try {
                            json = JSON.parse(data);
                          } catch (error) {
                            return Swal.fire("Error", String(error), "error");
                          }

                          if (!json.blocks || !json.blocks.blocks) {
                            return Swal.fire(
                              "Error",
                              "The selected file doesn't contain any blocks.",
                              "error"
                            );
                          }

                          Swal.fire({
                            title: "Load Blocks from File",
                            text: "Do you want to replace the current blocks in the workspace?",
                            showCancelButton: true,
                            showDenyButton: true,
                            cancelButtonText: "Cancel",
                            confirmButtonText: "Replace",
                            denyButtonText: "Combine",
                            icon: "question",
                            animation: true,
                            ...modalColors,
                          }).then((result) => {
                            if (result.isDismissed) return;

                            if (result.isConfirmed) {
                              Blockly.serialization.workspaces.load(
                                json,
                                workspace
                              );
                            } else {
                              json.blocks.blocks = json.blocks.blocks.concat(
                                Blockly.serialization.workspaces.save(workspace)
                                  ?.blocks?.blocks || []
                              );

                              Blockly.serialization.workspaces.load(
                                json,
                                workspace
                              );
                            }
                          });
                        };

                        reader.readAsText(file);
                      });

                      fileInput.click();
                      fileInput.remove();
                    });

                  /*AI Generate button event (UNRELEASED)
                  document
                    .querySelector("button#generate")
                    .addEventListener("click", () => {
                      Swal.fire({
                        title: "Generate Block",
                        text: "Describe your block",
                        showCancelButton: true,
                        inputPlaceholder:
                          "A block that logs something in the console",
                        cancelButtonText: "Cancel",
                        confirmButtonText: "Generate",
                        input: "text",
                        showLoaderOnConfirm: true,
                        preConfirm: async (value) => {
                          const res = (
                            await axios.post(
                              `https://ai.aerioncloud.com/v1/chat/completions`,
                              {
                                model: "gpt-4o",
                                messages: [
                                  {
                                    role: "system",
                                    content:
                                      "You are an AI assistant that provides valid JSON to create Blockly blocks to create a Discord bot in Discord.JS v14. ONLY INCLUDE THE JSON, NOTHING ELSE. DO NOT USE FORMATTING. The user will provide a description of one or more blocks to create, and you will send an array of objects to create those blocks.",
                                  },
                                  {
                                    role: "system",
                                    content: `This is an example of a block, this is how your responses SHOULD look like:
                                  [{
                                    "name": "example_block",
                                    "outputCode": "console.log(\${generator.valueToCode(block, "example_input", Order.NONE)})",
                                    "inlineInputs": null,
                                    "type": <"none", "output", "stack", "hat", or "end">,
                                    "output": <null, "String", "Boolean", "Number", or "Array">,
                                    "previousStatement": null,
                                    "nextStatement": null,
                                    "inputs": [{
                                      "type": <"value", "statement", "dummy", "endrow">,
                                      "name": "example_input",
                                      "check": <null, "String", "Boolean", "Number", or "Array">,
                                      "align": -1,
                                      "fields": [{
                                        "type": "label",
                                        "text": "This is a label"
                                      }]
                                    }],
                                    "color": "#3333ff",
                                    "description": "This is an example block"
                                  }]`,
                                  },
                                  {
                                    role: "system",
                                    content: `Here is a description of some parameters, ALWAYS follow the rules specified:
                                    name <string>: the name or id of the block.
                                    outputCode <string>: the code that will be outputed. must ALWAYS be in javascript.
                                    type <string>: must ALWAYS be one of "none", "output", "stack", "hat", or "end".
                                    output <string>: must ALWAYS be one of null, "String", "Boolean", "Number", or "Array". use null if not an output.
                                    previousStatement <null>: must ALWAYS be null.
                                    nextStatement <null>: must ALWAYS be null.
                                    color <string>: the hex color of the block.
                                    description <string>: the description of the block.
                                    inputs > type <string>: must ALWAYS be one of "value", "statement", "dummy" or "endrow". use dummy if there are no inputs (only label fields).
                                    inputs > name <string>: the name of the input. use only for value or statement input types.
                                    inputs > check <string>: must ALWAYS be one of null, "String", "Boolean", "Number", or "Array". use only for value or statement types, use null to accept any type.
                                    inputs > align <number>: must ALWAYS be -1.
                                    inputs > fields <object>: an array of Blockly fields. use an empty array if there's no fields.`,
                                  },
                                  {
                                    role: "user",
                                    content: value,
                                  },
                                ],
                              }
                            )
                          ).data;

                          console.log(res);
                          const json = JSON.parse(res.choices[0].message.content);
                          console.log(json);
                          registerCustomBlocks(json, workspace, true, true);
                          return json;
                        },
                        ...modalColors,
                      }).then((result) => {
                        if (!result.isConfirmed) return;
                      });
                    });*/

                  // Templates button event
                  document
                    .querySelector("button#templates")
                    .addEventListener("click", () => {
                      Swal.fire({
                        title: "Load Template",
                        text: "Which template would you like to load?",
                        showCancelButton: true,
                        cancelButtonText: "Cancel",
                        confirmButtonText: "Load",
                        input: "select",
                        inputOptions: {
                          slashCommand: "Slash Commands",
                          pingCommand: "Ping Command",
                          economyCommand: "Economy Commands",
                          ticketCommands: "Ticket Commands",
                          contextMenu: "Context Menu",
                        },
                        ...modalColors,
                      }).then((result) => {
                        if (!result.isConfirmed) return;

                        let data = require(`../templates/${result.value}`);

                        data.blocks.blocks = data.blocks.blocks.concat(
                          Blockly.serialization.workspaces.save(workspace)
                            ?.blocks?.blocks || []
                        );

                        Blockly.serialization.workspaces.load(data, workspace);
                      });
                    });

                  // Export button event
                  document
                    .querySelector("button.export")
                    .addEventListener("click", () => {
                      updateCode(
                        workspace,
                        project,
                        currentWorkspace.current._id
                      );

                      Swal.fire({
                        title: "Export Project",
                        icon: "info",
                        confirmButtonText: "Download ZIP",
                        input: "select",
                        inputOptions: {
                          project: "Export whole project",
                          workspace: "Export current workspace",
                        },
                        showCancelButton: false,
                        html: 'After exporting, make sure to extract the ZIP file and read instructions.txt if you don\'t know what to do next.\nJoin our <a style="color: blue" rel="noopener" target="_blank" href="https://dsc.gg/disfuse">Discord server</a> for help',
                        ...modalColors,
                      }).then(async (result) => {
                        if (!result.isConfirmed) return;

                        const zip = new JSZip();

                        const projectCode =
                          document.querySelector(
                            ".project.code code"
                          ).innerText;
                        const wsCode = document.querySelector(
                          ".workspace.code code"
                        ).innerText;

                        const fullWorkspace = getWholeProjectWorkspace(
                          project,
                          workspace,
                          currentWorkspace.current._id
                        );

                        let missingBlocks = [];
                        let warningBlocks = [];

                        let exportingWs;
                        if (result.value === "project")
                          exportingWs = fullWorkspace;
                        else exportingWs = workspace;

                        requiredBlocks.forEach((requiredBlock) => {
                          if (
                            !exportingWs
                              .getAllBlocks(false)
                              .find(
                                (block) => block.type === requiredBlock.type
                              )
                          )
                            missingBlocks.push(requiredBlock);
                        });

                        exportingWs.getAllBlocks(false).forEach((block) => {
                          if (block.data?.length)
                            warningBlocks.push({
                              message: block.data,
                              id: block.id,
                            });
                        });

                        if (missingBlocks.length || warningBlocks.length) {
                          let { isConfirmed } = await Swal.fire({
                            title: "Errors",
                            icon: "warning",
                            showCancelButton: true,
                            confirmButtonText: "Download Anyway",
                            confirmButtonColor: "#e40000",
                            html: `
                          <p>You have the following errors in your code:</p>
                          ${missingBlocks
                                .map(
                                  (block) =>
                                    `<p class="exportError">${block.message}</p>`
                                )
                                .join("")}
                          ${warningBlocks
                                .map(
                                  (block) =>
                                    `
                              <p class="exportError">
                                <span>
                                ${titleCase(
                                      exportingWs
                                        .getBlockById(block.id)
                                        .type.replaceAll("_", " ")
                                    )}
                                </span>
                              ${block.message
                                      .map((m) => `<span>${m}</span>`)
                                      .join("")}
                              </p>`
                                )
                                .join("")}
                          `,
                            ...modalColors,
                            customClass: {
                              container: "dark",
                              htmlContainer: "exportErrors",
                            },
                          });

                          if (!isConfirmed) return;
                        }

                        const indexjs =
                          result.value === "project" ? projectCode : wsCode;

                        const envFile = `${project.secrets
                          .map((s) => `${s.name}=${s.value}`)
                          .join("\n")}`;

                        const deps = [];

                        installedBlockPacks.forEach((bp) =>
                          deps.push(...(bp.dependencies || []))
                        );

                        getExportFiles(deps).forEach((file) => {
                          zip.file(file.name, file.content);
                        });

                        zip.file(
                          "index.js",
                          `${beautify(indexjs, { format: "js" })}`
                        );
                        zip.file(".env", envFile);
                        zip.file(
                          `${project.name}.df`,
                          JSON.stringify(
                            Blockly.serialization.workspaces.save(workspace)
                          )
                        );

                        zip.generateAsync({ type: "blob" }).then((content) => {
                          let url = window.URL.createObjectURL(content);
                          let anchor = document.createElement("a");
                          anchor.href = url;
                          anchor.download = `${project.name}.zip`;

                          anchor.click();

                          window.URL.revokeObjectURL(url);

                          Swal.fire({
                            toast: true,
                            position: "top-right",
                            timer: 5000,
                            timerProgressBar: true,
                            icon: "success",
                            title: "Successfully exported",
                            showConfirmButton: false,
                          });
                        });
                      });

                      // Save file event
                      document.querySelector("button#save").onclick =
                        async () => {
                          const data = JSON.stringify(
                            Blockly.serialization.workspaces.save(workspace)
                          );
                          const blob = new Blob([data], { type: "text/plain" });

                          let url = window.URL.createObjectURL(blob);
                          let anchor = document.createElement("a");
                          anchor.href = url;
                          anchor.download = `${project.name}.df`;

                          anchor.click();

                          window.URL.revokeObjectURL(url);

                          Swal.fire({
                            toast: true,
                            position: "top-right",
                            timer: 5000,
                            timerProgressBar: true,
                            icon: "success",
                            title: "Successfully saved",
                            showConfirmButton: false,
                          });
                        };

                      let projectNameDiv =
                        document.querySelector(".projectName p");

                      projectNameDiv.addEventListener("click", () => {
                        if (projectNameDiv.dataset.collapsed === "false") {
                          projectNameDiv.dataset.collapsed = "true";
                          projectNameDiv.innerText = "...";
                        } else {
                          projectNameDiv.dataset.collapsed = "false";
                          projectNameDiv.innerText = project.name;
                        }
                      });
                    });
                });
            })
            .catch((e) => {
              console.error(e);
              alert("This project does not exist");
              return (window.location = "/projects");
            });
        },
        [projectId, searchParams, setSearchParams]
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <WorkspaceBar workspace={workspace} />
      <CodeView />
      <SecretsView />

      <div className="load-container">{isLoading ? <LoadingAnim /> : ""}</div>

      <div className="invisibleWs"></div>

      <div className="workspace-container">
        <div className="right">
          <WorkspaceTabs
            currentTab={currentWorkspace.current}
            onClick={loadTab}
            project={project}
            workspace={workspace}
            modalColors={modalColors}
          />
          <div id="workspace"></div>
        </div>
      </div>
    </>
  );

  async function loadTab(index) {
    let p = (
      await axios.get(apiUrl + `/projects/${projectId}`, {
        headers: {
          Authorization: localStorage.getItem("disfuse-token"),
        },
      })
    ).data;

    currentWorkspace.current = p.workspaces[index];

    setSearchParams((params) => {
      params.set("id", p.workspaces[index]._id);
      return params;
    });

    reloadContextMenus(project, currentWorkspace.current);

    if (p.workspaces[index].data?.length)
      Blockly.serialization.workspaces.load(
        JSON.parse(p.workspaces[index].data),
        workspace
      );
    else workspace.clear();
  }

  function reloadContextMenus(project, currentWorkspace) {
    Blockly.ContextMenuRegistry.registry.unregister("copyCode");
    Blockly.ContextMenuRegistry.registry.unregister("moveBlock");
    Blockly.ContextMenuRegistry.registry.unregister("mergeWorkspace");
    registerContextMenus(project, currentWorkspace);
  }

  function titleCase(str) {
    return str.replace(
      /\w\S*/g,
      (text) => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
    );
  }
}
