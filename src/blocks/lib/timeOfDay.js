/** The block types that need `timeOfDayHelpers` in the exported bot. */
export const timeOfDayBlocks = ["time_isTime", "time_whenTime"];

/* Emitted only when a project uses one of the blocks above, the same way
   the dashboard helper is, so every other project's code is unchanged. */
export const timeOfDayHelpers = `
/* Time of day */
const disfuseTimeFormats = new Map();
function disfuseTimeParts(date, timeZone) {
  const key = timeZone ?? "local";
  if (!disfuseTimeFormats.has(key))
    disfuseTimeFormats.set(key, new Intl.DateTimeFormat("en-US", {
      timeZone, hourCycle: "h23", hour: "numeric", minute: "numeric", second: "numeric"
    }));
  const parts = {};
  for (const { type, value } of disfuseTimeFormats.get(key).formatToParts(date))
    if (type === "hour" || type === "minute" || type === "second") parts[type] = Number(value);
  /* Some older ICU builds print midnight as 24 even with h23. */
  parts.hour %= 24;
  return parts;
}
function disfuseTimeMatches(target, timeZone, date = new Date()) {
  const now = disfuseTimeParts(date, timeZone);
  return ["hour", "minute", "second"].every(unit => target[unit] === null || target[unit] === now[unit]);
}
function disfuseOnTime(target, timeZone, callback) {
  let last = Math.floor(Date.now() / 1000);
  const schedule = () => setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
  /* Every second since the last tick is checked, so a busy event loop
     can't step over the moment; capped so waking from a long pause
     doesn't replay hours of matches at once. */
  function tick() {
    const current = Math.floor(Date.now() / 1000);
    for (let s = Math.max(last + 1, current - 59); s <= current; s++)
      if (disfuseTimeMatches(target, timeZone, new Date(s * 1000)))
        Promise.resolve().then(callback).catch(console.error);
    last = current;
    schedule();
  }
  schedule();
}
/* ------------------------- */`.trim();
