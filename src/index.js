import * as Blockly from "blockly";
import { javascriptGenerator } from "blockly/javascript";
import { save, load } from "./serialization";
import "./index.css";

import { mainBlocks } from "./blocks/main";
import { messageBlocks } from "./blocks/messages";
import { slashBlocks } from "./blocks/slash";

// Register the blocks and generator with Blockly
Blockly.common.defineBlocks(mainBlocks);
Blockly.common.defineBlocks(messageBlocks);
Blockly.common.defineBlocks(slashBlocks);

// Define dark theme
const DarkTheme = Blockly.Theme.defineTheme("DarkTheme", {
  base: Blockly.Themes.Classic,
  componentStyles: {
    workspaceBackgroundColour: "#1e1e1e",
    toolboxBackgroundColour: "blackBackground",
    toolboxForegroundColour: "#fff",
    flyoutBackgroundColour: "#252526",
    flyoutForegroundColour: "#ccc",
    flyoutOpacity: 1,
    scrollbarColour: "#797979",
    insertionMarkerColour: "#fff",
    insertionMarkerOpacity: 0.3,
    scrollbarOpacity: 0.4,
    cursorColour: "#d0d0d0",
    blackBackground: "#333",
  },
});

// Set up UI elements and inject Blockly
const codeDiv = document.getElementById("generatedCode").firstChild;
const blocklyDiv = document.getElementById("blocklyDiv");
const ws = Blockly.inject(blocklyDiv, {
  toolbox: document.getElementById("toolbox"),
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
});

// This function resets the code and output divs, shows the
// generated code from the workspace, and evals the code.
// In a real application, you probably shouldn't use `eval`.
const updateCode = async () => {
  const code = `
  const Discord = require("discord.js");
  const client = new Discord.Client({ intents: 3276799 });

  client.on("ready", () => {
    console.log(client.user.username + " is logged in");
  });

  ${javascriptGenerator.workspaceToCode(ws)}
  `;

  codeDiv.innerText = code;
};

// Load the initial state from storage and run the code.
load(ws);
updateCode();

// Every time the workspace changes state, save the changes to storage.
ws.addChangeListener((e) => {
  // UI events are things like scrolling, zooming, etc.
  // No need to save after one of these.
  if (e.isUiEvent) return;
  save(ws);
});

ws.addChangeListener(Blockly.Events.disableOrphans);

// Whenever the workspace changes meaningfully, run the code again.
ws.addChangeListener((e) => {
  // Don't run the code when the workspace finishes loading; we're
  // already running it once when the application starts.
  // Don't run the code during drags; we might have invalid state.
  if (
    e.isUiEvent ||
    e.type == Blockly.Events.FINISHED_LOADING ||
    ws.isDragging()
  ) {
    return;
  }
  updateCode();
});
