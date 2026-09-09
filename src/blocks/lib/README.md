# `blocks/lib`

The tools block files are written with.

These used to live in `src/functions/` alongside things like the auth
redirect and the pretty-printer, which meant "what do I need to write a
block?" had no answer you could see. Everything a block file imports is
now in one place, next to the blocks themselves.

| module | what it is for |
| --- | --- |
| `createEvent.ts` | `createEventBlock` / `createEventVariable` — the whole family of blocks for one Discord event, from a short description |
| `createMutator.ts` | `createMutatorBlock` — a block with optional inputs the user turns on with checkboxes |
| `generatorUtils.js` | shared code-generation helpers, and `utilFunctions`, the runtime prelude injected into every exported bot |
| `restrictions.js` | `createRestrictions` — the rules that put a warning on a block that is in the wrong place |
| `addTooltips.js` | fills in the input/output/ID lines on tooltips at runtime |
| `registerCustomBlocks.js` | builds Blockly blocks from a Workshop pack's JSON |
| `fixers.js` | small validators shared by a couple of block files |

Registration itself is `blocks/index.js`: every file under `blocks/`
registers itself when it loads, so importing that module is what makes
the blocks exist.
