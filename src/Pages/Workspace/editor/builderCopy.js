import * as Blockly from "blockly";
import { javascriptGenerator } from "blockly/javascript";

import api, { data } from "../../../api/client.js";
import { getVersion } from "../../../api/versions.js";
import baseCatalog from "../../../builder/catalog/index.js";
import { catalogWithPacks } from "../../../builder/catalog/packs.js";
import { convertBlockProject } from "../../../builder/convert/fromBlocks.js";
import { OpError, applyOp, builderStats, emptyBuilder } from "../../../builder/model/ops.js";
import { buildWorkspacesDf } from "../../../functions/dfFile.js";
import { refreshProjectWorkspaces } from "../../../functions/projectData.js";
import { blockSource } from "../../../functions/templateBlocks.js";
import { createBlockAdapter } from "./blockAdapter.js";

/* =====================================================================
   "Copy to DisFuse Builder"
   ---------------------------------------------------------------------
   Makes a new DisFuse Builder project out of this block editor project.
   Nothing about this project changes: every workspace is read, turned
   into commands and events by builder/convert, and sent to
   POST /projects/:id/builder-copy, which creates the new project.

   The conversion runs here, in the editor, because only the editor has
   Blockly with every block registered, including the Workshop pack and
   BlockBuddy blocks it needs to recognise. Blocks from Workshop packs
   become the same pack's steps in the copy (whichever kind of pack it
   is, see builder/catalog/packs.js), so they stay linked to the pack;
   BlockBuddy blocks are left out.
   ===================================================================== */

/**
 * The latest blocks of every workspace: the one on screen from the
 * editor, the rest as last saved (fetched again, in case someone else
 * changed them). On a Version Control project, the version being edited.
 */
async function latestWorkspaces({ project, activeVersion, workspace, currentWorkspaceId }) {
  let list = project.workspaces ?? [];

  try {
    if (activeVersion) list = (await getVersion(project._id, activeVersion._id))?.workspaces ?? list;
    else list = (await refreshProjectWorkspaces(project, project._id)).workspaces ?? list;
  } catch (error) {
    /* What the page already has is the next best thing. */
    console.error("Couldn't refresh the workspaces before copying:", error);
  }

  return buildWorkspacesDf(list, { workspace, workspaceId: currentWorkspaceId }).workspaces;
}

/**
 * Builds the DisFuse Builder version of the project.
 *
 * @returns {Promise<{ builder: object, report: object, stats: object, problem: string|null }>}
 *   `problem` is set when the result couldn't be saved as a project
 *   (too big, say), with the reason.
 */
export async function prepareBuilderCopy({ project, activeVersion, workspace, currentWorkspaceId, packs = [] }) {
  const workspaces = await latestWorkspaces({ project, activeVersion, workspace, currentWorkspaceId });
  const catalog = catalogWithPacks(baseCatalog, packs);

  const blocks = createBlockAdapter({ Blockly, javascriptGenerator, blockSource });
  let result;
  try {
    result = convertBlockProject({ workspaces, catalog, blocks });
  } finally {
    blocks.dispose();
  }

  /* The same check the API makes, so a copy that can't be saved says so
     here rather than after pressing the button. */
  let problem = null;
  try {
    applyOp(emptyBuilder(), "importTemplate", { content: result.builder });
  } catch (error) {
    if (!(error instanceof OpError)) throw error;
    problem = error.message;
  }

  return {
    ...result,
    stats: { ...builderStats(result.builder), variables: result.builder.variables.length },
    problem,
  };
}

/**
 * Creates the new project.
 *
 * @param {string} projectId  the block editor project being copied
 * @param {object} builder    from prepareBuilderCopy
 * @param {string} [botToken] another bot's token, when this one already
 *   has a DisFuse Builder project
 * @returns {Promise<object>} the new project
 */
export function createBuilderCopy(projectId, builder, botToken) {
  return api
    .post(`/projects/${projectId}/builder-copy`, {
      builder,
      ...(botToken ? { botToken } : {}),
    })
    .then(data);
}
