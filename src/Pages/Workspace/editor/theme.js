import * as Blockly from "blockly";

import { DFTheme } from "../../../components/themes/DFTheme";
import { DarkerTheme } from "../../../components/themes/DarkerTheme";
import { LightTheme } from "../../../components/themes/LightTheme";
import { BlueBlackTheme } from "../../../components/themes/BlueBlackTheme";
import { CandyTheme } from "../../../components/themes/CandyTheme";

/* =====================================================================
   Workspace themes
   ---------------------------------------------------------------------
   A user picks a theme by name in Settings; this turns that name into
   the Blockly theme object, and layers DisFuse's own block colours over
   whichever one they chose.

   Those colours are deliberately the same in every theme — a "text"
   block being the same colour everywhere is part of how the toolbox is
   learned — so they are applied after the theme rather than duplicated
   into all five.
   ===================================================================== */

const THEMES = {
  DFTheme,
  DarkerTheme,
  LightTheme,
  BlueBlackTheme,
  CandyTheme,
};

export const DEFAULT_THEME = "DFTheme";

/** Block styles DisFuse overrides on top of whichever theme is chosen. */
function disfuseBlockStyles() {
  const zelos = Blockly.Themes.Zelos.blockStyles;

  return {
    text_blocks: zelos.math_blocks,
    regexp_blocks: {
      colourPrimary: "#4fde62",
      colourSecondary: "#3cd75a",
      colourTertiary: "#2eb242",
    },
    math_blocks: {
      colourPrimary: "#cfa23a",
      colourSecondary: "#b88e32",
      colourTertiary: "#9b7329",
    },
    colour_blocks: {
      colourPrimary: "#ad794c",
      colourSecondary: "#8d5b3d",
      colourTertiary: "#6b3f2c",
    },
    logic_blocks: zelos.logic_blocks,
    loop_blocks: zelos.loop_blocks,
    list_blocks: zelos.list_blocks,
    procedure_blocks: zelos.procedure_blocks,
    variable_blocks: zelos.variable_blocks,
    variable_dynamic_blocks: zelos.variable_dynamic_blocks,
    hat_blocks: zelos.hat_blocks,
  };
}

/**
 * The Blockly theme for a user's chosen theme name.
 *
 * @param {string} [name] from `user.settings.workspace.theme`
 */
export function resolveTheme(name) {
  const base = THEMES[name] ?? THEMES[DEFAULT_THEME];

  return { ...base, blockStyles: disfuseBlockStyles() };
}
