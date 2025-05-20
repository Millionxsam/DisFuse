import { useEffect, useRef, useState } from "react";

import * as Blockly from "blockly";
import javascript, { javascriptGenerator } from "blockly/javascript";
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
import { userCache } from "../cache.ts";
import InviteModal from "../components/InviteModal.js";
import { io } from "socket.io-client";
Blockly.blockRendering.register("custom_zelos", Renderer);

require
  .context("../blocks", true, /\.js$/)
  .keys()
  .forEach((key) => {
    key = key.replace("./", "");

    import(`../blocks/${key}`).catch(console.error);
  });

const { apiUrl, discordUrl } = require("../config/config.js");

const requiredBlocks = [
  {
    type: "main_token",
    message: "'Log in with token' in 'main' is required to connect to your bot",
  },
];

console.warn = function (...args) {
  if (
    typeof args[0] === "string" &&
    args[0].includes("CodeGenerator init was not called before blockToCode")
  ) {
    return;
  }
  console.warn.apply(console, args);
};

export default function Workspace() {
  let { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setLoading] = useState(true);
  const [project, setProject] = useState({});
  const [workspace, setWorkspace] = useState({});
  const [modalColors, setModalColors] = useState();
  const [activeUsers, setActiveUsers] = useState([]);
  const currentWorkspace = useRef({});

  useEffect(() => {
    const socket = io(apiUrl, {
      auth: { token: localStorage.getItem("disfuse-token") },
    });

    socket.on("connect", () =>
      console.log(`Connected to WebSocket with ID: ${socket.id}`)
    );

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

              socket.on('disconnect', (reason) => {
                console.log('Disconnected from socket, reason:', reason);
              });
              socket.emit(
                "projectJoin",
                { projectId },
                async (project, activeUsers) => {
                  if (project?.error || activeUsers?.error) {
                    socket.disconnect();

                    let error = project?.error || activeUsers?.error;
                    if (error === "You have already joined this project") {
                      return Swal.fire({
                        title: "Already in Project",
                        icon: "info",
                        text: "You're already part of this project from another tab or device.",
                        confirmButtonText: "OK",
                        ...modalThemeColor(userCache?.user),
                      }).then(() => {
                        window.location.replace("/projects");
                      });
                    }
                  }

                  setProject(project);
                  setActiveUsers(activeUsers);

                  if (project?.suspension?.status) {
                    return Swal.fire({
                      title: "Project Suspended",
                      icon: "error",
                      html: `This project was detected to be violating our terms of service. Please join our Discord server if you think this is a mistake.
                      <br />
                      <br />
                      Reason: ${project.status?.reason || "None"}
                      `,
                      showConfirmButton: true,
                      footer: `<a href="https://dsc.gg/disfuse" target="_blank" rel="noopener">Join our Discord for support</a>`,
                      allowEscapeKey: false,
                      allowOutsideClick: false,
                      ...modalThemeColor(userCache.user),
                    }).then(() => {
                      window.location.replace("/projects");
                    });
                  }

                  socket.on("projectJoin", ({ user }) => {
                    setActiveUsers([...activeUsers, user]);
                    activeUsers = [...activeUsers, user];
                  });

                  socket.on("projectLeave", ({ user }) => {
                    setActiveUsers(activeUsers.filter((u) => u.id !== user.id));
                    activeUsers = activeUsers.filter((u) => u.id !== user.id);
                  });

                  if (localStorage.getItem("showTokenAlert") === "false") {
                    window.tokenAlertPopupAppeared = true;
                  } else {
                    window.tokenAlertPopupAppeared = project?.private ?? false;
                  }

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

                  let renderer =
                    user.settings?.workspace.renderer ?? "custom_zelos";
                  if (renderer === "zelos") renderer = "custom_zelos";
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

                  const customBlocks = [];

                  const owner = (
                    await axios.get(apiUrl + `/users/${project.owner?.id}`, {
                      headers: {
                        Authorization: localStorage.getItem("disfuse-token"),
                      },
                    })
                  ).data;

                  customBlocks.push(...(owner.customBlocks || []));

                  for (let id of project.collaborators) {
                    const collaborator = (
                      await axios.get(apiUrl + `/users/${id}`, {
                        headers: {
                          Authorization: localStorage.getItem("disfuse-token"),
                        },
                      })
                    ).data;

                    customBlocks.push(...(collaborator.customBlocks || []));
                  }

                  if (customBlocks.length) {
                    Blockly.defineBlocksWithJsonArray(
                      customBlocks.map((b) => b.definition)
                    );

                    customBlocks.forEach((customBlock) => {
                      // eslint-disable-next-line no-new-func
                      const genCode = new Function(
                        "javascript",
                        customBlock.javascriptGenerator
                      );

                      genCode(javascript);
                    });
                  }

                  // Inject workspace
                  const workspace = Blockly.inject(
                    document.getElementById("workspace"),
                    {
                      toolbox: getToolbox(installedBlockPacks, user),
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

                  if (project?.suspension?.status) {
                    return Swal.fire({
                      title: "Project Suspended",
                      icon: "error",
                      html: `This project was detected to be violating our terms of service. Please join our Discord server if you think this is a mistake.
                      <br />
                      <br />
                      Reason: ${project.status?.reason || "None"}
                      `,
                      showConfirmButton: true,
                      footer: `<a href="https://dsc.gg/disfuse" target="_blank" rel="noopener">Join our Discord for support</a>`,
                      allowEscapeKey: false,
                      allowOutsideClick: false,
                      ...modalThemeColor(userCache.user),
                    }).then(() => {
                      window.location.replace("/projects");
                    });
                  }

                  [
                    "Discord",
                    "moment",
                    "gamecord",
                    "discord_gamecord",
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
                    "messageSent",
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

                  if (
                    project.owner?.id !== user.id &&
                    !(project.collaborators || []).includes(user.id)
                  )
                    return (window.location = "/projects");

                  if (project.owner?.id !== user.id) {
                    document
                      .querySelector("button.invite")
                      .classList.add("disabled");
                    document
                      .querySelector("button.secrets")
                      .classList.add("disabled");
                  }

                  registerContextMenus(project, currentWorkspace.current);

                  Blockly.Events.disable();

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
                  } finally {
                    Blockly.Events.enable();
                    updateCode(
                      workspace,
                      project,
                      currentWorkspace.current._id
                    );
                  }

                  let userLabels = new Map();

                  socket.on("projectUpdate", ({ workspaceId, event }) => {
                    if (currentWorkspace.current._id === workspaceId) {
                      Blockly.Events.disable();

                      try {
                        Blockly.Events.fromJson(event, workspace).run(true);
                      } catch {
                      } finally {
                        Blockly.Events.enable();
                        handleUserLabels();
                      }
                    }
                  });

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
                  } catch (_) {}

                  // Disable blocks that are not attached to anything
                  workspace.addChangeListener(Blockly.Events.disableOrphans);

                  setLoading(false);

                  const handleUserLabels = () => {
                    document
                      .querySelectorAll(".userLabel")
                      .forEach((e) => e.remove());

                    userLabels.forEach((blockId, userId) => {
                      const block = workspace
                        .getAllBlocks()
                        .find((b) => b.id === blockId);

                      if (!block) return;

                      const blockEle = document.querySelector(
                        `g[data-id="${block.id}"]`
                      );

                      const ele = document.createElement("h4");

                      const user = activeUsers.find((u) => u.id === userId);

                      const avatar = document.createElement("img");

                      avatar.src = activeUsers.find(
                        (u) => u.id === userId
                      ).avatar;
                      ele.appendChild(avatar);

                      ele.innerHTML = `<img src="${user?.avatar}" /> ${
                        user?.displayName ?? "someone"
                      } is editing`;

                      var rect = blockEle.getBoundingClientRect();

                      ele.classList.add("userLabel");
                      ele.style.top = `${rect.top.toFixed(0) - 40}px`;
                      ele.style.left = `${rect.left.toFixed(0)}px`;
                      document.body.appendChild(ele);
                    });
                  };

                  socket.on("blockSelect", ({ user, blockId }) => {
                    userLabels.set(user.id, blockId);
                    handleUserLabels();
                    workspace.removeChangeListener(handleUserLabels);
                    workspace.addChangeListener(handleUserLabels);
                  });

                  workspace.addChangeListener(() => {
                    const blocksIndicator = document.querySelector(
                      ".workspace-navbar #blocks-indicator"
                    );

                    if (blocksIndicator)
                      blocksIndicator.innerHTML = `<i class="fa-solid fa-cube"></i><div>
  ${workspace.getAllBlocks().length ?? "??"} blocks
  </div>`;
                  });

                  workspace.addChangeListener(async (e) => {
                    if (e.type === Blockly.Events.SELECTED) {
                      socket.emit("blockSelect", { blockId: e.newElementId });
                    }
                  });

                  workspace.addChangeListener(async (e) => {
                    let ignoredEvents = [
                      Blockly.Events.VIEWPORT_CHANGE,
                      Blockly.Events.SELECTED,
                      Blockly.Events.CLICK,
                      Blockly.Events.TOOLBOX_ITEM_SELECT,
                      Blockly.Events.TRASHCAN_OPEN,
                      Blockly.Events.FINISHED_LOADING,
                      Blockly.Events.BLOCK_DRAG,
                    ];

                    if (ignoredEvents.includes(e.type)) return;

                    javascriptGenerator.init(workspace);

                    reloadContextMenus(project, currentWorkspace.current);
                    setBackpackStorage();
                    addTooltips(workspace);
                    executeRestrictions(workspace);

                    project = await autosave(
                      workspace,
                      projectId,
                      currentWorkspace.current,
                      socket,
                      e.toJson()
                    ).catch((e) => {
                      console.error(e);

                      document.querySelector(
                        ".workspace-navbar #autosave-indicator"
                      ).innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i><div>Error</div>`;

                      Swal.fire({
                        ...modalColors,
                        title: "Autosave Error",
                        icon: "error",
                        text: e,
                      });
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

                        const exportingWsBlocks =
                          exportingWs.getAllBlocks(false);

                        exportingWsBlocks.forEach((block) => {
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

                        getExportFiles(deps, exportingWsBlocks).forEach(
                          (file) => {
                            zip.file(file.name, file.content);
                          }
                        );

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
                          const blob = new Blob([data], {
                            type: "text/plain",
                          });

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
                }
              );
            })
            .catch((e) => {
              console.error(e);
              alert("This project does not exist");
              return (window.location = "/projects");
            });
        },
        [projectId, searchParams, setSearchParams]
      );

    return () => {
      socket.disconnect();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <WorkspaceBar
        project={project}
        workspace={workspace}
        activeUsers={activeUsers}
        currentWorkspace={currentWorkspace.current}
      />
      <CodeView />
      <SecretsView project={project} />
      <InviteModal project={project} onSave={(p) => setProject(p)} />

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
            editable={project?.owner?.id === userCache.user?.id}
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

    Blockly.Events.disable();

    try {
      if (p.workspaces[index].data?.length)
        Blockly.serialization.workspaces.load(
          JSON.parse(p.workspaces[index].data),
          workspace
        );
      else workspace.clear();
    } finally {
      Blockly.Events.enable();
    }
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
