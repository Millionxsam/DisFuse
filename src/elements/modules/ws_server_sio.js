/* =====================================================================
   Builder catalog: Socket.IO server
   ---------------------------------------------------------------------
   Running a Socket.IO server inside the bot, so websites and apps can
   connect with Socket.IO and trade live events.

   Each server has a name ("main" unless you change it). Steps about
   "this client" work in the server's events and in the repeat steps
   that go through clients.
   ===================================================================== */

import { ANY, group, input } from "../define.js";
import { sioServerRuntime } from "../../blocks/lib/websocketRuntime.js";

const { event, action, value } = group({ colour: "#862E9C" });

const SIO_SERVER = [{ package: "socket.io", code: sioServerRuntime }];

/** A connection or server name, as a string in the code. */
const nameOf = (ctx) => JSON.stringify(String(ctx.raw("NAME") ?? "").trim() || "main");

const events = [
  event({
    id: "event_sio_server_connect",
    label: "When a client connects to a Socket.IO server",
    description: "Runs when a client connects.",
    category: "websockets",
    group: "Socket.IO server",
    icon: "fa-solid fa-user-plus",
    keywords: ["socket.io", "connect", "connection", "join"],
    block: {
      type: "sio_server_onConnect",
      text: "when a client connects to {NAME}",
      parts: { NAME: { part: "text", value: "main" } },
      tooltip: "Runs every time a new client connects to the server",
    },
    params: [],
    provides: ["sioClient", "sioConnectedClient"],
    settings: [
      input.text("NAME", "Server name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this server.",
      }),
    ],
    wrap: (ctx, body) =>
      `sioOnServer(${nameOf(ctx)}, "connection", async (sioSocket) => {\n${body}});`,
    dependencies: SIO_SERVER,
  }),
  event({
    id: "event_sio_server_event",
    label: "When a client sends a Socket.IO event",
    description:
      "Runs when a client sends an event with the name you pick. Leave the name empty to run for every event.",
    category: "websockets",
    group: "Socket.IO server",
    icon: "fa-solid fa-bolt",
    keywords: ["socket.io", "event", "on", "receive", "any event"],
    block: [
      {
        type: "sio_server_onEvent",
        text: "when a client sends event {EVENT} to {NAME}",
        parts: { EVENT: { part: "text", value: "message" }, NAME: { part: "text", value: "main" } },
        tooltip:
          'Runs when any client sends an event with this name. Use "event data" inside it, and "reply to this event" if the client is waiting for an answer.',
      },
      {
        type: "sio_server_onAny",
        text: "when a client sends any event to {NAME}",
        parts: { NAME: { part: "text", value: "main" }, EVENT: { part: "fixed", value: "" } },
        tooltip:
          'Runs for every event any client sends, whatever its name. Use "event name" to see which one it was.',
      },
    ],
    params: [],
    provides: ["sioClient", "sioConnectedClient", "sioServerEvent"],
    values: [
      {
        key: "data",
        label: "Event data",
        type: ANY,
        code: "sioData",
        block: {
          type: "sio_server_eventData",
          text: "event data from client",
          tooltip:
            "The data the client sent with the event. It can be text, a number, an object or a list.",
          restrictions: [
            {
              type: "hasParent",
              blockTypes: ["sio_server_onEvent", "sio_server_onAny"],
              message: 'This block must be inside a "when a client sends event" block.',
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
          type: "sio_server_eventArgs",
          text: "list of everything the client sent",
          tooltip:
            'A client can send more than one value with an event. This is all of them, as a list. "event data" is the first one.',
          restrictions: [
            {
              type: "hasParent",
              blockTypes: ["sio_server_onEvent", "sio_server_onAny"],
              message: 'This block must be inside a "when a client sends event" block.',
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
          type: "sio_server_eventName",
          text: "name of the event the client sent",
          tooltip: "Which event the client sent",
          restrictions: [
            {
              type: "hasParent",
              blockTypes: ["sio_server_onAny"],
              message: 'This block must be inside a "when a client sends any event" block.',
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
      input.text("EVENT", "Event name", {
        default: "message",
        allowValues: false,
        help: "Leave it empty to run for any event.",
      }),
    ],
    wrap: (ctx, body) => {
      const event = String(ctx.raw("EVENT") ?? "").trim();
      const start = `let { args: sioArgs, ack: sioAck } = sioServerSplitArgs(sioReceived);\nconst sioData = sioArgs[0];\n`;
      return event
        ? `sioOnServer(${nameOf(ctx)}, "event", async (sioSocket, ...sioReceived) => {\nconst sioEventName = ${JSON.stringify(event)};\n${start}${body}}, ${JSON.stringify(event)});`
        : `sioOnServer(${nameOf(ctx)}, "any", async (sioSocket, sioEventName, ...sioReceived) => {\n${start}${body}});`;
    },
    dependencies: SIO_SERVER,
  }),
  event({
    id: "event_sio_server_disconnect",
    label: "When a client disconnects from a Socket.IO server",
    description: "Runs when a client leaves or drops.",
    category: "websockets",
    group: "Socket.IO server",
    icon: "fa-solid fa-user-minus",
    keywords: ["socket.io", "disconnect", "leave"],
    block: {
      type: "sio_server_onDisconnect",
      text: "when a client disconnects from {NAME}",
      parts: { NAME: { part: "text", value: "main" } },
      tooltip:
        "Runs when a client leaves, for any reason. You can still read its ID and data here.",
    },
    params: [],
    provides: ["sioClient", "sioConnectedClient"],
    values: [
      {
        key: "reason",
        label: "Why it disconnected",
        type: "String",
        code: "sioReason",
        block: {
          type: "sio_server_disconnectReason",
          text: "reason the client disconnected",
          tooltip:
            'Like "client namespace disconnect" (it left on purpose), "transport close" (the connection dropped) or "server namespace disconnect" (you kicked it)',
          restrictions: [
            {
              type: "hasParent",
              blockTypes: ["sio_server_onDisconnect"],
              message: 'This block must be inside a "when a client disconnects" block.',
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
    wrap: (ctx, body) =>
      `sioOnServer(${nameOf(ctx)}, "disconnect", async (sioSocket, sioReason) => {\n${body}});`,
    dependencies: SIO_SERVER,
  }),
  event({
    id: "event_sio_server_auth",
    label: "When a client tries to connect to a Socket.IO server",
    description:
      "Runs before a client is let in. Use Turn away this Socket.IO client to refuse it, for example if its login details are wrong.",
    category: "websockets",
    group: "Socket.IO server",
    icon: "fa-solid fa-user-shield",
    keywords: ["socket.io", "auth", "login", "password", "verify"],
    block: {
      type: "sio_server_onAuth",
      text: "when a client tries to connect to {NAME}",
      parts: { NAME: { part: "text", value: "main" } },
      tooltip:
        'Runs before a client is let in. Check its login details and use "reject this connection" to turn it away. You can also save client data or join rooms here.',
    },
    params: [],
    provides: ["sioClient", "sioAuth"],
    settings: [
      input.text("NAME", "Server name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this server.",
      }),
    ],
    wrap: (ctx, body) =>
      `sioOnServer(${nameOf(ctx)}, "auth", async (sioSocket, sioAuth) => {\n${body}});`,
    dependencies: SIO_SERVER,
  }),
  event({
    id: "event_sio_server_start",
    label: "When a Socket.IO server starts",
    description: "Runs when the server is ready for connections.",
    category: "websockets",
    group: "Socket.IO server",
    icon: "fa-solid fa-tower-broadcast",
    keywords: ["socket.io", "server", "started", "listening"],
    block: {
      type: "sio_server_onStart",
      text: "when Socket.IO server {NAME} starts",
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
    wrap: (ctx, body) => `sioOnServer(${nameOf(ctx)}, "listening", async () => {\n${body}});`,
    dependencies: SIO_SERVER,
  }),
];

const actions = [
  action({
    id: "sio_server_start",
    label: "Start a Socket.IO server",
    description:
      "Starts a Socket.IO server on a port, so websites and apps can connect to the bot.",
    category: "websockets",
    group: "Socket.IO server",
    icon: "fa-solid fa-tower-broadcast",
    keywords: ["socket.io", "server", "start", "host", "port"],
    block: {
      type: "sio_server_start",
      text: ["start Socket.IO server {NAME}", "on port: {port}", "allow websites (CORS): {cors}"],
      parts: { NAME: { part: "text", value: "main" } },
      tooltip:
        'Starts a Socket.IO server that apps and websites can connect to. "Allow websites" is which websites may connect from a browser: * for any, or a list like https://mysite.com, https://other.com. Put this in "when the bot starts".',
    },
    inputs: [
      input.text("NAME", "Server name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this server.",
      }),
      input.number("port", "Port", { default: 3000, min: 1, max: 65535, integer: true }),
      input.text("cors", "Websites allowed to connect", {
        default: "*",
        help: "* lets any website connect. Or list them split by commas, like https://example.com.",
      }),
    ],
    dependencies: SIO_SERVER,
    code: (ctx) => `sioStartServer(${nameOf(ctx)}, ${ctx.input("port")}, ${ctx.input("cors")});\n`,
  }),
  action({
    id: "sio_server_stop",
    label: "Stop a Socket.IO server",
    description: "Stops a server and disconnects everyone on it.",
    category: "websockets",
    group: "Socket.IO server",
    icon: "fa-solid fa-power-off",
    keywords: ["socket.io", "server", "stop"],
    block: {
      type: "sio_server_stop",
      text: "stop Socket.IO server {NAME}",
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
    dependencies: SIO_SERVER,
    code: (ctx) => `sioStopServer(${nameOf(ctx)});\n`,
  }),
  action({
    id: "sio_server_reply",
    label: "Reply to an event from a Socket.IO client",
    description:
      "Answers the event that started these steps. Only works once, and only if the client asked for a reply.",
    category: "websockets",
    group: "This client",
    icon: "fa-solid fa-reply",
    keywords: ["socket.io", "ack", "reply"],
    block: {
      type: "sio_server_reply",
      text: "reply to this event with {data}",
      tooltip:
        'Answers the event the client sent, if the client is waiting for an answer ("send event … and wait for a reply"). Only the first reply is sent.',
      restrictions: [
        {
          type: "hasParent",
          blockTypes: ["sio_server_onEvent", "sio_server_onAny"],
          message: 'This block must be inside a "when a client sends event" block.',
        },
      ],
    },
    requires: ["sioServerEvent"],
    inputs: [input.slot("data", "With", ANY, { optional: true })],
    dependencies: SIO_SERVER,
    code: (ctx) => `sioAck?.(${ctx.has("data") ? ctx.input("data") : "null"});\nsioAck = null;\n`,
  }),
  action({
    id: "sio_server_emit_client",
    label: "Send an event to this Socket.IO client",
    description: "Sends an event with data to the client these steps are about.",
    category: "websockets",
    group: "This client",
    icon: "fa-solid fa-paper-plane",
    keywords: ["socket.io", "emit", "send"],
    block: {
      type: "sio_server_emitClient",
      text: ["send event {event}", "with data {data}", "to this client"],
      inline: false,
      tooltip: "Sends an event to this client only",
      restrictions: [
        {
          type: "hasParent",
          blockTypes: [
            "sio_server_onConnect",
            "sio_server_onEvent",
            "sio_server_onAny",
            "sio_server_onDisconnect",
            "sio_server_forEachClient",
            "sio_server_forEachInRoom",
          ],
          message:
            'This block must be inside a "when a client connects / sends / disconnects" block or a "for each client" loop.',
        },
      ],
    },
    requires: ["sioConnectedClient"],
    inputs: [
      input.text("event", "Event name", { default: "message" }),
      input.slot("data", "Data", ANY, { optional: true }),
    ],
    dependencies: SIO_SERVER,
    code: (ctx) =>
      `sioSocket?.emit(String(${ctx.input("event")}), ${ctx.has("data") ? ctx.input("data") : "null"});\n`,
  }),
  action({
    id: "sio_server_emit_client_reply",
    label: "Send an event to this Socket.IO client and wait for a reply",
    description: "Sends an event, then runs the steps inside when the client replies.",
    category: "websockets",
    group: "This client",
    icon: "fa-solid fa-reply",
    keywords: ["socket.io", "emit", "ack", "reply"],
    block: {
      type: "sio_server_emitClientWithReply",
      text: [
        "send event {event}",
        "with data {data}",
        "to this client and wait for a reply for (seconds): {seconds}",
        "then {then}",
      ],
      parts: { then: { check: "default" } },
      inline: false,
      tooltip:
        'Sends an event to this client and waits for it to answer. Use "reply from the client" inside — it\'s empty if no answer came in time.',
      restrictions: [
        {
          type: "hasParent",
          blockTypes: [
            "sio_server_onConnect",
            "sio_server_onEvent",
            "sio_server_onAny",
            "sio_server_onDisconnect",
            "sio_server_forEachClient",
            "sio_server_forEachInRoom",
          ],
          message:
            'This block must be inside a "when a client connects / sends / disconnects" block or a "for each client" loop.',
        },
      ],
    },
    requires: ["sioConnectedClient"],
    inputs: [
      input.text("event", "Event name", { default: "message" }),
      input.slot("data", "Data", ANY, { optional: true }),
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
            label: "Reply from the client",
            type: ANY,
            code: "sioReply@@",
            description: "Empty if the client didn't reply in time.",
            block: {
              type: "sio_server_replyValue",
              text: "reply from the client",
              tooltip: "What the client answered with. Empty if it didn't answer in time.",
              restrictions: [
                {
                  type: "hasParent",
                  blockTypes: ["sio_server_emitClientWithReply"],
                  message:
                    'This block must be inside a "send event … to this client and wait for a reply" block.',
                },
              ],
            },
          },
        ],
      },
    ],
    dependencies: SIO_SERVER,
    code: (ctx) =>
      `{\nconst ${ctx.local("sioReply")} = await sioServerEmitWithAck(sioSocket, ${ctx.input("event")}, ${ctx.has("data") ? ctx.input("data") : "null"}, ${ctx.input("seconds")});\n${ctx.branch("then")}}\n`,
  }),
  action({
    id: "sio_server_emit_all",
    label: "Send an event to every Socket.IO client",
    description: "Sends an event with data to everyone connected to a server.",
    category: "websockets",
    group: "Socket.IO server",
    icon: "fa-solid fa-bullhorn",
    keywords: ["socket.io", "broadcast", "emit", "everyone"],
    block: {
      type: "sio_server_emitAll",
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
        'Sends an event to everyone connected. "all clients except this one" only skips someone inside a "when a client…" block.',
    },
    inputs: [
      input.text("event", "Event name", { default: "message" }),
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
    dependencies: SIO_SERVER,
    code: (ctx) =>
      ctx.raw("WHO") === "others"
        ? `sioIo(${nameOf(ctx)})?.except((typeof sioSocket === "undefined" ? null : sioSocket)?.id ?? []).emit(String(${ctx.input("event")}), ${ctx.has("data") ? ctx.input("data") : "null"});\n`
        : `sioIo(${nameOf(ctx)})?.emit(String(${ctx.input("event")}), ${ctx.has("data") ? ctx.input("data") : "null"});\n`,
  }),
  action({
    id: "sio_server_emit_id",
    label: "Send an event to a Socket.IO client by ID",
    description: "Sends an event with data to one client, by its ID.",
    category: "websockets",
    group: "Socket.IO server",
    icon: "fa-solid fa-paper-plane",
    keywords: ["socket.io", "emit", "id", "direct"],
    block: {
      type: "sio_server_emitId",
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
      input.text("event", "Event name", { default: "message" }),
      input.slot("data", "Data", ANY, { optional: true }),
      input.text("id", "Client ID", { default: "" }),
      input.text("NAME", "Server name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this server.",
      }),
    ],
    dependencies: SIO_SERVER,
    code: (ctx) =>
      `sioIo(${nameOf(ctx)})?.to(String(${ctx.input("id")})).emit(String(${ctx.input("event")}), ${ctx.has("data") ? ctx.input("data") : "null"});\n`,
  }),
  action({
    id: "sio_server_set_data",
    label: "Save something on this Socket.IO client",
    description:
      "Remembers a value on the client, like its username, for as long as it's connected.",
    category: "websockets",
    group: "This client",
    icon: "fa-solid fa-floppy-disk",
    keywords: ["socket.io", "data", "store", "remember"],
    block: {
      type: "sio_server_setData",
      text: ["set {key}", "of this client's data to {value}"],
      inline: true,
      tooltip:
        "Remembers something about this client for as long as it's connected, like its username after it logs in",
      restrictions: [
        {
          type: "hasParent",
          blockTypes: [
            "sio_server_onConnect",
            "sio_server_onEvent",
            "sio_server_onAny",
            "sio_server_onDisconnect",
            "sio_server_forEachClient",
            "sio_server_forEachInRoom",
            "sio_server_onAuth",
          ],
          message:
            'This block must be inside a "when a client…" block or a "for each client" loop, so it knows which client "this client" is.',
        },
      ],
    },
    requires: ["sioClient"],
    inputs: [
      input.text("key", "Name", { default: "" }),
      input.slot("value", "Value", ANY, { optional: true }),
    ],
    dependencies: SIO_SERVER,
    code: (ctx) =>
      `if (sioSocket) sioSocket.data[${ctx.input("key")}] = ${ctx.has("value") ? ctx.input("value") : "null"};\n`,
  }),
  action({
    id: "sio_server_room_join",
    label: "Add or remove this Socket.IO client from a room",
    description:
      "Rooms let you send an event to some clients at once, like everyone in a chat room.",
    category: "websockets",
    group: "This client",
    icon: "fa-solid fa-door-open",
    keywords: ["socket.io", "room", "join", "leave"],
    block: {
      type: "sio_server_joinRoom",
      text: "{action} room {room}",
      parts: {
        action: {
          options: [
            ["add this client to", "join"],
            ["remove this client from", "leave"],
          ],
        },
      },
      tooltip:
        "Rooms are like chat rooms: put clients in one, then send an event to everyone in it at once. A client can be in many rooms.",
      restrictions: [
        {
          type: "hasParent",
          blockTypes: [
            "sio_server_onConnect",
            "sio_server_onEvent",
            "sio_server_onAny",
            "sio_server_onDisconnect",
            "sio_server_forEachClient",
            "sio_server_forEachInRoom",
            "sio_server_onAuth",
          ],
          message:
            'This block must be inside a "when a client…" block or a "for each client" loop, so it knows which client "this client" is.',
        },
      ],
    },
    requires: ["sioConnectedClient"],
    inputs: [
      input.dropdown(
        "action",
        "Do",
        [
          ["Add to", "join"],
          ["Remove from", "leave"],
        ],
        { default: "join" },
      ),
      input.text("room", "Room", { default: "" }),
    ],
    dependencies: SIO_SERVER,
    code: (ctx) =>
      `sioSocket?.${ctx.raw("action") === "leave" ? "leave" : "join"}(String(${ctx.input("room")}));\n`,
  }),
  action({
    id: "sio_server_room_join_id",
    label: "Add or remove a Socket.IO client from a room by ID",
    description: "Adds a client to a room, or takes it out, by its ID.",
    category: "websockets",
    group: "Socket.IO server",
    icon: "fa-solid fa-door-open",
    keywords: ["socket.io", "room", "join", "leave", "id"],
    block: {
      type: "sio_server_joinRoomId",
      text: ["{action} {id}", "to / from room {room}", "on server {NAME}"],
      parts: {
        action: {
          options: [
            ["add client with ID", "socketsJoin"],
            ["remove client with ID", "socketsLeave"],
          ],
        },
        NAME: { part: "text", value: "main" },
      },
      inline: false,
      tooltip: "Moves a client in or out of a room, found by its ID. Works anywhere.",
    },
    inputs: [
      input.dropdown(
        "action",
        "Do",
        [
          ["Add", "socketsJoin"],
          ["Remove", "socketsLeave"],
        ],
        { default: "socketsJoin" },
      ),
      input.text("id", "Client ID", { default: "" }),
      input.text("room", "Room", { default: "" }),
      input.text("NAME", "Server name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this server.",
      }),
    ],
    dependencies: SIO_SERVER,
    code: (ctx) =>
      `sioIo(${nameOf(ctx)})?.in(String(${ctx.input("id")})).${ctx.raw("action") === "socketsLeave" ? "socketsLeave" : "socketsJoin"}(String(${ctx.input("room")}));\n`,
  }),
  action({
    id: "sio_server_emit_room",
    label: "Send an event to a Socket.IO room",
    description: "Sends an event with data to everyone in a room.",
    category: "websockets",
    group: "Socket.IO server",
    icon: "fa-solid fa-people-group",
    keywords: ["socket.io", "room", "emit", "send"],
    block: {
      type: "sio_server_emitRoom",
      text: [
        "send event {event}",
        "with data {data}",
        "to everyone in room {room}",
        "on server {NAME} except this client {except}",
      ],
      parts: { NAME: { part: "text", value: "main" }, except: { part: "checkbox" } },
      inline: false,
      tooltip:
        'Sends an event to every client in the room. Check "except this client" to skip the one that sent it (only inside a "when a client…" block).',
    },
    inputs: [
      input.text("event", "Event name", { default: "message" }),
      input.slot("data", "Data", ANY, { optional: true }),
      input.text("room", "Room", { default: "" }),
      input.text("NAME", "Server name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this server.",
      }),
      input.boolean("except", "Leave out this client", { default: false, allowValues: false }),
    ],
    dependencies: SIO_SERVER,
    code: (ctx) =>
      `sioIo(${nameOf(ctx)})?.to(String(${ctx.input("room")}))${ctx.raw("except") === true ? '.except((typeof sioSocket === "undefined" ? null : sioSocket)?.id ?? [])' : ""}.emit(String(${ctx.input("event")}), ${ctx.has("data") ? ctx.input("data") : "null"});\n`,
  }),
  action({
    id: "sio_server_each_in_room",
    label: "Repeat with each Socket.IO client in a room",
    description: "Runs the steps inside once for each client in a room.",
    category: "websockets",
    group: "Socket.IO server",
    icon: "fa-solid fa-people-group",
    keywords: ["socket.io", "room", "for each", "loop"],
    block: {
      type: "sio_server_forEachInRoom",
      text: ["for each client in room {room}", "on server {NAME}", "do {code}"],
      parts: { NAME: { part: "text", value: "main" }, code: { check: "default" } },
      inline: true,
      tooltip:
        'Runs the blocks inside once for every client in the room. Inside, "this client" means the one the loop is on.',
    },
    inputs: [
      input.text("room", "Room", { default: "" }),
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
        contexts: ["sioClient", "sioConnectedClient", "loop"],
      },
    ],
    dependencies: SIO_SERVER,
    code: (ctx) =>
      `for (const sioSocket of sioRoomSockets(${nameOf(ctx)}, ${ctx.input("room")})) {\n${ctx.branch("code")}}\n`,
  }),
  action({
    id: "sio_server_each_client",
    label: "Repeat with each connected Socket.IO client",
    description: "Runs the steps inside once for each client connected to a server.",
    category: "websockets",
    group: "Socket.IO server",
    icon: "fa-solid fa-users",
    keywords: ["socket.io", "clients", "for each", "loop"],
    block: {
      type: "sio_server_forEachClient",
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
        contexts: ["sioClient", "sioConnectedClient", "loop"],
      },
    ],
    dependencies: SIO_SERVER,
    code: (ctx) =>
      `for (const sioSocket of sioServerSockets(${nameOf(ctx)})) {\n${ctx.branch("code")}}\n`,
  }),
  action({
    id: "sio_server_reject",
    label: "Turn away this Socket.IO client",
    description: "Refuses the client trying to connect. Nothing after this step runs.",
    category: "websockets",
    group: "This client",
    icon: "fa-solid fa-user-slash",
    keywords: ["socket.io", "reject", "deny", "refuse", "unauthorized"],
    block: {
      type: "sio_server_reject",
      text: "reject this connection with reason {reason}",
      tooltip:
        'Turns the client away before it connects, and stops the blocks after it. The client sees the reason in its "fails to connect" event.',
      next: false,
      restrictions: [
        {
          type: "hasParent",
          blockTypes: ["sio_server_onAuth"],
          message: 'This block must be inside a "when a client tries to connect" block.',
        },
      ],
    },
    requires: ["sioAuth"],
    inputs: [input.text("reason", "Reason", { default: "Unauthorized" })],
    dependencies: SIO_SERVER,
    terminal: true,
    code: (ctx) => `sioAuth.rejected = String(${ctx.input("reason")});\nreturn;\n`,
  }),
  action({
    id: "sio_server_kick",
    label: "Disconnect this Socket.IO client",
    description: "Disconnects the client these steps are about.",
    category: "websockets",
    group: "This client",
    icon: "fa-solid fa-plug-circle-xmark",
    keywords: ["socket.io", "kick", "disconnect"],
    block: {
      type: "sio_server_kick",
      text: "disconnect this client",
      tooltip: "Closes this client's connection. It won't reconnect by itself.",
      restrictions: [
        {
          type: "hasParent",
          blockTypes: [
            "sio_server_onConnect",
            "sio_server_onEvent",
            "sio_server_onAny",
            "sio_server_onDisconnect",
            "sio_server_forEachClient",
            "sio_server_forEachInRoom",
          ],
          message:
            'This block must be inside a "when a client connects / sends / disconnects" block or a "for each client" loop.',
        },
      ],
    },
    requires: ["sioConnectedClient"],
    dependencies: SIO_SERVER,
    code: () => "sioSocket?.disconnect(true);\n",
  }),
  action({
    id: "sio_server_kick_id",
    label: "Disconnect a Socket.IO client or room",
    description: "Disconnects one client by its ID, or everyone in a room.",
    category: "websockets",
    group: "Socket.IO server",
    icon: "fa-solid fa-plug-circle-xmark",
    keywords: ["socket.io", "kick", "disconnect", "id", "room"],
    block: {
      type: "sio_server_kickId",
      text: ["{target} {id}", "on server {NAME}"],
      parts: {
        target: {
          options: [
            ["disconnect client with ID", "id"],
            ["disconnect everyone in room", "room"],
          ],
        },
        NAME: { part: "text", value: "main" },
      },
      inline: true,
      tooltip:
        "Closes the connection of one client (by ID) or of everyone in a room. Works anywhere.",
    },
    inputs: [
      input.dropdown(
        "target",
        "Who",
        [
          ["Client with ID", "id"],
          ["Everyone in room", "room"],
        ],
        { default: "id" },
      ),
      input.text("id", "ID or room", { default: "" }),
      input.text("NAME", "Server name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this server.",
      }),
    ],
    dependencies: SIO_SERVER,
    code: (ctx) =>
      `sioIo(${nameOf(ctx)})?.in(String(${ctx.input("id")})).disconnectSockets(true);\n`,
  }),
];

const values = [
  value({
    id: "sio_server_running",
    label: "Socket.IO server is running?",
    description: "True if the server is running.",
    category: "websockets",
    group: "Socket.IO server",
    icon: "fa-solid fa-signal",
    keywords: ["socket.io", "server", "running"],
    block: {
      type: "sio_server_isRunning",
      text: "Socket.IO server {NAME} is running?",
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
    dependencies: SIO_SERVER,
    code: (ctx) => `Boolean(sioServers[${nameOf(ctx)}]?.io)`,
  }),
  value({
    id: "sio_server_client_info",
    label: "About this Socket.IO client",
    description:
      "Something about the client these steps are about: its ID, IP address, website or rooms.",
    category: "websockets",
    group: "This client",
    icon: "fa-solid fa-circle-info",
    keywords: ["socket.io", "client", "id", "ip", "origin", "rooms"],
    block: {
      type: "sio_server_clientInfo",
      text: "{info} of this client",
      parts: {
        info: {
          options: [
            ["ID", "id"],
            ["IP address", "ip"],
            ["website (origin)", "origin"],
            ["list of rooms", "rooms"],
          ],
        },
      },
      tooltip:
        'Information about this client. The ID can be saved and used later with "send event to client with ID".',
      restrictions: [
        {
          type: "hasParent",
          blockTypes: [
            "sio_server_onConnect",
            "sio_server_onEvent",
            "sio_server_onAny",
            "sio_server_onDisconnect",
            "sio_server_forEachClient",
            "sio_server_forEachInRoom",
            "sio_server_onAuth",
          ],
          message:
            'This block must be inside a "when a client…" block or a "for each client" loop, so it knows which client "this client" is.',
        },
      ],
    },
    requires: ["sioClient"],
    output: ANY,
    inputs: [
      input.dropdown(
        "info",
        "What",
        [
          ["ID", "id"],
          ["IP address", "ip"],
          ["Website it's from (origin)", "origin"],
          ["Rooms (list)", "rooms"],
        ],
        { default: "id" },
      ),
    ],
    dependencies: SIO_SERVER,
    code: (ctx) => `sioSocketInfo(sioSocket, ${ctx.input("info")})`,
  }),
  value({
    id: "sio_server_client_handshake",
    label: "Detail this Socket.IO client sent",
    description: "A login detail, address setting or header the client connected with.",
    category: "websockets",
    group: "This client",
    icon: "fa-solid fa-key",
    keywords: ["socket.io", "auth", "query", "header", "handshake", "token"],
    block: {
      type: "sio_server_clientHandshake",
      text: ["{source} {key}", "of this client"],
      parts: {
        source: {
          options: [
            ["login detail (auth)", "auth"],
            ["query parameter", "query"],
            ["header", "headers"],
          ],
        },
      },
      inline: true,
      tooltip:
        "Something the client sent when it connected: its login details (the auth object), a value from its URL, or a header like user-agent",
      restrictions: [
        {
          type: "hasParent",
          blockTypes: [
            "sio_server_onConnect",
            "sio_server_onEvent",
            "sio_server_onAny",
            "sio_server_onDisconnect",
            "sio_server_forEachClient",
            "sio_server_forEachInRoom",
            "sio_server_onAuth",
          ],
          message:
            'This block must be inside a "when a client…" block or a "for each client" loop, so it knows which client "this client" is.',
        },
      ],
    },
    requires: ["sioClient"],
    output: ANY,
    inputs: [
      input.dropdown(
        "source",
        "From its",
        [
          ["Login details (auth)", "auth"],
          ["Address settings (query)", "query"],
          ["Headers", "headers"],
        ],
        { default: "auth" },
      ),
      input.text("key", "Name", { default: "" }),
    ],
    dependencies: SIO_SERVER,
    code: (ctx) => {
      const source = ["auth", "query", "headers"].includes(ctx.raw("source"))
        ? ctx.raw("source")
        : "auth";
      const key =
        source === "headers" ? `String(${ctx.input("key")}).toLowerCase()` : ctx.input("key");
      return `(sioSocket?.handshake?.${source}?.[${key}] ?? null)`;
    },
  }),
  value({
    id: "sio_server_client_connected",
    label: "This Socket.IO client is still connected?",
    description: "True if the client these steps are about is still connected.",
    category: "websockets",
    group: "This client",
    icon: "fa-solid fa-signal",
    keywords: ["socket.io", "connected"],
    block: {
      type: "sio_server_clientIsConnected",
      text: "this client is still connected?",
      tooltip: "True if this client hasn't disconnected yet",
      restrictions: [
        {
          type: "hasParent",
          blockTypes: [
            "sio_server_onConnect",
            "sio_server_onEvent",
            "sio_server_onAny",
            "sio_server_onDisconnect",
            "sio_server_forEachClient",
            "sio_server_forEachInRoom",
          ],
          message:
            'This block must be inside a "when a client connects / sends / disconnects" block or a "for each client" loop.',
        },
      ],
    },
    requires: ["sioConnectedClient"],
    output: "Boolean",
    dependencies: SIO_SERVER,
    code: () => "Boolean(sioSocket?.connected)",
  }),
  value({
    id: "sio_server_get_data",
    label: "Something saved on this Socket.IO client",
    description: "A value saved on the client with Save something on this Socket.IO client.",
    category: "websockets",
    group: "This client",
    icon: "fa-solid fa-box-open",
    keywords: ["socket.io", "data", "get"],
    block: {
      type: "sio_server_getData",
      text: ["get {key}", "of this client's data"],
      inline: true,
      tooltip: 'Something you saved about this client with "set … of this client\'s data"',
      restrictions: [
        {
          type: "hasParent",
          blockTypes: [
            "sio_server_onConnect",
            "sio_server_onEvent",
            "sio_server_onAny",
            "sio_server_onDisconnect",
            "sio_server_forEachClient",
            "sio_server_forEachInRoom",
            "sio_server_onAuth",
          ],
          message:
            'This block must be inside a "when a client…" block or a "for each client" loop, so it knows which client "this client" is.',
        },
      ],
    },
    requires: ["sioClient"],
    output: ANY,
    inputs: [input.text("key", "Name", { default: "" })],
    dependencies: SIO_SERVER,
    code: (ctx) => `(sioSocket?.data?.[${ctx.input("key")}] ?? null)`,
  }),
  value({
    id: "sio_server_get_data_id",
    label: "Something saved on a Socket.IO client by ID",
    description: "A value saved on a client, found by its ID.",
    category: "websockets",
    group: "Socket.IO server",
    icon: "fa-solid fa-box-open",
    keywords: ["socket.io", "data", "get", "id"],
    block: {
      type: "sio_server_getDataById",
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
    dependencies: SIO_SERVER,
    code: (ctx) =>
      `(sioServers[${nameOf(ctx)}]?.io?.sockets.sockets.get(String(${ctx.input("id")}))?.data[${ctx.input("key")}] ?? null)`,
  }),
  value({
    id: "sio_server_in_room",
    label: "This Socket.IO client is in a room?",
    description: "True if the client is in a room.",
    category: "websockets",
    group: "This client",
    icon: "fa-solid fa-door-closed",
    keywords: ["socket.io", "room"],
    block: {
      type: "sio_server_inRoom",
      text: ["this client is in room {room}", "?"],
      inline: true,
      tooltip: "True if this client is in the room",
      restrictions: [
        {
          type: "hasParent",
          blockTypes: [
            "sio_server_onConnect",
            "sio_server_onEvent",
            "sio_server_onAny",
            "sio_server_onDisconnect",
            "sio_server_forEachClient",
            "sio_server_forEachInRoom",
            "sio_server_onAuth",
          ],
          message:
            'This block must be inside a "when a client…" block or a "for each client" loop, so it knows which client "this client" is.',
        },
      ],
    },
    requires: ["sioConnectedClient"],
    output: "Boolean",
    inputs: [input.text("room", "Room", { default: "" })],
    dependencies: SIO_SERVER,
    code: (ctx) => `Boolean(sioSocket?.rooms.has(String(${ctx.input("room")})))`,
  }),
  value({
    id: "sio_server_room_info",
    label: "Socket.IO clients in a room",
    description: "How many clients are in a room, or a list of their IDs.",
    category: "websockets",
    group: "Socket.IO server",
    icon: "fa-solid fa-users",
    keywords: ["socket.io", "room", "count", "members"],
    block: {
      type: "sio_server_roomInfo",
      text: ["{info} in room {room}", "on server {NAME}"],
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
      tooltip: "Who is in a room right now",
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
      input.text("room", "Room", { default: "" }),
      input.text("NAME", "Server name", {
        default: "main",
        allowValues: false,
        help: "Any name you like. Use the same name in every step for this server.",
      }),
    ],
    dependencies: SIO_SERVER,
    code: (ctx) =>
      ctx.raw("info") === "ids"
        ? `sioRoomSockets(${nameOf(ctx)}, ${ctx.input("room")}).map((socket) => socket.id)`
        : `sioRoomSockets(${nameOf(ctx)}, ${ctx.input("room")}).length`,
  }),
  value({
    id: "sio_server_clients",
    label: "Connected Socket.IO clients",
    description: "How many clients are connected to a server, or a list of their IDs.",
    category: "websockets",
    group: "Socket.IO server",
    icon: "fa-solid fa-users",
    keywords: ["socket.io", "clients", "count", "online"],
    block: {
      type: "sio_server_clientsInfo",
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
    dependencies: SIO_SERVER,
    code: (ctx) =>
      ctx.raw("info") === "ids"
        ? `sioServerSockets(${nameOf(ctx)}).map((socket) => socket.id)`
        : `sioServerSockets(${nameOf(ctx)}).length`,
  }),
  value({
    id: "sio_server_id_connected",
    label: "Socket.IO client is connected?",
    description: "True if a client with this ID is connected to a server.",
    category: "websockets",
    group: "Socket.IO server",
    icon: "fa-solid fa-user-check",
    keywords: ["socket.io", "connected", "online", "id"],
    block: {
      type: "sio_server_idConnected",
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
    dependencies: SIO_SERVER,
    code: (ctx) =>
      `Boolean(sioServers[${nameOf(ctx)}]?.io?.sockets.sockets.has(String(${ctx.input("id")})))`,
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
      key: "sioClient",
      label: "a Socket.IO client",
      description:
        "Only works in a Socket.IO server's events, or while repeating with its clients.",
      variable: "sioSocket",
    },
    {
      key: "sioConnectedClient",
      label: "a connected Socket.IO client",
      description:
        'Only works once a client is connected: in the server\'s events (not "tries to connect"), or while repeating with its clients.',
      variable: "sioSocket",
    },
    {
      key: "sioServerEvent",
      label: "an event from a Socket.IO client",
      description: 'Only works in "When a client sends a Socket.IO event".',
      variable: "sioAck",
    },
    {
      key: "sioAuth",
      label: "a Socket.IO client trying to connect",
      description: 'Only works in "When a client tries to connect to a Socket.IO server".',
      variable: "sioAuth",
    },
  ],
};
