import * as Blockly from "blockly";
import { Order, javascriptGenerator } from "blockly/javascript";
import {
  COMPONENT_CHECKS,
  COMPONENT_ITEM_TYPES,
  COMPONENT_LOOP_INPUTS,
  findComponentOwner,
  isComponentLoop,
} from "./componentLoopTypes.js";

/* =====================================================================
   Loops inside a message's components — the generator side
   ---------------------------------------------------------------------
   A component block generates an expression followed by ",\n", and the
   block that owns the list (a message, container, gallery, row or menu)
   splices those into an array literal. A loop can't go in an array
   literal, so when an owner's stack has a loop in it the owner switches
   to building the array at runtime instead:

     await (async () => {
       const _cv2Items = [];
       for (...) { _cv2Items.push(new Discord.TextDisplayBuilder()…); }
       return _cv2Items;
     })()

   and every item that ends up in that list — directly, or through any
   number of loops — generates a `push` instead of its usual expression.

   An owner without a loop in its stack generates exactly what it always
   did, so nothing changes for a project that doesn't use this.
   ===================================================================== */

/** owner block id → the array its items push into, while it generates. */
const collectors = new Map();

function enabledStack(block, inputName) {
  const out = [];
  let current = block.getInputTargetBlock(inputName);

  while (current) {
    if (current.isEnabled() && !current.isInsertionMarker()) out.push(current);
    current = current.getNextBlock();
  }

  return out;
}

/**
 * The code for the list an owner builds from one of its statement
 * inputs.
 *
 * @returns {{ items: string } | { expression: string, statements: string, variable: string }}
 *   `items` is the old comma-separated form, for stacks without a loop;
 *   otherwise `statements` push into `variable`, and `expression` is an
 *   awaited IIFE that evaluates to the finished array.
 */
export function componentList(block, generator, inputName) {
  if (!enabledStack(block, inputName).some(isComponentLoop))
    return { items: generator.statementToCode(block, inputName) };

  const variable =
    collectors.size === 0 ? "_cv2Items" : `_cv2Items${collectors.size + 1}`;

  collectors.set(block.id, variable);
  let statements;
  try {
    statements = generator.statementToCode(block, inputName);
    if (!statements.endsWith("\n")) statements += "\n";
  } finally {
    collectors.delete(block.id);
  }

  return {
    variable,
    statements,
    expression: `await (async () => {
  const ${variable} = [];
${statements}  return ${variable};
})()`,
  };
}

/** Turns an item's usual "expression,\n" into a push when it's collected. */
function wrapItemGenerator(type) {
  const original = javascriptGenerator.forBlock[type];
  if (!original) return;

  javascriptGenerator.forBlock[type] = function (block, generator) {
    const code = original.call(this, block, generator);
    if (typeof code !== "string" || collectors.size === 0) return code;

    const owner = findComponentOwner(block);
    const variable = owner && collectors.get(owner.id);
    if (!variable) return code;

    return `${variable}.push(${code.replace(/,\s*$/, "").trim()});\n`;
  };
}

/**
 * Two loops run their blocks from a callback nobody waits for, which
 * would push components after the message was already sent. Inside a
 * component list they're generated so they're awaited; anywhere else
 * they stay exactly as they were.
 */
const AWAITED_IN_COMPONENTS = {
  invite_channel_foreach: (block, generator, original) =>
    `await ${original.call(block, block, generator)}`,

  fs_readdir: (block, generator) => {
    const dir = generator.valueToCode(block, "path", Order.ATOMIC);
    const doo = generator.statementToCode(block, "doo");

    return `{
  const files = await fs.promises.readdir(${dir});

  for (const file of files) {
    const filePath = path.join(${dir}, file);

    ${doo}}
}\n`;
  },
};

function wrapLoopGenerator(type, replacement) {
  const original = javascriptGenerator.forBlock[type];
  if (!original) return;

  javascriptGenerator.forBlock[type] = function (block, generator) {
    if (!findComponentOwner(block)) return original.call(this, block, generator);
    return replacement(block, generator, original);
  };
}

/** Adds the component checks to a connection that takes "default". */
function widenCheck(connection) {
  const check = connection?.getCheck();
  if (!check || !check.includes("default")) return;

  connection.setCheck([
    ...check,
    ...COMPONENT_CHECKS.filter((type) => !check.includes(type)),
  ]);
}

/**
 * DisFuse's own loops connect with the "default" check, which component
 * blocks don't have, so they couldn't go in a components section or
 * hold a text display. Blockly's core loops have no checks at all and
 * need nothing.
 */
function widenLoopBlock(type) {
  const definition = Blockly.Blocks[type];
  if (!definition?.init || definition.__componentLoops) return;

  const init = definition.init;
  definition.init = function (...args) {
    init.apply(this, args);

    widenCheck(this.previousConnection);
    widenCheck(this.nextConnection);
    for (const name of COMPONENT_LOOP_INPUTS[type] ?? [])
      widenCheck(this.getInput(name)?.connection);
  };
  definition.__componentLoops = true;
}

let enabled = false;

/** Called once every block file has registered itself. */
export function enableComponentLoops() {
  if (enabled) return;
  enabled = true;

  COMPONENT_ITEM_TYPES.forEach(wrapItemGenerator);
  Object.entries(AWAITED_IN_COMPONENTS).forEach(([type, replacement]) =>
    wrapLoopGenerator(type, replacement),
  );
  Object.keys(COMPONENT_LOOP_INPUTS).forEach(widenLoopBlock);
}
