/* =====================================================================
   Blocks that don't line up with their builder step by name
   ---------------------------------------------------------------------
   Most blocks convert on their own (see ./fromBlocks.js): the catalog
   says which step replaces them, and their inputs carry the same names.
   This file is for the rest.

     BLOCK_RULES[type]      adjusts the automatic conversion:
       inputs:   { [builderKey]: blockPartName | { literal } | fn }
       values:   { [builderKey]: { [blockValue]: builderValue } }   dropdowns that changed values
       branches: { [builderKey]: statementInputName | fn }
       ignore:   [blockPartName]   parts that are fine to leave behind
       child:    a value input holding a message/form piece's only child
       after(result, block, scope, conv)
     STATEMENT_RULES[type]  builds the steps for a block by hand
     VALUE_RULES[type]      builds the value for a block by hand
                            (undefined means "carry on as usual")
     EVENT_SETTINGS[type]   event settings a hat implies, from the
                            fixed parts of its block (src/elements)

   Every `fn` receives (block, scope, conv, extra) where `conv` is the
   BlockConverter, whose helpers do the real work.
   ===================================================================== */

import { BLOCK_TYPES, blockOf } from "../../elements/index.js";
import { MODAL_FIELDS } from "../codegen/modal.js";
import { extraState, fieldValue, inputBlock, pingsOf, statementStack, textLiteral } from "./blockJson.js";

const def = (conv, id) => conv.catalog.actions.get(id);
const valueDef = (conv, id) => conv.catalog.values.get(id);
const inputDefOf = (definition, key) => definition.inputs.find((i) => i.key === key);

/* ---------------------------------------------------------------------
   Values read from the event or step a block is inside
   --------------------------------------------------------------------- */

/** The event's value whose code is `code`, as a reference. */
function eventValue(scope, code) {
  const value = scope.eventDef?.values?.find((v) => v.code === code);
  return value ? { kind: "event", key: value.key } : null;
}

/** A value the step or event around this one provides, found by its code. */
function providedByCode(scope, code) {
  for (let i = scope.bindings.length - 1; i >= 0; i--) {
    const binding = scope.bindings[i];
    const found = binding.provides?.find((p) => p.code.replaceAll("@@", "") === code);
    if (found) return binding.ref(found.key);
  }
  return eventValue(scope, code);
}

const value = (id, inputs = {}) => ({ kind: "value", type: id, inputs });

/**
 * "Member who ran the command" and friends: the same value wherever an
 * interaction is being handled.
 */
const INTERACTION_VALUES = {
  member: "interaction_member",
  user: "interaction_user",
  channel: "interaction_channel",
  server: "interaction_server",
};
const interactionValue = (which) => () => value(INTERACTION_VALUES[which]);

/** "The message" blocks of the message events. */
function messageValue(code, fallbackCode) {
  return (block, scope) => providedByCode(scope, code) ?? (fallbackCode ? providedByCode(scope, fallbackCode) : null);
}

/* ---------------------------------------------------------------------
   Loops: the block editor's loop variable becomes the loop's own value
   --------------------------------------------------------------------- */

function loopBranch(providedKey) {
  return (block, scope, conv, action) => {
    const loopDef = def(conv, action.type);
    const branchDef = loopDef.branches.find((b) => b.key === "DO");
    const inner = conv.branchScope(scope, loopDef, action, branchDef);
    const loopVariable = conv.variableNameOf(fieldValue(block, "VAR"));
    if (loopVariable)
      inner.bindings = [
        ...inner.bindings,
        {
          match: (read) =>
            read.type === "variables_get" && conv.variableNameOf(fieldValue(read, "VAR"))?.toLowerCase() === loopVariable.toLowerCase()
              ? { kind: "branch", action: action.id, branch: "DO", key: providedKey }
              : null,
        },
      ];
    return conv.convertStack(statementStack(block, "DO"), inner);
  };
}

/* ---------------------------------------------------------------------
   If / else if / else
   --------------------------------------------------------------------- */

function ifBlock(block, scope, conv) {
  const ifDef = def(conv, "logic_if");
  const action = conv.newAction(ifDef);
  const state = extraState(block);
  let count = Number(state.elseIfCount ?? state.elseif ?? 0) + 1;
  for (const name of Object.keys(block.inputs ?? {})) {
    const match = /^(?:IF|DO)(\d+)$/.exec(name);
    if (match) count = Math.max(count, Number(match[1]) + 1);
  }
  const conditionDef = inputDefOf(ifDef, "condition");
  const branch = (key) => ifDef.branches.find((b) => b.key === key);

  const condition = (i) => conv.valueInput(conditionDef, inputBlock(block, `IF${i}`), scope);
  const first = condition(0);
  if (first) action.inputs.condition = first;
  action.branches.then = conv.convertStack(statementStack(block, "DO0"), conv.branchScope(scope, ifDef, action, branch("then")));

  action.branches.elseif = [];
  for (let i = 1; i < count; i++) {
    const item = { id: conv.newId(), inputs: {}, actions: [] };
    const value = condition(i);
    if (value) item.inputs.condition = value;
    item.actions = conv.convertStack(statementStack(block, `DO${i}`), conv.branchScope(scope, ifDef, action, branch("elseif")));
    action.branches.elseif.push(item);
  }

  const hasElse = String(state.hasElse ?? state.else ?? "") === "true" || state.hasElse === true || state.else === "1";
  const elseStack = statementStack(block, "ELSE");
  if (elseStack.length || hasElse || block.type === "controls_ifelse")
    action.branches.else = conv.convertStack(elseStack, conv.branchScope(scope, ifDef, action, branch("else")));
  return [action];
}

/* ---------------------------------------------------------------------
   Functions: copied into every place they're called
   --------------------------------------------------------------------- */

function procedure(conv, block) {
  const name = String(extraState(block).name ?? fieldValue(block, "NAME") ?? "").toLowerCase();
  return { name, definition: conv.procedures.get(name) };
}

/** Steps that give each parameter the value it was called with. */
function parameterSteps(conv, definition, call, scope) {
  const steps = [];
  const params = extraState(definition).params ?? [];
  const setDef = def(conv, "variable_set");
  params.forEach((param, i) => {
    const name = typeof param === "string" ? param : param?.name;
    if (!name) return;
    const variable = conv.variable(name);
    if (!variable) return;
    const step = conv.newAction(setDef);
    step.inputs.VAR = { ref: { kind: "variable", id: variable.id } };
    const arg = conv.valueInput(inputDefOf(setDef, "VALUE"), inputBlock(call, `ARG${i}`), scope);
    if (arg) step.inputs.VALUE = arg;
    steps.push(step);
  });
  return steps;
}

function inlineProcedure(call, scope, conv) {
  const { name, definition } = procedure(conv, call);
  if (!definition) {
    conv.note(`A call to a function that doesn't exist was left out.`);
    return [];
  }
  if (scope.procedures.includes(name)) {
    conv.note(`The function "${fieldValue(definition, "NAME")}" calls itself, which can't be copied into place, so that call was left out.`);
    return [];
  }
  conv.note("The builder has no functions, so each function's blocks were copied to every place it was called.");
  const inner = { ...scope, procedures: [...scope.procedures, name] };
  return [...parameterSteps(conv, definition, call, scope), ...conv.convertStack(statementStack(definition, "STACK"), inner)];
}

/* ---------------------------------------------------------------------
   Messages
   --------------------------------------------------------------------- */

/** A Components V2 message block's pieces and files. */
const cv2Message = (block, scope, conv, { used }) => {
  used.add("components");
  used.add("files");
  return { literal: conv.messageFrom(block, scope) };
};

/** The pieces an old embed becomes: a container with the same text, color and pictures. */
function embedPieces(embed, scope, conv) {
  const container = { id: conv.newId(), type: "msg_container", inputs: {}, children: [] };
  const text = (parts) => {
    const content = conv.joinText(parts);
    if (content?.ref || String(content?.literal ?? "").length) container.children.push(conv.textPiece(content));
  };
  const read = (block, name) => conv.textInput(inputBlock(block, name), scope);
  const pictures = [];

  for (const setting of statementStack(embed, "config")) {
    switch (setting.type) {
      case "embed_setauthor":
        text(["-# ", read(setting, "name")]);
        break;
      case "embed_settitle":
        text(["## ", read(setting, "value")]);
        break;
      case "embed_seturl":
        text(["-# ", read(setting, "value")]);
        break;
      case "embed_setdsc":
        text([read(setting, "value")]);
        break;
      case "embed_addfield":
        text(["**", read(setting, "name"), "**\n", read(setting, "val")]);
        break;
      case "embed_setfooter":
        text(["-# ", read(setting, "text")]);
        break;
      case "embed_setimage":
      case "embed_setthumb": {
        const url = read(setting, "value");
        if (url) pictures.push({ id: conv.newId(), type: "msg_gallery_item", inputs: { url } });
        break;
      }
      case "embed_setcolor": {
        const colour = conv.valueInput({ kind: "colour", key: "color", accepts: ["Colour", "String"], default: "" }, inputBlock(setting, "value"), scope);
        if (colour) {
          container.inputs.useColor = { literal: true };
          container.inputs.color = colour;
        }
        break;
      }
      default:
        break;
    }
  }
  if (pictures.length) container.children.push({ id: conv.newId(), type: "msg_gallery", inputs: {}, children: pictures.slice(0, 10) });
  if (!container.children.length) container.children.push(conv.textPiece({ literal: " " }));
  return [container];
}

/** The embeds an old message names ("a, b"), as message pieces. */
function namedEmbeds(names, scope, conv) {
  const pieces = [];
  for (const name of String(names ?? "")
    .split(",")
    .map((part) => part.replace(/['"`]/g, "").trim())
    .filter(Boolean)) {
    const embed = scope.named.embeds.get(name);
    if (embed) pieces.push(...embedPieces(embed, scope, conv));
    else conv.note(`A message used an embed called "${name}" that couldn't be found, so it was left out of the message.`);
  }
  return pieces;
}

/**
 * The message an old (pre Components V2) message block sends: its text,
 * its embeds turned into containers, its rows of buttons and menus, and
 * its files.
 */
function oldMessage(block, scope, conv) {
  const spec = { components: [], files: [], pings: pingsOf(block) };
  const content = inputBlock(block, "content");
  if (content) {
    const text = conv.textInput(content, scope);
    if (text) spec.components.push(conv.textPiece(text));
  }
  const embeds = textLiteral(inputBlock(block, "embeds")) ?? (typeof fieldValue(block, "embeds") === "string" ? fieldValue(block, "embeds") : null);
  if (embeds) spec.components.push(...namedEmbeds(embeds, scope, conv));
  else if (inputBlock(block, "embeds")) conv.note("Embeds whose names came from a value couldn't be found, so they were left out of the message.");
  for (const row of statementStack(block, "rows")) spec.components.push(...conv.component(row, scope));
  spec.files = conv.filesFrom(statementStack(block, "files"), scope);
  if (!spec.components.length) spec.components.push(conv.textPiece({ literal: " " }));
  return spec;
}

/**
 * An old message block as the Components V2 step that does the same.
 * `inputs` maps the step's other inputs to the block's ({ channel: "channel" }).
 */
function oldMessageStep(targetId, inputs = {}) {
  return (block, scope, conv) => {
    const target = def(conv, targetId);
    const action = conv.newAction(target);
    action.inputs.content = { literal: oldMessage(block, scope, conv) };
    for (const [key, part] of Object.entries(inputs)) {
      const read = conv.valueInput(inputDefOf(target, key), inputBlock(block, part), scope);
      if (read) action.inputs[key] = read;
    }
    const thenDef = target.branches.find((b) => b.key === "then");
    const thenStack = statementStack(block, "then");
    if (thenDef && thenStack.length) action.branches.then = conv.convertStack(thenStack, conv.branchScope(scope, target, action, thenDef));
    else if (thenStack.length) conv.partial(target, block, "unused then");
    return [action];
  };
}

/* ---------------------------------------------------------------------
   Forms
   --------------------------------------------------------------------- */

/** A "create modal" block as a form. */
function formFrom(block, scope, conv) {
  if (block?.type !== "modal_create") return null;
  const inputs = {};
  for (const field of MODAL_FIELDS) {
    const read = conv.valueInput(field, inputBlock(block, field.key), scope);
    if (read) inputs[field.key] = read;
  }
  const components = [];
  for (const child of statementStack(block, "components")) components.push(...conv.component(child, scope, "modal"));
  return { inputs, components };
}

/* ---------------------------------------------------------------------
   Numbers in different units
   --------------------------------------------------------------------- */

/** `value × factor` as a value (or the multiplied number, when it's typed in). */
function scaled(conv, inputValue, factor) {
  if (!inputValue) return inputValue;
  if (Object.prototype.hasOwnProperty.call(inputValue, "literal")) {
    const n = Number(inputValue.literal);
    return Number.isFinite(n) ? { literal: Math.round(n * factor * 1e6) / 1e6 } : inputValue;
  }
  const divide = factor < 1;
  return {
    ref: value("math_arithmetic", {
      A: inputValue,
      OP: { literal: divide ? "DIVIDE" : "MULTIPLY" },
      B: { literal: divide ? Math.round(1 / factor) : factor },
    }),
  };
}

/** An input the block editor took in another unit: `factor` turns its number into the builder's. */
function inUnit(part, factor) {
  return (block, scope, conv, { inputDef, used }) => {
    used.add(part);
    return scaled(conv, conv.valueInput(inputDef, inputBlock(block, part), scope), factor);
  };
}

/** "bold 30px Arial" → { bold, size, font }, or null. */
function parseFont(text) {
  const match = /^\s*(bold\s+)?(?:(?:italic|normal)\s+)?(\d+(?:\.\d+)?)px\s+(.+?)\s*$/i.exec(String(text ?? ""));
  return match ? { bold: Boolean(match[1]), size: Number(match[2]), font: match[3] } : null;
}

const fontPart = (key) => (block, scope, conv, { used }) => {
  used.add("FONT");
  const typedFont = textLiteral(inputBlock(block, "FONT"));
  const parsed = parseFont(typedFont);
  if (key === "FONT") {
    if (parsed) return { literal: parsed.font };
    if (typedFont !== null) return { literal: typedFont };
    if (inputBlock(block, "FONT")) conv.note('A canvas font that came from a value couldn\'t be kept, so it uses the default font.');
    return undefined;
  }
  if (!parsed) return undefined;
  return { literal: key === "size" ? parsed.size : parsed.bold };
};

/** "@everyone" in a role input becomes the step's own "Everyone" choice. */
const everyoneTarget = (block) => ({ literal: inputBlock(block, "role")?.type === "misc_everyone" ? "everyone" : "pick" });
const roleUnlessEveryone = (block, scope, conv, { inputDef, used }) => {
  used.add("role");
  const role = inputBlock(block, "role");
  if (!role || role.type === "misc_everyone") return undefined;
  return conv.valueInput(inputDef, role, scope);
};

/* ---------------------------------------------------------------------
   The rules
   --------------------------------------------------------------------- */

const COMPARE_OPS = { EQ: "==", NEQ: "!=", LT: "<", LTE: "<=", GT: ">", GTE: ">=" };

export const BLOCK_RULES = {
  logic_compare: { values: { OP: COMPARE_OPS } },
  logic_operation: { values: { OP: { AND: "&&", OR: "||" } } },
  math_on_list: { values: { OP: { MODE: "AVERAGE" } } },
  lists_getIndex: { values: { MODE: { REMOVE: "GET_REMOVE" } } },
  misc_permissionChannel: { values: { permission: { UseSlashCommands: "UseApplicationCommands" } } },
  channel_set_permission_v2: {
    inputs: { target: everyoneTarget, role: roleUnlessEveryone },
    values: { permission: { UseSlashCommands: "UseApplicationCommands" } },
  },
  channel_delete_permission: { inputs: { target: everyoneTarget, role: roleUnlessEveryone } },

  /* The block editor counted these in milliseconds (and radians); the
     builder's steps say seconds (and degrees). */
  javascript_wait: { inputs: { unit: { literal: "1" } } },
  cooldown_check: { inputs: { duration: inUnit("duration", 1 / 1000) } },
  cooldown_set: { inputs: { duration: inUnit("duration", 1 / 1000) } },
  canvas_rotate: { inputs: { ANGLE: inUnit("ANGLE", 180 / Math.PI) } },

  canvas_setFont: { inputs: { FONT: fontPart("FONT"), size: fontPart("size"), bold: fontPart("bold") } },
  canvas_strokeText: { inputs: { style: { literal: "stroke" } } },

  controls_for: { branches: { DO: loopBranch("number") }, ignore: ["VAR"] },
  controls_forEach: { branches: { DO: loopBranch("item") }, ignore: ["VAR"] },

  text_join: {
    inputs: { parts: (block, scope, conv, { used }) => conv.groupFromAdds(block, scope, valueDef(conv, "text_join"), "parts", "part", used) },
  },
  lists_create_with: {
    inputs: { items: (block, scope, conv, { used }) => conv.groupFromAdds(block, scope, valueDef(conv, "list_create"), "items", "item", used) },
  },
  fetch_sendAdvanced: {
    inputs: {
      config: (block, scope, conv, { def: owner, inputDef, used }) => {
        used.add("config");
        return conv.groupFromStack(statementStack(block, "config"), scope, inputDef, owner);
      },
    },
  },
  object_new: {
    inputs: {
      keys: (block, scope, conv, { def: owner, inputDef, used }) => {
        used.add("keys");
        return conv.groupFromStack(statementStack(block, "keys"), scope, inputDef, owner);
      },
    },
  },

  logic_switch: {
    branches: {
      cases: (block, scope, conv, action, used) => {
        used.add("cases");
        const switchDef = def(conv, "logic_switch");
        const caseDef = switchDef.branches.find((b) => b.key === "cases");
        const items = [];
        for (const child of statementStack(block, "cases")) {
          if (child.type !== "logic_case") continue;
          const item = { id: conv.newId(), inputs: {}, actions: [] };
          const value = conv.valueInput(caseDef.inputs[0], inputBlock(child, "case"), scope);
          if (value) item.inputs.case = value;
          item.actions = conv.convertStack(statementStack(child, "code"), conv.branchScope(scope, switchDef, action, caseDef));
          items.push(item);
        }
        return items;
      },
      default: (block, scope, conv, action) => {
        const switchDef = def(conv, "logic_switch");
        const fallback = statementStack(block, "cases").find((child) => child.type === "logic_default");
        if (!fallback) return undefined;
        const branchDef = switchDef.branches.find((b) => b.key === "default");
        return conv.convertStack(statementStack(fallback, "code"), conv.branchScope(scope, switchDef, action, branchDef));
      },
    },
  },

  cv2_sendMessage: { inputs: { content: cv2Message } },
  cv2_sendDm: { inputs: { content: cv2Message } },
  cv2_replyMsg: { inputs: { content: cv2Message } },
  cv2_editMsg: { inputs: { content: cv2Message } },
  cv2_replyInteraction: { inputs: { content: cv2Message } },
  cv2_editReplyInteraction: { inputs: { content: cv2Message } },
  menus_update: {
    inputs: {
      content: (block, scope, conv, { used }) => {
        for (const name of ["content", "embeds", "rows"]) used.add(name);
        return { literal: oldMessage(block, scope, conv) };
      },
    },
  },

  cv2_container: {
    after: (piece) => {
      if (piece.inputs.color) piece.inputs.useColor = { literal: true };
    },
  },
  modalc_label: { child: "component" },

  modal_show: {
    inputs: {
      form: (block, scope, conv, { used }) => {
        used.add("modal");
        const form = formFrom(inputBlock(block, "modal"), scope, conv);
        if (!form && inputBlock(block, "modal")) conv.note('A "show modal" block whose modal wasn\'t built right there was left empty.');
        return form ? { literal: form } : null;
      },
    },
  },
};

const CONTEXT_MENU_TARGETS = {
  user: { contextMenu_targetUser: "context_menu_target_user" },
  message: { contextMenu_targetMessage: "context_menu_target_message" },
};

export const VALUE_RULES = {
  /* The block editor gave milliseconds; the builder's value is seconds. */
  cooldown_get(block, scope, conv) {
    const inner = conv.valueFromDef(valueDef(conv, "cooldown_time_left"), block, scope);
    return scaled(conv, { ref: inner }, 1000).ref;
  },

  variables_get(block, scope, conv) {
    for (let i = scope.bindings.length - 1; i >= 0; i--) {
      const ref = scope.bindings[i].match?.(block);
      if (ref) return ref;
    }
    return conv.variableRef(fieldValue(block, "VAR"));
  },

  procedures_callreturn(block, scope, conv) {
    const { name, definition } = procedure(conv, block);
    if (!definition || definition.type !== "procedures_defreturn" || scope.procedures.includes(name) || !scope.hoist) {
      conv.note("A function's result couldn't be copied into place, so it was left out.");
      return null;
    }
    conv.note("The builder has no functions, so each function's blocks were copied to every place it was called.");
    const inner = { ...scope, procedures: [...scope.procedures, name] };
    scope.hoist.push(...parameterSteps(conv, definition, block, scope));
    scope.hoist.push(...conv.convertStack(statementStack(definition, "STACK"), inner));
    const result = inputBlock(definition, "RETURN");
    if (!result) return null;
    return conv.valueRef(result, inner);
  },

  /* A command's options are values of the command itself. */
  slash_getoption(block, scope) {
    const name = textLiteral(inputBlock(block, "name"));
    const type = String(fieldValue(block, "type") ?? "");
    if (name === null || !scope.options?.size) return undefined;
    const option = scope.options.get(name.toLowerCase());
    if (!option) return undefined;
    return { kind: "option", id: option.id, ...(type === "Member" && option.type === 6 ? { as: "member" } : {}) };
  },

  slash_name(block, scope, conv) {
    if (scope.command) return conv.textRef(scope.command.name);
    return undefined;
  },
  contextMenu_name(block, scope, conv) {
    if (scope.command) return conv.textRef(scope.command.name);
    return undefined;
  },
  contextMenu_targetUser(block, scope) {
    const id = CONTEXT_MENU_TARGETS[scope.flow]?.[block.type];
    return id ? value(id) : undefined;
  },
  contextMenu_targetMessage(block, scope) {
    const id = CONTEXT_MENU_TARGETS[scope.flow]?.[block.type];
    return id ? value(id) : undefined;
  },

  slash_member: interactionValue("member"),
  slash_user: interactionValue("user"),
  slash_channel: interactionValue("channel"),
  slash_server: interactionValue("server"),
  contextMenu_member: interactionValue("member"),
  contextMenu_user: interactionValue("user"),
  contextMenu_channel: interactionValue("channel"),
  contextMenu_server: interactionValue("server"),
  buttons_member: interactionValue("member"),
  buttons_user: interactionValue("user"),
  buttons_channel: interactionValue("channel"),
  buttons_server: interactionValue("server"),
  menus_member: interactionValue("member"),
  menus_user: interactionValue("user"),
  menus_channel: interactionValue("channel"),
  menus_server: interactionValue("server"),

  msg_msg: messageValue("message"),
  msg_content: messageValue("message.content"),
  msg_member: messageValue("message.member"),
  msg_user: messageValue("message.author", "message.member.user"),
  msg_channel: messageValue("message.channel"),
  msg_server: messageValue("message.guild"),
  misc_messageSent: (block, scope) => providedByCode(scope, "messageSent"),
};

export const STATEMENT_RULES = {
  controls_if: ifBlock,
  controls_ifelse: ifBlock,

  controls_repeat: (block, scope, conv) => [conv.buildAction(def(conv, "loop_repeat"), block, scope)],

  controls_flow_statements(block, scope, conv) {
    /* Outside a loop the block editor's "break" made the whole bot fail
       to start, so there's nothing to keep. */
    if (!scope.contexts.has("loop")) {
      conv.note('A "break out of loop" block that wasn\'t inside a loop was left out.');
      return [];
    }
    const id = String(fieldValue(block, "FLOW")) === "CONTINUE" ? "loop_skip" : "loop_stop";
    return [conv.newAction(def(conv, id))];
  },

  procedures_callnoreturn: inlineProcedure,
  procedures_ifreturn(block, scope, conv) {
    conv.note('"If, return" inside a function can\'t work once the function is copied into place, so it was left out.');
    return [];
  },

  /* Embeds and polls are made once and sent by name later. */
  embed_create(block, scope) {
    const name = String(fieldValue(block, "name") ?? "").trim();
    if (name) scope.named.embeds.set(name, block);
    return [];
  },
  poll_create(block, scope) {
    const name = String(fieldValue(block, "NAME") ?? "").trim();
    if (name) scope.named.polls.set(name, block);
    return [];
  },
  poll_sendchannel(block, scope, conv) {
    const pollDef = def(conv, "poll_send");
    const name = String(fieldValue(block, "NAME") ?? "").trim();
    const poll = scope.named.polls.get(name);
    if (!poll) {
      conv.note(`A poll called "${name}" was sent before it was made, so it was left out.`);
      return [];
    }
    const action = conv.newAction(pollDef);
    for (const key of ["QUESTION", "DURATION", "MULTISELECT"]) {
      const read = conv.valueInput(inputDefOf(pollDef, key), inputBlock(poll, key), scope);
      if (read) action.inputs[key] = read;
    }
    for (const key of ["CHANNEL", "MESSAGE"]) {
      const read = conv.valueInput(inputDefOf(pollDef, key), inputBlock(block, key), scope);
      if (read) action.inputs[key] = read;
    }
    action.inputs.answers = conv.groupFromStack(statementStack(poll, "CHOICES"), scope, inputDefOf(pollDef, "answers"), pollDef);
    return [action];
  },

  msg_delete(block, scope, conv) {
    const message = providedByCode(scope, "message");
    if (!message) return [];
    const action = conv.newAction(def(conv, "message_delete"));
    action.inputs.message = { ref: message };
    return [action];
  },

  cv2_updateInteraction(block, scope, conv) {
    const action = conv.newAction(def(conv, "component_update_message"));
    action.inputs.content = { literal: conv.messageFrom(block, scope) };
    return [action];
  },

  /* Messages from before Components V2. */
  slash_reply: oldMessageStep("interaction_reply", { ephemeral: "ephemeral" }),
  slash_reply_rows: oldMessageStep("interaction_reply", { ephemeral: "ephemeral" }),
  misc_int_reply: oldMessageStep("interaction_reply", { ephemeral: "ephemeral" }),
  misc_int_reply_rows: oldMessageStep("interaction_reply", { ephemeral: "ephemeral" }),
  misc_int_reply_mutator: oldMessageStep("interaction_reply", { ephemeral: "ephemeral" }),
  menus_reply: oldMessageStep("interaction_reply"),
  slash_edit: oldMessageStep("interaction_edit_reply"),
  slash_editreply: oldMessageStep("interaction_edit_reply"),
  misc_int_edit: oldMessageStep("interaction_edit_reply"),
  misc_int_edit_mutator: oldMessageStep("interaction_edit_reply"),
  menus_edit: oldMessageStep("interaction_edit_reply"),
  channel_send: oldMessageStep("channel_send_message", { channel: "channel" }),
  channel_send_rows: oldMessageStep("channel_send_message", { channel: "channel" }),
  channel_send_mutator: oldMessageStep("channel_send_message", { channel: "channel" }),
  member_dm: oldMessageStep("member_send_dm", { member: "member" }),
  member_dm_rows: oldMessageStep("member_send_dm", { member: "member" }),
  member_dm_mutator: oldMessageStep("member_send_dm", { member: "member" }),
  msg_reply: oldMessageStep("message_reply"),
  msg_reply_rows: oldMessageStep("message_reply"),
  msg_reply_mutator: oldMessageStep("message_reply"),
  msg_edit: oldMessageStep("message_edit", { message: "message" }),
  msg_edit_mutator: oldMessageStep("message_edit", { message: "message" }),
};

/** Settings a hat implies (its block's fixed parts), beyond what its own fields say. */
export const EVENT_SETTINGS = Object.fromEntries(
  BLOCK_TYPES.flatMap((type) => {
    const info = blockOf(type);
    if (info.element?.kind !== "event" || (info.role !== "main" && info.role !== "variant")) return [];
    const fixed = Object.entries(info.spec.parts ?? {}).filter(
      ([, part]) => part.part === "fixed" && typeof part.value !== "function" && !part.when,
    );
    return fixed.length ? [[type, Object.fromEntries(fixed.map(([key, part]) => [key, part.value]))]] : [];
  }),
);
