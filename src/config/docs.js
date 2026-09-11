/* =====================================================================
   The documentation site
   ---------------------------------------------------------------------
   Every link from this app into docs.disfuse.xyz goes through here, so
   the base URL is written once and the page paths are spelled once.

   `DOCS` is the list of pages worth linking to, keyed by what the page
   is about rather than by where it lives — `DOCS.creatingABot`, not
   `"Guide/creating-a-bot"` — so a page that moves on the docs site is
   one line to fix rather than a grep across the app.

   A value may carry a `#section` anchor. `docsUrl()` builds the address;
   the <DocsLink> component is what renders it.
   ===================================================================== */

export const DOCS_URL = "https://docs.disfuse.xyz";

/** Every docs page this app links to. */
export const DOCS = {
  /* ---- Getting started --------------------------------------------- */
  intro: "intro",

  /* ---- Guide -------------------------------------------------------- */
  creatingABot: "Guide/creating-a-bot",
  creatingAProject: "Guide/creating-a-project",
  theEditor: "Guide/the-editor",
  codingYourBot: "Guide/coding-your-bot",
  runningYourBot: "Guide/running-your-bot",
  projectSettings: "Guide/project-settings",
  secrets: "Guide/secrets",
  workspaces: "Guide/workspaces",
  collaboration: "Guide/collaboration",
  versionControl: "Guide/version-control",
  templates: "Guide/templates",
  componentsV2: "Guide/componentsV2",

  /* ---- Features ----------------------------------------------------- */
  dashboard: "Features/dashboard",
  explore: "Features/explore",
  inbox: "Features/inbox",
  insights: "Features/insights",
  control: "Features/control",
  premium: "Features/premium",
  settings: "Features/settings",
  websites: "Features/websites",
  workshop: "Features/workshop",

  /* ---- Blocks ------------------------------------------------------- */
  usingBlocks: "Blocks/using-blocks",
  blockPacks: "Blocks/workshop-blockbuddy",
  dashboardBlocks: "Blocks/dashboard",

  /* The overview page of a block category. These six are Docusaurus
     "category index" pages — a file named after the folder it sits in —
     and such a page is served at the folder's own path, so
     Interactions/interactions.md is /docs/Interactions and not
     /docs/Interactions/interactions, which 404s. */
  interactions: "Interactions",
  componentBlocks: "Blocks/Components",
  messageBlocks: "Blocks/Messages",
  serverBlocks: "Blocks/Servers",
  eventBlocks: "Blocks/Events",
  appBlocks: "Blocks/Apps",

  /* ---- Help --------------------------------------------------------- */
  faq: "Help/faq",
  troubleshooting: "Help/troubleshooting",
  hosting: "Help/hosting",
  glossary: "Help/glossary",
  bestPractices: "Help/best-practices",
  discordBasics: "Help/discord-basics",
};

/**
 * The full address of a docs page.
 *
 * @param {string} page a value from DOCS — `"Guide/secrets"` — optionally
 *   with a `#section` anchor on the end.
 */
export function docsUrl(page = DOCS.intro) {
  return `${DOCS_URL}/docs/${page}`;
}
