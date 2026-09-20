export const utilFunctions = `
/* DisFuse utility functions */
async function wait(ms) {
  return new Promise(async (resolve) => setTimeout(resolve, ms))
};

/* Command cooldowns */
const disfuseCooldowns = new Map();
async function getCollection(guild, type) {
  if (!guild) return null;
  const manager = guild[type];
  if (!manager) return null;
  if (manager.cache) return manager.cache;
  return await manager.fetch();
}
async function getFromCollection(guild, type, value, mode = "id") {
  const collection = await getCollection(guild, type);
  if (!collection) return null;
  if (mode === "id") return collection.get(value) ?? null;
  return collection.find(item => item.name === value) ?? null;
}
async function forEachCollection(guild, type, callback) {
  const collection = await getCollection(guild, type);
  if (!collection) return;
  for (const item of collection.values()) {
    await callback(item);
  }
}

/* List helpers.
   Every callback a block generates is an async function, so a condition
   built out of blocks may await. Array.prototype.filter/find/map can't
   wait for a promise — they'd see one and treat it as truthy — so the
   list blocks go through these instead. */
async function asyncFilter(list, callback) {
  const items = [...(list ?? [])];
  const keep = await Promise.all(items.map((item, i) => callback(item, i)));
  return items.filter((_, i) => keep[i]);
}
async function asyncFind(list, callback) {
  for (const [i, item] of [...(list ?? [])].entries()) {
    if (await callback(item, i)) return item;
  }
  return undefined;
}
async function asyncMap(list, callback) {
  return await Promise.all([...(list ?? [])].map((item, i) => callback(item, i)));
}
/* ------------------------- */`.trim();

export function formatEmbeds(embedsCode) {
  if (!embedsCode) return "";
  return embedsCode.replaceAll("'", "").replaceAll('"', "").replaceAll("`", "");
}

export function isEmptyString(str = "") {
  if (!str) return true;
  str = str?.trim();
  return !str || str === "" || str === "''" || str === '""' || str == "``";
}

export function buildMessageOptions({
  content = "",
  embeds,
  rows,
  files,
  ephemeral,
} = {}) {
  const options = [];
  if (!isEmptyString(content)) options.push(`content: ${content}`);
  if (embeds) options.push(`embeds: [${formatEmbeds(embeds)}]`);
  if (rows) options.push(`components: [\n${rows}]`);
  if (files) options.push(`files: [\n${files}]`);
  if (ephemeral) options.push(`ephemeral: ${ephemeral}`);
  return options;
}

export function buildThenSuffix(thenCode) {
  if (!thenCode) return ";\n";
  return `.then(async (messageSent) => {\n${thenCode}});\n`;
}

export function buildDmSend(target, { content, embeds, rows }) {
  const parts = [
    ...(!isEmptyString(content) ? [`content: ${content || "''"}`] : []),
    `embeds: [${formatEmbeds(embeds)}]`,
    ...(rows ? [`components: [${rows}]`] : []),
  ];

  return `await ${target}.send({\n  ${parts.join(", ")}\n});\n`;
}
