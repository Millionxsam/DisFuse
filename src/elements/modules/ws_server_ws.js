/* =====================================================================
   Builder catalog: WebSocket server
   ---------------------------------------------------------------------
   Running a WebSocket server inside the bot, so websites and apps can
   connect to it and trade live messages.

   Each server has a name ("main" unless you change it). Steps about
   "this client" work in the server's events and in the repeat steps
   that go through clients.
   ===================================================================== */

import { ANY, group, input } from "../define.js";
import { wsRuntime } from "../../blocks/lib/websocketRuntime.js";

const { event, action, value } = group({ colour: "#3B5BDB" });

const WS = [{ package: "ws", code: wsRuntime }];

/** A connection or server name, as a string in the code. */
const nameOf = (ctx) => JSON.stringify(String(ctx.raw("NAME") ?? "").trim() || "main");

const events = [
  event({
    id: "event_ws_server_connect",
    label: "When a client connects to a WebSocket server",
    description: "Runs when a client connects.",
    category: "websockets",
    group: "WebSocket server",
    icon: "fa-solid fa-user-plus",
    keywords: ["websocket", "connect", "client", "join"],
    block: {
      type: "ws_server_onConnect",
      text: "when a client connects to {NAME}",
      parts: { NAME: { part: "text", value: "main" } },
      tooltip: "Runs every time a new client connects to the server",
    },
    params: [],
    provides: ["wsClient", "wsConnectedClient"],
    settings: [
      input.text("NAME", "Server name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this server.",
      }),
    ],
    wrap: (ctx, body) =>
      `wsOnServer(${nameOf(ctx)}, "connection", async (wsClient) => {\n${body}});`,
    dependencies: WS,
  }),
  event({
    id: "event_ws_server_message",
    label: "When a client sends a WebSocket message",
    description: "Runs every time a client sends the server a message.",
    category: "websockets",
    group: "WebSocket server",
    icon: "fa-solid fa-envelope-open-text",
    keywords: ["websocket", "message", "receive"],
    block: {
      type: "ws_server_onMessage",
      text: "when a client sends a message to {NAME}",
      parts: { NAME: { part: "text", value: "main" } },
      tooltip: "Runs every time any client sends the server a message",
    },
    params: [],
    provides: ["wsClient", "wsConnectedClient"],
    values: [
      {
        key: "message",
        label: "The message",
        type: "String",
        code: "wsClientMessage",
        block: {
          type: "ws_server_message",
          text: "message from client",
          tooltip: "The message the client sent, as text",
          restrictions: [
            {
              type: "hasParent",
              blockTypes: ["ws_server_onMessage", "ws_server_onEvent"],
              message:
                'This block must be inside a "when a client sends a message" or "sends event" block.',
            },
          ],
          also: ["event_ws_server_event"],
        },
      },
      {
        key: "json",
        label: "The message as an object",
        type: "object",
        code: "wsParseJson(wsClientMessage)",
        description: "Empty if the message isn't JSON.",
        block: {
          type: "ws_server_messageJson",
          text: "message from client as object (JSON)",
          tooltip:
            "The message the client sent, read as JSON. Use the Objects blocks to get keys from it. Empty if the message isn't JSON.",
          restrictions: [
            {
              type: "hasParent",
              blockTypes: ["ws_server_onMessage", "ws_server_onEvent"],
              message:
                'This block must be inside a "when a client sends a message" or "sends event" block.',
            },
          ],
          also: ["event_ws_server_event"],
        },
      },
    ],
    settings: [
      input.text("NAME", "Server name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this server.",
      }),
    ],
    wrap: (ctx, body) =>
      `wsOnServer(${nameOf(ctx)}, "message", async (wsClient, wsClientMessage) => {\n${body}});`,
    dependencies: WS,
  }),
  event({
    id: "event_ws_server_event",
    label: "When a client sends a WebSocket event",
    description:
      'Runs when a client sends JSON like { "event": "chat", "data": ... } with the event name you pick.',
    category: "websockets",
    group: "WebSocket server",
    icon: "fa-solid fa-bolt",
    keywords: ["websocket", "event", "receive"],
    block: {
      type: "ws_server_onEvent",
      text: "when a client sends event {EVENT} to {NAME}",
      parts: { EVENT: { part: "text", value: "chat" }, NAME: { part: "text", value: "main" } },
      tooltip:
        'Runs when a client sends JSON like { "event": "chat", "data": ... } with this event name. Use "event data" inside it.',
    },
    params: [],
    provides: ["wsClient", "wsConnectedClient"],
    values: [
      {
        key: "data",
        label: "Event data",
        type: ANY,
        code: "wsClientEventData",
        block: {
          type: "ws_server_eventData",
          text: "event data from client",
          tooltip:
            'The "data" part of the event the client sent. It can be text, a number, an object or a list.',
          restrictions: [
            {
              type: "hasParent",
              blockTypes: ["ws_server_onEvent"],
              message: 'This block must be inside a "when a client sends event" block.',
            },
          ],
        },
      },
      { key: "message", label: "The whole message", type: "String", code: "wsClientMessage" },
      {
        key: "json",
        label: "The message as an object",
        type: "object",
        code: "wsParseJson(wsClientMessage)",
        description: "Empty if the message isn't JSON.",
      },
    ],
    settings: [
      input.text("NAME", "Server name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this server.",
      }),
      input.text("EVENT", "Event name", { default: "chat", allowValues: false }),
    ],
    wrap: (
      ctx,
      body,
    ) => `wsOnServer(${nameOf(ctx)}, "message", async (wsClient, wsClientMessage) => {
const wsReceivedEvent = wsParseJson(wsClientMessage);
if (wsReceivedEvent?.event !== ${JSON.stringify(String(ctx.raw("EVENT") ?? ""))}) return;
const wsClientEventData = wsReceivedEvent.data;
${body}});`,
    dependencies: WS,
  }),
  event({
    id: "event_ws_server_disconnect",
    label: "When a client disconnects from a WebSocket server",
    description: "Runs when a client leaves or drops.",
    category: "websockets",
    group: "WebSocket server",
    icon: "fa-solid fa-user-minus",
    keywords: ["websocket", "disconnect", "leave", "close"],
    block: {
      type: "ws_server_onDisconnect",
      text: "when a client disconnects from {NAME}",
      parts: { NAME: { part: "text", value: "main" } },
      tooltip:
        "Runs when a client leaves, for any reason. You can still read its ID and data, but can't send to it anymore.",
    },
    params: [],
    provides: ["wsClient", "wsConnectedClient"],
    values: [
      {
        key: "code",
        label: "Close code",
        type: "Number",
        code: "wsCloseCode",
      },
      { key: "reason", label: "Close reason", type: "String", code: "wsCloseReason" },
    ],
    valuesBlock: {
      type: "ws_server_closeInfo",
      text: "{info}",
      parts: {
        info: {
          part: "dropdown",
          options: [
            ["close code", "wsCloseCode"],
            ["close reason", "wsCloseReason"],
          ],
        },
      },
      tooltip:
        "Why the client left. Code 1000 or 1001 is a normal close, 1006 means it dropped without a goodbye.",
      pick: { field: "info", keys: { wsCloseCode: "code", wsCloseReason: "reason" } },
      restrictions: [
        {
          type: "hasParent",
          blockTypes: ["ws_server_onDisconnect"],
          message: 'This block must be inside a "when a client disconnects" block.',
        },
      ],
    },
    settings: [
      input.text("NAME", "Server name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this server.",
      }),
    ],
    wrap: (ctx, body) =>
      `wsOnServer(${nameOf(ctx)}, "close", async (wsClient, wsCloseCode, wsCloseReason) => {\n${body}});`,
    dependencies: WS,
  }),
  event({
    id: "event_ws_server_verify",
    label: "When a client tries to connect to a WebSocket server",
    description:
      "Runs before a client is let in. Use Turn away this WebSocket client to refuse it, for example if its password is wrong.",
    category: "websockets",
    group: "WebSocket server",
    icon: "fa-solid fa-user-shield",
    keywords: ["websocket", "verify", "auth", "password", "login"],
    block: {
      type: "ws_server_onVerify",
      text: "when a client tries to connect to {NAME}",
      parts: { NAME: { part: "text", value: "main" } },
      tooltip:
        'Runs before a client is let in. Check things like a password in the URL (with "query parameter") and use "reject this connection" to turn them away. Anything saved to the client\'s data here is kept once they connect.',
    },
    params: [],
    provides: ["wsClient", "wsVerify"],
    settings: [
      input.text("NAME", "Server name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this server.",
      }),
    ],
    wrap: (ctx, body) => `wsOnServer(${nameOf(ctx)}, "verify", async (wsClient) => {\n${body}});`,
    dependencies: WS,
  }),
  event({
    id: "event_ws_server_start",
    label: "When a WebSocket server starts",
    description: "Runs when the server is ready for connections.",
    category: "websockets",
    group: "WebSocket server",
    icon: "fa-solid fa-tower-broadcast",
    keywords: ["websocket", "server", "started", "listening"],
    block: {
      type: "ws_server_onStart",
      text: "when WebSocket server {NAME} starts",
      parts: { NAME: { part: "text", value: "main" } },
      tooltip: "Runs once the server is up and ready for connections",
    },
    params: [],
    settings: [
      input.text("NAME", "Server name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this server.",
      }),
    ],
    wrap: (ctx, body) => `wsOnServer(${nameOf(ctx)}, "listening", async () => {\n${body}});`,
    dependencies: WS,
  }),
  event({
    id: "event_ws_server_error",
    label: "When a WebSocket server has an error",
    description: "Runs when something goes wrong with the server, like the port being taken.",
    category: "websockets",
    group: "WebSocket server",
    icon: "fa-solid fa-triangle-exclamation",
    keywords: ["websocket", "server", "error"],
    block: {
      type: "ws_server_onError",
      text: "when WebSocket server {NAME} has an error",
      parts: { NAME: { part: "text", value: "main" } },
      tooltip:
        "Runs when the server itself has a problem, like the port already being in use. Without this block, errors are printed to the console.",
    },
    params: [],
    values: [
      {
        key: "error",
        label: "Error message",
        type: "String",
        code: "(wsError?.message ?? String(wsError))",
        block: {
          type: "ws_server_errorMessage",
          text: "server error message",
          tooltip: "What went wrong, as text",
          restrictions: [
            {
              type: "hasParent",
              blockTypes: ["ws_server_onError"],
              message: 'This block must be inside a "when WebSocket server has an error" block.',
            },
          ],
        },
      },
    ],
    settings: [
      input.text("NAME", "Server name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this server.",
      }),
    ],
    wrap: (ctx, body) => `wsOnServer(${nameOf(ctx)}, "error", async (wsError) => {\n${body}});`,
    dependencies: WS,
  }),
];

const actions = [
  action({
    id: "ws_server_start",
    label: "Start a WebSocket server",
    description: "Starts a WebSocket server on a port, so others can connect to the bot.",
    category: "websockets",
    group: "WebSocket server",
    icon: "fa-solid fa-tower-broadcast",
    keywords: ["websocket", "server", "start", "host", "port"],
    block: {
      type: "ws_server_start",
      text: ["start WebSocket server {NAME}", "on port: {port}"],
      parts: { NAME: { part: "text", value: "main" } },
      inline: true,
      tooltip:
        'Starts a WebSocket server that apps and websites can connect to with ws://your-host:port. Most hosts tell you which port you\'re allowed to use. Put this in "when the bot starts".',
    },
    inputs: [
      input.text("NAME", "Server name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this server.",
      }),
      input.number("port", "Port", { default: 8080, min: 1, max: 65535, integer: true }),
    ],
    dependencies: WS,
    code: (ctx) => `wsStartServer(${nameOf(ctx)}, ${ctx.input("port")});\n`,
  }),
  action({
    id: "ws_server_stop",
    label: "Stop a WebSocket server",
    description: "Stops a server and disconnects everyone on it.",
    category: "websockets",
    group: "WebSocket server",
    icon: "fa-solid fa-power-off",
    keywords: ["websocket", "server", "stop"],
    block: {
      type: "ws_server_stop",
      text: "stop WebSocket server {NAME}",
      parts: { NAME: { part: "text", value: "main" } },
      tooltip: "Disconnects every client and stops the server",
    },
    inputs: [
      input.text("NAME", "Server name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this server.",
      }),
    ],
    dependencies: WS,
    code: (ctx) => `wsStopServer(${nameOf(ctx)});\n`,
  }),
  action({
    id: "ws_server_send_client",
    label: "Send a message to this WebSocket client",
    description:
      "Sends a message to the client these steps are about. Objects and lists are sent as JSON.",
    category: "websockets",
    group: "This client",
    icon: "fa-solid fa-paper-plane",
    keywords: ["websocket", "send", "reply"],
    block: {
      type: "ws_server_sendClient",
      text: ["send message {message}", "to this client"],
      inline: true,
      tooltip:
        "Sends a message to this client only. Text is sent as it is; objects and lists are sent as JSON.",
      restrictions: [
        {
          type: "hasParent",
          blockTypes: [
            "ws_server_onConnect",
            "ws_server_onMessage",
            "ws_server_onEvent",
            "ws_server_onDisconnect",
            "ws_server_forEachClient",
            "ws_server_forEachInGroup",
          ],
          message:
            'This block must be inside a "when a client connects / sends / disconnects" block or a "for each client" loop.',
        },
      ],
    },
    requires: ["wsClient", "wsConnectedClient"],
    inputs: [input.slot("message", "Message", ANY)],
    dependencies: WS,
    code: (ctx) => `wsSendTo(wsClient, ${ctx.has("message") ? ctx.input("message") : '""'});\n`,
  }),
  action({
    id: "ws_server_send_event_client",
    label: "Send an event to this WebSocket client",
    description: "Sends an event with data to the client these steps are about.",
    category: "websockets",
    group: "This client",
    icon: "fa-solid fa-bolt",
    keywords: ["websocket", "send", "event", "emit"],
    block: {
      type: "ws_server_sendEventClient",
      text: ["send event {event}", "with data {data}", "to this client"],
      inline: true,
      tooltip: 'Sends { "event": name, "data": data } as JSON to this client only',
      restrictions: [
        {
          type: "hasParent",
          blockTypes: [
            "ws_server_onConnect",
            "ws_server_onMessage",
            "ws_server_onEvent",
            "ws_server_onDisconnect",
            "ws_server_forEachClient",
            "ws_server_forEachInGroup",
          ],
          message:
            'This block must be inside a "when a client connects / sends / disconnects" block or a "for each client" loop.',
        },
      ],
    },
    requires: ["wsClient", "wsConnectedClient"],
    inputs: [
      input.text("event", "Event name", { default: "chat" }),
      input.slot("data", "Data", ANY, { optional: true }),
    ],
    dependencies: WS,
    code: (ctx) =>
      `wsSendTo(wsClient, wsEvent(${ctx.input("event")}, ${ctx.has("data") ? ctx.input("data") : "null"}));\n`,
  }),
  action({
    id: "ws_server_broadcast",
    label: "Send a message to every WebSocket client",
    description: "Sends a message to everyone connected to a server.",
    category: "websockets",
    group: "WebSocket server",
    icon: "fa-solid fa-bullhorn",
    keywords: ["websocket", "broadcast", "everyone", "all"],
    block: {
      type: "ws_server_broadcast",
      text: ["send message {message}", "to {WHO} on server {NAME}"],
      parts: {
        WHO: {
          options: [
            ["all clients", "all"],
            ["all clients except this one", "others"],
          ],
        },
        NAME: { part: "text", value: "main" },
      },
      inline: false,
      tooltip:
        'Sends a message to everyone connected. "all clients except this one" only works inside a "when a client…" block.',
    },
    inputs: [
      input.slot("message", "Message", ANY),
      input.dropdown(
        "WHO",
        "Send to",
        [
          ["All clients", "all"],
          ["All clients except this one", "others"],
        ],
        { default: "all" },
      ),
      input.text("NAME", "Server name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this server.",
      }),
    ],
    dependencies: WS,
    code: (ctx) =>
      `wsSendToMany(wsServerClients(${nameOf(ctx)}), ${ctx.has("message") ? ctx.input("message") : '""'}${ctx.raw("WHO") === "others" ? ', (typeof wsClient === "undefined" ? null : wsClient)' : ""});\n`,
  }),
  action({
    id: "ws_server_broadcast_event",
    label: "Send an event to every WebSocket client",
    description: "Sends an event with data to everyone connected to a server.",
    category: "websockets",
    group: "WebSocket server",
    icon: "fa-solid fa-bullhorn",
    keywords: ["websocket", "broadcast", "event", "everyone"],
    block: {
      type: "ws_server_broadcastEvent",
      text: ["send event {event}", "with data {data}", "to {WHO} on server {NAME}"],
      parts: {
        WHO: {
          options: [
            ["all clients", "all"],
            ["all clients except this one", "others"],
          ],
        },
        NAME: { part: "text", value: "main" },
      },
      inline: false,
      tooltip:
        'Sends an event to everyone connected. "all clients except this one" only works inside a "when a client…" block.',
    },
    inputs: [
      input.text("event", "Event name", { default: "chat" }),
      input.slot("data", "Data", ANY, { optional: true }),
      input.dropdown(
        "WHO",
        "Send to",
        [
          ["All clients", "all"],
          ["All clients except this one", "others"],
        ],
        { default: "all" },
      ),
      input.text("NAME", "Server name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this server.",
      }),
    ],
    dependencies: WS,
    code: (ctx) =>
      `wsSendToMany(wsServerClients(${nameOf(ctx)}), wsEvent(${ctx.input("event")}, ${ctx.has("data") ? ctx.input("data") : "null"})${ctx.raw("WHO") === "others" ? ', (typeof wsClient === "undefined" ? null : wsClient)' : ""});\n`,
  }),
  action({
    id: "ws_server_send_id",
    label: "Send a message to a WebSocket client by ID",
    description: "Sends a message to one client, by its ID.",
    category: "websockets",
    group: "WebSocket server",
    icon: "fa-solid fa-paper-plane",
    keywords: ["websocket", "send", "id", "direct"],
    block: {
      type: "ws_server_sendId",
      text: ["send message {message}", "to client with ID {id}", "on server {NAME}"],
      parts: { NAME: { part: "text", value: "main" } },
      inline: false,
      tooltip: "Sends a message to one client, found by its ID. Works anywhere.",
    },
    inputs: [
      input.slot("message", "Message", ANY),
      input.text("id", "Client ID", { default: "" }),
      input.text("NAME", "Server name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this server.",
      }),
    ],
    dependencies: WS,
    code: (ctx) =>
      `wsSendToId(${nameOf(ctx)}, ${ctx.input("id")}, ${ctx.has("message") ? ctx.input("message") : '""'});\n`,
  }),
  action({
    id: "ws_server_send_event_id",
    label: "Send an event to a WebSocket client by ID",
    description: "Sends an event with data to one client, by its ID.",
    category: "websockets",
    group: "WebSocket server",
    icon: "fa-solid fa-bolt",
    keywords: ["websocket", "send", "event", "id"],
    block: {
      type: "ws_server_sendEventId",
      text: [
        "send event {event}",
        "with data {data}",
        "to client with ID {id}",
        "on server {NAME}",
      ],
      parts: { NAME: { part: "text", value: "main" } },
      inline: false,
      tooltip: "Sends an event to one client, found by its ID. Works anywhere.",
    },
    inputs: [
      input.text("event", "Event name", { default: "chat" }),
      input.slot("data", "Data", ANY, { optional: true }),
      input.text("id", "Client ID", { default: "" }),
      input.text("NAME", "Server name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this server.",
      }),
    ],
    dependencies: WS,
    code: (ctx) =>
      `wsSendToId(${nameOf(ctx)}, ${ctx.input("id")}, wsEvent(${ctx.input("event")}, ${ctx.has("data") ? ctx.input("data") : "null"}));\n`,
  }),
  action({
    id: "ws_server_set_data",
    label: "Save something on this WebSocket client",
    description:
      "Remembers a value on the client, like its username, for as long as it's connected.",
    category: "websockets",
    group: "This client",
    icon: "fa-solid fa-floppy-disk",
    keywords: ["websocket", "data", "store", "remember"],
    block: {
      type: "ws_server_setData",
      text: ["set {key}", "of this client's data to {value}"],
      inline: true,
      tooltip:
        "Remembers something about this client for as long as it's connected, like its username after it logs in",
      restrictions: [
        {
          type: "hasParent",
          blockTypes: [
            "ws_server_onConnect",
            "ws_server_onMessage",
            "ws_server_onEvent",
            "ws_server_onDisconnect",
            "ws_server_forEachClient",
            "ws_server_forEachInGroup",
            "ws_server_onVerify",
          ],
          message:
            'This block must be inside a "when a client…" block or a "for each client" loop, so it knows which client "this client" is.',
        },
      ],
    },
    requires: ["wsClient"],
    inputs: [
      input.text("key", "Name", { default: "" }),
      input.slot("value", "Value", ANY, { optional: true }),
    ],
    dependencies: WS,
    code: (ctx) =>
      `if (wsClient?.disfuse) wsClient.disfuse.data[${ctx.input("key")}] = ${ctx.has("value") ? ctx.input("value") : "null"};\n`,
  }),
  action({
    id: "ws_server_group_join",
    label: "Add or remove this WebSocket client from a group",
    description:
      "Groups let you send a message to some clients at once, like everyone in a chat room.",
    category: "websockets",
    group: "This client",
    icon: "fa-solid fa-people-group",
    keywords: ["websocket", "group", "room", "join", "leave"],
    block: {
      type: "ws_server_joinGroup",
      text: "{action} group {group}",
      parts: {
        action: {
          options: [
            ["add this client to", "add"],
            ["remove this client from", "delete"],
          ],
        },
      },
      tooltip:
        "Groups are like chat rooms: put clients in one, then send a message to everyone in it at once. A client can be in many groups.",
      restrictions: [
        {
          type: "hasParent",
          blockTypes: [
            "ws_server_onConnect",
            "ws_server_onMessage",
            "ws_server_onEvent",
            "ws_server_onDisconnect",
            "ws_server_forEachClient",
            "ws_server_forEachInGroup",
            "ws_server_onVerify",
          ],
          message:
            'This block must be inside a "when a client…" block or a "for each client" loop, so it knows which client "this client" is.',
        },
      ],
    },
    requires: ["wsClient"],
    inputs: [
      input.dropdown(
        "action",
        "Do",
        [
          ["Add to", "add"],
          ["Remove from", "delete"],
        ],
        { default: "add" },
      ),
      input.text("group", "Group", { default: "" }),
    ],
    dependencies: WS,
    code: (ctx) =>
      `wsClient?.disfuse?.groups.${ctx.raw("action") === "delete" ? "delete" : "add"}(String(${ctx.input("group")}));\n`,
  }),
  action({
    id: "ws_server_send_group",
    label: "Send a message to a WebSocket group",
    description: "Sends a message to everyone in a group.",
    category: "websockets",
    group: "WebSocket server",
    icon: "fa-solid fa-people-group",
    keywords: ["websocket", "group", "room", "send"],
    block: {
      type: "ws_server_sendGroup",
      text: [
        "send message {message}",
        "to everyone in group {group}",
        "on server {NAME} except this client {except}",
      ],
      parts: { NAME: { part: "text", value: "main" }, except: { part: "checkbox" } },
      inline: false,
      tooltip:
        'Sends a message to every client in the group. Check "except this client" to skip the one that sent it (only inside a "when a client…" block).',
    },
    inputs: [
      input.slot("message", "Message", ANY),
      input.text("group", "Group", { default: "" }),
      input.text("NAME", "Server name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this server.",
      }),
      input.boolean("except", "Leave out this client", { default: false, allowValues: false }),
    ],
    dependencies: WS,
    code: (ctx) =>
      `wsSendToMany(wsGroupClients(${nameOf(ctx)}, ${ctx.input("group")}), ${ctx.has("message") ? ctx.input("message") : '""'}${ctx.raw("except") === true ? ', (typeof wsClient === "undefined" ? null : wsClient)' : ""});\n`,
  }),
  action({
    id: "ws_server_send_event_group",
    label: "Send an event to a WebSocket group",
    description: "Sends an event with data to everyone in a group.",
    category: "websockets",
    group: "WebSocket server",
    icon: "fa-solid fa-people-group",
    keywords: ["websocket", "group", "room", "event"],
    block: {
      type: "ws_server_sendEventGroup",
      text: [
        "send event {event}",
        "with data {data}",
        "to everyone in group {group}",
        "on server {NAME} except this client {except}",
      ],
      parts: { NAME: { part: "text", value: "main" }, except: { part: "checkbox" } },
      inline: false,
      tooltip: "Sends an event to every client in the group",
    },
    inputs: [
      input.text("event", "Event name", { default: "chat" }),
      input.slot("data", "Data", ANY, { optional: true }),
      input.text("group", "Group", { default: "" }),
      input.text("NAME", "Server name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this server.",
      }),
      input.boolean("except", "Leave out this client", { default: false, allowValues: false }),
    ],
    dependencies: WS,
    code: (ctx) =>
      `wsSendToMany(wsGroupClients(${nameOf(ctx)}, ${ctx.input("group")}), wsEvent(${ctx.input("event")}, ${ctx.has("data") ? ctx.input("data") : "null"})${ctx.raw("except") === true ? ', (typeof wsClient === "undefined" ? null : wsClient)' : ""});\n`,
  }),
  action({
    id: "ws_server_each_in_group",
    label: "Repeat with each WebSocket client in a group",
    description: "Runs the steps inside once for each client in a group.",
    category: "websockets",
    group: "WebSocket server",
    icon: "fa-solid fa-people-group",
    keywords: ["websocket", "group", "for each", "loop"],
    block: {
      type: "ws_server_forEachInGroup",
      text: ["for each client in group {group}", "on server {NAME}", "do {code}"],
      parts: { NAME: { part: "text", value: "main" }, code: { check: "default" } },
      inline: true,
      tooltip:
        'Runs the blocks inside once for every client in the group. Inside, "this client" means the one the loop is on.',
    },
    inputs: [
      input.text("group", "Group", { default: "" }),
      input.text("NAME", "Server name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this server.",
      }),
    ],
    branches: [
      {
        key: "code",
        label: "Do",
        inline: true,
        contexts: ["wsClient", "wsConnectedClient", "loop"],
      },
    ],
    dependencies: WS,
    code: (ctx) =>
      `for (const wsClient of wsGroupClients(${nameOf(ctx)}, ${ctx.input("group")})) {\n${ctx.branch("code")}}\n`,
  }),
  action({
    id: "ws_server_each_client",
    label: "Repeat with each connected WebSocket client",
    description: "Runs the steps inside once for each client connected to a server.",
    category: "websockets",
    group: "WebSocket server",
    icon: "fa-solid fa-users",
    keywords: ["websocket", "clients", "for each", "loop"],
    block: {
      type: "ws_server_forEachClient",
      text: ["for each client connected to {NAME}", "do {code}"],
      parts: { NAME: { part: "text", value: "main" }, code: { check: "default" } },
      tooltip:
        'Runs the blocks inside once for every connected client. Inside, "this client" means the one the loop is on.',
    },
    inputs: [
      input.text("NAME", "Server name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this server.",
      }),
    ],
    branches: [
      {
        key: "code",
        label: "Do",
        inline: true,
        contexts: ["wsClient", "wsConnectedClient", "loop"],
      },
    ],
    dependencies: WS,
    code: (ctx) =>
      `for (const wsClient of wsServerClients(${nameOf(ctx)})) {\n${ctx.branch("code")}}\n`,
  }),
  action({
    id: "ws_server_reject",
    label: "Turn away this WebSocket client",
    description: "Refuses the client trying to connect. Nothing after this step runs.",
    category: "websockets",
    group: "This client",
    icon: "fa-solid fa-user-slash",
    keywords: ["websocket", "reject", "deny", "refuse", "unauthorized"],
    block: {
      type: "ws_server_reject",
      text: "reject this connection with reason {reason}",
      tooltip:
        "Turns the client away before it connects, and stops the blocks after it. Only letters, numbers and punctuation are sent in the reason.",
      next: false,
      restrictions: [
        {
          type: "hasParent",
          blockTypes: ["ws_server_onVerify"],
          message: 'This block must be inside a "when a client tries to connect" block.',
        },
      ],
    },
    requires: ["wsVerify"],
    inputs: [input.text("reason", "Reason", { default: "Unauthorized" })],
    dependencies: WS,
    terminal: true,
    code: (ctx) => `wsClient.disfuse.rejected = String(${ctx.input("reason")});\nreturn;\n`,
  }),
  action({
    id: "ws_server_kick",
    label: "Disconnect this WebSocket client",
    description: "Disconnects the client these steps are about.",
    category: "websockets",
    group: "This client",
    icon: "fa-solid fa-plug-circle-xmark",
    keywords: ["websocket", "kick", "disconnect"],
    block: {
      type: "ws_server_kick",
      text: ["disconnect this client", "close code: {code}", "reason: {reason}"],
      tooltip:
        "Closes this client's connection. Close code 1000 means a normal close. Custom codes must be between 3000 and 4999.",
      restrictions: [
        {
          type: "hasParent",
          blockTypes: [
            "ws_server_onConnect",
            "ws_server_onMessage",
            "ws_server_onEvent",
            "ws_server_onDisconnect",
            "ws_server_forEachClient",
            "ws_server_forEachInGroup",
          ],
          message:
            'This block must be inside a "when a client connects / sends / disconnects" block or a "for each client" loop.',
        },
      ],
    },
    requires: ["wsClient", "wsConnectedClient"],
    inputs: [
      input.number("code", "Close code", {
        default: 1000,
        help: "1000 means a normal close. Your own codes go from 3000 to 4999.",
        integer: true,
      }),
      input.text("reason", "Reason (optional)", { default: "" }),
    ],
    dependencies: WS,
    code: (ctx) =>
      `wsClient?.close?.(...wsCloseArgs(${ctx.input("code")}, ${ctx.input("reason")}));\n`,
  }),
  action({
    id: "ws_server_kick_id",
    label: "Disconnect a WebSocket client by ID",
    description: "Disconnects one client, by its ID.",
    category: "websockets",
    group: "WebSocket server",
    icon: "fa-solid fa-plug-circle-xmark",
    keywords: ["websocket", "kick", "disconnect", "id"],
    block: {
      type: "ws_server_kickId",
      text: ["disconnect client with ID {id}", "on server {NAME}", "reason: {reason}"],
      parts: { NAME: { part: "text", value: "main" } },
      inline: false,
      tooltip: "Closes one client's connection, found by its ID. Works anywhere.",
    },
    inputs: [
      input.text("id", "Client ID", { default: "" }),
      input.text("NAME", "Server name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this server.",
      }),
      input.text("reason", "Reason (optional)", { default: "" }),
    ],
    dependencies: WS,
    code: (ctx) =>
      `wsServers[${nameOf(ctx)}]?.clients.get(String(${ctx.input("id")}))?.close(...wsCloseArgs(1000, ${ctx.input("reason")}));\n`,
  }),
];

const values = [
  value({
    id: "ws_server_running",
    label: "WebSocket server is running?",
    description: "True if the server is running.",
    category: "websockets",
    group: "WebSocket server",
    icon: "fa-solid fa-signal",
    keywords: ["websocket", "server", "running"],
    block: {
      type: "ws_server_isRunning",
      text: "WebSocket server {NAME} is running?",
      parts: { NAME: { part: "text", value: "main" } },
      tooltip: "True if the server has been started and not stopped",
    },
    output: "Boolean",
    inputs: [
      input.text("NAME", "Server name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this server.",
      }),
    ],
    dependencies: WS,
    code: (ctx) => `Boolean(wsServers[${nameOf(ctx)}]?.server)`,
  }),
  value({
    id: "ws_server_client_info",
    label: "About this WebSocket client",
    description:
      "Something about the client these steps are about: its ID, IP address, website, path, full address or groups.",
    category: "websockets",
    group: "This client",
    icon: "fa-solid fa-circle-info",
    keywords: ["websocket", "client", "id", "ip", "origin"],
    block: {
      type: "ws_server_clientInfo",
      text: "{info} of this client",
      parts: {
        info: {
          options: [
            ["ID", "id"],
            ["IP address", "ip"],
            ["website (origin)", "origin"],
            ["path it connected to", "path"],
            ["full URL it connected to", "url"],
            ["list of groups", "groups"],
          ],
        },
      },
      tooltip:
        'Information about this client. The ID is unique and can be saved and used later with "send to client with ID".',
      restrictions: [
        {
          type: "hasParent",
          blockTypes: [
            "ws_server_onConnect",
            "ws_server_onMessage",
            "ws_server_onEvent",
            "ws_server_onDisconnect",
            "ws_server_forEachClient",
            "ws_server_forEachInGroup",
            "ws_server_onVerify",
          ],
          message:
            'This block must be inside a "when a client…" block or a "for each client" loop, so it knows which client "this client" is.',
        },
      ],
    },
    requires: ["wsClient"],
    output: ANY,
    inputs: [
      input.dropdown(
        "info",
        "What",
        [
          ["ID", "id"],
          ["IP address", "ip"],
          ["Website it's from (origin)", "origin"],
          ["Path it connected to", "path"],
          ["Full address it connected to", "url"],
          ["Groups (list)", "groups"],
        ],
        { default: "id" },
      ),
    ],
    dependencies: WS,
    code: (ctx) => `wsClientInfo(wsClient, ${ctx.input("info")})`,
  }),
  value({
    id: "ws_server_client_query",
    label: "Setting from this WebSocket client's address",
    description:
      "A value from the end of the address the client connected with, like token in ws://host/?token=abc.",
    category: "websockets",
    group: "This client",
    icon: "fa-solid fa-link",
    keywords: ["websocket", "query", "url parameter"],
    block: {
      type: "ws_server_clientQuery",
      text: ["query parameter {key}", "of this client's URL"],
      inline: true,
      tooltip:
        'A value from the end of the URL the client connected with. For ws://host:8080/?token=abc, the parameter "token" is "abc".',
      restrictions: [
        {
          type: "hasParent",
          blockTypes: [
            "ws_server_onConnect",
            "ws_server_onMessage",
            "ws_server_onEvent",
            "ws_server_onDisconnect",
            "ws_server_forEachClient",
            "ws_server_forEachInGroup",
            "ws_server_onVerify",
          ],
          message:
            'This block must be inside a "when a client…" block or a "for each client" loop, so it knows which client "this client" is.',
        },
      ],
    },
    requires: ["wsClient"],
    output: "String",
    inputs: [input.text("key", "Name", { default: "" })],
    dependencies: WS,
    code: (ctx) => `wsClientQuery(wsClient, ${ctx.input("key")})`,
  }),
  value({
    id: "ws_server_client_header",
    label: "Header this WebSocket client sent",
    description: "A header the client connected with, like authorization.",
    category: "websockets",
    group: "This client",
    icon: "fa-solid fa-list",
    keywords: ["websocket", "header"],
    block: {
      type: "ws_server_clientHeader",
      text: ["header {key}", "this client connected with"],
      inline: true,
      tooltip: 'A header the client sent when it connected, like "user-agent" or "authorization"',
      restrictions: [
        {
          type: "hasParent",
          blockTypes: [
            "ws_server_onConnect",
            "ws_server_onMessage",
            "ws_server_onEvent",
            "ws_server_onDisconnect",
            "ws_server_forEachClient",
            "ws_server_forEachInGroup",
            "ws_server_onVerify",
          ],
          message:
            'This block must be inside a "when a client…" block or a "for each client" loop, so it knows which client "this client" is.',
        },
      ],
    },
    requires: ["wsClient"],
    output: "String",
    inputs: [input.text("key", "Header name", { default: "" })],
    dependencies: WS,
    code: (ctx) => `wsClientHeader(wsClient, ${ctx.input("key")})`,
  }),
  value({
    id: "ws_server_client_connected",
    label: "This WebSocket client is still connected?",
    description: "True if the client these steps are about is still connected.",
    category: "websockets",
    group: "This client",
    icon: "fa-solid fa-signal",
    keywords: ["websocket", "connected"],
    block: {
      type: "ws_server_clientIsConnected",
      text: "this client is still connected?",
      tooltip: "True if this client hasn't disconnected yet",
      restrictions: [
        {
          type: "hasParent",
          blockTypes: [
            "ws_server_onConnect",
            "ws_server_onMessage",
            "ws_server_onEvent",
            "ws_server_onDisconnect",
            "ws_server_forEachClient",
            "ws_server_forEachInGroup",
          ],
          message:
            'This block must be inside a "when a client connects / sends / disconnects" block or a "for each client" loop.',
        },
      ],
    },
    requires: ["wsClient", "wsConnectedClient"],
    output: "Boolean",
    dependencies: WS,
    code: () => "(wsClient?.readyState === WebSocket.OPEN)",
  }),
  value({
    id: "ws_server_get_data",
    label: "Something saved on this WebSocket client",
    description: "A value saved on the client with Save something on this WebSocket client.",
    category: "websockets",
    group: "This client",
    icon: "fa-solid fa-box-open",
    keywords: ["websocket", "data", "get"],
    block: {
      type: "ws_server_getData",
      text: ["get {key}", "of this client's data"],
      inline: true,
      tooltip: 'Something you saved about this client with "set … of this client\'s data"',
      restrictions: [
        {
          type: "hasParent",
          blockTypes: [
            "ws_server_onConnect",
            "ws_server_onMessage",
            "ws_server_onEvent",
            "ws_server_onDisconnect",
            "ws_server_forEachClient",
            "ws_server_forEachInGroup",
            "ws_server_onVerify",
          ],
          message:
            'This block must be inside a "when a client…" block or a "for each client" loop, so it knows which client "this client" is.',
        },
      ],
    },
    requires: ["wsClient"],
    output: ANY,
    inputs: [input.text("key", "Name", { default: "" })],
    dependencies: WS,
    code: (ctx) => `(wsClient?.disfuse?.data[${ctx.input("key")}] ?? null)`,
  }),
  value({
    id: "ws_server_get_data_id",
    label: "Something saved on a WebSocket client by ID",
    description: "A value saved on a client, found by its ID.",
    category: "websockets",
    group: "WebSocket server",
    icon: "fa-solid fa-box-open",
    keywords: ["websocket", "data", "get", "id"],
    block: {
      type: "ws_server_getDataById",
      text: ["get {key}", "of the data of client with ID {id}", "on server {NAME}"],
      parts: { NAME: { part: "text", value: "main" } },
      inline: true,
      tooltip: "Something you saved about a client, found by its ID. Works anywhere.",
    },
    output: ANY,
    inputs: [
      input.text("key", "Name", { default: "" }),
      input.text("id", "Client ID", { default: "" }),
      input.text("NAME", "Server name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this server.",
      }),
    ],
    dependencies: WS,
    code: (ctx) =>
      `(wsServers[${nameOf(ctx)}]?.clients.get(String(${ctx.input("id")}))?.disfuse.data[${ctx.input("key")}] ?? null)`,
  }),
  value({
    id: "ws_server_in_group",
    label: "This WebSocket client is in a group?",
    description: "True if the client is in a group.",
    category: "websockets",
    group: "This client",
    icon: "fa-solid fa-people-group",
    keywords: ["websocket", "group", "room"],
    block: {
      type: "ws_server_inGroup",
      text: ["this client is in group {group}", "?"],
      inline: true,
      tooltip: "True if this client has been added to the group",
      restrictions: [
        {
          type: "hasParent",
          blockTypes: [
            "ws_server_onConnect",
            "ws_server_onMessage",
            "ws_server_onEvent",
            "ws_server_onDisconnect",
            "ws_server_forEachClient",
            "ws_server_forEachInGroup",
            "ws_server_onVerify",
          ],
          message:
            'This block must be inside a "when a client…" block or a "for each client" loop, so it knows which client "this client" is.',
        },
      ],
    },
    requires: ["wsClient"],
    output: "Boolean",
    inputs: [input.text("group", "Group", { default: "" })],
    dependencies: WS,
    code: (ctx) => `Boolean(wsClient?.disfuse?.groups.has(String(${ctx.input("group")})))`,
  }),
  value({
    id: "ws_server_group_info",
    label: "WebSocket clients in a group",
    description: "How many clients are in a group, or a list of their IDs.",
    category: "websockets",
    group: "WebSocket server",
    icon: "fa-solid fa-users",
    keywords: ["websocket", "group", "count", "members"],
    block: {
      type: "ws_server_groupInfo",
      text: ["{info} in group {group}", "on server {NAME}"],
      parts: {
        info: {
          options: [
            ["number of clients", "count"],
            ["list of client IDs", "ids"],
          ],
        },
        NAME: { part: "text", value: "main" },
      },
      inline: true,
      tooltip: "Who is in a group right now",
      output: null,
    },
    output: ["Number", "Array"],
    inputs: [
      input.dropdown(
        "info",
        "Get",
        [
          ["Number of clients", "count"],
          ["List of client IDs", "ids"],
        ],
        { default: "count" },
      ),
      input.text("group", "Group", { default: "" }),
      input.text("NAME", "Server name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this server.",
      }),
    ],
    dependencies: WS,
    code: (ctx) =>
      ctx.raw("info") === "ids"
        ? `wsGroupClients(${nameOf(ctx)}, ${ctx.input("group")}).map((socket) => socket.disfuse.id)`
        : `wsGroupClients(${nameOf(ctx)}, ${ctx.input("group")}).length`,
  }),
  value({
    id: "ws_server_clients",
    label: "Connected WebSocket clients",
    description: "How many clients are connected to a server, or a list of their IDs.",
    category: "websockets",
    group: "WebSocket server",
    icon: "fa-solid fa-users",
    keywords: ["websocket", "clients", "count", "online"],
    block: {
      type: "ws_server_clientsInfo",
      text: "{info} on server {NAME}",
      parts: {
        info: {
          options: [
            ["number of connected clients", "count"],
            ["list of connected client IDs", "ids"],
          ],
        },
        NAME: { part: "text", value: "main" },
      },
      tooltip: "Everyone connected to the server right now",
      output: null,
    },
    output: ["Number", "Array"],
    inputs: [
      input.dropdown(
        "info",
        "Get",
        [
          ["Number of clients", "count"],
          ["List of client IDs", "ids"],
        ],
        { default: "count" },
      ),
      input.text("NAME", "Server name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this server.",
      }),
    ],
    dependencies: WS,
    code: (ctx) =>
      ctx.raw("info") === "ids"
        ? `wsServerClients(${nameOf(ctx)}).map((socket) => socket.disfuse.id)`
        : `wsServerClients(${nameOf(ctx)}).length`,
  }),
  value({
    id: "ws_server_id_connected",
    label: "WebSocket client is connected?",
    description: "True if a client with this ID is connected to a server.",
    category: "websockets",
    group: "WebSocket server",
    icon: "fa-solid fa-user-check",
    keywords: ["websocket", "connected", "online", "id"],
    block: {
      type: "ws_server_idConnected",
      text: ["client with ID {id}", "is connected to server {NAME} ?"],
      parts: { NAME: { part: "text", value: "main" } },
      inline: true,
      tooltip: "True if a client with this ID is connected right now",
    },
    output: "Boolean",
    inputs: [
      input.text("id", "Client ID", { default: "" }),
      input.text("NAME", "Server name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this server.",
      }),
    ],
    dependencies: WS,
    code: (ctx) => `Boolean(wsServers[${nameOf(ctx)}]?.clients.has(String(${ctx.input("id")})))`,
  }),
];

const components = [];

export default {
  events,
  actions,
  values,
  components,
  contexts: [
    {
      key: "wsClient",
      label: "a WebSocket client",
      description:
        "Only works in a WebSocket server's events, or while repeating with its clients.",
      variable: "wsClient",
    },
    {
      key: "wsConnectedClient",
      label: "a connected WebSocket client",
      description:
        'Only works once a client is connected: in the server\'s events (not "tries to connect"), or while repeating with its clients.',
      variable: "wsClient",
    },
    {
      key: "wsVerify",
      label: "a WebSocket client trying to connect",
      description: 'Only works in "When a client tries to connect to a WebSocket server".',
      variable: "wsClient",
    },
  ],
};
