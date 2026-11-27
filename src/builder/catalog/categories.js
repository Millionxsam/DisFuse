/* =====================================================================
   DisFuse Builder: categories
   ---------------------------------------------------------------------
   How the event, action and value pickers are organised. Every catalog
   entry names one of these as its `category`, and may add a `group`
   (free text, e.g. "Channels") to split a large category into sections.

   The same list serves all three pickers; a picker only shows the
   categories that have something in them. Order here is display order.

   Labels are user-facing: plain words, no jargon.
   ===================================================================== */

export const CATEGORIES = [
  { id: "bot", label: "Bot", icon: "fa-solid fa-robot", color: "#FF6E33" },
  { id: "messages", label: "Messages", icon: "fa-solid fa-message", color: "#336EFF" },
  { id: "interactions", label: "Commands & Interactions", icon: "fa-solid fa-terminal", color: "#3366CC" },
  { id: "components", label: "Buttons & Menus", icon: "fa-solid fa-hand-pointer", color: "#26A4AF" },
  { id: "forms", label: "Forms", icon: "fa-solid fa-window-maximize", color: "#1A8793" },
  { id: "channels", label: "Channels", icon: "fa-solid fa-hashtag", color: "#2EA38F" },
  { id: "threads", label: "Threads", icon: "fa-solid fa-comments", color: "#3E8FD1" },
  { id: "servers", label: "Servers", icon: "fa-solid fa-server", color: "#A33DAC" },
  { id: "members", label: "Members", icon: "fa-solid fa-users", color: "#3C9E56" },
  { id: "roles", label: "Roles", icon: "fa-solid fa-shield-halved", color: "#D1487A" },
  { id: "emojis", label: "Emojis & Stickers", icon: "fa-solid fa-face-smile", color: "#D4A017" },
  { id: "webhooks", label: "Webhooks", icon: "fa-solid fa-link", color: "#1F8FBF" },
  { id: "invites", label: "Invites", icon: "fa-solid fa-envelope-open-text", color: "#2E9E6E" },
  { id: "polls", label: "Polls", icon: "fa-solid fa-square-poll-vertical", color: "#6D5FD6" },
  { id: "voice", label: "Voice", icon: "fa-solid fa-microphone", color: "#7C4DDB" },
  { id: "boosts", label: "Boosts", icon: "fa-solid fa-gem", color: "#E23FE2" },

  { id: "logic", label: "Logic", icon: "fa-solid fa-code-branch", color: "#5B80A5" },
  { id: "loops", label: "Loops", icon: "fa-solid fa-rotate", color: "#5BA55B" },
  { id: "variables", label: "Variables", icon: "fa-solid fa-box", color: "#A55B80" },
  { id: "text", label: "Text", icon: "fa-solid fa-font", color: "#5BA58C" },
  { id: "math", label: "Math", icon: "fa-solid fa-calculator", color: "#5B67A5" },
  { id: "lists", label: "Lists", icon: "fa-solid fa-list", color: "#745BA5" },
  { id: "objects", label: "Objects", icon: "fa-solid fa-cube", color: "#9A5BA5" },
  { id: "time", label: "Time", icon: "fa-solid fa-clock", color: "#4A8FC2" },
  { id: "colours", label: "Colors", icon: "fa-solid fa-palette", color: "#A5745B" },
  { id: "cooldowns", label: "Cooldowns", icon: "fa-solid fa-hourglass-half", color: "#C2724A" },

  { id: "data", label: "Saved Data", icon: "fa-solid fa-database", color: "#C27C2C" },
  { id: "dashboard", label: "Dashboard", icon: "fa-solid fa-gauge", color: "#2C8FC2" },
  { id: "files", label: "Files", icon: "fa-solid fa-folder-open", color: "#8A8F2C" },
  { id: "music", label: "Music", icon: "fa-solid fa-music", color: "#C22C7C" },
  { id: "code", label: "Code", icon: "fa-solid fa-code", color: "#F0DB4F" },
  { id: "apps", label: "Apps", icon: "fa-solid fa-puzzle-piece", color: "#6B7280" },
  { id: "github", label: "GitHub", icon: "fa-brands fa-github", color: "#6E7681" },
  { id: "canvas", label: "Images", icon: "fa-solid fa-image", color: "#D9468F" },
  { id: "websockets", label: "Live Connections", icon: "fa-solid fa-tower-broadcast", color: "#0EA5A4" },
  { id: "notes", label: "Notes", icon: "fa-solid fa-note-sticky", color: "#9CA3AF" },
  { id: "custom", label: "Custom", icon: "fa-solid fa-wand-magic-sparkles", color: "#F97316" },
];

export const CATEGORY_BY_ID = Object.fromEntries(
  CATEGORIES.map((category) => [category.id, category]),
);
