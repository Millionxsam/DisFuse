import * as Blockly from "blockly";
import { useEffect, useMemo, useRef, useState } from "react";
import { DFTheme } from "../../../components/themes/DFTheme";
import registerCustomBlocks from "../../../blocks/lib/registerCustomBlocks";
import getToolbox from "../../../config/toolbox";

/* Registers every DisFuse block definition and generator. Without it
   this page injects a toolbox full of block types Blockly has never been
   told about, and a saved project loaded here renders as nothing. It used
   to be a glob that only the editor page had. */
import "../../../blocks/index.js";
import { javascriptGenerator } from "blockly/javascript";
import hljs from "highlight.js/lib/core";

import javascript from "highlight.js/lib/languages/javascript";
import { format } from "../../../functions/pretty";

hljs.registerLanguage("javascript", javascript);

/* =====================================================================
   The pack as if it were installed
   ---------------------------------------------------------------------
   The preview is a small project editor with the pack being edited
   installed — whether or not the author has installed it themselves. It
   gets the same Workshop category an installed pack would, built from
   the unpublished blocks, and whatever the author builds with them stays
   put while they keep editing the pack.
   ===================================================================== */

/** The pack being edited, shaped like an installed one. */
function draftPack(pack, blocks) {
  const published = pack.versions?.[pack.versions.length - 1]?.version;
  return {
    ...pack,
    name: pack.name || "This pack",
    versions: [{ version: `${published || "0.0.0"} (draft)`, blocks }],
  };
}

/* Block types this page defined. Renaming or deleting a block in the
   editor should make it disappear from the preview too, so these are
   forgotten again once the pack stops containing them — but never a type
   that existed before the pack got to it, like a built-in block. */
const ownedTypes = new Set();

function registerDraftBlocks(blocks) {
  const names = new Set(blocks.map((block) => block.name));

  for (const name of names)
    if (!Blockly.Blocks[name]) ownedTypes.add(name);

  for (const name of [...ownedTypes]) {
    if (names.has(name)) continue;
    delete Blockly.Blocks[name];
    delete javascriptGenerator.forBlock[name];
    ownedTypes.delete(name);
  }

  registerCustomBlocks(blocks.filter((block) => ownedTypes.has(block.name)));
}

/**
 * The blocks that can actually be built. A block that is half-made in
 * the editor can throw from its init(), and one such block in a toolbox
 * category stops the whole flyout from opening.
 */
function buildableBlocks(blocks) {
  const scratch = new Blockly.Workspace();
  const ok = blocks.filter((block) => {
    try {
      scratch.newBlock(block.name);
      return true;
    } catch (error) {
      console.warn(`Preview: block "${block.name}" can't be built yet:`, error);
      return false;
    }
  });
  scratch.dispose();
  return ok;
}

/**
 * Reloads the workspace so blocks already on it pick up their new
 * definitions. Top-level stacks are restored one at a time, so a stack
 * using a block that was renamed or deleted is dropped on its own
 * instead of taking everything else with it.
 */
function reloadWorkspace(workspace) {
  const state = Blockly.serialization.workspaces.save(workspace);
  const stacks = state.blocks?.blocks ?? [];

  Blockly.Events.setGroup(true);
  try {
    Blockly.serialization.workspaces.load({ ...state, blocks: undefined }, workspace);
    for (const stack of stacks) {
      try {
        Blockly.serialization.blocks.append(stack, workspace);
      } catch (error) {
        console.warn("Preview: dropped a stack that no longer loads:", error);
      }
    }
  } finally {
    Blockly.Events.setGroup(false);
  }
}

function escapeHtml(text) {
  return text.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
}

export default function PreviewBox({ blocks = [], pack = {} }) {
  const [previewWorkspace, setWorkspace] = useState();
  const codeRef = useRef();

  /* The editor hands over a fresh array on almost every event, drags
     included; only a real change to the blocks should reach Blockly. */
  const blocksKey = JSON.stringify(blocks);
  const stableBlocks = useMemo(() => blocks, [blocksKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const workspace = Blockly.inject(
      document.getElementById("workshopPreviewWorkspace"),
      {
        toolbox: getToolbox([], undefined, { blockBuddy: false }),
        theme: DFTheme,
        move: {
          wheel: true,
        },
        renderer: "zelos",
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
        oneBasedIndex: true,
        grid: {
          spacing: "35",
          length: 5,
          colour: "#8888886e",
          snap: false,
        },
        zoom: {
          controls: true,
          wheel: true,
          startScale: 1,
          maxScale: 3,
          minScale: 0.3,
          scaleSpeed: 1.2,
        },
      },
    );

    let run = 0;
    const renderCode = async () => {
      const current = ++run;
      let html;

      if (!workspace.getTopBlocks(false).length) {
        html = escapeHtml(
          "// Drag blocks from the Workshop category to see their code here.",
        );
      } else {
        try {
          const code = javascriptGenerator.workspaceToCode(workspace);
          html = hljs.highlight(await format(code), {
            language: "javascript",
          }).value;
        } catch (error) {
          /* Usually a block's output code that doesn't compile yet. */
          html = escapeHtml(`// Could not generate code:\n// ${error?.message || error}`);
        }
      }

      if (current === run && codeRef.current) codeRef.current.innerHTML = html;
    };

    workspace.addChangeListener((event) => {
      if (event.isUiEvent) return;
      renderCode();
    });
    renderCode();

    setWorkspace(workspace);
    return () => workspace.dispose();
  }, []);

  useEffect(() => {
    if (!previewWorkspace) return;

    registerDraftBlocks(stableBlocks);
    const usable = buildableBlocks(
      stableBlocks.filter((block) => ownedTypes.has(block.name)),
    );

    previewWorkspace.updateToolbox(
      getToolbox([draftPack(pack, usable)], undefined, { blockBuddy: false }),
    );
    reloadWorkspace(previewWorkspace);
  }, [stableBlocks, pack.name, pack.color, pack.versions, previewWorkspace]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div className="workshopPreview">
        <h1>Preview</h1>
        <div id="workshopPreviewWorkspace"></div>
        <h1>Output</h1>
        <pre id="workshopPreviewCode" ref={codeRef}></pre>
      </div>
    </>
  );
}
