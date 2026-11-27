/* =====================================================================
   Builder catalog: WebSocket and Socket.IO connections
   ---------------------------------------------------------------------
   Connecting the bot to a WebSocket or Socket.IO server somewhere
   else, to send and receive live messages.

   Each connection has a name ("main" unless you change it), so any step
   anywhere can use it. The "When..." events can be set up before or
   after connecting, and keep working if the connection drops and comes
   back.
   ===================================================================== */

import { ANY, group, input } from "../define.js";
import { sioClientRuntime, wsRuntime } from "../../blocks/lib/websocketRuntime.js";

const { event, action, value } = group({ colour: "#4C6EF5" });

const WS = [{ package: "ws", code: wsRuntime }];
const SIO_CLIENT = [{ package: "socket.io-client", code: sioClientRuntime }];

/** A connection or server name, as a string in the code. */
const nameOf = (ctx) => JSON.stringify(String(ctx.raw("NAME") ?? "").trim() || "main");

const events = [
  event({
    id: "event_ws_open",
    label: "When a WebSocket connection opens",
    description: "Runs each time a connection opens, including after reconnecting.",
    category: "websockets",
    group: "WebSocket connections",
    icon: "fa-solid fa-plug-circle-check",
    keywords: ["websocket", "open", "connected"],
    block: {
      type: "ws_client_onOpen",
      text: "when connection {NAME} opens",
      parts: { NAME: { part: "text", value: "main" } },
      tooltip:
        "Runs every time the connection opens, including after it reconnects. A good place to log in or subscribe to things.",
    },
    params: [],
    settings: [
      input.text("NAME", "Connection name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this connection.",
      }),
    ],
    wrap: (ctx, body) => `wsOnConnection(${nameOf(ctx)}, "open", async () => {\n${body}});`,
    dependencies: WS,
  }),
  event({
    id: "event_ws_message",
    label: "When a WebSocket connection gets a message",
    description: "Runs every time a message comes in on a connection.",
    category: "websockets",
    group: "WebSocket connections",
    icon: "fa-solid fa-envelope-open-text",
    keywords: ["websocket", "message", "receive"],
    block: {
      type: "ws_client_onMessage",
      text: "when connection {NAME} receives a message",
      parts: { NAME: { part: "text", value: "main" } },
      tooltip: "Runs every time the server sends a message",
    },
    params: [],
    values: [
      {
        key: "message",
        label: "The message",
        type: "String",
        code: "wsMessage",
        block: {
          type: "ws_client_message",
          text: "received message",
          tooltip: "The message the server sent, as text",
          restrictions: [
            {
              type: "hasParent",
              blockTypes: ["ws_client_onMessage", "ws_client_onEvent"],
              message:
                'This block must be inside a "when connection … receives a message" or "receives event" block.',
            },
          ],
          also: ["event_ws_event"],
        },
      },
      {
        key: "json",
        label: "The message as an object",
        type: "object",
        code: "wsParseJson(wsMessage)",
        description: "Empty if the message isn't JSON.",
        block: {
          type: "ws_client_messageJson",
          text: "received message as object (JSON)",
          tooltip:
            "The message the server sent, read as JSON. Use the Objects blocks to get keys from it. Empty if the message isn't JSON.",
          restrictions: [
            {
              type: "hasParent",
              blockTypes: ["ws_client_onMessage", "ws_client_onEvent"],
              message:
                'This block must be inside a "when connection … receives a message" or "receives event" block.',
            },
          ],
          also: ["event_ws_event"],
        },
      },
    ],
    settings: [
      input.text("NAME", "Connection name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this connection.",
      }),
    ],
    wrap: (ctx, body) =>
      `wsOnConnection(${nameOf(ctx)}, "message", async (wsMessage) => {\n${body}});`,
    dependencies: WS,
  }),
  event({
    id: "event_ws_event",
    label: "When a WebSocket connection gets an event",
    description:
      'Runs when a JSON message like { "event": "chat", "data": ... } comes in with the event name you pick.',
    category: "websockets",
    group: "WebSocket connections",
    icon: "fa-solid fa-bolt",
    keywords: ["websocket", "event", "receive"],
    block: {
      type: "ws_client_onEvent",
      text: "when connection {NAME} receives event {EVENT}",
      parts: { NAME: { part: "text", value: "main" }, EVENT: { part: "text", value: "chat" } },
      tooltip:
        'Runs when the server sends JSON like { "event": "chat", "data": ... } with this event name. Use "event data" inside it.',
    },
    params: [],
    values: [
      {
        key: "data",
        label: "Event data",
        type: ANY,
        code: "wsEventData",
        block: {
          type: "ws_client_eventData",
          text: "event data",
          tooltip:
            'The "data" part of the event the server sent. It can be text, a number, an object or a list.',
          restrictions: [
            {
              type: "hasParent",
              blockTypes: ["ws_client_onEvent"],
              message: 'This block must be inside a "when connection … receives event" block.',
            },
          ],
        },
      },
      { key: "message", label: "The whole message", type: "String", code: "wsMessage" },
      {
        key: "json",
        label: "The message as an object",
        type: "object",
        code: "wsParseJson(wsMessage)",
        description: "Empty if the message isn't JSON.",
      },
    ],
    settings: [
      input.text("NAME", "Connection name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this connection.",
      }),
      input.text("EVENT", "Event name", { default: "chat", allowValues: false }),
    ],
    wrap: (ctx, body) => `wsOnConnection(${nameOf(ctx)}, "message", async (wsMessage) => {
const wsReceivedEvent = wsParseJson(wsMessage);
if (wsReceivedEvent?.event !== ${JSON.stringify(String(ctx.raw("EVENT") ?? ""))}) return;
const wsEventData = wsReceivedEvent.data;
${body}});`,
    dependencies: WS,
  }),
  event({
    id: "event_ws_close",
    label: "When a WebSocket connection closes",
    description: "Runs each time a connection closes or drops.",
    category: "websockets",
    group: "WebSocket connections",
    icon: "fa-solid fa-plug-circle-xmark",
    keywords: ["websocket", "close", "disconnected"],
    block: {
      type: "ws_client_onClose",
      text: "when connection {NAME} closes",
      parts: { NAME: { part: "text", value: "main" } },
      tooltip: "Runs when the connection closes, whether you closed it or the server did",
    },
    params: [],
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
      type: "ws_client_closeInfo",
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
        "Why the connection closed. Code 1000 is a normal close, 1006 means it dropped without a goodbye.",
      pick: { field: "info", keys: { wsCloseCode: "code", wsCloseReason: "reason" } },
      restrictions: [
        {
          type: "hasParent",
          blockTypes: ["ws_client_onClose"],
          message: 'This block must be inside a "when connection … closes" block.',
        },
      ],
    },
    settings: [
      input.text("NAME", "Connection name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this connection.",
      }),
    ],
    wrap: (ctx, body) =>
      `wsOnConnection(${nameOf(ctx)}, "close", async (wsCloseCode, wsCloseReason) => {\n${body}});`,
    dependencies: WS,
  }),
  event({
    id: "event_ws_error",
    label: "When a WebSocket connection has an error",
    description: "Runs when something goes wrong with a connection.",
    category: "websockets",
    group: "WebSocket connections",
    icon: "fa-solid fa-triangle-exclamation",
    keywords: ["websocket", "error"],
    block: {
      type: "ws_client_onError",
      text: "when connection {NAME} has an error",
      parts: { NAME: { part: "text", value: "main" } },
      tooltip:
        "Runs when something goes wrong, like the server being unreachable. Without this block, errors are printed to the console.",
    },
    params: [],
    values: [
      {
        key: "error",
        label: "Error message",
        type: "String",
        code: "(wsError?.message ?? String(wsError))",
        block: {
          type: "ws_client_errorMessage",
          text: "error message",
          tooltip: "What went wrong, as text",
          restrictions: [
            {
              type: "hasParent",
              blockTypes: ["ws_client_onError"],
              message: 'This block must be inside a "when connection … has an error" block.',
            },
          ],
        },
      },
    ],
    settings: [
      input.text("NAME", "Connection name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this connection.",
      }),
    ],
    wrap: (ctx, body) => `wsOnConnection(${nameOf(ctx)}, "error", async (wsError) => {\n${body}});`,
    dependencies: WS,
  }),
  event({
    id: "event_sio_connect",
    label: "When a Socket.IO connection connects",
    description: "Runs each time a connection connects, including after reconnecting.",
    category: "websockets",
    group: "Socket.IO connections",
    icon: "fa-solid fa-plug-circle-check",
    keywords: ["socket.io", "connect", "connected"],
    block: {
      type: "sio_client_onConnect",
      text: "when Socket.IO connection {NAME} connects",
      parts: { NAME: { part: "text", value: "main" } },
      colour: "#AE3EC9",
      tooltip: "Runs every time the connection is made, including after reconnecting",
    },
    params: [],
    settings: [
      input.text("NAME", "Connection name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this connection.",
      }),
    ],
    wrap: (ctx, body) => `sioOnClient(${nameOf(ctx)}, "connect", async () => {\n${body}});`,
    dependencies: SIO_CLIENT,
  }),
  event({
    id: "event_sio_event",
    label: "When a Socket.IO connection gets an event",
    description:
      "Runs when the server sends an event with the name you pick. Leave the name empty to run for every event.",
    category: "websockets",
    group: "Socket.IO connections",
    icon: "fa-solid fa-bolt",
    keywords: ["socket.io", "event", "on", "receive", "any event"],
    block: [
      {
        type: "sio_client_onEvent",
        text: "when {NAME} receives event {EVENT}",
        parts: { NAME: { part: "text", value: "main" }, EVENT: { part: "text", value: "message" } },
        colour: "#AE3EC9",
        tooltip: 'Runs when the server sends an event with this name. Use "event data" inside it.',
      },
      {
        type: "sio_client_onAny",
        text: "when {NAME} receives any event",
        parts: { NAME: { part: "text", value: "main" }, EVENT: { part: "fixed", value: "" } },
        colour: "#AE3EC9",
        tooltip:
          'Runs for every event the server sends, whatever its name. Use "event name" to see which one it was.',
      },
    ],
    params: [],
    provides: ["sioClientEvent"],
    values: [
      {
        key: "data",
        label: "Event data",
        type: ANY,
        code: "sioData",
        block: {
          type: "sio_client_eventData",
          text: "event data",
          colour: "#AE3EC9",
          tooltip:
            "The data the server sent with the event. It can be text, a number, an object or a list.",
          restrictions: [
            {
              type: "hasParent",
              blockTypes: ["sio_client_onEvent", "sio_client_onAny"],
              message: 'This block must be inside a "when … receives event" block.',
            },
          ],
        },
      },
      {
        key: "args",
        label: "Everything sent with it (list)",
        type: "Array",
        code: "sioArgs",
        block: {
          type: "sio_client_eventArgs",
          text: "list of everything sent with the event",
          colour: "#AE3EC9",
          tooltip:
            'Some servers send more than one value with an event. This is all of them, as a list. "event data" is the first one.',
          restrictions: [
            {
              type: "hasParent",
              blockTypes: ["sio_client_onEvent", "sio_client_onAny"],
              message: 'This block must be inside a "when … receives event" block.',
            },
          ],
        },
      },
      {
        key: "name",
        label: "Event name",
        type: "String",
        code: "sioEventName",
        block: {
          type: "sio_client_eventName",
          text: "event name",
          colour: "#AE3EC9",
          tooltip: "The name of the event the server sent",
          restrictions: [
            {
              type: "hasParent",
              blockTypes: ["sio_client_onAny"],
              message: 'This block must be inside a "when … receives any event" block.',
            },
          ],
        },
      },
    ],
    settings: [
      input.text("NAME", "Connection name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this connection.",
      }),
      input.text("EVENT", "Event name", {
        default: "message",
        allowValues: false,
        help: "Leave it empty to run for any event.",
      }),
    ],
    wrap: (ctx, body) => {
      const event = String(ctx.raw("EVENT") ?? "").trim();
      const start = `let { args: sioArgs, ack: sioAck } = sioSplitArgs(sioReceived);\nconst sioData = sioArgs[0];\n`;
      return event
        ? `sioOnClient(${nameOf(ctx)}, ${JSON.stringify(event)}, async (...sioReceived) => {\nconst sioEventName = ${JSON.stringify(event)};\n${start}${body}});`
        : `sioOnAnyClient(${nameOf(ctx)}, async (sioEventName, ...sioReceived) => {\n${start}${body}});`;
    },
    dependencies: SIO_CLIENT,
  }),
  event({
    id: "event_sio_disconnect",
    label: "When a Socket.IO connection disconnects",
    description: "Runs each time a connection drops or is closed.",
    category: "websockets",
    group: "Socket.IO connections",
    icon: "fa-solid fa-plug-circle-xmark",
    keywords: ["socket.io", "disconnect"],
    block: {
      type: "sio_client_onDisconnect",
      text: "when Socket.IO connection {NAME} disconnects",
      parts: { NAME: { part: "text", value: "main" } },
      colour: "#AE3EC9",
      tooltip: "Runs when the connection is lost or closed",
    },
    params: [],
    values: [
      {
        key: "reason",
        label: "Why it disconnected",
        type: "String",
        code: "sioReason",
        block: {
          type: "sio_client_disconnectReason",
          text: "disconnect reason",
          colour: "#AE3EC9",
          tooltip:
            'Why it disconnected, like "io server disconnect" (the server kicked it) or "transport close" (the connection dropped)',
          restrictions: [
            {
              type: "hasParent",
              blockTypes: ["sio_client_onDisconnect"],
              message: 'This block must be inside a "when Socket.IO connection disconnects" block.',
            },
          ],
        },
      },
    ],
    settings: [
      input.text("NAME", "Connection name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this connection.",
      }),
    ],
    wrap: (ctx, body) =>
      `sioOnClient(${nameOf(ctx)}, "disconnect", async (sioReason) => {\n${body}});`,
    dependencies: SIO_CLIENT,
  }),
  event({
    id: "event_sio_error",
    label: "When a Socket.IO connection can't connect",
    description: "Runs when connecting to the server fails.",
    category: "websockets",
    group: "Socket.IO connections",
    icon: "fa-solid fa-triangle-exclamation",
    keywords: ["socket.io", "error", "connect error"],
    block: {
      type: "sio_client_onError",
      text: "when Socket.IO connection {NAME} fails to connect",
      parts: { NAME: { part: "text", value: "main" } },
      colour: "#AE3EC9",
      tooltip:
        "Runs when connecting fails, like when the server is down or rejects the login. Without this block, errors are printed to the console.",
    },
    params: [],
    values: [
      {
        key: "error",
        label: "Error message",
        type: "String",
        code: "(sioError?.message ?? String(sioError))",
        block: {
          type: "sio_client_errorMessage",
          text: "connection error message",
          colour: "#AE3EC9",
          tooltip: "Why it couldn't connect, as text",
          restrictions: [
            {
              type: "hasParent",
              blockTypes: ["sio_client_onError"],
              message:
                'This block must be inside a "when Socket.IO connection fails to connect" block.',
            },
          ],
        },
      },
    ],
    settings: [
      input.text("NAME", "Connection name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this connection.",
      }),
    ],
    wrap: (ctx, body) =>
      `sioOnClient(${nameOf(ctx)}, "connect_error", async (sioError) => {\n${body}});`,
    dependencies: SIO_CLIENT,
  }),
];

const actions = [
  action({
    id: "ws_connect",
    label: "Connect to a WebSocket server",
    description: "Opens a live connection to a WebSocket server, like wss://example.com/socket.",
    category: "websockets",
    group: "WebSocket connections",
    icon: "fa-solid fa-plug",
    keywords: ["websocket", "connect", "ws", "wss", "socket"],
    block: [
      {
        type: "ws_client_connect",
        text: [
          "connect to WebSocket server as {NAME}",
          "URL: {url}",
          "reconnect automatically if it drops {reconnect}",
        ],
        parts: {
          NAME: { part: "text", value: "main" },
          reconnect: { part: "checkbox", value: "TRUE" },
        },
        inline: false,
        tooltip:
          'Opens a WebSocket connection to a server (the URL starts with ws:// or wss://). The name lets other blocks use this connection. Put "when connection … receives a message" blocks anywhere to react to it.',
      },
      {
        type: "ws_client_connectAdvanced",
        text: [
          "connect to WebSocket server as {NAME}",
          "URL: {url}",
          "headers (object): {headers}",
          "subprotocol (optional): {protocol}",
          "reconnect automatically if it drops {reconnect}",
        ],
        parts: {
          NAME: { part: "text", value: "main" },
          headers: { check: null },
          reconnect: { part: "checkbox", value: "TRUE" },
        },
        inline: false,
        tooltip:
          "Opens a WebSocket connection and sends extra headers with it, like an Authorization header with an API key. Leave the subprotocol empty unless the API asks for one.",
      },
    ],
    inputs: [
      input.text("NAME", "Connection name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this connection.",
      }),
      input.text("url", "Server address", { default: "", placeholder: "wss://example.com/socket" }),
      input.boolean("reconnect", "Reconnect if it drops", { default: true, allowValues: false }),
      input.slot("headers", "Headers (optional)", "object", {
        optional: true,
        help: "An object, like one from a Make an object step.",
      }),
      input.text("protocol", "Subprotocol (optional)", { default: "" }),
    ],
    dependencies: WS,
    code: (ctx) => {
      const options = [`reconnect: ${ctx.raw("reconnect") === true}`];
      if (ctx.has("headers")) options.push(`headers: ${ctx.input("headers")}`);
      if (ctx.has("protocol")) options.push(`protocols: ${ctx.input("protocol")}`);
      return `wsConnect(${nameOf(ctx)}, ${ctx.input("url")}, { ${options.join(", ")} });\n`;
    },
  }),
  action({
    id: "ws_wait_open",
    label: "Wait for a WebSocket connection to open",
    description: "Pauses until the connection is open, or until the time runs out.",
    category: "websockets",
    group: "WebSocket connections",
    icon: "fa-solid fa-hourglass-half",
    keywords: ["websocket", "wait", "open"],
    block: {
      type: "ws_client_waitOpen",
      text: ["wait until connection {NAME} is open", "give up after (seconds): {seconds}"],
      parts: { NAME: { part: "text", value: "main" } },
      inline: true,
      tooltip:
        "Pauses until the connection has finished opening, or until the time runs out. Handy right after connecting, before sending something.",
    },
    inputs: [
      input.text("NAME", "Connection name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this connection.",
      }),
      input.number("seconds", "Give up after (seconds)", { default: 10, min: 0 }),
    ],
    dependencies: WS,
    code: (ctx) => `await wsWaitOpen(${nameOf(ctx)}, ${ctx.input("seconds")});\n`,
  }),
  action({
    id: "ws_send",
    label: "Send a WebSocket message",
    description: "Sends a message through a connection. Objects and lists are sent as JSON.",
    category: "websockets",
    group: "WebSocket connections",
    icon: "fa-solid fa-paper-plane",
    keywords: ["websocket", "send", "message"],
    block: {
      type: "ws_client_send",
      text: ["send message {message}", "through connection {NAME}"],
      parts: { NAME: { part: "text", value: "main" } },
      inline: true,
      tooltip:
        "Sends a message to the server. Text is sent as it is; objects and lists are sent as JSON. If the connection is still opening, the message is sent as soon as it opens.",
    },
    inputs: [
      input.slot("message", "Message", ANY),
      input.text("NAME", "Connection name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this connection.",
      }),
    ],
    dependencies: WS,
    code: (ctx) => `wsSend(${nameOf(ctx)}, ${ctx.has("message") ? ctx.input("message") : '""'});\n`,
  }),
  action({
    id: "ws_send_event",
    label: "Send a WebSocket event",
    description:
      'Sends an event with a name and data, as JSON like { "event": "chat", "data": ... }.',
    category: "websockets",
    group: "WebSocket connections",
    icon: "fa-solid fa-bolt",
    keywords: ["websocket", "send", "event", "emit"],
    block: {
      type: "ws_client_sendEvent",
      text: ["send event {event}", "with data {data}", "through connection {NAME}"],
      parts: { NAME: { part: "text", value: "main" } },
      inline: true,
      tooltip:
        'Sends { "event": name, "data": data } as JSON. Use this with servers that expect events in that shape — including DisFuse WebSocket servers.',
    },
    inputs: [
      input.text("event", "Event name", { default: "chat" }),
      input.slot("data", "Data", ANY, { optional: true }),
      input.text("NAME", "Connection name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this connection.",
      }),
    ],
    dependencies: WS,
    code: (ctx) =>
      `wsSend(${nameOf(ctx)}, wsEvent(${ctx.input("event")}, ${ctx.has("data") ? ctx.input("data") : "null"}));\n`,
  }),
  action({
    id: "ws_disconnect",
    label: "Disconnect a WebSocket connection",
    description: "Closes a connection. It won't reconnect by itself after this.",
    category: "websockets",
    group: "WebSocket connections",
    icon: "fa-solid fa-plug-circle-xmark",
    keywords: ["websocket", "disconnect", "close"],
    block: {
      type: "ws_client_disconnect",
      text: ["disconnect connection {NAME}", "close code: {code}", "reason: {reason}"],
      parts: { NAME: { part: "text", value: "main" } },
      tooltip:
        "Closes the connection. It won't reconnect by itself after this. Close code 1000 means a normal close. Custom codes must be between 3000 and 4999.",
    },
    inputs: [
      input.text("NAME", "Connection name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this connection.",
      }),
      input.number("code", "Close code", {
        default: 1000,
        help: "1000 means a normal close. Your own codes go from 3000 to 4999.",
        integer: true,
      }),
      input.text("reason", "Reason (optional)", { default: "" }),
    ],
    dependencies: WS,
    code: (ctx) => `wsDisconnect(${nameOf(ctx)}, ${ctx.input("code")}, ${ctx.input("reason")});\n`,
  }),
  action({
    id: "ws_reconnect",
    label: "Reconnect a WebSocket connection",
    description: "Connects again to the address the connection used last.",
    category: "websockets",
    group: "WebSocket connections",
    icon: "fa-solid fa-rotate",
    keywords: ["websocket", "reconnect"],
    block: {
      type: "ws_client_reconnect",
      text: "reconnect connection {NAME}",
      parts: { NAME: { part: "text", value: "main" } },
      tooltip:
        "Closes the connection (if it's open) and connects again to the same URL, with the same settings",
    },
    inputs: [
      input.text("NAME", "Connection name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this connection.",
      }),
    ],
    dependencies: WS,
    code: (ctx) => `wsReconnect(${nameOf(ctx)});\n`,
  }),
  action({
    id: "sio_connect",
    label: "Connect to a Socket.IO server",
    description: "Opens a live connection to a Socket.IO server.",
    category: "websockets",
    group: "Socket.IO connections",
    icon: "fa-solid fa-plug",
    keywords: ["socket.io", "socketio", "connect"],
    block: [
      {
        type: "sio_client_connect",
        text: [
          "connect to Socket.IO server as {NAME}",
          "URL: {url}",
          "reconnect automatically if it drops {reconnect}",
        ],
        parts: {
          NAME: { part: "text", value: "main" },
          reconnect: { part: "checkbox", value: "TRUE" },
        },
        colour: "#AE3EC9",
        inline: false,
        tooltip:
          "Connects to a Socket.IO server. The URL usually starts with https:// or http:// — add a path like /chat to the end to join that namespace. The name lets other blocks use this connection.",
      },
      {
        type: "sio_client_connectAdvanced",
        text: [
          "connect to Socket.IO server as {NAME}",
          "URL: {url}",
          "login details / auth (object): {auth}",
          "query parameters (object): {query}",
          "headers (object): {headers}",
          "server path (usually /socket.io): {path}",
          "WebSocket only (skip long-polling) {websocketOnly}",
          "reconnect automatically if it drops {reconnect}",
        ],
        parts: {
          NAME: { part: "text", value: "main" },
          auth: { check: null },
          query: { check: null },
          headers: { check: null },
          websocketOnly: { part: "checkbox" },
          reconnect: { part: "checkbox", value: "TRUE" },
        },
        colour: "#AE3EC9",
        inline: false,
        tooltip:
          'Connects to a Socket.IO server with extra settings. Leave anything you don\'t need empty. Login details are what a DisFuse Socket.IO server reads with "login detail … of this client".',
      },
    ],
    inputs: [
      input.text("NAME", "Connection name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this connection.",
      }),
      input.text("url", "Server address", { default: "", placeholder: "https://example.com" }),
      input.boolean("reconnect", "Reconnect if it drops", { default: true, allowValues: false }),
      input.slot("auth", "Login details (optional)", "object", { optional: true }),
      input.slot("query", "Query settings (optional)", "object", { optional: true }),
      input.slot("headers", "Headers (optional)", "object", { optional: true }),
      input.text("path", "Path (optional)", { default: "", placeholder: "/socket.io" }),
      input.boolean("websocketOnly", "Only use WebSockets", { default: false, allowValues: false }),
    ],
    dependencies: SIO_CLIENT,
    code: (ctx) => {
      const options = [`reconnection: ${ctx.raw("reconnect") === true}`];
      if (ctx.has("auth")) options.push(`auth: ${ctx.input("auth")}`);
      if (ctx.has("query")) options.push(`query: ${ctx.input("query")}`);
      if (ctx.has("headers")) options.push(`extraHeaders: ${ctx.input("headers")}`);
      if (ctx.has("path")) options.push(`path: ${ctx.input("path")}`);
      if (ctx.raw("websocketOnly") === true) options.push('transports: ["websocket"]');
      return `sioConnect(${nameOf(ctx)}, ${ctx.input("url")}, { ${options.join(", ")} });\n`;
    },
  }),
  action({
    id: "sio_wait_connected",
    label: "Wait for a Socket.IO connection",
    description: "Pauses until the connection is connected, or until the time runs out.",
    category: "websockets",
    group: "Socket.IO connections",
    icon: "fa-solid fa-hourglass-half",
    keywords: ["socket.io", "wait", "connected"],
    block: {
      type: "sio_client_waitConnected",
      text: ["wait until {NAME} is connected", "give up after (seconds): {seconds}"],
      parts: { NAME: { part: "text", value: "main" } },
      colour: "#AE3EC9",
      inline: true,
      tooltip: "Pauses until the connection is ready, or until the time runs out",
    },
    inputs: [
      input.text("NAME", "Connection name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this connection.",
      }),
      input.number("seconds", "Give up after (seconds)", { default: 10, min: 0 }),
    ],
    dependencies: SIO_CLIENT,
    code: (ctx) => `await sioWaitConnected(${nameOf(ctx)}, ${ctx.input("seconds")});\n`,
  }),
  action({
    id: "sio_reply",
    label: "Reply to an event from a Socket.IO server",
    description:
      "Answers the event that started these steps. Only works once, and only if the sender asked for a reply.",
    category: "websockets",
    group: "Socket.IO connections",
    icon: "fa-solid fa-reply",
    keywords: ["socket.io", "ack", "reply"],
    block: {
      type: "sio_client_reply",
      text: "reply to this event with {data}",
      colour: "#AE3EC9",
      tooltip:
        "Answers the event the server sent, if the server is waiting for an answer. Only the first reply is sent.",
      restrictions: [
        {
          type: "hasParent",
          blockTypes: ["sio_client_onEvent", "sio_client_onAny"],
          message: 'This block must be inside a "when … receives event" block.',
        },
      ],
    },
    requires: ["sioClientEvent"],
    inputs: [input.slot("data", "With", ANY, { optional: true })],
    code: (ctx) => `sioAck?.(${ctx.has("data") ? ctx.input("data") : "null"});\nsioAck = null;\n`,
  }),
  action({
    id: "sio_emit",
    label: "Send a Socket.IO event",
    description: "Sends an event with data through a connection.",
    category: "websockets",
    group: "Socket.IO connections",
    icon: "fa-solid fa-paper-plane",
    keywords: ["socket.io", "emit", "send", "event"],
    block: {
      type: "sio_client_emit",
      text: ["send event {event}", "with data {data}", "through {NAME}"],
      parts: { NAME: { part: "text", value: "main" } },
      colour: "#AE3EC9",
      inline: true,
      tooltip:
        "Sends an event to the server. The data can be text, a number, an object or a list. If it isn't connected yet, it's sent as soon as it connects.",
    },
    inputs: [
      input.text("event", "Event name", { default: "message" }),
      input.slot("data", "Data", ANY, { optional: true }),
      input.text("NAME", "Connection name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this connection.",
      }),
    ],
    dependencies: SIO_CLIENT,
    code: (ctx) =>
      `sioClientSocket(${nameOf(ctx)})?.emit(String(${ctx.input("event")}), ${ctx.has("data") ? ctx.input("data") : "null"});\n`,
  }),
  action({
    id: "sio_emit_reply",
    label: "Send a Socket.IO event and wait for a reply",
    description: "Sends an event, then runs the steps inside when the server replies.",
    category: "websockets",
    group: "Socket.IO connections",
    icon: "fa-solid fa-reply",
    keywords: ["socket.io", "emit", "ack", "reply", "acknowledge"],
    block: {
      type: "sio_client_emitWithReply",
      text: [
        "send event {event}",
        "with data {data}",
        "through {NAME}",
        "and wait for a reply for (seconds): {seconds}",
        "then {then}",
      ],
      parts: { NAME: { part: "text", value: "main" }, then: { check: "default" } },
      colour: "#AE3EC9",
      inline: false,
      tooltip:
        'Sends an event and waits for the server to answer it. Use "reply from the server" inside — it\'s empty if no answer came in time.',
    },
    inputs: [
      input.text("event", "Event name", { default: "message" }),
      input.slot("data", "Data", ANY, { optional: true }),
      input.text("NAME", "Connection name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this connection.",
      }),
      input.number("seconds", "Wait up to (seconds)", { default: 5, min: 0 }),
    ],
    branches: [
      {
        key: "then",
        label: "When the reply comes",
        inline: true,
        provides: [
          {
            key: "reply",
            label: "Reply from the server",
            type: ANY,
            code: "sioReply@@",
            description: "Empty if the server didn't reply in time.",
            block: {
              type: "sio_client_replyValue",
              text: "reply from the server",
              colour: "#AE3EC9",
              tooltip: "What the server answered with. Empty if it didn't answer in time.",
              restrictions: [
                {
                  type: "hasParent",
                  blockTypes: ["sio_client_emitWithReply"],
                  message: 'This block must be inside a "send event … and wait for a reply" block.',
                },
              ],
            },
          },
        ],
      },
    ],
    dependencies: SIO_CLIENT,
    code: (ctx) =>
      `{\nconst ${ctx.local("sioReply")} = await sioEmitWithAck(sioClientSocket(${nameOf(ctx)}), ${ctx.input("event")}, ${ctx.has("data") ? ctx.input("data") : "null"}, ${ctx.input("seconds")});\n${ctx.branch("then")}}\n`,
  }),
  action({
    id: "sio_disconnect",
    label: "Disconnect a Socket.IO connection",
    description: "Closes a connection.",
    category: "websockets",
    group: "Socket.IO connections",
    icon: "fa-solid fa-plug-circle-xmark",
    keywords: ["socket.io", "disconnect"],
    block: {
      type: "sio_client_disconnect",
      text: "disconnect {NAME}",
      parts: { NAME: { part: "text", value: "main" } },
      colour: "#AE3EC9",
      tooltip: "Closes the connection. It won't reconnect by itself after this.",
    },
    inputs: [
      input.text("NAME", "Connection name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this connection.",
      }),
    ],
    dependencies: SIO_CLIENT,
    code: (ctx) => `sioClients[${nameOf(ctx)}]?.socket?.disconnect();\n`,
  }),
  action({
    id: "sio_reconnect",
    label: "Reconnect a Socket.IO connection",
    description: "Connects again after a disconnect.",
    category: "websockets",
    group: "Socket.IO connections",
    icon: "fa-solid fa-rotate",
    keywords: ["socket.io", "reconnect"],
    block: {
      type: "sio_client_reconnect",
      text: "reconnect {NAME}",
      parts: { NAME: { part: "text", value: "main" } },
      colour: "#AE3EC9",
      tooltip: 'Connects again after the connection was closed with "disconnect"',
    },
    inputs: [
      input.text("NAME", "Connection name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this connection.",
      }),
    ],
    dependencies: SIO_CLIENT,
    code: (ctx) => `sioClientSocket(${nameOf(ctx)})?.connect();\n`,
  }),
];

const values = [
  value({
    id: "ws_is_open",
    label: "WebSocket connection is open?",
    description: "True if the connection is open right now.",
    category: "websockets",
    group: "WebSocket connections",
    icon: "fa-solid fa-signal",
    keywords: ["websocket", "open", "connected"],
    block: {
      type: "ws_client_isOpen",
      text: "connection {NAME} is open?",
      parts: { NAME: { part: "text", value: "main" } },
      tooltip: "True if the connection is open and ready to send messages",
    },
    output: "Boolean",
    inputs: [
      input.text("NAME", "Connection name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this connection.",
      }),
    ],
    dependencies: WS,
    code: (ctx) => `(wsState(${nameOf(ctx)}) === "open")`,
  }),
  value({
    id: "ws_state",
    label: "WebSocket connection status",
    description: "connecting, open, closing or closed.",
    category: "websockets",
    group: "WebSocket connections",
    icon: "fa-solid fa-circle-info",
    keywords: ["websocket", "state", "status"],
    block: {
      type: "ws_client_state",
      text: "status of connection {NAME}",
      parts: { NAME: { part: "text", value: "main" } },
      tooltip: 'The connection\'s status as text: "connecting", "open", "closing" or "closed"',
    },
    output: "String",
    inputs: [
      input.text("NAME", "Connection name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this connection.",
      }),
    ],
    dependencies: WS,
    code: (ctx) => `wsState(${nameOf(ctx)})`,
  }),
  value({
    id: "ws_url",
    label: "WebSocket connection address",
    description: "The address a connection is connected to.",
    category: "websockets",
    group: "WebSocket connections",
    icon: "fa-solid fa-link",
    keywords: ["websocket", "url", "address"],
    block: {
      type: "ws_client_url",
      text: "URL of connection {NAME}",
      parts: { NAME: { part: "text", value: "main" } },
      tooltip: "The URL this connection was opened to",
    },
    output: "String",
    inputs: [
      input.text("NAME", "Connection name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this connection.",
      }),
    ],
    dependencies: WS,
    code: (ctx) => `(wsConnections[${nameOf(ctx)}]?.url ?? null)`,
  }),
  value({
    id: "sio_is_connected",
    label: "Socket.IO connection is connected?",
    description: "True if the connection is connected right now.",
    category: "websockets",
    group: "Socket.IO connections",
    icon: "fa-solid fa-signal",
    keywords: ["socket.io", "connected"],
    block: {
      type: "sio_client_isConnected",
      text: "Socket.IO connection {NAME} is connected?",
      parts: { NAME: { part: "text", value: "main" } },
      colour: "#AE3EC9",
      tooltip: "True if the connection is open right now",
    },
    output: "Boolean",
    inputs: [
      input.text("NAME", "Connection name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this connection.",
      }),
    ],
    dependencies: SIO_CLIENT,
    code: (ctx) => `Boolean(sioClients[${nameOf(ctx)}]?.socket?.connected)`,
  }),
  value({
    id: "sio_id",
    label: "My Socket.IO ID",
    description: "The ID the server gave this connection.",
    category: "websockets",
    group: "Socket.IO connections",
    icon: "fa-solid fa-fingerprint",
    keywords: ["socket.io", "id"],
    block: {
      type: "sio_client_id",
      text: "my ID on connection {NAME}",
      parts: { NAME: { part: "text", value: "main" } },
      colour: "#AE3EC9",
      tooltip: "The ID the server gave this connection. It changes every time it reconnects.",
    },
    output: "String",
    inputs: [
      input.text("NAME", "Connection name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this connection.",
      }),
    ],
    dependencies: SIO_CLIENT,
    code: (ctx) => `(sioClients[${nameOf(ctx)}]?.socket?.id ?? null)`,
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
      key: "sioClientEvent",
      label: "a Socket.IO event",
      description: 'Only works in "When a Socket.IO connection gets an event".',
      variable: "sioAck",
    },
  ],
};
