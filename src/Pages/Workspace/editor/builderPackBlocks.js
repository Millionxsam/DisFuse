import { packValueBlockType, fillTemplate, latestPackItems, packItemType } from "../../../builder/catalog/packs.js";

/* =====================================================================
   Builder packs in the block editor
   ---------------------------------------------------------------------
   Every Workshop pack works in every project. A pack built for DisFuse
   Builder (events, steps and values written as forms and code templates,
   see builder/model/packs.js) is turned into blocks here, so it can be
   installed and used in a block editor project like any block pack:

     event  → a hat, with its settings and a section for its blocks
     step   → a stacked block, with a statement input per section
     value  → a round block

   Each value an event or a step's section provides ("the message that
   was sent") is a round block of its own, meant to go inside it.

   The blocks have the same ids the builder uses for the pack's items
   (`pk_<packId>_<itemId>`, and `packValueBlockType` for provided
   values), so "Copy to DisFuse Builder" turns them back into the same
   steps and values. Their code is the pack's own templates, filled in
   exactly as the builder fills them (catalog/packs.js), so a pack does
   the same thing in either editor.

   Blockly and its generator are passed in rather than imported, so the
   check script can register them in Node.
   ===================================================================== */

const LITERAL_FIELDS = {
  text: "TEXT",
  text_multiline: "TEXT",
  math_number: "NUM",
  logic_boolean: "BOOL",
  colour_picker: "COLOUR",
};

/** Kinds that are a value input in the block editor (the rest are fields). */
const VALUE_KINDS = new Set(["text", "number", "boolean", "colour", "slot"]);

/** The same suffix the builder's ctx.local("") gives a step. */
const suffixOf = (block) => `_${String(block?.id ?? "x").replace(/[^A-Za-z0-9]/g, "")}`;

/** The code an input holds when nothing was put in it (codegen/context.js literalCode). */
function emptyCode(spec) {
  switch (spec.kind) {
    case "text":
      return JSON.stringify(String(spec.default ?? ""));
    case "number": {
      const n = Number(spec.default);
      const value = Number.isFinite(n) ? n : 0;
      return value < 0 ? `(${value})` : String(value);
    }
    case "boolean":
      return spec.default === true ? "true" : "false";
    case "colour":
      return JSON.stringify(spec.default || "#5865F2");
    default:
      return "null";
  }
}

/** A toolbox shadow for an input, so it can be typed into like the builder's box. */
function shadowFor(spec) {
  switch (spec.kind) {
    case "text":
      return { shadow: { type: "text", fields: { TEXT: String(spec.default ?? "") } } };
    case "number":
      return spec.default === null || spec.default === undefined
        ? null
        : { shadow: { type: "math_number", fields: { NUM: Number(spec.default) || 0 } } };
    case "boolean":
      return { shadow: { type: "logic_boolean", fields: { BOOL: spec.default === true ? "TRUE" : "FALSE" } } };
    case "colour":
      return { shadow: { type: "colour_picker", fields: { COLOUR: spec.default || "#5865F2" } } };
    default:
      return null;
  }
}

/**
 * Turns builder packs into blocks.
 *
 * @param {object} args
 * @param {object} args.Blockly
 * @param {object} args.javascriptGenerator
 * @param {object} args.Order
 */
export function createBuilderPackBlocks({ Blockly, javascriptGenerator, Order }) {
  /** The code for {{name}} and {{raw:name}} on one block. */
  function resolver(block, generator, specs, { id, body } = {}) {
    const byKey = new Map(specs.map((spec) => [spec.key, spec]));
    return (prefix, name) => {
      if (prefix === "steps") return generator.statementToCode(block, name);
      if (!prefix && name === "id") return id ?? "";
      if (!prefix && name === "steps") return body ?? "";
      const spec = byKey.get(name);
      if (!spec) return "";

      if (!VALUE_KINDS.has(spec.kind)) {
        const raw = block.getFieldValue(name) ?? spec.default ?? "";
        if (prefix === "raw" || spec.kind === "code") return String(raw);
        return JSON.stringify(String(raw));
      }

      if (prefix === "raw") {
        const target = block.getInputTargetBlock(name);
        const field = LITERAL_FIELDS[target?.type];
        if (!field) return "";
        const value = target.getFieldValue(field);
        return spec.kind === "boolean" ? String(value === "TRUE") : String(value ?? "");
      }
      return generator.valueToCode(block, name, Order.NONE) || emptyCode(spec);
    };
  }

  /** Adds an item's inputs (and sections) to a block being initialised. */
  function appendInputs(block, specs, branches = []) {
    for (const spec of specs) {
      const label = spec.label || spec.key;
      if (VALUE_KINDS.has(spec.kind)) {
        block.appendValueInput(spec.key).appendField(label);
        continue;
      }
      const row = block.appendDummyInput().appendField(label);
      if (spec.kind === "dropdown") {
        const options = (spec.options ?? []).map((o) => [o.label || o.value || " ", o.value]);
        row.appendField(new Blockly.FieldDropdown(options.length ? options : [["", ""]]), spec.key);
        if (options.some(([, value]) => value === spec.default)) block.setFieldValue(spec.default, spec.key);
      } else {
        const Field = spec.kind === "code" && Blockly.FieldMultilineInput ? Blockly.FieldMultilineInput : Blockly.FieldTextInput;
        row.appendField(new Field(String(spec.default ?? "")), spec.key);
      }
    }
    for (const branch of branches) block.appendStatementInput(branch.key).appendField(branch.label || branch.key);
  }

  /** The step around a provided-value block whose section it's in. */
  function owner(block, ownerType) {
    let current = block.getSurroundParent?.();
    while (current) {
      if (current.type === ownerType) return current;
      current = current.getSurroundParent?.();
    }
    return null;
  }

  function define(type, init, generate) {
    Blockly.Blocks[type] = { init };
    javascriptGenerator.forBlock[type] = generate;
  }

  /**
   * Registers one pack's blocks.
   *
   * @returns {string[]} every block type it registered
   */
  function register(pack) {
    const items = latestPackItems(pack);
    if (!items) return [];
    const color = /^#[0-9a-fA-F]{6}$/.test(pack.color ?? "") ? pack.color : "#014f98";
    const setupKey = `disfuse_pack_${pack._id}`;
    const setup = (generator) => {
      if (items.setup?.trim()) generator.definitions_[setupKey] = items.setup;
    };
    const types = [];

    /* A value an event or a section provides, as its own round block. */
    const providedBlock = (ownerType, value, suffix) => {
      const type = packValueBlockType(ownerType, value.key);
      types.push(type);
      define(
        type,
        function () {
          this.appendDummyInput().appendField(value.label || value.key);
          this.setOutput(true, null);
          this.setColour(color);
          this.setTooltip(value.description || "");
        },
        function (block) {
          const code = fillTemplate(value.code, (prefix, name) => (!prefix && name === "id" ? suffix(block) : ""));
          return [code, Order.NONE];
        },
      );
    };

    for (const item of items.values) {
      const type = packItemType(pack._id, item.id);
      types.push(type);
      define(
        type,
        function () {
          this.appendDummyInput().appendField(item.label || "Value");
          appendInputs(this, item.inputs);
          this.setOutput(true, null);
          this.setInputsInline(false);
          this.setColour(color);
          this.setTooltip(item.description || "");
        },
        function (block, generator) {
          setup(generator);
          return [fillTemplate(item.code, resolver(block, generator, item.inputs, { id: `_v${suffixOf(block).slice(1)}` })), Order.NONE];
        },
      );
    }

    for (const item of items.actions) {
      const type = packItemType(pack._id, item.id);
      types.push(type);
      define(
        type,
        function () {
          this.appendDummyInput().appendField(item.label || "Step");
          appendInputs(this, item.inputs, item.branches);
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
          this.setInputsInline(false);
          this.setColour(color);
          this.setTooltip(item.description || "");
        },
        function (block, generator) {
          setup(generator);
          const code = fillTemplate(item.code, resolver(block, generator, item.inputs, { id: suffixOf(block) }));
          return code.endsWith("\n") ? code : `${code}\n`;
        },
      );
      for (const branch of item.branches)
        for (const value of branch.provides) providedBlock(type, value, (block) => suffixOf(owner(block, type)));
    }

    for (const item of items.events) {
      const type = packItemType(pack._id, item.id);
      types.push(type);
      const params = item.params.filter(Boolean);
      define(
        type,
        function () {
          this.appendDummyInput().appendField(item.label || "Event");
          appendInputs(this, item.settings);
          this.appendStatementInput("steps");
          this.setInputsInline(false);
          this.setColour(color);
          this.setTooltip(item.description || "");
        },
        function (block, generator) {
          setup(generator);
          const resolve = resolver(block, generator, item.settings, { id: suffixOf(block) });
          const prelude = item.prelude.trim() ? `${fillTemplate(item.prelude, resolve)}\n` : "";
          const body = prelude + generator.statementToCode(block, "steps");
          if (item.mode === "custom")
            return `${fillTemplate(item.code, resolver(block, generator, item.settings, { id: suffixOf(block), body }))}\n`;
          return `client.${item.once ? "once" : "on"}(${JSON.stringify(item.listen)}, async (${params.join(", ")}) => {\n${body}});\n`;
        },
      );
      for (const value of item.values) providedBlock(type, value, () => "");
    }

    return types;
  }

  return { register };
}

/** A builder pack's blocks for its toolbox category, with a box in every input that has one in the builder. */
export function builderPackToolbox(pack) {
  const items = latestPackItems(pack);
  if (!items) return [];
  const entry = (type, specs) => {
    const inputs = {};
    for (const spec of specs) {
      const shadow = VALUE_KINDS.has(spec.kind) ? shadowFor(spec) : null;
      if (shadow) inputs[spec.key] = shadow;
    }
    return { kind: "block", type, ...(Object.keys(inputs).length ? { inputs } : {}) };
  };
  const list = [];
  /* Archived items still have blocks, so projects using them open, but
     the toolbox doesn't offer them. */
  const offered = (list) => list.filter((item) => !item.archived);
  for (const item of offered(items.events)) {
    const type = packItemType(pack._id, item.id);
    list.push(entry(type, item.settings));
    for (const value of item.values) list.push({ kind: "block", type: packValueBlockType(type, value.key) });
  }
  for (const item of offered(items.actions)) {
    const type = packItemType(pack._id, item.id);
    list.push(entry(type, item.inputs));
    for (const branch of item.branches)
      for (const value of branch.provides) list.push({ kind: "block", type: packValueBlockType(type, value.key) });
  }
  for (const item of offered(items.values)) list.push(entry(packItemType(pack._id, item.id), item.inputs));
  return list;
}
