import { useEffect, useRef, useState } from "react";

import * as Blockly from "blockly";
import javascript, { javascriptGenerator } from "blockly/javascript";
import { Backpack } from "@blockly/workspace-backpack";
import { js as beautifyJs } from "js-beautify";

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
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import autosave from "../functions/autosave";
import addTooltips from "../functions/addTooltips";
import { getWholeProjectWorkspace, updateCode } from "../functions/updateCode";
import modalThemeColor from "../functions/modalThemeColor";

import WorkspaceTabs from "../components/WorkspaceTabs";
import WorkspaceBar from "../components/WorkspaceBar";
import registerCustomBlocks from "../functions/registerCustomBlocks";
import getExportFiles from "../config/getExportFiles";
import { userCache } from "../cache.ts";
import InviteModal from "../components/InviteModal.jsx";
import { io } from "socket.io-client";

require
  .context("../blocks", true, /\.js$/)
  .keys()
  .forEach((key) => {
    key = key.replace("./", "");

    import(`../blocks/${key}`).catch(console.error);
  });

const { apiUrl, discordUrl } = require("../config/config.js");

const originalWarn = console.warn;

console.warn = function (...args) {
  if (
    typeof args[0] === "string" &&
    args[0].includes("CodeGenerator init was not called before blockToCode")
  ) {
    return;
  }

  originalWarn(...args);
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

  const navigate = useNavigate();

  useEffect(() => {
    const socket = io(apiUrl, {
      auth: { token: localStorage.getItem("disfuse-token") },
    });

    socket.on("connect", () =>
      console.log(`Connected to WebSocket with ID: ${socket.id}`),
    );

    socket.on("disconnect", (reason) => {
      console.log("Disconnected from socket, reason:", reason);
    });

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
                  }),
                ),
              );

              installedBlockPacks = responses.map((response) => response.data);

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
                    } else console.error(error);
                  }

                  setProject(project);
                  setActiveUsers(activeUsers);

                  if (!project.botToken?.length)
                    Swal.fire({
                      title: "Project Setup Incomplete",
                      icon: "warning",
                      text:
                        project.owner.id === user.id
                          ? "We've made changes to the project creation process. You now have to enter your bot token in project settings before creating a project. In order to use this project, you must enter your bot token in the project settings."
                          : "We've made changes to the project creation process. You now have to enter your bot token in project settings before creating a project. In order to use this project, ask the owner to enter the bot token in the project settings.",
                      confirmButtonText:
                        project.owner.id === user.id
                          ? "Edit project"
                          : "Back to Dashboard",
                      allowEscapeKey: false,
                      allowOutsideClick: false,
                      showCancelButton: false,
                      ...modalThemeColor(userCache.user),
                    }).then(() =>
                      navigate(
                        project.owner.id === user.id
                          ? `/@${project.owner.username}/${project._id}/edit`
                          : "/projects",
                      ),
                    );
                  else {
                    axios
                      .get(discordUrl + "/users/@me", {
                        headers: { Authorization: "Bot " + project.botToken },
                      })
                      .then(() => {
                        console.log("Valid token");
                      })
                      .catch(() => {
                        Swal.fire({
                          title: "Invalid Bot Token",
                          icon: "warning",
                          allowEscapeKey: false,
                          allowOutsideClick: false,
                          text:
                            project.owner.id === user.id
                              ? "Your bot token is no longer valid; it may have been reset in the Discord Developer Portal. To use your project, you must update your bot token."
                              : "The bot token on this project is no longer valid; it may have been reset in the Discord Developer Portal. To use this project, ask the owner to update their bot token by editing the project.",
                          confirmButtonText:
                            project.owner.id === user.id
                              ? "Edit Project"
                              : "Back to Dashboard",
                          showCancelButton: false,
                          ...modalThemeColor(userCache.user),
                        }).then(() =>
                          navigate(
                            project.owner.id === user.id
                              ? `/@${project.owner.username}/${project._id}/edit`
                              : "/projects",
                          ),
                        );
                      });
                  }

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
                      footer: `<a href="https://discord.gg/Xwx4zkQcmJ" target="_blank" rel="noopener">Join our Discord for support</a>`,
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
                      regexp_blocks: {
                        colourPrimary: "#4fde62",
                        colourSecondary: "#3cd75a",
                        colourTertiary: "#2eb242",
                      },
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
                      logic_blocks: zelosBlock["logic_blocks"],
                      loop_blocks: zelosBlock["loop_blocks"],
                      list_blocks: zelosBlock["list_blocks"],
                      procedure_blocks: zelosBlock["procedure_blocks"],
                      variable_blocks: zelosBlock["variable_blocks"],
                      variable_dynamic_blocks:
                        zelosBlock["variable_dynamic_blocks"],
                      hat_blocks: zelosBlock["hat_blocks"],
                    },
                  };

                  let renderer = user.settings?.workspace.renderer ?? "zelos";
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
                      font-smooth: none !important;
                    }
                  `;
                    document.head.appendChild(styleEle);
                  }

                  const changesUntilSave =
                    activeUsers?.length > 0
                      ? 1
                      : Math.max(
                          2,
                          user.settings?.optimization?.changesUntilSave ?? 3,
                        );

                  installedBlockPacks?.forEach((pack) => {
                    registerCustomBlocks(
                      pack.versions[pack.versions.length - 1]?.blocks || [],
                    );
                  });

                  const customBlocks = [...(project.owner.customBlocks || [])];

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
                      customBlocks.map((b) => b.definition),
                    );

                    customBlocks.forEach((customBlock) => {
                      try {
                        // eslint-disable-next-line no-new-func
                        const genCode = new Function(
                          "javascript",
                          customBlock.javascriptGenerator,
                        );

                        genCode(javascript);
                      } catch {}
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
                    },
                  );
                  setWorkspace(workspace);

                  Blockly.svgResize(workspace);

                  document.querySelector(
                    ".workspace-navbar .projectName p",
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
                      footer: `<a href="https://discord.gg/Xwx4zkQcmJ" target="_blank" rel="noopener">Join our Discord for support</a>`,
                      allowEscapeKey: false,
                      allowOutsideClick: false,
                      ...modalThemeColor(userCache.user),
                    }).then(() => {
                      window.location.replace("/projects");
                    });
                  }

                  javascriptGenerator.addReservedWords(
                    "Discord,moment,gamecord,discord_gamecord,easyjsondatabase,Database,client,databases,wait,process,emoji,channel,channels,member,members,user,users,guild,guilds,server,servers,modalSubmitInteraction,ForEachemojiInServer,interaction,int,scratchUserProfileInformation,errorButWithLengthyName,error,PollCreator,leavingMember,AddMember,AddServer,messageDeleted,messageReaction,messageSent,role,roles,createdThread,lyrics,lyricsFinder,filePath,fs,readData,err,files,filterItem,localVar,newWebhook,captcha,Captcha,permsChannel,variable,list,disfuse,canvas,ctx,config,dotenv,lyrics_finder,@ddededodediamante/captcha-generator,axios,_napi_rs_canvas,response,_ddededodediamante_captcha_generator",
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
                        },
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
                          },
                        )
                        .then(() => window.location.reload());
                    });
                  }

                  if (
                    searchParams.get("id") &&
                    project.workspaces.find(
                      (p) => p._id === searchParams.get("id"),
                    )
                  )
                    currentWorkspace.current = project.workspaces.find(
                      (p) => p._id === searchParams.get("id"),
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
                      workspace,
                    );
                  } catch (error) {
                    console.error(error);
                    return Swal.fire({
                      title: "Corrupt Project",
                      text: "Part of your project is corrupt and cannot be loaded. This can be because one of your installed block packs is corrupt or your project is trying to load blocks that don't exist. Please join our Discord server and create a post in the support channel to fix this issue.",
                      icon: "error",
                      footer:
                        '<a target="_blank" rel="noopener" style="color: lightblue" href="https://discord.gg/Xwx4zkQcmJ">Join our Discord for support</a>',
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
                      currentWorkspace.current._id,
                    );

                    workspace
                      .getAllBlocks(false)
                      .filter((b) => b.type === "main_token")
                      .forEach((block) => block.dispose(false, false));
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
                      JSON.stringify(backpack.getContents() || []),
                    );
                  }

                  backpack.onDragEnter = setBackpackStorage;
                  backpack.onDragExit = setBackpackStorage;
                  backpack.onDrop = setBackpackStorage;

                  try {
                    backpack.setContents(
                      JSON.parse(localStorage.getItem("dfWorkspaceBackpack")),
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
                        `g[data-id="${block.id}"]`,
                      );

                      const ele = document.createElement("h4");

                      const user = activeUsers.find((u) => u.id === userId);

                      const avatar = document.createElement("img");

                      avatar.src = activeUsers.find(
                        (u) => u.id === userId,
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
                      ".workspace-navbar #blocks-indicator",
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

                  let updates = 0;

                  workspace.addChangeListener(async (e) => {
                    let ignoredEvents = [
                      Blockly.Events.VIEWPORT_CHANGE,
                      Blockly.Events.SELECTED,
                      Blockly.Events.CLICK,
                      Blockly.Events.TOOLBOX_ITEM_SELECT,
                      Blockly.Events.TRASHCAN_OPEN,
                      Blockly.Events.FINISHED_LOADING,
                      Blockly.Events.BLOCK_DRAG,
                      Blockly.Events.BLOCK_MOVE,
                      Blockly.Events.BLOCK_FIELD_INTERMEDIATE_CHANGE,
                      Blockly.Events.UI,
                      "backpack_change",
                    ];

                    if (ignoredEvents.includes(e.type)) return;

                    updates++;

                    reloadContextMenus(project, currentWorkspace.current);
                    setBackpackStorage();
                    addTooltips(workspace);
                    executeRestrictions(workspace);

                    if (updates < changesUntilSave) return;
                    updates = 0;

                    project = await autosave(
                      workspace,
                      projectId,
                      currentWorkspace.current,
                      socket,
                      e.toJson(),
                      user.settings?.workspace.toolboxAutosaveLabel ?? true,
                    ).catch((e) => {
                      console.error("Autosave error:", e);

                      document.querySelector(
                        ".workspace-navbar #autosave-indicator",
                      ).innerHTML =
                        `<i class="fa-solid fa-triangle-exclamation"></i><div>Error</div>`;

                      Swal.fire({
                        ...modalColors,
                        title: "Autosave Error",
                        icon: "error",
                        text: e,
                        showConfirmButton: true,
                        confirmButtonText: "Reload",
                      }).then((value) => {
                        if (value.isConfirmed) window.location.reload();
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
                        currentWorkspace.current._id,
                      );
                      document.querySelector(".code-view").style.display =
                        "flex";
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
                            ?.blocks?.blocks || [],
                        );

                        Blockly.serialization.workspaces.load(data, workspace);
                      });
                    });

                  // document.querySelector("button.host").addEventListener("click", () => {
                  //   updateCode(workspace, project, currentWorkspace.current._id);

                  //   if (localStorage.getItem("hostingOnboardingComplete") !== "true") {
                  //     Swal.fire({
                  //       ...modalColors,
                  //       title: "Introducing DisFuse hosting!",
                  //       icon: "info",
                  //       footer:
                  //         'By hosting your bot on DisFuse, you agree to our new <a target="_blank" rel="noopener" href="/tos">terms of service</a> for hosting',
                  //       text: "You can run your bot on DisFuse to test features before deploying it to your own hosting service. The bot will go offline when you close this page, so this is not meant to be a permanent host.",
                  //     }).then(() => {
                  //       localStorage.setItem("hostingOnboardingComplete", "true");
                  //       document.querySelector(".hostModal").showModal();
                  //     });
                  //   } else document.querySelector(".hostModal").showModal();
                  // });

                  // Export button event
                  document
                    .querySelector("button.export")
                    .addEventListener("click", () => {
                      updateCode(
                        workspace,
                        project,
                        currentWorkspace.current._id,
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
                        html: 'After exporting, make sure to extract the ZIP file and read instructions.txt if you don\'t know what to do next.\nJoin our <a style="color: blue" rel="noopener" target="_blank" href="https://discord.gg/Xwx4zkQcmJ">Discord server</a> for help',
                        ...modalColors,
                      }).then(async (result) => {
                        if (!result.isConfirmed) return;

                        const zip = new JSZip();

                        const projectCode =
                          document.querySelector(
                            ".project.code code",
                          ).innerText;
                        const wsCode = document.querySelector(
                          ".workspace.code code",
                        ).innerText;

                        const fullWorkspace = getWholeProjectWorkspace(
                          project,
                          workspace,
                          currentWorkspace.current._id,
                        );

                        let warningBlocks = [];

                        let exportingWs;
                        if (result.value === "project")
                          exportingWs = fullWorkspace;
                        else exportingWs = workspace;

                        const exportingWsBlocks =
                          exportingWs.getAllBlocks(false);

                        exportingWsBlocks.forEach((block) => {
                          if (block.data?.length)
                            warningBlocks.push({
                              message: block.data,
                              id: block.id,
                            });
                        });

                        if (warningBlocks.length) {
                          let { isConfirmed } = await Swal.fire({
                            title: "Errors",
                            icon: "warning",
                            showCancelButton: true,
                            confirmButtonText: "Download Anyway",
                            confirmButtonColor: "#e40000",
                            html: `
                          <p>You have the following errors in your code:</p>
                          ${warningBlocks
                            .map(
                              (block) =>
                                `
                              <p class="exportError">
                                <span>
                                ${titleCase(
                                  exportingWs
                                    .getBlockById(block.id)
                                    .type.replaceAll("_", " "),
                                )}
                                </span>
                              ${block.message.map((m) => `<span>${m}</span>`).join("")}
                              </p>`,
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

                        const envFile = `DISFUSE_SECURE_BOT_TOKEN=${project?.botToken || "invalid_token"}\n${project.secrets
                          .map((s) => `${s.name}=${s.value}`)
                          .join("\n")}`;

                        const deps = [];

                        installedBlockPacks.forEach((bp) =>
                          deps.push(...(bp.dependencies || [])),
                        );

                        getExportFiles(deps, exportingWsBlocks).forEach(
                          (file) => {
                            zip.file(file.name, file.content);
                          },
                        );

                        zip.file(
                          "index.js",
                          `${beautifyJs(indexjs, {
                            indent_size: 2,
                            preserve_newlines: true,
                            max_preserve_newlines: 2,
                          })}`,
                        );
                        zip.file(".env", envFile);
                        zip.file(
                          `${project.name}.df`,
                          JSON.stringify(
                            Blockly.serialization.workspaces.save(workspace),
                          ),
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
                            ...modalThemeColor(userCache.user),
                          });
                        });
                      });
                    });

                  if (localStorage.getItem("isNew") !== "true") {
                    Swal.fire({
                      title: "New to DisFuse?",
                      html: `
                      <p>Welcome! Here are some useful links to help you use DisFuse:</p>
                      <a href="https://docs.disfuse.xyz" target="_blank">📘 DisFuse Documentation</a><br>
                      <a href="https://www.youtube.com/watch?v=OOrapVifGoE" target="_blank">▶️ DisFuse's YouTube Channel</a><br>
                      <a href="https://discord.gg/Xwx4zkQcmJ" target="_blank">💬 Join the Discord Server</a>`,
                      ...modalColors,
                    }).then(() => {
                      localStorage.setItem("isNew", "true");
                    });
                  }
                },
              );
            })
            .catch((e) => {
              console.error(e);
              Swal.fire({
                ...modalColors,
                title: "Project Error",
                text: "There was an error while loading this project!",
                icon: "error",
              });
            });
        },
        [projectId, searchParams, setSearchParams],
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
            setProject={setProject}
            workspace={workspace}
            setWorkspace={() => {
              currentWorkspace.current = project.workspaces[0];
            }}
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
          workspace,
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
      (text) => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase(),
    );
  }
}
