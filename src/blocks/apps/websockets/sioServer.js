import * as Blockly from "blockly";
import { Order, javascriptGenerator } from "blockly/javascript";
import { createRestrictions } from "../../lib/restrictions";
import { colours, nameField, nameOf, valueOr } from "./shared.js";

/* =====================================================================
   Socket.IO — backend: the bot hosts a server others connect to
   ---------------------------------------------------------------------
   Inside a "when a client…" block, "this client" is the one that
   connected, sent the event or left. "for each client" loops set it too.

   Rooms are Socket.IO's own: a client can be in any number of them, and
   sending to a room reaches everyone inside.
   ===================================================================== */

const colour = colours.sioServer;

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

/* Outside a "when a client…" block there is no "this client" to skip,
   so it has to be looked up without throwing a ReferenceError. */
const thisSocket = '(typeof sioSocket === "undefined" ? null : sioSocket)';

// ---------------------------------------------------------------------
// Starting and stopping
// ---------------------------------------------------------------------

Blockly.Blocks["sio_server_start"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("start Socket.IO server")
      .appendField(nameField(), "NAME");
    this.appendValueInput("port").setCheck("Number").appendField("on port:");
    this.appendValueInput("cors")
      .setCheck("String")
      .appendField("allow websites (CORS):");
    statement(this);
    this.setTooltip(
      'Starts a Socket.IO server that apps and websites can connect to. "Allow websites" is which websites may connect from a browser: * for any, or a list like https://mysite.com, https://other.com. Put this in "when the bot starts".',
    );
  },
};

javascriptGenerator.forBlock["sio_server_start"] = function (block, generator) {
  const port = valueOr(generator, block, "port", "3000");
  const cors = valueOr(generator, block, "cors", '"*"');
  return `sioStartServer(${nameOf(block)}, ${port}, ${cors});\n`;
};

Blockly.Blocks["sio_server_stop"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("stop Socket.IO server")
      .appendField(nameField(), "NAME");
    statement(this);
    this.setTooltip("Disconnects every client and stops the server");
  },
};

javascriptGenerator.forBlock["sio_server_stop"] = function (block) {
  return `sioStopServer(${nameOf(block)});\n`;
};

Blockly.Blocks["sio_server_isRunning"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("Socket.IO server")
      .appendField(nameField(), "NAME")
      .appendField("is running?");
    value(this, "Boolean");
    this.setTooltip("True if the server has been started and not stopped");
  },
};

javascriptGenerator.forBlock["sio_server_isRunning"] = function (block) {
  return [`Boolean(sioServers[${nameOf(block)}]?.io)`, Order.FUNCTION_CALL];
};

// ---------------------------------------------------------------------
// When things happen
// ---------------------------------------------------------------------

Blockly.Blocks["sio_server_onStart"] = {
  init: function () {
    hat(this, "when Socket.IO server", "starts");
    this.setTooltip("Runs once the server is up and ready for connections");
  },
};

javascriptGenerator.forBlock["sio_server_onStart"] = function (block, generator) {
  const code = generator.statementToCode(block, "code");
  return `sioOnServer(${nameOf(block)}, "listening", async () => {\n${code}});\n`;
};

Blockly.Blocks["sio_server_onAuth"] = {
  init: function () {
    hat(this, "when a client tries to connect to", "");
    this.setTooltip(
      'Runs before a client is let in. Check its login details and use "reject this connection" to turn it away. You can also save client data or join rooms here.',
    );
  },
};

javascriptGenerator.forBlock["sio_server_onAuth"] = function (block, generator) {
  const code = generator.statementToCode(block, "code");
  return `sioOnServer(${nameOf(block)}, "auth", async (sioSocket, sioAuth) => {\n${code}});\n`;
};

Blockly.Blocks["sio_server_onConnect"] = {
  init: function () {
    hat(this, "when a client connects to", "");
    this.setTooltip("Runs every time a new client connects to the server");
  },
};

javascriptGenerator.forBlock["sio_server_onConnect"] = function (block, generator) {
  const code = generator.statementToCode(block, "code");
  return `sioOnServer(${nameOf(block)}, "connection", async (sioSocket) => {\n${code}});\n`;
};

Blockly.Blocks["sio_server_onEvent"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("when a client sends event")
      .appendField(new Blockly.FieldTextInput("message"), "EVENT")
      .appendField("to")
      .appendField(nameField(), "NAME");
    this.appendStatementInput("code").setCheck(null);
    this.setColour(colour);
    this.setPreviousStatement(false);
    this.setNextStatement(false);
    this.setTooltip(
      'Runs when any client sends an event with this name. Use "event data" inside it, and "reply to this event" if the client is waiting for an answer.',
    );
  },
};

javascriptGenerator.forBlock["sio_server_onEvent"] = function (block, generator) {
  const event = JSON.stringify(block.getFieldValue("EVENT"));
  const code = generator.statementToCode(block, "code");
  return `sioOnServer(${nameOf(block)}, "event", async (sioSocket, ...sioReceived) => {
  let { args: sioArgs, ack: sioAck } = sioServerSplitArgs(sioReceived);
  const sioData = sioArgs[0];
${code}}, ${event});\n`;
};

Blockly.Blocks["sio_server_onAny"] = {
  init: function () {
    hat(this, "when a client sends any event to", "");
    this.setTooltip(
      'Runs for every event any client sends, whatever its name. Use "event name" to see which one it was.',
    );
  },
};

javascriptGenerator.forBlock["sio_server_onAny"] = function (block, generator) {
  const code = generator.statementToCode(block, "code");
  return `sioOnServer(${nameOf(block)}, "any", async (sioSocket, sioEventName, ...sioReceived) => {
  let { args: sioArgs, ack: sioAck } = sioServerSplitArgs(sioReceived);
  const sioData = sioArgs[0];
${code}});\n`;
};

Blockly.Blocks["sio_server_onDisconnect"] = {
  init: function () {
    hat(this, "when a client disconnects from", "");
    this.setTooltip(
      "Runs when a client leaves, for any reason. You can still read its ID and data here.",
    );
  },
};

javascriptGenerator.forBlock["sio_server_onDisconnect"] = function (block, generator) {
  const code = generator.statementToCode(block, "code");
  return `sioOnServer(${nameOf(block)}, "disconnect", async (sioSocket, sioReason) => {\n${code}});\n`;
};

// ---------------------------------------------------------------------
// What was received
// ---------------------------------------------------------------------

Blockly.Blocks["sio_server_eventData"] = {
  init: function () {
    this.appendDummyInput().appendField("event data from client");
    value(this, null);
    this.setTooltip(
      "The data the client sent with the event. It can be text, a number, an object or a list.",
    );
  },
};

javascriptGenerator.forBlock["sio_server_eventData"] = () => ["sioData", Order.ATOMIC];

Blockly.Blocks["sio_server_eventArgs"] = {
  init: function () {
    this.appendDummyInput().appendField("list of everything the client sent");
    value(this, "Array");
    this.setTooltip(
      'A client can send more than one value with an event. This is all of them, as a list. "event data" is the first one.',
    );
  },
};

javascriptGenerator.forBlock["sio_server_eventArgs"] = () => ["sioArgs", Order.ATOMIC];

Blockly.Blocks["sio_server_eventName"] = {
  init: function () {
    this.appendDummyInput().appendField("name of the event the client sent");
    value(this, "String");
    this.setTooltip("Which event the client sent");
  },
};

javascriptGenerator.forBlock["sio_server_eventName"] = () => ["sioEventName", Order.ATOMIC];

Blockly.Blocks["sio_server_disconnectReason"] = {
  init: function () {
    this.appendDummyInput().appendField("reason the client disconnected");
    value(this, "String");
    this.setTooltip(
      'Like "client namespace disconnect" (it left on purpose), "transport close" (the connection dropped) or "server namespace disconnect" (you kicked it)',
    );
  },
};

javascriptGenerator.forBlock["sio_server_disconnectReason"] = () => ["sioReason", Order.ATOMIC];

Blockly.Blocks["sio_server_reply"] = {
  init: function () {
    this.appendValueInput("data").appendField("reply to this event with");
    statement(this);
    this.setTooltip(
      "Answers the event the client sent, if the client is waiting for an answer (\"send event … and wait for a reply\"). Only the first reply is sent.",
    );
  },
};

javascriptGenerator.forBlock["sio_server_reply"] = function (block, generator) {
  const data = valueOr(generator, block, "data", "null");
  return `sioAck?.(${data});\nsioAck = null;\n`;
};

// ---------------------------------------------------------------------
// About this client
// ---------------------------------------------------------------------

Blockly.Blocks["sio_server_clientInfo"] = {
  init: function () {
    this.appendDummyInput()
      .appendField(
        new Blockly.FieldDropdown([
          ["ID", "id"],
          ["IP address", "ip"],
          ["website (origin)", "origin"],
          ["list of rooms", "rooms"],
        ]),
        "info",
      )
      .appendField("of this client");
    value(this, null);
    this.setTooltip(
      'Information about this client. The ID can be saved and used later with "send event to client with ID".',
    );
  },
};

javascriptGenerator.forBlock["sio_server_clientInfo"] = function (block) {
  return [`sioSocketInfo(sioSocket, "${block.getFieldValue("info")}")`, Order.FUNCTION_CALL];
};

Blockly.Blocks["sio_server_clientHandshake"] = {
  init: function () {
    this.appendValueInput("key")
      .setCheck("String")
      .appendField(
        new Blockly.FieldDropdown([
          ["login detail (auth)", "auth"],
          ["query parameter", "query"],
          ["header", "headers"],
        ]),
        "source",
      );
    this.appendDummyInput().appendField("of this client");
    this.setInputsInline(true);
    value(this, null);
    this.setTooltip(
      "Something the client sent when it connected: its login details (the auth object), a value from its URL, or a header like user-agent",
    );
  },
};

javascriptGenerator.forBlock["sio_server_clientHandshake"] = function (block, generator) {
  const key = valueOr(generator, block, "key");
  const source = block.getFieldValue("source");
  const lookup = source === "headers" ? `String(${key}).toLowerCase()` : key;
  return [`(sioSocket?.handshake?.${source}?.[${lookup}] ?? null)`, Order.ATOMIC];
};

Blockly.Blocks["sio_server_clientIsConnected"] = {
  init: function () {
    this.appendDummyInput().appendField("this client is still connected?");
    value(this, "Boolean");
    this.setTooltip("True if this client hasn't disconnected yet");
  },
};

javascriptGenerator.forBlock["sio_server_clientIsConnected"] = () => [
  "Boolean(sioSocket?.connected)",
  Order.FUNCTION_CALL,
];

// ---------------------------------------------------------------------
// Client data
// ---------------------------------------------------------------------

Blockly.Blocks["sio_server_setData"] = {
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

javascriptGenerator.forBlock["sio_server_setData"] = function (block, generator) {
  const key = valueOr(generator, block, "key");
  const val = valueOr(generator, block, "value", "null");
  return `if (sioSocket) sioSocket.data[${key}] = ${val};\n`;
};

Blockly.Blocks["sio_server_getData"] = {
  init: function () {
    this.appendValueInput("key").setCheck("String").appendField("get");
    this.appendDummyInput().appendField("of this client's data");
    this.setInputsInline(true);
    value(this, null);
    this.setTooltip("Something you saved about this client with \"set … of this client's data\"");
  },
};

javascriptGenerator.forBlock["sio_server_getData"] = function (block, generator) {
  const key = valueOr(generator, block, "key");
  return [`(sioSocket?.data?.[${key}] ?? null)`, Order.ATOMIC];
};

Blockly.Blocks["sio_server_getDataById"] = {
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

javascriptGenerator.forBlock["sio_server_getDataById"] = function (block, generator) {
  const key = valueOr(generator, block, "key");
  const id = valueOr(generator, block, "id");
  return [
    `(sioServers[${nameOf(block)}]?.io?.sockets.sockets.get(String(${id}))?.data[${key}] ?? null)`,
    Order.ATOMIC,
  ];
};

// ---------------------------------------------------------------------
// Sending
// ---------------------------------------------------------------------

Blockly.Blocks["sio_server_emitClient"] = {
  init: function () {
    this.appendValueInput("event").setCheck("String").appendField("send event");
    this.appendValueInput("data").appendField("with data");
    this.appendDummyInput().appendField("to this client");
    this.setInputsInline(false);
    statement(this);
    this.setTooltip("Sends an event to this client only");
  },
};

javascriptGenerator.forBlock["sio_server_emitClient"] = function (block, generator) {
  const event = valueOr(generator, block, "event");
  const data = valueOr(generator, block, "data", "null");
  return `sioSocket?.emit(String(${event}), ${data});\n`;
};

Blockly.Blocks["sio_server_emitClientWithReply"] = {
  init: function () {
    this.appendValueInput("event").setCheck("String").appendField("send event");
    this.appendValueInput("data").appendField("with data");
    this.appendValueInput("seconds")
      .setCheck("Number")
      .appendField("to this client and wait for a reply for (seconds):");
    this.appendStatementInput("then").setCheck("default").appendField("then");
    this.setInputsInline(false);
    statement(this);
    this.setTooltip(
      'Sends an event to this client and waits for it to answer. Use "reply from the client" inside — it\'s empty if no answer came in time.',
    );
  },
};

javascriptGenerator.forBlock["sio_server_emitClientWithReply"] = function (block, generator) {
  const event = valueOr(generator, block, "event");
  const data = valueOr(generator, block, "data", "null");
  const seconds = valueOr(generator, block, "seconds", "5");
  const then = generator.statementToCode(block, "then");
  return `await sioServerEmitWithAck(sioSocket, ${event}, ${data}, ${seconds}).then(async (sioReply) => {\n${then}});\n`;
};

Blockly.Blocks["sio_server_replyValue"] = {
  init: function () {
    this.appendDummyInput().appendField("reply from the client");
    value(this, null);
    this.setTooltip("What the client answered with. Empty if it didn't answer in time.");
  },
};

javascriptGenerator.forBlock["sio_server_replyValue"] = () => ["sioReply", Order.ATOMIC];

Blockly.Blocks["sio_server_emitId"] = {
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

javascriptGenerator.forBlock["sio_server_emitId"] = function (block, generator) {
  const event = valueOr(generator, block, "event");
  const data = valueOr(generator, block, "data", "null");
  const id = valueOr(generator, block, "id");
  return `sioIo(${nameOf(block)})?.to(String(${id})).emit(String(${event}), ${data});\n`;
};

Blockly.Blocks["sio_server_emitAll"] = {
  init: function () {
    this.appendValueInput("event").setCheck("String").appendField("send event");
    this.appendValueInput("data").appendField("with data");
    this.appendDummyInput()
      .appendField("to")
      .appendField(
        new Blockly.FieldDropdown([
          ["all clients", "all"],
          ["all clients except this one", "others"],
        ]),
        "WHO",
      )
      .appendField("on server")
      .appendField(nameField(), "NAME");
    this.setInputsInline(false);
    statement(this);
    this.setTooltip(
      'Sends an event to everyone connected. "all clients except this one" only skips someone inside a "when a client…" block.',
    );
  },
};

javascriptGenerator.forBlock["sio_server_emitAll"] = function (block, generator) {
  const event = valueOr(generator, block, "event");
  const data = valueOr(generator, block, "data", "null");
  const io = `sioIo(${nameOf(block)})`;
  if (block.getFieldValue("WHO") === "others")
    return `${io}?.except(${thisSocket}?.id ?? []).emit(String(${event}), ${data});\n`;
  return `${io}?.emit(String(${event}), ${data});\n`;
};

Blockly.Blocks["sio_server_emitRoom"] = {
  init: function () {
    this.appendValueInput("event").setCheck("String").appendField("send event");
    this.appendValueInput("data").appendField("with data");
    this.appendValueInput("room").setCheck("String").appendField("to everyone in room");
    this.appendDummyInput()
      .appendField("on server")
      .appendField(nameField(), "NAME")
      .appendField("except this client")
      .appendField(new Blockly.FieldCheckbox("FALSE"), "except");
    this.setInputsInline(false);
    statement(this);
    this.setTooltip(
      'Sends an event to every client in the room. Tick "except this client" to skip the one that sent it (only inside a "when a client…" block).',
    );
  },
};

javascriptGenerator.forBlock["sio_server_emitRoom"] = function (block, generator) {
  const event = valueOr(generator, block, "event");
  const data = valueOr(generator, block, "data", "null");
  const room = valueOr(generator, block, "room");
  const except =
    block.getFieldValue("except") === "TRUE" ? `.except(${thisSocket}?.id ?? [])` : "";
  return `sioIo(${nameOf(block)})?.to(String(${room}))${except}.emit(String(${event}), ${data});\n`;
};

// ---------------------------------------------------------------------
// Rooms
// ---------------------------------------------------------------------

Blockly.Blocks["sio_server_joinRoom"] = {
  init: function () {
    this.appendValueInput("room")
      .setCheck("String")
      .appendField(
        new Blockly.FieldDropdown([
          ["add this client to", "join"],
          ["remove this client from", "leave"],
        ]),
        "action",
      )
      .appendField("room");
    statement(this);
    this.setTooltip(
      "Rooms are like chat rooms: put clients in one, then send an event to everyone in it at once. A client can be in many rooms.",
    );
  },
};

javascriptGenerator.forBlock["sio_server_joinRoom"] = function (block, generator) {
  const room = valueOr(generator, block, "room");
  return `sioSocket?.${block.getFieldValue("action")}(String(${room}));\n`;
};

Blockly.Blocks["sio_server_joinRoomId"] = {
  init: function () {
    this.appendValueInput("id")
      .setCheck("String")
      .appendField(
        new Blockly.FieldDropdown([
          ["add client with ID", "socketsJoin"],
          ["remove client with ID", "socketsLeave"],
        ]),
        "action",
      );
    this.appendValueInput("room").setCheck("String").appendField("to / from room");
    this.appendDummyInput()
      .appendField("on server")
      .appendField(nameField(), "NAME");
    this.setInputsInline(false);
    statement(this);
    this.setTooltip("Moves a client in or out of a room, found by its ID. Works anywhere.");
  },
};

javascriptGenerator.forBlock["sio_server_joinRoomId"] = function (block, generator) {
  const id = valueOr(generator, block, "id");
  const room = valueOr(generator, block, "room");
  return `sioIo(${nameOf(block)})?.in(String(${id})).${block.getFieldValue("action")}(String(${room}));\n`;
};

Blockly.Blocks["sio_server_inRoom"] = {
  init: function () {
    this.appendValueInput("room").setCheck("String").appendField("this client is in room");
    this.appendDummyInput().appendField("?");
    this.setInputsInline(true);
    value(this, "Boolean");
    this.setTooltip("True if this client is in the room");
  },
};

javascriptGenerator.forBlock["sio_server_inRoom"] = function (block, generator) {
  const room = valueOr(generator, block, "room");
  return [`Boolean(sioSocket?.rooms.has(String(${room})))`, Order.FUNCTION_CALL];
};

Blockly.Blocks["sio_server_roomInfo"] = {
  init: function () {
    this.appendValueInput("room")
      .setCheck("String")
      .appendField(
        new Blockly.FieldDropdown([
          ["number of clients", "count"],
          ["list of client IDs", "ids"],
        ]),
        "info",
      )
      .appendField("in room");
    this.appendDummyInput()
      .appendField("on server")
      .appendField(nameField(), "NAME");
    this.setInputsInline(true);
    value(this, null);
    this.setTooltip("Who is in a room right now");
  },
};

javascriptGenerator.forBlock["sio_server_roomInfo"] = function (block, generator) {
  const room = valueOr(generator, block, "room");
  const sockets = `sioRoomSockets(${nameOf(block)}, ${room})`;
  return block.getFieldValue("info") === "count"
    ? [`${sockets}.length`, Order.MEMBER]
    : [`${sockets}.map((socket) => socket.id)`, Order.FUNCTION_CALL];
};

// ---------------------------------------------------------------------
// All clients
// ---------------------------------------------------------------------

Blockly.Blocks["sio_server_clientsInfo"] = {
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

javascriptGenerator.forBlock["sio_server_clientsInfo"] = function (block) {
  const sockets = `sioServerSockets(${nameOf(block)})`;
  return block.getFieldValue("info") === "count"
    ? [`${sockets}.length`, Order.MEMBER]
    : [`${sockets}.map((socket) => socket.id)`, Order.FUNCTION_CALL];
};

Blockly.Blocks["sio_server_idConnected"] = {
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

javascriptGenerator.forBlock["sio_server_idConnected"] = function (block, generator) {
  const id = valueOr(generator, block, "id");
  return [
    `Boolean(sioServers[${nameOf(block)}]?.io?.sockets.sockets.has(String(${id})))`,
    Order.FUNCTION_CALL,
  ];
};

Blockly.Blocks["sio_server_forEachClient"] = {
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

javascriptGenerator.forBlock["sio_server_forEachClient"] = function (block, generator) {
  const code = generator.statementToCode(block, "code");
  return `for (const sioSocket of sioServerSockets(${nameOf(block)})) {\n${code}}\n`;
};

Blockly.Blocks["sio_server_forEachInRoom"] = {
  init: function () {
    this.appendValueInput("room").setCheck("String").appendField("for each client in room");
    this.appendDummyInput()
      .appendField("on server")
      .appendField(nameField(), "NAME");
    this.appendStatementInput("code").setCheck("default").appendField("do");
    this.setInputsInline(true);
    statement(this);
    this.setTooltip(
      'Runs the blocks inside once for every client in the room. Inside, "this client" means the one the loop is on.',
    );
  },
};

javascriptGenerator.forBlock["sio_server_forEachInRoom"] = function (block, generator) {
  const room = valueOr(generator, block, "room");
  const code = generator.statementToCode(block, "code");
  return `for (const sioSocket of sioRoomSockets(${nameOf(block)}, ${room})) {\n${code}}\n`;
};

// ---------------------------------------------------------------------
// Disconnecting
// ---------------------------------------------------------------------

Blockly.Blocks["sio_server_reject"] = {
  init: function () {
    this.appendValueInput("reason")
      .setCheck("String")
      .appendField("reject this connection with reason");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(false);
    this.setColour(colour);
    this.setTooltip(
      'Turns the client away before it connects, and stops the blocks after it. The client sees the reason in its "fails to connect" event.',
    );
  },
};

javascriptGenerator.forBlock["sio_server_reject"] = function (block, generator) {
  const reason = valueOr(generator, block, "reason", '"Unauthorized"');
  return `sioAuth.rejected = String(${reason});\nreturn;\n`;
};

Blockly.Blocks["sio_server_kick"] = {
  init: function () {
    this.appendDummyInput().appendField("disconnect this client");
    statement(this);
    this.setTooltip("Closes this client's connection. It won't reconnect by itself.");
  },
};

javascriptGenerator.forBlock["sio_server_kick"] = () => "sioSocket?.disconnect(true);\n";

Blockly.Blocks["sio_server_kickId"] = {
  init: function () {
    this.appendValueInput("id")
      .setCheck("String")
      .appendField(
        new Blockly.FieldDropdown([
          ["disconnect client with ID", "id"],
          ["disconnect everyone in room", "room"],
        ]),
        "target",
      );
    this.appendDummyInput()
      .appendField("on server")
      .appendField(nameField(), "NAME");
    this.setInputsInline(true);
    statement(this);
    this.setTooltip("Closes the connection of one client (by ID) or of everyone in a room. Works anywhere.");
  },
};

javascriptGenerator.forBlock["sio_server_kickId"] = function (block, generator) {
  const id = valueOr(generator, block, "id");
  return `sioIo(${nameOf(block)})?.in(String(${id})).disconnectSockets(true);\n`;
};

// ---------------------------------------------------------------------
// Where each block is allowed
// ---------------------------------------------------------------------

const clientHats = [
  "sio_server_onConnect",
  "sio_server_onEvent",
  "sio_server_onAny",
  "sio_server_onDisconnect",
];
const loops = ["sio_server_forEachClient", "sio_server_forEachInRoom"];
const eventHats = ["sio_server_onEvent", "sio_server_onAny"];

createRestrictions(
  [
    "sio_server_clientInfo",
    "sio_server_clientHandshake",
    "sio_server_setData",
    "sio_server_getData",
    "sio_server_joinRoom",
    "sio_server_inRoom",
  ],
  [
    {
      type: "hasParent",
      blockTypes: [...clientHats, ...loops, "sio_server_onAuth"],
      message:
        'This block must be inside a "when a client…" block or a "for each client" loop, so it knows which client "this client" is.',
    },
  ],
);

createRestrictions(
  [
    "sio_server_emitClient",
    "sio_server_emitClientWithReply",
    "sio_server_kick",
    "sio_server_clientIsConnected",
  ],
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
  ["sio_server_eventData", "sio_server_eventArgs", "sio_server_reply"],
  [
    {
      type: "hasParent",
      blockTypes: eventHats,
      message: 'This block must be inside a "when a client sends event" block.',
    },
  ],
);

createRestrictions(
  ["sio_server_eventName"],
  [
    {
      type: "hasParent",
      blockTypes: ["sio_server_onAny"],
      message: 'This block must be inside a "when a client sends any event" block.',
    },
  ],
);

createRestrictions(
  ["sio_server_disconnectReason"],
  [
    {
      type: "hasParent",
      blockTypes: ["sio_server_onDisconnect"],
      message: 'This block must be inside a "when a client disconnects" block.',
    },
  ],
);

createRestrictions(
  ["sio_server_replyValue"],
  [
    {
      type: "hasParent",
      blockTypes: ["sio_server_emitClientWithReply"],
      message: 'This block must be inside a "send event … to this client and wait for a reply" block.',
    },
  ],
);

createRestrictions(
  ["sio_server_reject"],
  [
    {
      type: "hasParent",
      blockTypes: ["sio_server_onAuth"],
      message: 'This block must be inside a "when a client tries to connect" block.',
    },
  ],
);
