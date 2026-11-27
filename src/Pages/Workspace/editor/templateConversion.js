import * as Blockly from "blockly";
import { javascriptGenerator } from "blockly/javascript";

import "../../../blocks/index.js";
import baseCatalog from "../../../builder/catalog/index.js";
import { catalogWithPacks, packIdsUsed } from "../../../builder/catalog/packs.js";
import { convertBlockProject } from "../../../builder/convert/fromBlocks.js";
import { convertBuilderToBlocks } from "../../../builder/convert/toBlocks.js";
import { parseTemplateContent } from "../../../builder/model/templates.js";
import { blockSource, parseTemplateData } from "../../../functions/templateBlocks.js";
import { createBlockAdapter } from "./blockAdapter.js";
import { loadBlockPacks, registerBlockPacks } from "./customBlocks.js";

/* =====================================================================
   Using a template in a project of the other kind
   ---------------------------------------------------------------------
   A template is made with the block editor or with DisFuse Builder, but
   goes into either kind of project. Nothing about the template changes:
   its content is read, a converted copy is made, and that copy is what
   gets imported.

     block template   → DisFuse Builder project: builder/convert/fromBlocks.js,
                        the same conversion as "Copy to DisFuse Builder"
     builder template → block editor project: builder/convert/toBlocks.js

   Both need Blockly with every block registered, and the blocks of the
   Workshop packs the template uses (either kind of pack works in either
   editor). The builder imports this module only when it's needed, so
   Blockly isn't part of the builder until then.
   ===================================================================== */

function adapter() {
  return createBlockAdapter({ Blockly, javascriptGenerator, blockSource });
}

/** The ids of the packs a template needs: what the API listed, and what its content uses. */
export function templatePackIds(template, content) {
  const ids = new Set((template?.packs ?? []).map((pack) => String(pack._id)));
  if (content) for (const id of packIdsUsed(content)) ids.add(id);
  return [...ids];
}

/**
 * Fetches and registers the packs a template needs that `loaded` doesn't
 * already have. Returns the packs it fetched.
 */
export async function loadTemplatePacks(ids, loaded = []) {
  const have = new Set(loaded.map((pack) => String(pack._id)));
  const missing = ids.filter((id) => !have.has(String(id)));
  if (!missing.length) return [];
  const packs = await loadBlockPacks({ installedBlockPacks: missing });
  registerBlockPacks(packs);
  return packs;
}

/**
 * A block template as DisFuse Builder content, for a builder project.
 *
 * @param {object} template  from GET /templates/:id
 * @returns {Promise<{ content: object, report: object, packs: object[] }>}
 */
export async function blockTemplateToBuilder(template) {
  const packs = await loadTemplatePacks(templatePackIds(template));
  const state = parseTemplateData(template.data);
  const blocks = adapter();
  try {
    const { builder, report } = convertBlockProject({
      workspaces: [{ name: template.name, data: state ?? { blocks: { blocks: [] } } }],
      catalog: catalogWithPacks(baseCatalog, packs),
      blocks,
    });
    return { content: builder, report, packs };
  } finally {
    blocks.dispose();
  }
}

/**
 * A DisFuse Builder template as blocks, for a block editor project.
 *
 * Every pack it needs must be registered already (loadTemplatePacks).
 *
 * @param {object} template  from GET /templates/:id
 * @param {object[]} packs   every pack the editor has registered
 * @returns {{ data: string, report: object, content: object }}
 *   `data` is template data, ready for importTemplateBlocks
 */
export function builderTemplateToBlocks(template, packs = []) {
  const content = parseTemplateContent(template.data);
  const blocks = adapter();
  try {
    const { data, report } = convertBuilderToBlocks({ content, catalog: catalogWithPacks(baseCatalog, packs), blocks });
    return { data: JSON.stringify(data), report, content };
  } finally {
    blocks.dispose();
  }
}
