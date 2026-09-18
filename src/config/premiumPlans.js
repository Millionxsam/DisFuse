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

/**
 * How much each plan can keep.
 *
 * Every feature is free. Premium raises these limits, and the API is what
 * enforces them: `planLimits` in its config.js holds the same numbers, so
 * keep the two in step. Pages that show someone's own usage read the
 * numbers from the API instead (see api/limits.js); these are for copy.
 */
export const planLimits = {
  free: {
    projects: 5,
    websites: 5,
    versionsPerProject: 3,
    insightsRetentionDays: 7,
  },
  premium: {
    projects: 30,
    websites: 30,
    versionsPerProject: 25,
    insightsRetentionDays: 90,
  },
};

const { free, premium } = planLimits;

/**
 * Everything Premium includes, whichever plan you are on.
 *
 * Rendered once, above the plans, because the plans are not tiers.
 */
export const premiumFeatures = [
  {
    icon: "fa-solid fa-cubes",
    title: `Up to ${premium.projects} projects`,
    body: `Own up to ${premium.projects} projects instead of ${free.projects}, so every bot you build has room.`,
  },
  {
    icon: "fa-solid fa-globe",
    title: `Up to ${premium.websites} websites`,
    body: `Publish up to ${premium.websites} websites and bot dashboards instead of ${free.websites}.`,
  },
  {
    icon: "fa-solid fa-code-branch",
    title: `Up to ${premium.versionsPerProject} versions per project`,
    body: `Keep up to ${premium.versionsPerProject} versions of each project instead of ${free.versionsPerProject}, so older iterations never have to make room for new ones.`,
  },
  {
    icon: "fa-solid fa-clock-rotate-left",
    title: `${premium.insightsRetentionDays} days of Insights history`,
    body: `Keep up to ${premium.insightsRetentionDays} days of your bots' Insights and logs instead of ${free.insightsRetentionDays}, and compare longer trends.`,
  },
  {
    icon: "fa-solid fa-headset",
    title: "Priority support",
    body: "Questions from Premium members go to the front of the queue.",
  },
  {
    icon: "fa-solid fa-crown",
    title: "Premium role",
    body: "A Premium role in the DisFuse Discord server, for as long as you have Premium.",
  },
  {
    icon: "fa-solid fa-rocket",
    title: "Early access",
    body: "Try new DisFuse features before everyone else.",
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
    price: "$1.99",
    interval: "per month",
    description: "Get all Premium features by paying monthly",
    note: "Cancel any time",
  },
  {
    id: "yearly",
    name: "Premium Yearly",
    price: "$19.99",
    interval: "per year",
    highlight: true,
    badge: "Save 16%",
    description: "Get all Premium features by paying once per year",
    note: "Billed once a year",
  },
  {
    id: "lifetime",
    name: "Lifetime",
    price: "$49.99",
    interval: "one-time",
    description: "Pay once, keep Premium forever",
    note: "No recurring payment",
  },
];
