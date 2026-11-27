/* =====================================================================
   DisFuse Builder: value types
   ---------------------------------------------------------------------
   Every value has an output type and every input says which types it
   accepts. The names are the same strings the block editor has always
   used for its connection checks ("String", "member", "channel"...), so
   a block's `setOutput(true, "member")` and `setCheck("member")` carry
   straight across into a definition here without translation.

   `null` (written ANY) means "anything": a value whose type can't be
   known ahead of time (a variable, a JSON property), or an input that
   takes whatever it is given.

   This module is plain JavaScript with no imports so the catalog check
   script can load it in Node.
   ===================================================================== */

export const ANY = null;

/**
 * Every type, with what the builder shows for it.
 *
 * `label` is user-facing. `icon` is a Font Awesome class.
 * `color` tints value pills of this type.
 */
export const TYPES = {
  String: { label: "Text", icon: "fa-solid fa-font", color: "#35d0a0" },
  Number: { label: "Number", icon: "fa-solid fa-hashtag", color: "#5b8cff" },
  Boolean: { label: "True/false", icon: "fa-solid fa-toggle-on", color: "#ffb648" },
  Colour: { label: "Color", icon: "fa-solid fa-palette", color: "#e23fe2" },
  date: { label: "Date", icon: "fa-solid fa-calendar", color: "#7fb3ff" },
  Array: { label: "List", icon: "fa-solid fa-list", color: "#a78bfa" },
  object: { label: "Object", icon: "fa-solid fa-cube", color: "#c084fc" },
  regexp: { label: "Pattern", icon: "fa-solid fa-asterisk", color: "#94a3b8" },
  buffer: { label: "File data", icon: "fa-solid fa-file", color: "#94a3b8" },
  error: { label: "Error", icon: "fa-solid fa-triangle-exclamation", color: "#ff5c5c" },

  user: { label: "User", icon: "fa-solid fa-user", color: "#57b8ff" },
  member: { label: "Member", icon: "fa-solid fa-user-tag", color: "#57b8ff" },
  server: { label: "Server", icon: "fa-solid fa-server", color: "#8b9cff" },
  channel: { label: "Channel", icon: "fa-solid fa-hashtag", color: "#4fd1c5" },
  message: { label: "Message", icon: "fa-solid fa-message", color: "#60a5fa" },
  role: { label: "Role", icon: "fa-solid fa-shield-halved", color: "#f472b6" },
  emoji: { label: "Emoji", icon: "fa-solid fa-face-smile", color: "#facc15" },
  sticker: { label: "Sticker", icon: "fa-solid fa-note-sticky", color: "#facc15" },
  invite: { label: "Invite", icon: "fa-solid fa-envelope-open-text", color: "#34d399" },
  webhook: { label: "Webhook", icon: "fa-solid fa-link", color: "#38bdf8" },
  attachment: { label: "Attachment", icon: "fa-solid fa-paperclip", color: "#94a3b8" },
  everyone: { label: "@everyone", icon: "fa-solid fa-at", color: "#f472b6" },
  permission: { label: "Permission", icon: "fa-solid fa-key", color: "#fbbf24" },
  permissionChannel: { label: "Channel permission", icon: "fa-solid fa-key", color: "#fbbf24" },
  channelType: { label: "Channel type", icon: "fa-solid fa-layer-group", color: "#4fd1c5" },
  interaction: { label: "Interaction", icon: "fa-solid fa-hand-pointer", color: "#818cf8" },
  modal: { label: "Form", icon: "fa-solid fa-window-maximize", color: "#1a8793" },
};

/** Types a value can be turned into text from, when it lands in a text input. */
const TEXT_CONVERTIBLE = new Set([
  "String",
  "Number",
  "Boolean",
  "date",
  "user",
  "member",
  "channel",
  "role",
  "emoji",
  "server",
  "message",
  "Colour",
  "error",
  "everyone",
]);

/** Normalises a type or list of types to an array. `null` → `[null]`. */
export function typeList(types) {
  if (types === undefined) return [null];
  return Array.isArray(types) ? types : [types];
}

/** A friendly name for a type or list of types. */
export function typeLabel(types) {
  const list = typeList(types);
  if (list.includes(null)) return "Anything";
  return list.map((t) => TYPES[t]?.label ?? t).join(" or ");
}

/** The display info for the first concrete type in a list. */
export function typeInfo(types) {
  const first = typeList(types).find((t) => t !== null);
  return (
    TYPES[first] ?? { label: "Anything", icon: "fa-solid fa-circle", color: "#9aa7b8" }
  );
}

/**
 * Can a value with `output` type(s) go into an input that accepts
 * `accepts` type(s)?
 *
 * @param {string|string[]|null} output  what the value produces
 * @param {string|string[]|null} accepts what the input takes
 * @param {string} [inputKind] the input's kind; text inputs also take
 *   anything that has a sensible text form (numbers, members as
 *   mentions, and so on)
 */
export function canConnect(output, accepts, inputKind) {
  const out = typeList(output);
  const acc = typeList(accepts);

  if (out.includes(null) || acc.includes(null)) return true;
  if (out.some((t) => acc.includes(t))) return true;

  if (inputKind === "text" && out.some((t) => TEXT_CONVERTIBLE.has(t)))
    return true;

  return false;
}

/**
 * Whether code for a value of type `output` must be wrapped in
 * `String(...)` before it is used where text is expected.
 */
export function needsTextConversion(output) {
  const out = typeList(output);
  if (out.includes(null)) return false;
  return !out.includes("String");
}
