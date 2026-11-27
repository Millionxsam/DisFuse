/* =====================================================================
   A sandbox for running generated bots
   ---------------------------------------------------------------------
   `await run(code)` executes a generated bot where discord.js, every npm
   package and every Discord object are "anything" objects: any property
   exists, anything can be called, awaited, iterated, compared. Event
   handlers and callbacks are called the moment they're passed, and
   nothing touches the network. Against objects like that almost nothing
   can fail, EXCEPT looking up a name that isn't declared, so it returns
   the ReferenceErrors the bot hit.
   ===================================================================== */

import vm from "node:vm";

/* ---------------------------------------------------------------------
   "Anything" objects
   --------------------------------------------------------------------- */

export function makeWorld() {
  const pending = [];
  let budget = 4000;
  const errors = [];

  const record = (error) => {
    if (error instanceof ReferenceError || error?.name === "ReferenceError") errors.push(error);
  };

  const runCallbacks = (argsList) => {
    for (const arg of argsList) {
      if (typeof arg !== "function" || arg.__anything) continue;
      if (budget-- <= 0) return;
      try {
        const result = arg(anything(), anything(), anything());
        if (result && typeof result.then === "function") pending.push(result.catch(record));
      } catch (error) {
        record(error);
      }
    }
  };

  function anything(thenable = true) {
    const target = function () {};
    return new Proxy(target, {
      get(_, prop) {
        if (prop === "__anything") return true;
        if (prop === "then") return thenable ? (resolve) => resolve(anything(false)) : undefined;
        if (prop === Symbol.iterator) return function* () { yield anything(); };
        if (prop === Symbol.asyncIterator) return async function* () { yield anything(); };
        if (prop === Symbol.toPrimitive) return (hint) => (hint === "number" ? 1 : "x");
        if (prop === "toString" || prop === "toJSON") return () => "x";
        if (prop === "valueOf") return () => 1;
        if (prop === "length" || prop === "size") return 1;
        if (prop === Symbol.toStringTag) return "Anything";
        if (typeof prop === "symbol") return undefined;
        return anything();
      },
      set() {
        return true;
      },
      has() {
        return true;
      },
      apply(_, __, callArgs) {
        runCallbacks(callArgs);
        return anything();
      },
      construct(_, callArgs) {
        runCallbacks(callArgs);
        return anything();
      },
      getPrototypeOf() {
        return Object.prototype;
      },
    });
  }

  return { anything, pending, errors, record };
}

/** Runs one generated program. Returns the ReferenceErrors it hit. */
export async function run(code, extraGlobals = {}, { verbose = false } = {}) {
  const world = makeWorld();
  const { anything } = world;
  let timers = 50;

  const sandbox = {
    require: () => anything(),
    module: { exports: {} },
    exports: {},
    console: { log() {}, error() {}, warn() {}, info() {} },
    /* Timers fire straight away, but only so many times: bots schedule
       themselves again from inside a timer (clocks, retries). */
    setTimeout: (fn) => {
      if (typeof fn === "function" && timers-- > 0) queueMicrotask(() => {
        try { const r = fn(); if (r?.then) world.pending.push(r.catch(world.record)); } catch (e) { world.record(e); }
      });
      return 0;
    },
    setInterval: (fn) => sandbox.setTimeout(fn),
    clearTimeout() {},
    clearInterval() {},
    setImmediate: (fn) => sandbox.setTimeout(fn),
    queueMicrotask,
    fetch: async () => anything(false),
    Buffer,
    URL,
    URLSearchParams,
    TextEncoder,
    TextDecoder,
    structuredClone,
    ...extraGlobals,
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);

  const cleaned = code.replace(/client\.login\([^)]*\);?\s*$/m, "");

  try {
    new vm.Script(cleaned, { filename: "bot.js" }).runInContext(sandbox, { timeout: 2000 });
  } catch (error) {
    world.record(error);
    if (!(error instanceof ReferenceError) && error?.name !== "ReferenceError" && verbose)
      console.log("  (load error, ignored)", error.message);
  }

  /* Command functions are declared at the top level, so they're globals. */
  for (const [name, value] of Object.entries(sandbox))
    if (/^command_/.test(name) && typeof value === "function") {
      try {
        const result = value(anything());
        if (result?.then) world.pending.push(result.catch(world.record));
      } catch (error) {
        world.record(error);
      }
    }

  for (let round = 0; round < 20 && world.pending.length; round++) {
    const batch = world.pending.splice(0);
    await Promise.race([Promise.allSettled(batch), new Promise((r) => setTimeout(r, 1500))]);
  }

  return world.errors;
}

