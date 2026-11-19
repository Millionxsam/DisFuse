import {
  DEFAULT_SITE_THEME,
  normalizeAppearance,
  resolveSiteTheme,
} from "../config/siteThemes.js";

/* =====================================================================
   Applying a site theme
   ---------------------------------------------------------------------
   Every page reads its colours from the tokens in styles/base/tokens.css,
   so a theme is applied by redefining those tokens on <html>. The
   default theme removes the overrides rather than restating them, so the
   stylesheet stays the one source of the default look.

   The last theme used is kept in localStorage and applied before React
   renders, so a page load doesn't flash the default colours while the
   user is still being fetched — and signed-out pages like the home page
   keep the visitor's theme too.
   ===================================================================== */

const STORAGE_KEY = "disfuse-site-theme";

const TOKENS = [
  "--df-bg",
  "--df-page-bg",
  "--df-surface",
  "--df-surface-2",
  "--df-surface-3",
  "--main-color",
  "--main-color-rgb",
];

function rgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a, b, amount) {
  return a.map((v, i) => Math.round(v + (b[i] - v) * amount));
}

function css([r, g, b]) {
  return `rgb(${r}, ${g}, ${b})`;
}

/** Relative luminance, 0 (black) to 1 (white). */
export function luminance(hex) {
  const [r, g, b] = rgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** The CSS custom properties a theme comes to. */
export function siteThemeTokens(theme) {
  const bg = rgb(theme.background);
  const accent = rgb(theme.accent);
  const white = [255, 255, 255];

  /* Panels are the page colour lifted towards white and tinted by the
     accent — the same relationship the default palette has. */
  const surface = (lift, tint) => css(mix(mix(bg, white, lift), accent, tint));

  return {
    "--df-bg": theme.background,
    "--df-page-bg": theme.gradient
      ? `linear-gradient(${theme.direction}deg, ${theme.background}, ${theme.background2})`
      : theme.background,
    "--df-surface": surface(0.04, 0.05),
    "--df-surface-2": surface(0.07, 0.08),
    "--df-surface-3": surface(0.1, 0.1),
    "--main-color": theme.accent,
    "--main-color-rgb": accent.join(", "),
  };
}

function apply(appearance) {
  const root = document.documentElement;
  const { theme } = normalizeAppearance(appearance);

  TOKENS.forEach((token) => root.style.removeProperty(token));
  delete root.dataset.dfSiteTheme;

  if (theme === DEFAULT_SITE_THEME) return;

  const resolved = resolveSiteTheme(appearance);

  for (const [token, value] of Object.entries(siteThemeTokens(resolved)))
    root.style.setProperty(token, value);

  root.dataset.dfSiteTheme = resolved.gradient ? "gradient" : "solid";
}

/** Applies a user's appearance settings and remembers them for next load. */
export function applySiteTheme(appearance) {
  apply(appearance);

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(normalizeAppearance(appearance)),
    );
  } catch {
    /* Storage can be unavailable; the theme still applies for this visit. */
  }
}

/** Applies the theme remembered from the last visit, if there is one. */
export function applyStoredSiteTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) apply(JSON.parse(stored));
  } catch {
    /* A bad stored value just means the default theme. */
  }
}
