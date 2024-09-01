import { useEffect, useRef, useState } from "react";
import * as Blockly from "blockly";
import { javascriptGenerator } from "blockly/javascript";
import Swal from "sweetalert2";
import { Backpack } from "@blockly/workspace-backpack";
import { WorkspaceSearch } from "@blockly/plugin-workspace-search";
import { ZoomToFitControl } from "@blockly/zoom-to-fit";
import "@blockly/toolbox-search";
import JSZip from "jszip";
import beautify from "beautify";
import axios from "axios";

import "../functions/registerContextMenus";
import { toolbox } from "../config/toolbox";
import { DFTheme } from "../components/themes/DFTheme";
import { DarkerTheme } from "../components/themes/DarkerTheme";
import { LightTheme } from "../components/themes/LightTheme";
import { BlueBlackTheme } from "../components/themes/BlueBlackTheme";
import { CandyTheme } from "../components/themes/CandyTheme";
import exportFiles from "../config/exportFiles";
import { executeRestrictions } from "../functions/restrictions";
import { useParams } from "react-router-dom";
import autosave from "../functions/autosave";
import addTooltips from "../functions/addTooltips";
import updateCode from "../functions/updateCode";

import "../blocks/main";
import "../blocks/messages";
import "../blocks/slash";
import "../blocks/servers";
import "../blocks/games";
import "../blocks/text";
import "../blocks/channels";
import "../blocks/embeds";
import "../blocks/webhooks";
import "../blocks/database";
import "../blocks/misc";
import "../blocks/buttons";
import "../blocks/menus";
import "../blocks/members";
import "../blocks/emojis";
import "../blocks/modals";
import "../blocks/invites";
import "../blocks/comments";
import "../blocks/javascript";
import "../blocks/time";
import "../blocks/apps/scratch";
import "../blocks/events/DEPRECATED_joins";
import "../blocks/events/messages";
import "../blocks/polls";
import "../blocks/roles";
import "../blocks/contextMenus";
import "../blocks/threads";
import "../blocks/events/servers";
import "../blocks/music";
import "../blocks/files";
import "../blocks/objects";

import CodeView from "../components/CodeView";
import SecretsView from "../components/SecretsView";
import LoadingAnim from "../components/LoadingAnim";

const { apiUrl, discordUrl } = require("../config/config.json");

export default function Workspace() {
  let { projectId } = useParams();
  const hasTokenBlock = useRef(false);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(discordUrl + "/users/@me", {
        headers: {
          Authorization: localStorage.getItem("disfuse-token"),
        },
      })
      .then(({ data }) => {
        axios
          .get(apiUrl + `/users/${data.id}`, {
            headers: { Authorization: localStorage.getItem("disfuse-token") },
          })
          .then(({ data: user }) => {
            axios
              .get(apiUrl + `/projects/${projectId}`, {
                headers: {
                  Authorization: localStorage.getItem("disfuse-token"),
                },
              })
              .then(({ data: project }) => {
                toggleExport();

                let theme = user.settings.workspace.theme || "DFTheme";

                if (theme === "DFTheme") theme = DFTheme;
                else if (theme === "DarkerTheme") theme = DarkerTheme;
                else if (theme === "LightTheme") theme = LightTheme;
                else if (theme === "BlueBlackTheme") theme = BlueBlackTheme;
                else if (theme === "CandyTheme") theme = CandyTheme;

                let zelosBlock = Blockly.Themes.Zelos.blockStyles;

                theme = {
                  ...theme,
                  "blockStyles": {
                    "text_blocks": zelosBlock['math_blocks'],
                    "math_blocks": zelosBlock['text_blocks'],
                    "colour_blocks": {
                      "colourPrimary": "#ad794c",
                      "colourSecondary": "#8d5b3d",
                      "colourTertiary": "#6b3f2c"
                    },
                    "logic_blocks": Blockly.Themes.Zelos.blockStyles['logic_blocks'],
                    "loop_blocks": Blockly.Themes.Zelos.blockStyles['loop_blocks'],
                    "list_blocks": Blockly.Themes.Zelos.blockStyles['list_blocks'],
                    "procedure_blocks": Blockly.Themes.Zelos.blockStyles['procedure_blocks'],
                    "variable_blocks": Blockly.Themes.Zelos.blockStyles['variable_blocks'],
                    "variable_dynamic_blocks": Blockly.Themes.Zelos.blockStyles['variable_dynamic_blocks'],
                    "hat_blocks": Blockly.Themes.Zelos.blockStyles['hat_blocks']
                  }
                }

                console.log(Blockly.Themes.Zelos.blockStyles)

                let renderer = user.settings.workspace.renderer ?? "zelos";
                let sounds = user.settings.workspace.sounds ?? true;
                let showGrid = user.settings.workspace.grid.enabled ?? true;
                let snapToGrid = user.settings.workspace.grid.snap ?? false;
                let gridSpacing = user.settings.workspace.grid.spacing ?? 35;

                // Inject workspace
                const workspace = Blockly.inject(
                  document.getElementById("workspace"),
                  {
                    toolbox,
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

                document.querySelector(
                  ".workspace-navbar .projectName"
                ).innerHTML = project.name;

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
                ].forEach((word) => javascriptGenerator.addReservedWords(word));

                if (project.owner.id !== user.id)
                  return (window.location = "/projects");

                if (project.data) {
                  Blockly.serialization.workspaces.load(
                    JSON.parse(project.data),
                    workspace
                  );
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
                  console.log('backpack stored');
                  localStorage.setItem('dfWorkspaceBackpack', JSON.stringify(
                    backpack.getContents() || []
                  ));
                }

                backpack.onDragEnter = setBackpackStorage;
                backpack.onDragExit = setBackpackStorage;
                backpack.onDrop = setBackpackStorage;

                try {
                  backpack.setContents(
                    JSON.parse(
                      localStorage.getItem('dfWorkspaceBackpack')
                    )
                  );
                } catch (_) { }

                // Disable blocks that are not attached to anything
                workspace.addChangeListener(Blockly.Events.disableOrphans);

                setLoading(false);

                // When workspace changes
                workspace.addChangeListener((e) => {
                  setBackpackStorage();
                  autosave(workspace, projectId, e);
                  addTooltips(workspace);
                  executeRestrictions(workspace);
                  updateCode(workspace, project);

                  if (
                    workspace
                      .getAllBlocks(false)
                      .find((b) => b.type === "main_token")
                  )
                    hasTokenBlock.current = true;
                  else hasTokenBlock.current = false;

                  toggleExport();
                });

                // When workspace changes
                workspace.addChangeListener((e) => {
                  autosave(workspace, projectId, e);
                  addTooltips(workspace);
                  executeRestrictions(workspace);
                  updateCode(workspace, project);

                  if (
                    workspace
                      .getAllBlocks(false)
                      .find((b) => b.type === "main_token")
                  )
                    hasTokenBlock.current = true;
                  else hasTokenBlock.current = false;

                  toggleExport();
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
                      background:
                        theme.name === "candytheme" ||
                          theme.name === "lighttheme"
                          ? ""
                          : "#282828",
                      color:
                        theme.name === "candytheme" ||
                          theme.name === "lighttheme"
                          ? ""
                          : "white",
                      confirmButtonText: "Load",
                      input: "select",
                      inputOptions: {
                        slashCommand: "Slash Commands",
                        pingCommand: "Ping Command",
                      },
                    }).then((result) => {
                      if (!result.isConfirmed) return;

                      let data = require(`../templates/${result.value}`);

                      data.blocks.blocks = data.blocks.blocks.concat(
                        Blockly.serialization.workspaces.save(workspace)?.blocks
                          ?.blocks || []
                      );

                      Blockly.serialization.workspaces.load(data, workspace);
                    });
                  });

                // Export button event
                document
                  .querySelector("button.export")
                  .addEventListener("click", () => {
                    if (!hasTokenBlock.current) return;

                    Swal.fire({
                      title: "Export Project",
                      icon: "info",
                      confirmButtonText: "Download ZIP",
                      showCancelButton: false,
                      html: 'After exporting, make sure to extract the ZIP file and read instructions.txt if you don\'t know what to do next.\nJoin our <a style="color: blue" rel="noopener" target="_blank" href="https://dsc.gg/disfuse">Discord server</a> for help',
                    }).then((result) => {
                      if (!result.isConfirmed) return;

                      const zip = new JSZip();

                      const codeEle = document.getElementById("code");
                      const indexjs = `${codeEle.innerText}`;
                      const envFile = `${project.secrets
                        .map((s) => `${s.name}=${s.value}`)
                        .join("\n")}`;

                      exportFiles.forEach((file) => {
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
                          position: "bottom-end",
                          timer: 5000,
                          timerProgressBar: true,
                          icon: "success",
                          title: "Successfully exported",
                          showConfirmButton: false,
                        });
                      });
                    });
                  });

                // Save file event
                document.querySelector(
                  ".workspace-navbar .left #save"
                ).onclick = async () => {
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
                    position: "bottom-end",
                    timer: 5000,
                    timerProgressBar: true,
                    icon: "success",
                    title: "Successfully saved",
                    showConfirmButton: false,
                  });
                };
              })
              .catch((e) => {
                if (
                  window.location.hostname === "localhost" &&
                  String(e) ===
                  'Error: Shortcut named "startSearch" already exists.'
                ) {
                  return window.location.reload();
                } else throw new Error(e);
              });
          });

        function toggleExport() {
          const exportBtn = document.querySelector(
            ".workspace-navbar button.export"
          );

          if (!hasTokenBlock.current) {
            exportBtn.classList.add("disabled");
            exportBtn.classList.add("tooltipEle");
          } else {
            exportBtn.classList.remove("disabled");
            exportBtn.classList.remove("tooltipEle");
          }
        }
      })
      .catch((e) => {
        console.error(e);
        alert("This project does not exist");
        return (window.location = "/projects");
      });
  }, []);

  return (
    <>
      <CodeView />
      <SecretsView />
      <div className="load-container">{isLoading ? <LoadingAnim /> : ""}</div>
      <div id="workspace"></div>
    </>
  );
}
