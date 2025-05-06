const blockImports = {
  fs_: ["fs", "path"],
  music_: "lyrics-finder",
  db_: "easy-json-database",
  game_: "discord-gamecord",
  events_: "discord-logs",
  captcha_: "@haileybot/captcha-generator",
  fetch_: "axios",
  time_: "ms",
  canvas_: "@napi-rs/canvas",
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
