/* =====================================================================
   Asynchronous functions
   ---------------------------------------------------------------------
   The "to do something" blocks are Blockly's own, so they aren't
   defined anywhere in DisFuse. This file adds one option to them: an
   "asynchronous" checkbox in their gear menu. A function with it ticked
   is generated as an `async function`, so blocks that wait for Discord
   work inside it, and every call to it is awaited.

   Blockly's definitions are wrapped rather than replaced, so everything
   else about the blocks — inputs, renaming, the "allow statements"
   option — behaves exactly as it always has, and projects saved before
   this existed load as ordinary functions.
   ===================================================================== */

import * as Blockly from "blockly";
import { javascriptGenerator, Order } from "blockly/javascript";

const DEFINITIONS = ["procedures_defnoreturn", "procedures_defreturn"];

/** Wraps `obj[key]` so `wrapper(original, ...args)` runs in its place. */
function wrap(obj, key, wrapper) {
  const original = obj[key];
  obj[key] = function (...args) {
    return wrapper.call(this, original, ...args);
  };
}

/* The gear menu's top block gets the checkbox. It sits below "allow
   statements", which only the returning function has. */
wrap(Blockly.Blocks["procedures_mutatorcontainer"], "init", function (original) {
  original.call(this);
  this.appendDummyInput("ASYNC_INPUT")
    .appendField("asynchronous")
    .appendField(new Blockly.FieldCheckbox(false), "ASYNC");
});

DEFINITIONS.forEach(type => {
  const block = Blockly.Blocks[type];

  /* Shows "asynchronously" after the function's name and inputs, so it
     can be told apart from an ordinary function at a glance. */
  block.setAsync_ = function (isAsync) {
    isAsync = !!isAsync;
    if (this.isAsync_ === isAsync) return;
    this.isAsync_ = isAsync;

    const topRow = this.getField("NAME")?.getParentInput();
    if (!topRow) return;

    if (isAsync) topRow.appendField("asynchronously", "ASYNC_LABEL");
    else if (this.getField("ASYNC_LABEL")) topRow.removeField("ASYNC_LABEL");
  };

  wrap(block, "init", function (original) {
    this.isAsync_ = false;
    original.call(this);
  });

  /* JSON saving. Blockly saves nothing when a function has no inputs,
     so an async one starts from an empty state. */
  wrap(block, "saveExtraState", function (original, ...args) {
    const state = original.apply(this, args);
    if (!this.isAsync_) return state;
    return { ...(state || {}), async: true };
  });

  wrap(block, "loadExtraState", function (original, state) {
    original.call(this, state);
    this.setAsync_(state?.async);
  });

  // XML, which older projects and the gear menu itself still use.
  wrap(block, "mutationToDom", function (original, ...args) {
    const mutation = original.apply(this, args);
    if (this.isAsync_) mutation.setAttribute("async", "true");
    return mutation;
  });

  wrap(block, "domToMutation", function (original, mutation) {
    original.call(this, mutation);
    this.setAsync_(mutation.getAttribute("async") === "true");
  });

  wrap(block, "decompose", function (original, workspace) {
    const container = original.call(this, workspace);
    container.setFieldValue(this.isAsync_ ? "TRUE" : "FALSE", "ASYNC");
    return container;
  });

  wrap(block, "compose", function (original, container) {
    original.call(this, container);
    this.setAsync_(container.getFieldValue("ASYNC") === "TRUE");
  });

  /* `async function name(` in place of `function name(`. The definition
     is stored on the generator rather than returned, so it is rewritten
     there. */
  wrap(javascriptGenerator.forBlock, type, function (original, defBlock, generator) {
    const result = original.call(this, defBlock, generator);
    if (!defBlock.isAsync_) return result;

    const name = generator.getProcedureName(defBlock.getFieldValue("NAME"));
    const key = "%" + name;
    const code = generator.definitions_[key];
    if (typeof code === "string")
      generator.definitions_[key] = code.replace(
        `function ${name}(`,
        `async function ${name}(`,
      );

    return result;
  });
});

/* Calls to an async function wait for it to finish. Blockly's statement
   call is generated from the value call, so this covers both. */
wrap(javascriptGenerator.forBlock, "procedures_callreturn", function (original, callBlock, generator) {
  const [code, order] = original.call(this, callBlock, generator);

  const definition = Blockly.Procedures.getDefinition(
    callBlock.getFieldValue("NAME"),
    callBlock.workspace,
  );
  if (!definition?.isAsync_) return [code, order];

  return [`await ${code}`, Order.AWAIT];
});
