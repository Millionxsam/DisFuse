import * as Blockly from "blockly";

interface BaseInput {
  type: "dummy" | "value" | "statement";
  name?: string;
  check?: string | string[] | null;
  label?: string;
  inputAlignRight?: boolean;
}

interface MutatorFieldConfig {
  name: string;
  label: string;
  default?: boolean;
  inputType: "value" | "statement";
  inputLabel: string;
  valueCheck?: string;
}

interface MutatorBlockConfig {
  id: string;
  optionsBlockId: string;
  colour: string;
  inputs?: BaseInput[];
  mutatorFields: MutatorFieldConfig[];
  nextStatement: string | null;
  previousStatement: string | null;
}

export function createMutatorBlock(config: MutatorBlockConfig) {
  const {
    id,
    optionsBlockId,
    colour,
    inputs = [],
    mutatorFields,
    nextStatement,
    previousStatement,
  } = config;

  // options block
  Blockly.Blocks[optionsBlockId] = {
    init() {
      this.setColour(colour);
      this.setInputsInline(false);
      this.contextMenu = false;
      mutatorFields.forEach((f) => {
        this.appendDummyInput()
          .appendField(f.label)
          .appendField(
            new Blockly.FieldCheckbox(f.default ?? false ? "TRUE" : "FALSE"),
            f.name
          );
      });
    },
  };

  // main block
  Blockly.Blocks[id] = {
    init() {
      this.setColour(colour);
      this.setInputsInline(false);
      this.setPreviousStatement(true, previousStatement);
      this.setNextStatement(true, nextStatement);

      for (const input of inputs) {
        let inp: Blockly.Input;
        const field = input.label ? new Blockly.FieldLabel(input.label) : null;

        if (input.type === "dummy") {
          inp = this.appendDummyInput();
        } else if (input.type === "value") {
          inp = this.appendValueInput(input.name || "").setCheck(
            input.check ?? null
          );
        } else {
          inp = this.appendStatementInput(input.name || "").setCheck(
            input.check ?? null
          );
        }

        if (field) inp.appendField(field);
      }

      this.settings_ = mutatorFields.reduce((acc, f) => {
        acc[f.name] = !!f.default;
        return acc;
      }, {} as Record<string, boolean>);

      this.setMutator(new Blockly.icons.MutatorIcon([], this));
      this.update_();
    },

    mutationToDom() {
      const m = document.createElement("mutation");
      mutatorFields.forEach((f) => {
        m.setAttribute(f.name, String(this.settings_[f.name]));
      });
      return m;
    },
    domToMutation(xml: Element) {
      mutatorFields.forEach((f) => {
        this.settings_[f.name] = xml.getAttribute(f.name) === "true";
      });
      this.update_();
    },
    decompose(workspace: Blockly.WorkspaceSvg) {
      const container = workspace.newBlock(optionsBlockId);
      container.initSvg();
      mutatorFields.forEach((f) => {
        container.setFieldValue(
          this.settings_[f.name] ? "TRUE" : "FALSE",
          f.name
        );
      });
      return container;
    },
    compose(optionBlock: Blockly.BlockSvg) {
      mutatorFields.forEach((f) => {
        this.settings_[f.name] = optionBlock.getFieldValue(f.name) === "TRUE";
      });
      this.update_();
    },
    update_() {
      const saved: Record<string, Blockly.Connection | null> = {};

      for (const f of mutatorFields) {
        const input = this.getInput(f.name);
        if (input) {
          saved[f.name] = input.connection?.targetConnection ?? null;
          this.removeInput(f.name);
        }
      }

      for (const f of mutatorFields) {
        if (this.settings_[f.name]) {
          let input: Blockly.Input;
          if (f.inputType === "value") {
            input = this.appendValueInput(f.name)
              .setCheck(f.valueCheck || null)
              .appendField(f.inputLabel);
          } else {
            input = this.appendStatementInput(f.name)
              .setCheck(f.valueCheck || null)
              .appendField(f.inputLabel);
          }

          if (saved[f.name] && input?.connection) {
            input.connection.connect(saved[f.name]!);
          }
        }
      }
    },
  };
}
