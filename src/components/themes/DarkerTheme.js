import * as Blockly from "blockly";

export const DarkerTheme = Blockly.Theme.defineTheme("DarkerTheme", {
  base: Blockly.Themes.Zelos,
  componentStyles: {
    workspaceBackgroundColour: "#000000",
    toolboxBackgroundColour: "#0A0A0A",
    toolboxForegroundColour: "#E0E0E0",
    flyoutBackgroundColour: "#101010",
    flyoutForegroundColour: "#B0B0B0",
    flyoutOpacity: 0.85,
    scrollbarColour: "#5A5A5A",
    insertionMarkerColour: "#F5F5F5",
    insertionMarkerOpacity: 0.4,
    scrollbarOpacity: 0.5,
    cursorColour: "#E0E0E0",
    blackBackground: "#141414",
    selectedGlowColour: "#0078D7",
    selectedGlowOpacity: 0.6,
  },
});
