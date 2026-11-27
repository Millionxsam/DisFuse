/* =====================================================================
   DisFuse Builder: block packs in the catalog
   ---------------------------------------------------------------------
   A Workshop pack is built one of two ways (model/packs.js), but either
   kind works in every project. This file is what lets a BLOCK pack (made
   in the Blockly workshop) be used in a DisFuse Builder project: each
   of its blocks becomes an ordinary event, step or value, made with the
   same defineEvent / defineAction / defineValue as the built-in catalog.

     output block   → a value
     stack block    → a step (an "end" block is a step nothing follows)
     hat block      → an event; its first section is the event's steps
     no connections → an event with no steps of its own

   A block's fields and inputs become the step's inputs: a text box stays
   a text box, a value input becomes a text, number or true/false input
   (or a slot for anything else), and a statement input becomes a
   section. Its id is made from its name, so a block keeps the same id in
   every version of the pack:

     pk_<packId>_b<hash of the block's name>

   Each definition lists the block's name in `blocks`, which is how "Copy
   to DisFuse Builder" turns the block into this step (convert/
   fromBlocks.js), and the way back (convert/toBlocks.js) finds the block.
   `blockNames` remembers which input came from which field or input, as
   their names have to be cleaned up into input keys.

   THE CODE
   --------
   A block pack's generator is JavaScript that builds the block's code:
   `"send(" + generator.valueToCode(block, "TEXT", Order.ATOMIC) + ")"`.
   It's run here with a stand-in `block` and `generator` that answer from
   the builder's ctx, with the same mapping the README describes for the
   built-in catalog:

     generator.valueToCode(block, name)   →  ctx.code(key)
     block.getFieldValue(name)            →  ctx.raw(key)
     generator.statementToCode(block, n)  →  ctx.branch(key)

   This is the same trust model the block editor has always had for
   Workshop packs: a pack you use can run code in your editor.

   No DOM, explicit `.js` imports: the check script can load it in Node.
   ===================================================================== */

import { defineAction, defineEvent, defineValue, input } from "./define.js";

/* Blockly's JavaScript operator precedences (blockly/javascript `Order`).
   Generators only pass them through; the builder doesn't need them. */
const ORDER = {
  ATOMIC: 0, NEW: 1.1, MEMBER: 1.2, FUNCTION_CALL: 2, INCREMENT: 3, DECREMENT: 3,
  BITWISE_NOT: 4.1, UNARY_PLUS: 4.2, UNARY_NEGATION: 4.3, LOGICAL_NOT: 4.4, TYPEOF: 4.5,
  VOID: 4.6, DELETE: 4.7, AWAIT: 4.8, EXPONENTIATION: 5, MULTIPLICATION: 5.1, DIVISION: 5.2,
  MODULUS: 5.3, SUBTRACTION: 6.1, ADDITION: 6.2, BITWISE_SHIFT: 7, RELATIONAL: 8, IN: 8,
  INSTANCEOF: 8, EQUALITY: 9, BITWISE_AND: 10, BITWISE_XOR: 11, BITWISE_OR: 12,
  LOGICAL_AND: 13, LOGICAL_OR: 14, CONDITIONAL: 15, ASSIGNMENT: 16, YIELD: 17, COMMA: 18,
  NONE: 99,
};

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

/** A short, stable hash of some text, in base 36. */
function hash(text, seed) {
  let h = seed >>> 0;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h.toString(36);
}

/** The item id a block pack's block gets: the same for the same name, always. */
export function blockItemId(name) {
  const text = String(name ?? "");
  return `b${hash(text, 2166136261)}${hash(text, 3735928559)}`;
}

/** "my_cool-block" → "My cool block" */
function humanize(name) {
  const words = String(name ?? "")
    .replace(/[_.-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  return words ? words[0].toUpperCase() + words.slice(1) : "Block";
}

const cleanLabel = (text) => String(text ?? "").replace(/\s+/g, " ").trim().replace(/[:\s]+$/, "");

/** An input key from a field or input name: letters, numbers and _. */
function keyFrom(name, taken) {
  let key = String(name ?? "").replace(/[^A-Za-z0-9_]/g, "_").slice(0, 60);
  if (!key || /^\d/.test(key)) key = `_${key}`;
  if (["id", "steps", "raw"].includes(key)) key = `${key}_`;
  let candidate = key;
  for (let n = 2; taken.has(candidate); n++) candidate = `${key}${n}`;
  taken.add(candidate);
  return candidate;
}

/** A value input's check, as builder types (types.js). */
function acceptsFor(check) {
  const list = (Array.isArray(check) ? check : [check]).filter((c) => typeof c === "string" && c && c !== "null");
  return list.length ? list : null;
}

function number(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/* ---------------------------------------------------------------------
   Reading a block's definition
   --------------------------------------------------------------------- */

/**
 * What a block pack block is made of, read from its saved definition.
 *
 * @returns {{ label, parts: Array<{ name, key, kind: "field"|"value"|"statement", field?, check?, label }> }}
 */
export function readBlockShape(block) {
  const parts = [];
  const taken = new Set();
  const labels = [];

  for (const blockInput of Array.isArray(block?.inputs) ? block.inputs : []) {
    if (!isObject(blockInput)) continue;
    let lastLabel = "";
    const inputLabels = [];
    for (const field of Array.isArray(blockInput.fields) ? blockInput.fields : []) {
      if (!isObject(field)) continue;
      if (field.type === "label") {
        lastLabel = cleanLabel(field.text);
        if (lastLabel) {
          labels.push(lastLabel);
          inputLabels.push(lastLabel);
        }
        continue;
      }
      if (!field.name) continue;
      parts.push({
        name: String(field.name),
        key: keyFrom(field.name, taken),
        kind: "field",
        field,
        label: lastLabel || humanize(field.name),
      });
    }
    if ((blockInput.type === "value" || blockInput.type === "statement") && blockInput.name)
      parts.push({
        name: String(blockInput.name),
        key: keyFrom(blockInput.name, taken),
        kind: blockInput.type,
        check: blockInput.check ?? null,
        label: inputLabels.join(" ") || humanize(blockInput.name),
      });
  }

  /* The block's leading text is what it does ("say hello to"); later
     labels name its inputs. An input that's only labelled by that text
     is named after itself instead, so it doesn't repeat the step's name. */
  const lead = cleanLabel(labels[0] ?? "").slice(0, 80);
  const label = lead ? lead[0].toUpperCase() + lead.slice(1) : humanize(block?.name);
  for (const part of parts) if (lead && part.label.toLowerCase() === lead.toLowerCase()) part.label = humanize(part.name);
  return { label, parts };
}

/** A builder input for one field or value input of a block. */
function inputFor(part) {
  if (part.kind === "value") {
    const accepts = acceptsFor(part.check);
    const only = accepts?.length === 1 ? accepts[0] : null;
    /* Empty, like an empty block input, so `code || "default"` in the
       generator keeps working. */
    if (only === "String") return input.text(part.key, part.label, { optional: true });
    if (only === "Number") return input.number(part.key, part.label, { optional: true });
    if (only === "Boolean") return input.boolean(part.key, part.label);
    return input.slot(part.key, part.label, accepts, { optional: true });
  }

  const field = part.field;
  switch (field.type) {
    case "numericInput": {
      const min = number(field.min);
      const max = number(field.max);
      return input.number(part.key, part.label, {
        default: number(field.defaultValue) ?? 0,
        ...(min !== null ? { min } : {}),
        ...(max !== null ? { max } : {}),
        allowValues: false,
      });
    }
    case "checkbox":
      return input.boolean(part.key, part.label, {
        default: String(field.defaultValue).toUpperCase() === "TRUE",
        allowValues: false,
      });
    case "dropdown": {
      const choices = (Array.isArray(field.choices) ? field.choices : [])
        .filter((choice) => Array.isArray(choice) && choice.length >= 2)
        .map(([label, value]) => [String(label || value || " "), String(value ?? "")]);
      return input.dropdown(part.key, part.label, choices.length ? choices : [["(none)", ""]]);
    }
    case "variable":
      return input.variable(part.key, part.label);
    case "textInput":
    default:
      return input.text(part.key, part.label, { default: String(field.defaultValue ?? ""), allowValues: false });
  }
}

/* ---------------------------------------------------------------------
   Running a block's generator against a builder ctx
   --------------------------------------------------------------------- */

/** Compiles a block pack generator, or null if it doesn't compile. */
function compileGenerator(block) {
  const source = String(block?.outputCode ?? "null");
  try {
    // eslint-disable-next-line no-new-func
    return new Function("block", "generator", "Order", block.type === "output" ? `return [${source}, Order.NONE]` : `return ${source};`);
  } catch {
    return null;
  }
}

/**
 * The code a block pack block's generator writes, given a builder ctx.
 *
 * @param {Function} generate  from compileGenerator
 * @param {object} block       the block's saved definition
 * @param {Map} parts          block field/input name → part
 * @param {object} ctx         the builder's ctx
 * @param {object} [options]
 * @param {string} [options.body]      what the event's steps are (events)
 * @param {string} [options.bodyInput] the statement input that holds them
 */
function runGenerator(generate, block, parts, ctx, { body, bodyInput } = {}) {
  const part = (name) => parts.get(String(name));
  const stand = {
    id: String(ctx.id ?? ctx.uid ?? ""),
    type: block.name,
    getFieldValue(name) {
      const found = part(name);
      if (!found) return null;
      if (found.field?.type === "variable") return ctx.input(found.key);
      const raw = ctx.raw(found.key);
      if (found.field?.type === "checkbox") return raw ? "TRUE" : "FALSE";
      return raw ?? null;
    },
    getField(name) {
      const found = part(name);
      return found?.kind === "field" ? { getValue: () => stand.getFieldValue(name), getText: () => String(stand.getFieldValue(name) ?? "") } : null;
    },
    getInput(name) {
      return part(name) && part(name).kind !== "field" ? { name } : null;
    },
    getInputTargetBlock(name) {
      const found = part(name);
      if (!found || found.kind === "field") return null;
      if (found.kind === "statement") return found.name === bodyInput ? (body ? {} : null) : ctx.hasBranch(found.key) ? {} : null;
      return ctx.has(found.key) ? {} : null;
    },
  };

  const generator = {
    INDENT: "  ",
    valueToCode(_block, name) {
      const found = part(name);
      if (!found || found.kind !== "value") return "";
      return ctx.code(found.key);
    },
    statementToCode(_block, name) {
      const found = part(name);
      if (!found || found.kind !== "statement") return "";
      if (found.name === bodyInput) return body ?? "";
      return ctx.branch(found.key);
    },
    prefixLines: (text, prefix) => String(text ?? "").replace(/^(?=.)/gm, prefix),
    quote_: (text) => JSON.stringify(String(text ?? "")),
    getVariableName: (name) => name,
    nameDB_: { getName: (name) => name, getDistinctName: (name) => `${name}${ctx.uid}` },
    blockToCode: () => "",
    provideFunction_: (name) => name,
  };

  const result = generate(stand, generator, ORDER);
  const code = Array.isArray(result) ? result[0] : result;
  return typeof code === "string" ? code : code === null || code === undefined ? "" : String(code);
}

/* ---------------------------------------------------------------------
   The definitions
   --------------------------------------------------------------------- */

/**
 * One block pack block as a catalog definition.
 *
 * @returns {{ kind: "event"|"action"|"value", def: object }}
 */
function compileBlock(pack, block, { categoryId, itemType }) {
  const { label, parts } = readBlockShape(block);
  const byName = new Map(parts.map((part) => [part.name, part]));
  const generate = compileGenerator(block);
  if (!generate) throw new Error("its code doesn't compile");

  const statements = parts.filter((part) => part.kind === "statement");
  const inputs = parts.filter((part) => part.kind !== "statement").map(inputFor);

  const base = {
    id: itemType(blockItemId(block.name)),
    label,
    description: String(block.description ?? "").slice(0, 400),
    category: "custom",
    icon: { output: "fa-solid fa-circle-dot", hat: "fa-solid fa-bolt", none: "fa-solid fa-bolt" }[block.type] ?? "fa-solid fa-cube",
    keywords: [pack.name, block.name, "workshop", "pack"].filter(Boolean),
    blocks: [String(block.name)],
    dependencies: (pack.dependencies ?? []).filter((d) => typeof d === "string" && d.trim()).map((d) => ({ package: d.trim(), code: "" })),
    setup: [],
    pack: { id: pack._id, name: pack.name },
    blockNames: Object.fromEntries(parts.map((part) => [part.key, part.name])),
  };

  if (block.type === "output")
    return {
      kind: "value",
      def: { ...defineValue({ ...base, output: acceptsFor(block.output), inputs, code: (ctx) => runGenerator(generate, block, byName, ctx) }), category: categoryId },
    };

  if (block.type === "hat" || block.type === "none") {
    /* A hat's first section is its steps. One with no section runs
       whatever is stacked under it, right after its own code. */
    const bodyInput = statements[0]?.name ?? null;
    const settings = [...inputs];
    return {
      kind: "event",
      def: {
        ...defineEvent({
          ...base,
          settings,
          packBody: bodyInput ? "input" : block.type === "hat" ? "next" : "none",
          wrap: (ctx, body) => {
            const code = runGenerator(generate, block, byName, ctx, { body, bodyInput });
            return bodyInput ? code : `${code}\n${body ?? ""}`;
          },
        }),
        category: categoryId,
      },
    };
  }

  return {
    kind: "action",
    def: {
      ...defineAction({
        ...base,
        inputs,
        branches: statements.map((part) => ({ key: part.key, label: part.label })),
        ...(block.type === "end" ? { terminal: true } : {}),
        code: (ctx) => runGenerator(generate, block, byName, ctx),
      }),
      category: categoryId,
    },
  };
}

/**
 * Every block of a block pack's latest version, as definitions.
 *
 * @param {object} pack      a pack from GET /workshop/:id
 * @param {object} category  its category (catalog/packs.js makes it)
 * @param {(itemId: string) => string} itemType  the catalog id for an item
 * @returns {{ events, actions, values, problems: string[] }}
 */
export function compileBlockPack(pack, category, itemType) {
  const out = { events: [], actions: [], values: [], problems: [] };
  const latest = pack?.versions?.[pack.versions.length - 1];
  const seen = new Set();
  for (const block of Array.isArray(latest?.blocks) ? latest.blocks : []) {
    if (!isObject(block) || !block.name || seen.has(block.name)) continue;
    seen.add(block.name);
    try {
      const { kind, def } = compileBlock(pack, block, { categoryId: category.id, itemType });
      /* An archived block keeps working where it's used, but the
         pickers don't offer it any more (like the block editor's toolbox). */
      out[`${kind}s`].push(block.archived ? { ...def, hidden: true } : def);
    } catch (error) {
      out.problems.push(`${block.name}: ${error.message}`);
    }
  }
  return out;
}
