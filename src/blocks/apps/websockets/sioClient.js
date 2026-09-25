import * as Blockly from "blockly";
import { Order, javascriptGenerator } from "blockly/javascript";
import { createRestrictions } from "../../lib/restrictions";
import { colours, nameField, nameOf, valueOr } from "./shared.js";

/* =====================================================================
   Socket.IO — frontend: the bot connects to somebody else's server
   ---------------------------------------------------------------------
   Socket.IO speaks in named events rather than raw messages, reconnects
   by itself, and lets either side "reply" to an event (an acknowledgement
   in Socket.IO's words). A Socket.IO server only accepts Socket.IO
   clients, which is why these blocks exist alongside the plain
   WebSocket ones.
   ===================================================================== */

const colour = colours.sioClient;

function statement(block) {
  block.setPreviousStatement(true, "default");
  block.setNextStatement(true, "default");
  block.setColour(colour);
}

function hat(block, text, afterName = "") {
  const input = block
    .appendDummyInput()
    .appendField(text)
    .appendField(nameField(), "NAME");
  if (afterName) input.appendField(afterName);
  block.appendStatementInput("code").setCheck(null);
  block.setColour(colour);
  block.setPreviousStatement(false);
  block.setNextStatement(false);
}

function value(block, output) {
  block.setOutput(true, output);
  block.setColour(colour);
}

// ---------------------------------------------------------------------
// Connecting
// ---------------------------------------------------------------------

Blockly.Blocks["sio_client_connect"] = {
  init: function () {
    this.setInputsInline(false);
    this.appendDummyInput()
      .appendField("connect to Socket.IO server as")
      .appendField(nameField(), "NAME");
    this.appendValueInput("url").setCheck("String").appendField("URL:");
    this.appendDummyInput()
      .appendField("reconnect automatically if it drops")
      .appendField(new Blockly.FieldCheckbox("TRUE"), "reconnect");
    statement(this);
    this.setTooltip(
      "Connects to a Socket.IO server. The URL usually starts with https:// or http:// — add a path like /chat to the end to join that namespace. The name lets other blocks use this connection.",
    );
  },
};

javascriptGenerator.forBlock["sio_client_connect"] = function (block, generator) {
  const url = valueOr(generator, block, "url");
  const reconnect = block.getFieldValue("reconnect") === "TRUE";
  return `sioConnect(${nameOf(block)}, ${url}, { reconnection: ${reconnect} });\n`;
};

Blockly.Blocks["sio_client_connectAdvanced"] = {
  init: function () {
    this.setInputsInline(false);
    this.appendDummyInput()
      .appendField("connect to Socket.IO server as")
      .appendField(nameField(), "NAME");
    this.appendValueInput("url").setCheck("String").appendField("URL:");
    this.appendValueInput("auth").appendField("login details / auth (object):");
    this.appendValueInput("query").appendField("query parameters (object):");
    this.appendValueInput("headers").appendField("headers (object):");
    this.appendValueInput("path")
      .setCheck("String")
      .appendField("server path (usually /socket.io):");
    this.appendDummyInput()
      .appendField("WebSocket only (skip long-polling)")
      .appendField(new Blockly.FieldCheckbox("FALSE"), "websocketOnly");
    this.appendDummyInput()
      .appendField("reconnect automatically if it drops")
      .appendField(new Blockly.FieldCheckbox("TRUE"), "reconnect");
    statement(this);
    this.setTooltip(
      "Connects to a Socket.IO server with extra settings. Leave anything you don't need empty. Login details are what a DisFuse Socket.IO server reads with \"login detail … of this client\".",
    );
  },
};

javascriptGenerator.forBlock["sio_client_connectAdvanced"] = function (block, generator) {
  const url = valueOr(generator, block, "url");
  const auth = valueOr(generator, block, "auth", "undefined");
  const query = valueOr(generator, block, "query", "undefined");
  const headers = valueOr(generator, block, "headers", "undefined");
  const path = valueOr(generator, block, "path", "undefined");
  const websocketOnly = block.getFieldValue("websocketOnly") === "TRUE";
  const reconnect = block.getFieldValue("reconnect") === "TRUE";
  return `sioConnect(${nameOf(block)}, ${url}, {
  reconnection: ${reconnect},
  auth: ${auth},
  query: ${query},
  extraHeaders: ${headers},
  path: ${path} || undefined,
  transports: ${websocketOnly ? '["websocket"]' : "undefined"},
});\n`;
};

Blockly.Blocks["sio_client_waitConnected"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("wait until")
      .appendField(nameField(), "NAME")
      .appendField("is connected");
    this.appendValueInput("seconds")
      .setCheck("Number")
      .appendField("give up after (seconds):");
    this.setInputsInline(true);
    statement(this);
    this.setTooltip("Pauses until the connection is ready, or until the time runs out");
  },
};

javascriptGenerator.forBlock["sio_client_waitConnected"] = function (block, generator) {
  const seconds = valueOr(generator, block, "seconds", "10");
  return `await sioWaitConnected(${nameOf(block)}, ${seconds});\n`;
};

Blockly.Blocks["sio_client_disconnect"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("disconnect")
      .appendField(nameField(), "NAME");
    statement(this);
    this.setTooltip("Closes the connection. It won't reconnect by itself after this.");
  },
};

javascriptGenerator.forBlock["sio_client_disconnect"] = function (block) {
  return `sioClients[${nameOf(block)}]?.socket?.disconnect();\n`;
};

Blockly.Blocks["sio_client_reconnect"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("reconnect")
      .appendField(nameField(), "NAME");
    statement(this);
    this.setTooltip("Connects again after the connection was closed with \"disconnect\"");
  },
};

javascriptGenerator.forBlock["sio_client_reconnect"] = function (block) {
  return `sioClientSocket(${nameOf(block)})?.connect();\n`;
};

// ---------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------

Blockly.Blocks["sio_client_isConnected"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("Socket.IO connection")
      .appendField(nameField(), "NAME")
      .appendField("is connected?");
    value(this, "Boolean");
    this.setTooltip("True if the connection is open right now");
  },
};

javascriptGenerator.forBlock["sio_client_isConnected"] = function (block) {
  return [`Boolean(sioClients[${nameOf(block)}]?.socket?.connected)`, Order.FUNCTION_CALL];
};

Blockly.Blocks["sio_client_id"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("my ID on connection")
      .appendField(nameField(), "NAME");
    value(this, "String");
    this.setTooltip(
      "The ID the server gave this connection. It changes every time it reconnects.",
    );
  },
};

javascriptGenerator.forBlock["sio_client_id"] = function (block) {
  return [`(sioClients[${nameOf(block)}]?.socket?.id ?? null)`, Order.ATOMIC];
};

// ---------------------------------------------------------------------
// Sending
// ---------------------------------------------------------------------

Blockly.Blocks["sio_client_emit"] = {
  init: function () {
    this.appendValueInput("event").setCheck("String").appendField("send event");
    this.appendValueInput("data").appendField("with data");
    this.appendDummyInput()
      .appendField("through")
      .appendField(nameField(), "NAME");
    this.setInputsInline(true);
    statement(this);
    this.setTooltip(
      "Sends an event to the server. The data can be text, a number, an object or a list. If it isn't connected yet, it's sent as soon as it connects.",
    );
  },
};

javascriptGenerator.forBlock["sio_client_emit"] = function (block, generator) {
  const event = valueOr(generator, block, "event");
  const data = valueOr(generator, block, "data", "null");
  return `sioClientSocket(${nameOf(block)})?.emit(String(${event}), ${data});\n`;
};

Blockly.Blocks["sio_client_emitWithReply"] = {
  init: function () {
    this.appendValueInput("event").setCheck("String").appendField("send event");
    this.appendValueInput("data").appendField("with data");
    this.appendDummyInput()
      .appendField("through")
      .appendField(nameField(), "NAME");
    this.appendValueInput("seconds")
      .setCheck("Number")
      .appendField("and wait for a reply for (seconds):");
    this.appendStatementInput("then").setCheck("default").appendField("then");
    this.setInputsInline(false);
    statement(this);
    this.setTooltip(
      'Sends an event and waits for the server to answer it. Use "reply from the server" inside — it\'s empty if no answer came in time.',
    );
  },
};

javascriptGenerator.forBlock["sio_client_emitWithReply"] = function (block, generator) {
  const event = valueOr(generator, block, "event");
  const data = valueOr(generator, block, "data", "null");
  const seconds = valueOr(generator, block, "seconds", "5");
  const then = generator.statementToCode(block, "then");
  return `await sioEmitWithAck(sioClientSocket(${nameOf(block)}), ${event}, ${data}, ${seconds}).then(async (sioReply) => {\n${then}});\n`;
};

Blockly.Blocks["sio_client_replyValue"] = {
  init: function () {
    this.appendDummyInput().appendField("reply from the server");
    value(this, null);
    this.setTooltip("What the server answered with. Empty if it didn't answer in time.");
  },
};

javascriptGenerator.forBlock["sio_client_replyValue"] = () => ["sioReply", Order.ATOMIC];

Blockly.Blocks["sio_client_reply"] = {
  init: function () {
    this.appendValueInput("data").appendField("reply to this event with");
    statement(this);
    this.setTooltip(
      "Answers the event the server sent, if the server is waiting for an answer. Only the first reply is sent.",
    );
  },
};

javascriptGenerator.forBlock["sio_client_reply"] = function (block, generator) {
  const data = valueOr(generator, block, "data", "null");
  return `sioAck?.(${data});\nsioAck = null;\n`;
};

// ---------------------------------------------------------------------
// When things happen
// ---------------------------------------------------------------------

Blockly.Blocks["sio_client_onConnect"] = {
  init: function () {
    hat(this, "when Socket.IO connection", "connects");
    this.setTooltip("Runs every time the connection is made, including after reconnecting");
  },
};

javascriptGenerator.forBlock["sio_client_onConnect"] = function (block, generator) {
  const code = generator.statementToCode(block, "code");
  return `sioOnClient(${nameOf(block)}, "connect", async () => {\n${code}});\n`;
};

Blockly.Blocks["sio_client_onEvent"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("when")
      .appendField(nameField(), "NAME")
      .appendField("receives event")
      .appendField(new Blockly.FieldTextInput("message"), "EVENT");
    this.appendStatementInput("code").setCheck(null);
    this.setColour(colour);
    this.setPreviousStatement(false);
    this.setNextStatement(false);
    this.setTooltip(
      'Runs when the server sends an event with this name. Use "event data" inside it.',
    );
  },
};

javascriptGenerator.forBlock["sio_client_onEvent"] = function (block, generator) {
  const event = JSON.stringify(block.getFieldValue("EVENT"));
  const code = generator.statementToCode(block, "code");
  return `sioOnClient(${nameOf(block)}, ${event}, async (...sioReceived) => {
  let { args: sioArgs, ack: sioAck } = sioSplitArgs(sioReceived);
  const sioData = sioArgs[0];
${code}});\n`;
};

Blockly.Blocks["sio_client_onAny"] = {
  init: function () {
    hat(this, "when", "receives any event");
    this.setTooltip(
      'Runs for every event the server sends, whatever its name. Use "event name" to see which one it was.',
    );
  },
};

javascriptGenerator.forBlock["sio_client_onAny"] = function (block, generator) {
  const code = generator.statementToCode(block, "code");
  return `sioOnAnyClient(${nameOf(block)}, async (sioEventName, ...sioReceived) => {
  let { args: sioArgs, ack: sioAck } = sioSplitArgs(sioReceived);
  const sioData = sioArgs[0];
${code}});\n`;
};

Blockly.Blocks["sio_client_onDisconnect"] = {
  init: function () {
    hat(this, "when Socket.IO connection", "disconnects");
    this.setTooltip("Runs when the connection is lost or closed");
  },
};

javascriptGenerator.forBlock["sio_client_onDisconnect"] = function (block, generator) {
  const code = generator.statementToCode(block, "code");
  return `sioOnClient(${nameOf(block)}, "disconnect", async (sioReason) => {\n${code}});\n`;
};

Blockly.Blocks["sio_client_onError"] = {
  init: function () {
    hat(this, "when Socket.IO connection", "fails to connect");
    this.setTooltip(
      "Runs when connecting fails, like when the server is down or rejects the login. Without this block, errors are printed to the console.",
    );
  },
};

javascriptGenerator.forBlock["sio_client_onError"] = function (block, generator) {
  const code = generator.statementToCode(block, "code");
  return `sioOnClient(${nameOf(block)}, "connect_error", async (sioError) => {\n${code}});\n`;
};

// ---------------------------------------------------------------------
// What was received
// ---------------------------------------------------------------------

Blockly.Blocks["sio_client_eventData"] = {
  init: function () {
    this.appendDummyInput().appendField("event data");
    value(this, null);
    this.setTooltip(
      "The data the server sent with the event. It can be text, a number, an object or a list.",
    );
  },
};

javascriptGenerator.forBlock["sio_client_eventData"] = () => ["sioData", Order.ATOMIC];

Blockly.Blocks["sio_client_eventArgs"] = {
  init: function () {
    this.appendDummyInput().appendField("list of everything sent with the event");
    value(this, "Array");
    this.setTooltip(
      'Some servers send more than one value with an event. This is all of them, as a list. "event data" is the first one.',
    );
  },
};

javascriptGenerator.forBlock["sio_client_eventArgs"] = () => ["sioArgs", Order.ATOMIC];

Blockly.Blocks["sio_client_eventName"] = {
  init: function () {
    this.appendDummyInput().appendField("event name");
    value(this, "String");
    this.setTooltip("The name of the event the server sent");
  },
};

javascriptGenerator.forBlock["sio_client_eventName"] = () => ["sioEventName", Order.ATOMIC];

Blockly.Blocks["sio_client_disconnectReason"] = {
  init: function () {
    this.appendDummyInput().appendField("disconnect reason");
    value(this, "String");
    this.setTooltip(
      'Why it disconnected, like "io server disconnect" (the server kicked it) or "transport close" (the connection dropped)',
    );
  },
};

javascriptGenerator.forBlock["sio_client_disconnectReason"] = () => ["sioReason", Order.ATOMIC];

Blockly.Blocks["sio_client_errorMessage"] = {
  init: function () {
    this.appendDummyInput().appendField("connection error message");
    value(this, "String");
    this.setTooltip("Why it couldn't connect, as text");
  },
};

javascriptGenerator.forBlock["sio_client_errorMessage"] = () => [
  "(sioError?.message ?? String(sioError))",
  Order.ATOMIC,
];

// ---------------------------------------------------------------------
// Where each block is allowed
// ---------------------------------------------------------------------

const eventHats = ["sio_client_onEvent", "sio_client_onAny"];

createRestrictions(
  ["sio_client_eventData", "sio_client_eventArgs", "sio_client_reply"],
  [
    {
      type: "hasParent",
      blockTypes: eventHats,
      message: 'This block must be inside a "when … receives event" block.',
    },
  ],
);

createRestrictions(
  ["sio_client_eventName"],
  [
    {
      type: "hasParent",
      blockTypes: ["sio_client_onAny"],
      message: 'This block must be inside a "when … receives any event" block.',
    },
  ],
);

createRestrictions(
  ["sio_client_replyValue"],
  [
    {
      type: "hasParent",
      blockTypes: ["sio_client_emitWithReply"],
      message: 'This block must be inside a "send event … and wait for a reply" block.',
    },
  ],
);

createRestrictions(
  ["sio_client_disconnectReason"],
  [
    {
      type: "hasParent",
      blockTypes: ["sio_client_onDisconnect"],
      message: 'This block must be inside a "when Socket.IO connection disconnects" block.',
    },
  ],
);

createRestrictions(
  ["sio_client_errorMessage"],
  [
    {
      type: "hasParent",
      blockTypes: ["sio_client_onError"],
      message: 'This block must be inside a "when Socket.IO connection fails to connect" block.',
    },
  ],
);
