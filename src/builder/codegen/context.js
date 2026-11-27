/* =====================================================================
   DisFuse Builder: turning saved actions and values into JavaScript
   ---------------------------------------------------------------------
   The builder's equivalent of Blockly's JavaScript generator. It walks
   the saved actions of one command or event and calls each definition's
   `code(ctx)` (see ../catalog/define.js), exactly as Blockly calls
   `forBlock[type](block, generator)`.

   THE ctx API (what every `code(ctx)` receives)
   ---------------------------------------------
     ctx.input(key)     JavaScript for an input: the typed text quoted, the
                        number, true/false, the dropdown value quoted, or the
                        code of the value placed there. A value in a text
                        input that isn't text is wrapped in String(...).
                        An empty slot gives "null".
                        (Blockly: generator.valueToCode(block, key, ...))
     ctx.raw(key)       The literal itself, unquoted: the dropdown value, the
                        checkbox boolean, the number, the typed text. Undefined
                        when a value was placed instead.
                        (Blockly: block.getFieldValue(key))
     ctx.has(key)       Whether the input holds something: a value, non-empty
                        text, a ticked box, a non-empty list...
     ctx.code(key)      ctx.input(key), or "" when the input holds nothing:
                        exactly what Blockly's valueToCode returns, for ports
                        of generators that do `code || "default"`.
     ctx.isValue(key)   Whether a value was placed in the input.
     ctx.branch(key)    Code of the actions inside a branch ("" when empty).
                        (Blockly: generator.statementToCode(block, key))
     ctx.hasBranch(key) Whether an optional branch has been turned on.
     ctx.enabled(key)   hasBranch for branches, has for inputs: the port of a
                        mutator block's `block.getInput(key)` check.
     ctx.items(key)     For a `repeat` branch: one object per section, each
                        with input/raw/has like ctx, plus `code` (its actions)
                        and `index`.
     ctx.group(key)     For a group input: one object per item, with
                        input/raw/has and `index`.
     ctx.message(key, { ephemeral })  The options object for
                        channel.send / message.reply / interaction.reply,
                        built from the message builder. `ephemeral` is code
                        (e.g. ctx.input("ephemeral")).
     ctx.allowedMentions()  The `allowedMentions` option for a message
                        that isn't built in the message builder (only user
                        pings notify).
     ctx.modal(key)     A `new Discord.ModalBuilder()...` expression built
                        from the form builder.
     ctx.children()     (components only) the child components' code.
     ctx.uid            A short unique suffix for temporary variable names:
                        `const _msg${ctx.uid} = ...`.
     ctx.str(text)      Quotes a JavaScript string safely.
     ctx.flow           { kind, contexts: Set, eventId } for where this runs.
     ctx.project        The project being generated.

   SAVED SHAPES (also documented in ../README.md)
   ----------------------------------------------
     Action      { id, type, inputs: { [key]: InputValue },
                   branches?: { [key]: Action[] | RepeatItem[] }, disabled? }
     RepeatItem  { id, inputs: { [key]: InputValue }, actions: Action[] }
     InputValue  { literal: any } | { ref: ValueRef }
     ValueRef    { kind: "value", type, inputs? }         a catalog value
               | { kind: "event", key }                  a value of this event
               | { kind: "branch", action, branch, key } from an outer branch
               | { kind: "variable", id }
               | { kind: "option", id, as? }             a command option
                                                         (as: "member" for users)
               | { kind: "input", source, input, key }   provided by an outer
                                                         input (see `provides`
                                                         on inputs in define.js)

   BRANCH VALUES WITH UNIQUE NAMES
   -------------------------------
   A branch's provided value can be a fixed name (`messageSent`, like the
   block editor) or unique to the step, so two nested loops don't share a
   counter: write `@@` in the provided `code` and use `ctx.local(name)` in
   the step's code. Both become `name_<step id>`:

     branches: [{ key: "do", label: "Do", provides: [
       { key: "item", label: "Current item", type: ANY, code: "item@@" } ] }],
     code: (ctx) => `for (const ${ctx.local("item")} of ${ctx.input("list")}) {\n${ctx.branch("do")}}`

   Plain JavaScript, explicit `.js` imports: the check script runs this in
   Node as well as in the browser.
   ===================================================================== */

import { acceptsValues } from "../catalog/define.js";
import { typeList } from "../catalog/types.js";
import { allowedMentionsCode, messageCode } from "./message.js";
import { modalCode } from "./modal.js";

/* ---------------------------------------------------------------------
   Small helpers
   --------------------------------------------------------------------- */

/** Quotes text as a JavaScript string literal. */
export function str(text) {
  return JSON.stringify(String(text ?? ""));
}

const SIMPLE_EXPRESSION =
  /^(?:[A-Za-z_$][\w$]*(?:\??\.[A-Za-z_$][\w$]*)*|-?\d+(?:\.\d+)?|"(?:[^"\\]|\\.)*"|true|false|null|undefined)$/;

/**
 * Parenthesises an expression unless it is obviously safe on its own,
 * so `ctx.input("channel") + ".send(...)"` works even when the value is
 * `await client.channels.fetch(id)`.
 */
export function wrap(code) {
  const trimmed = String(code ?? "").trim();
  if (!trimmed) return "null";
  return SIMPLE_EXPRESSION.test(trimmed) ? trimmed : `(${trimmed})`;
}

/** The suffix `@@` and ctx.local() use for one step. */
export function localSuffix(actionId) {
  return "_" + String(actionId ?? "x").replace(/[^A-Za-z0-9]/g, "");
}

/** Discord's option types, and how each one is read in a handler. */
export const OPTION_READERS = {
  3: { method: "getString", output: ["String"] },
  4: { method: "getInteger", output: ["Number"] },
  5: { method: "getBoolean", output: ["Boolean"] },
  6: { method: "getUser", output: ["user"] },
  7: { method: "getChannel", output: ["channel"] },
  8: { method: "getRole", output: ["role"] },
  9: { method: "getMentionable", output: ["user", "member", "role"] },
  10: { method: "getNumber", output: ["Number"] },
  11: { method: "getAttachment", output: ["attachment"] },
};

/** The code and type of a command option's value. */
export function optionValue(option, as) {
  if (option?.type === 6 && as === "member")
    return {
      code: `interaction.options.getMember(${str(option.name)})`,
      output: ["member"],
    };

  const reader = OPTION_READERS[option?.type];
  if (!reader) return { code: "null", output: [null] };

  return {
    code: `interaction.options.${reader.method}(${str(option.name)})`,
    output: reader.output,
  };
}

/** Does an input's `showIf` match the other literals on the same thing? */
export function inputVisible(inputDef, rawOf) {
  const rule = inputDef?.showIf;
  if (!rule) return true;
  return Object.entries(rule).every(([key, wanted]) => {
    const actual = rawOf(key);
    return Array.isArray(wanted)
      ? wanted.map(String).includes(String(actual))
      : String(actual) === String(wanted);
  });
}

/* ---------------------------------------------------------------------
   Literals
   --------------------------------------------------------------------- */

/** The literal stored for an input, or its default. */
export function literalOf(inputDef, inputValue) {
  if (inputValue && Object.prototype.hasOwnProperty.call(inputValue, "literal"))
    return inputValue.literal;
  return inputDef?.default;
}

/** JavaScript for a literal of a given input kind. */
export function literalCode(inputDef, literal) {
  switch (inputDef?.kind) {
    case "text":
      return str(literal ?? "");
    case "number": {
      let n = Number(literal);
      if (!Number.isFinite(n)) n = Number(inputDef.default) || 0;
      if (inputDef.integer) n = Math.trunc(n);
      return n < 0 ? `(${n})` : String(n);
    }
    case "boolean":
      return literal === true || literal === "true" || literal === "TRUE"
        ? "true"
        : "false";
    case "dropdown":
      return str(literal ?? inputDef.default ?? "");
    case "multi":
      return JSON.stringify(Array.isArray(literal) ? literal.map(String) : []);
    case "colour":
      return str(literal || inputDef.default || "#000000");
    case "code":
      return String(literal ?? "");
    case "slot":
      return "null";
    default:
      return "null";
  }
}

/** Is this literal "something" for `ctx.has`? */
export function literalPresent(inputDef, literal) {
  switch (inputDef?.kind) {
    case "text":
    case "code":
    case "colour":
      return String(literal ?? "").trim().length > 0;
    case "number":
      return literal !== undefined && literal !== null && literal !== "";
    case "boolean":
      return literal === true || literal === "true";
    case "dropdown":
      return literal !== undefined && literal !== null && literal !== "";
    case "multi":
    case "group":
      return Array.isArray(literal) && literal.length > 0;
    case "message":
      return Boolean(literal?.components?.length);
    case "modal":
      return Boolean(literal?.components?.length);
    default:
      return false;
  }
}

/* ---------------------------------------------------------------------
   The generator
   --------------------------------------------------------------------- */

export class Generator {
  /**
   * @param {object} catalog  from ../catalog/index.js
   * @param {object} [options]
   * @param {object} [options.project]
   * @param {Map<string,string>} [options.variables] variable id → JS name
   */
  constructor(catalog, { project = null, variables = new Map() } = {}) {
    this.catalog = catalog;
    this.project = project;
    this.variables = variables;
    /** package name → { package, code? } */
    this.dependencies = new Map();
    /** setup key → code */
    this.setup = new Map();
    /** problems met while generating: { where, message } */
    this.issues = [];
    this.counter = 0;
  }

  nextUid() {
    this.counter += 1;
    return this.counter.toString(36);
  }

  /** Records the packages and setup code a definition needs. */
  use(def) {
    for (const dep of def?.dependencies ?? []) {
      /* A Workshop pack lists packages with code "" (the pack requires
         them itself); a definition that wants the usual require wins. */
      const existing = this.dependencies.get(dep.package);
      if (!existing || (existing.code === "" && dep.code !== "")) this.dependencies.set(dep.package, dep);
    }
    for (const item of def?.setup ?? [])
      if (!this.setup.has(item.key)) this.setup.set(item.key, item.code);
  }

  issue(where, message) {
    this.issues.push({ where, message });
  }

  /* ---- Scope ----------------------------------------------------- */

  /**
   * Everything code for one flow needs to resolve references.
   *
   * @param {object} flow
   * @param {string} flow.kind      "slash" | "user" | "message" | "subcommand" | "event"
   * @param {Action[]} flow.actions
   * @param {Iterable<string>} [flow.contexts]
   * @param {object} [flow.event]   the event definition, for event flows
   * @param {object} [flow.eventInstance]
   * @param {object[]} [flow.options] the options readable in this flow
   */
  scopeFor(flow) {
    const actions = new Map();
    const index = (list) => {
      for (const action of list ?? []) {
        actions.set(action.id, {
          action,
          def: this.catalog.actions.get(action.type),
        });
        for (const branch of Object.values(action.branches ?? {})) {
          if (!Array.isArray(branch)) continue;
          for (const entry of branch) {
            if (entry && Array.isArray(entry.actions)) index(entry.actions);
            else if (entry) index([entry]);
          }
        }
      }
    };
    index(flow.actions);

    return {
      kind: flow.kind,
      contexts: new Set(flow.contexts ?? []),
      event: flow.event ?? null,
      eventInstance: flow.eventInstance ?? null,
      options: new Map((flow.options ?? []).map((option) => [option.id, option])),
      actions,
    };
  }

  /* ---- Values ---------------------------------------------------- */

  /** @returns {{ code: string, output: Array }} */
  valueCode(ref, scope, where = "value") {
    if (!ref || typeof ref !== "object") return { code: "null", output: [null] };

    switch (ref.kind) {
      case "value": {
        const def = this.catalog.values.get(ref.type);
        if (!def) {
          this.issue(where, `Unknown value "${ref.type}"`);
          return { code: "undefined", output: [null] };
        }
        this.use(def);
        const ctx = this.makeCtx(def, def.inputs, ref, scope, where);
        try {
          return { code: String(def.code(ctx) ?? "null"), output: def.output };
        } catch (error) {
          this.issue(where, `Couldn't build "${def.label}": ${error.message}`);
          return { code: "undefined", output: def.output };
        }
      }

      case "event": {
        const value = scope.event?.values?.find((v) => v.key === ref.key);
        if (!value) {
          this.issue(where, `This value belongs to a different event`);
          return { code: "undefined", output: [null] };
        }
        return { code: value.code, output: typeList(value.type) };
      }

      case "branch": {
        const owner = scope.actions.get(ref.action);
        const branch = owner?.def?.branches?.find((b) => b.key === ref.branch);
        const value = branch?.provides?.find((p) => p.key === ref.key);
        if (!value) {
          this.issue(where, `This value is only available inside the step that makes it`);
          return { code: "undefined", output: [null] };
        }
        return {
          code: value.code.replaceAll("@@", localSuffix(ref.action)),
          output: typeList(value.type),
        };
      }

      case "input": {
        const owner = this.catalog.values.get(ref.source) ?? this.catalog.actions.get(ref.source);
        const inputDef = owner?.inputs?.find((i) => i.key === ref.input);
        const value = inputDef?.provides?.find((p) => p.key === ref.key);
        if (!value) {
          this.issue(where, `This value is only available inside the input that makes it`);
          return { code: "undefined", output: [null] };
        }
        return { code: value.code, output: typeList(value.type) };
      }

      case "variable": {
        const name = this.variables.get(ref.id);
        if (!name) {
          this.issue(where, "This variable was deleted");
          return { code: "undefined", output: [null] };
        }
        return { code: name, output: [null] };
      }

      case "option": {
        const option = scope.options.get(ref.id);
        if (!option) {
          this.issue(where, "This option no longer exists on the command");
          return { code: "null", output: [null] };
        }
        return optionValue(option, ref.as);
      }

      default:
        this.issue(where, `Unknown value reference "${ref.kind}"`);
        return { code: "undefined", output: [null] };
    }
  }

  /* ---- Inputs ---------------------------------------------------- */

  inputCode(inputDef, inputValue, scope, where) {
    if (!inputDef) return "null";

    if (inputDef.kind === "variable") {
      const name = inputValue?.ref?.kind === "variable" ? this.variables.get(inputValue.ref.id) : null;
      if (!name) {
        this.issue(where, inputValue?.ref ? "This variable was deleted" : `Pick a variable for "${inputDef.label}"`);
        return "disfuseMissingVariable";
      }
      return name;
    }

    if (inputValue?.ref && acceptsValues(inputDef)) {
      const value = this.valueCode(inputValue.ref, scope, where);
      /* Text inputs that take anything (a comparison, a switch case) keep
         the value as it is: turning 10 into "10" would make 10 > 9 false. */
      const accepts = typeList(inputDef.accepts);
      if (
        inputDef.kind === "text" &&
        !accepts.includes(null) &&
        !value.output.some((type) => type === null || accepts.includes(type))
      )
        return `String(${value.code})`;
      return wrap(value.code);
    }

    if (["group", "message", "modal"].includes(inputDef.kind)) {
      this.issue(where, `"${inputDef.key}" must be read with ctx.${inputDef.kind === "group" ? "group" : inputDef.kind}()`);
      return "null";
    }

    return literalCode(inputDef, literalOf(inputDef, inputValue));
  }

  /* ---- The ctx object ------------------------------------------- */

  /**
   * @param {object} def        the definition
   * @param {object[]} inputDefs the inputs to resolve against
   * @param {object} instance   the saved thing ({ inputs, branches, children })
   * @param {object} scope
   * @param {string} where      for issue messages
   */
  makeCtx(def, inputDefs, instance, scope, where) {
    const gen = this;
    const defsByKey = new Map((inputDefs ?? []).map((d) => [d.key, d]));
    const values = instance?.inputs ?? {};
    const label = def?.label ?? where;

    const need = (key) => {
      const inputDef = defsByKey.get(key);
      if (!inputDef) throw new Error(`"${label}" has no input called "${key}"`);
      return inputDef;
    };

    const raw = (key) => {
      const inputDef = need(key);
      const value = values[key];
      if (value?.ref && acceptsValues(inputDef)) return undefined;
      return literalOf(inputDef, value);
    };

    const ctx = {
      id: instance?.id,
      uid: gen.nextUid(),
      flow: { kind: scope.kind, contexts: scope.contexts, eventId: scope.event?.id },
      project: gen.project,
      str,
      wrap,
      local: (name) => `${name}${localSuffix(instance?.id)}`,

      input(key) {
        return gen.inputCode(need(key), values[key], scope, `${where} → ${label}`);
      },
      raw,
      /** Like Blockly's valueToCode: "" when the input holds nothing. */
      code(key) {
        return ctx.has(key) ? ctx.input(key) : "";
      },
      has(key) {
        const inputDef = need(key);
        const value = values[key];
        if (inputDef.kind === "variable") return value?.ref?.kind === "variable";
        if (value?.ref) return acceptsValues(inputDef);
        return literalPresent(inputDef, literalOf(inputDef, value));
      },
      isValue(key) {
        const inputDef = need(key);
        return Boolean(values[key]?.ref) && acceptsValues(inputDef);
      },
      visible(key) {
        return inputVisible(need(key), raw);
      },

      /** Is an optional input or branch in use? (Blockly: `block.getInput(key)` on a mutator block.) */
      enabled(key) {
        if (def?.branches?.some((b) => b.key === key)) return Array.isArray(instance?.branches?.[key]);
        return ctx.has(key);
      },
      branch(key) {
        const list = instance?.branches?.[key];
        if (!Array.isArray(list)) return "";
        return gen.flowCode(list, scope, where);
      },
      hasBranch(key) {
        return Array.isArray(instance?.branches?.[key]);
      },
      items(key) {
        const branchDef = def?.branches?.find((b) => b.key === key);
        const list = instance?.branches?.[key];
        if (!branchDef || !Array.isArray(list)) return [];
        return list.map((item, index) => {
          const itemCtx = gen.makeCtx(def, branchDef.inputs, item, scope, `${where} → ${branchDef.itemLabel ?? branchDef.label} ${index + 1}`);
          return {
            index,
            id: item.id,
            input: itemCtx.input,
            raw: itemCtx.raw,
            has: itemCtx.has,
            isValue: itemCtx.isValue,
            valueCode: itemCtx.code,
            code: gen.flowCode(item.actions ?? [], scope, where),
          };
        });
      },
      group(key) {
        const inputDef = need(key);
        const items = literalOf(inputDef, values[key]);
        if (!Array.isArray(items)) return [];
        return items.map((item, index) => {
          const itemCtx = gen.makeCtx(def, inputDef.fields, item, scope, `${where} → ${inputDef.itemLabel ?? inputDef.label} ${index + 1}`);
          return {
            index,
            id: item.id,
            input: itemCtx.input,
            raw: itemCtx.raw,
            has: itemCtx.has,
            isValue: itemCtx.isValue,
            code: itemCtx.code,
          };
        });
      },
      message(key, options = {}) {
        const inputDef = need(key);
        return messageCode(gen, literalOf(inputDef, values[key]), scope, {
          ...options,
          where: `${where} → ${label}`,
        });
      },
      allowedMentions() {
        return allowedMentionsCode();
      },
      modal(key) {
        const inputDef = need(key);
        return modalCode(gen, literalOf(inputDef, values[key]), scope, {
          where: `${where} → ${label}`,
        });
      },
      children() {
        return (instance?.children ?? [])
          .map((child) => gen.componentCode(child, scope, where))
          .filter(Boolean);
      },
    };

    return ctx;
  }

  /* ---- Actions --------------------------------------------------- */

  actionCode(action, scope, where = "action") {
    if (!action || action.disabled) return "";

    const def = this.catalog.actions.get(action.type);
    if (!def) {
      this.issue(where, `Unknown step "${action.type}"`);
      return `/* Unknown step: ${String(action.type).replace(/\*\//g, "")} */\n`;
    }

    this.use(def);
    const ctx = this.makeCtx(def, def.inputs, action, scope, where);

    try {
      const code = String(def.code(ctx) ?? "");
      return code.endsWith("\n") ? code : code + "\n";
    } catch (error) {
      this.issue(where, `Couldn't build "${def.label}": ${error.message}`);
      return `/* Couldn't build "${def.label.replace(/\*\//g, "")}" */\n`;
    }
  }

  flowCode(actions, scope, where = "flow") {
    return (actions ?? [])
      .map((action) => this.actionCode(action, scope, where))
      .join("");
  }

  /* ---- Components ------------------------------------------------ */

  componentCode(component, scope, where = "component") {
    if (!component) return "";
    const def = this.catalog.components.get(component.type);
    if (!def) {
      this.issue(where, `Unknown message part "${component.type}"`);
      return "";
    }
    this.use(def);
    const ctx = this.makeCtx(def, def.fields, component, scope, where);
    try {
      return String(def.code(ctx) ?? "").trim().replace(/,$/, "");
    } catch (error) {
      this.issue(where, `Couldn't build "${def.label}": ${error.message}`);
      return "";
    }
  }
}
