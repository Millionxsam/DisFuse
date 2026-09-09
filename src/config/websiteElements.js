/* =====================================================================
   Website element registry
   ---------------------------------------------------------------------
   Every element the visual website builder can place is described here
   as plain data. Nothing in the builder, the renderer or the published
   page hard-codes a list of element types — they all read this file, so
   adding a new element type is a matter of adding one entry below plus a
   `case` in components/websites/ElementNode.jsx.

   Two kinds of elements exist:

     - general elements  (category !== "dashboard")
         Plain website content. Work on any website, need no login.

     - dashboard elements (category === "dashboard", `dashboard: true`)
         Interactive controls that read/write website.data for a specific
         Discord server. A page containing one of these requires the
         visitor to log in with Discord and pick a server first.

   A website is NOT a dashboard: dashboard elements are entirely optional
   and most websites will never use one.
   ===================================================================== */

/* ---- Theme tokens ---------------------------------------------------
   Colour slots a website theme exposes. Element styles reference them as
   `var(--ws-primary)` etc. so re-theming a site updates every element. */

export const themeTokens = [
  { key: "primary", label: "Primary", cssVar: "--ws-primary" },
  { key: "primaryText", label: "On primary", cssVar: "--ws-primary-text" },
  { key: "background", label: "Background", cssVar: "--ws-bg" },
  { key: "surface", label: "Surface", cssVar: "--ws-surface" },
  { key: "text", label: "Text", cssVar: "--ws-text" },
  { key: "muted", label: "Muted text", cssVar: "--ws-muted" },
  { key: "border", label: "Border", cssVar: "--ws-border" },
];

export const fontOptions = [
  { value: "'Ubuntu Sans', sans-serif", label: "Ubuntu Sans" },
  { value: "'Poetsen One', 'Ubuntu Sans', sans-serif", label: "Poetsen One" },
  { value: "system-ui, sans-serif", label: "System" },
  { value: "Georgia, 'Times New Roman', serif", label: "Serif" },
  { value: "'Courier New', monospace", label: "Monospace" },
];

/* ---- Palette categories --------------------------------------------- */

export const elementCategories = [
  {
    id: "layout",
    label: "Layout",
    icon: "fa-solid fa-table-cells-large",
    description: "Structure the page",
  },
  {
    id: "content",
    label: "Content",
    icon: "fa-solid fa-align-left",
    description: "Text and information",
  },
  {
    id: "media",
    label: "Media & actions",
    icon: "fa-solid fa-image",
    description: "Images, buttons and links",
  },
  {
    id: "navigation",
    label: "Navigation",
    icon: "fa-solid fa-compass",
    description: "Move between pages",
  },
  {
    id: "dashboard",
    label: "Dashboard controls",
    icon: "fa-solid fa-sliders",
    description: "Optional. Lets bot users configure your bot",
    dashboard: true,
    /* Each control decides for itself whether it stores a value per
       server or per user, which is what decides whether the visitor has
       to pick a server at all. See SCOPE_FIELD below. */
  },
];

/* ---- Reusable option lists ------------------------------------------ */

const alignOptions = [
  { value: "flex-start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "flex-end", label: "End" },
  { value: "stretch", label: "Stretch" },
];

const justifyOptions = [
  { value: "flex-start", label: "Start" },
  { value: "center", label: "Center" },
  { value: "flex-end", label: "End" },
  { value: "space-between", label: "Space between" },
  { value: "space-around", label: "Space around" },
];

const textAlignOptions = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

/**
 * Which slice of website.data a dashboard control reads and writes.
 *
 *   guild — one value per Discord server, edited by whoever manages it
 *   user  — one value per Discord user, private to that visitor
 *
 * A website can use either scope, both, or neither.
 */
const SCOPE_FIELD = {
  key: "scope",
  label: "Applies to",
  type: "select",
  options: [
    { value: "guild", label: "The selected server" },
    { value: "user", label: "The visitor themselves" },
  ],
  help: "Server settings are shared by everyone who manages that server. User settings are private to each visitor.",
};

/* ---- Style field groups ---------------------------------------------
   Each element lists which of these groups the inspector should show.
   Values are stored as raw CSS strings so anything valid can be typed. */

export const styleGroups = {
  layout: {
    label: "Layout",
    icon: "fa-solid fa-table-cells-large",
    fields: [
      {
        key: "display",
        label: "Display",
        type: "select",
        options: [
          { value: "flex", label: "Flex" },
          { value: "block", label: "Block" },
          { value: "grid", label: "Grid" },
          { value: "inline-flex", label: "Inline flex" },
        ],
      },
      {
        key: "flexDirection",
        label: "Direction",
        type: "select",
        options: [
          { value: "row", label: "Row" },
          { value: "column", label: "Column" },
        ],
      },
      {
        key: "alignItems",
        label: "Align",
        type: "select",
        options: alignOptions,
      },
      {
        key: "justifyContent",
        label: "Justify",
        type: "select",
        options: justifyOptions,
      },
      {
        key: "flexWrap",
        label: "Wrap",
        type: "select",
        options: [
          { value: "wrap", label: "Wrap" },
          { value: "nowrap", label: "No wrap" },
        ],
      },
      {
        key: "gridTemplateColumns",
        label: "Grid columns",
        type: "text",
        placeholder: "repeat(3, 1fr)",
      },
      { key: "gap", label: "Gap", type: "text", placeholder: "16px" },
      { key: "width", label: "Width", type: "text", placeholder: "auto" },
      {
        key: "maxWidth",
        label: "Max width",
        type: "text",
        placeholder: "none",
      },
      { key: "minWidth", label: "Min width", type: "text", placeholder: "0" },
      {
        key: "minHeight",
        label: "Min height",
        type: "text",
        placeholder: "auto",
      },
      {
        key: "flex",
        label: "Flex",
        type: "text",
        placeholder: "1 1 240px",
        help: "How the element grows inside a flex container",
      },
    ],
  },
  spacing: {
    label: "Spacing",
    icon: "fa-solid fa-arrows-left-right-to-line",
    fields: [
      { key: "padding", label: "Padding", type: "text", placeholder: "24px" },
      { key: "margin", label: "Margin", type: "text", placeholder: "0" },
    ],
  },
  typography: {
    label: "Typography",
    icon: "fa-solid fa-font",
    fields: [
      {
        key: "fontFamily",
        label: "Font",
        type: "select",
        options: [{ value: "", label: "Inherit" }, ...fontOptions],
      },
      { key: "fontSize", label: "Size", type: "text", placeholder: "16px" },
      {
        key: "fontWeight",
        label: "Weight",
        type: "select",
        options: [
          { value: "", label: "Default" },
          { value: "400", label: "Regular" },
          { value: "500", label: "Medium" },
          { value: "600", label: "Semibold" },
          { value: "700", label: "Bold" },
        ],
      },
      {
        key: "lineHeight",
        label: "Line height",
        type: "text",
        placeholder: "1.5",
      },
      {
        key: "letterSpacing",
        label: "Letter spacing",
        type: "text",
        placeholder: "0",
      },
      { key: "color", label: "Colour", type: "color" },
      {
        key: "textAlign",
        label: "Text align",
        type: "select",
        options: textAlignOptions,
      },
    ],
  },
  background: {
    label: "Background",
    icon: "fa-solid fa-fill-drip",
    fields: [
      { key: "background", label: "Colour", type: "color" },
      {
        key: "backgroundImage",
        label: "Image",
        type: "text",
        placeholder: "url(https://...)",
      },
      {
        key: "backgroundSize",
        label: "Image size",
        type: "select",
        options: [
          { value: "", label: "Default" },
          { value: "cover", label: "Cover" },
          { value: "contain", label: "Contain" },
        ],
      },
      {
        key: "backgroundPosition",
        label: "Image position",
        type: "text",
        placeholder: "center",
      },
    ],
  },
  border: {
    label: "Border & corners",
    icon: "fa-solid fa-border-top-left",
    fields: [
      { key: "borderWidth", label: "Width", type: "text", placeholder: "0" },
      {
        key: "borderStyle",
        label: "Style",
        type: "select",
        options: [
          { value: "solid", label: "Solid" },
          { value: "dashed", label: "Dashed" },
          { value: "dotted", label: "Dotted" },
          { value: "none", label: "None" },
        ],
      },
      { key: "borderColor", label: "Colour", type: "color" },
      {
        key: "borderRadius",
        label: "Radius",
        type: "text",
        placeholder: "var(--ws-radius)",
      },
      {
        key: "boxShadow",
        label: "Shadow",
        type: "select",
        options: [
          { value: "", label: "None" },
          { value: "0 6px 20px rgba(0,0,0,0.25)", label: "Soft" },
          { value: "0 18px 45px rgba(0,0,0,0.45)", label: "Strong" },
        ],
      },
    ],
  },
};

/* ---- Element definitions -------------------------------------------- */

export const websiteElements = {
  /* ---------------- Layout ---------------- */

  section: {
    label: "Section",
    icon: "fa-solid fa-square",
    category: "layout",
    container: true,
    hint: "Full-width band of the page",
    /* Layout style keys move to the inner (content-width) wrapper so the
       background/padding can still span the whole viewport. */
    innerStyleKeys: [
      "display",
      "flexDirection",
      "alignItems",
      "justifyContent",
      "flexWrap",
      "gap",
      "gridTemplateColumns",
      "textAlign",
    ],
    defaults: {
      props: { width: "contained" },
      style: {
        padding: "72px 24px",
        background: "transparent",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        alignItems: "flex-start",
      },
    },
    props: [
      {
        key: "width",
        label: "Content width",
        type: "select",
        options: [
          { value: "contained", label: "Contained" },
          { value: "full", label: "Full width" },
        ],
      },
    ],
    styles: ["layout", "spacing", "background", "border"],
  },

  container: {
    label: "Container",
    icon: "fa-solid fa-object-group",
    category: "layout",
    container: true,
    hint: "Group elements in rows, columns or a grid",
    defaults: {
      props: {},
      style: {
        display: "flex",
        flexDirection: "row",
        gap: "16px",
        flexWrap: "wrap",
        alignItems: "stretch",
        width: "100%",
      },
    },
    props: [],
    styles: ["layout", "spacing", "background", "border", "typography"],
  },

  card: {
    label: "Card",
    icon: "fa-solid fa-id-card",
    category: "layout",
    container: true,
    hint: "A surface panel for grouped content",
    defaults: {
      props: {},
      style: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        padding: "24px",
        background: "var(--ws-surface)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "var(--ws-border)",
        borderRadius: "var(--ws-radius)",
        flex: "1 1 240px",
        minWidth: "220px",
      },
    },
    props: [],
    styles: ["layout", "spacing", "background", "border", "typography"],
  },

  spacer: {
    label: "Spacer",
    icon: "fa-solid fa-arrows-up-down",
    category: "layout",
    hint: "Empty vertical space",
    defaults: { props: { height: "48px" }, style: {} },
    props: [
      { key: "height", label: "Height", type: "text", placeholder: "48px" },
    ],
    styles: [],
  },

  divider: {
    label: "Divider",
    icon: "fa-solid fa-minus",
    category: "layout",
    hint: "Horizontal rule",
    defaults: {
      props: {},
      style: {
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "var(--ws-border)",
        margin: "8px 0",
        width: "100%",
      },
    },
    props: [],
    styles: ["spacing", "border", "layout"],
  },

  /* ---------------- Content ---------------- */

  heading: {
    label: "Heading",
    icon: "fa-solid fa-heading",
    category: "content",
    hint: "Title text",
    defaults: {
      props: { text: "Your heading", level: "h2" },
      style: {
        fontFamily: "var(--ws-font-heading)",
        fontSize: "36px",
        color: "var(--ws-text)",
        lineHeight: "1.2",
      },
    },
    props: [
      { key: "text", label: "Text", type: "text" },
      {
        key: "level",
        label: "Level",
        type: "select",
        options: [
          { value: "h1", label: "H1" },
          { value: "h2", label: "H2" },
          { value: "h3", label: "H3" },
          { value: "h4", label: "H4" },
        ],
      },
    ],
    styles: ["typography", "spacing", "layout"],
  },

  text: {
    label: "Text",
    icon: "fa-solid fa-align-left",
    category: "content",
    hint: "Paragraph of text",
    defaults: {
      props: {
        text: "Write something about your bot, your community or your project here.",
      },
      style: {
        fontSize: "16px",
        color: "var(--ws-muted)",
        lineHeight: "1.7",
        maxWidth: "62ch",
      },
    },
    props: [{ key: "text", label: "Text", type: "textarea" }],
    styles: ["typography", "spacing", "layout"],
  },

  list: {
    label: "List",
    icon: "fa-solid fa-list-ul",
    category: "content",
    hint: "Bulleted or numbered list",
    defaults: {
      props: {
        ordered: false,
        marker: "check",
        items: [
          { text: "Moderation commands" },
          { text: "Auto roles" },
          { text: "Welcome messages" },
        ],
      },
      style: { fontSize: "16px", color: "var(--ws-muted)", lineHeight: "1.9" },
    },
    props: [
      { key: "ordered", label: "Numbered", type: "boolean" },
      {
        key: "marker",
        label: "Marker",
        type: "select",
        options: [
          { value: "check", label: "Check icon" },
          { value: "dot", label: "Dot" },
          { value: "none", label: "None" },
        ],
      },
      {
        key: "items",
        label: "Items",
        type: "repeater",
        newItem: { text: "New item" },
        itemFields: [{ key: "text", label: "Text", type: "text" }],
      },
    ],
    styles: ["typography", "spacing", "layout"],
  },

  icon: {
    label: "Icon",
    icon: "fa-solid fa-star",
    category: "content",
    hint: "A Font Awesome icon",
    defaults: {
      props: { icon: "fa-solid fa-bolt" },
      style: { fontSize: "28px", color: "var(--ws-primary)" },
    },
    props: [
      {
        key: "icon",
        label: "Icon class",
        type: "text",
        placeholder: "fa-solid fa-bolt",
        help: "Any Font Awesome 6 class, e.g. fa-solid fa-shield",
      },
    ],
    styles: ["typography", "spacing"],
  },

  /* ---------------- Media & actions ---------------- */

  image: {
    label: "Image",
    icon: "fa-solid fa-image",
    category: "media",
    hint: "Picture from a URL",
    defaults: {
      props: { src: "", alt: "", href: "" },
      style: {
        width: "100%",
        maxWidth: "420px",
        borderRadius: "var(--ws-radius)",
      },
    },
    props: [
      {
        key: "src",
        label: "Image URL",
        type: "text",
        placeholder: "https://cdn.discordapp.com/...",
      },
      { key: "alt", label: "Alt text", type: "text" },
      { key: "href", label: "Links to", type: "link" },
    ],
    styles: ["layout", "spacing", "border"],
  },

  button: {
    label: "Button",
    icon: "fa-solid fa-hand-pointer",
    category: "media",
    hint: "Call to action",
    defaults: {
      props: {
        label: "Add to Discord",
        href: "",
        icon: "",
        newTab: false,
        variant: "primary",
      },
      style: {},
    },
    props: [
      { key: "label", label: "Label", type: "text" },
      { key: "href", label: "Links to", type: "link" },
      {
        key: "icon",
        label: "Icon class",
        type: "text",
        placeholder: "fa-solid fa-plus",
      },
      {
        key: "variant",
        label: "Style",
        type: "select",
        options: [
          { value: "primary", label: "Primary" },
          { value: "secondary", label: "Secondary" },
          { value: "outline", label: "Outline" },
        ],
      },
      { key: "newTab", label: "Open in new tab", type: "boolean" },
    ],
    styles: ["typography", "spacing", "border", "layout", "background"],
  },

  link: {
    label: "Link",
    icon: "fa-solid fa-link",
    category: "media",
    hint: "Inline text link",
    defaults: {
      props: { text: "Read the docs", href: "", newTab: true },
      style: { color: "var(--ws-primary)", fontSize: "16px" },
    },
    props: [
      { key: "text", label: "Text", type: "text" },
      { key: "href", label: "Links to", type: "link" },
      { key: "newTab", label: "Open in new tab", type: "boolean" },
    ],
    styles: ["typography", "spacing"],
  },

  /* ---------------- Navigation ---------------- */

  navbar: {
    label: "Navigation bar",
    icon: "fa-solid fa-bars",
    category: "navigation",
    hint: "Brand and page links",
    innerStyleKeys: ["justifyContent", "alignItems", "gap", "flexWrap"],
    defaults: {
      props: {
        brand: "My Bot",
        brandImage: "",
        sticky: true,
        links: [{ label: "Home", href: "" }],
      },
      style: {
        padding: "16px 24px",
        background: "var(--ws-surface)",
        borderWidth: "0 0 1px 0",
        borderStyle: "solid",
        borderColor: "var(--ws-border)",
        gap: "24px",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
      },
    },
    props: [
      { key: "brand", label: "Brand text", type: "text" },
      { key: "brandImage", label: "Brand image URL", type: "text" },
      { key: "sticky", label: "Stick to top", type: "boolean" },
      {
        key: "links",
        label: "Links",
        type: "repeater",
        newItem: { label: "Link", href: "" },
        itemFields: [
          { key: "label", label: "Label", type: "text" },
          { key: "href", label: "Links to", type: "link" },
        ],
      },
    ],
    styles: ["layout", "spacing", "background", "border", "typography"],
  },

  /* ---------------- Dashboard controls ----------------
     Everything below is optional. Placing any of these on a page turns
     that page into a dashboard page: visitors must log in with Discord
     and choose a server, and the values are read from / written to
     website.data[guildId][settingKey]. */

  "setting-toggle": {
    label: "Toggle setting",
    icon: "fa-solid fa-toggle-on",
    category: "dashboard",
    dashboard: true,
    hint: "On/off switch stored per server",
    defaults: {
      props: {
        settingKey: "",
        scope: "guild",
        label: "Enable feature",
        description: "",
        default: false,
      },
      style: {},
    },
    props: [
      { key: "label", label: "Label", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "default", label: "Default value", type: "boolean" },
      SCOPE_FIELD,
      { key: "settingKey", label: "Data key", type: "settingKey" },
    ],
    styles: ["spacing", "background", "border", "typography"],
  },

  "setting-text": {
    label: "Text setting",
    icon: "fa-solid fa-keyboard",
    category: "dashboard",
    dashboard: true,
    hint: "Free text stored per server (e.g. a prefix)",
    defaults: {
      props: {
        settingKey: "",
        scope: "guild",
        label: "Command prefix",
        description: "",
        placeholder: "!",
        default: "",
        multiline: false,
      },
      style: {},
    },
    props: [
      { key: "label", label: "Label", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "placeholder", label: "Placeholder", type: "text" },
      { key: "default", label: "Default value", type: "text" },
      { key: "multiline", label: "Multi-line", type: "boolean" },
      SCOPE_FIELD,
      { key: "settingKey", label: "Data key", type: "settingKey" },
    ],
    styles: ["spacing", "background", "border", "typography"],
  },

  "setting-number": {
    label: "Number setting",
    icon: "fa-solid fa-hashtag",
    category: "dashboard",
    dashboard: true,
    hint: "Numeric value stored per server",
    defaults: {
      props: {
        settingKey: "",
        scope: "guild",
        label: "Warnings before ban",
        description: "",
        min: 0,
        max: 100,
        default: 3,
      },
      style: {},
    },
    props: [
      { key: "label", label: "Label", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "min", label: "Minimum", type: "number" },
      { key: "max", label: "Maximum", type: "number" },
      { key: "default", label: "Default value", type: "number" },
      SCOPE_FIELD,
      { key: "settingKey", label: "Data key", type: "settingKey" },
    ],
    styles: ["spacing", "background", "border", "typography"],
  },

  "setting-select": {
    label: "Dropdown setting",
    icon: "fa-solid fa-caret-down",
    category: "dashboard",
    dashboard: true,
    hint: "Pick one of your own options",
    defaults: {
      props: {
        settingKey: "",
        scope: "guild",
        label: "Moderation mode",
        description: "",
        default: "",
        options: [
          { label: "Relaxed", value: "relaxed" },
          { label: "Strict", value: "strict" },
        ],
      },
      style: {},
    },
    props: [
      { key: "label", label: "Label", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      {
        key: "options",
        label: "Options",
        type: "repeater",
        newItem: { label: "Option", value: "option" },
        itemFields: [
          { key: "label", label: "Label", type: "text" },
          { key: "value", label: "Value", type: "text" },
        ],
      },
      { key: "default", label: "Default value", type: "text" },
      SCOPE_FIELD,
      { key: "settingKey", label: "Data key", type: "settingKey" },
    ],
    styles: ["spacing", "background", "border", "typography"],
  },

  "setting-channel": {
    label: "Channel picker",
    icon: "fa-solid fa-hashtag",
    category: "dashboard",
    dashboard: true,
    /* Options come from the selected Discord server at runtime — the
       published site loads them from the API when a server is chosen. */
    resource: "channels",
    hint: "Lets the visitor pick a channel in their server",
    defaults: {
      props: {
        settingKey: "",
        scope: "guild",
        label: "Log channel",
        description: "",
        default: "",
      },
      style: {},
    },
    props: [
      { key: "label", label: "Label", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      SCOPE_FIELD,
      { key: "settingKey", label: "Data key", type: "settingKey" },
    ],
    styles: ["spacing", "background", "border", "typography"],
  },

  "setting-role": {
    label: "Role picker",
    icon: "fa-solid fa-user-shield",
    category: "dashboard",
    dashboard: true,
    resource: "roles",
    hint: "Lets the visitor pick a role in their server",
    defaults: {
      props: {
        settingKey: "",
        scope: "guild",
        label: "Auto role",
        description: "",
        default: "",
      },
      style: {},
    },
    props: [
      { key: "label", label: "Label", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      SCOPE_FIELD,
      { key: "settingKey", label: "Data key", type: "settingKey" },
    ],
    styles: ["spacing", "background", "border", "typography"],
  },

  "dashboard-save": {
    label: "Save button",
    icon: "fa-solid fa-floppy-disk",
    category: "dashboard",
    dashboard: true,
    hint: "Writes every setting on the page to website.data",
    defaults: {
      props: { label: "Save changes" },
      style: {},
    },
    props: [{ key: "label", label: "Label", type: "text" }],
    styles: ["spacing", "typography", "layout"],
  },

  "guild-info": {
    label: "Server header",
    icon: "fa-solid fa-server",
    category: "dashboard",
    dashboard: true,
    hint: "Shows the server the visitor is configuring",
    defaults: {
      props: { showSwitch: true },
      style: {
        display: "flex",
        alignItems: "center",
        gap: "14px",
        padding: "16px",
        background: "var(--ws-surface)",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "var(--ws-border)",
        borderRadius: "var(--ws-radius)",
        width: "100%",
      },
    },
    props: [
      { key: "showSwitch", label: "Show 'switch server'", type: "boolean" },
    ],
    styles: ["layout", "spacing", "background", "border"],
  },
};

/* ---- Lookup helpers -------------------------------------------------- */

export function getElementDef(type) {
  return websiteElements[type] || null;
}

export function isDashboardElement(type) {
  return Boolean(websiteElements[type]?.dashboard);
}

/** True for controls that store a value (i.e. not the save button/header). */
export function isSettingElement(type) {
  return Boolean(
    websiteElements[type]?.dashboard &&
    websiteElements[type]?.props?.some?.((p) => p.key === "settingKey"),
  );
}

/** Which data scope a node writes to. Defaults to server scope. */
export function elementScope(node) {
  return node?.props?.scope === "user" ? "user" : "guild";
}

export function elementsInCategory(categoryId) {
  return Object.entries(websiteElements)
    .filter(([, def]) => def.category === categoryId)
    .map(([type, def]) => ({ type, ...def }));
}
