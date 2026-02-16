const blockImports = {
  fs_: ["fs", "path"],
  music_: "lyrics-finder",
  db_: "easy-json-database",
  game_: "discord-gamecord",
  captcha_: {
    code: `const { Captcha } = require("@ddededodediamante/captcha-generator");`,
  },
  fetch_: "axios",
  time_: "ms",
  canvas_: "@napi-rs/canvas",
  events_guild_memberAdd: {
    code: `
      const discord_logs = require("discord-logs");
      discord_logs(client);
      
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
        break;
      }
    }
  }

  return Array.from(dependencies);
}
