import { resolveTheme } from "./theme.js";

/* =====================================================================
   How the workspace is injected
   ---------------------------------------------------------------------
   Everything `Blockly.inject` is told, derived from the user's Settings.
   It was a fifty-line object literal buried three hundred lines into the
   page component.
   ===================================================================== */

/**
 * @param {object} options
 * @param {object} options.toolbox   the toolbox definition
 * @param {object} options.settings  `user.settings.workspace`
 */
export function buildBlocklyOptions({ toolbox, settings = {} }) {
  const grid = settings.grid ?? {};

  return {
    toolbox,
    theme: resolveTheme(settings.theme),
    renderer: settings.renderer ?? "zelos",
    /* ---- Panning ---------------------------------------------------
       `drag: true` matters more than it looks. With `scrollbars: true`
       and no `drag`, Blockly leaves infinite-scroll mode and derives
       the scrollable area from the bounding box of the blocks — so a
       workspace with nothing in it has nowhere to scroll and the canvas
       appears frozen. Deleting every block used to do exactly that.

       With dragging enabled the canvas can always be moved, empty or
       not, and the scrollbars still bound the content. */
    move: {
      wheel: true,
      drag: true,
      scrollbars: true,
    },
    collapse: true,
    comments: true,
    disable: true,
    maxBlocks: Infinity,
    trashcan: true,
    horizontalLayout: false,
    toolboxPosition: "start",
    css: true,
    media: "https://blockly-demo.appspot.com/static/media/",
    rtl: false,
    scrollbars: true,
    sounds: settings.sounds ?? true,
    oneBasedIndex: true,
    grid:
      (grid.enabled ?? true)
        ? {
            spacing: grid.spacing ?? 35,
            length: 5,
            colour: "#8888886e",
            snap: grid.snap ?? false,
          }
        : false,
    zoom: {
      controls: true,
      wheel: true,
      startScale: 1,
      maxScale: 3,
      minScale: 0.3,
      scaleSpeed: 1.2,
    },
  };
}

/**
 * Optional stylesheets driven by Settings, and how to remove them again.
 *
 * These used to be `document.head.appendChild` calls with no cleanup, so
 * turning a setting off only took effect after a reload — and every
 * visit to the editor added another copy.
 *
 * @returns {() => void} removes whatever was added
 */
export function applyOptionalStyles(settings = {}, optimization = {}) {
  const added = [];

  function addStyle(css) {
    const element = document.createElement("style");
    element.dataset.disfuseEditor = "true";
    element.textContent = css;
    document.head.appendChild(element);
    added.push(element);
  }

  if (settings.toolboxBtIcons === false)
    addStyle(`
      .workspace-navbar * button i:not(.fa-discord) {
        display: none !important;
      }
    `);

  if (optimization.fastRenderMode === true)
    addStyle(`
      div#workspace {
        text-rendering: optimizeSpeed !important;
        image-rendering: optimizeSpeed !important;
        shape-rendering: optimizeSpeed !important;
        font-smooth: none !important;
      }
    `);

  return () => {
    for (const element of added) element.remove();
  };
}
