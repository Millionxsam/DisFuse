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
  nextStatement: string | null | boolean;
  previousStatement: string | null | boolean;
  tooltip?: string;
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
    tooltip,
  } = config;

  Blockly.Blocks[optionsBlockId] = {
    init() {
      this.setColour(colour);
      this.setInputsInline(false);
      this.contextMenu = false;
      mutatorFields.forEach(f => {
        this.appendDummyInput()
          .appendField(f.label)
          .appendField(
            new Blockly.FieldCheckbox((f.default ?? false) ? "TRUE" : "FALSE"),
            f.name,
          );
      });
    },
  };

  Blockly.Blocks[id] = {
    init() {
      this.setColour(colour);
      this.setInputsInline(false);
      if (previousStatement !== false) this.setPreviousStatement(true, previousStatement);
      if (nextStatement !== false) this.setNextStatement(true, nextStatement);
      if (tooltip) this.setTooltip(tooltip);

      for (const input of inputs) {
        let inp: Blockly.Input;
        const field = input.label ? new Blockly.FieldLabel(input.label) : null;

        if (input.type === "dummy") {
          inp = this.appendDummyInput();
        } else if (input.type === "value") {
          inp = this.appendValueInput(input.name || "").setCheck(input.check ?? null);

          setShadow(inp, input.check);
        } else {
          inp = this.appendStatementInput(input.name || "").setCheck(input.check ?? null);
        }

        if (field) inp.appendField(field);
      }

      this.settings_ = mutatorFields.reduce(
        (acc, f) => {
          acc[f.name] = !!f.default;
          return acc;
        },
        {} as Record<string, boolean>,
      );

      this.setMutator(new Blockly.icons.MutatorIcon([], this));
      this.update_();
    },

    mutationToDom() {
      const m = document.createElement("mutation");
      mutatorFields.forEach(f => {
        m.setAttribute(f.name, String(this.settings_[f.name]));
      });
      return m;
    },
    domToMutation(xml: Element) {
      mutatorFields.forEach(f => {
        this.settings_[f.name] = xml.getAttribute(f.name) === "true";
      });
      this.update_();
    },
    decompose(workspace: Blockly.WorkspaceSvg) {
      const container = workspace.newBlock(optionsBlockId);
      container.initSvg();
      mutatorFields.forEach(f => {
        container.setFieldValue(this.settings_[f.name] ? "TRUE" : "FALSE", f.name);
      });
      return container;
    },
    compose(optionBlock: Blockly.BlockSvg) {
      mutatorFields.forEach(f => {
        this.settings_[f.name] = optionBlock.getFieldValue(f.name) === "TRUE";
      });
      this.update_();
    },
    update_() {
      const savedConnections: Record<string, any> = {};
      const savedShadows: Record<string, any> = {};

      Blockly.Events.disable();

      try {
        for (const f of mutatorFields) {
          const input = this.getInput(f.name);

          if (input?.connection?.targetBlock()) {
            const block = input.connection.targetBlock();

            if (block!.isShadow()) {
              savedShadows[f.name] = Blockly.Xml.blockToDom(block!);
              savedConnections[f.name] = null;
            } else {
              savedConnections[f.name] = input.connection.targetConnection;
              savedShadows[f.name] = null;
              block!.unplug();
            }
          } else {
            savedConnections[f.name] = null;
            savedShadows[f.name] = null;
          }

          if (input) this.removeInput(f.name);
        }

        for (const f of mutatorFields) {
          if (!this.settings_[f.name]) continue;

          let input: Blockly.Input;

          if (f.inputType === "value") {
            input = this.appendValueInput(f.name)
              .setCheck(f.valueCheck || null)
              .appendField(f.inputLabel);

            setShadow(input, f.valueCheck);
          } else {
            input = this.appendStatementInput(f.name)
              .setCheck(f.valueCheck || null)
              .appendField(f.inputLabel);
          }

          if (!input.connection) continue;

          if (savedShadows[f.name]) {
            input.connection.setShadowDom(savedShadows[f.name]!);
          }

          if (savedConnections[f.name]) {
            try {
              input.connection.connect(
                savedConnections[f.name]!.targetBlock()?.outputConnection ||
                  savedConnections[f.name],
              );
            } catch (e) {}
          }
        }
      } finally {
        Blockly.Events.enable();
      }
    },
  };
}

function setShadow(input: Blockly.Input, check?: string | string[] | null) {
  const connection = input.connection;
  if (!connection) return;

  const type = Array.isArray(check) ? check[0] : check;

  let blockType: string | null = null;
  let fieldName: string | null = null;
  let fieldValue: string | null = null;

  if (type === "String") {
    blockType = "text";
    fieldName = "TEXT";
    fieldValue = "";
  } else if (type === "Number") {
    blockType = "math_number";
    fieldName = "NUM";
    fieldValue = "0";
  } else if (type === "Boolean") {
    blockType = "logic_boolean";
    fieldName = "BOOL";
    fieldValue = "FALSE";
  }

  if (!blockType) return;

  const shadow = Blockly.utils.xml.createElement("shadow");
  shadow.setAttribute("type", blockType);

  if (fieldName) {
    const field = Blockly.utils.xml.createElement("field");
    field.setAttribute("name", fieldName);
    field.textContent = fieldValue!;
    shadow.appendChild(field);
  }

  connection.setShadowDom(shadow);
}
