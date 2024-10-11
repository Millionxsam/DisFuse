import * as Blockly from "blockly";

export const LightTheme = Blockly.Theme.defineTheme("LightTheme", {
  base: Blockly.Themes.Zelos,
  componentStyles: {
    workspaceBackgroundColour: "#FFFFFF",
    toolboxBackgroundColour: "#F0F0F0",
    toolboxForegroundColour: "#000000",
    flyoutBackgroundColour: "#E5E5E5",
    flyoutForegroundColour: "#333333",
    flyoutOpacity: 0.85,
    scrollbarColour: "#A0A0A0",
    insertionMarkerColour: "#000000",
    insertionMarkerOpacity: 0.5,
    scrollbarOpacity: 0.7,
    cursorColour: "#4A4A4A",
    blackBackground: "#FFFFFF",
    selectedGlowColour: "#005DB4",
    selectedGlowOpacity: 0.8,
  },
});
