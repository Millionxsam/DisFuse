import { inputVisible, literalOf } from "../../codegen/context.js";
import { MODAL_FIELDS } from "../../codegen/modal.js";
import { FILE_FIELDS } from "../../codegen/message.js";
import { describeRef } from "../../model/scope.js";
import { duplicateComponentIds } from "../../model/validate.js";

/* =====================================================================
   Previews: a built message or form, as Discord would show it
   ---------------------------------------------------------------------
   Each message or form piece has a preview(p) (see the catalog's
   components) returning itself in the shape Discord's API delivers.
   This runs them, and the Control client's real renderer draws the
   result, the same as the block editor's previews.

   Values can't be known before the bot runs, so a placed value shows as
   a placeholder chip ("{Member's nickname}"), wrapped in two private-use
   characters the renderer knows to draw as chips. These helpers are the
   same as src/functions/messagePreview/values.js, copied because that
   file also reads Blockly blocks.
   ===================================================================== */

export const DYNAMIC_OPEN = "";
export const DYNAMIC_CLOSE = "";
const DYNAMIC_PATTERN = new RegExp(`${DYNAMIC_OPEN}([^${DYNAMIC_CLOSE}]*)${DYNAMIC_CLOSE}`, "g");

export function dynamic(label) {
  const clean = String(label ?? "").replace(/[]/g, "").replace(/\s+/g, " ").trim() || "value";
  return DYNAMIC_OPEN + clean + DYNAMIC_CLOSE;
}

export function toDisplay(text) {
  if (typeof text !== "string") return "";
  return text.replace(DYNAMIC_PATTERN, (_, label) => `{${label}}`);
}

function literalOnly(text) {
  if (typeof text !== "string" || text.includes(DYNAMIC_OPEN)) return null;
  const trimmed = text.trim();
  return trimmed.length ? trimmed : null;
}

export function parseEmoji(text) {
  const literal = literalOnly(text);
  if (!literal) return null;
  const custom = /^<(a)?:(\w+):(\d{15,25})>$/.exec(literal);
  if (custom) return { animated: Boolean(custom[1]), name: custom[2], id: custom[3] };
  return { name: literal };
}

export function placeholderImage(label) {
  const text = toDisplay(String(label ?? "")).replace(/[<>&"]/g, "").slice(0, 30);
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">',
    '<rect width="400" height="300" fill="#232428"/>',
    '<rect x="8" y="8" width="384" height="284" rx="10" fill="none" stroke="#4e5058" stroke-width="2" stroke-dasharray="10 8"/>',
    '<text x="200" y="140" fill="#80848e" font-family="sans-serif" font-size="46" text-anchor="middle">&#128247;</text>',
    `<text x="200" y="190" fill="#949ba4" font-family="sans-serif" font-size="17" text-anchor="middle">${text || "image"}</text>`,
    "</svg>",
  ].join("");
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * A placed value, as preview text. Most values are a chip, but text
 * that's built in the step itself shows what it's built from: "Join
 * text" is so often used to mix words with values ("Welcome, " +
 * member's name + "!") that one {Join text} chip would hide the whole
 * message. Each piece shows as written, and each value in it as its
 * own chip.
 */
export function valueText(ref, env, depth = 0) {
  if (ref?.kind === "value" && depth < 8) {
    const def = env.catalog.values.get(ref.type);
    if (ref.type === "text_join" && def) {
      const group = def.inputs.find((i) => i.key === "parts");
      const field = group?.fields?.find((f) => f.key === "part");
      const items = ref.inputs?.parts?.ref ? null : literalOf(group, ref.inputs?.parts);
      if (Array.isArray(items))
        return items
          .map((item) => {
            const piece = item?.inputs?.part;
            return piece?.ref ? valueText(piece.ref, env, depth + 1) : String(literalOf(field, piece) ?? "");
          })
          .join("");
    }
    if (ref.type === "text_value" && def && !ref.inputs?.TEXT?.ref) return String(literalOf(def.inputs[0], ref.inputs?.TEXT) ?? "");
    if (ref.type === "text_new_line") return "\n";
  }
  return dynamic(describeRef(ref, env).label);
}

/** The `p` a component's preview(p) gets. */
function previewHelpers(def, component, env, childPreviews) {
  const fieldOf = (key) => def.fields.find((f) => f.key === key);
  const text = (key) => {
    const value = component.inputs?.[key];
    if (value?.ref) return valueText(value.ref, env);
    const literal = literalOf(fieldOf(key), value);
    return literal === undefined || literal === null ? "" : String(literal);
  };
  return {
    text,
    display: (key) => toDisplay(text(key)),
    raw: (key) => (component.inputs?.[key]?.ref ? undefined : literalOf(fieldOf(key), component.inputs?.[key])),
    has: (key) => {
      const value = component.inputs?.[key];
      if (value?.ref) return true;
      const literal = literalOf(fieldOf(key), value);
      return Array.isArray(literal) ? literal.length > 0 : literal !== undefined && literal !== null && literal !== "";
    },
    url: (key, label) => literalOnly(text(key)) || placeholderImage(label ?? fieldOf(key)?.label),
    colour: (key) => {
      const hex = literalOnly(text(key));
      return hex && /^#?[0-9a-f]{6}$/i.test(hex) ? parseInt(hex.replace("#", ""), 16) : null;
    },
    emoji: (key) => parseEmoji(text(key)),
    children: () => childPreviews,
  };
}

/** One piece and everything inside it. Unknown pieces are skipped. */
function previewComponent(component, env, stats) {
  const def = env.catalog.components.get(component?.type);
  if (!def?.preview) return null;
  stats.total += def.weight ?? 1;
  const children = (component.children ?? []).map((child) => previewComponent(child, env, stats)).filter(Boolean);
  try {
    return def.preview(previewHelpers(def, component, env, children));
  } catch {
    return null;
  }
}

/** Two buttons, menus or form questions with the same ID. */
const duplicateIdNotes = (list, catalog) =>
  duplicateComponentIds(list, catalog).map((id) => `More than one piece uses the ID "${id}". Each one needs its own.`);

/** Discord's limits, checked so the builder can warn before the bot fails. */
const LIMITS = { components: 40, text: 4000, rowButtons: 5 };

function messageNotes(spec, stats, env) {
  const notes = [];
  if (stats.total > LIMITS.components) notes.push(`This message uses ${stats.total} pieces. Discord allows ${LIMITS.components}.`);

  let characters = 0;
  const walk = (list) =>
    (list ?? []).forEach((component) => {
      const def = env.catalog.components.get(component.type);
      for (const field of def?.fields ?? [])
        if (field.kind === "text" && !component.inputs?.[field.key]?.ref) characters += String(literalOf(field, component.inputs?.[field.key]) ?? "").length;
      if (def?.id === "msg_row") {
        const kids = component.children ?? [];
        const menus = kids.filter((k) => env.catalog.components.get(k.type)?.weight === 5).length;
        if (menus && kids.length > 1) notes.push("A row holds either buttons or one menu, not both.");
        if (!kids.length) notes.push("A row is empty. Add a button or a menu to it.");
      }
      if (def?.id === "msg_gallery" && !(component.children ?? []).length) notes.push("A picture gallery needs at least one picture.");
      if (def?.id === "msg_menu" && !(component.children ?? []).length) notes.push("A menu needs at least one option.");
      walk(component.children);
    });
  walk(spec?.components);
  if (characters > LIMITS.text) notes.push(`The text adds up to ${characters} characters. Discord allows ${LIMITS.text}.`);
  notes.push(...duplicateIdNotes(spec?.components, env.catalog));
  return notes;
}

/**
 * @param {object} spec  a MessageSpec
 * @param {object} env   { catalog, builder, info, location } for value labels
 * @returns {{ message: object, total: number, notes: string[] }}
 */
export function buildMessagePreview(spec, env) {
  const stats = { total: 0 };
  const components = (spec?.components ?? []).map((component) => previewComponent(component, env, stats)).filter(Boolean);
  const attachments = (spec?.files ?? []).map((file, index) => {
    const nameField = FILE_FIELDS.find((f) => f.key === "name");
    const sourceField = FILE_FIELDS.find((f) => f.key === "source");
    const name = file.inputs?.name?.ref ? `file${index + 1}` : String(literalOf(nameField, file.inputs?.name) || `file${index + 1}`);
    const source = file.inputs?.source?.ref ? null : literalOnly(String(literalOf(sourceField, file.inputs?.source) ?? ""));
    return { id: String(index), filename: name, url: source ?? undefined, size: 0 };
  });
  return {
    message: { id: "preview", flags: 1 << 15, content: "", components, attachments },
    total: stats.total,
    notes: messageNotes(spec, stats, env),
  };
}

/** @returns {{ title: string, rows: object[], notes: string[] }} */
export function buildFormPreview(spec, env) {
  const stats = { total: 0 };
  const rows = (spec?.components ?? []).map((component) => previewComponent(component, env, stats)).filter(Boolean);
  const titleField = MODAL_FIELDS.find((f) => f.key === "title");
  const title = spec?.inputs?.title?.ref ? valueText(spec.inputs.title.ref, env) : String(literalOf(titleField, spec?.inputs?.title) ?? "");
  const notes = [];
  if (rows.length > 5) notes.push(`Discord shows at most 5 pieces in a form. This one has ${rows.length}.`);
  if (!title.trim()) notes.push("The form needs a title.");
  rows.forEach((row) => {
    if (row.type === 18 && !row.component) notes.push(`The question "${toDisplay(row.label) || "untitled"}" has no way to answer it yet.`);
  });
  notes.push(...duplicateIdNotes(spec?.components, env.catalog));
  return { title, rows, notes };
}

export { inputVisible, literalOf };
