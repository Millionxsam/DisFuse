/* =====================================================================
   DisFuse Builder: what answers a button, menu or form
   ---------------------------------------------------------------------
   A step that sends a message with a button, or shows a form, is only
   half the job: something has to run when the button is clicked or the
   form is sent. That's an event ("When a button is clicked", filtered
   to the button's ID).

   This finds the IDs a step gives out, and the events that already
   handle each one, so a step card can offer "Make an event for this"
   with everything filled in. It also goes the other way: from an event
   back to the step that sends its button, menu or form.

   Pure functions over saved data; no React.
   ===================================================================== */

import { inputVisible, literalOf } from "../codegen/context.js";
import { MODAL_FIELDS } from "../codegen/modal.js";
import { walkActions } from "./ops.js";

/* What each kind of ID is handled by. */
export const HANDLERS = {
  button: { event: "button_clicked", verb: "Clicks on", uses: "clicks the button", icon: "fa-solid fa-hand-pointer" },
  menu: { event: "menu_picked", verb: "Picks from", uses: "picks from the menu", icon: "fa-solid fa-list-check" },
  form: { event: "form_submitted", verb: "Answers to", uses: "sends the form", icon: "fa-solid fa-paper-plane" },
};

/* A message piece's ID field, as the tree and validation spot them. */
const isIdField = (field) => field.kind === "text" && / ID$/.test(field.label) && !field.key.startsWith("filter");

function componentIds(components, catalog, found) {
  for (const component of components ?? []) {
    const def = catalog.components.get(component?.type);
    if (!def) continue;
    const rawOf = (key) => literalOf(def.fields.find((f) => f.key === key), component.inputs?.[key]);
    for (const field of def.fields) {
      if (!isIdField(field) || !inputVisible(field, rawOf)) continue;
      /* An ID from a value can't be known ahead of time. */
      if (component.inputs?.[field.key]?.ref) continue;
      const id = String(literalOf(field, component.inputs?.[field.key]) ?? "").trim();
      if (!id) continue;
      const kind = /menu/.test(def.id) ? "menu" : "button";
      const label = String(rawOf("label") ?? rawOf("buttonLabel") ?? rawOf("placeholder") ?? "").trim();
      found.push({ kind, id, label: label || def.label });
    }
    componentIds(component.children, catalog, found);
  }
}

/**
 * The button, menu and form IDs a step gives out, each once.
 *
 * @returns {Array<{ kind: "button"|"menu"|"form", id: string, label: string }>}
 */
export function interactionIds(action, catalog) {
  const def = catalog.actions.get(action?.type);
  if (!def || action.disabled) return [];
  const found = [];
  for (const inputDef of def.inputs ?? []) {
    const value = action.inputs?.[inputDef.key];
    const literal = literalOf(inputDef, value);
    if (inputDef.kind === "message") componentIds(literal?.components, catalog, found);
    if (inputDef.kind === "modal" && literal) {
      const idValue = literal.inputs?.customId;
      if (idValue?.ref) continue;
      const id = String(literalOf(MODAL_FIELDS[1], idValue) ?? "").trim();
      const title = String(literalOf(MODAL_FIELDS[0], literal.inputs?.title) ?? "").trim();
      if (id) found.push({ kind: "form", id, label: title || "Form" });
    }
  }
  const seen = new Set();
  return found.filter((item) => {
    const key = `${item.kind}:${item.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Does an event of the right type pick up this ID? Only exact filters
    count; an event for every button isn't "the event for this one". */
function handles(event, catalog, kind, id) {
  if (event.type !== HANDLERS[kind].event || event.enabled === false) return false;
  const def = catalog.events.get(event.type);
  const setting = (key) => literalOf(def?.settings?.find((s) => s.key === key), event.settings?.[key]);
  const filter = String(setting("filterId") ?? "").trim();
  if (!filter) return false;
  return setting("filterMode") === "startsWith" ? id.startsWith(filter) : id === filter;
}

/** The event that already handles an ID, or null. */
export function handlerFor(builder, catalog, kind, id) {
  return (builder?.events ?? []).find((event) => handles(event, catalog, kind, id)) ?? null;
}

/** What `createEvent` needs for a new event handling this ID. */
export function handlerEvent({ kind, id }) {
  const handler = HANDLERS[kind];
  const settings = { filterId: { literal: id } };
  if (kind !== "form") settings.filterMode = { literal: "equals" };
  return { type: handler.event, label: `${handler.verb} "${id}"`.slice(0, 100), settings };
}

/* ---------------------------------------------------------------------
   The other way round: where an event's button, menu or form comes from
   --------------------------------------------------------------------- */

/** The kind of ID an event answers, from its type. */
export function handlerKind(event) {
  return Object.keys(HANDLERS).find((kind) => HANDLERS[kind].event === event?.type) ?? null;
}

/** Every place steps live, with a name people know it by. */
function namedFlows(builder) {
  const flows = [];
  for (const event of builder?.events ?? []) flows.push({ source: "event", owner: event, event });
  for (const command of builder?.commands ?? []) {
    flows.push({ source: "command", owner: command, command });
    const walk = (options, trail) => {
      for (const option of options ?? []) {
        if (option.type === 1) flows.push({ source: "option", owner: option, command, trail: [...trail, option] });
        walk(option.options, [...trail, option]);
      }
    };
    walk(command.options, []);
  }
  return flows;
}

function flowName(flow, catalog) {
  if (flow.source === "event") {
    const def = catalog.events.get(flow.event.type);
    return { name: flow.event.label || def?.label || "An event", icon: def?.icon ?? "fa-solid fa-bolt", what: "event" };
  }
  const { command } = flow;
  if ((command.kind ?? "slash") !== "slash")
    return { name: `“${command.name}”`, icon: command.kind === "user" ? "fa-solid fa-user" : "fa-solid fa-message", what: "command" };
  const words = [command.name, ...(flow.trail ?? []).map((option) => option.name)];
  return { name: `/${words.join(" ")}`, icon: "fa-solid fa-terminal", what: "command" };
}

/** The builder page of a flow, relative to the workspace. */
function flowPath(flow) {
  if (flow.source === "event") return `/events/${flow.event.id}/builder`;
  if (flow.source === "option") return `/commands/${flow.command.id}/options/${flow.owner.id}/builder`;
  return `/commands/${flow.command.id}/builder`;
}

/**
 * The steps that send the button or menu (or show the form) an event
 * answers. Empty when the event isn't filtered to an ID, or nothing
 * gives that ID out.
 *
 * @returns {{ kind, id: string|null, sources: Array<{ id, label, flowName, flowIcon, flowWhat, flowId, actionId, stepLabel, path }> } | null}
 *   null when the event isn't one that answers a button, menu or form
 */
export function handlerSources(builder, catalog, event) {
  const kind = handlerKind(event);
  if (!kind) return null;
  const def = catalog.events.get(event.type);
  const setting = (key) => literalOf(def?.settings?.find((s) => s.key === key), event.settings?.[key]);
  const filter = String(setting("filterId") ?? "").trim();
  if (!filter) return { kind, id: null, sources: [] };
  const startsWith = setting("filterMode") === "startsWith";

  const sources = [];
  for (const flow of namedFlows(builder)) {
    const named = flowName(flow, catalog);
    walkActions(flow.owner.actions, ({ action }) => {
      for (const item of interactionIds(action, catalog)) {
        if (item.kind !== kind) continue;
        if (startsWith ? !item.id.startsWith(filter) : item.id !== filter) continue;
        sources.push({
          id: item.id,
          label: item.label,
          flowName: named.name,
          flowIcon: named.icon,
          flowWhat: named.what,
          flowId: flow.owner.id,
          actionId: action.id,
          stepLabel: catalog.actions.get(action.type)?.label ?? "A step",
          path: `${flowPath(flow)}?step=${encodeURIComponent(action.id)}`,
        });
      }
    });
  }
  return { kind, id: filter, startsWith, sources };
}
