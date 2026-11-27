/* =====================================================================
   A sample block editor project made of every toolbox block
   ---------------------------------------------------------------------
   Each block is placed where it would really be used: event values
   inside their event, a step's values inside that step, everything else
   inside "when the bot logs in". Used by check-conversion.mjs (block
   editor → DisFuse Builder) and check-template-conversion.mjs (the way
   back).
   ===================================================================== */

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { BLOCK_TYPES, blockOf, blocksOfElement } from "../../src/elements/index.js";

/**
 * @param {object} args
 * @param {object} args.Blockly   with every DisFuse block registered
 * @param {object} args.catalog   the builder catalog
 * @param {string} args.root      the frontend's folder
 */
export function createToolboxProject({ Blockly, catalog, root }) {
  /* ---------------------------------------------------------------------
     Every toolbox block
     --------------------------------------------------------------------- */

  async function toolboxEntries() {
    const dir = path.join(root, "src/config/toolbox/categories");
    const entries = [];
    const walk = (node) => {
      if (!node) return;
      if (Array.isArray(node)) return node.forEach(walk);
      if (node.kind === "category") return (node.contents ?? []).forEach(walk);
      if (node.kind === "block") entries.push(node);
    };
    for (const file of fs.readdirSync(dir).sort()) walk((await import(pathToFileURL(path.join(dir, file)).href)).default);
    return entries;
  }

  /** A definition's blocks: its own, then the rest of its element's. */
  const typesOf = (def) => [...new Set([...(def.blocks ?? []), ...(def.pack ? [] : blocksOfElement(def.id))])];
  const byKind = (kind) => {
    const map = new Map();
    for (const def of catalog[kind].values()) for (const type of typesOf(def)) if (!map.has(type)) map.set(type, def);
    return map;
  };
  const byBlock = { events: byKind("events"), actions: byKind("actions"), values: byKind("values"), components: byKind("components") };

  /** Blocks that only make sense inside another block; checked through it. */
  const PIECES = new Set([
    ...byBlock.components.keys(),
    ...BLOCK_TYPES.filter((type) => blockOf(type).role === "item" || blockOf(type).spec.previous === "files"),
    "db_create",
    "slash_create_mutator",
    "contextMenu_create",
    "slash_addoption",
    "slash_addchoice",
    "slash_addsubcommand",
    "slash_addsubcommandgroup",
    "logic_case",
    "logic_default",
    "object_addkey",
    "poll_choice",
    "fetch_configSection",
  ]);

  function chain(list) {
    let next = null;
    for (let i = list.length - 1; i >= 0; i--) {
      const copy = structuredClone(list[i]);
      if (next) copy.next = { block: next };
      next = copy;
    }
    return next;
  }

  let counter = 0;
  const withIds = (json) => {
    const copy = structuredClone(json);
    const visit = (node) => {
      if (!node || typeof node !== "object") return;
      if (node.type && !node.id) node.id = `b${++counter}`;
      delete node.kind;
      for (const slot of Object.values(node.inputs ?? {})) {
        visit(slot?.block);
        visit(slot?.shadow);
      }
      visit(node.next?.block);
    };
    visit(copy);
    return copy;
  };

  const shapeOf = (type) => {
    const block = new Blockly.Workspace().newBlock(type);
    const shape = { output: Boolean(block.outputConnection), previous: Boolean(block.previousConnection) };
    const statements = block.inputList.filter((i) => i.type === 3).map((i) => i.name);
    return { ...shape, statements };
  };

  const setVariable = (valueJson) => ({
    type: "variables_set",
    fields: { VAR: { id: "var_sample" } },
    inputs: { VALUE: { block: valueJson } },
  });

  async function toolboxProject(onlyType = null) {
    const entries = (await toolboxEntries()).filter((e) => !onlyType || e.type === onlyType || JSON.stringify(e).includes(`"${onlyType}"`));
    const statements = [];
    const hats = new Map(); // event type → [value uses]
    const owners = new Map(); // action block type → [value uses inside it]
    const tops = [];

    for (const entry of entries) {
      if (!Blockly.Blocks[entry.type] || PIECES.has(entry.type)) continue;
      let shape;
      try {
        shape = shapeOf(entry.type);
      } catch {
        continue;
      }
      if (!shape.output && !shape.previous) {
        if (!hats.has(entry.type)) hats.set(entry.type, { entry, uses: [] });
        continue;
      }
      if (shape.previous) {
        statements.push(entry);
        continue;
      }
      /* A value: inside its event or step if it belongs to one. */
      const eventDef = byBlock.events.get(entry.type);
      const actionDef = byBlock.actions.get(entry.type);
      if (eventDef && !byBlock.values.has(entry.type)) {
        const hatType = typesOf(eventDef).find((t) => !shapeOfSafe(t)?.output && !shapeOfSafe(t)?.previous);
        if (hatType) {
          if (!hats.has(hatType)) hats.set(hatType, { entry: { type: hatType }, uses: [] });
          hats.get(hatType).uses.push(setVariable(entry));
        }
      } else if (actionDef && !byBlock.values.has(entry.type)) {
        const ownerType = typesOf(actionDef).find((t) => shapeOfSafe(t)?.previous);
        if (ownerType) {
          if (!owners.has(ownerType)) owners.set(ownerType, []);
          owners.get(ownerType).push(setVariable(entry));
        }
      } else statements.push(setVariable(entry));
    }

    /* Steps whose values live inside them get those values in their section. */
    for (const statement of statements) {
      const uses = owners.get(statement.type);
      if (!uses) continue;
      const block = new Blockly.Workspace().newBlock(statement.type);
      const name = block.inputList.find(
        (input) => input.type === Blockly.inputs.inputTypes.STATEMENT && (!input.connection.getCheck() || input.connection.getCheck().includes("default")),
      )?.name;
      block.workspace.dispose();
      if (name) statement.inputs = { ...(statement.inputs ?? {}), [name]: { block: chain(uses) } };
    }

    tops.push({ type: "main_ready", inputs: { event: { block: chain(statements) } } });
    for (const [type, { entry, uses }] of hats) {
      const shape = shapeOfSafe(type);
      const body = shape?.statements?.[0];
      tops.push({ ...entry, inputs: { ...(entry.inputs ?? {}), ...(body && uses.length ? { [body]: { block: chain(uses) } } : {}) } });
    }

    return [{ name: "toolbox", data: JSON.stringify({ blocks: { blocks: tops.map(withIds) }, variables: [{ id: "var_sample", name: "sample" }] }) }];
  }

  function shapeOfSafe(type) {
    try {
      return Blockly.Blocks[type] ? shapeOf(type) : null;
    } catch {
      return null;
    }
  }


  return { toolboxProject, chain, withIds, shapeOf, shapeOfSafe, byBlock, typesOf, PIECES };
}
