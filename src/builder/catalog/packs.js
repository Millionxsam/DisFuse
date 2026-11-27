/* =====================================================================
   DisFuse Builder: Workshop packs in the catalog
   ---------------------------------------------------------------------
   Every Workshop pack works in DisFuse Builder projects, whichever way it
   was made. A builder pack (model/packs.js) is a list of events, steps
   and values written as forms and code templates; a block pack is a list
   of Blockly blocks, which ./blockPacks.js reads. Either way, the latest
   published version of each pack becomes ordinary definitions, made with
   the same defineEvent / defineAction / defineValue as the built-in
   catalog, so the pickers, checks and code generation treat them like
   any other.

   Every pack gets a category of its own, in the pack's color, under a
   "Workshop" heading in the pickers. Ids are made from the pack's id and
   the item's, so they stay the same across versions:

     category  pk_<packId>
     item      pk_<packId>_<itemId>

   Code templates are filled in with ctx (codegen/context.js): {{name}}
   is ctx.input(name), {{raw:name}} ctx.raw(name), {{steps:name}}
   ctx.branch(name). Nothing a builder pack contains is run in the editor.

   The block editor uses builder packs as blocks of the same id
   (Pages/Workspace/editor/builderPackBlocks.js). Each value an event or
   a section provides is a block of its own there, `packValueBlockType`,
   and its definition says so (`block`), so "Copy to DisFuse Builder" can
   turn that block back into the value.

   No DOM, explicit `.js` imports: the check script can load it in Node.
   ===================================================================== */

import { allPackItems, cleanPackItems, packType, PLACEHOLDER } from "../model/packs.js";
import { compileBlockPack } from "./blockPacks.js";
import { defineAction, defineEvent, defineValue, input } from "./define.js";

export const WORKSHOP_SECTION = "Workshop";

const DEFAULT_COLOR = "#014f98";
const PACK_ID = /^[a-f0-9]{24}$/;

export const packCategoryId = (packId) => `pk_${packId}`;
export const packItemType = (packId, itemId) => `pk_${packId}_${itemId}`;
/** The block editor's block for a value an event or a step's section provides. */
export const packValueBlockType = (itemType, key) => `${itemType}__${key}`;

/** The ids of every pack a saved builder (or template) uses. */
export function packIdsUsed(builder) {
  const ids = new Set();
  for (const match of JSON.stringify(builder ?? {}).matchAll(/"pk_([a-f0-9]{24})_[a-z0-9]+"/g)) ids.add(match[1]);
  return [...ids];
}

/** The latest published version of a builder pack, or null. */
export function latestPackItems(pack) {
  if (packType(pack) !== "builder") return null;
  const latest = pack.versions?.[pack.versions.length - 1];
  return latest?.items ? cleanPackItems(latest.items) : null;
}

/** Whether a pack of either kind has a published version with something in it. */
export function packIsUsable(pack) {
  if (packType(pack) === "builder") return Boolean(latestPackItems(pack));
  const latest = pack?.versions?.[pack.versions.length - 1];
  return Array.isArray(latest?.blocks) && latest.blocks.length > 0;
}

/** Fills a code template. `resolve(prefix, name)` returns the code for one placeholder. */
export function fillTemplate(template, resolve) {
  return String(template ?? "").replace(PLACEHOLDER, (_, prefix, name) => String(resolve(prefix ?? "", name) ?? ""));
}

/* ---------------------------------------------------------------------
   Pieces
   --------------------------------------------------------------------- */

function toInput(spec) {
  const common = {
    ...(spec.help ? { help: spec.help } : {}),
    ...(spec.placeholder ? { placeholder: spec.placeholder } : {}),
    ...(spec.optional ? { optional: true } : {}),
  };
  switch (spec.kind) {
    case "number":
      return input.number(spec.key, spec.label, {
        ...common,
        ...(spec.default !== null && spec.default !== undefined ? { default: spec.default } : {}),
        ...(spec.min !== null && spec.min !== undefined ? { min: spec.min } : {}),
        ...(spec.max !== null && spec.max !== undefined ? { max: spec.max } : {}),
      });
    case "boolean":
      return input.boolean(spec.key, spec.label, { ...common, default: spec.default === true });
    case "dropdown": {
      const options = spec.options.map((o) => [o.label, o.value]);
      const fallback = spec.options[0]?.value ?? "";
      return input.dropdown(spec.key, spec.label, options, {
        ...common,
        default: spec.options.some((o) => o.value === spec.default) ? spec.default : fallback,
      });
    }
    case "colour":
      return input.colour(spec.key, spec.label, { ...common, default: spec.default });
    case "slot":
      return input.slot(spec.key, spec.label, spec.accepts ?? null, common);
    case "code":
      return input.code(spec.key, spec.label, { ...common, default: spec.default ?? "" });
    case "text":
    default:
      return input.text(spec.key, spec.label, { ...common, default: spec.default ?? "", ...(spec.multiline ? { multiline: true } : {}) });
  }
}

function provided(list, idSuffix = "", ownerType = null) {
  return list.map((value) => ({
    key: value.key,
    label: value.label,
    type: value.type ?? null,
    code: fillTemplate(value.code, (prefix, name) => (!prefix && name === "id" ? idSuffix : `{{${prefix ? `${prefix}:` : ""}${name}}}`)),
    ...(value.description ? { description: value.description } : {}),
    ...(ownerType ? { block: packValueBlockType(ownerType, value.key) } : {}),
  }));
}

/** The resolver shared by steps, values and events. */
function resolver(ctx, { id, body } = {}) {
  return (prefix, name) => {
    if (prefix === "steps") return ctx.branch(name);
    if (prefix === "raw") return ctx.raw(name) ?? "";
    if (name === "id") return id;
    if (name === "steps") return body ?? "";
    return ctx.input(name);
  };
}

function common(pack, item, kind) {
  const keywords = [pack.name, "workshop", "pack"].filter(Boolean);
  return {
    id: packItemType(pack._id, item.id),
    label: item.label,
    description: item.description,
    /* Validated against the built-in categories; swapped for the pack's own below. */
    category: "custom",
    ...(item.group ? { group: item.group } : {}),
    icon: item.icon || { event: "fa-solid fa-bolt", action: "fa-solid fa-cube", value: "fa-solid fa-circle-dot" }[kind],
    keywords,
    /* Its block in the block editor has the same id. */
    blocks: [packItemType(pack._id, item.id)],
    dependencies: (pack.dependencies ?? []).filter((d) => typeof d === "string" && d.trim()).map((d) => ({ package: d.trim(), code: "" })),
    setup: pack.setupCode ? [{ key: `pack:${pack._id}`, code: pack.setupCode }] : [],
    pack: { id: pack._id, name: pack.name },
  };
}

function compile(pack, kind, item) {
  const base = common(pack, item, kind);

  if (kind === "value")
    return defineValue({
      ...base,
      output: item.output ?? null,
      requires: item.requires,
      inputs: item.inputs.map(toInput),
      code: (ctx) => fillTemplate(item.code, resolver(ctx, { id: `_v${ctx.uid}` })),
    });

  if (kind === "action")
    return defineAction({
      ...base,
      requires: item.requires,
      inputs: item.inputs.map(toInput),
      branches: item.branches.map((branch) => ({
        key: branch.key,
        label: branch.label,
        ...(branch.optional ? { optional: true } : {}),
        provides: provided(branch.provides, "@@", base.id),
      })),
      code: (ctx) => fillTemplate(item.code, resolver(ctx, { id: ctx.local("") })),
    });

  const params = item.params.filter(Boolean);
  const event = {
    ...base,
    params,
    once: item.once,
    provides: item.provides,
    values: provided(item.values, "", base.id),
    settings: item.settings.map(toInput),
    ...(item.prelude.trim() ? { prelude: (ctx) => fillTemplate(item.prelude, resolver(ctx, { id: ctx.local("") })) + "\n" } : {}),
  };
  if (item.mode === "custom") event.wrap = (ctx, body) => fillTemplate(item.code, resolver(ctx, { id: ctx.local(""), body }));
  else event.listen = JSON.stringify(item.listen);
  return defineEvent(event);
}

/* ---------------------------------------------------------------------
   The catalog
   --------------------------------------------------------------------- */

/**
 * One pack's category and definitions.
 *
 * @param {object} pack  a pack from GET /workshop/:id
 * @param {object} [items]  items to use instead of the latest version (the
 *   pack editor's preview of a draft)
 * @returns {{ category, events: object[], actions: object[], values: object[], problems: string[] }}
 */
export function compilePack(pack, items = latestPackItems(pack)) {
  const out = { category: null, events: [], actions: [], values: [], problems: [] };
  if (!PACK_ID.test(String(pack?._id ?? ""))) return out;
  const blocks = packType(pack) === "blocks";
  if (blocks ? !packIsUsable(pack) : !items) return out;

  const category = {
    id: packCategoryId(pack._id),
    label: pack.name || "Pack",
    icon: "fa-solid fa-cubes-stacked",
    color: /^#[0-9a-fA-F]{6}$/.test(pack.color ?? "") ? pack.color : DEFAULT_COLOR,
    section: WORKSHOP_SECTION,
    pack: { id: pack._id, name: pack.name, version: pack.versions?.[pack.versions.length - 1]?.version ?? null },
  };
  out.category = category;

  if (blocks) return { ...out, ...compileBlockPack(pack, category, (itemId) => packItemType(pack._id, itemId)) };

  const withSetup = { ...pack, setupCode: items.setup?.trim() ? items.setup : "" };
  for (const { kind, item } of allPackItems(items)) {
    try {
      const def = { ...compile(withSetup, kind, item), category: category.id, ...(item.archived ? { hidden: true } : {}) };
      out[`${kind}s`].push(def);
    } catch (error) {
      out.problems.push(`${item.label || "An item"}: ${error.message}`);
    }
  }
  return out;
}

/**
 * The built-in catalog with these packs added, whichever kind they are.
 * Packs with nothing published are skipped. Returns `base` itself when
 * nothing is added.
 */
export function catalogWithPacks(base, packs = []) {
  const compiled = packs.map((pack) => compilePack(pack)).filter((c) => c.category);
  if (!compiled.length) return base;

  const events = new Map(base.events);
  const actions = new Map(base.actions);
  const values = new Map(base.values);
  const categories = [...base.categories];

  for (const pack of compiled) {
    categories.push(pack.category);
    for (const def of pack.events) events.set(def.id, def);
    for (const def of pack.actions) actions.set(def.id, def);
    for (const def of pack.values) values.set(def.id, def);
  }

  return {
    ...base,
    events,
    actions,
    values,
    categories,
    categoryById: Object.fromEntries(categories.map((category) => [category.id, category])),
    packs: compiled.map((c) => c.category.pack),
  };
}
