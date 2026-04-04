export const utilFunctions = `
async function getCollection(guild, type) {
  if (!guild) return null;
  const manager = guild[type];
  if (!manager) return null;
  if (manager.cache?.size) return manager.cache;
  return await manager.fetch();
},
async function getFromCollection(guild, type, value, mode = "id") {
  const collection = await getCollection(guild, type);
  if (!collection) return null;
  if (mode === "id") return collection.get(value) ?? null;
  return collection.find(item => item.name === value) ?? null;
},
async function forEachCollection(guild, type, callback) {
  const collection = await getCollection(guild, type);
  if (!collection) return;
  for (const item of collection.values()) {
    await callback(item);
  }
}
`.trim();

export function formatEmbeds(embedsCode) {
  if (!embedsCode) return "";
  return embedsCode.replaceAll("'", "");
}

export function buildMessageOptions({
  content = "''",
  embeds,
  rows,
  files,
  ephemeral,
} = {}) {
  const options = [`content: ${content}`];
  if (embeds) options.push(`embeds: [${formatEmbeds(embeds)}]`);
  if (rows) options.push(`components: [\n${rows}]`);
  if (files) options.push(`files: [\n${files}]`);
  if (ephemeral) options.push(`ephemeral: ${ephemeral}`);
  return options;
}

export function buildThenSuffix(thenCode) {
  if (!thenCode) return ";\n";
  return `.then((messageSent) => {\n${thenCode}});\n`;
}

export function buildLegacySend(target, { content, embeds, rows, files, then }) {
  const parts = [
    `content: ${content || "''"}`,
    `embeds: [${formatEmbeds(embeds)}]`,
    ...(rows ? [`components: [\n${rows}]`] : []),
    ...(files ? [`files: [\n${files}]`] : []),
  ];

  return `await ${target}.send({\n  ${parts.join(",\n  ")}\n}).then((messageSent) => {\n  ${then ?? ""}});\n`;
}

export function buildDmSend(target, { content, embeds, rows }) {
  const parts = [
    `content: ${content || "''"}`,
    `embeds: [${formatEmbeds(embeds)}]`,
    ...(rows ? [`components: [${rows}]`] : []),
  ];

  return `await ${target}.send({\n    ${parts.join(",\n    ")}\n  });`;
}
