/* =====================================================================
   What the builder converter needs to ask Blockly
   ---------------------------------------------------------------------
   builder/convert/fromBlocks.js turns saved workspaces into a DisFuse
   Builder project without importing Blockly. The few things only
   Blockly can answer come through this adapter:

     source(type)  whether a block is DisFuse's own, from a Workshop
                   pack, from BlockBuddy, or unknown here
     shape(block)  which of a block's inputs are value inputs and which
                   hold stacked blocks, and whether it's a round block
     code(block)   the JavaScript a value block generates on its own
     parts(block)  shape(), plus every field with what kind it is (for
                   turning steps back into blocks, convert/toBlocks.js)
     types()       every block type Blockly knows
     variableNames(names)  what each variable is called in the generated
                   code, so code blocks use the same names

   Blockly and its generator are passed in rather than imported, so the
   check script can run the same code in Node.
   ===================================================================== */

/** A block's own fields and settings, without anything plugged into it. */
function bare(json) {
  const fields = {};
  for (const [name, value] of Object.entries(json?.fields ?? {}))
    /* Variable fields point at variables this workspace doesn't have. */
    if (value === null || typeof value !== "object") fields[name] = value;
  return { type: json.type, fields, ...(json.extraState !== undefined ? { extraState: json.extraState } : {}) };
}

/**
 * @param {object} args
 * @param {object} args.Blockly
 * @param {object} args.javascriptGenerator
 * @param {(type: string) => { kind: string }} args.blockSource  see functions/templateBlocks.js
 */
export function createBlockAdapter({ Blockly, javascriptGenerator, blockSource }) {
  const workspace = new Blockly.Workspace();

  /** Runs fn with a throwaway copy of the block, then removes it. */
  function withBlock(json, fn) {
    if (!Blockly.Blocks[json?.type]) return null;
    const eventsWereOn = Blockly.Events.isEnabled();
    Blockly.Events.disable();
    let block = null;
    try {
      block = Blockly.serialization.blocks.append(bare(json), workspace, { recordUndo: false });
      return fn(block);
    } catch {
      return null;
    } finally {
      try {
        block?.dispose(false);
      } catch {
        /* already gone */
      }
      if (eventsWereOn) Blockly.Events.enable();
    }
  }

  return {
    source(type) {
      return blockSource(type)?.kind ?? "missing";
    },

    shape(json) {
      return withBlock(json, (block) => {
        const inputs = {};
        for (const input of block.inputList) {
          if (!input.name) continue;
          if (input.type === Blockly.inputs.inputTypes.VALUE) inputs[input.name] = "value";
          else if (input.type === Blockly.inputs.inputTypes.STATEMENT) inputs[input.name] = "statement";
        }
        return { inputs, output: Boolean(block.outputConnection), previous: Boolean(block.previousConnection) };
      });
    },

    parts(json) {
      return withBlock(json, (block) => {
        const inputs = {};
        const fields = {};
        for (const input of block.inputList) {
          if (input.name) {
            if (input.type === Blockly.inputs.inputTypes.VALUE) inputs[input.name] = "value";
            else if (input.type === Blockly.inputs.inputTypes.STATEMENT) inputs[input.name] = "statement";
          }
          for (const field of input.fieldRow) {
            if (!field.name || !field.EDITABLE) continue;
            let kind = "text";
            let options = null;
            if (field instanceof Blockly.FieldDropdown) {
              kind = "dropdown";
              try {
                options = field.getOptions(false).map((option) => option[1]);
              } catch {
                options = [];
              }
            } else if (field instanceof Blockly.FieldCheckbox) kind = "checkbox";
            else if (field instanceof Blockly.FieldVariable) kind = "variable";
            else if (field instanceof Blockly.FieldNumber) kind = "number";
            else if (Blockly.FieldColour && field instanceof Blockly.FieldColour) kind = "colour";
            fields[field.name] = { kind, ...(options ? { options } : {}), value: field.getValue() };
          }
        }
        return {
          inputs,
          fields,
          output: Boolean(block.outputConnection),
          previous: Boolean(block.previousConnection),
          next: Boolean(block.nextConnection),
          /* What the block will connect to (null: anything). */
          previousCheck: block.previousConnection?.getCheck() ?? null,
          generates: typeof javascriptGenerator.forBlock[block.type] === "function",
        };
      });
    },

    variableNames(names) {
      const scratch = new Blockly.Workspace();
      try {
        const models = names.map((name) => scratch.createVariable(name));
        javascriptGenerator.init(scratch);
        return models.map((model) => javascriptGenerator.getVariableName(model.getId()));
      } finally {
        scratch.dispose();
      }
    },

    types() {
      return Object.keys(Blockly.Blocks).filter((type) => typeof Blockly.Blocks[type]?.init === "function");
    },

    code(json) {
      const generate = javascriptGenerator.forBlock[json?.type];
      if (typeof generate !== "function") return null;
      return withBlock(json, (block) => {
        javascriptGenerator.init(workspace);
        const result = generate.call(block, block, javascriptGenerator);
        const code = Array.isArray(result) ? result[0] : result;
        return typeof code === "string" ? code : null;
      });
    },

    dispose() {
      workspace.dispose();
    },
  };
}
