import * as Blockly from "blockly";
import { Order, javascriptGenerator } from "blockly/javascript";
import { createRestrictions } from "../../lib/restrictions";
import { closeCodeTooltip, colours, nameField, nameOf, valueOr } from "./shared.js";

/* =====================================================================
   WebSocket (ws) — backend: the bot hosts a server others connect to
   ---------------------------------------------------------------------
   Inside a "when…" block, "this client" is the one that connected, sent
   the message or left. "for each connected client" also sets it, so the
   same "send to this client" block works in a loop.

   Every client gets an ID, its own data (like a login), and can be put
   in groups — the plain-WebSocket version of Socket.IO's rooms.
   ===================================================================== */

const colour = colours.wsServer;

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

const serverHandler = (type, params) =>
  function (block, generator) {
    const code = generator.statementToCode(block, "code");
    return `wsOnServer(${nameOf(block)}, "${type}", async (${params}) => {\n${code}});\n`;
  };

// ---------------------------------------------------------------------
// Starting and stopping
// ---------------------------------------------------------------------

Blockly.Blocks["ws_server_start"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("start WebSocket server")
      .appendField(nameField(), "NAME");
    this.appendValueInput("port").setCheck("Number").appendField("on port:");
    this.setInputsInline(true);
    statement(this);
    this.setTooltip(
      "Starts a WebSocket server that apps and websites can connect to with ws://your-host:port. Most hosts tell you which port you're allowed to use. Put this in \"when the bot starts\".",
    );
  },
};

javascriptGenerator.forBlock["ws_server_start"] = function (block, generator) {
  const port = valueOr(generator, block, "port", "8080");
  return `wsStartServer(${nameOf(block)}, ${port});\n`;
};

Blockly.Blocks["ws_server_stop"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("stop WebSocket server")
      .appendField(nameField(), "NAME");
    statement(this);
    this.setTooltip("Disconnects every client and stops the server");
  },
};

javascriptGenerator.forBlock["ws_server_stop"] = function (block) {
  return `wsStopServer(${nameOf(block)});\n`;
};

Blockly.Blocks["ws_server_isRunning"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("WebSocket server")
      .appendField(nameField(), "NAME")
      .appendField("is running?");
    value(this, "Boolean");
    this.setTooltip("True if the server has been started and not stopped");
  },
};

javascriptGenerator.forBlock["ws_server_isRunning"] = function (block) {
  return [`Boolean(wsServers[${nameOf(block)}]?.server)`, Order.FUNCTION_CALL];
};

// ---------------------------------------------------------------------
// When things happen
// ---------------------------------------------------------------------

Blockly.Blocks["ws_server_onStart"] = {
  init: function () {
    hat(this, "when WebSocket server", "starts");
    this.setTooltip("Runs once the server is up and ready for connections");
  },
};
javascriptGenerator.forBlock["ws_server_onStart"] = serverHandler("listening", "");

Blockly.Blocks["ws_server_onVerify"] = {
  init: function () {
    hat(this, "when a client tries to connect to", "");
    this.setTooltip(
      'Runs before a client is let in. Check things like a password in the URL (with "query parameter") and use "reject this connection" to turn them away. Anything saved to the client\'s data here is kept once they connect.',
    );
  },
};
javascriptGenerator.forBlock["ws_server_onVerify"] = serverHandler("verify", "wsClient");

Blockly.Blocks["ws_server_onConnect"] = {
  init: function () {
    hat(this, "when a client connects to", "");
    this.setTooltip("Runs every time a new client connects to the server");
  },
};
javascriptGenerator.forBlock["ws_server_onConnect"] = serverHandler("connection", "wsClient");

Blockly.Blocks["ws_server_onMessage"] = {
  init: function () {
    hat(this, "when a client sends a message to", "");
    this.setTooltip("Runs every time any client sends the server a message");
  },
};
javascriptGenerator.forBlock["ws_server_onMessage"] = serverHandler(
  "message",
  "wsClient, wsClientMessage",
);

Blockly.Blocks["ws_server_onEvent"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("when a client sends event")
      .appendField(new Blockly.FieldTextInput("chat"), "EVENT")
      .appendField("to")
      .appendField(nameField(), "NAME");
    this.appendStatementInput("code").setCheck(null);
    this.setColour(colour);
    this.setPreviousStatement(false);
    this.setNextStatement(false);
    this.setTooltip(
      'Runs when a client sends JSON like { "event": "chat", "data": ... } with this event name. Use "event data" inside it.',
    );
  },
};

javascriptGenerator.forBlock["ws_server_onEvent"] = function (block, generator) {
  const event = JSON.stringify(block.getFieldValue("EVENT"));
  const code = generator.statementToCode(block, "code");
  return `wsOnServer(${nameOf(block)}, "message", async (wsClient, wsClientMessage) => {
  const wsReceivedEvent = wsParseJson(wsClientMessage);
  if (wsReceivedEvent?.event !== ${event}) return;
  const wsClientEventData = wsReceivedEvent.data;
${code}});\n`;
};

Blockly.Blocks["ws_server_onDisconnect"] = {
  init: function () {
    hat(this, "when a client disconnects from", "");
    this.setTooltip(
      "Runs when a client leaves, for any reason. You can still read its ID and data, but can't send to it anymore.",
    );
  },
};
javascriptGenerator.forBlock["ws_server_onDisconnect"] = serverHandler(
  "close",
  "wsClient, wsCloseCode, wsCloseReason",
);

Blockly.Blocks["ws_server_onError"] = {
  init: function () {
    hat(this, "when WebSocket server", "has an error");
    this.setTooltip(
      "Runs when the server itself has a problem, like the port already being in use. Without this block, errors are printed to the console.",
    );
  },
};
javascriptGenerator.forBlock["ws_server_onError"] = serverHandler("error", "wsError");

// ---------------------------------------------------------------------
// What was received
// ---------------------------------------------------------------------

Blockly.Blocks["ws_server_message"] = {
  init: function () {
    this.appendDummyInput().appendField("message from client");
    value(this, "String");
    this.setTooltip("The message the client sent, as text");
  },
};
javascriptGenerator.forBlock["ws_server_message"] = () => ["wsClientMessage", Order.ATOMIC];

Blockly.Blocks["ws_server_messageJson"] = {
  init: function () {
    this.appendDummyInput().appendField("message from client as object (JSON)");
    value(this, "object");
    this.setTooltip(
      "The message the client sent, read as JSON. Use the Objects blocks to get keys from it. Empty if the message isn't JSON.",
    );
  },
};
javascriptGenerator.forBlock["ws_server_messageJson"] = () => [
  "wsParseJson(wsClientMessage)",
  Order.FUNCTION_CALL,
];

Blockly.Blocks["ws_server_eventData"] = {
  init: function () {
    this.appendDummyInput().appendField("event data from client");
    value(this, null);
    this.setTooltip(
      'The "data" part of the event the client sent. It can be text, a number, an object or a list.',
    );
  },
};
javascriptGenerator.forBlock["ws_server_eventData"] = () => ["wsClientEventData", Order.ATOMIC];

Blockly.Blocks["ws_server_closeInfo"] = {
  init: function () {
    this.appendDummyInput().appendField(
      new Blockly.FieldDropdown([
        ["close code", "wsCloseCode"],
        ["close reason", "wsCloseReason"],
      ]),
      "info",
    );
    value(this, null);
    this.setTooltip(
      "Why the client left. Code 1000 or 1001 is a normal close, 1006 means it dropped without a goodbye.",
    );
  },
};
javascriptGenerator.forBlock["ws_server_closeInfo"] = (block) => [
  block.getFieldValue("info"),
  Order.ATOMIC,
];

Blockly.Blocks["ws_server_errorMessage"] = {
  init: function () {
    this.appendDummyInput().appendField("server error message");
    value(this, "String");
    this.setTooltip("What went wrong, as text");
  },
};
javascriptGenerator.forBlock["ws_server_errorMessage"] = () => [
  "(wsError?.message ?? String(wsError))",
  Order.ATOMIC,
];

// ---------------------------------------------------------------------
// About this client
// ---------------------------------------------------------------------

Blockly.Blocks["ws_server_clientInfo"] = {
  init: function () {
    this.appendDummyInput()
      .appendField(
        new Blockly.FieldDropdown([
          ["ID", "id"],
          ["IP address", "ip"],
          ["website (origin)", "origin"],
          ["path it connected to", "path"],
          ["full URL it connected to", "url"],
          ["list of groups", "groups"],
        ]),
        "info",
      )
      .appendField("of this client");
    value(this, null);
    this.setTooltip(
      'Information about this client. The ID is unique and can be saved and used later with "send to client with ID".',
    );
  },
};

javascriptGenerator.forBlock["ws_server_clientInfo"] = function (block) {
  return [`wsClientInfo(wsClient, "${block.getFieldValue("info")}")`, Order.FUNCTION_CALL];
};

Blockly.Blocks["ws_server_clientQuery"] = {
  init: function () {
    this.appendValueInput("key")
      .setCheck("String")
      .appendField("query parameter");
    this.appendDummyInput().appendField("of this client's URL");
    this.setInputsInline(true);
    value(this, "String");
    this.setTooltip(
      'A value from the end of the URL the client connected with. For ws://host:8080/?token=abc, the parameter "token" is "abc".',
    );
  },
};

javascriptGenerator.forBlock["ws_server_clientQuery"] = function (block, generator) {
  const key = valueOr(generator, block, "key");
  return [`wsClientQuery(wsClient, ${key})`, Order.FUNCTION_CALL];
};

Blockly.Blocks["ws_server_clientHeader"] = {
  init: function () {
    this.appendValueInput("key").setCheck("String").appendField("header");
    this.appendDummyInput().appendField("this client connected with");
    this.setInputsInline(true);
    value(this, "String");
    this.setTooltip(
      'A header the client sent when it connected, like "user-agent" or "authorization"',
    );
  },
};

javascriptGenerator.forBlock["ws_server_clientHeader"] = function (block, generator) {
  const key = valueOr(generator, block, "key");
  return [`wsClientHeader(wsClient, ${key})`, Order.FUNCTION_CALL];
};

Blockly.Blocks["ws_server_clientIsConnected"] = {
  init: function () {
    this.appendDummyInput().appendField("this client is still connected?");
    value(this, "Boolean");
    this.setTooltip("True if this client hasn't disconnected yet");
  },
};

javascriptGenerator.forBlock["ws_server_clientIsConnected"] = () => [
  "(wsClient?.readyState === WebSocket.OPEN)",
  Order.ATOMIC,
];

// ---------------------------------------------------------------------
// Client data
// ---------------------------------------------------------------------

Blockly.Blocks["ws_server_setData"] = {
  init: function () {
    this.appendValueInput("key").setCheck("String").appendField("set");
    this.appendValueInput("value").appendField("of this client's data to");
    this.setInputsInline(true);
    statement(this);
    this.setTooltip(
      "Remembers something about this client for as long as it's connected, like its username after it logs in",
    );
  },
};

javascriptGenerator.forBlock["ws_server_setData"] = function (block, generator) {
  const key = valueOr(generator, block, "key");
  const val = valueOr(generator, block, "value", "null");
  return `if (wsClient?.disfuse) wsClient.disfuse.data[${key}] = ${val};\n`;
};

Blockly.Blocks["ws_server_getData"] = {
  init: function () {
    this.appendValueInput("key").setCheck("String").appendField("get");
    this.appendDummyInput().appendField("of this client's data");
    this.setInputsInline(true);
    value(this, null);
    this.setTooltip("Something you saved about this client with \"set … of this client's data\"");
  },
};

javascriptGenerator.forBlock["ws_server_getData"] = function (block, generator) {
  const key = valueOr(generator, block, "key");
  return [`(wsClient?.disfuse?.data[${key}] ?? null)`, Order.ATOMIC];
};

Blockly.Blocks["ws_server_getDataById"] = {
  init: function () {
    this.appendValueInput("key").setCheck("String").appendField("get");
    this.appendValueInput("id")
      .setCheck("String")
      .appendField("of the data of client with ID");
    this.appendDummyInput()
      .appendField("on server")
      .appendField(nameField(), "NAME");
    this.setInputsInline(true);
    value(this, null);
    this.setTooltip("Something you saved about a client, found by its ID. Works anywhere.");
  },
};

javascriptGenerator.forBlock["ws_server_getDataById"] = function (block, generator) {
  const key = valueOr(generator, block, "key");
  const id = valueOr(generator, block, "id");
  return [
    `(wsServers[${nameOf(block)}]?.clients.get(String(${id}))?.disfuse.data[${key}] ?? null)`,
    Order.ATOMIC,
  ];
};

// ---------------------------------------------------------------------
// Sending
// ---------------------------------------------------------------------

Blockly.Blocks["ws_server_sendClient"] = {
  init: function () {
    this.appendValueInput("message").appendField("send message");
    this.appendDummyInput().appendField("to this client");
    this.setInputsInline(true);
    statement(this);
    this.setTooltip(
      "Sends a message to this client only. Text is sent as it is; objects and lists are sent as JSON.",
    );
  },
};

javascriptGenerator.forBlock["ws_server_sendClient"] = function (block, generator) {
  const message = valueOr(generator, block, "message");
  return `wsSendTo(wsClient, ${message});\n`;
};

Blockly.Blocks["ws_server_sendEventClient"] = {
  init: function () {
    this.appendValueInput("event").setCheck("String").appendField("send event");
    this.appendValueInput("data").appendField("with data");
    this.appendDummyInput().appendField("to this client");
    this.setInputsInline(true);
    statement(this);
    this.setTooltip('Sends { "event": name, "data": data } as JSON to this client only');
  },
};

javascriptGenerator.forBlock["ws_server_sendEventClient"] = function (block, generator) {
  const event = valueOr(generator, block, "event");
  const data = valueOr(generator, block, "data", "null");
  return `wsSendTo(wsClient, wsEvent(${event}, ${data}));\n`;
};

Blockly.Blocks["ws_server_sendId"] = {
  init: function () {
    this.appendValueInput("message").appendField("send message");
    this.appendValueInput("id").setCheck("String").appendField("to client with ID");
    this.appendDummyInput()
      .appendField("on server")
      .appendField(nameField(), "NAME");
    this.setInputsInline(false);
    statement(this);
    this.setTooltip("Sends a message to one client, found by its ID. Works anywhere.");
  },
};

javascriptGenerator.forBlock["ws_server_sendId"] = function (block, generator) {
  const message = valueOr(generator, block, "message");
  const id = valueOr(generator, block, "id");
  return `wsSendToId(${nameOf(block)}, ${id}, ${message});\n`;
};

Blockly.Blocks["ws_server_sendEventId"] = {
  init: function () {
    this.appendValueInput("event").setCheck("String").appendField("send event");
    this.appendValueInput("data").appendField("with data");
    this.appendValueInput("id").setCheck("String").appendField("to client with ID");
    this.appendDummyInput()
      .appendField("on server")
      .appendField(nameField(), "NAME");
    this.setInputsInline(false);
    statement(this);
    this.setTooltip("Sends an event to one client, found by its ID. Works anywhere.");
  },
};

javascriptGenerator.forBlock["ws_server_sendEventId"] = function (block, generator) {
  const event = valueOr(generator, block, "event");
  const data = valueOr(generator, block, "data", "null");
  const id = valueOr(generator, block, "id");
  return `wsSendToId(${nameOf(block)}, ${id}, wsEvent(${event}, ${data}));\n`;
};

/* Outside a "when a client…" block there is no "this client" to skip,
   so it has to be looked up without throwing a ReferenceError. */
const exceptThisClient = ', (typeof wsClient === "undefined" ? null : wsClient)';

const audience = () =>
  new Blockly.FieldDropdown([
    ["all clients", "all"],
    ["all clients except this one", "others"],
  ]);

Blockly.Blocks["ws_server_broadcast"] = {
  init: function () {
    this.appendValueInput("message").appendField("send message");
    this.appendDummyInput()
      .appendField("to")
      .appendField(audience(), "WHO")
      .appendField("on server")
      .appendField(nameField(), "NAME");
    this.setInputsInline(false);
    statement(this);
    this.setTooltip(
      'Sends a message to everyone connected. "all clients except this one" only works inside a "when a client…" block.',
    );
  },
};

javascriptGenerator.forBlock["ws_server_broadcast"] = function (block, generator) {
  const message = valueOr(generator, block, "message");
  const except = block.getFieldValue("WHO") === "others" ? exceptThisClient : "";
  return `wsSendToMany(wsServerClients(${nameOf(block)}), ${message}${except});\n`;
};

Blockly.Blocks["ws_server_broadcastEvent"] = {
  init: function () {
    this.appendValueInput("event").setCheck("String").appendField("send event");
    this.appendValueInput("data").appendField("with data");
    this.appendDummyInput()
      .appendField("to")
      .appendField(audience(), "WHO")
      .appendField("on server")
      .appendField(nameField(), "NAME");
    this.setInputsInline(false);
    statement(this);
    this.setTooltip(
      'Sends an event to everyone connected. "all clients except this one" only works inside a "when a client…" block.',
    );
  },
};

javascriptGenerator.forBlock["ws_server_broadcastEvent"] = function (block, generator) {
  const event = valueOr(generator, block, "event");
  const data = valueOr(generator, block, "data", "null");
  const except = block.getFieldValue("WHO") === "others" ? exceptThisClient : "";
  return `wsSendToMany(wsServerClients(${nameOf(block)}), wsEvent(${event}, ${data})${except});\n`;
};

// ---------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------

Blockly.Blocks["ws_server_joinGroup"] = {
  init: function () {
    this.appendValueInput("group")
      .setCheck("String")
      .appendField(
        new Blockly.FieldDropdown([
          ["add this client to", "add"],
          ["remove this client from", "delete"],
        ]),
        "action",
      )
      .appendField("group");
    statement(this);
    this.setTooltip(
      "Groups are like chat rooms: put clients in one, then send a message to everyone in it at once. A client can be in many groups.",
    );
  },
};

javascriptGenerator.forBlock["ws_server_joinGroup"] = function (block, generator) {
  const group = valueOr(generator, block, "group");
  return `wsClient?.disfuse?.groups.${block.getFieldValue("action")}(String(${group}));\n`;
};

Blockly.Blocks["ws_server_inGroup"] = {
  init: function () {
    this.appendValueInput("group").setCheck("String").appendField("this client is in group");
    this.appendDummyInput().appendField("?");
    this.setInputsInline(true);
    value(this, "Boolean");
    this.setTooltip("True if this client has been added to the group");
  },
};

javascriptGenerator.forBlock["ws_server_inGroup"] = function (block, generator) {
  const group = valueOr(generator, block, "group");
  return [`Boolean(wsClient?.disfuse?.groups.has(String(${group})))`, Order.FUNCTION_CALL];
};

Blockly.Blocks["ws_server_sendGroup"] = {
  init: function () {
    this.appendValueInput("message").appendField("send message");
    this.appendValueInput("group").setCheck("String").appendField("to everyone in group");
    this.appendDummyInput()
      .appendField("on server")
      .appendField(nameField(), "NAME")
      .appendField("except this client")
      .appendField(new Blockly.FieldCheckbox("FALSE"), "except");
    this.setInputsInline(false);
    statement(this);
    this.setTooltip(
      'Sends a message to every client in the group. Tick "except this client" to skip the one that sent it (only inside a "when a client…" block).',
    );
  },
};

javascriptGenerator.forBlock["ws_server_sendGroup"] = function (block, generator) {
  const message = valueOr(generator, block, "message");
  const group = valueOr(generator, block, "group");
  const except = block.getFieldValue("except") === "TRUE" ? exceptThisClient : "";
  return `wsSendToMany(wsGroupClients(${nameOf(block)}, ${group}), ${message}${except});\n`;
};

Blockly.Blocks["ws_server_sendEventGroup"] = {
  init: function () {
    this.appendValueInput("event").setCheck("String").appendField("send event");
    this.appendValueInput("data").appendField("with data");
    this.appendValueInput("group").setCheck("String").appendField("to everyone in group");
    this.appendDummyInput()
      .appendField("on server")
      .appendField(nameField(), "NAME")
      .appendField("except this client")
      .appendField(new Blockly.FieldCheckbox("FALSE"), "except");
    this.setInputsInline(false);
    statement(this);
    this.setTooltip("Sends an event to every client in the group");
  },
};

javascriptGenerator.forBlock["ws_server_sendEventGroup"] = function (block, generator) {
  const event = valueOr(generator, block, "event");
  const data = valueOr(generator, block, "data", "null");
  const group = valueOr(generator, block, "group");
  const except = block.getFieldValue("except") === "TRUE" ? exceptThisClient : "";
  return `wsSendToMany(wsGroupClients(${nameOf(block)}, ${group}), wsEvent(${event}, ${data})${except});\n`;
};

Blockly.Blocks["ws_server_groupInfo"] = {
  init: function () {
    this.appendValueInput("group")
      .setCheck("String")
      .appendField(
        new Blockly.FieldDropdown([
          ["number of clients", "count"],
          ["list of client IDs", "ids"],
        ]),
        "info",
      )
      .appendField("in group");
    this.appendDummyInput()
      .appendField("on server")
      .appendField(nameField(), "NAME");
    this.setInputsInline(true);
    value(this, null);
    this.setTooltip("Who is in a group right now");
  },
};

javascriptGenerator.forBlock["ws_server_groupInfo"] = function (block, generator) {
  const group = valueOr(generator, block, "group");
  const clients = `wsGroupClients(${nameOf(block)}, ${group})`;
  return block.getFieldValue("info") === "count"
    ? [`${clients}.length`, Order.MEMBER]
    : [`${clients}.map((socket) => socket.disfuse.id)`, Order.FUNCTION_CALL];
};

// ---------------------------------------------------------------------
// All clients
// ---------------------------------------------------------------------

Blockly.Blocks["ws_server_clientsInfo"] = {
  init: function () {
    this.appendDummyInput()
      .appendField(
        new Blockly.FieldDropdown([
          ["number of connected clients", "count"],
          ["list of connected client IDs", "ids"],
        ]),
        "info",
      )
      .appendField("on server")
      .appendField(nameField(), "NAME");
    value(this, null);
    this.setTooltip("Everyone connected to the server right now");
  },
};

javascriptGenerator.forBlock["ws_server_clientsInfo"] = function (block) {
  const clients = `wsServerClients(${nameOf(block)})`;
  return block.getFieldValue("info") === "count"
    ? [`${clients}.length`, Order.MEMBER]
    : [`${clients}.map((socket) => socket.disfuse.id)`, Order.FUNCTION_CALL];
};

Blockly.Blocks["ws_server_idConnected"] = {
  init: function () {
    this.appendValueInput("id").setCheck("String").appendField("client with ID");
    this.appendDummyInput()
      .appendField("is connected to server")
      .appendField(nameField(), "NAME")
      .appendField("?");
    this.setInputsInline(true);
    value(this, "Boolean");
    this.setTooltip("True if a client with this ID is connected right now");
  },
};

javascriptGenerator.forBlock["ws_server_idConnected"] = function (block, generator) {
  const id = valueOr(generator, block, "id");
  return [
    `Boolean(wsServers[${nameOf(block)}]?.clients.has(String(${id})))`,
    Order.FUNCTION_CALL,
  ];
};

Blockly.Blocks["ws_server_forEachClient"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("for each client connected to")
      .appendField(nameField(), "NAME");
    this.appendStatementInput("code").setCheck("default").appendField("do");
    statement(this);
    this.setTooltip(
      'Runs the blocks inside once for every connected client. Inside, "this client" means the one the loop is on.',
    );
  },
};

javascriptGenerator.forBlock["ws_server_forEachClient"] = function (block, generator) {
  const code = generator.statementToCode(block, "code");
  return `for (const wsClient of wsServerClients(${nameOf(block)})) {\n${code}}\n`;
};

Blockly.Blocks["ws_server_forEachInGroup"] = {
  init: function () {
    this.appendValueInput("group")
      .setCheck("String")
      .appendField("for each client in group");
    this.appendDummyInput()
      .appendField("on server")
      .appendField(nameField(), "NAME");
    this.appendStatementInput("code").setCheck("default").appendField("do");
    this.setInputsInline(true);
    statement(this);
    this.setTooltip(
      'Runs the blocks inside once for every client in the group. Inside, "this client" means the one the loop is on.',
    );
  },
};

javascriptGenerator.forBlock["ws_server_forEachInGroup"] = function (block, generator) {
  const group = valueOr(generator, block, "group");
  const code = generator.statementToCode(block, "code");
  return `for (const wsClient of wsGroupClients(${nameOf(block)}, ${group})) {\n${code}}\n`;
};

// ---------------------------------------------------------------------
// Disconnecting
// ---------------------------------------------------------------------

Blockly.Blocks["ws_server_reject"] = {
  init: function () {
    this.appendValueInput("reason")
      .setCheck("String")
      .appendField("reject this connection with reason");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(false);
    this.setColour(colour);
    this.setTooltip(
      "Turns the client away before it connects, and stops the blocks after it. Only letters, numbers and punctuation are sent in the reason.",
    );
  },
};

javascriptGenerator.forBlock["ws_server_reject"] = function (block, generator) {
  const reason = valueOr(generator, block, "reason", '"Unauthorized"');
  return `wsClient.disfuse.rejected = String(${reason});\nreturn;\n`;
};

Blockly.Blocks["ws_server_kick"] = {
  init: function () {
    this.appendDummyInput().appendField("disconnect this client");
    this.appendValueInput("code").setCheck("Number").appendField("close code:");
    this.appendValueInput("reason").setCheck("String").appendField("reason:");
    statement(this);
    this.setTooltip(`Closes this client's connection. ${closeCodeTooltip}`);
  },
};

javascriptGenerator.forBlock["ws_server_kick"] = function (block, generator) {
  const code = valueOr(generator, block, "code", "1000");
  const reason = valueOr(generator, block, "reason");
  return `wsClient?.close?.(...wsCloseArgs(${code}, ${reason}));\n`;
};

Blockly.Blocks["ws_server_kickId"] = {
  init: function () {
    this.setInputsInline(false);
    this.appendValueInput("id").setCheck("String").appendField("disconnect client with ID");
    this.appendDummyInput()
      .appendField("on server")
      .appendField(nameField(), "NAME");
    this.appendValueInput("reason").setCheck("String").appendField("reason:");
    statement(this);
    this.setTooltip("Closes one client's connection, found by its ID. Works anywhere.");
  },
};

javascriptGenerator.forBlock["ws_server_kickId"] = function (block, generator) {
  const id = valueOr(generator, block, "id");
  const reason = valueOr(generator, block, "reason");
  return `wsServers[${nameOf(block)}]?.clients.get(String(${id}))?.close(...wsCloseArgs(1000, ${reason}));\n`;
};

// ---------------------------------------------------------------------
// Where each block is allowed
// ---------------------------------------------------------------------

const clientHats = [
  "ws_server_onConnect",
  "ws_server_onMessage",
  "ws_server_onEvent",
  "ws_server_onDisconnect",
];
const loops = ["ws_server_forEachClient", "ws_server_forEachInGroup"];

createRestrictions(
  [
    "ws_server_clientInfo",
    "ws_server_clientQuery",
    "ws_server_clientHeader",
    "ws_server_setData",
    "ws_server_getData",
    "ws_server_joinGroup",
    "ws_server_inGroup",
  ],
  [
    {
      type: "hasParent",
      blockTypes: [...clientHats, ...loops, "ws_server_onVerify"],
      message:
        'This block must be inside a "when a client…" block or a "for each client" loop, so it knows which client "this client" is.',
    },
  ],
);

createRestrictions(
  ["ws_server_sendClient", "ws_server_sendEventClient", "ws_server_kick", "ws_server_clientIsConnected"],
  [
    {
      type: "hasParent",
      blockTypes: [...clientHats, ...loops],
      message:
        'This block must be inside a "when a client connects / sends / disconnects" block or a "for each client" loop.',
    },
  ],
);

createRestrictions(
  ["ws_server_message", "ws_server_messageJson"],
  [
    {
      type: "hasParent",
      blockTypes: ["ws_server_onMessage", "ws_server_onEvent"],
      message: 'This block must be inside a "when a client sends a message" or "sends event" block.',
    },
  ],
);

createRestrictions(
  ["ws_server_eventData"],
  [
    {
      type: "hasParent",
      blockTypes: ["ws_server_onEvent"],
      message: 'This block must be inside a "when a client sends event" block.',
    },
  ],
);

createRestrictions(
  ["ws_server_closeInfo"],
  [
    {
      type: "hasParent",
      blockTypes: ["ws_server_onDisconnect"],
      message: 'This block must be inside a "when a client disconnects" block.',
    },
  ],
);

createRestrictions(
  ["ws_server_errorMessage"],
  [
    {
      type: "hasParent",
      blockTypes: ["ws_server_onError"],
      message: 'This block must be inside a "when WebSocket server has an error" block.',
    },
  ],
);

createRestrictions(
  ["ws_server_reject"],
  [
    {
      type: "hasParent",
      blockTypes: ["ws_server_onVerify"],
      message: 'This block must be inside a "when a client tries to connect" block.',
    },
  ],
);
