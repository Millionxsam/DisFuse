/* =====================================================================
   Reading the block editor's saved blocks
   ---------------------------------------------------------------------
   A block editor workspace is saved as Blockly's JSON serialization:

     { blocks: { blocks: Block[] }, variables: [{ id, name }] }

     Block = {
       type, id,
       fields?:  { [name]: value | { id } },      // { id } for variable fields
       inputs?:  { [name]: { block?, shadow? } }, // value and statement inputs
       next?:    { block? },                      // the block stacked under it
       extraState?, enabled?: false, ...
     }

   Empty inputs are left out entirely, so a name that isn't there means
   "nothing in it". These helpers only read that shape; nothing here
   knows Blockly itself.
   ===================================================================== */

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

/** A workspace's saved data (a JSON string or an object), parsed. */
export function parseWorkspaceData(data) {
  if (!data) return { blocks: [], variables: [] };
  let parsed = data;
  if (typeof data === "string") {
    try {
      parsed = JSON.parse(data);
    } catch {
      return { blocks: [], variables: [] };
    }
  }
  if (!isObject(parsed)) return { blocks: [], variables: [] };
  return {
    blocks: Array.isArray(parsed.blocks?.blocks) ? parsed.blocks.blocks : [],
    variables: Array.isArray(parsed.variables) ? parsed.variables : [],
  };
}

/** The block in an input: the real one, or the shadow under it. */
export function inputBlock(block, name) {
  const slot = block?.inputs?.[name];
  return slot?.block ?? slot?.shadow ?? null;
}

/** A field's value. Variable fields give their `{ id }`. */
export function fieldValue(block, name) {
  return block?.fields?.[name];
}

/** A block and every block stacked under it, as a list. */
export function stackFrom(first) {
  const list = [];
  let current = first;
  let guard = 0;
  while (current && guard++ < 100000) {
    list.push(current);
    current = current.next?.block ?? null;
  }
  return list;
}

/** The blocks in a statement input, as a list. */
export function statementStack(block, name) {
  return stackFrom(block?.inputs?.[name]?.block ?? null);
}

/** Whether a block was switched off in the editor. */
export function isDisabled(block) {
  return block?.enabled === false || block?.disabled === true || block?.disabledReasons?.length > 0;
}

/** Every field and input name on a block. */
export function partNames(block) {
  return [...Object.keys(block?.fields ?? {}), ...Object.keys(block?.inputs ?? {})];
}

/** `extraState`, which older blocks save as a `<mutation ...>` string. */
export function extraState(block) {
  const state = block?.extraState;
  if (isObject(state)) return state;
  if (typeof state !== "string") return {};
  const out = {};
  for (const match of state.matchAll(/([A-Za-z_][\w-]*)="([^"]*)"/g)) out[match[1]] = match[2];
  return out;
}

/**
 * Who a message block's pings notify (the block editor's "allowed pings"
 * option, src/blocks/lib/pings.js), as the message builder saves it. A
 * block saved before the option existed let every ping notify.
 */
export function pingsOf(block) {
  const state = extraState(block);
  if (!("pings" in state)) return { users: true, roles: true, everyone: true };
  const read = (name, fallback) => (state[name] == null ? fallback : String(state[name]) === "true");
  return {
    users: read("ping_users", true),
    roles: read("ping_roles", false),
    everyone: read("ping_everyone", false),
  };
}

/** Calls fn(block) for a block and everything inside or under it. */
export function walkBlocks(block, fn) {
  const visit = (current) => {
    if (!current) return;
    fn(current);
    for (const slot of Object.values(current.inputs ?? {})) {
      visit(slot?.block);
      if (slot?.shadow && !slot.block) visit(slot.shadow);
    }
    visit(current.next?.block);
  };
  visit(block);
}

/** Names are compared without case, spaces or punctuation. */
export function looseName(name) {
  return String(name ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** The text in a plain text block, or null if it isn't one. */
export function textLiteral(block) {
  if (!block) return null;
  if (block.type === "text" || block.type === "text_multiline") return String(block.fields?.TEXT ?? "");
  return null;
}
