/* =====================================================================
   What a bot using WebSocket blocks gets at the top of its index.js
   ---------------------------------------------------------------------
   These are emitted by functions/packageDependenciesFromBlocks.js, once
   per project, and only when a block of that family is used — so every
   other project generates exactly the code it always did.

   The blocks themselves stay small: they call these helpers by name.
   Connections and servers are kept in registries keyed by the name the
   user typed, and "when…" blocks push a listener into that registry
   rather than onto a live socket. That makes order irrelevant — a
   "when a message arrives" block works whether it runs before or after
   the "connect" block — and it survives reconnects, which replace the
   underlying socket.

   Kept as String.raw so the regular expressions below don't need their
   backslashes doubled. No backticks or dollar-braces in here.
   ===================================================================== */

/** Plain WebSockets, client and server, via the `ws` package. */
export const wsRuntime = String.raw`
const WebSocket = require("ws");
const wsCrypto = require("crypto");

/* WebSocket helpers (added by DisFuse) */
const wsConnections = {};
const wsServers = {};

function wsRun(handlers, ...args) {
  handlers.forEach((handler) => {
    try {
      Promise.resolve(handler(...args)).catch((error) => console.error(error));
    } catch (error) {
      console.error(error);
    }
  });
}

function wsEncode(value) {
  if (typeof value === "string" || Buffer.isBuffer(value)) return value;
  if (value === undefined || value === null) return "";
  return JSON.stringify(value);
}

function wsDecode(raw) {
  if (Buffer.isBuffer(raw)) return raw.toString();
  if (Array.isArray(raw)) return Buffer.concat(raw).toString();
  if (raw instanceof ArrayBuffer) return Buffer.from(raw).toString();
  return String(raw);
}

function wsParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function wsEvent(event, data) {
  return JSON.stringify({ event: String(event), data: data === undefined ? null : data });
}

function wsCloseArgs(code, reason) {
  code = Number(code);
  if (!(code === 1000 || (code >= 3000 && code <= 4999))) code = 1000;
  return [code, String(reason || "").slice(0, 120)];
}

/* ---- connecting to a WebSocket server ---- */

function wsConnection(name) {
  return (wsConnections[name] ||= {
    name,
    socket: null,
    url: null,
    options: {},
    reconnect: false,
    closedByUser: false,
    attempts: 0,
    timer: null,
    queue: [],
    handlers: { open: [], message: [], close: [], error: [] },
  });
}

function wsOnConnection(name, type, handler) {
  wsConnection(name).handlers[type].push(handler);
}

function wsConnect(name, url, { reconnect = true, headers, protocols } = {}) {
  const connection = wsConnection(name);
  clearTimeout(connection.timer);
  connection.timer = null;

  const previous = connection.socket;
  connection.socket = null;
  if (previous && previous.readyState < 2) previous.terminate();

  connection.url = url;
  connection.options = { headers, protocols };
  connection.reconnect = reconnect;
  connection.closedByUser = false;

  let socket;
  try {
    socket = new WebSocket(url, protocols ? [].concat(protocols) : [], headers ? { headers } : {});
  } catch (error) {
    console.error("Couldn't connect to the WebSocket server " + url + ": " + error.message);
    return;
  }
  connection.socket = socket;

  socket.on("open", () => {
    if (socket !== connection.socket) return;
    connection.attempts = 0;
    connection.queue.splice(0).forEach((data) => socket.send(data));
    wsRun(connection.handlers.open);
  });

  socket.on("message", (raw) => {
    if (socket !== connection.socket) return;
    wsRun(connection.handlers.message, wsDecode(raw));
  });

  socket.on("error", (error) => {
    if (socket !== connection.socket) return;
    if (connection.handlers.error.length) wsRun(connection.handlers.error, error);
    else console.error("WebSocket connection " + JSON.stringify(name) + " error: " + error.message);
  });

  socket.on("close", (code, reason) => {
    if (socket !== connection.socket) return;
    wsRun(connection.handlers.close, code, String(reason || ""));

    if (connection.reconnect && !connection.closedByUser) {
      const delay = Math.min(30000, 1000 * 2 ** connection.attempts++);
      connection.timer = setTimeout(
        () => wsConnect(name, connection.url, { ...connection.options, reconnect: true }),
        delay,
      );
    }
  });
}

function wsSend(name, value) {
  const connection = wsConnections[name];
  const data = wsEncode(value);

  if (connection?.socket?.readyState === WebSocket.OPEN) return connection.socket.send(data);

  /* Still connecting (or about to reconnect): send it once it opens. */
  if (connection && !connection.closedByUser && (connection.socket || connection.timer)) {
    if (connection.queue.length < 100) connection.queue.push(data);
    return;
  }

  console.warn("Can't send: the WebSocket connection " + JSON.stringify(name) + " isn't connected");
}

function wsDisconnect(name, code, reason) {
  const connection = wsConnections[name];
  if (!connection) return;
  connection.closedByUser = true;
  clearTimeout(connection.timer);
  connection.timer = null;
  connection.queue = [];
  if (connection.socket && connection.socket.readyState < 2) connection.socket.close(...wsCloseArgs(code, reason));
}

function wsReconnect(name) {
  const connection = wsConnections[name];
  if (!connection?.url) return console.warn("Can't reconnect: " + JSON.stringify(name) + " was never connected");
  wsConnect(name, connection.url, { ...connection.options, reconnect: connection.reconnect });
}

function wsState(name) {
  const socket = wsConnections[name]?.socket;
  if (!socket) return "closed";
  return ["connecting", "open", "closing", "closed"][socket.readyState];
}

function wsWaitOpen(name, seconds = 10) {
  return new Promise((resolve) => {
    const started = Date.now();
    const check = () => {
      if (wsConnections[name]?.socket?.readyState === WebSocket.OPEN) return resolve(true);
      if (Date.now() - started >= Number(seconds) * 1000) return resolve(false);
      setTimeout(check, 100);
    };
    check();
  });
}

/* ---- hosting a WebSocket server ---- */

function wsServer(name) {
  return (wsServers[name] ||= {
    name,
    server: null,
    heartbeat: null,
    clients: new Map(),
    handlers: { verify: [], connection: [], message: [], close: [], listening: [], error: [] },
  });
}

function wsOnServer(name, type, handler) {
  wsServer(name).handlers[type].push(handler);
}

function wsClientRecord(request) {
  return { id: wsCrypto.randomUUID(), request, data: {}, groups: new Set(), alive: true };
}

function wsStartServer(name, port) {
  const holder = wsServer(name);
  wsStopServer(name);

  const server = new WebSocket.Server({
    port: Number(port),
    verifyClient: (info, done) => {
      if (!holder.handlers.verify.length) return done(true);

      /* Not connected yet, but the info and data blocks work on it, and
         whatever data is set here carries over to the real connection. */
      const client = { disfuse: wsClientRecord(info.req), readyState: -1 };
      info.req.disfuseClient = client.disfuse;

      (async () => {
        for (const handler of holder.handlers.verify) {
          try {
            await handler(client);
          } catch (error) {
            console.error(error);
          }
          if (client.disfuse.rejected !== undefined) break;
        }

        if (client.disfuse.rejected === undefined) return done(true);
        const message = String(client.disfuse.rejected || "Unauthorized").replace(/[^\t\x20-\x7e]/g, "");
        done(false, 401, message || "Unauthorized");
      })();
    },
  });

  holder.server = server;

  server.on("listening", () => wsRun(holder.handlers.listening));

  server.on("error", (error) => {
    if (holder.handlers.error.length) wsRun(holder.handlers.error, error);
    else console.error("WebSocket server " + JSON.stringify(name) + " error: " + error.message);
  });

  server.on("connection", (socket, request) => {
    socket.disfuse = request.disfuseClient || wsClientRecord(request);
    delete socket.disfuse.rejected;
    holder.clients.set(socket.disfuse.id, socket);

    socket.on("pong", () => (socket.disfuse.alive = true));
    socket.on("error", (error) => console.error("WebSocket client error: " + error.message));
    socket.on("message", (raw) => wsRun(holder.handlers.message, socket, wsDecode(raw)));
    socket.on("close", (code, reason) => {
      holder.clients.delete(socket.disfuse.id);
      wsRun(holder.handlers.close, socket, code, String(reason || ""));
    });

    wsRun(holder.handlers.connection, socket);
  });

  /* Drop clients that vanished without saying goodbye. */
  holder.heartbeat = setInterval(() => {
    holder.clients.forEach((socket) => {
      if (!socket.disfuse.alive) return socket.terminate();
      socket.disfuse.alive = false;
      socket.ping();
    });
  }, 30000);
}

function wsStopServer(name) {
  const holder = wsServers[name];
  if (!holder?.server) return;
  clearInterval(holder.heartbeat);
  holder.clients.forEach((socket) => socket.close(1001, "Server stopped"));
  holder.server.close();
  holder.server = null;
}

function wsServerClients(name) {
  return [...(wsServers[name]?.clients.values() || [])];
}

function wsGroupClients(name, group) {
  return wsServerClients(name).filter((socket) => socket.disfuse.groups.has(String(group)));
}

function wsSendTo(socket, value) {
  if (socket?.readyState === WebSocket.OPEN) socket.send(wsEncode(value));
}

function wsSendToId(name, id, value) {
  wsSendTo(wsServers[name]?.clients.get(String(id)), value);
}

function wsSendToMany(sockets, value, except) {
  const data = wsEncode(value);
  sockets.forEach((socket) => {
    if (socket !== except && socket.readyState === WebSocket.OPEN) socket.send(data);
  });
}

function wsClientInfo(socket, info) {
  const client = socket?.disfuse;
  if (!client) return null;
  const request = client.request || {};
  const headers = request.headers || {};

  switch (info) {
    case "id":
      return client.id;
    case "ip":
      return String(headers["x-forwarded-for"] || "").split(",")[0].trim() || request.socket?.remoteAddress || null;
    case "origin":
      return headers.origin || null;
    case "path":
      return new URL(request.url || "/", "http://localhost").pathname;
    case "url":
      return request.url || "/";
    case "groups":
      return [...client.groups];
    default:
      return null;
  }
}

function wsClientQuery(socket, key) {
  try {
    return new URL(socket.disfuse.request.url, "http://localhost").searchParams.get(String(key));
  } catch {
    return null;
  }
}

function wsClientHeader(socket, key) {
  return socket?.disfuse?.request?.headers?.[String(key).toLowerCase()] ?? null;
}
`;

/** Connecting to a Socket.IO server, via `socket.io-client`. */
export const sioClientRuntime = String.raw`
const { io: socketIoConnect } = require("socket.io-client");

/* Socket.IO client helpers (added by DisFuse) */
const sioClients = {};

function sioRun(handler, ...args) {
  try {
    Promise.resolve(handler(...args)).catch((error) => console.error(error));
  } catch (error) {
    console.error(error);
  }
}

function sioClient(name) {
  return (sioClients[name] ||= { name, socket: null, handlers: [] });
}

function sioClientAttach(socket, entry) {
  const run = (...args) => sioRun(entry.handler, ...args);
  if (entry.any) socket.onAny(run);
  else socket.on(entry.event, run);
}

function sioOnClient(name, event, handler) {
  const client = sioClient(name);
  const entry = { event, handler };
  client.handlers.push(entry);
  if (client.socket) sioClientAttach(client.socket, entry);
}

function sioOnAnyClient(name, handler) {
  const client = sioClient(name);
  const entry = { any: true, handler };
  client.handlers.push(entry);
  if (client.socket) sioClientAttach(client.socket, entry);
}

function sioConnect(name, url, options = {}) {
  const client = sioClient(name);

  if (client.socket) {
    client.socket.off();
    client.socket.offAny();
    client.socket.disconnect();
  }

  Object.keys(options).forEach((key) => options[key] === undefined && delete options[key]);

  client.socket = socketIoConnect(url, options);
  client.handlers.forEach((entry) => sioClientAttach(client.socket, entry));

  client.socket.on("connect_error", (error) => {
    if (client.handlers.some((entry) => entry.event === "connect_error")) return;
    console.error("Socket.IO connection " + JSON.stringify(name) + " error: " + error.message);
  });
}

function sioClientSocket(name) {
  const socket = sioClients[name]?.socket;
  if (!socket) console.warn("The Socket.IO connection " + JSON.stringify(name) + " hasn't been connected yet");
  return socket;
}

function sioEmitWithAck(socket, event, data, seconds = 5) {
  if (!socket) return Promise.resolve(null);
  return socket
    .timeout(Number(seconds) * 1000)
    .emitWithAck(String(event), data)
    .catch(() => null);
}

function sioWaitConnected(name, seconds = 10) {
  return new Promise((resolve) => {
    const started = Date.now();
    const check = () => {
      if (sioClients[name]?.socket?.connected) return resolve(true);
      if (Date.now() - started >= Number(seconds) * 1000) return resolve(false);
      setTimeout(check, 100);
    };
    check();
  });
}

function sioSplitArgs(args) {
  const ack = typeof args[args.length - 1] === "function" ? args.pop() : null;
  return { args, ack };
}
`;

/** Hosting a Socket.IO server, via `socket.io`. */
export const sioServerRuntime = String.raw`
const { Server: SocketIoServer } = require("socket.io");
const sioHttp = require("http");

/* Socket.IO server helpers (added by DisFuse) */
const sioServers = {};

function sioServerRun(handler, ...args) {
  try {
    Promise.resolve(handler(...args)).catch((error) => console.error(error));
  } catch (error) {
    console.error(error);
  }
}

function sioServer(name) {
  return (sioServers[name] ||= { name, io: null, handlers: [] });
}

function sioServerAttach(socket, entry) {
  if (entry.type === "event") socket.on(entry.event, (...args) => sioServerRun(entry.handler, socket, ...args));
  if (entry.type === "any") socket.onAny((...args) => sioServerRun(entry.handler, socket, ...args));
  if (entry.type === "disconnect") socket.on("disconnect", (reason) => sioServerRun(entry.handler, socket, reason));
}

function sioOnServer(name, type, handler, event) {
  const server = sioServer(name);
  const entry = { type, handler, event };
  server.handlers.push(entry);
  if (server.io) server.io.sockets.sockets.forEach((socket) => sioServerAttach(socket, entry));
}

function sioStartServer(name, port, cors = "*") {
  const server = sioServer(name);
  sioStopServer(name);

  const origins = String(cors || "*").trim();
  const httpServer = sioHttp.createServer((request, response) => {
    response.writeHead(200, { "Content-Type": "text/plain" });
    response.end("Socket.IO server is running");
  });

  const io = new SocketIoServer(httpServer, {
    cors: { origin: origins === "*" ? "*" : origins.split(",").map((origin) => origin.trim()) },
  });
  server.io = io;

  io.use(async (socket, next) => {
    const auth = {};
    for (const entry of server.handlers.filter((entry) => entry.type === "auth")) {
      try {
        await entry.handler(socket, auth);
      } catch (error) {
        console.error(error);
      }
      if (auth.rejected !== undefined) return next(new Error(String(auth.rejected || "Unauthorized")));
    }
    next();
  });

  io.on("connection", (socket) => {
    server.handlers.forEach((entry) => sioServerAttach(socket, entry));
    server.handlers
      .filter((entry) => entry.type === "connection")
      .forEach((entry) => sioServerRun(entry.handler, socket));
  });

  httpServer.on("listening", () =>
    server.handlers
      .filter((entry) => entry.type === "listening")
      .forEach((entry) => sioServerRun(entry.handler)),
  );
  httpServer.on("error", (error) =>
    console.error("Socket.IO server " + JSON.stringify(name) + " error: " + error.message),
  );

  httpServer.listen(Number(port));
}

function sioStopServer(name) {
  const server = sioServers[name];
  if (!server?.io) return;
  server.io.close();
  server.io = null;
}

function sioIo(name) {
  const io = sioServers[name]?.io;
  if (!io) console.warn("The Socket.IO server " + JSON.stringify(name) + " isn't running");
  return io;
}

function sioServerSockets(name) {
  return [...(sioServers[name]?.io?.sockets.sockets.values() || [])];
}

function sioRoomSockets(name, room) {
  const io = sioServers[name]?.io;
  if (!io) return [];
  return [...(io.sockets.adapter.rooms.get(String(room)) || [])]
    .map((id) => io.sockets.sockets.get(id))
    .filter(Boolean);
}

function sioSocketInfo(socket, info) {
  if (!socket) return null;
  const handshake = socket.handshake || {};
  const headers = handshake.headers || {};

  switch (info) {
    case "id":
      return socket.id;
    case "ip":
      return String(headers["x-forwarded-for"] || "").split(",")[0].trim() || handshake.address || null;
    case "origin":
      return headers.origin || null;
    case "rooms":
      return [...socket.rooms].filter((room) => room !== socket.id);
    default:
      return null;
  }
}

function sioServerEmitWithAck(socket, event, data, seconds = 5) {
  if (!socket) return Promise.resolve(null);
  return socket
    .timeout(Number(seconds) * 1000)
    .emitWithAck(String(event), data)
    .catch(() => null);
}

function sioServerSplitArgs(args) {
  const ack = typeof args[args.length - 1] === "function" ? args.pop() : null;
  return { args, ack };
}
`;
