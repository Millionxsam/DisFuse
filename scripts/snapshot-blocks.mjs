#!/usr/bin/env node
/* =====================================================================
   Block editor snapshot
   ---------------------------------------------------------------------
   Run:  node scripts/snapshot-blocks.mjs <out.json>
         node scripts/snapshot-blocks.mjs --compare <before.json> [<after.json>]

   Records every registered block's shape (inputs, fields, checks,
   connections, colour, inline-ness, extra state), every toolbox entry
   loaded the way the toolbox loads it, and the code each one generates.
   `--compare` diffs two snapshots: any shape difference is a breaking
   change; code differences are listed for review.
   ===================================================================== */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadBlocks } from "./lib/blocks-node.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);

if (args[0] === "--compare") {
  const before = JSON.parse(fs.readFileSync(args[1], "utf8"));
  let after;
  if (args[2]) after = JSON.parse(fs.readFileSync(args[2], "utf8"));
  else after = await snapshot();
  process.exit(compare(before, after) ? 1 : 0);
}

const out = args[0] ?? "blocks-snapshot.json";
fs.writeFileSync(out, JSON.stringify(await snapshot(), null, 1));
console.log(`Wrote ${out}`);

async function snapshot() {
  const { Blockly, javascriptGenerator } = await loadBlocks();
  const { restrictions } = await import(pathToFileURL(path.join(root, "src/blocks/lib/restrictions.js")).href);
  const { DEPRECATED_TYPES } = await import(pathToFileURL(path.join(root, "src/blocks/deprecated/index.js")).href);
  const workspace = new Blockly.Workspace();

  const fieldShape = (field) => {
    const shape = { name: field.name ?? null, cls: field.constructor?.name };
    try {
      shape.value = field instanceof Blockly.FieldVariable ? field.getText() : field.getValue();
    } catch {
      shape.value = "?";
    }
    if (field instanceof Blockly.FieldDropdown) {
      try {
        shape.options = typeof field.menuGenerator_ === "function" ? "fn" : field.getOptions(false);
      } catch {
        shape.options = "?";
      }
    }
    if (field instanceof Blockly.FieldLabel) shape.text = field.getText();
    if (field.EDITABLE === false) shape.editable = false;
    if (field.getValidator?.()) shape.validator = true;
    if (field.isVisible && !field.isVisible()) shape.hidden = true;
    return shape;
  };

  const blockShape = (block) => {
    const definition = Blockly.Blocks[block.type] ?? {};
    let tooltip = block.tooltip;
    if (typeof tooltip === "function") {
      try {
        tooltip = `fn:${tooltip.call(block)}`;
      } catch {
        tooltip = "fn";
      }
    }
    const conn = (c) => (c ? { check: c.getCheck() } : null);
    return {
      colour: block.getColour(),
      style: block.getStyleName?.() ?? null,
      tooltip: tooltip ?? null,
      helpUrl: typeof block.helpUrl === "function" ? "fn" : block.helpUrl ?? null,
      inputsInline: block.inputsInline ?? null,
      output: conn(block.outputConnection),
      previous: conn(block.previousConnection),
      next: conn(block.nextConnection),
      deletable: block.isDeletable(),
      movable: block.isMovable(),
      editable: block.isEditable(),
      mutator: Boolean(block.mutator),
      onchange: typeof block.onchange === "function",
      warning: Boolean(block.warning ?? block.getIcon?.("warning")),
      methods: Object.keys(definition).sort(),
      inputs: block.inputList.map((input) => ({
        type: input.type,
        name: input.name,
        check: input.connection ? input.connection.getCheck() : undefined,
        align: input.align,
        visible: input.isVisible(),
        shadow: stripIds(input.connection?.getShadowState?.() ?? null),
        fields: input.fieldRow.map(fieldShape),
      })),
      extraState: safe(() => (block.saveExtraState ? block.saveExtraState() : block.mutationToDom ? Blockly.Xml.domToText(block.mutationToDom()) : null)),
    };
  };

  const codeOf = (block) =>
    safe(() => {
      javascriptGenerator.init(workspace);
      const code = javascriptGenerator.blockToCode(block);
      return Array.isArray(code) ? { expr: code[0], order: code[1] } : code;
    });

  const types = Object.keys(Blockly.Blocks).sort();
  const blocks = {};
  for (const type of types) {
    let block;
    try {
      block = workspace.newBlock(type);
    } catch (error) {
      blocks[type] = { error: String(error.message) };
      continue;
    }
    blocks[type] = {
      shape: blockShape(block),
      hasGenerator: Boolean(javascriptGenerator.forBlock[type]),
      restrictions: withSources(restrictions[type] ?? null),
      code: codeOf(block),
      save: safe(() => stripIds(Blockly.serialization.blocks.save(block))),
    };
    block.dispose(false);
  }

  /* Every toolbox entry, loaded as the flyout loads it. */
  const toolbox = {};
  const dir = path.join(root, "src/config/toolbox/categories");
  const entries = [];
  const walk = (node, where) => {
    if (!node) return;
    if (Array.isArray(node)) return node.forEach((n) => walk(n, where));
    if (node.kind === "category") return (node.contents ?? []).forEach((n) => walk(n, `${where}/${node.name}`));
    if (node.kind === "block") entries.push({ where, node });
  };
  for (const file of fs.readdirSync(dir).sort()) walk((await import(pathToFileURL(path.join(dir, file)).href)).default, file);
  const deep = (block) => ({
    type: block.type,
    shape: blockShape(block),
    children: block.getChildren(true).map(deep),
  });
  entries.forEach(({ where, node }, i) => {
    const key = `${where}#${i}:${node.type}`;
    try {
      const block = Blockly.serialization.blocks.append(node, workspace);
      toolbox[key] = { tree: deep(block), code: codeOf(block), save: stripIds(Blockly.serialization.blocks.save(block)) };
      block.dispose(false);
    } catch (error) {
      toolbox[key] = { error: String(error.message) };
    }
  });

  return { blocks, toolbox, deprecated: [...DEPRECATED_TYPES].sort() };
}

/** Restrictions with their functions as source, so a lost check shows up. */
function withSources(list) {
  if (!list) return null;
  return list.map((rule) =>
    Object.fromEntries(Object.entries(rule).map(([k, v]) => [k, typeof v === "function" ? `fn:${String(v).replace(/\s+/g, "").replace(/[;,]\}/g, "}").replace(/\((\w+)\)=>/g, "$1=>").replace(/,\)/g, ")")}` : v])),
  );
}

/** Saved JSON without the random ids Blockly gives new blocks and variables. */
function stripIds(value) {
  if (Array.isArray(value)) return value.map(stripIds);
  if (!value || typeof value !== "object") return value;
  const out = {};
  for (const [k, v] of Object.entries(value)) if (k !== "id") out[k] = stripIds(v);
  return out;
}

function safe(fn) {
  try {
    return fn() ?? null;
  } catch (error) {
    return { error: String(error?.message ?? error) };
  }
}

/** Toolbox keys without the running index, so adding an entry doesn't move the others. */
function rekey(toolbox) {
  const seen = {};
  return Object.fromEntries(
    Object.entries(toolbox).map(([key, value]) => {
      const base = key.replace(/#\d+:/, ":");
      seen[base] = (seen[base] ?? 0) + 1;
      return [`${base}#${seen[base]}`, value];
    }),
  );
}

function compare(before, after) {
  before = { ...before, toolbox: rekey(before.toolbox) };
  after = { ...after, toolbox: rekey(after.toolbox) };
  let breaking = 0;
  const codeChanges = [];
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  for (const [type, b] of Object.entries(before.blocks)) {
    const a = after.blocks[type];
    if (!a) {
      console.log(`✘ removed block: ${type}`);
      breaking++;
      continue;
    }
    for (const key of ["error", "shape", "hasGenerator", "restrictions", "save"]) {
      if (key === "shape" && b.shape && a.shape) {
        for (const part of Object.keys(b.shape)) {
          if (part === "methods") continue;
          if (!eq(b.shape[part], a.shape[part])) {
            console.log(`✘ ${type} shape.${part}\n    before: ${JSON.stringify(b.shape[part])}\n    after:  ${JSON.stringify(a.shape[part])}`);
            breaking++;
          }
        }
      } else if (key === "hasGenerator" && b[key] === false && a[key] === true) {
        console.log(`+ ${type} now has a generator (it had none)`);
      } else if (!eq(b[key], a[key])) {
        console.log(`✘ ${type} ${key}\n    before: ${JSON.stringify(b[key])}\n    after:  ${JSON.stringify(a[key])}`);
        breaking++;
      }
    }
    if (!eq(b.code, a.code)) codeChanges.push(type);
  }
  for (const type of Object.keys(after.blocks)) if (!before.blocks[type]) console.log(`+ new block: ${type}`);
  for (const key of Object.keys(after.toolbox)) if (!before.toolbox[key]) console.log(`+ new toolbox entry: ${key}`);
  for (const [key, b] of Object.entries(before.toolbox)) {
    const a = after.toolbox[key];
    if (!a || !eq(noMethods(b.tree), noMethods(a.tree)) || !eq(b.save, a.save) || !eq(b.error, a.error)) {
      console.log(`✘ toolbox ${key} differs`);
      breaking++;
    } else if (!eq(b.code, a.code)) codeChanges.push(`toolbox ${key}`);
  }
  if (!eq(before.deprecated, after.deprecated)) {
    console.log("✘ deprecated list differs");
    breaking++;
  }
  if (process.env.SHOW_CODE) for (const key of codeChanges) {
    const [b, a] = key.startsWith("toolbox ") ? [before.toolbox[key.slice(8)], after.toolbox[key.slice(8)]] : [before.blocks[key], after.blocks[key]];
    console.log(`~ ${key}\n--- before\n${fmt(b.code)}\n--- after\n${fmt(a.code)}`);
  }
  console.log(`\n${breaking} breaking difference(s); ${codeChanges.length} code change(s) (SHOW_CODE=1 to list).`);
  return breaking > 0;
}

/** A toolbox tree without each block's method names (helpers may be added). */
function noMethods(tree) {
  if (!tree) return tree;
  const { methods, ...shape } = tree.shape ?? {};
  return { ...tree, shape, children: (tree.children ?? []).map(noMethods) };
}

function fmt(code) {
  return typeof code === "string" ? code : JSON.stringify(code);
}
