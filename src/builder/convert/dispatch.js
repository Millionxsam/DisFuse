/* =====================================================================
   Splitting one handler into several
   ---------------------------------------------------------------------
   Block editor projects handle every slash command in one "when a slash
   command is received" hat, with an `if` per command:

     when a slash command is received
       if (name of the command = "ping")  → reply "Pong"
       else if (name of the command = "help") → ...

   The builder has a place for each command's steps, so those sections
   move there. Buttons, menus and forms work the same way, with the ID
   instead of the command name, and become one event per ID.

   `specialize(stack, dispatcher, name)` is what the hat does for one
   name: every `if` that only checks the name is replaced by the section
   that name would take (or its "else", or nothing). Everything else is
   kept as it is, so a step before or after the `if` still runs. The
   same is done per subcommand inside a command.

   `residualStack` is what the hat still does for every OTHER name. It
   is kept in an event, behind a check that the name isn't one of those
   moved out, so nothing runs twice.

   Works on saved block JSON only (see ./blockJson.js).
   ===================================================================== */

import { extraState, fieldValue, inputBlock, isDisabled, statementStack, textLiteral } from "./blockJson.js";

export const DISPATCHERS = {
  slash_received: {
    kind: "command",
    commandKinds: ["slash"],
    event: "slash_command_used",
    nameTypes: ["slash_name"],
  },
  contextMenu_received: {
    kind: "command",
    commandKinds: ["user", "message"],
    event: "context_menu_used",
    nameTypes: ["contextMenu_name"],
  },
  buttons_event: {
    kind: "event",
    event: "button_clicked",
    setting: "filterId",
    nameTypes: ["buttons_id"],
  },
  menus_event: {
    kind: "event",
    event: "menu_picked",
    setting: "filterId",
    nameTypes: ["menus_id"],
  },
  modal_handle_interaction: {
    kind: "event",
    event: "form_submitted",
    setting: "filterId",
    nameTypes: ["modal_get_customId"],
  },
  /* Inside a command: which subcommand (or group) was used. Names are
     `{ level: "sub" | "group", value }` and the target is `{ group, sub }`. */
  __subcommand: {
    kind: "subcommand",
    nameOf(block) {
      if (block?.type !== "slash_getoption") return null;
      const type = String(fieldValue(block, "type") ?? "");
      if (type === "Subcommand") return "sub";
      if (type === "SubcommandGroup") return "group";
      return null;
    },
  },
};

/** What a block reads, for a dispatcher: true / "sub" / "group", or null. */
function readsName(block, dispatcher) {
  if (dispatcher.nameOf) return dispatcher.nameOf(block);
  return dispatcher.nameTypes.includes(block?.type) ? true : null;
}

/**
 * The names a condition checks for, or null if it checks anything else.
 * `name = "x"`, `"x" = name`, and `or` of those.
 */
function conditionNames(condition, dispatcher) {
  if (!condition || isDisabled(condition)) return null;

  if (condition.type === "logic_operation" && String(fieldValue(condition, "OP")) === "OR") {
    const left = conditionNames(inputBlock(condition, "A"), dispatcher);
    const right = conditionNames(inputBlock(condition, "B"), dispatcher);
    return left && right ? [...left, ...right] : null;
  }

  const equal =
    (condition.type === "logic_compare" && String(fieldValue(condition, "OP")) === "EQ") ||
    condition.type === "logic_equalsExactly";
  if (!equal) return null;

  const a = inputBlock(condition, "A");
  const b = inputBlock(condition, "B");
  for (const [reader, literal] of [
    [a, b],
    [b, a],
  ]) {
    const level = readsName(reader, dispatcher);
    const text = textLiteral(literal);
    if (level && text !== null) return [dispatcher.nameOf ? { level, value: text } : text];
  }
  return null;
}

/** An `if` block whose every condition only checks the name, taken apart. */
function dispatchIf(block, dispatcher) {
  if (block?.type !== "controls_if" && block?.type !== "controls_ifelse") return null;
  if (isDisabled(block)) return null;

  const state = extraState(block);
  let count = Number(state.elseIfCount ?? state.elseif ?? 0) + 1;
  for (const name of Object.keys(block.inputs ?? {})) {
    const match = /^(?:IF|DO)(\d+)$/.exec(name);
    if (match) count = Math.max(count, Number(match[1]) + 1);
  }

  const branches = [];
  for (let i = 0; i < count; i++) {
    const names = conditionNames(inputBlock(block, `IF${i}`), dispatcher);
    if (!names) return null;
    branches.push({ names, condition: block.inputs?.[`IF${i}`], stack: statementStack(block, `DO${i}`) });
  }
  return { branches, elseStack: statementStack(block, "ELSE") };
}

function matches(names, dispatcher, target) {
  if (!dispatcher.nameOf) return names.includes(target);
  return names.some((n) => (n.level === "sub" ? n.value === target.sub : target.group !== null && n.value === target.group));
}

/** The steps a hat runs for one name (or one subcommand). */
export function specialize(stack, dispatcher, target) {
  const out = [];
  for (const block of stack) {
    const parsed = dispatchIf(block, dispatcher);
    if (!parsed) {
      out.push(block);
      continue;
    }
    const hit = parsed.branches.find((branch) => matches(branch.names, dispatcher, target));
    out.push(...specialize(hit ? hit.stack : parsed.elseStack, dispatcher, target));
  }
  return out;
}

/** Every name a hat checks for, in order. */
export function dispatchNames(stack, dispatcher) {
  const names = [];
  const visit = (blocks) => {
    for (const block of blocks) {
      const parsed = dispatchIf(block, dispatcher);
      if (!parsed) continue;
      for (const branch of parsed.branches) {
        for (const name of branch.names) if (!names.includes(name)) names.push(name);
        visit(branch.stack);
      }
      visit(parsed.elseStack);
    }
  };
  visit(stack);
  return names;
}

/** Copies of blocks, chained one under the other. */
function chain(blocks) {
  let next = null;
  for (let i = blocks.length - 1; i >= 0; i--) {
    const copy = { ...blocks[i], next: next ? { block: next } : undefined };
    if (!copy.next) delete copy.next;
    next = copy;
  }
  return next;
}

let synthetic = 0;
const syntheticId = () => `converted_${(synthetic += 1)}`;

/** What a hat does for names that weren't moved out. */
export function residualStack(stack, dispatcher, moved) {
  const out = [];
  for (const block of stack) {
    const parsed = dispatchIf(block, dispatcher);
    if (!parsed) {
      out.push(block);
      continue;
    }
    const kept = parsed.branches.filter((branch) => !branch.names.every((name) => moved.includes(name)));
    const elseStack = residualStack(parsed.elseStack, dispatcher, moved);
    if (!kept.length) {
      out.push(...elseStack);
      continue;
    }
    const inputs = {};
    kept.forEach((branch, i) => {
      inputs[`IF${i}`] = branch.condition;
      const body = chain(branch.stack);
      if (body) inputs[`DO${i}`] = { block: body };
    });
    const elseBody = chain(elseStack);
    if (elseBody) inputs.ELSE = { block: elseBody };
    out.push({
      type: "controls_if",
      id: syntheticId(),
      extraState: { elseIfCount: kept.length - 1, hasElse: Boolean(elseBody) },
      inputs,
    });
  }
  return out;
}

/** `if (name ≠ "a" and name ≠ "b") { rest }`, as block JSON. */
export function guardBlock(dispatcher, moved, rest) {
  const notName = (name) => ({
    type: "logic_compare",
    id: syntheticId(),
    fields: { OP: "NEQ" },
    inputs: {
      A: { block: { type: dispatcher.nameTypes[0], id: syntheticId() } },
      B: { block: { type: "text", id: syntheticId(), fields: { TEXT: name } } },
    },
  });
  let condition = notName(moved[0]);
  for (const name of moved.slice(1))
    condition = {
      type: "logic_operation",
      id: syntheticId(),
      fields: { OP: "AND" },
      inputs: { A: { block: condition }, B: { block: notName(name) } },
    };
  return {
    type: "controls_if",
    id: syntheticId(),
    inputs: { IF0: { block: condition }, DO0: { block: chain(rest) } },
  };
}

