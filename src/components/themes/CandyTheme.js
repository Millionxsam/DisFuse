import * as Blockly from "blockly";

export const CandyTheme = Blockly.Theme.defineTheme("CandyTheme", {
  base: Blockly.Themes.Zelos,
  componentStyles: {
    workspaceBackgroundColour: "#ffb5e4",
    toolboxBackgroundColour: "#b5d5ff",
    toolboxForegroundColour: "#000000",
    flyoutBackgroundColour: "#9994ff",
    flyoutForegroundColour: "#000000",
    flyoutOpacity: 0.85,
    scrollbarColour: "#78ffa0",
    insertionMarkerColour: "#000000",
    insertionMarkerOpacity: 0.3,
    scrollbarOpacity: 0.4,
    cursorColour: "#d0d0d0",
    selectedGlowColour: "#c063e6",
    selectedGlowOpacity: 0.5,
  },
});
