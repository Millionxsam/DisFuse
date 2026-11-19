import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";

import Switch from "../../../components/Switch";
import api from "../../../api/client.js";
import { userCache } from "../../../cache.ts";
import {
  CUSTOM_SITE_THEME,
  GRADIENT_DIRECTIONS,
  SITE_THEMES,
  normalizeAppearance,
} from "../../../config/siteThemes.js";
import {
  applySiteTheme,
  luminance,
  siteThemeTokens,
} from "../../../functions/siteTheme.js";

import DocsLink from "../../../components/DocsLink.jsx";
import { DOCS } from "../../../config/docs.js";

/* Colour pickers report every step of a drag, so saving waits for the
   user to settle on one. The theme itself is applied on every step. */
const SAVE_DELAY_MS = 500;

function ThemeSwatch({ theme, label, active, onClick }) {
  const tokens = siteThemeTokens(theme);

  return (
    <button
      type="button"
      className={`df-theme-swatch${active ? " active" : ""}`}
      onClick={onClick}
      aria-pressed={active}
    >
      <span
        className="df-theme-swatch-preview"
        style={{ background: tokens["--df-page-bg"] }}
      >
        <span
          className="df-theme-swatch-panel"
          style={{ background: tokens["--df-surface-2"] }}
        >
          <span style={{ background: theme.accent }} />
        </span>
      </span>
      <span className="df-theme-swatch-label">{label}</span>
    </button>
  );
}

export default function AppearanceSettings() {
  const user = userCache.user;
  const [appearance, setAppearance] = useState(() =>
    normalizeAppearance(user?.settings?.appearance),
  );
  const saveTimer = useRef(null);

  useEffect(() => () => clearTimeout(saveTimer.current), []);

  function update(next) {
    setAppearance(next);
    applySiteTheme(next);

    if (user?.settings) user.settings.appearance = next;

    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      api.put(`/users/${user.id}/settings`, { appearance: next });
    }, SAVE_DELAY_MS);
  }

  function updateCustom(key, value) {
    update({
      theme: CUSTOM_SITE_THEME,
      custom: { ...appearance.custom, [key]: value },
    });
  }

  const { custom } = appearance;
  const isCustom = appearance.theme === CUSTOM_SITE_THEME;
  const lightBackground =
    luminance(custom.background) > 0.4 ||
    (custom.gradient && luminance(custom.background2) > 0.4);

  return (
    <>
      <Helmet>
        <title>Appearance Settings | DisFuse</title>
      </Helmet>
      <div className="settings">
        <h1>Appearance</h1>
        <p>
          Choose the colors of the DisFuse website. The block editor's canvas
          follows your Workspace theme.{" "}
          <DocsLink
            page={`${DOCS.settings}#appearance`}
            variant="inline"
            label="How themes work"
          />
        </p>

        <div className="option df-theme-option">
          <h5>Site theme:</h5>
          <div className="df-theme-presets">
            {Object.entries(SITE_THEMES).map(([id, theme]) => (
              <ThemeSwatch
                key={id}
                theme={theme}
                label={theme.label}
                active={appearance.theme === id}
                onClick={() => update({ ...appearance, theme: id })}
              />
            ))}
            <ThemeSwatch
              theme={custom}
              label="Custom"
              active={isCustom}
              onClick={() =>
                update({ ...appearance, theme: CUSTOM_SITE_THEME })
              }
            />
          </div>
        </div>

        {isCustom && (
          <>
            <div className="option">
              <label htmlFor="appearance-gradient">Use a gradient:</label>
              <Switch
                defaultChecked={custom.gradient}
                onChange={(e) =>
                  updateCustom("gradient", e.currentTarget.checked)
                }
                id="appearance-gradient"
              />
            </div>
            <div className="option">
              <label htmlFor="appearance-background">
                {custom.gradient ? "Gradient start color:" : "Background:"}
              </label>
              <input
                type="color"
                id="appearance-background"
                value={custom.background}
                onChange={(e) =>
                  updateCustom("background", e.currentTarget.value)
                }
              />
            </div>
            {custom.gradient && (
              <>
                <div className="option">
                  <label htmlFor="appearance-background2">
                    Gradient end color:
                  </label>
                  <input
                    type="color"
                    id="appearance-background2"
                    value={custom.background2}
                    onChange={(e) =>
                      updateCustom("background2", e.currentTarget.value)
                    }
                  />
                </div>
                <div className="option">
                  <label htmlFor="appearance-direction">
                    Gradient direction:
                  </label>
                  <select
                    id="appearance-direction"
                    value={custom.direction}
                    onChange={(e) =>
                      updateCustom("direction", Number(e.currentTarget.value))
                    }
                  >
                    {GRADIENT_DIRECTIONS.map(({ value, label }) => (
                      <option value={value} key={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
            <div className="option">
              <label htmlFor="appearance-accent">Accent color:</label>
              <input
                type="color"
                id="appearance-accent"
                value={custom.accent}
                onChange={(e) => updateCustom("accent", e.currentTarget.value)}
              />
            </div>
            {lightBackground && (
              <p className="df-theme-warning">
                <i className="fa-solid fa-triangle-exclamation" /> Text on
                DisFuse is light, so it can be hard to read on a light
                background.
              </p>
            )}
          </>
        )}
      </div>
    </>
  );
}
