import * as Blockly from "blockly";

export const DFTheme = Blockly.Theme.defineTheme("DFTheme", {
  base: Blockly.Themes.Zelos,
  componentStyles: {
    workspaceBackgroundColour: "#020A0D",
    toolboxBackgroundColour: "blackBackground",
    toolboxForegroundColour: "#fff",
    flyoutBackgroundColour: "#171717",
    flyoutForegroundColour: "#c6c6c6",
    flyoutOpacity: 0.85,
    scrollbarColour: "#797979",
    insertionMarkerColour: "#fff",
    insertionMarkerOpacity: 0.3,
    scrollbarOpacity: 0.4,
    cursorColour: "#d0d0d0",
    blackBackground: "#1D1D1D",
    selectedGlowColour: "#005DB4",
    selectedGlowOpacity: 0.5,
  },
});
