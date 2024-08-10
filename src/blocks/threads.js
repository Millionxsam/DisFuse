import * as Blockly from "blockly";
import { Order, javascriptGenerator } from "blockly/javascript";
import { createRestrictions } from "../functions/restrictions";

Blockly.Blocks['threads_msgCreateThread'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('Start a thread');
        this.appendValueInput('message')
            .setCheck('message').appendField('in the message:');
        this.appendValueInput('name')
            .setCheck('String').appendField('name:');
        this.appendValueInput('slowmode')
            .setCheck('Number').appendField('slowmode:');
        this.appendStatementInput("then").appendField("then:");
        this.setColour('#5b67a5');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
    }
};

javascriptGenerator.forBlock['threads_msgCreateThread'] = function (block, generator) {
    var val_message = generator.valueToCode(block, 'message', Order.ATOMIC);
    var val_name = generator.valueToCode(block, 'name', Order.ATOMIC);
    var val_slowmode = generator.valueToCode(block, 'slowmode', Order.ATOMIC);
    var then = generator.statementToCode(block, "then");

    var code = `${val_message}.startThread({
  name: ${val_name},${val_slowmode ? `\nrateLimitPerUser: ${val_slowmode}` : ''}
})`;

    if (then) code += `.then(createdThread => {\n${then}})`;

    code += ';\n'

    return code;
};

Blockly.Blocks['threads_channelCreateThread'] = {
    init: function () {
        this.appendDummyInput()
            .appendField('Start a thread');
        this.appendValueInput('channel')
            .setCheck('channel').appendField('in the channel:');
        this.appendValueInput('name')
            .setCheck('String').appendField('name:');
        this.appendValueInput('slowmode')
            .setCheck('Number').appendField('slowmode:');
        this.appendStatementInput("then").appendField("then:");
        this.setColour('#5b67a5');
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
    }
};

javascriptGenerator.forBlock['threads_channelCreateThread'] = function (block, generator) {
    var val_channel = generator.valueToCode(block, 'channel', Order.ATOMIC);
    var val_name = generator.valueToCode(block, 'name', Order.ATOMIC);
    var val_slowmode = generator.valueToCode(block, 'slowmode', Order.ATOMIC);
    var then = generator.statementToCode(block, "then");

    var code = `${val_channel}.threads.create({
  name: ${val_name},${val_slowmode ? `\nrateLimitPerUser: ${val_slowmode}` : ''}
})`;

    if (then) code += `.then(createdThread => {\n${then}})`;

    code += ';\n'

    return code;
};

Blockly.Blocks['threads_createdThread'] = {
    init: function () {
        this.appendDummyInput().appendField('created thread');
        this.setColour('#5b67a5');
        this.setOutput(true, 'thread');
    }
};

javascriptGenerator.forBlock['threads_createdThread'] = () => ['createdThread', Order.NONE];

Blockly.Blocks['threads_name'] = {
    init: function () {
        this.appendValueInput('thread')
            .setCheck('thread').appendField('name of thread:');
        this.setColour('#5b67a5');
        this.setOutput(true, 'String')
    }
};

javascriptGenerator.forBlock['threads_name'] = function (block, generator) {
    var val_thread = generator.valueToCode(block, 'thread', Order.ATOMIC);
    return [`${val_thread}.name`, Order.NONE];
};

Blockly.Blocks["thread_getone"] = {
    init: function () {
        this.appendValueInput("value")
            .setCheck("String")
            .appendField("get the thread with the")
            .appendField(
                new Blockly.FieldDropdown([
                    ["name", "name"],
                    ["id", "id"],
                ]),
                "type"
            )
            .appendField("equal to");
        this.appendValueInput("channel")
            .setCheck("channel")
            .appendField("on the channel");
        this.setOutput(true, "thread");
        this.setColour('#5b67a5');
        this.setTooltip("");
        this.setHelpUrl("");
    },
};

javascriptGenerator.forBlock["thread_getone"] = function (block, generator) {
    var dropdown_type = block.getFieldValue("type");
    var value_value = generator.valueToCode(block, "value", Order.ATOMIC);
    var value_channel = generator.valueToCode(block, "channel", Order.ATOMIC);

    var code = `${value_channel}.threads.cache${dropdown_type === "id"
        ? `.get(${value_value})`
        : `.find(c => c.name == ${value_value})`
        }`;
    return [code, Order.NONE];
};

createRestrictions(
    ["threads_msgCreateThread"],
    [
        {
            type: "notEmpty",
            blockTypes: ["message"],
            message: "You must specify what message to start a thread in",
        }
    ]
);

createRestrictions(
    ["threads_channelCreateThread"],
    [
        {
            type: "notEmpty",
            blockTypes: ["channel"],
            message: "You must specify what channel to start a thread in",
        }
    ]
)

createRestrictions(
    ["threads_msgCreateThread", "threads_channelCreateThread"],
    [
        {
            type: "notEmpty",
            blockTypes: ["name"],
            message: "You must specify the name of the thread",
        },
    ]
);

createRestrictions(
    ["threads_createdThread"],
    [
        {
            type: "hasParent",
            blockTypes: ["threads_msgCreateThread", "threads_channelCreateThread"],
            message: "This block must be under a 'start a thread' block",
        },
    ]
);

createRestrictions(
    ["threads_name"],
    [
        {
            type: "notEmpty",
            blockTypes: ["thread"],
            message: "You must specify the thread",
        },
    ]
);