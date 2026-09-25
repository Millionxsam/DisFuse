import {
  sioClientRuntime,
  sioServerRuntime,
  wsRuntime,
} from "../blocks/apps/websockets/runtime.js";

const blockImports = {
  fs_: ["fs", "path"],
  music_: "lyrics-finder",
  db_: "easy-json-database",
  game_: "discord-gamecord",
  captcha_: {
    package: "@ddededodediamante/captcha-generator",
    code: `const { Captcha } = require("@ddededodediamante/captcha-generator");`,
  },
  fetch_: "axios",
  /* Dashboard blocks talk to the DisFuse API over HTTP. The helper they
     call is emitted by updateCode.js, next to the other util functions. */
  dashboard_: "axios",
  time_: "ms",
  canvas_: "@napi-rs/canvas",
  /* WebSocket blocks bring their helpers with them; see
     blocks/apps/websockets/runtime.js. `ws_` covers both the client and
     server blocks, which share one `ws` import. */
  ws_: { package: "ws", code: wsRuntime },
  sio_client_: { package: "socket.io-client", code: sioClientRuntime },
  sio_server_: { package: "socket.io", code: sioServerRuntime },
  events_: {
    package: "discord-logs",
    code: `
      require("discord-logs")(client);
    `,
  },
  events_guild_memberAdd: {
    package: "@androz2091/discord-invites-tracker",
    code: `      
      const InvitesTracker = require("@androz2091/discord-invites-tracker");
      const tracker = InvitesTracker.init(client, {
        fetchGuilds: true,
        fetchVanity: true,
        fetchAuditLogs: true,
      });
    `,
  },
};

export default function packageDependenciesFromBlocks(blocks) {
  const dependencies = new Set();

  for (const block of blocks) {
    if (!block.type) continue;

    for (const prefix in blockImports) {
      if (block.type.startsWith(prefix)) {
        const entry = blockImports[prefix];
        if (Array.isArray(entry)) {
          entry.forEach((dep) => dependencies.add(dep));
        } else {
          dependencies.add(entry);
        }
      }
    }
  }

  return Array.from(dependencies);
}
