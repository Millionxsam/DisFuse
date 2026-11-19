/* =====================================================================
   Site themes
   ---------------------------------------------------------------------
   The colours of the DisFuse website itself — the dashboard, settings,
   the home page and the editor's chrome — as opposed to the Blockly
   canvas, which keeps its own Workspace theme.

   A theme is a page background (one colour, or a gradient of two in a
   direction) and an accent. The panel colours are worked out from those
   two in functions/siteTheme.js, so a custom theme only needs the same
   handful of choices a preset makes.

   Text stays light in every theme, which is why the presets are all
   dark: the site was designed for a dark page.
   ===================================================================== */

export const DEFAULT_SITE_THEME = "disfuse";

export const CUSTOM_SITE_THEME = "custom";

export const GRADIENT_DIRECTIONS = [
  { value: 0, label: "Bottom to top" },
  { value: 45, label: "Bottom left to top right" },
  { value: 90, label: "Left to right" },
  { value: 135, label: "Top left to bottom right" },
  { value: 180, label: "Top to bottom" },
  { value: 225, label: "Top right to bottom left" },
  { value: 270, label: "Right to left" },
  { value: 315, label: "Bottom right to top left" },
];

export const SITE_THEMES = {
  disfuse: {
    label: "DisFuse (default)",
    background: "#00040f",
    gradient: false,
    background2: "#0a1f3d",
    direction: 135,
    accent: "#014f98",
  },
  darker: {
    label: "Darker",
    background: "#050505",
    gradient: false,
    background2: "#151515",
    direction: 180,
    accent: "#3d5a80",
  },
  ocean: {
    label: "Ocean",
    background: "#002a42",
    gradient: true,
    background2: "#00040f",
    direction: 180,
    accent: "#0284c7",
  },
  forest: {
    label: "Forest",
    background: "#03130b",
    gradient: true,
    background2: "#000805",
    direction: 135,
    accent: "#1f8f5a",
  },
  grape: {
    label: "Grape",
    background: "#0d0618",
    gradient: false,
    background2: "#1c0b33",
    direction: 135,
    accent: "#7b3fe4",
  },
  sunset: {
    label: "Sunset",
    background: "#3a0f1f",
    gradient: true,
    background2: "#0d0a24",
    direction: 135,
    accent: "#e2563f",
  },
  candy: {
    label: "Candy",
    background: "#3b0c35",
    gradient: true,
    background2: "#0b1a3d",
    direction: 90,
    accent: "#d63fd6",
  },
};

const HEX = /^#[0-9a-f]{6}$/i;

/**
 * A user's appearance settings with every gap filled, so callers never
 * have to ask whether a field was saved.
 *
 * @param {object} [appearance] `user.settings.appearance`
 */
export function normalizeAppearance(appearance) {
  const theme =
    appearance?.theme === CUSTOM_SITE_THEME || SITE_THEMES[appearance?.theme]
      ? appearance.theme
      : DEFAULT_SITE_THEME;

  const fallback = SITE_THEMES[DEFAULT_SITE_THEME];
  const given = appearance?.custom ?? {};
  const color = (value, otherwise) => (HEX.test(value) ? value : otherwise);

  return {
    theme,
    custom: {
      background: color(given.background, fallback.background),
      gradient: typeof given.gradient === "boolean" ? given.gradient : false,
      background2: color(given.background2, fallback.background2),
      direction: GRADIENT_DIRECTIONS.some((d) => d.value === given.direction)
        ? given.direction
        : fallback.direction,
      accent: color(given.accent, fallback.accent),
    },
  };
}

/** The colours a user's appearance settings come to. */
export function resolveSiteTheme(appearance) {
  const { theme, custom } = normalizeAppearance(appearance);

  return theme === CUSTOM_SITE_THEME ? custom : SITE_THEMES[theme];
}
