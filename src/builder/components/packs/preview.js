import baseCatalog from "../../catalog/index.js";
import { ANY, defineAction, defineValue, input } from "../../catalog/define.js";
import { compilePack, packItemType } from "../../catalog/packs.js";
import { FLOW_CONTEXTS } from "../../catalog/contexts.js";
import { Generator } from "../../codegen/context.js";
import { eventCode } from "../../codegen/generate.js";
import { PACK_CONTEXTS } from "../../model/packs.js";

/* =====================================================================
   The pack editor's preview
   ---------------------------------------------------------------------
   The code one event, step or value writes, made by the same generator
   that builds bots, with each input left as it starts. Sections show a
   comment where their steps go, and a value slot shows its own name, so
   the preview reads like the template it came from.
   ===================================================================== */

/* Stand-ins the preview puts where people would put things. */
const STEPS_HERE = defineAction({
  id: "pack_preview_steps",
  label: "Steps",
  category: "custom",
  inputs: [input.text("label", "Label")],
  code: (ctx) => `// ${ctx.raw("label")}\n`,
});

const SLOT_VALUE = defineValue({
  id: "pack_preview_slot",
  label: "Value",
  category: "custom",
  output: ANY,
  inputs: [input.text("name", "Name")],
  code: (ctx) => String(ctx.raw("name") || "value"),
});

const steps = (label) => [{ id: "previewsteps", type: STEPS_HERE.id, inputs: { label: { literal: label } } }];

/** Slots filled with their own names, so `{{member}}` shows as `member`. */
function slotInputs(specs) {
  const inputs = {};
  for (const spec of specs ?? [])
    if (spec.kind === "slot") inputs[spec.key] = { ref: { kind: "value", type: SLOT_VALUE.id, inputs: { name: { literal: spec.key } } } };
  return inputs;
}

const KEY = /^[A-Za-z_][A-Za-z0-9_]*$/;

/* A half-written item still gets a preview: stand-in names for what has
   none yet, and inputs without a usable code name left out. The things
   to fix are listed beside the form, not here. */
function finishable(items) {
  const inputs = (list) =>
    (list ?? [])
      .filter((input) => KEY.test(input.key))
      .filter((input, index, all) => all.findIndex((other) => other.key === input.key) === index)
      .map((input) => ({
        ...input,
        label: input.label || input.key,
        ...(input.kind === "dropdown"
          ? { options: (input.options?.length ? input.options : [{ label: "", value: "" }]).map((o) => ({ ...o, label: o.label || o.value || "(no label)" })) }
          : {}),
      }));
  const provided = (list) => (list ?? []).filter((value) => KEY.test(value.key)).map((value) => ({ ...value, label: value.label || value.key }));
  const label = (item, noun) => item.label || `Untitled ${noun}`;
  return {
    ...items,
    events: items.events.map((item) => ({ ...item, label: label(item, "event"), settings: inputs(item.settings), values: provided(item.values), listen: item.listen || "eventName" })),
    actions: items.actions.map((item) => ({
      ...item,
      label: label(item, "step"),
      inputs: inputs(item.inputs),
      branches: item.branches
        .filter((branch) => KEY.test(branch.key))
        .filter((branch, index, all) => all.findIndex((other) => other.key === branch.key) === index)
        .map((branch) => ({ ...branch, label: branch.label || branch.key, provides: provided(branch.provides) })),
    })),
    values: items.values.map((item) => ({ ...item, label: label(item, "value"), inputs: inputs(item.inputs) })),
  };
}

/**
 * @param {object} pack   the pack (for its id, name and dependencies)
 * @param {object} draft  the pack's items as they are now
 * @param {"event"|"action"|"value"} kind
 * @param {object} original  the one to preview
 * @returns {{ code: string, top: string, packages: string[], issues: string[] }}
 */
export function previewItem(pack, draft, kind, original) {
  const items = finishable(draft);
  const item = items[`${kind}s`].find((i) => i.id === original.id) ?? original;
  const compiled = compilePack(pack, items);
  const type = packItemType(pack._id, item.id);

  const catalog = {
    ...baseCatalog,
    events: new Map([...baseCatalog.events, ...compiled.events.map((def) => [def.id, def])]),
    actions: new Map([...baseCatalog.actions, ...compiled.actions.map((def) => [def.id, def]), [STEPS_HERE.id, STEPS_HERE]]),
    values: new Map([...baseCatalog.values, ...compiled.values.map((def) => [def.id, def]), [SLOT_VALUE.id, SLOT_VALUE]]),
  };

  const gen = new Generator(catalog, { project: { _id: "preview", name: pack.name } });
  /* Only this item's: the others have their own previews. */
  const issues = compiled.problems.filter((problem) => problem.startsWith(`${item.label}:`));
  let code = "";

  if (kind === "event") {
    code = eventCode(gen, catalog, { id: "previewevent", type, label: "", settings: {}, actions: steps("The event's steps run here"), enabled: true });
  } else {
    const scope = gen.scopeFor({ kind: "slash", actions: [], contexts: [...new Set([...FLOW_CONTEXTS.slash, ...PACK_CONTEXTS])] });
    if (kind === "value") {
      const value = gen.valueCode({ kind: "value", type, inputs: slotInputs(item.inputs) }, scope, "Preview");
      code = `const result = ${value.code};`;
    } else {
      const branches = {};
      for (const branch of item.branches ?? []) branches[branch.key] = steps(`The steps in "${branch.label || branch.key}" run here`);
      code = gen.actionCode({ id: "previewstep", type, inputs: slotInputs(item.inputs), branches }, scope, "Preview");
    }
  }

  issues.push(...gen.issues.map((issue) => issue.message));

  const packages = [...gen.dependencies.keys()];
  const top = [...gen.setup.values()].join("\n\n");
  return { code, top, packages, issues };
}
