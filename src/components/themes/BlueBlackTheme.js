import * as Blockly from "blockly";

export const BlueBlackTheme = Blockly.Theme.defineTheme("BlueBlackTheme", {
  base: Blockly.Themes.Zelos,
  componentStyles: {
    workspaceBackgroundColour: "#003363",
    toolboxBackgroundColour: "blueBackground",
    toolboxForegroundColour: "#FFFFFF",
    flyoutBackgroundColour: "#003363",
    flyoutForegroundColour: "#A5A5A5",
    flyoutOpacity: 0.85,
    scrollbarColour: "#797979",
    insertionMarkerColour: "#000000",
    insertionMarkerOpacity: 0.3,
    scrollbarOpacity: 0.4,
    cursorColour: "#d0d0d0",
    blueBackground: "#000000",
    selectedGlowColour: "#020A0D",
    selectedGlowOpacity: 0.5,
  },
});
