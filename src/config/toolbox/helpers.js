/* =====================================================================
   Building toolbox entries
   ---------------------------------------------------------------------
   Blockly's toolbox is plain JSON, and writing it out by hand is
   repetitive enough that these four helpers have always existed. What
   changed is where they live: they used to sit at the top of one
   3,638-line file that also held all 63 categories.

   The categories now import from here, so adding a block means opening
   one small file rather than scrolling to the right depth in a very
   large one.
   ===================================================================== */

/**
 * Shadow blocks by the *type they accept* rather than by block type.
 *
 * `shadow("String")` is the readable way to say "a text field the user
 * can type into". This was here before but unreachable — every call site
 * passed the Blockly type (`"text"`, `"math_number"`) instead, so the
 * table was never consulted. Both spellings work now.
 */
const DEFAULT_SHADOWS = {
  Number: { kind: "shadow", type: "math_number", fields: { NUM: 5 } },
  String: { kind: "shadow", type: "text", fields: { TEXT: "" } },
  Boolean: { kind: "shadow", type: "logic_boolean" },
};

/** A block in the flyout. */
export function block(type, properties = {}) {
  return { kind: "block", type, ...properties };
}

/**
 * The greyed-out placeholder inside an input.
 *
 * @param {string} type a Blockly block type, or one of the friendly
 *   names in DEFAULT_SHADOWS: "Number", "String", "Boolean"
 */
export function shadow(type, properties = {}) {
  const preset = DEFAULT_SHADOWS[type];

  if (preset)
    return {
      ...preset,
      ...properties,
      fields: { ...preset.fields, ...properties.fields },
    };

  return { kind: "shadow", type, ...properties };
}

/** Vertical space between groups of categories. */
export function sep(gap) {
  return gap === undefined ? { kind: "sep" } : { kind: "sep", gap };
}

/** A line of text in a flyout. */
export function label(text) {
  return { kind: "label", text };
}

/**
 * A horizontal rule between groups of blocks inside one category.
 *
 * These were written as labels full of hyphens, with the number of
 * hyphens differing from one category to the next — thirty-two in Logic,
 * forty-eight in Events — so the rules never lined up.
 */
export function divider() {
  return label("————————————————————————");
}

/**
 * A titled group of blocks inside a category.
 *
 * About 150 of the toolbox's labels were headings written as
 * `label("Get lyrics ↓")` immediately followed by their blocks. Saying
 * it once keeps the arrow, the spacing and the order consistent.
 */
export function section(title, blocks) {
  return [label(`${title} ↓`), ...blocks];
}

/** A text input pre-filled with nothing — by far the commonest shadow. */
export function textInput(name, text = "") {
  return { [name]: { shadow: shadow("String", { fields: { TEXT: text } }) } };
}
