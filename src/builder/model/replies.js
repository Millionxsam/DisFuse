/* =====================================================================
   DisFuse Builder: answering an interaction once
   ---------------------------------------------------------------------
   Discord lets the bot answer a command, button, menu or form ONCE.
   The first answer is one of:

     - a reply, or "the bot is thinking" (answered with a message)
     - updating the message with the button or menu, or accepting the
       click silently (answered by updating)
     - showing a form

   After a message or an update, the bot can edit or delete its reply
   and send follow-up messages, but never answer a second time. After a
   form, there's nothing left to do with that interaction at all.

   Steps say which part they play: `answers: "message" | "update" |
   "form"` for a first answer, `afterAnswer: true` for the ones that
   need an answer before them.

   This walks a command or event's steps and works out, for every spot,
   what might have happened by then. It's a set, because it can depend
   on an If: { "none", "message" } means "maybe answered, maybe not".
   Answers only ever pile up, so a loop needs going round just twice.

   Pure functions over saved data; no React.
   ===================================================================== */

import { isRepeatItem } from "./ops.js";

/* Steps where exactly one section runs. `exhaustive` says whether one
   always does (an If with an Otherwise), or the step can also run none
   of them. */
const CHOICES = {
  logic_if: (action) => Array.isArray(action.branches?.else),
  logic_switch: (action) => Array.isArray(action.branches?.default),
  cooldown_run: (action) => Array.isArray(action.branches?.oncooldown),
  channel_wait_for_messages: () => true,
};

const isLoop = (def, branchDef) =>
  branchDef?.contexts?.includes("loop") || /_each/.test(def.id);

const keyOf = (location = {}) =>
  `${location.parentId ?? ""}|${location.branch ?? ""}|${location.itemId ?? ""}`;

const union = (...sets) => new Set(sets.flatMap((set) => [...set]));

/** What an answering step turns each earlier possibility into. */
function afterAnswering(states, kind) {
  return new Set([...states].map((state) => (state === "none" ? kind : state)));
}

/**
 * The possible states at the start of every spot in a flow.
 *
 * @returns {Map<string, Set<string>>} `${parentId}|${branch}|${itemId}` + `#${index}` → states
 */
export function answerStates(actions, catalog) {
  const seen = new Map();
  const record = (key, index, states) => {
    const id = `${key}#${index}`;
    seen.set(id, union(seen.get(id) ?? new Set(), states));
  };

  const runList = (list, states, location) => {
    const key = keyOf(location);
    let current = states;
    (list ?? []).forEach((action, index) => {
      record(key, index, current);
      current = runStep(action, current);
    });
    record(key, (list ?? []).length, current);
    return current;
  };

  /* A section's steps: a plain list, or one list per "Otherwise, if". */
  const runSection = (action, branchKey, states) => {
    const entries = action.branches?.[branchKey];
    if (!Array.isArray(entries)) return null;
    if (entries.length && entries.every(isRepeatItem))
      return entries.map((item) =>
        runList(item.actions, states, {
          parentId: action.id,
          branch: branchKey,
          itemId: item.id,
        }),
      );
    return [
      runList(entries, states, {
        parentId: action.id,
        branch: branchKey,
        itemId: null,
      }),
    ];
  };

  const runStep = (action, states) => {
    const def = catalog.actions.get(action?.type);
    if (!def || action.disabled) return states;
    /* "Stop running the steps" ends this path. "Stop repeating" only
       leaves the loop, which the loop handling already allows for. */
    if (def.terminal && !def.requires?.includes("loop")) return new Set();
    if (def.answers) return afterAnswering(states, def.answers);

    const branches = def.branches ?? [];
    if (!branches.length) return states;

    if (CHOICES[def.id]) {
      const outs = branches.flatMap(
        (branch) => runSection(action, branch.key, states) ?? [],
      );
      return CHOICES[def.id](action) ? union(...outs) : union(states, ...outs);
    }

    if (def.id === "try_catch") {
      const tried = union(...(runSection(action, "code", states) ?? [states]));
      /* The error can happen anywhere in the first part, so the second
         part starts from before it or after it. */
      const caught = union(
        ...(runSection(action, "error", union(states, tried)) ?? []),
      );
      const after = union(tried, caught);
      return Array.isArray(action.branches?.finally)
        ? union(...runSection(action, "finally", after))
        : after;
    }

    let current = states;
    for (const branch of branches) {
      if (isLoop(def, branch)) {
        const once = union(...(runSection(action, branch.key, current) ?? []));
        const twice = union(
          ...(runSection(action, branch.key, union(current, once)) ?? []),
        );
        current = union(current, once, twice);
      } else {
        const outs = runSection(action, branch.key, current);
        if (outs) current = union(...outs);
      }
    }
    return current;
  };

  runList(actions, new Set(["none"]), {});
  return seen;
}

/** The possible states just before `location.index` in its list. */
export function answerStateAt(states, location = {}) {
  return (
    states.get(`${keyOf(location)}#${location.index ?? 0}`) ?? new Set(["none"])
  );
}

const THINKING = '"Show that the bot is thinking"';
const REPLY = '"Reply to the interaction"';
const EDIT = '"Edit the interaction reply"';
const FOLLOW_UP = '"Send a follow-up to the interaction"';

/**
 * Whether a step can go where these are the possible states, and why
 * not. Steps that don't take part are always fine.
 *
 * @returns {{ ok: boolean, reason: string }}
 */
export function checkAnswer(def, states) {
  const ok = { ok: true, reason: "" };
  if (!def || !states.size) return ok;
  const maybe = states.has("none");
  const answered = [...states].some((state) => state !== "none");

  if (def.answers) {
    if (!answered) return ok;
    if (states.has("form"))
      return {
        ok: false,
        reason: maybe
          ? "An earlier step might show a form, and nothing else can answer after that."
          : "A form is shown above, and nothing else can answer after that.",
      };
    return {
      ok: false,
      reason: maybe
        ? `An earlier step might answer already, and Discord only allows one answer. Add "Stop running the steps" after that answer, or use ${FOLLOW_UP} here.`
        : `The bot already answered above, and Discord only allows one answer. Use ${EDIT} or ${FOLLOW_UP} instead.`,
    };
  }

  if (def.afterAnswer) {
    if (states.has("form"))
      return {
        ok: false,
        reason: `A form ${maybe || states.size > 1 ? "might be" : "is"} shown above, so there's no reply to work with.`,
      };
    if (maybe)
      return {
        ok: false,
        reason: answered
          ? "This needs an answer above it, and the step that answers only runs sometimes."
          : `This needs an answer above it first, like ${REPLY} or ${THINKING}.`,
      };
  }
  return ok;
}
