import { useEffect, useRef } from "react";
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
import { DFTheme } from "../components/DFTheme";
import exportFiles from "../config/exportFiles";
import { executeRestrictions } from "../functions/restrictions";
import CodeView from "../components/CodeView";
import { useParams } from "react-router-dom";
import autosave from "../functions/autosave";
import addTooltips from "../functions/addTooltips";
import updateCode from "../functions/updateCode";

import "../blocks/main";
import "../blocks/messages";
import "../blocks/slash";
import "../blocks/servers";
import "../blocks/games";
import "../blocks/events/joins";
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

const { apiUrl, discordUrl } = require("../config/config.json");

export default function Workspace() {
  let { projectId } = useParams();

  const hasTokenBlock = useRef(false);

  useEffect(() => {
    toggleExport();

    // Inject workspace
    const workspace = Blockly.inject(document.getElementById("workspace"), {
      toolbox,
      theme: DFTheme,
      move: {
        wheel: true,
      },
      renderer: "zelos",
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
      sounds: true,
      oneBasedIndex: true,
      grid: {
        spacing: 35,
        length: 5,
        colour: "#8888886e",
        snap: false,
      },
      zoom: {
        controls: true,
        wheel: true,
        startScale: 1,
        maxScale: 3,
        minScale: 0.3,
        scaleSpeed: 1.2,
      },
    });

    [
      "Discord",
      "moment",
      "gamecord",
      "Database",
      "client",
      "databases",
      "wait",
      "process",
      "emoji",
      "channel",
      "member",
      "user",
      "guild",
      "modalSubmitInteraction",
      "ForEachemojiInServer",
    ].forEach((word) => javascriptGenerator.addReservedWords(word));

    axios
      .get(discordUrl + "/users/@me", {
        headers: {
          Authorization: localStorage.getItem("disfuse-token"),
        },
      })
      .then(({ data: user }) => {
        axios
          .get(apiUrl + `/projects/${projectId}`)
          .then(({ data: project }) => {
            if (project.owner.id !== user.id)
              return (window.location = "/dashboard/projects");

            if (project.data) {
              Blockly.serialization.workspaces.load(
                JSON.parse(project.data),
                workspace
              );
            }
          })
          .catch((e) => {
            console.error(e);
            alert("This project does not exist");
            return (window.location = "/dashboard/projects");
          });
      });

    // Initiating plugins
    const backpack = new Backpack(workspace, {
      allowEmptyBackpackOpen: false,
      contextMenu: {
        copyAllToBackpack: true,
        pasteAllToBackpack: true,
      },
    });
    backpack.init();

    const workspaceSearch = new WorkspaceSearch(workspace);
    workspaceSearch.init();

    const zoomToFit = new ZoomToFitControl(workspace);
    zoomToFit.init();

    // Disable orphans
    workspace.addChangeListener(Blockly.Events.disableOrphans);

    // When workspace changes
    workspace.addChangeListener((e) => {
      autosave(workspace, projectId, e);
      addTooltips(workspace);
      executeRestrictions(workspace);
      updateCode(workspace);

      if (workspace.getAllBlocks(false).find((b) => b.type === "main_token"))
        hasTokenBlock.current = true;
      else hasTokenBlock.current = false;

      toggleExport();
    });

    // Export event
    document.querySelector("button.export").addEventListener("click", () => {
      if (!hasTokenBlock.current) return;

      Swal.fire({
        title: "Export Project",
        icon: "info",
        confirmButtonText: "Download",
        showCancelButton: false,
        html: 'After exporting, make sure to extract the ZIP file and read instructions.txt if you don\'t know what to do next.\nJoin our <a style="color: blue" rel="noopener" target="_blank" href="https://dsc.gg/disfuse">Discord server</a> for help',
      }).then((result) => {
        if (!result.isConfirmed) return;

        const zip = new JSZip();
        const projectName =
          document.getElementById("projectName").value || "DisFuse Project";

        const codeEle = document.getElementById("code");
        const indexjs = `${codeEle.innerText}`;

        exportFiles.forEach((file) => {
          zip.file(file.name, file.content);
        });

        zip.file("index.js", `${beautify(indexjs, { format: "js" })}`);
        zip.file(
          `${projectName}.df`,
          JSON.stringify(Blockly.serialization.workspaces.save(workspace))
        );

        zip.generateAsync({ type: "blob" }).then((content) => {
          let url = window.URL.createObjectURL(content);
          let anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = `${projectName}.zip`;

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
    document.querySelector(".workspace-navbar .left #save").onclick =
      async () => {
        const data = JSON.stringify(
          Blockly.serialization.workspaces.save(workspace)
        );
        const blob = new Blob([data], { type: "text/plain" });

        let url = window.URL.createObjectURL(blob);
        let anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `${
          document.getElementById("projectName").value || "DisFuse Project"
        }.df`;

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
  }, []);

  function toggleExport() {
    const exportBtn = document.querySelector(".workspace-navbar button.export");
    const tooltipEle = document.createElement("span");

    if (!hasTokenBlock.current) {
      exportBtn.classList.add("disabled");
      exportBtn.classList.add("tooltipEle");
      tooltipEle.classList.add("tooltipText");
      tooltipEle.innerHTML =
        'The "login with token" block in "main" category is required';

      exportBtn.appendChild(tooltipEle);
    } else {
      exportBtn.classList.remove("disabled");
      exportBtn.classList.remove("tooltipEle");

      tooltipEle.remove();
    }
  }

  return (
    <>
      <CodeView />
      <div id="workspace"></div>
    </>
  );
}
