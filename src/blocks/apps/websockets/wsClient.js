import * as Blockly from "blockly";
import { Order, javascriptGenerator } from "blockly/javascript";
import { createRestrictions } from "../../lib/restrictions";
import { closeCodeTooltip, colours, nameField, nameOf, valueOr } from "./shared.js";

/* =====================================================================
   WebSocket (ws) — frontend: the bot connects to somebody else's server
   ---------------------------------------------------------------------
   Plain WebSockets have no built-in idea of "events", only messages. The
   "event" blocks here use the most common convention on top of that —
   JSON shaped like { "event": "name", "data": ... } — and the plain
   message blocks are always there for servers that speak something else.
   ===================================================================== */

const colour = colours.wsClient;

/** A statement block: it has a previous and next connection. */
function statement(block) {
  block.setPreviousStatement(true, "default");
  block.setNextStatement(true, "default");
  block.setColour(colour);
}

/** A "when…" block: it sits on its own and runs the blocks inside it. */
function hat(block, text, afterName = "") {
  const input = block
    .appendDummyInput()
    .appendField(text)
    .appendField(nameField(), "NAME");
  if (afterName) input.appendField(afterName);
  block.setColour(colour);
  block.setPreviousStatement(false);
  block.setNextStatement(false);
}

// ---------------------------------------------------------------------
// Connecting
// ---------------------------------------------------------------------

Blockly.Blocks["ws_client_connect"] = {
  init: function () {
    this.setInputsInline(false);
    this.appendDummyInput()
      .appendField("connect to WebSocket server as")
      .appendField(nameField(), "NAME");
    this.appendValueInput("url").setCheck("String").appendField("URL:");
    this.appendDummyInput()
      .appendField("reconnect automatically if it drops")
      .appendField(new Blockly.FieldCheckbox("TRUE"), "reconnect");
    statement(this);
    this.setTooltip(
      'Opens a WebSocket connection to a server (the URL starts with ws:// or wss://). The name lets other blocks use this connection. Put "when connection … receives a message" blocks anywhere to react to it.',
    );
  },
};

javascriptGenerator.forBlock["ws_client_connect"] = function (block, generator) {
  const url = valueOr(generator, block, "url");
  const reconnect = block.getFieldValue("reconnect") === "TRUE";
  return `wsConnect(${nameOf(block)}, ${url}, { reconnect: ${reconnect} });\n`;
};

Blockly.Blocks["ws_client_connectAdvanced"] = {
  init: function () {
    this.setInputsInline(false);
    this.appendDummyInput()
      .appendField("connect to WebSocket server as")
      .appendField(nameField(), "NAME");
    this.appendValueInput("url").setCheck("String").appendField("URL:");
    this.appendValueInput("headers").appendField("headers (object):");
    this.appendValueInput("protocol")
      .setCheck("String")
      .appendField("subprotocol (optional):");
    this.appendDummyInput()
      .appendField("reconnect automatically if it drops")
      .appendField(new Blockly.FieldCheckbox("TRUE"), "reconnect");
    statement(this);
    this.setTooltip(
      "Opens a WebSocket connection and sends extra headers with it, like an Authorization header with an API key. Leave the subprotocol empty unless the API asks for one.",
    );
  },
};

javascriptGenerator.forBlock["ws_client_connectAdvanced"] = function (
  block,
  generator,
) {
  const url = valueOr(generator, block, "url");
  const headers = valueOr(generator, block, "headers", "undefined");
  const protocol = valueOr(generator, block, "protocol", "undefined");
  const reconnect = block.getFieldValue("reconnect") === "TRUE";
  return `wsConnect(${nameOf(block)}, ${url}, {
  reconnect: ${reconnect},
  headers: ${headers},
  protocols: ${protocol} || undefined,
});\n`;
};

Blockly.Blocks["ws_client_waitOpen"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("wait until connection")
      .appendField(nameField(), "NAME")
      .appendField("is open");
    this.appendValueInput("seconds")
      .setCheck("Number")
      .appendField("give up after (seconds):");
    this.setInputsInline(true);
    statement(this);
    this.setTooltip(
      "Pauses until the connection has finished opening, or until the time runs out. Handy right after connecting, before sending something.",
    );
  },
};

javascriptGenerator.forBlock["ws_client_waitOpen"] = function (block, generator) {
  const seconds = valueOr(generator, block, "seconds", "10");
  return `await wsWaitOpen(${nameOf(block)}, ${seconds});\n`;
};

Blockly.Blocks["ws_client_disconnect"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("disconnect connection")
      .appendField(nameField(), "NAME");
    this.appendValueInput("code").setCheck("Number").appendField("close code:");
    this.appendValueInput("reason").setCheck("String").appendField("reason:");
    statement(this);
    this.setTooltip(
      `Closes the connection. It won't reconnect by itself after this. ${closeCodeTooltip}`,
    );
  },
};

javascriptGenerator.forBlock["ws_client_disconnect"] = function (
  block,
  generator,
) {
  const code = valueOr(generator, block, "code", "1000");
  const reason = valueOr(generator, block, "reason");
  return `wsDisconnect(${nameOf(block)}, ${code}, ${reason});\n`;
};

Blockly.Blocks["ws_client_reconnect"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("reconnect connection")
      .appendField(nameField(), "NAME");
    statement(this);
    this.setTooltip(
      "Closes the connection (if it's open) and connects again to the same URL, with the same settings",
    );
  },
};

javascriptGenerator.forBlock["ws_client_reconnect"] = function (block) {
  return `wsReconnect(${nameOf(block)});\n`;
};

// ---------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------

Blockly.Blocks["ws_client_isOpen"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("connection")
      .appendField(nameField(), "NAME")
      .appendField("is open?");
    this.setOutput(true, "Boolean");
    this.setColour(colour);
    this.setTooltip("True if the connection is open and ready to send messages");
  },
};

javascriptGenerator.forBlock["ws_client_isOpen"] = function (block) {
  return [`(wsState(${nameOf(block)}) === "open")`, Order.ATOMIC];
};

Blockly.Blocks["ws_client_state"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("status of connection")
      .appendField(nameField(), "NAME");
    this.setOutput(true, "String");
    this.setColour(colour);
    this.setTooltip(
      'The connection\'s status as text: "connecting", "open", "closing" or "closed"',
    );
  },
};

javascriptGenerator.forBlock["ws_client_state"] = function (block) {
  return [`wsState(${nameOf(block)})`, Order.FUNCTION_CALL];
};

Blockly.Blocks["ws_client_url"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("URL of connection")
      .appendField(nameField(), "NAME");
    this.setOutput(true, "String");
    this.setColour(colour);
    this.setTooltip("The URL this connection was opened to");
  },
};

javascriptGenerator.forBlock["ws_client_url"] = function (block) {
  return [`(wsConnections[${nameOf(block)}]?.url ?? null)`, Order.ATOMIC];
};

// ---------------------------------------------------------------------
// Sending
// ---------------------------------------------------------------------

Blockly.Blocks["ws_client_send"] = {
  init: function () {
    this.appendValueInput("message").appendField("send message");
    this.appendDummyInput()
      .appendField("through connection")
      .appendField(nameField(), "NAME");
    this.setInputsInline(true);
    statement(this);
    this.setTooltip(
      "Sends a message to the server. Text is sent as it is; objects and lists are sent as JSON. If the connection is still opening, the message is sent as soon as it opens.",
    );
  },
};

javascriptGenerator.forBlock["ws_client_send"] = function (block, generator) {
  const message = valueOr(generator, block, "message");
  return `wsSend(${nameOf(block)}, ${message});\n`;
};

Blockly.Blocks["ws_client_sendEvent"] = {
  init: function () {
    this.appendValueInput("event").setCheck("String").appendField("send event");
    this.appendValueInput("data").appendField("with data");
    this.appendDummyInput()
      .appendField("through connection")
      .appendField(nameField(), "NAME");
    this.setInputsInline(true);
    statement(this);
    this.setTooltip(
      'Sends { "event": name, "data": data } as JSON. Use this with servers that expect events in that shape — including DisFuse WebSocket servers.',
    );
  },
};

javascriptGenerator.forBlock["ws_client_sendEvent"] = function (block, generator) {
  const event = valueOr(generator, block, "event");
  const data = valueOr(generator, block, "data", "null");
  return `wsSend(${nameOf(block)}, wsEvent(${event}, ${data}));\n`;
};

// ---------------------------------------------------------------------
// When things happen
// ---------------------------------------------------------------------

Blockly.Blocks["ws_client_onOpen"] = {
  init: function () {
    hat(this, "when connection", "opens");
    this.appendStatementInput("code").setCheck(null);
    this.setTooltip(
      "Runs every time the connection opens, including after it reconnects. A good place to log in or subscribe to things.",
    );
  },
};

javascriptGenerator.forBlock["ws_client_onOpen"] = function (block, generator) {
  const code = generator.statementToCode(block, "code");
  return `wsOnConnection(${nameOf(block)}, "open", async () => {\n${code}});\n`;
};

Blockly.Blocks["ws_client_onMessage"] = {
  init: function () {
    hat(this, "when connection", "receives a message");
    this.appendStatementInput("code").setCheck(null);
    this.setTooltip("Runs every time the server sends a message");
  },
};

javascriptGenerator.forBlock["ws_client_onMessage"] = function (
  block,
  generator,
) {
  const code = generator.statementToCode(block, "code");
  return `wsOnConnection(${nameOf(block)}, "message", async (wsMessage) => {\n${code}});\n`;
};

Blockly.Blocks["ws_client_onEvent"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("when connection")
      .appendField(nameField(), "NAME")
      .appendField("receives event")
      .appendField(new Blockly.FieldTextInput("chat"), "EVENT");
    this.appendStatementInput("code").setCheck(null);
    this.setColour(colour);
    this.setPreviousStatement(false);
    this.setNextStatement(false);
    this.setTooltip(
      'Runs when the server sends JSON like { "event": "chat", "data": ... } with this event name. Use "event data" inside it.',
    );
  },
};

javascriptGenerator.forBlock["ws_client_onEvent"] = function (block, generator) {
  const event = JSON.stringify(block.getFieldValue("EVENT"));
  const code = generator.statementToCode(block, "code");
  return `wsOnConnection(${nameOf(block)}, "message", async (wsMessage) => {
  const wsReceivedEvent = wsParseJson(wsMessage);
  if (wsReceivedEvent?.event !== ${event}) return;
  const wsEventData = wsReceivedEvent.data;
${code}});\n`;
};

Blockly.Blocks["ws_client_onClose"] = {
  init: function () {
    hat(this, "when connection", "closes");
    this.appendStatementInput("code").setCheck(null);
    this.setTooltip(
      "Runs when the connection closes, whether you closed it or the server did",
    );
  },
};

javascriptGenerator.forBlock["ws_client_onClose"] = function (block, generator) {
  const code = generator.statementToCode(block, "code");
  return `wsOnConnection(${nameOf(block)}, "close", async (wsCloseCode, wsCloseReason) => {\n${code}});\n`;
};

Blockly.Blocks["ws_client_onError"] = {
  init: function () {
    hat(this, "when connection", "has an error");
    this.appendStatementInput("code").setCheck(null);
    this.setTooltip(
      "Runs when something goes wrong, like the server being unreachable. Without this block, errors are printed to the console.",
    );
  },
};

javascriptGenerator.forBlock["ws_client_onError"] = function (block, generator) {
  const code = generator.statementToCode(block, "code");
  return `wsOnConnection(${nameOf(block)}, "error", async (wsError) => {\n${code}});\n`;
};

// ---------------------------------------------------------------------
// What was received
// ---------------------------------------------------------------------

Blockly.Blocks["ws_client_message"] = {
  init: function () {
    this.appendDummyInput().appendField("received message");
    this.setOutput(true, "String");
    this.setColour(colour);
    this.setTooltip("The message the server sent, as text");
  },
};

javascriptGenerator.forBlock["ws_client_message"] = function () {
  return ["wsMessage", Order.ATOMIC];
};

Blockly.Blocks["ws_client_messageJson"] = {
  init: function () {
    this.appendDummyInput().appendField("received message as object (JSON)");
    this.setOutput(true, "object");
    this.setColour(colour);
    this.setTooltip(
      "The message the server sent, read as JSON. Use the Objects blocks to get keys from it. Empty if the message isn't JSON.",
    );
  },
};

javascriptGenerator.forBlock["ws_client_messageJson"] = function () {
  return ["wsParseJson(wsMessage)", Order.FUNCTION_CALL];
};

Blockly.Blocks["ws_client_eventData"] = {
  init: function () {
    this.appendDummyInput().appendField("event data");
    this.setOutput(true, null);
    this.setColour(colour);
    this.setTooltip(
      'The "data" part of the event the server sent. It can be text, a number, an object or a list.',
    );
  },
};

javascriptGenerator.forBlock["ws_client_eventData"] = function () {
  return ["wsEventData", Order.ATOMIC];
};

Blockly.Blocks["ws_client_closeInfo"] = {
  init: function () {
    this.appendDummyInput().appendField(
      new Blockly.FieldDropdown([
        ["close code", "wsCloseCode"],
        ["close reason", "wsCloseReason"],
      ]),
      "info",
    );
    this.setOutput(true, null);
    this.setColour(colour);
    this.setTooltip(
      "Why the connection closed. Code 1000 is a normal close, 1006 means it dropped without a goodbye.",
    );
  },
};

javascriptGenerator.forBlock["ws_client_closeInfo"] = function (block) {
  return [block.getFieldValue("info"), Order.ATOMIC];
};

Blockly.Blocks["ws_client_errorMessage"] = {
  init: function () {
    this.appendDummyInput().appendField("error message");
    this.setOutput(true, "String");
    this.setColour(colour);
    this.setTooltip("What went wrong, as text");
  },
};

javascriptGenerator.forBlock["ws_client_errorMessage"] = function () {
  return ["(wsError?.message ?? String(wsError))", Order.ATOMIC];
};

// ---------------------------------------------------------------------
// Where each block is allowed
// ---------------------------------------------------------------------

createRestrictions(
  ["ws_client_message", "ws_client_messageJson"],
  [
    {
      type: "hasParent",
      blockTypes: ["ws_client_onMessage", "ws_client_onEvent"],
      message:
        'This block must be inside a "when connection … receives a message" or "receives event" block.',
    },
  ],
);

createRestrictions(
  ["ws_client_eventData"],
  [
    {
      type: "hasParent",
      blockTypes: ["ws_client_onEvent"],
      message: 'This block must be inside a "when connection … receives event" block.',
    },
  ],
);

createRestrictions(
  ["ws_client_closeInfo"],
  [
    {
      type: "hasParent",
      blockTypes: ["ws_client_onClose"],
      message: 'This block must be inside a "when connection … closes" block.',
    },
  ],
);

createRestrictions(
  ["ws_client_errorMessage"],
  [
    {
      type: "hasParent",
      blockTypes: ["ws_client_onError"],
      message: 'This block must be inside a "when connection … has an error" block.',
    },
  ],
);
