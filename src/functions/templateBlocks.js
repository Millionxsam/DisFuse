import * as Blockly from "blockly";

/* =====================================================================
   Template blocks
   ---------------------------------------------------------------------
   What the template builder and the editor have to agree on about a
   template's blocks:

     - what a template's saved form holds (blocks and variables, and
       never the author's backpack);
     - which blocks are allowed in one, and which Workshop packs it needs;
     - how its blocks are added to somebody's project.

   **Where a block came from.** A project can hold three kinds of block:
   DisFuse's own, blocks from an installed Workshop pack, and BlockBuddy
   blocks, which belong to one person's account. Only the first two can
   go in a template — a BlockBuddy block can't be loaded by anybody else.
   Nothing in Blockly records which is which, so the two registration
   paths in Pages/Workspace/editor/customBlocks.js mark the definitions
   they create, and `blockSource` reads the mark back.
   ===================================================================== */

const PACK_MARK = "disfusePackId";
const BLOCKBUDDY_MARK = "disfuseBlockBuddy";

/** Records that these block types belong to a Workshop pack. */
export function markPackBlocks(packId, blocks = []) {
  for (const block of blocks) {
    const definition = Blockly.Blocks[block?.name];
    if (definition) definition[PACK_MARK] = String(packId);
  }
}

/** Records that these block types are somebody's BlockBuddy blocks. */
export function markBlockBuddyBlocks(types = []) {
  for (const type of types) {
    const definition = Blockly.Blocks[type];
    if (definition) definition[BLOCKBUDDY_MARK] = true;
  }
}

/**
 * Where a block type came from.
 *
 * @returns {{kind: "builtin"|"pack"|"blockbuddy"|"missing", packId?: string}}
 */
export function blockSource(type) {
  const definition = Blockly.Blocks[type];

  if (!definition) return { kind: "missing" };
  if (definition[BLOCKBUDDY_MARK]) return { kind: "blockbuddy" };
  if (definition[PACK_MARK])
    return { kind: "pack", packId: definition[PACK_MARK] };

  return { kind: "builtin" };
}

/* ---- The saved form --------------------------------------------------- */

/**
 * A workspace save cut down to what a template holds.
 *
 * Blockly's save includes whatever plugins register a serializer for,
 * and the backpack plugin registers one: a raw save carries the author's
 * backpack, and loading it into another workspace would replace *that*
 * person's backpack. The API strips it too; this keeps it off the wire.
 */
export function templateState(state) {
  const clean = {
    blocks: {
      languageVersion: state?.blocks?.languageVersion ?? 0,
      blocks: state?.blocks?.blocks ?? [],
    },
  };

  if (state?.variables?.length) clean.variables = state.variables;

  return clean;
}

/** A canvas as template data. */
export function serializeTemplate(workspace) {
  return JSON.stringify(
    templateState(Blockly.serialization.workspaces.save(workspace)),
  );
}

/** Some top blocks, and the variables they use, as template data. */
export function serializeBlocksAsTemplate(blocks, workspace) {
  const states = blocks.map((block) =>
    Blockly.serialization.blocks.save(block, { addCoordinates: true }),
  );

  /* Only the variables these blocks actually reference — a stack saved
     out of a big project shouldn't bring every variable in it along. */
  const used = new Set();
  for (const block of blocks)
    for (const descendant of block.getDescendants(false))
      for (const model of descendant.getVarModels?.() ?? [])
        used.add(model.getId());

  const variables = workspace
    .getAllVariables()
    .filter((variable) => used.has(variable.getId()))
    .map((variable) => ({
      name: variable.name,
      id: variable.getId(),
      ...(variable.type ? { type: variable.type } : {}),
    }));

  return JSON.stringify(
    templateState({ blocks: { blocks: states }, variables }),
  );
}

/** A template's data string as an object, or null when it has no blocks. */
export function parseTemplateData(data) {
  if (!data) return null;

  try {
    const parsed = typeof data === "string" ? JSON.parse(data) : data;
    return parsed?.blocks?.blocks?.length ? templateState(parsed) : null;
  } catch {
    return null;
  }
}

/** Every block type in some saved blocks, nested ones included. */
export function blockTypesIn(topBlocks = []) {
  const types = new Set();
  const stack = [...topBlocks];

  while (stack.length) {
    const block = stack.pop();
    if (!block || typeof block !== "object") continue;

    if (block.type) types.add(block.type);

    for (const input of Object.values(block.inputs ?? {})) {
      if (input?.block) stack.push(input.block);
      if (input?.shadow) stack.push(input.shadow);
    }

    if (block.next?.block) stack.push(block.next.block);
    if (block.next?.shadow) stack.push(block.next.shadow);
  }

  return types;
}

/**
 * Sorts a template's block types into what may go in it and what may not.
 *
 * @param {Iterable<string>} types
 * @param {object} [options]
 * @param {Set<string>} [options.privatePacks]  ids of private packs —
 *   their blocks can't be installed by anyone but their owner
 * @returns {{packs: string[], blockBuddy: string[], privatePack: string[], missing: string[]}}
 *   `packs` is the Workshop packs the template needs; the other three
 *   list block types that would stop it being published
 */
export function checkTemplateTypes(types, { privatePacks = new Set() } = {}) {
  const packs = new Set();
  const blockBuddy = [];
  const privatePack = [];
  const missing = [];

  for (const type of types) {
    const source = blockSource(type);

    if (source.kind === "missing") missing.push(type);
    else if (source.kind === "blockbuddy") blockBuddy.push(type);
    else if (source.kind === "pack") {
      if (privatePacks.has(source.packId)) privatePack.push(type);
      else packs.add(source.packId);
    }
  }

  return { packs: [...packs], blockBuddy, privatePack, missing };
}

/**
 * Why some blocks can't go in a template, in words — or null if they can.
 */
export function describeBlockedTypes({ blockBuddy, privatePack, missing }) {
  const reasons = [];

  if (blockBuddy.length)
    reasons.push(
      `BlockBuddy blocks belong to your account, so nobody else could load them: ${blockBuddy.join(", ")}.`,
    );

  if (privatePack.length)
    reasons.push(
      `These come from a private Workshop pack, which nobody else can install: ${privatePack.join(", ")}.`,
    );

  if (missing.length)
    reasons.push(`These blocks aren't available here: ${missing.join(", ")}.`);

  return reasons.length ? reasons.join(" ") : null;
}

/* ---- Importing ---------------------------------------------------------- */

/**
 * Where imported blocks should land: to the right of everything already
 * on the canvas, or at the top left of the view on an empty one — never
 * on top of someone's own blocks.
 */
function landingPoint(workspace) {
  if (workspace.getTopBlocks(false).length) {
    const box = workspace.getBlocksBoundingBox();
    return { x: box.right + 120, y: box.top };
  }

  const view = workspace.getMetricsManager?.()?.getViewMetrics(true);
  return view ? { x: view.left + 60, y: view.top + 60 } : { x: 40, y: 40 };
}

/**
 * Prepares one saved block for a workspace that isn't the one it was
 * saved from.
 *
 *   - Its id is dropped, so Blockly gives it a fresh one. Importing the
 *     same template twice must never produce two blocks sharing an id.
 *   - A variable reference is rewritten from the template's variable id
 *     to its name and type. Blockly then finds the project's variable of
 *     that name, or makes one — so a template's "coins" and the
 *     project's "coins" are the same variable, as anyone would expect.
 */
function prepareBlock(block, variablesById) {
  delete block.id;

  for (const [name, value] of Object.entries(block.fields ?? {})) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      variablesById.has(value.id)
    ) {
      const variable = variablesById.get(value.id);
      block.fields[name] = { name: variable.name, type: variable.type ?? "" };
    }
  }

  /* Function definitions keep their parameters as variables too. */
  if (Array.isArray(block.extraState?.params))
    for (const param of block.extraState.params)
      if (param && typeof param === "object" && variablesById.has(param.id))
        delete param.id;

  for (const input of Object.values(block.inputs ?? {})) {
    if (input?.block) prepareBlock(input.block, variablesById);
    if (input?.shadow) prepareBlock(input.shadow, variablesById);
  }

  if (block.next?.block) prepareBlock(block.next.block, variablesById);
  if (block.next?.shadow) prepareBlock(block.next.shadow, variablesById);
}

/**
 * Adds a template's blocks to a workspace, alongside whatever is there.
 *
 * One undo step: everything happens in a single event group, so Ctrl+Z
 * takes the whole import back out. The events are ordinary block-create
 * events, so autosave and collaborators see the new blocks exactly as if
 * they had been dragged in.
 *
 * Deliberately not `workspaces.load`, which clears the canvas first —
 * and clears the importer's backpack with it.
 *
 * Every block type must already be registered; check with
 * `blockTypesIn` + `blockSource` first, because a type Blockly doesn't
 * know throws halfway through.
 *
 * @returns {Blockly.BlockSvg[]} the new top blocks
 */
export function importTemplateBlocks(workspace, data) {
  const state = parseTemplateData(data);
  if (!state) throw new Error("This template has no blocks in it.");

  const variables = state.variables ?? [];
  const variablesById = new Map(
    variables.map((variable) => [variable.id, variable]),
  );

  /* The bot token used to be a block, and the editor deletes any it
     finds on opening a project. None should ever be imported. */
  const topBlocks = structuredClone(state.blocks.blocks).filter(
    (block) => block?.type !== "main_token",
  );

  if (!topBlocks.length) throw new Error("This template has no blocks in it.");

  /* Keep the template's own layout, moved to a clear spot as a group. */
  const minX = Math.min(...topBlocks.map((block) => Number(block.x) || 0));
  const minY = Math.min(...topBlocks.map((block) => Number(block.y) || 0));
  const origin = landingPoint(workspace);

  for (const block of topBlocks) {
    prepareBlock(block, variablesById);
    block.x = origin.x + ((Number(block.x) || 0) - minX);
    block.y = origin.y + ((Number(block.y) || 0) - minY);
  }

  const created = [];

  Blockly.Events.setGroup(true);

  try {
    /* Declared variables first, so ones the template declares but no
       block happens to use still arrive. */
    for (const variable of variables)
      if (!workspace.getVariable(variable.name, variable.type ?? ""))
        workspace.createVariable(variable.name, variable.type ?? "");

    for (const block of topBlocks)
      created.push(
        Blockly.serialization.blocks.append(block, workspace, {
          recordUndo: true,
        }),
      );
  } finally {
    Blockly.Events.setGroup(false);
  }

  const first = [...created].sort(
    (a, b) =>
      a.getRelativeToSurfaceXY().y - b.getRelativeToSurfaceXY().y ||
      a.getRelativeToSurfaceXY().x - b.getRelativeToSurfaceXY().x,
  )[0];

  if (first) workspace.centerOnBlock(first.id);

  return created;
}
