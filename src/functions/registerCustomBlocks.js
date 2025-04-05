import * as Blockly from "blockly";
import { javascriptGenerator, Order } from "blockly/javascript";

export default function registerCustomBlocks(
  blocks,
  workspace,
  deleteable = false,
  aiGenerated = false
) {
  blocks.forEach(async (block) => {
    Blockly.Blocks[block.name] = {
      init: function () {
        this.setInputsInline(block.inline || false);
        this.setColour(block.color);
        this.setTooltip(block.description || "");
        this.setHelpUrl(block.helpUrl);

        if (block.inlineInputs !== null)
          this.setInputsInline(block.inlineInputs);

        block.inputs.forEach((input) => {
          let currentInput;
          switch (input.type) {
            case "value":
              currentInput = this.appendValueInput(input.name)
                .setAlign(input.align)
                .setCheck(input.check);
              break;
            case "statement":
              currentInput = this.appendStatementInput(input.name)
                .setAlign(input.align)
                .setCheck(input.check);
              break;
            case "dummy":
              currentInput = this.appendDummyInput().setAlign(input.align);
              break;
            case "endrow":
              currentInput = this.appendEndRowInput().setAlign(input.align);
              break;
            default:
              break;
          }

          input.fields.forEach((field) => {
            switch (field.type) {
              case "label":
                currentInput.appendField(field.text);
                break;
              case "textInput":
                currentInput.appendField(
                  new Blockly.FieldTextInput(field.defaultValue),
                  field.name
                );
                break;
              case "numericInput":
                currentInput.appendField(
                  new Blockly.FieldNumber(
                    field.defaultValue,
                    field.min,
                    field.max,
                    field.precision
                  ),
                  field.name
                );
                break;
              case "checkbox":
                currentInput.appendField(
                  new Blockly.FieldCheckbox(field.defaultValue),
                  field.name
                );
                break;
              case "variable":
                currentInput.appendField(
                  new Blockly.FieldVariable(field.defaultValue),
                  field.name
                );
                break;
              case "dropdown":
                currentInput.appendField(
                  new Blockly.FieldDropdown(
                    field.choices.length ? field.choices : [["", ""]]
                  ),
                  field.name
                );
                break;
              default:
                break;
            }
          });
        });

        switch (block.type) {
          case "output":
            this.setOutput(true, block.output);
            break;
          case "stack":
            this.setPreviousStatement(true, block.previousStatement);
            this.setNextStatement(true, block.nextStatement);
            break;
          case "hat":
            this.setPreviousStatement(false, block.previousStatement);
            this.setNextStatement(true, block.nextStatement);
            break;
          case "end":
            this.setPreviousStatement(true, block.previousStatement);
            this.setNextStatement(false, block.nextStatement);
            break;
          default:
            break;
        }
      },
    };

    const bl = block;

    javascriptGenerator.forBlock[block.name] = function (block, generator) {
      // eslint-disable-next-line no-new-func
      const genCode = new Function(
        "block",
        "generator",
        "Order",
        `return ${aiGenerated ? `\`${bl.outputCode}\`` : bl.outputCode};`
      );

      return genCode(block, generator, Order);
    };

    if (workspace) {
      const bl = workspace.newBlock(block.name);
      bl.initSvg();
      bl.render();
      bl.setDeletable(deleteable);
    }
  });

  if (workspace) workspace.cleanUp();
}
