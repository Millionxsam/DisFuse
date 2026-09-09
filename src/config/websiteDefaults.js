/* =====================================================================
   Website defaults & starter templates
   ---------------------------------------------------------------------
   A website's `config` object is what the builder edits and what the
   published page renders:

     config = {
       theme:    { colors, fonts, radius, contentWidth },
       pages:    [ { id, name, path, elements: [ node… ] } ],
       favicon:  "",
       seo:      { title, description },
     }

   Templates below are just pre-built configs — a website created from
   the "Blank page" template is exactly as capable as one created from
   "Full dashboard", the dashboard elements are simply already placed
   for you.

   The four of them differ only in what they demonstrate:

     Blank page        an empty canvas
     Bot info          an informational site, no login anywhere
     Server dashboard  per-server settings — visitors pick a server
     Full dashboard    per-server settings AND per-user settings, on
                       separate pages, because they are separate things
   ===================================================================== */

import { createElementNode, createPage } from "../functions/websiteTree";

export const defaultTheme = {
  colors: {
    primary: "#014f98",
    primaryText: "#ffffff",
    background: "#00040f",
    surface: "#0a1526",
    text: "#f3f7fb",
    muted: "rgba(243, 247, 251, 0.68)",
    border: "rgba(255, 255, 255, 0.09)",
  },
  fonts: {
    body: "'Ubuntu Sans', sans-serif",
    heading: "'Poetsen One', 'Ubuntu Sans', sans-serif",
  },
  radius: "16px",
  contentWidth: "1100px",
};

export const themePresets = [
  { id: "disfuse", label: "DisFuse", colors: defaultTheme.colors },
  {
    id: "midnight",
    label: "Midnight",
    colors: {
      primary: "#7c5cff",
      primaryText: "#ffffff",
      background: "#0b0b14",
      surface: "#15152a",
      text: "#f4f2ff",
      muted: "rgba(244, 242, 255, 0.62)",
      border: "rgba(255, 255, 255, 0.1)",
    },
  },
  {
    id: "mint",
    label: "Mint",
    colors: {
      primary: "#35d0a0",
      primaryText: "#04211a",
      background: "#04120f",
      surface: "#0a2019",
      text: "#eafff8",
      muted: "rgba(234, 255, 248, 0.66)",
      border: "rgba(255, 255, 255, 0.1)",
    },
  },
  {
    id: "daylight",
    label: "Daylight",
    colors: {
      primary: "#014f98",
      primaryText: "#ffffff",
      background: "#f6f8fb",
      surface: "#ffffff",
      text: "#0d1b2a",
      muted: "rgba(13, 27, 42, 0.65)",
      border: "rgba(13, 27, 42, 0.12)",
    },
  },
];

/* Shorthand used by the templates below. */
const el = (type, props = {}, style = {}, children = []) =>
  createElementNode(type, { props, style, children });

/* ---- Template building blocks ---------------------------------------- */

function navbar(links) {
  return el("navbar", { brand: "My Bot", links });
}

function hero() {
  return el(
    "section",
    {},
    { padding: "96px 24px 72px 24px", alignItems: "flex-start", gap: "22px" },
    [
      el(
        "heading",
        { text: "The only bot your server needs", level: "h1" },
        {
          fontSize: "clamp(2.4rem, 5vw, 3.6rem)",
          maxWidth: "18ch",
        },
      ),
      el("text", {
        text: "Moderation, levelling, welcome messages and more, set up in minutes with no coding required.",
      }),
      el("container", {}, { gap: "12px", flexWrap: "wrap", width: "auto" }, [
        el("button", {
          label: "Add to Discord",
          icon: "fa-brands fa-discord",
          variant: "primary",
          newTab: true,
        }),
        el("button", { label: "Learn more", variant: "outline" }),
      ]),
    ],
  );
}

function featureCard(icon, title, body) {
  return el("card", {}, {}, [
    el("icon", { icon }),
    el("heading", { text: title, level: "h3" }, { fontSize: "20px" }),
    el("text", { text: body }, { fontSize: "15px", maxWidth: "none" }),
  ]);
}

function features() {
  return el("section", {}, { background: "var(--ws-surface)", gap: "28px" }, [
    el("heading", { text: "Features", level: "h2" }),
    el(
      "container",
      {},
      { gap: "20px", flexWrap: "wrap", alignItems: "stretch" },
      [
        featureCard(
          "fa-solid fa-shield-halved",
          "Moderation",
          "Warns, mutes, bans and a full audit log for your staff team.",
        ),
        featureCard(
          "fa-solid fa-chart-line",
          "Levelling",
          "Reward active members with XP, roles and a server leaderboard.",
        ),
        featureCard(
          "fa-solid fa-hand-sparkles",
          "Welcome messages",
          "Greet every new member with a customisable embed.",
        ),
      ],
    ),
  ]);
}

function commandsSection() {
  return el("section", {}, { gap: "26px" }, [
    el("heading", { text: "Commands", level: "h2" }),
    el("text", { text: "Every command works as a slash command." }),
    el(
      "container",
      {},
      { gap: "16px", flexWrap: "wrap", alignItems: "stretch" },
      [
        featureCard(
          "fa-solid fa-gavel",
          "/ban",
          "Bans a member from the server.",
        ),
        featureCard(
          "fa-solid fa-clock",
          "/timeout",
          "Temporarily mutes a member.",
        ),
        featureCard(
          "fa-solid fa-circle-info",
          "/help",
          "Lists everything the bot can do.",
        ),
      ],
    ),
  ]);
}

function callToAction() {
  return el(
    "section",
    {},
    {
      background: "var(--ws-surface)",
      alignItems: "center",
      textAlign: "center",
      gap: "18px",
    },
    [
      el("heading", { text: "Ready to get started?", level: "h2" }),
      el(
        "text",
        {
          text: "Add the bot to your server and set it up in a couple of clicks.",
        },
        {
          textAlign: "center",
        },
      ),
      el("button", {
        label: "Add to Discord",
        icon: "fa-brands fa-discord",
        newTab: true,
      }),
    ],
  );
}

/* ---- Dashboard building blocks ---------------------------------------
   Two independent kinds of setting, and templates keep them on separate
   pages so the distinction is obvious from the start:

     scope "guild" — one value per Discord server. The visitor picks the
                     server they're configuring first.
     scope "user"  — one value per Discord user, the same in every
                     server. Available as soon as they log in. */

function settingsCard(children) {
  return el(
    "card",
    {},
    { width: "100%", flex: "0 1 auto", gap: "18px", padding: "26px" },
    children,
  );
}

/** A page of server-scoped settings — the classic bot dashboard. */
function serverSettingsPageElements(links) {
  return [
    navbar(links),
    el("section", {}, { gap: "24px", padding: "48px 24px 72px 24px" }, [
      el("guild-info"),
      el(
        "heading",
        { text: "Server settings", level: "h2" },
        { fontSize: "28px" },
      ),
      el("text", {
        text: "These settings apply to the whole server. Anyone who can configure this server sees the same values.",
      }),
      settingsCard([
        el("setting-toggle", {
          scope: "guild",
          label: "Enable welcome messages",
          description: "Send a message when someone joins the server.",
          default: true,
        }),
        el("divider"),
        el("setting-text", {
          scope: "guild",
          label: "Command prefix",
          description: "Used for legacy text commands.",
          placeholder: "!",
          default: "!",
        }),
        el("divider"),
        el("setting-channel", {
          scope: "guild",
          label: "Log channel",
          description: "Where moderation actions are posted.",
        }),
        el("divider"),
        el("setting-select", {
          scope: "guild",
          label: "Moderation mode",
          description: "How strictly the automod reacts.",
          default: "relaxed",
          options: [
            { label: "Relaxed", value: "relaxed" },
            { label: "Balanced", value: "balanced" },
            { label: "Strict", value: "strict" },
          ],
        }),
      ]),
      el("dashboard-save", { label: "Save changes" }),
    ]),
  ];
}

/** A page of user-scoped settings — no server involved anywhere on it. */
function userSettingsPageElements(links) {
  return [
    navbar(links),
    el("section", {}, { gap: "24px", padding: "48px 24px 72px 24px" }, [
      el(
        "heading",
        { text: "Your settings", level: "h2" },
        { fontSize: "28px" },
      ),
      el("text", {
        text: "These belong to your Discord account and follow you into every server the bot is in.",
      }),
      settingsCard([
        el("setting-toggle", {
          scope: "user",
          label: "Direct message notifications",
          description: "Let the bot DM you about things you're involved in.",
          default: true,
        }),
        el("divider"),
        el("setting-toggle", {
          scope: "user",
          label: "Show me on leaderboards",
          description: "Turn this off to be hidden from public rankings.",
          default: true,
        }),
        el("divider"),
        el("setting-select", {
          scope: "user",
          label: "Language",
          description: "The language the bot replies to you in.",
          default: "en",
          options: [
            { label: "English", value: "en" },
            { label: "Español", value: "es" },
            { label: "Français", value: "fr" },
          ],
        }),
        el("divider"),
        el("setting-text", {
          scope: "user",
          label: "Nickname",
          description: "What the bot calls you.",
          placeholder: "Your name",
        }),
      ]),
      el("dashboard-save", { label: "Save my settings" }),
    ]),
  ];
}

/* ---- Templates ------------------------------------------------------- */

export const websiteTemplates = [
  {
    id: "blank",
    name: "Blank page",
    icon: "fa-solid fa-file",
    description: "An empty page. Build whatever you want from scratch.",
    dashboard: false,
    build: () => ({
      pages: [
        createPage("Home", "", [
          el("section", {}, { minHeight: "60vh", justifyContent: "center" }, [
            el("heading", { text: "Welcome", level: "h1" }),
            el("text", {
              text: "Start adding elements from the panel on the left.",
            }),
          ]),
        ]),
      ],
    }),
  },
  {
    id: "botinfo",
    name: "Bot info",
    icon: "fa-solid fa-book",
    description:
      "A multi-page informational site with features, a command list and an invite button.",
    dashboard: false,
    build: () => {
      const home = createPage("Home", "");
      const commands = createPage("Commands", "commands");

      const links = [
        { label: "Home", href: `page:${home.id}` },
        { label: "Commands", href: `page:${commands.id}` },
      ];

      home.elements = [navbar(links), hero(), features(), callToAction()];
      commands.elements = [navbar(links), commandsSection()];

      return { pages: [home, commands] };
    },
  },
  {
    id: "server-dashboard",
    name: "Server dashboard",
    icon: "fa-solid fa-sliders",
    description:
      "A home page plus one dashboard page of per-server settings. Visitors log in with Discord and choose a server.",
    dashboard: true,
    scopes: "Per-server settings",
    build: () => {
      const home = createPage("Home", "");
      const dashboard = createPage("Server settings", "dashboard");

      const links = [
        { label: "Home", href: `page:${home.id}` },
        { label: "Server settings", href: `page:${dashboard.id}` },
      ];

      home.elements = [navbar(links), hero(), features(), callToAction()];
      dashboard.elements = serverSettingsPageElements(links);

      return { pages: [home, dashboard] };
    },
  },
  {
    id: "full-dashboard",
    name: "Full dashboard",
    icon: "fa-solid fa-user-gear",
    description:
      "Per-server settings and per-user settings on separate pages. Personal settings need nothing but a Discord login.",
    dashboard: true,
    scopes: "Per-server + per-user settings",
    build: () => {
      const home = createPage("Home", "");
      const server = createPage("Server settings", "server");
      const user = createPage("My settings", "me");

      const links = [
        { label: "Home", href: `page:${home.id}` },
        { label: "Server settings", href: `page:${server.id}` },
        { label: "My settings", href: `page:${user.id}` },
      ];

      home.elements = [navbar(links), hero(), features(), callToAction()];
      server.elements = serverSettingsPageElements(links);
      user.elements = userSettingsPageElements(links);

      return { pages: [home, server, user] };
    },
  },
];

export function getTemplate(id) {
  return websiteTemplates.find((t) => t.id === id) || websiteTemplates[0];
}

/** Replaces the placeholder brand text in template navbars. */
function applyBrand(nodes, brand) {
  for (const node of nodes || []) {
    if (node.type === "navbar" && node.props.brand === "My Bot") {
      node.props.brand = brand;
    }
    applyBrand(node.children, brand);
  }
}

/** Builds the full `config` object a new website is created with. */
export function buildWebsiteConfig({
  templateId = "blank",
  name = "My website",
  description = "",
  brand = "",
} = {}) {
  const template = getTemplate(templateId);
  const built = template.build();

  if (brand) built.pages.forEach((page) => applyBrand(page.elements, brand));

  return {
    theme: structuredClone(defaultTheme),
    seo: { title: name, description },
    favicon: "",
    pages: built.pages,
  };
}
