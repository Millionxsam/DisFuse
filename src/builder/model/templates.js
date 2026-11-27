/* =====================================================================
   DisFuse Builder: templates
   ---------------------------------------------------------------------
   A DisFuse Builder template is a builder with no bot attached: the
   same { commands, events, variables } a project saves, and nothing
   else. It's built in the template builder (pages/TemplateApp.jsx) and
   imported with the `importTemplate` operation in ops.js, which adds
   everything in it the way a person would add it by hand.

   This file is what the page does BEFORE an import, so the operation
   both sides apply is exactly the same:

     - every id is replaced with a new one, so the same template can be
       added twice, and nothing in it can collide with the project;
     - a command or variable whose name the project already uses gets a
       new name ("ping" becomes "ping-2"), and the person is told.

   Pure functions; no React, no API.
   ===================================================================== */

import { newId } from "./ids.js";
import { emptyBuilder, normaliseBuilder, walkOptions } from "./ops.js";
import { LIMITS } from "./rules.js";

const ID_PATTERN = /^[A-Za-z0-9_-]{6,40}$/;
const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

/** A template's saved content, read; an empty builder when there's nothing (or it isn't valid). */
export function parseTemplateContent(data) {
  if (!data) return emptyBuilder();
  try {
    return normaliseBuilder(typeof data === "string" ? JSON.parse(data) : structuredClone(data));
  } catch {
    return emptyBuilder();
  }
}

/** The content of a builder, as a template saves it. */
export function serializeTemplateContent(builder) {
  const { commands, events, variables } = normaliseBuilder(structuredClone(builder ?? emptyBuilder()));
  return JSON.stringify({ commands, events, variables });
}

/** Whether a template has anything worth publishing. */
export function hasTemplateContent(builder) {
  return Boolean(builder?.commands?.length || builder?.events?.length);
}

/* ---- New ids ------------------------------------------------------- */

/**
 * Every id in the content: commands, options, choices, events, steps,
 * sections, variables, message pieces. Anything stored under `id`.
 */
function collectIds(value, into) {
  if (Array.isArray(value)) value.forEach((entry) => collectIds(entry, into));
  else if (isObject(value))
    for (const [key, inner] of Object.entries(value)) {
      if (key === "id" && typeof inner === "string" && ID_PATTERN.test(inner)) into.add(inner);
      else collectIds(inner, into);
    }
  return into;
}

/**
 * The same content with every id replaced, and every reference to one
 * (a step reading an option, a variable or an outer step's value) moved
 * along with it. Ids are 12 random characters, so a string that matches
 * one IS that id, wherever it's stored.
 */
export function withNewIds(content) {
  const ids = new Map([...collectIds(content, new Set())].map((id) => [id, newId()]));
  const swap = (value) => {
    if (typeof value === "string") return ids.get(value) ?? value;
    if (Array.isArray(value)) return value.map(swap);
    if (isObject(value)) return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, swap(inner)]));
    return value;
  };
  return swap(content);
}

/* ---- Names already taken ------------------------------------------- */

/** The first of name, name-2, name-3... (or "name 2" for right-click commands) nobody has. */
function freeName(name, taken, { separator, maxLength }) {
  const has = (candidate) => taken.has(candidate.toLowerCase());
  if (!has(name)) return name;
  for (let n = 2; ; n++) {
    const suffix = `${separator}${n}`;
    const candidate = `${[...name].slice(0, maxLength - suffix.length).join("")}${suffix}`;
    if (!has(candidate)) return candidate;
  }
}

/**
 * Gets a template ready to import into a project.
 *
 * @param {object} builder  the project's builder
 * @param {object} content  the template's { commands, events, variables }
 * @returns {{ content: object, renamed: Array<{ kind: "command"|"variable", commandKind?: string, from: string, to: string }> }}
 */
export function prepareTemplateImport(builder, content) {
  const prepared = withNewIds(parseTemplateContent(content));
  const project = normaliseBuilder(structuredClone(builder ?? emptyBuilder()));
  const renamed = [];
  const now = new Date().toISOString();

  /* Command names only clash with commands of the same kind. */
  const takenByKind = {};
  for (const command of project.commands) {
    const kind = command.kind ?? "slash";
    (takenByKind[kind] ??= new Set()).add(String(command.name).toLowerCase());
  }
  for (const command of prepared.commands) {
    const kind = command.kind ?? "slash";
    const taken = (takenByKind[kind] ??= new Set());
    const name = freeName(String(command.name ?? ""), taken, {
      separator: kind === "slash" ? "-" : " ",
      maxLength: LIMITS.nameLength,
    });
    if (name !== command.name) renamed.push({ kind: "command", commandKind: kind, from: command.name, to: name });
    command.name = name;
    command.created = now;
    taken.add(name.toLowerCase());
  }

  const takenVariables = new Set(project.variables.map((v) => String(v.name).trim().toLowerCase()));
  for (const variable of prepared.variables) {
    const name = freeName(String(variable.name ?? "").trim(), takenVariables, {
      separator: " ",
      maxLength: LIMITS.variableNameLength,
    });
    if (name !== variable.name) renamed.push({ kind: "variable", from: variable.name, to: name });
    variable.name = name;
    takenVariables.add(name.toLowerCase());
  }

  for (const event of prepared.events) event.created = now;

  return { content: prepared, renamed };
}

/* ---- What a template uses ------------------------------------------ */

/**
 * The names of the secrets a template reads (with the Secret value). A
 * template never carries secrets themselves, so whoever adds it needs to
 * save these on their own bot.
 */
export function secretNamesIn(content) {
  const names = new Set();
  const visit = (value) => {
    if (Array.isArray(value)) value.forEach(visit);
    else if (isObject(value)) {
      if (value.kind === "value" && value.type === "bot_secret") {
        const name = value.inputs?.value?.literal;
        if (typeof name === "string" && name.trim()) names.add(name.trim());
      }
      Object.values(value).forEach(visit);
    }
  };
  visit(content);
  return [...names].sort((a, b) => a.localeCompare(b));
}

/** "/ping", "/ban user", or a right-click command's name, for lists. */
export function commandLabel(command) {
  return (command.kind ?? "slash") === "slash" ? `/${command.name}` : command.name;
}

/** How many slash commands (with subcommands counted once), right-click commands and events. */
export function templateSummary(content) {
  const builder = parseTemplateContent(content);
  let subcommands = 0;
  for (const command of builder.commands)
    walkOptions(command.options, (option) => {
      if (option.type === 1) subcommands += 1;
    });
  return {
    commands: builder.commands.length,
    slash: builder.commands.filter((c) => (c.kind ?? "slash") === "slash").length,
    subcommands,
    events: builder.events.length,
    variables: builder.variables.length,
  };
}
