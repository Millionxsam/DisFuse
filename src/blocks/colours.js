import * as Blockly from 'blockly/core';
import { javascriptGenerator, Order } from 'blockly/javascript';

Blockly.Blocks['colour_hex'] = {
    init: function () {
        var validator = function (newValue) {
            let regExp = /^#([0-9a-fA-F]{3}){1,2}$/i;
            if (regExp.test(newValue)) {
                return newValue;
            } else {
                return null;
            }
        };

        var field = new Blockly.FieldTextInput("#ffffff");
        field.setValidator(validator);

        this.appendDummyInput()
            .appendField('hex colour')
            .appendField(field, 'colour');
        this.setColour('#ad794c');
        this.setOutput(true, 'Colour');
    }
};

javascriptGenerator.forBlock['colour_hex'] = function (block) {
    var colour = block.getFieldValue('colour');
    return [colour, Order.ATOMIC];
};