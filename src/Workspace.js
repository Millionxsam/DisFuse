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

import "./functions/registerContextMenus";
import { toolbox } from "./toolbox";
import { DFTheme } from "./DFTheme";
import exportFiles from "./exportFiles";
import { executeRestrictions } from "./functions/restrictions";

import "./blocks/main";
import "./blocks/messages";
import "./blocks/slash";
import "./blocks/servers";
import "./blocks/games";
import "./blocks/events/joins";
import "./blocks/text";
import "./blocks/channels";
import "./blocks/embeds";
import "./blocks/webhooks";
import "./blocks/database";

export default function Workspace() {
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
    workspace.addChangeListener((event) => {
      // Autosave
      let save = Blockly.serialization.workspaces.save(workspace);
      if (save.blocks) {
        localStorage.setItem("dfWorkspaceAutosave", JSON.stringify(save));
      }

      if (workspace.getAllBlocks(false).find((b) => b.type == "main_token"))
        hasTokenBlock.current = true;
      else hasTokenBlock.current = false;
      toggleExport();

      executeRestrictions(workspace);

      const codeEle = document.getElementById("code");

      const topBlocks = ["db_create"];

      let js = beautify(
        `
      const Discord = require("discord.js");
      const moment = require("moment");
      const gamecord = require("discord-gamecord");
      const Database = require("easy-json-database");

      ${workspace
        .getAllBlocks()
        .filter((b) => topBlocks.includes(b.type))
        .map((b) => javascriptGenerator.blockToCode(b))
        .join("\n")}

      const client = new Discord.Client({ intents: 3276799 });

      client.setMaxListeners(0);

      client.on("ready", () => {
      console.log(client.user.username + " is logged in");
      });

      ${workspace
        .getAllBlocks()
        .filter((b) => !topBlocks.includes(b.type))
        .map((b) => javascriptGenerator.blockToCode(b))
        .join("\n")}
      `,
        { format: "js" }
      );

      codeEle.innerText = `${beautify(js, { format: "js" })}`;
    });

    // Export event
    document.querySelector(".button.export").addEventListener("click", () => {
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
    document.querySelector(".navbar .left #save").onclick = async () => {
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

    // Load file event
    document.querySelector(".navbar .left #load").onclick = async () => {
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = ".df";

      fileInput.addEventListener("change", (e) => {
        let file = e.target.files[0];
        if (!file) return;

        let reader = new FileReader();

        reader.onload = (event) => {
          let data = event.target.result;

          workspace.clear();
          Blockly.serialization.workspaces.load(JSON.parse(data), workspace);
          document.querySelector(".navbar #projectName").value =
            file.name.replace(".df", "");

          Swal.fire({
            toast: true,
            position: "bottom-end",
            timer: 5000,
            timerProgressBar: true,
            icon: "success",
            title: "Successfully loaded",
            showConfirmButton: false,
          });
        };

        reader.readAsText(file);
      });

      fileInput.click();
      fileInput.remove();
    };

    // Recover file event
    document.querySelector(".navbar .left #recover").onclick = async () => {
      Swal.fire({
        title: "Recover Project",
        html: '<p class="modal-text">DisFuse autosaves your workspace to your device\'s local storage, in case you forget to save your project. We can try to recover your last used workspace if one exists.</p>',
        icon: "warning",
        confirmButtonText: "Recover",
        showCancelButton: true,
      }).then((result) => {
        if (!result.isConfirmed) return;

        let data = localStorage.getItem("dfWorkspaceAutosave");
        if (!data)
          return Swal.fire({
            icon: "error",
            title: "Save not found",
            text: "We couldn't find an autosave in your local storage. Remember to save your file next time!",
            confirmButtonText: "Ok",
          });

        workspace.clear();
        Blockly.serialization.workspaces.load(JSON.parse(data), workspace);

        Swal.fire({
          toast: true,
          position: "bottom-end",
          timer: 5000,
          timerProgressBar: true,
          icon: "success",
          title: "Successfully recovered",
          showConfirmButton: false,
        });
      });
    };
  }, []);

  function toggleExport() {
    const exportBtn = document.querySelector(".navbar .button.export");
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

  return <div id="workspace"></div>;
}
