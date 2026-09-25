import { useEffect, useRef, useState } from "react";
import * as Blockly from "blockly";

/* Every DisFuse block definition. A template can hold any of them. */
import "../../blocks/index.js";

import registerCustomBlocks from "../../blocks/lib/registerCustomBlocks";
import api, { data as body } from "../../api/client.js";
import { userCache } from "../../cache.ts";
import { resolveTheme } from "../../Pages/Workspace/editor/theme.js";
import {
  blockTypesIn,
  markPackBlocks,
  parseTemplateData,
} from "../../functions/templateBlocks.js";

/* =====================================================================
   A template's blocks, to look at
   ---------------------------------------------------------------------
   A read-only canvas, so nobody imports blocks they haven't seen.

   Blocks from a Workshop pack the viewer hasn't installed are defined
   just for looking at — but only block types this page doesn't already
   have. A pack is free to name a block `controls_if`, and merely
   previewing a template must never replace a block the viewer's own
   project uses; only installing the pack does that, and installing is
   something they agree to.

   The wheel is left to the page, so scrolling past a preview scrolls
   the page instead of getting stuck in the canvas; drag to pan, and use
   the zoom buttons.
   ===================================================================== */

/** Smallest zoom a preview opens at: below this, block text is unreadable. */
const MIN_READABLE_SCALE = 0.55;

/**
 * Frames the blocks: all of them when they fit at a readable size, never
 * blown up past their normal size (a three-block template zoomed to fit a
 * wide page is unreadable too), and — for a template too big for that —
 * the top left of it at a readable size, which is where reading starts.
 */
function frame(workspace) {
  workspace.zoomToFit();

  if (workspace.scale > 1) {
    workspace.setScale(1);
    workspace.scrollCenter();
    return;
  }

  if (workspace.scale >= MIN_READABLE_SCALE) return;

  workspace.setScale(MIN_READABLE_SCALE);

  /* `scroll` takes the canvas offset in pixels: putting the blocks' top
     left corner a little way in from the view's. */
  const box = workspace.getBlocksBoundingBox();
  const padding = 24;
  workspace.scroll(
    padding - box.left * workspace.scale,
    padding - box.top * workspace.scale,
  );
}

/** Defines the blocks of these packs that aren't defined here yet. */
function defineMissingPackBlocks(packs) {
  for (const pack of packs) {
    const latest = pack.versions?.[pack.versions.length - 1];
    const blocks = (latest?.blocks ?? []).filter(
      (block) => block?.name && !Blockly.Blocks[block.name],
    );

    registerCustomBlocks(blocks);
    markPackBlocks(pack._id, blocks);
  }
}

/**
 * @param {object} props
 * @param {string} props.data    the template's saved blocks
 * @param {Array}  [props.packs] summaries of the packs it uses
 * @param {string} [props.className]
 */
export default function TemplatePreview({ data, packs = [], className = "" }) {
  const container = useRef(null);
  const [status, setStatus] = useState("loading");
  const [missing, setMissing] = useState([]);

  /* The pack list arrives as a fresh array on every render of the page;
     only a change in *which* packs should reload the preview. */
  const packKey = packs.map((pack) => pack._id).join(",");

  useEffect(() => {
    const state = parseTemplateData(data);

    if (!state) {
      setStatus("empty");
      return undefined;
    }

    let cancelled = false;
    let workspace = null;
    let observer = null;

    /* Injecting makes the preview the workspace that keyboard shortcuts
       go to. In the editor that would take Ctrl+Z away from the project
       until it was clicked, so it is handed back afterwards. */
    const previousMain = Blockly.common.getMainWorkspace();

    setStatus("loading");
    setMissing([]);

    async function show() {
      const types = [...blockTypesIn(state.blocks.blocks)];
      let unknown = types.filter((type) => !Blockly.Blocks[type]);

      if (unknown.length && packs.length) {
        const loaded = await Promise.allSettled(
          packs
            .filter((pack) => pack.available !== false)
            .map((pack) => api.get(`/workshop/${pack._id}`).then(body)),
        );

        defineMissingPackBlocks(
          loaded
            .filter((result) => result.status === "fulfilled")
            .map((result) => result.value),
        );

        unknown = types.filter((type) => !Blockly.Blocks[type]);
      }

      if (cancelled || !container.current) return;

      if (unknown.length) {
        setMissing(unknown);
        setStatus("unavailable");
        return;
      }

      const settings = userCache.user?.settings?.workspace ?? {};

      workspace = Blockly.inject(container.current, {
        readOnly: true,
        theme: resolveTheme(settings.theme),
        renderer: settings.renderer ?? "zelos",
        media: "https://blockly-demo.appspot.com/static/media/",
        move: { scrollbars: true, drag: true, wheel: false },
        zoom: {
          controls: true,
          wheel: false,
          startScale: 0.8,
          maxScale: 1.6,
          minScale: 0.15,
          scaleSpeed: 1.2,
        },
        comments: true,
        collapse: true,
        disable: true,
        sounds: false,
        trashcan: false,
      });

      Blockly.serialization.workspaces.load(state, workspace);

      frame(workspace);

      observer = new ResizeObserver(() => {
        if (workspace) Blockly.svgResize(workspace);
      });
      observer.observe(container.current);

      setStatus("ready");
    }

    show().catch((error) => {
      console.error("Could not preview template:", error);
      if (!cancelled) setStatus("failed");
    });

    return () => {
      cancelled = true;
      observer?.disconnect();
      workspace?.dispose();

      if (previousMain && previousMain !== workspace && previousMain.rendered)
        Blockly.common.setMainWorkspace(previousMain);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, packKey]);

  return (
    <div className={`df-template-preview ${className}`.trim()}>
      <div
        ref={container}
        className="df-template-preview-canvas"
        style={{ visibility: status === "ready" ? "visible" : "hidden" }}
      />

      {status !== "ready" ? (
        <div className="df-template-preview-state">
          {status === "loading" ? (
            <>
              <i className="fa-solid fa-circle-notch fa-spin" /> Loading blocks…
            </>
          ) : status === "empty" ? (
            <>
              <i className="fa-regular fa-square" /> No blocks yet
            </>
          ) : status === "unavailable" ? (
            <>
              <i className="fa-solid fa-triangle-exclamation" />
              <span>
                Some blocks in this template no longer exist, so it can't be
                shown: {missing.join(", ")}
              </span>
            </>
          ) : (
            <>
              <i className="fa-solid fa-triangle-exclamation" /> Couldn't show
              these blocks
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
