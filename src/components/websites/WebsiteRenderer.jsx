import { createContext, useContext, useMemo } from "react";

import { defaultTheme } from "../../config/websiteDefaults";
import ElementNode from "./ElementNode";

/**
 * Renders one page of a website from its stored configuration.
 *
 * The same renderer powers the builder's live preview and the published
 * page — the only difference is the `editing` flag, which turns on
 * selection/hover outlines and stops links and inputs from reacting.
 */

export const RenderContext = createContext({
  pages: [],
  basePath: "",
  editing: false,
  selectedId: null,
  hoveredId: null,
  onSelect: () => {},
  onHover: () => {},
  onNavigate: null,
  openLinksInNewTab: false,
});

export function useRender() {
  return useContext(RenderContext);
}

export function mergeTheme(theme) {
  return {
    ...defaultTheme,
    ...(theme || {}),
    colors: { ...defaultTheme.colors, ...(theme?.colors || {}) },
    fonts: { ...defaultTheme.fonts, ...(theme?.fonts || {}) },
  };
}

/** Theme → the CSS custom properties every element style can reference. */
export function themeStyle(theme) {
  const merged = mergeTheme(theme);

  return {
    "--ws-primary": merged.colors.primary,
    "--ws-primary-text": merged.colors.primaryText,
    "--ws-bg": merged.colors.background,
    "--ws-surface": merged.colors.surface,
    "--ws-text": merged.colors.text,
    "--ws-muted": merged.colors.muted,
    "--ws-border": merged.colors.border,
    "--ws-font-body": merged.fonts.body,
    "--ws-font-heading": merged.fonts.heading,
    "--ws-radius": merged.radius,
    "--ws-content-width": merged.contentWidth,
  };
}

export default function WebsiteRenderer({
  website,
  page,
  basePath = "",
  editing = false,
  selectedId = null,
  hoveredId = null,
  onSelect,
  onHover,
  onNavigate,
  openLinksInNewTab = false,
}) {
  const pages = website?.config?.pages || [];

  const context = useMemo(
    () => ({
      pages,
      basePath,
      editing,
      selectedId,
      hoveredId,
      onSelect: onSelect || (() => {}),
      onHover: onHover || (() => {}),
      onNavigate: onNavigate || null,
      openLinksInNewTab,
    }),
    [
      pages,
      basePath,
      editing,
      selectedId,
      hoveredId,
      onSelect,
      onHover,
      onNavigate,
      openLinksInNewTab,
    ],
  );

  const elements = page?.elements || [];

  return (
    <RenderContext.Provider value={context}>
      <div
        className={`ws-root${editing ? " ws-editing" : ""}`}
        style={themeStyle(website?.config?.theme)}
      >
        {elements.length ? (
          elements.map((node) => <ElementNode key={node.id} node={node} />)
        ) : (
          <div className="ws-blank-page">
            <i className="fa-solid fa-layer-group"></i>
            <h3>This page is empty</h3>
            <p>
              {editing
                ? "Add an element from the panel on the left to get started."
                : "Nothing has been added to this page yet."}
            </p>
          </div>
        )}
      </div>
    </RenderContext.Provider>
  );
}
