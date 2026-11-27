/* =====================================================================
   Shared pieces for the social media and video site elements
   ---------------------------------------------------------------------
   YouTube, Reddit, Twitch, Kick, X, Instagram, TikTok and Bluesky all
   work the same way, so their modules are written with these:

     lookup()    "get a Kick channel" → a step whose section runs with
                 what was found (nothing runs when nothing was found),
                 and a "get [info] of Kick channel" block to read it
     loop()      "for each live Kick stream" → a step whose section runs
                 once per item
     watcher()   "when a Kick channel goes live" → an event that checks
                 every few minutes
     check()     a value that asks the site something ("is live?")

   Each site's helper functions go in `setup` with a fixed name, so a
   bot gets them once however many steps use them. The code is the code
   the block editor's app blocks have always generated.
   ===================================================================== */

import { input } from "../../define.js";

/* ---- Runtime helpers ------------------------------------------------ */

/** Runs a check every few minutes (at least 1), starting a few seconds after the bot starts. */
export const APP_WATCH = {
  key: "appWatch",
  code: `function appWatch(minutes, label, check) {
  const every = Math.max(1, Number(minutes) || 5) * 60 * 1000;
  const run = async () => {
    try { await check(); } catch (error) { console.error("Error checking " + label + ":", error); }
  };
  setTimeout(run, 5000);
  setInterval(run, every);
}`,
};

/**
 * Code that remembers what was there when the bot started, then runs
 * `code` once for each new item (oldest first) with it in `variable`.
 */
export function newItemsCode({ minutes, label, list, variable, code }) {
  return `(() => {
  let seenItems = null;
  appWatch(${minutes}, "${label}", async () => {
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
 * Code for "when ... goes live / goes offline". `stream` resolves to the
 * live stream, null when offline, or undefined when the check failed
 * (which is ignored).
 */
export function liveChangeCode({
  minutes,
  label,
  stream,
  variable,
  when,
  code,
}) {
  return `(() => {
  let wasLive;
  let lastStream = null;
  appWatch(${minutes}, "${label}", async () => {
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

/** Runs `body` with the result of `expr` in `variable`, when there is one. */
export function thenCode(variable, noun, expr, body) {
  return `await (${expr})
  .then(async (${variable}) => {
    if (!${variable}) return;

    ${body}})
  .catch(async (error) => console.error("Error getting ${noun}:", error));\n`;
}

/** Runs `body` once per item of `expr`, in `variable`. */
export function loopCode(variable, noun, expr, body) {
  return `for (const ${variable} of (await (${expr}).catch(async (error) => { console.error("Error getting ${noun}:", error); return []; })) || []) {
  ${body}}\n`;
}

/* ---- Shapes ----------------------------------------------------------- */

const capitalise = (text) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * The values something found provides, from `[blockLabel, key, type,
 * builderLabel?]` rows. The block reads them with one "get [info] of ..."
 * block; the builder offers each as a value of its own.
 */
export function fieldsOf(variable, rows) {
  return rows.map(([blockLabel, key, type = "String", label]) => ({
    key,
    label: label ?? capitalise(blockLabel),
    type,
    code: `${variable}?.${key}`,
  }));
}

/** The "get [info] of <noun>" block reading `rows` (see fieldsOf). */
export function infoBlock(
  type,
  noun,
  rows,
  { tooltip, inside = [], also = [] } = {},
) {
  return {
    type,
    text: `get {info} of ${noun}`,
    parts: {
      info: {
        part: "dropdown",
        options: rows.map(([label, key]) => [label, key]),
      },
    },
    tooltip: tooltip ?? `Information about the ${noun} you got`,
    pick: "info",
    ...(also.length ? { also } : {}),
    ...(inside.length
      ? {
          restrictions: [
            {
              type: "hasParent",
              blockTypes: inside,
              message: `This block must be inside a block that gets a ${noun}.`,
            },
          ],
        }
      : {}),
  };
}

/** How often a watcher checks, in minutes. */
export const minutesInput = (fallback = 5) =>
  input.number("minutes", "Check every (minutes)", {
    default: fallback,
    min: 1,
    allowValues: false,
    help: "At least 1. Checking more often finds things sooner but uses more of the site's limits.",
  });

/**
 * Makes the element functions for one site.
 *
 * @param {object} site
 * @param {string} site.name       "Kick"
 * @param {string} site.colour     the blocks' colour
 * @param {Array}  site.setup      the site's helper functions (APP_WATCH is added for watchers)
 * @param {Array}  [site.dependencies]
 * @param {object} fns             group() functions: { action, value, event }
 */
export function site(
  { name, colour, setup, dependencies },
  { action, value, event },
) {
  const common = (def) => ({
    category: "apps",
    group: name,
    ...def,
    keywords: [name.toLowerCase(), ...(def.keywords ?? [])],
    setup: [...setup, ...(def.setup ?? [])],
    ...(dependencies ? { dependencies } : {}),
  });
  const blockOf = (block, extra = {}) => ({ colour, ...block, ...extra });

  return {
    /**
     * A step that looks something up, with a section that runs with it.
     * `variable` holds what was found; `expr(ctx)` is code resolving to
     * it (or null). `fields` are fieldsOf rows; `info` the reading block.
     */
    lookup({ variable, noun, fields, info, expr, block, branchLabel, ...def }) {
      return action(
        common({
          ...def,
          block: blockOf(block, {
            parts: { code: { check: "default" }, ...(block.parts ?? {}) },
          }),
          branches: [
            {
              key: "code",
              label: branchLabel ?? `With the ${noun}`,
              provides: fieldsOf(variable, fields),
              ...(info ? { valuesBlock: info } : {}),
            },
          ],
          code: (ctx) =>
            thenCode(variable, noun, expr(ctx), ctx.branch("code")),
        }),
      );
    },

    /** A step that runs its section once per item `expr(ctx)` resolves to. */
    loop({ variable, noun, fields, info, expr, block, branchLabel, ...def }) {
      return action(
        common({
          ...def,
          block: blockOf(block, {
            parts: { code: { check: "default" }, ...(block.parts ?? {}) },
          }),
          branches: [
            {
              key: "code",
              label: branchLabel ?? `For each ${noun}`,
              provides: fieldsOf(variable, fields),
              ...(info ? { valuesBlock: info } : {}),
            },
          ],
          code: (ctx) =>
            loopCode(variable, noun, expr(ctx), ctx.branch("code")),
        }),
      );
    },

    /** An event that checks the site every few minutes (`watch(ctx, body)`). */
    watcher({
      variable,
      fields,
      info,
      watch,
      block,
      extraValues = [],
      ...def
    }) {
      return event(
        common({
          ...def,
          setup: [APP_WATCH, ...(def.setup ?? [])],
          block: blockOf(block, {
            body: { name: "code", check: "default" },
            inline: false,
          }),
          params: [],
          values: [...fieldsOf(variable, fields), ...extraValues],
          ...(info ? { valuesBlock: info } : {}),
          wrap: (ctx, body) => watch(ctx, body),
        }),
      );
    },

    /** A plain step. */
    step({ block, ...def }) {
      return action(common({ ...def, block: blockOf(block) }));
    },

    /** A value. */
    check({ block, ...def }) {
      return value(
        common({
          ...def,
          block: blockOf(block, { inline: block.inline ?? true }),
        }),
      );
    },
  };
}
