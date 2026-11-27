/* =====================================================================
   DisFuse Builder: what can be used where
   ---------------------------------------------------------------------
   The builder's version of the block editor's restrictions. It answers,
   for any spot in a command or event:

     - which steps can go here (their `requires` are all available)
     - which values can go in this input (the right type, available here)
     - what a value placed earlier is, and whether it still fits

   A spot is described by a LOCATION, the same shape ops.js uses:
   { parentId, branch, itemId } — the step whose section we're in (or
   none, for the top level). A value being picked for an input also has
   a PATH: the inputs it sits inside, outermost first, as
   [{ source, input }], so "Current item" inside a "Filter a list"
   condition can be offered.

   Pure functions over saved data; no React.
   ===================================================================== */

import { CATEGORY_BY_ID } from "../catalog/categories.js";
import { FLOW_CONTEXTS, describeRequirement, satisfies } from "../catalog/contexts.js";
import { canConnect, typeInfo, typeLabel, typeList } from "../catalog/types.js";
import { optionValue } from "../codegen/context.js";
import { ancestorsOf, findAction, findFlow } from "./ops.js";

/* ---------------------------------------------------------------------
   Flows
   --------------------------------------------------------------------- */

const valueOptions = (owner) =>
  (owner?.options ?? []).filter((option) => option.type !== 1 && option.type !== 2);

/**
 * Everything about the command, subcommand or event a flow id names.
 *
 * @returns {null | {
 *   flowId, kind: "slash"|"user"|"message"|"subcommand"|"event",
 *   command?, option?, path?: object[], event?, eventDef?,
 *   contexts: Set<string>, options: object[], actions: object[], title: string
 * }}
 */
export function flowInfo(builder, flowId, catalog) {
  const found = findFlow(builder, flowId);
  if (!found) return null;

  if (found.kind === "event") {
    const eventDef = catalog.events.get(found.event.type) ?? null;
    return {
      flowId,
      kind: "event",
      event: found.event,
      eventDef,
      contexts: new Set(eventDef?.provides ?? []),
      options: [],
      actions: found.event.actions ?? [],
      title: found.event.label || eventDef?.label || "Event",
    };
  }

  const command = found.command;

  if (found.kind === "subcommand")
    return {
      flowId,
      kind: "subcommand",
      command,
      option: found.option,
      path: found.path ?? [],
      contexts: new Set(FLOW_CONTEXTS.slash),
      options: valueOptions(found.option),
      actions: found.option.actions ?? [],
      title: `/${[command.name, ...(found.path ?? []).map((o) => o.name), found.option.name].join(" ")}`,
    };

  const kind = command.kind ?? "slash";
  return {
    flowId,
    kind,
    command,
    contexts: new Set(FLOW_CONTEXTS[kind] ?? FLOW_CONTEXTS.slash),
    options: kind === "slash" ? valueOptions(command) : [],
    actions: command.actions ?? [],
    title: kind === "slash" ? `/${command.name}` : command.name,
  };
}

/* ---------------------------------------------------------------------
   Locations
   --------------------------------------------------------------------- */

/** Where an existing step sits: { parentId, branch, itemId }. */
export function locationOf(actions, actionId) {
  const found = findAction(actions, actionId);
  if (!found) return { parentId: null, branch: null, itemId: null };
  return {
    parentId: found.parent?.id ?? null,
    branch: found.branch ?? null,
    itemId: found.item?.id ?? null,
  };
}

/**
 * The steps around a location, outermost first, each with the section
 * of theirs the location is inside: [{ action, def, branch, branchDef }].
 */
export function enclosingSteps(info, catalog, location = {}) {
  if (!location.parentId) return [];
  const parent = findAction(info.actions, location.parentId)?.action;
  if (!parent) return [];

  const chain = [
    ...ancestorsOf(info.actions, location.parentId).map(({ action, branch }) => ({ action, branch })),
    { action: parent, branch: location.branch },
  ];

  return chain.map(({ action, branch }) => {
    const def = catalog.actions.get(action.type) ?? null;
    return { action, def, branch, branchDef: def?.branches?.find((b) => b.key === branch) ?? null };
  });
}

/**
 * The contexts available at a location: the flow's own, plus whatever
 * the sections around it add. "loop" and "stoppable" only survive
 * sections marked `inline`, because `break` and `return` can't reach
 * out of a callback.
 */
export function contextsAt(info, catalog, location = {}) {
  /* Every command and event runs in a function of its own, so "Stop
     running the steps" (a `return`) works anywhere a loop's `break`
     would: not inside a callback, where it would only end the callback. */
  const contexts = new Set([...(info?.contexts ?? []), "stoppable"]);
  for (const { branchDef } of enclosingSteps(info, catalog, location)) {
    if (!branchDef?.inline) {
      contexts.delete("loop");
      contexts.delete("stoppable");
    }
    for (const key of branchDef?.contexts ?? []) contexts.add(key);
  }
  return contexts;
}

/** Can a step or value be used where these contexts are available? */
export function canUse(def, contexts, catalogContexts) {
  if (!def) return { ok: false, reason: "This doesn't exist anymore." };
  const requires = def.requires ?? [];
  if (satisfies(contexts, requires)) return { ok: true, reason: "" };
  return { ok: false, reason: describeRequirement(requires, catalogContexts) };
}

/* ---------------------------------------------------------------------
   Values available at a spot
   --------------------------------------------------------------------- */

function optionItems(info) {
  const items = [];
  for (const option of info?.options ?? []) {
    const base = { key: `option:${option.id}`, ref: { kind: "option", id: option.id } };
    const { output } = optionValue(option);
    items.push({
      ...base,
      label: option.name,
      description: option.description || "What they entered for this option.",
      output,
    });
    if (option.type === 6)
      items.push({
        key: `option:${option.id}:member`,
        ref: { kind: "option", id: option.id, as: "member" },
        label: `${option.name} (as a member)`,
        description: "The member they picked, with their server details.",
        output: ["member"],
      });
  }
  return items;
}

/**
 * Every value that can go in an input at this spot, grouped for the
 * value picker.
 *
 * @param {object} args
 * @param {object} args.catalog
 * @param {object} args.builder
 * @param {object} args.info       from flowInfo()
 * @param {object} args.location   where the step holding the input sits
 * @param {Array}  [args.path]     [{ source, input }], the inputs we're inside,
 *                                 including the one being filled in
 * @param {*}      args.accepts    the input's accepted types
 * @param {string} [args.inputKind]
 * @returns {Array<{ id, label, icon, color, items: Array<{ key, ref, label, description, output, def? }> }>}
 */
export function availableValues({ catalog, builder, info, location = {}, path = [], accepts, inputKind }) {
  const fits = (output) => canConnect(output, accepts, inputKind);
  const contexts = contextsAt(info, catalog, location);
  const groups = [];

  const push = (group) => {
    const items = group.items.filter((item) => fits(item.output));
    if (items.length) groups.push({ ...group, items });
  };

  if (info?.eventDef?.values?.length)
    push({
      id: "event",
      label: "This event",
      icon: info.eventDef.icon ?? "fa-solid fa-bolt",
      color: (catalog.categoryById ?? CATEGORY_BY_ID)[info.eventDef.category]?.color,
      items: info.eventDef.values.map((value) => ({
        key: `event:${value.key}`,
        ref: { kind: "event", key: value.key },
        label: value.label,
        description: value.description ?? "",
        output: typeList(value.type),
      })),
    });

  if (info?.options?.length)
    push({ id: "options", label: "Command options", icon: "fa-solid fa-sliders", color: "#3366CC", items: optionItems(info) });

  const fromSteps = [];
  for (const { action, def, branch, branchDef } of enclosingSteps(info, catalog, location))
    for (const value of branchDef?.provides ?? [])
      fromSteps.push({
        key: `branch:${action.id}:${branch}:${value.key}`,
        ref: { kind: "branch", action: action.id, branch, key: value.key },
        label: value.label,
        description: `From "${def?.label ?? "a step"}"${value.description ? `. ${value.description}` : ""}`,
        output: typeList(value.type),
      });
  if (fromSteps.length) push({ id: "steps", label: "From the steps around this one", icon: "fa-solid fa-diagram-next", color: "#35d0a0", items: fromSteps.reverse() });

  const fromInputs = [];
  for (const { source, input } of path) {
    const owner = catalog.values.get(source) ?? catalog.actions.get(source);
    const inputDef = owner?.inputs?.find((i) => i.key === input);
    for (const value of inputDef?.provides ?? [])
      fromInputs.push({
        key: `input:${source}:${input}:${value.key}`,
        ref: { kind: "input", source, input, key: value.key },
        label: value.label,
        description: value.description ?? `From "${owner.label}"`,
        output: typeList(value.type),
      });
  }
  if (fromInputs.length) push({ id: "inputs", label: "From this input", icon: "fa-solid fa-arrow-turn-down", color: "#ffb648", items: fromInputs });

  if (builder?.variables?.length)
    push({
      id: "variables",
      label: "Variables",
      icon: "fa-solid fa-box",
      color: CATEGORY_BY_ID.variables?.color,
      items: builder.variables.map((variable) => ({
        key: `variable:${variable.id}`,
        ref: { kind: "variable", id: variable.id },
        label: variable.name,
        description: "A variable you made.",
        output: [null],
      })),
    });

  const byCategory = new Map();
  for (const def of catalog.values.values()) {
    if (def.hidden) continue;
    if (!fits(def.output)) continue;
    if (!satisfies(contexts, def.requires)) continue;
    const list = byCategory.get(def.category) ?? [];
    list.push({
      key: `value:${def.id}`,
      ref: { kind: "value", type: def.id },
      label: def.label,
      description: def.description ?? "",
      output: def.output,
      def,
    });
    byCategory.set(def.category, list);
  }
  for (const category of catalog.categories) {
    const items = byCategory.get(category.id);
    if (items?.length) groups.push({ id: `category:${category.id}`, label: category.label, icon: category.icon, color: category.color, items, category: category.id });
  }

  return groups;
}

/* ---------------------------------------------------------------------
   What a placed value is
   --------------------------------------------------------------------- */

/**
 * How to draw a value that has been placed, and whether it still fits
 * where it is.
 *
 * @returns {{ label: string, output: Array, icon: string, color: string, valid: boolean, reason: string, def?: object }}
 */
export function describeRef(ref, { catalog, builder, info, location = {}, path = [] }) {
  const invalid = (label, reason) => ({ label, output: [null], icon: "fa-solid fa-triangle-exclamation", color: "#ff5c5c", valid: false, reason });

  if (!ref) return invalid("Nothing", "No value.");

  switch (ref.kind) {
    case "value": {
      const def = catalog.values.get(ref.type);
      if (!def) return invalid("Unknown value", "This value doesn't exist anymore.");
      const usable = canUse(def, contextsAt(info, catalog, location), catalog.contexts);
      return {
        label: def.label,
        output: def.output,
        icon: def.icon ?? typeInfo(def.output).icon,
        color: (catalog.categoryById ?? CATEGORY_BY_ID)[def.category]?.color ?? typeInfo(def.output).color,
        valid: usable.ok,
        reason: usable.reason,
        def,
      };
    }

    case "event": {
      const value = info?.eventDef?.values?.find((v) => v.key === ref.key);
      if (!value) return invalid("Value from another event", "This value belongs to a different event.");
      return { label: value.label, output: typeList(value.type), icon: info.eventDef.icon ?? "fa-solid fa-bolt", color: (catalog.categoryById ?? CATEGORY_BY_ID)[info.eventDef.category]?.color ?? "#818cf8", valid: true, reason: "" };
    }

    case "branch": {
      const step = enclosingSteps(info, catalog, location).find((s) => s.action.id === ref.action && s.branch === ref.branch);
      const owner = step ?? (() => {
        const found = findAction(info?.actions ?? [], ref.action)?.action;
        const def = found ? catalog.actions.get(found.type) : null;
        return found ? { action: found, def, branchDef: def?.branches?.find((b) => b.key === ref.branch) } : null;
      })();
      const value = owner?.branchDef?.provides?.find((p) => p.key === ref.key);
      if (!value) return invalid("Value from a step", "The step this value came from isn't here anymore.");
      if (!step) return { ...invalid(value.label, `This only works inside "${owner.def?.label ?? "the step that makes it"}".`), output: typeList(value.type) };
      return { label: value.label, output: typeList(value.type), icon: "fa-solid fa-diagram-next", color: "#35d0a0", valid: true, reason: "" };
    }

    case "input": {
      const inPath = path.some((p) => p.source === ref.source && p.input === ref.input);
      const owner = catalog.values.get(ref.source) ?? catalog.actions.get(ref.source);
      const value = owner?.inputs?.find((i) => i.key === ref.input)?.provides?.find((p) => p.key === ref.key);
      if (!value) return invalid("Value from an input", "This value isn't available anymore.");
      if (!inPath) return { ...invalid(value.label, `This only works inside "${owner.label}".`), output: typeList(value.type) };
      return { label: value.label, output: typeList(value.type), icon: "fa-solid fa-arrow-turn-down", color: "#ffb648", valid: true, reason: "" };
    }

    case "variable": {
      const variable = builder?.variables?.find((v) => v.id === ref.id);
      if (!variable) return invalid("Deleted variable", "This variable was deleted.");
      return { label: variable.name, output: [null], icon: "fa-solid fa-box", color: CATEGORY_BY_ID.variables?.color ?? "#A55B80", valid: true, reason: "" };
    }

    case "option": {
      const option = info?.options?.find((o) => o.id === ref.id);
      if (!option)
        return invalid(
          "Removed option",
          info?.kind === "event"
            ? "Command options only work inside their own command."
            : "This option isn't on the command anymore.",
        );
      const { output } = optionValue(option, ref.as);
      return { label: ref.as === "member" ? `${option.name} (as a member)` : option.name, output, icon: "fa-solid fa-sliders", color: "#3366CC", valid: true, reason: "" };
    }

    default:
      return invalid("Unknown value", "This value can't be used.");
  }
}

/** A readable reason a value doesn't fit an input's type, or "". */
export function typeMismatch(output, accepts, inputKind) {
  if (canConnect(output, accepts, inputKind)) return "";
  return `This needs ${typeLabel(accepts).toLowerCase()}, but this value is ${typeLabel(output).toLowerCase()}.`;
}
