/* =====================================================================
   DisFuse Premium — what you get, and the ways to pay for it
   ---------------------------------------------------------------------
   Display copy only. The frontend sends nothing but a plan `id` to the
   API, which resolves the matching Stripe Price itself — a client can
   never choose what it pays.

   There is ONE product. Every plan unlocks exactly the same features, so
   the feature list lives here once (`premiumFeatures`) and is rendered
   above the plans; a plan only says how often you pay for it.

   These prices must stay in step with the Stripe Prices configured in
   the API's `stripe_price_*` environment variables (see config.js there).
   ===================================================================== */

/**
 * The Premium brand mark, served straight out of `public/`.
 *
 * Every Premium surface reads it from here so the logo only ever has to
 * change in one place. The API signs its Premium DMs with the same file
 * at `https://disfuse.xyz/media/disfusePremium.png`.
 */
export const premiumLogo = "/media/disfusePremium.png";

/** The headline features, shown as cards at the top of the upgrade page. */
export const premiumHighlights = [
  {
    icon: "fa-solid fa-satellite-dish",
    title: "Control",
    body: "Open a Discord-style client and use Discord as your own bot. Read servers, send messages, react, moderate and manage, all in real time.",
  },
  {
    icon: "fa-solid fa-chart-line",
    title: "Bot Insights",
    body: "See which commands people actually use, who uses them, which servers are busiest and how it all changes over time.",
  },
  {
    icon: "fa-solid fa-code-branch",
    title: "Version Control",
    body: "Save your whole project as a version, start the next iteration of your bot from it, and switch back to any earlier one whenever you like.",
  },
  {
    icon: "fa-solid fa-wand-magic-sparkles",
    title: "Visual website builder",
    body: "Drag elements onto a page and see exactly what visitors will see, with no code and no Blockly.",
  },
  {
    icon: "fa-solid fa-globe",
    title: "Websites & dashboards",
    body: "Build a public site for every bot you own, with optional settings controls server owners can configure themselves.",
  },
];

/**
 * Everything Premium unlocks, whichever plan you are on.
 *
 * Rendered once, above the plans, because the plans are not tiers.
 */
export const premiumFeatures = [
  {
    icon: "fa-solid fa-satellite-dish",
    title: "Control",
    body: "A full Discord client for any bot you own, covering servers, channels, DMs and members, live.",
  },
  {
    icon: "fa-solid fa-comments",
    title: "Act as your bot",
    body: "Send, edit and delete messages, reply, react and attach files as the bot itself.",
  },
  {
    icon: "fa-solid fa-gavel",
    title: "Moderate from DisFuse",
    body: "Kick, ban, time out, manage roles, channels and server settings without leaving the site.",
  },
  {
    icon: "fa-solid fa-chart-line",
    title: "Bot Insights",
    body: "Commands, users, servers and activity trends for every bot you own.",
  },
  {
    icon: "fa-solid fa-list-ul",
    title: "Live event logs",
    body: "Every command, join, leave and error your bot reports, as it happens.",
  },
  {
    icon: "fa-solid fa-clock-rotate-left",
    title: "Up to 90 days of history",
    body: "Choose how long your Insight logs are kept, up to three months.",
  },
  {
    icon: "fa-solid fa-globe",
    title: "Unlimited websites",
    body: "Build as many sites as you have bots, each on its own public URL.",
  },
  {
    icon: "fa-solid fa-wand-magic-sparkles",
    title: "Visual website builder",
    body: "Pages, themes, fonts and colours, all without writing code.",
  },
  {
    icon: "fa-solid fa-sliders",
    title: "Bot dashboards",
    body: "Let server owners configure your bot after logging in with Discord.",
  },
  {
    icon: "fa-solid fa-code-branch",
    title: "Project versions",
    body: "Save the whole project, every workspace included, as a version you can come back to, and build the next iteration without risking the one that works.",
  },
  {
    icon: "fa-solid fa-right-left",
    title: "Switch between versions",
    body: "Move to any version at any time and keep editing it. Each one is its own snapshot, so changing one never touches another.",
  },
  {
    icon: "fa-solid fa-rocket",
    title: "Early access",
    body: "New builder elements and Premium features land for you first.",
  },
  {
    icon: "fa-solid fa-headset",
    title: "Priority support",
    body: "Questions from Premium members go to the front of the queue.",
  },
];

/**
 * The ways to pay. Same product every time — `note` is the only thing
 * that differs between them.
 */
export const premiumPlans = [
  {
    id: "monthly",
    name: "Premium",
    price: "$4.99",
    interval: "per month",
    description: "Get all Premium features by paying monthly",
    note: "Cancel any time",
  },
  {
    id: "yearly",
    name: "Premium Yearly",
    price: "$44.99",
    interval: "per year",
    highlight: true,
    badge: "Save 25%",
    description: "Get all Premium features by paying once per year",
    note: "Billed once a year",
  },
  {
    id: "lifetime",
    name: "Lifetime",
    price: "$99",
    interval: "one-time",
    description: "Pay once, keep Premium forever",
    note: "No recurring payment",
  },
];
