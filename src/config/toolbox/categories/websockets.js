import { block, divider, label, section, shadow, textInput } from "../helpers.js";

/* =====================================================================
   Apps / Utils → WebSockets
   ---------------------------------------------------------------------
   WebSockets
     Frontend (connect to a server)   → WebSocket (ws), Socket.IO
     Backend (host your own server)   → WebSocket (ws), Socket.IO

   Both libraries are offered on both sides because they don't mix: a
   Socket.IO server only talks to Socket.IO clients, and a plain
   WebSocket server only to plain WebSocket clients. Which one somebody
   needs depends on what they're connecting to, or what their website
   already uses.
   ===================================================================== */

const text = (value) => ({ shadow: shadow("String", { fields: { TEXT: value } }) });
const number = (value) => ({
  shadow: shadow("Number", { fields: { NUM: value } }),
});

/** A value input pre-filled with an empty "create object" block. */
const object = () => ({ block: block("object_new") });

const WS_CLIENT = "#4C6EF5";
const WS_SERVER = "#3B5BDB";
const SIO_CLIENT = "#AE3EC9";
const SIO_SERVER = "#862E9C";

// ---------------------------------------------------------------------
// Frontend
// ---------------------------------------------------------------------

const wsClient = {
  kind: "category",
  name: "WebSocket (ws)",
  colour: WS_CLIENT,
  contents: [
    label("Connect to any plain WebSocket server (ws:// or wss:// links)"),
    label('Every connection has a name, "main" by default. Use the same name in all blocks.'),
    divider(),
    ...section("1. Connect (put this in \"when the bot starts\")", [
      block("ws_client_connect", {
        inputs: { url: text("wss://echo.websocket.org") },
      }),
      block("ws_client_waitOpen", { inputs: { seconds: number(10) } }),
    ]),
    ...section("Connect with headers, like an API key", [
      block("ws_client_connectAdvanced", {
        inputs: {
          url: text("wss://"),
          headers: object(),
          protocol: text(""),
        },
      }),
    ]),
    divider(),
    ...section("2. React to the server (these go anywhere, on their own)", [
      block("ws_client_onOpen"),
      block("ws_client_onMessage"),
      block("ws_client_onEvent"),
      block("ws_client_onClose"),
      block("ws_client_onError"),
    ]),
    ...section("What the server sent", [
      block("ws_client_message"),
      block("ws_client_messageJson"),
      block("ws_client_eventData"),
      block("ws_client_closeInfo"),
      block("ws_client_errorMessage"),
    ]),
    divider(),
    ...section("3. Send to the server", [
      block("ws_client_send", { inputs: textInput("message", "Hello!") }),
      label('Events are sent as JSON: { "event": "chat", "data": ... }'),
      block("ws_client_sendEvent", {
        inputs: { event: text("chat"), data: text("Hello!") },
      }),
    ]),
    divider(),
    ...section("Connection status", [
      block("ws_client_isOpen"),
      block("ws_client_state"),
      block("ws_client_url"),
    ]),
    ...section("Disconnect or reconnect", [
      block("ws_client_disconnect", {
        inputs: { code: number(1000), reason: text("Goodbye") },
      }),
      block("ws_client_reconnect"),
    ]),
  ],
};

const sioClient = {
  kind: "category",
  name: "Socket.IO",
  colour: SIO_CLIENT,
  contents: [
    label("Connect to a server made with Socket.IO (it won't accept plain WebSockets)"),
    label('Every connection has a name, "main" by default. Use the same name in all blocks.'),
    divider(),
    ...section("1. Connect (put this in \"when the bot starts\")", [
      block("sio_client_connect", {
        inputs: { url: text("http://localhost:3000") },
      }),
      block("sio_client_waitConnected", { inputs: { seconds: number(10) } }),
    ]),
    ...section("Connect with login details, headers and more", [
      block("sio_client_connectAdvanced", {
        inputs: {
          url: text("http://localhost:3000"),
          auth: object(),
        },
      }),
    ]),
    divider(),
    ...section("2. React to the server (these go anywhere, on their own)", [
      block("sio_client_onConnect"),
      block("sio_client_onEvent"),
      block("sio_client_onAny"),
      block("sio_client_onDisconnect"),
      block("sio_client_onError"),
    ]),
    ...section("What the server sent", [
      block("sio_client_eventData"),
      block("sio_client_eventArgs"),
      block("sio_client_eventName"),
      block("sio_client_disconnectReason"),
      block("sio_client_errorMessage"),
    ]),
    ...section("Answer an event the server is waiting on", [
      block("sio_client_reply", { inputs: textInput("data", "OK") }),
    ]),
    divider(),
    ...section("3. Send events to the server", [
      block("sio_client_emit", {
        inputs: { event: text("message"), data: text("Hello!") },
      }),
      block("sio_client_emitWithReply", {
        inputs: {
          event: text("ping"),
          data: text(""),
          seconds: number(5),
        },
      }),
      block("sio_client_replyValue"),
    ]),
    divider(),
    ...section("Connection status", [
      block("sio_client_isConnected"),
      block("sio_client_id"),
    ]),
    ...section("Disconnect or reconnect", [
      block("sio_client_disconnect"),
      block("sio_client_reconnect"),
    ]),
  ],
};

// ---------------------------------------------------------------------
// Backend
// ---------------------------------------------------------------------

const wsServer = {
  kind: "category",
  name: "WebSocket (ws)",
  colour: WS_SERVER,
  contents: [
    label("Host a plain WebSocket server. Clients connect to ws://your-host:port"),
    label('Every server has a name, "main" by default. Use the same name in all blocks.'),
    divider(),
    ...section("1. Start the server (put this in \"when the bot starts\")", [
      block("ws_server_start", { inputs: { port: number(8080) } }),
      block("ws_server_stop"),
      block("ws_server_isRunning"),
    ]),
    divider(),
    ...section("2. React to clients (these go anywhere, on their own)", [
      block("ws_server_onConnect"),
      block("ws_server_onMessage"),
      block("ws_server_onEvent"),
      block("ws_server_onDisconnect"),
    ]),
    ...section("What the client sent", [
      block("ws_server_message"),
      block("ws_server_messageJson"),
      block("ws_server_eventData"),
      block("ws_server_closeInfo"),
    ]),
    divider(),
    ...section("3. Reply to this client", [
      block("ws_server_sendClient", { inputs: textInput("message", "Hello!") }),
      block("ws_server_sendEventClient", {
        inputs: { event: text("chat"), data: text("Hello!") },
      }),
    ]),
    ...section("Send to everyone", [
      block("ws_server_broadcast", { inputs: textInput("message", "Hello everyone!") }),
      block("ws_server_broadcastEvent", {
        inputs: { event: text("chat"), data: text("Hello everyone!") },
      }),
    ]),
    ...section("Send to one client by ID (works anywhere, even in Discord events)", [
      block("ws_server_sendId", {
        inputs: { message: text("Hello!"), id: text("") },
      }),
      block("ws_server_sendEventId", {
        inputs: { event: text("chat"), data: text("Hello!"), id: text("") },
      }),
    ]),
    divider(),
    ...section("About this client", [
      block("ws_server_clientInfo"),
      block("ws_server_clientQuery", { inputs: textInput("key", "token") }),
      block("ws_server_clientHeader", { inputs: textInput("key", "user-agent") }),
      block("ws_server_clientIsConnected"),
    ]),
    ...section("Remember things about a client", [
      block("ws_server_setData", {
        inputs: { key: text("username"), value: text("") },
      }),
      block("ws_server_getData", { inputs: textInput("key", "username") }),
      block("ws_server_getDataById", {
        inputs: { key: text("username"), id: text("") },
      }),
    ]),
    divider(),
    ...section("Groups (like chat rooms)", [
      block("ws_server_joinGroup", { inputs: textInput("group", "lobby") }),
      block("ws_server_inGroup", { inputs: textInput("group", "lobby") }),
      block("ws_server_sendGroup", {
        inputs: { message: text("Hello!"), group: text("lobby") },
      }),
      block("ws_server_sendEventGroup", {
        inputs: { event: text("chat"), data: text("Hello!"), group: text("lobby") },
      }),
      block("ws_server_groupInfo", { inputs: textInput("group", "lobby") }),
      block("ws_server_forEachInGroup", { inputs: textInput("group", "lobby") }),
    ]),
    divider(),
    ...section("All connected clients", [
      block("ws_server_clientsInfo"),
      block("ws_server_idConnected", { inputs: textInput("id") }),
      block("ws_server_forEachClient"),
    ]),
    divider(),
    ...section("Only let some clients in (checked before they connect)", [
      block("ws_server_onVerify"),
      block("ws_server_reject", { inputs: textInput("reason", "Wrong password") }),
    ]),
    ...section("Disconnect clients", [
      block("ws_server_kick", {
        inputs: { code: number(1000), reason: text("Goodbye") },
      }),
      block("ws_server_kickId", {
        inputs: { id: text(""), reason: text("Goodbye") },
      }),
    ]),
    ...section("Server problems", [
      block("ws_server_onStart"),
      block("ws_server_onError"),
      block("ws_server_errorMessage"),
    ]),
  ],
};

const sioServer = {
  kind: "category",
  name: "Socket.IO",
  colour: SIO_SERVER,
  contents: [
    label("Host a Socket.IO server. Websites connect with the Socket.IO library"),
    label('Every server has a name, "main" by default. Use the same name in all blocks.'),
    divider(),
    ...section("1. Start the server (put this in \"when the bot starts\")", [
      block("sio_server_start", {
        inputs: { port: number(3000), cors: text("*") },
      }),
      block("sio_server_stop"),
      block("sio_server_isRunning"),
    ]),
    divider(),
    ...section("2. React to clients (these go anywhere, on their own)", [
      block("sio_server_onConnect"),
      block("sio_server_onEvent"),
      block("sio_server_onAny"),
      block("sio_server_onDisconnect"),
    ]),
    ...section("What the client sent", [
      block("sio_server_eventData"),
      block("sio_server_eventArgs"),
      block("sio_server_eventName"),
      block("sio_server_disconnectReason"),
    ]),
    ...section("Answer an event the client is waiting on", [
      block("sio_server_reply", { inputs: textInput("data", "OK") }),
    ]),
    divider(),
    ...section("3. Send events to this client", [
      block("sio_server_emitClient", {
        inputs: { event: text("message"), data: text("Hello!") },
      }),
      block("sio_server_emitClientWithReply", {
        inputs: { event: text("ping"), data: text(""), seconds: number(5) },
      }),
      block("sio_server_replyValue"),
    ]),
    ...section("Send to everyone", [
      block("sio_server_emitAll", {
        inputs: { event: text("message"), data: text("Hello everyone!") },
      }),
    ]),
    ...section("Send to one client by ID (works anywhere, even in Discord events)", [
      block("sio_server_emitId", {
        inputs: { event: text("message"), data: text("Hello!"), id: text("") },
      }),
    ]),
    divider(),
    ...section("About this client", [
      block("sio_server_clientInfo"),
      block("sio_server_clientHandshake", { inputs: textInput("key", "token") }),
      block("sio_server_clientIsConnected"),
    ]),
    ...section("Remember things about a client", [
      block("sio_server_setData", {
        inputs: { key: text("username"), value: text("") },
      }),
      block("sio_server_getData", { inputs: textInput("key", "username") }),
      block("sio_server_getDataById", {
        inputs: { key: text("username"), id: text("") },
      }),
    ]),
    divider(),
    ...section("Rooms (like chat rooms)", [
      block("sio_server_joinRoom", { inputs: textInput("room", "lobby") }),
      block("sio_server_joinRoomId", {
        inputs: { id: text(""), room: text("lobby") },
      }),
      block("sio_server_inRoom", { inputs: textInput("room", "lobby") }),
      block("sio_server_emitRoom", {
        inputs: { event: text("message"), data: text("Hello!"), room: text("lobby") },
      }),
      block("sio_server_roomInfo", { inputs: textInput("room", "lobby") }),
      block("sio_server_forEachInRoom", { inputs: textInput("room", "lobby") }),
    ]),
    divider(),
    ...section("All connected clients", [
      block("sio_server_clientsInfo"),
      block("sio_server_idConnected", { inputs: textInput("id") }),
      block("sio_server_forEachClient"),
    ]),
    divider(),
    ...section("Only let some clients in (checked before they connect)", [
      block("sio_server_onAuth"),
      block("sio_server_reject", { inputs: textInput("reason", "Wrong password") }),
    ]),
    ...section("Disconnect clients", [
      block("sio_server_kick"),
      block("sio_server_kickId", { inputs: textInput("id") }),
    ]),
    ...section("Server started", [block("sio_server_onStart")]),
  ],
};

// ---------------------------------------------------------------------
// The category itself
// ---------------------------------------------------------------------

/** Live two-way connections: the bot as a client, or as a server. */
export default {
  kind: "category",
  name: "WebSockets",
  colour: WS_CLIENT,
  contents: [
    label("WebSockets keep a live connection open, so both sides can send"),
    label("messages at any time — for chats, live dashboards, games and more."),
    divider(),
    label("Frontend: your bot connects to someone else's server"),
    label("Backend: your bot runs a server that websites and apps connect to"),
    divider(),
    label("WebSocket (ws) is the plain, built-in kind. Socket.IO adds events,"),
    label("rooms and replies, but only works with other Socket.IO apps."),
    label("Pick whichever one the other side uses."),
    {
      kind: "category",
      name: "Frontend (client)",
      colour: WS_CLIENT,
      contents: [
        label("Connect your bot to another server or API ↓"),
        label("Use WebSocket (ws) for ws:// and wss:// links, Socket.IO for Socket.IO servers"),
        wsClient,
        sioClient,
      ],
    },
    {
      kind: "category",
      name: "Backend (server)",
      colour: WS_SERVER,
      contents: [
        label("Run your own server that websites and apps connect to ↓"),
        label("Your host must let you open a port for others to reach it"),
        wsServer,
        sioServer,
      ],
    },
  ],
};
