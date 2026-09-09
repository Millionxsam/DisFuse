import { apiUrl } from "../config/config";

/* =====================================================================
   Insights logging (generated bot code)
   ---------------------------------------------------------------------
   Emitted into every project's code, whatever blocks it uses — this is
   DisFuse infrastructure rather than a Blockly event block. It is what
   fills the Insights page at /insights.

   Three rules shaped this:

     1. It must never break someone's bot. Every call is wrapped, the
        queue is bounded, failures are swallowed and nothing is awaited
        on a path the bot's own code runs.
     2. It must be cheap. Events are batched and flushed on a timer, so
        a bot handling a hundred commands a second makes six HTTP
        requests a minute, not six thousand.
     3. It must authenticate as the bot. The Authorization header is the
        bot's own Discord token, which the API resolves against Discord
        and matches against the project — see the API's insightsRouter.

   The API address is baked in at generation time, so a project exported
   from a local DisFuse talks to a local API, and DISFUSE_API_URL
   overrides it without regenerating anything.
   ===================================================================== */

/** How often the queue is sent, and how often bot state is refreshed. */
const FLUSH_INTERVAL_MS = 10000;
const SNAPSHOT_INTERVAL_MS = 30 * 60 * 1000;

/**
 * @param {object} project the DisFuse project the code belongs to
 * @returns {string} JavaScript to drop into the generated bot, or "" for
 *   a project that has no ID yet (nothing to report against)
 */
export default function insightsCode(project) {
  const projectId = project?._id || project?.id;
  if (!projectId) return "";

  return `
/* DisFuse Insights — usage analytics for this bot.
   Reports which commands are used, by whom and where, so the bot's
   owner can see them at https://disfuse.xyz/insights.
   Set DISFUSE_INSIGHTS=off in your environment to turn it off. */
const DISFUSE_API_URL = process.env.DISFUSE_API_URL || "${apiUrl}";
const DISFUSE_PROJECT_ID = "${String(projectId)}";
const disfuseInsights = {
  queue: [],
  snapshot: null,
  sending: false,
  /* No token, no Node 18+ fetch, or switched off: stay silent. */
  enabled:
    process.env.DISFUSE_INSIGHTS !== "off" &&
    typeof fetch === "function" &&
    Boolean(process.env.DISFUSE_SECURE_BOT_TOKEN),
};

function disfuseLogEvent(event) {
  if (!disfuseInsights.enabled || !event) return;
  /* Bounded: if the API is unreachable the bot drops analytics rather
     than growing a queue forever. */
  if (disfuseInsights.queue.length >= 500) return;

  disfuseInsights.queue.push({ at: new Date().toISOString(), ...event });
  if (disfuseInsights.queue.length >= 100) disfuseFlushInsights();
}

function disfuseTakeSnapshot() {
  if (!disfuseInsights.enabled || !client.guilds) return;

  try {
    const guilds = [...client.guilds.cache.values()];

    disfuseInsights.snapshot = {
      guildCount: guilds.length,
      memberCount: guilds.reduce((total, g) => total + (g.memberCount || 0), 0),
      channelCount: client.channels?.cache?.size || 0,
      guilds: guilds
        .map((g) => ({
          id: g.id,
          name: g.name,
          members: g.memberCount || 0,
          channels: g.channels?.cache?.size || 0,
          joinedAt: g.joinedAt || undefined,
        }))
        .sort((a, b) => b.members - a.members)
        .slice(0, 200),
    };
  } catch {
    /* A snapshot is a nice-to-have; never let it matter. */
  }
}

async function disfuseFlushInsights() {
  if (!disfuseInsights.enabled || disfuseInsights.sending) return;

  const snapshot = disfuseInsights.snapshot;
  const events = disfuseInsights.queue.splice(0, 100);
  if (!events.length && !snapshot) return;

  disfuseInsights.sending = true;
  disfuseInsights.snapshot = null;

  try {
    await fetch(
      \`\${DISFUSE_API_URL}/projects/\${DISFUSE_PROJECT_ID}/insights/events\`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: \`Bot \${process.env.DISFUSE_SECURE_BOT_TOKEN}\`,
        },
        body: JSON.stringify({ events, snapshot }),
      }
    );
  } catch {
    /* Offline or the API is down — keep the events for the next flush. */
    if (disfuseInsights.queue.length + events.length <= 500)
      disfuseInsights.queue.unshift(...events);
    if (snapshot) disfuseInsights.snapshot = snapshot;
  } finally {
    disfuseInsights.sending = false;
  }
}

if (disfuseInsights.enabled) {
  setInterval(disfuseFlushInsights, ${FLUSH_INTERVAL_MS}).unref?.();
  setInterval(() => {
    disfuseTakeSnapshot();
    disfuseFlushInsights();
  }, ${SNAPSHOT_INTERVAL_MS}).unref?.();

  process.on("beforeExit", () => disfuseFlushInsights());
  process.on("uncaughtException", (error) =>
    disfuseLogEvent({
      type: "error",
      name: error?.name || "Error",
      detail: error?.message || String(error),
      ok: false,
    })
  );

  client.on("clientReady", () => {
    disfuseTakeSnapshot();
    disfuseLogEvent({
      type: "ready",
      name: client.user?.tag,
      value: client.guilds?.cache?.size || 0,
    });
    disfuseFlushInsights();
  });

  client.on("error", (error) =>
    disfuseLogEvent({
      type: "error",
      name: error?.name || "ClientError",
      detail: error?.message || String(error),
      ok: false,
    })
  );

  client.on("guildCreate", (guild) => {
    disfuseTakeSnapshot();
    disfuseLogEvent({
      type: "guildJoin",
      name: guild?.name,
      guildId: guild?.id,
      guildName: guild?.name,
      value: guild?.memberCount || 0,
    });
    disfuseFlushInsights();
  });

  client.on("guildDelete", (guild) => {
    disfuseTakeSnapshot();
    disfuseLogEvent({
      type: "guildLeave",
      name: guild?.name,
      guildId: guild?.id,
      guildName: guild?.name,
      value: guild?.memberCount || 0,
    });
    disfuseFlushInsights();
  });

  /* Every interaction the bot receives. Autocomplete is deliberately
     skipped: it fires on every keystroke and says nothing useful. */
  client.on("interactionCreate", (interaction) => {
    let type = null;
    let kind = null;
    let name = null;

    try {
      if (interaction.isChatInputCommand?.()) {
        type = "command";
        kind = "chat";
        name = interaction.commandName;

        const group = interaction.options?.getSubcommandGroup?.(false);
        const sub = interaction.options?.getSubcommand?.(false);
        if (group) name += " " + group;
        if (sub) name += " " + sub;
      } else if (interaction.isContextMenuCommand?.()) {
        type = "context";
        kind = interaction.isUserContextMenuCommand?.() ? "user" : "message";
        name = interaction.commandName;
      } else if (interaction.isModalSubmit?.()) {
        type = "modal";
        kind = "modal";
        name = interaction.customId;
      } else if (interaction.isButton?.()) {
        type = "component";
        kind = "button";
        name = interaction.customId;
      } else if (
        interaction.isAnySelectMenu?.() ||
        interaction.isStringSelectMenu?.()
      ) {
        type = "component";
        kind = "select";
        name = interaction.customId;
      }
    } catch {
      type = null;
    }

    if (!type) return;

    const at = new Date().toISOString();
    const started = Date.now();
    let ticks = 0;

    /* Wait for the bot's own handlers to answer before logging. This is
       what turns "was this command handled at all" and "how long did it
       take" into real numbers: an interaction that is never replied to
       or deferred is one the bot did not handle. Gives up after ~2.4s,
       which is longer than Discord's own 3s reply window matters for. */
    const watcher = setInterval(() => {
      ticks += 1;
      const answered = Boolean(interaction.replied || interaction.deferred);
      if (!answered && ticks < 12) return;

      clearInterval(watcher);

      disfuseLogEvent({
        at,
        type,
        kind,
        name,
        ok: answered,
        value: answered ? Date.now() - started : undefined,
        userId: interaction.user?.id,
        userName: interaction.user?.username,
        guildId: interaction.guildId || undefined,
        guildName: interaction.guild?.name,
        channelId: interaction.channelId || undefined,
      });
    }, 200);

    watcher.unref?.();
  });
}
/* ------------------------- */`.trim();
}
