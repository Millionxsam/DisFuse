import * as Blockly from "blockly/core";
import { Order, javascriptGenerator } from "blockly/javascript";

/* Shared shapes and runtime helpers for the social media app blocks
   (Twitch, Kick, X, Instagram, TikTok, Bluesky). Each of those files
   calls `appBlocks(colour)` to get block shapes in its own colour. */

/** Reads a value input, with a fallback when nothing is plugged in. */
export const value = (block, generator, name, fallback = "''") =>
  generator.valueToCode(block, name, Order.NONE) || fallback;

/** Runs a check every few minutes (at least 1), starting a few seconds after the bot starts. */
export const watch = () =>
  javascriptGenerator.provideFunction_(
    "appWatch",
    `function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(minutes, label, check) {
  const every = Math.max(1, Number(minutes) || 5) * 60 * 1000;
  const run = async () => {
    try { await check(); } catch (error) { console.error("Error checking " + label + ":", error); }
  };
  setTimeout(run, 5000);
  setInterval(run, every);
}`,
  );

/**
 * Code for a "when ... posts something new" block: remembers what was
 * there when the bot started, then runs `code` once for each new item
 * (oldest first) with it stored in `variable`.
 */
export function newItemsCode({ minutes, label, list, variable, code }) {
  return `(() => {
  let seenItems = null;
  ${watch()}(${minutes}, "${label}", async () => {
    const items = (await ${list}) || [];
    if (!items.length) return;

    if (!seenItems) {
      seenItems = new Set(items.map(item => String(item.id)));
      return;
    }

    for (const ${variable} of items.filter(item => !seenItems.has(String(item.id))).reverse()) {
      seenItems.add(String(${variable}.id));
      ${code}}
  });
})();\n`;
}

/**
 * Code for a "when ... goes live / goes offline" block. `stream` is code
 * that resolves to the live stream object, or null when offline (or
 * undefined if the check failed, which is ignored).
 */
export function liveChangeCode({ minutes, label, stream, variable, when, code }) {
  return `(() => {
  let wasLive;
  let lastStream = null;
  ${watch()}(${minutes}, "${label}", async () => {
    const stream = await ${stream};
    if (stream === undefined) return;
    const isLive = !!stream;

    if (wasLive === undefined) {
      wasLive = isLive;
      lastStream = stream;
      return;
    }

    const changed = isLive !== wasLive;
    wasLive = isLive;
    if (stream) lastStream = stream;
    if (!changed || ${when === "offline" ? "isLive" : "!isLive"}) return;

    const ${variable} = ${when === "offline" ? "lastStream" : "stream"};
    if (!${variable}) return;
    ${code}});
})();\n`;
}

/** Block shapes in one colour. */
export function appBlocks(colour) {
  /** A statement block with a "then" section. */
  function thenBlock(block, tooltip) {
    block.appendStatementInput("code").appendField("then").setCheck("default");
    statementBlock(block, tooltip);
  }

  /** A statement block with a "do" section, for loops. */
  function loopBlock(block, tooltip) {
    block.appendStatementInput("code").appendField("do").setCheck("default");
    statementBlock(block, tooltip);
  }

  /** A "when..." block that goes on its own in the workspace. */
  function hatBlock(block, tooltip) {
    block.appendStatementInput("code").setCheck("default");
    block.setInputsInline(false);
    block.setPreviousStatement(false);
    block.setNextStatement(false);
    block.setColour(colour);
    block.setTooltip(tooltip);
  }

  /** A plain statement block. */
  function statementBlock(block, tooltip) {
    block.setPreviousStatement(true, "default");
    block.setNextStatement(true, "default");
    block.setColour(colour);
    block.setTooltip(tooltip);
  }

  /** A reporter block. */
  function outputBlock(block, output, tooltip) {
    block.setOutput(true, output);
    block.setColour(colour);
    block.setTooltip(tooltip);
  }

  /** A "get [property] of X" block, reading the variable a getter defined. */
  function infoBlock(type, variable, noun, options, tooltip) {
    Blockly.Blocks[type] = {
      init: function () {
        this.appendDummyInput()
          .appendField("get")
          .appendField(new Blockly.FieldDropdown(options), "info")
          .appendField(`of ${noun}`);
        outputBlock(this, null, tooltip || `Information about the ${noun} you got`);
      },
    };

    javascriptGenerator.forBlock[type] = function (block) {
      const info = block.getFieldValue("info");
      return [`${variable}?.${info}`, Order.MEMBER];
    };
  }

  return {
    thenBlock,
    loopBlock,
    hatBlock,
    statementBlock,
    outputBlock,
    infoBlock,
  };
}

/** Generator for a "get X then" block: runs the blocks inside with the result, if there is one. */
export function thenGenerator(variable, noun, codeOf) {
  return function (block, generator) {
    const code = generator.statementToCode(block, "code");

    return `await (${codeOf(block, generator)})
  .then(async (${variable}) => {
    if (!${variable}) return;

    ${code}})
  .catch(async (error) => console.error("Error getting ${noun}:", error));\n`;
  };
}

/** Generator for a "for each X" block: runs the blocks inside once per item. */
export function loopGenerator(variable, noun, codeOf) {
  return function (block, generator) {
    const code = generator.statementToCode(block, "code");

    return `for (const ${variable} of (await (${codeOf(block, generator)}).catch(async (error) => { console.error("Error getting ${noun}:", error); return []; })) || []) {
  ${code}}\n`;
  };
}
