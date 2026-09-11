import * as Blockly from "blockly";

/* =====================================================================
   Reading a value out of the blocks
   ---------------------------------------------------------------------
   A preview has to answer "what will this message say?" before the bot
   has ever run, and most of what goes into a message is not knowable
   until it does: a variable, the member who sent a command, the result
   of a database read.

   So every value resolves to one of two things — the literal the user
   typed, or a *placeholder* naming what will be substituted at runtime.
   Placeholders are wrapped in two Private Use Area characters so they
   survive being concatenated into a string of Discord markdown and can
   still be picked out and drawn as a chip at the other end. Nothing a
   user can type produces those characters, and `toDisplay` turns them
   into plain `{braces}` for anywhere that isn't rendered as markdown.
   ===================================================================== */

export const DYNAMIC_OPEN = "\uE000";
export const DYNAMIC_CLOSE = "\uE001";

/** How much of a block's own description a placeholder keeps. */
const MAX_LABEL = 44;

const DYNAMIC_PATTERN = new RegExp(
  `${DYNAMIC_OPEN}([^${DYNAMIC_CLOSE}]*)${DYNAMIC_CLOSE}`,
  "g",
);

/** How deep an expression is followed before it is called a placeholder. */
const MAX_DEPTH = 12;

/** "whatever this block works out to, at the moment the bot runs". */
export function dynamic(label) {
  const clean =
    String(label ?? "")
      .replace(/[\uE000\uE001]/g, "")
      .replace(/\s+/g, " ")
      .trim() || "value";

  return DYNAMIC_OPEN + clean + DYNAMIC_CLOSE;
}

export function hasDynamic(text) {
  return typeof text === "string" && text.includes(DYNAMIC_OPEN);
}

/** The plain-text form, for anything not rendered as Discord markdown. */
export function toDisplay(text) {
  if (typeof text !== "string") return "";
  return text.replace(DYNAMIC_PATTERN, (_, label) => `{${label}}`);
}

/**
 * The value, but only if all of it is known now.
 *
 * Anywhere a half-known string would be actively wrong — a URL, an
 * emoji, a colour — wants this rather than the display form.
 */
export function literalOnly(text) {
  if (typeof text !== "string" || hasDynamic(text)) return null;

  const trimmed = text.trim();
  return trimmed.length ? trimmed : null;
}

/** What a block that can't be read statically should be called. */
function describe(block) {
  try {
    return block.toString(MAX_LABEL);
  } catch {
    return block.type;
  }
}

function valueInputs(block) {
  return block.inputList.filter(
    (input) => input.type === Blockly.inputs.inputTypes.VALUE,
  );
}

function readValue(target, depth) {
  if (!target || depth > MAX_DEPTH) return "";

  /* The code generator skips disabled blocks, so the preview has to as
     well — otherwise it shows text the bot will never send. */
  if (!target.isEnabled() || target.isInsertionMarker()) return "";

  switch (target.type) {
    case "text":
    case "text_multiline":
      return String(target.getFieldValue("TEXT") ?? "");

    case "text_newline":
      return "\n";

    case "math_number":
      return String(target.getFieldValue("NUM") ?? "");

    case "logic_boolean":
      return target.getFieldValue("BOOL") === "TRUE" ? "true" : "false";

    case "colour_picker":
      return String(target.getFieldValue("COLOUR") ?? "");

    /* Every input of a join, in order. Written against the input list
       rather than against ADD0…ADDn so a mutator that grows or shrinks
       needs no change here. */
    case "text_join":
      return valueInputs(target)
        .map((input) => readValue(input.connection?.targetBlock(), depth + 1))
        .join("");

    case "variables_get":
      return dynamic(target.getField("VAR")?.getText() || "variable");

    default:
      return dynamic(describe(target));
  }
}

/** A value input, as a string of literals and placeholders. */
export function resolveText(block, inputName) {
  if (!block?.getInput?.(inputName)) return "";
  return readValue(block.getInputTargetBlock(inputName), 0);
}

/** `true`, `false`, or `null` when it isn't decided until the bot runs. */
export function resolveBoolean(block, inputName) {
  const target = block?.getInput?.(inputName)
    ? block.getInputTargetBlock(inputName)
    : null;

  if (!target || !target.isEnabled()) return null;
  if (target.type !== "logic_boolean") return null;

  return target.getFieldValue("BOOL") === "TRUE";
}

/**
 * A container's accent stripe, as the integer Discord wants.
 *
 * The generated code is `parseInt(colour.replace('#',''), 16)`, so
 * anything that isn't six hex digits produces `NaN` there and no stripe
 * here — which is what the bot will actually show.
 */
export function resolveColour(block, inputName) {
  const literal = literalOnly(resolveText(block, inputName));
  if (!literal) return null;

  const match = /^#?([0-9a-f]{6})$/i.exec(literal);
  return match ? parseInt(match[1], 16) : null;
}

/**
 * An emoji field, in the shape the message renderer expects.
 *
 * Discord takes either a unicode emoji or `<:name:id>` / `<a:name:id>`
 * for a custom one; a half-known value is neither, so it is dropped
 * rather than drawn as a broken image.
 */
export function parseEmoji(text) {
  const literal = literalOnly(text);
  if (!literal) return null;

  const custom = /^<(a)?:(\w+):(\d{15,25})>$/.exec(literal);
  if (custom)
    return { animated: Boolean(custom[1]), name: custom[2], id: custom[3] };

  return { name: literal };
}

/**
 * A stand-in for an image whose URL isn't known yet.
 *
 * Media is by far the commonest dynamic value in a message — an avatar,
 * a generated card — and rendering nothing at all makes a gallery or a
 * section look broken rather than unfinished. This keeps the shape of
 * the layout and says what will go there.
 */
export function placeholderImage(label) {
  const text = toDisplay(String(label ?? ""))
    .replace(/[<>&"]/g, "")
    .slice(0, 30);

  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">',
    '<rect width="400" height="300" fill="#232428"/>',
    '<rect x="8" y="8" width="384" height="284" rx="10" fill="none"',
    ' stroke="#4e5058" stroke-width="2" stroke-dasharray="10 8"/>',
    '<text x="200" y="140" fill="#80848e" font-family="sans-serif"',
    ' font-size="46" text-anchor="middle">&#128247;</text>',
    '<text x="200" y="190" fill="#949ba4" font-family="sans-serif"',
    ` font-size="17" text-anchor="middle">${text || "image"}</text>`,
    "</svg>",
  ].join("");

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
