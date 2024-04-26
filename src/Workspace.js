import { useEffect, useRef } from "react";
import * as Blockly from "blockly";
import { useBlocklyWorkspace } from "react-blockly";

import { toolbox } from "./toolbox";
import { DarkTheme } from "./DarkTheme";

import "./blocks/main";
import "./blocks/messages";
import "./blocks/slash";
import { javascriptGenerator } from "blockly/javascript";

export default function Workspace() {
  const blocklyRef = useRef();
  const { ws, xml } = useBlocklyWorkspace({
    onWorkspaceChange: updateCode,
    ref: blocklyRef,
    toolboxConfiguration: toolbox,
    workspaceConfiguration: {
      theme: DarkTheme,
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
        spacing: 20,
        length: 1,
        colour: "#888",
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
    },
  });

  function updateCode(workspace) {
    // Save file
    document.querySelector(".navbar .left #save").onclick = async () => {
      const data = JSON.stringify(
        Blockly.serialization.workspaces.save(workspace)
      );
      const blob = new Blob([data], { type: "application/json" });

      const fileHandle = await window.showSaveFilePicker({
        suggestedName:
          document.querySelector(".navbar #projectName").value ||
          "DisFuse Project",
        types: [
          {
            description: "DisFuse Save File",
            accept: { "application/json": [".df"] },
          },
        ],
      });
      const fileStream = await fileHandle.createWritable();

      await fileStream.write(blob);
      await fileStream.close();
    };

    // Load file
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
        };

        reader.readAsText(file);
      });

      fileInput.click();
      fileInput.remove();
    };

    workspace.addChangeListener(Blockly.Events.disableOrphans);

    const codeEle = document.getElementById("code");

    let js = `const Discord = require("discord.js");
      const client = new Discord.Client({ intents: 3276799 });

      client.on("ready", () => {
      console.log(client.user.username + " is logged in");
      });

      ${javascriptGenerator.workspaceToCode(workspace)}
      `;

    codeEle.innerText = js;
  }

  return <div id="workspace" ref={blocklyRef}></div>;
}
