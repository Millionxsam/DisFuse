import * as Blockly from "blockly";
import { Order, javascriptGenerator } from "blockly/javascript";
import { createRestrictions } from "../functions/restrictions";

Blockly.Blocks['object_new'] = {
    init: function () {
        this.appendDummyInput().appendField('create new object');
        this.appendStatementInput('keys')
            .setCheck("keyBlocks").appendField('keys:');
        this.setColour('#BA59CE');
        this.setOutput(true, "object");
    }
};

javascriptGenerator.forBlock['object_new'] = function (block, generator) {
    var keys = generator.statementToCode(block, 'keys');

    var code;
    if (!keys) {
        code = `{}`;
    } else {
        code = `{\n${keys}}`;
    }

    return [code, Order.NONE];
};

Blockly.Blocks['object_addkey'] = {
    init: function () {
        this.appendValueInput('value')
            .setCheck(null).appendField('add key')
            .appendField(new Blockly.FieldTextInput('key'), 'key')
            .appendField('with value');
        this.setColour('#BA59CE');
        this.setPreviousStatement(true, 'keyBlocks');
        this.setNextStatement(true, 'keyBlocks');
    }
};

javascriptGenerator.forBlock['object_addkey'] = function (block, generator) {
    var val_value = generator.valueToCode(block, 'value', Order.ATOMIC);
    var field_key = block.getFieldValue('key');

    return `${field_key}: ${val_value},\n`;
};

createRestrictions(
    ['object_addkey'],
    [
        {
            type: "surroundParent",
            blockTypes: ["object_new"],
            message: 'This block must be under "create new object" block',
        },
    ]
);

Blockly.Blocks['object_setkey'] = {
    init: function () {
        this.appendValueInput('key')
            .setCheck('String').appendField('set key:');
        this.appendValueInput('value')
            .setCheck(null).appendField('to value:');
        this.appendValueInput('object')
            .setCheck('object').appendField('in object:');
        this.setInputsInline(true);
        this.setColour('#BA59CE');
        this.setPreviousStatement(true, "default");
        this.setNextStatement(true, "default");
    }
};

javascriptGenerator.forBlock['object_setkey'] = function (block, generator) {
    var val_key = generator.valueToCode(block, 'key', Order.ATOMIC);
    var val_value = generator.valueToCode(block, 'value', Order.ATOMIC);
    var val_object = generator.valueToCode(block, 'object', Order.ATOMIC);

    var code = `${val_object}[${val_key}] = ${val_value};\n`;

    return code;
};

Blockly.Blocks['object_deletekey'] = {
    init: function () {
        this.appendValueInput('key')
            .setCheck('String').appendField('delete key:');
        this.appendValueInput('object')
            .setCheck('object').appendField('from object:');
        this.setInputsInline(true);
        this.setColour('#BA59CE');
        this.setPreviousStatement(true, "default");
        this.setNextStatement(true, "default");
    }
};

javascriptGenerator.forBlock['object_deletekey'] = function (block, generator) {
    var val_key = generator.valueToCode(block, 'key', Order.ATOMIC);
    var val_object = generator.valueToCode(block, 'object', Order.ATOMIC);

    var code = `delete ${val_object}[${val_key}];\n`;

    return code;
};

Blockly.Blocks['object_getkey'] = {
    init: function () {
        this.appendValueInput('key')
            .setCheck('String').appendField('get key:');
        this.appendValueInput('object')
            .setCheck('object').appendField('from object:');
        this.setInputsInline(true);
        this.setColour('#BA59CE');
        this.setOutput(true, null);
    }
};

javascriptGenerator.forBlock['object_getkey'] = function (block, generator) {
    var val_key = generator.valueToCode(block, 'key', Order.ATOMIC);
    var val_object = generator.valueToCode(block, 'object', Order.ATOMIC);

    var code = `${val_object}[${val_key}]`;

    return [code, Order.NONE];
};

Blockly.Blocks['object_length'] = {
    init: function () {
        this.appendValueInput('object')
            .setCheck('object').appendField('length of object:');
        this.setInputsInline(true);
        this.setColour('#BA59CE');
        this.setOutput(true, "Number");
    }
};

javascriptGenerator.forBlock['object_length'] = function (block, generator) {
    var val_object = generator.valueToCode(block, 'object', Order.ATOMIC);

    return [`Object.keys(${val_object}).length`, Order.NONE];
};

Blockly.Blocks['object_keys'] = {
    init: function () {
        this.appendValueInput('object')
            .setCheck('object').appendField('get keys list of object:');
        this.setInputsInline(true);
        this.setColour('#BA59CE');
        this.setOutput(true, "Array");
    }
};

javascriptGenerator.forBlock['object_keys'] = function (block, generator) {
    var val_object = generator.valueToCode(block, 'object', Order.ATOMIC);
    return [`Object.keys(${val_object})`, Order.NONE];
};

Blockly.Blocks['object_values'] = {
    init: function () {
        this.appendValueInput('object')
            .setCheck('object').appendField('get values list of object:');
        this.setInputsInline(true);
        this.setColour('#BA59CE');
        this.setOutput(true, "Array");
    }
};

javascriptGenerator.forBlock['object_values'] = function (block, generator) {
    var val_object = generator.valueToCode(block, 'object', Order.ATOMIC);
    return [`Object.values(${val_object})`, Order.NONE];
};

Blockly.Blocks['object_has'] = {
    init: function () {
        this.appendValueInput('string')
            .setCheck('String')
            .appendField('is')
            .appendField(new Blockly.FieldDropdown([
                ["key", "key"],
                ["value", "value"],
            ]), "item");
        this.appendValueInput('object')
            .setCheck('object').appendField('in object');
        this.appendDummyInput().appendField('?');
        this.setInputsInline(true);
        this.setColour('#BA59CE');
        this.setOutput(true, "Boolean");
    }
};

javascriptGenerator.forBlock['object_has'] = function (block, generator) {
    var item = block.getFieldValue("item");
    var string = generator.valueToCode(block, 'string', Order.ATOMIC);
    var object = generator.valueToCode(block, 'object', Order.ATOMIC);

    if (item === 'value') {
        return [`Object.values(${object}).includes(${string})`, Order.NONE];
    } else if (item === 'key') {
        return [`${object}.hasOwnProperty(${string})`, Order.NONE];
    }
};

Blockly.Blocks['object_stringify'] = {
    init: function () {
        this.appendValueInput('object')
            .setCheck('object')
            .appendField('convert object');
        this.appendDummyInput().appendField('to JSON string');
        this.setInputsInline(true);
        this.setColour('#BA59CE');
        this.setOutput(true, "String");
    }
};

javascriptGenerator.forBlock['object_stringify'] = function (block, generator) {
    var val_object = generator.valueToCode(block, 'object', Order.ATOMIC);
    return [`JSON.stringify(${val_object})`, Order.NONE];
};

Blockly.Blocks['object_parse'] = {
    init: function () {
        this.appendValueInput('string')
            .setCheck('String')
            .appendField('convert JSON string');
        this.appendDummyInput().appendField('to object');
        this.setInputsInline(true);
        this.setColour('#BA59CE');
        this.setOutput(true, "object");
    }
};

javascriptGenerator.forBlock['object_parse'] = function (block, generator) {
    var val_string = generator.valueToCode(block, 'string', Order.ATOMIC);
    return [`JSON.parse(${val_string})`, Order.NONE];
};

createRestrictions(
    ['object_setkey', 'object_deletekey', 'object_getkey', 'object_length', 'object_keys', 'object_values', 'object_has', 'object_stringify'],
    [
        {
            type: "notEmpty",
            blockTypes: ["object"],
            message: 'You must specify the object',
        },
    ]
);

createRestrictions(
    ['object_setkey', 'object_addkey'],
    [
        {
            type: "notEmpty",
            blockTypes: ["value"],
            message: 'You must specify the value',
        },
    ]
);