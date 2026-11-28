/* =====================================================================
   DisFuse Builder: problems worth pointing out
   ---------------------------------------------------------------------
   The builder's version of the block editor's warning triangles. Every
   step is checked where it sits:

     - does the step (and every value in it) work here?
     - is anything required left empty?
     - does every placed value still exist, fit the input, and make
       sense in this spot?
     - does it answer a command twice, or edit a reply that isn't there?

   Levels: "error" means the bot won't work as built, "warning" means it
   probably won't do what's wanted, "info" is a gentle nudge (a command
   with no steps yet).

   Pure functions; the pages memoise them.
   ===================================================================== */

import { acceptsValues } from "../catalog/define.js";
import { inputVisible, literalOf } from "../codegen/context.js";
import { FILE_FIELDS } from "../codegen/message.js";
import { isRepeatItem, walkOptions } from "./ops.js";
import { answerStateAt, answerStates, checkAnswer } from "./replies.js";
import { canUse, contextsAt, describeRef, flowInfo, typeMismatch } from "./scope.js";

/** Checks one input value (and the values nested inside it). */
function checkInput(inputDef, inputValue, env, issues, path) {
  const where = inputDef.label;
  const here = [...path, { source: env.ownerId, input: inputDef.key }];

  if (inputDef.kind === "variable") {
    if (!inputValue?.ref) issues.push({ level: "error", message: `Pick a variable for "${where}".` });
    else if (!env.builder.variables.some((v) => v.id === inputValue.ref.id))
      issues.push({ level: "error", message: `The variable in "${where}" was deleted.` });
    return;
  }

  if (inputValue?.ref && acceptsValues(inputDef)) {
    checkRef(inputValue.ref, inputDef, env, issues, here, where);
    return;
  }

  const literal = literalOf(inputDef, inputValue);

  if (inputDef.kind === "slot" && !inputDef.optional)
    issues.push({ level: "warning", message: `Choose a value for "${where}".` });

  if (inputDef.kind === "group" && Array.isArray(literal))
    for (const item of literal)
      for (const field of inputDef.fields ?? [])
        checkInput(field, item?.inputs?.[field.key], env, issues, path);

  if (inputDef.kind === "message") {
    if (!literal?.components?.length) issues.push({ level: "warning", message: `The message in "${where}" is empty.` });
    checkComponents(literal?.components, env, issues);
    for (const file of literal?.files ?? [])
      for (const [key, value] of Object.entries(file?.inputs ?? {})) {
        const field = FILE_FIELDS.find((f) => f.key === key);
        if (value?.ref && field) checkRef(value.ref, field, env, issues, [], "a file");
      }
    for (const id of duplicateComponentIds(literal?.components, env.catalog))
      issues.push({ level: "error", message: `Two pieces of the message in "${where}" use the ID "${id}". Each one needs its own.` });
  }

  if (inputDef.kind === "modal") {
    if (!literal?.components?.length) issues.push({ level: "warning", message: `The form in "${where}" has no questions.` });
    for (const [key, value] of Object.entries(literal?.inputs ?? {}))
      if (value?.ref) checkRef(value.ref, { key, label: key === "title" ? "Form title" : "Form ID", kind: "text", accepts: ["String"] }, env, issues, [], key);
    checkComponents(literal?.components, env, issues);
    for (const id of duplicateComponentIds(literal?.components, env.catalog))
      issues.push({ level: "error", message: `Two questions in the form in "${where}" use the ID "${id}". Each one needs its own.` });
  }
}

/**
 * IDs used by more than one button, menu or form question. Discord
 * refuses the whole message (or form) when two share one.
 */
export function duplicateComponentIds(components, catalog) {
  const seen = new Map();
  const walk = (list) => {
    for (const component of list ?? []) {
      const def = catalog.components.get(component?.type);
      for (const field of def?.fields ?? []) {
        if (field.kind !== "text" || !/ ID$/.test(field.label) || field.key.startsWith("filter")) continue;
        const value = component.inputs?.[field.key];
        if (value?.ref) continue;
        if (!inputVisible(field, (key) => literalOf(def.fields.find((f) => f.key === key), component.inputs?.[key]))) continue;
        const id = String(literalOf(field, value) ?? "").trim();
        if (id) seen.set(id, (seen.get(id) ?? 0) + 1);
      }
      walk(component?.children);
    }
  };
  walk(components);
  return [...seen].filter(([, count]) => count > 1).map(([id]) => id);
}

function checkComponents(components, env, issues) {
  for (const component of components ?? []) {
    const def = env.catalog.components.get(component?.type);
    if (!def) {
      issues.push({ level: "error", message: "A piece of this message doesn't exist anymore." });
      continue;
    }
    for (const field of def.fields)
      if (inputVisible(field, (key) => literalOf(def.fields.find((f) => f.key === key), component.inputs?.[key])))
        checkInput(field, component.inputs?.[field.key], { ...env, ownerId: def.id }, issues, []);
    if (def.children) {
      /* Discord rejects the whole message ("Invalid Form Body") when a
         container, row, gallery or menu has too few or too many pieces. */
      const count = (component.children ?? []).length;
      const { min, max } = def.children;
      if (min && count < min)
        issues.push({
          level: "warning",
          message: `"${def.label}" needs at least ${min} ${min === 1 ? "piece" : "pieces"} inside it.`,
        });
      if (max && count > max)
        issues.push({ level: "warning", message: `"${def.label}" can hold up to ${max} pieces.` });
    }
    checkComponents(component.children, env, issues);
  }
}

function checkRef(ref, inputDef, env, issues, path, where) {
  const described = describeRef(ref, { ...env, path });
  if (!described.valid) {
    issues.push({ level: "error", message: `"${where}": ${described.reason}` });
    return;
  }
  const mismatch = typeMismatch(described.output, inputDef.accepts, inputDef.kind);
  if (mismatch) issues.push({ level: "error", message: `"${where}": ${mismatch}` });

  if (ref.kind === "value" && described.def)
    for (const inner of described.def.inputs ?? [])
      if (inputVisible(inner, (key) => literalOf(described.def.inputs.find((i) => i.key === key), ref.inputs?.[key])))
        checkInput(inner, ref.inputs?.[inner.key], { ...env, ownerId: described.def.id }, issues, path);
}

/**
 * Problems with every step of one flow.
 *
 * @returns {Map<string, Array<{ level, message }>>} step id → problems
 */
export function validateFlow(builder, flowId, catalog, info = flowInfo(builder, flowId, catalog)) {
  const result = new Map();
  if (!info) return result;

  const answered = answerStates(info.actions, catalog);

  const visit = (actions, location) => {
    for (const [index, action] of (actions ?? []).entries()) {
      const issues = [];
      const def = catalog.actions.get(action.type);
      const env = { catalog, builder, info, location, ownerId: action.type };

      if (!def) {
        issues.push({ level: "error", message: "This step doesn't exist anymore. Remove it." });
        result.set(action.id, issues);
        continue;
      }

      if (!action.disabled) {
        const usable = canUse(def, contextsAt(info, catalog, location), catalog.contexts);
        if (!usable.ok) issues.push({ level: "error", message: usable.reason });
        else {
          const once = checkAnswer(def, answerStateAt(answered, { ...location, index }));
          if (!once.ok) issues.push({ level: "error", message: once.reason });
        }

        const rawOf = (key) => literalOf(def.inputs.find((i) => i.key === key), action.inputs?.[key]);
        for (const inputDef of def.inputs)
          if (inputVisible(inputDef, rawOf)) checkInput(inputDef, action.inputs?.[inputDef.key], env, issues, []);

        for (const branch of def.branches)
          if (branch.repeat)
            for (const item of action.branches?.[branch.key] ?? [])
              for (const inputDef of branch.inputs ?? [])
                checkInput(inputDef, item.inputs?.[inputDef.key], env, issues, []);
      }

      if (issues.length) result.set(action.id, issues);

      for (const [key, entries] of Object.entries(action.branches ?? {})) {
        if (!Array.isArray(entries)) continue;
        if (entries.some(isRepeatItem))
          for (const item of entries) visit(item.actions, { parentId: action.id, branch: key, itemId: item.id });
        else visit(entries, { parentId: action.id, branch: key, itemId: null });
      }
    }
  };

  visit(info.actions, { parentId: null, branch: null, itemId: null });
  return result;
}

/** How many errors and warnings a flow has, for badges. */
export function countIssues(issueMap) {
  let errors = 0;
  let warnings = 0;
  for (const list of issueMap.values())
    for (const issue of list) {
      if (issue.level === "error") errors += 1;
      else if (issue.level === "warning") warnings += 1;
    }
  return { errors, warnings };
}

/**
 * Problems across the whole project, for the dashboard and the export.
 *
 * @returns {Array<{ level, message, where: string, to: string, flowId?: string, actionId?: string }>}
 *   `to` is a path relative to the project's /workspace page
 */
export function validateProject(builder, catalog) {
  const problems = [];

  const flowProblems = (flowId, where, to) => {
    const info = flowInfo(builder, flowId, catalog);
    const issues = validateFlow(builder, flowId, catalog, info);
    for (const [actionId, list] of issues)
      for (const issue of list) problems.push({ ...issue, where, to, flowId, actionId });
    if (info && !info.actions.length)
      problems.push({ level: "info", message: "Doesn't do anything yet. Add some steps.", where, to, flowId });
  };

  for (const command of builder?.commands ?? []) {
    const name = command.kind === "slash" || !command.kind ? `/${command.name}` : command.name;
    const subs = [];
    walkOptions(command.options, (option, parent) => {
      if (option.type === 1) subs.push({ option, parent });
    });
    const structural = (command.options ?? []).some((o) => o.type === 1 || o.type === 2);

    if (structural) {
      for (const { option, parent } of subs)
        flowProblems(option.id, `${name} ${parent?.type === 2 ? `${parent.name} ` : ""}${option.name}`, `commands/${command.id}/options/${option.id}/builder`);
      walkOptions(command.options, (option) => {
        if (option.type === 2 && !(option.options ?? []).length)
          problems.push({ level: "warning", message: "This group has no subcommands, so Discord won't accept the command.", where: `${name} ${option.name}`, to: `commands/${command.id}/options/${option.id}` });
      });
    } else flowProblems(command.id, name, `commands/${command.id}/builder`);
  }

  for (const event of builder?.events ?? []) {
    if (event.enabled === false) continue;
    const def = catalog.events.get(event.type);
    const where = event.label || def?.label || "An event";
    if (!def) {
      problems.push({ level: "error", message: "This kind of event doesn't exist anymore.", where, to: `events/${event.id}` });
      continue;
    }
    flowProblems(event.id, where, `events/${event.id}/builder`);
  }

  return problems;
}
