/* =====================================================================
   DisFuse Builder: Discord's rules for commands and options
   ---------------------------------------------------------------------
   SHARED FILE. An identical copy lives in the API at
   functions/builder/rules.js, so the page and the server agree on what
   is allowed. Change both or neither.

   Every check returns null when the input is fine, or a short message
   written for the person typing it.

   Plain JavaScript, no imports.
   ===================================================================== */

/** Discord's own pattern for command and option names. */
const NAME_PATTERN = /^[-_'\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}$/u;

export const LIMITS = {
  slashCommands: 100,
  userCommands: 5,
  messageCommands: 5,
  nameLength: 32,
  descriptionLength: 100,
  optionsPerLevel: 25,
  choices: 25,
  choiceNameLength: 100,
  choiceValueLength: 100,
  suggestions: 200,
  minLength: 0,
  maxLength: 6000,
  eventLabelLength: 100,
  events: 300,
  variables: 500,
  variableNameLength: 50,
};

/** Discord's option types, and what the builder calls them. */
export const OPTION_TYPES = {
  1: { key: "SUB_COMMAND", label: "Subcommand", icon: "fa-solid fa-diagram-project", description: "A command inside this command, like /settings view." },
  2: { key: "SUB_COMMAND_GROUP", label: "Subcommand group", icon: "fa-solid fa-folder-tree", description: "A folder of subcommands, like /settings roles add." },
  3: { key: "STRING", label: "Text", icon: "fa-solid fa-font", description: "Any text the user types." },
  4: { key: "INTEGER", label: "Whole number", icon: "fa-solid fa-hashtag", description: "A number with no decimals, like 5." },
  10: { key: "NUMBER", label: "Number", icon: "fa-solid fa-calculator", description: "Any number, decimals allowed, like 2.5." },
  5: { key: "BOOLEAN", label: "True or false", icon: "fa-solid fa-toggle-on", description: "The user picks True or False." },
  6: { key: "USER", label: "User", icon: "fa-solid fa-user", description: "The user picks someone." },
  7: { key: "CHANNEL", label: "Channel", icon: "fa-solid fa-hashtag", description: "The user picks a channel." },
  8: { key: "ROLE", label: "Role", icon: "fa-solid fa-shield-halved", description: "The user picks a role." },
  9: { key: "MENTIONABLE", label: "User or role", icon: "fa-solid fa-at", description: "The user picks a person or a role." },
  11: { key: "ATTACHMENT", label: "File", icon: "fa-solid fa-paperclip", description: "The user uploads a file." },
};

/** Types that can go at any level other than inside a group. */
export const VALUE_OPTION_TYPES = [3, 4, 10, 5, 6, 7, 8, 9, 11];

export const isSubcommand = (option) => option?.type === 1;
export const isGroup = (option) => option?.type === 2;
export const isStructural = (option) => option?.type === 1 || option?.type === 2;

/** Channel types a channel option can be limited to. */
export const CHANNEL_TYPES = [
  { value: 0, label: "Text channels" },
  { value: 2, label: "Voice channels" },
  { value: 4, label: "Categories" },
  { value: 5, label: "Announcement channels" },
  { value: 13, label: "Stage channels" },
  { value: 15, label: "Forum channels" },
  { value: 16, label: "Media channels" },
  { value: 11, label: "Public threads" },
  { value: 12, label: "Private threads" },
  { value: 10, label: "Announcement threads" },
];

/** Where a command can be used (Discord's interaction contexts). */
export const COMMAND_CONTEXTS = [
  { value: "Guild", label: "Servers", description: "In servers the bot is in." },
  { value: "BotDM", label: "Direct messages with the bot", description: "In a private chat with the bot." },
  { value: "PrivateChannel", label: "Other DMs and group chats", description: "Only works when people add the bot to their own account." },
];

/** How a command can be installed (Discord's integration types). */
export const INTEGRATION_TYPES = [
  { value: "GuildInstall", label: "Added to a server", description: "Available to everyone in servers the bot is added to." },
  { value: "UserInstall", label: "Added to someone's account", description: "People can add the bot to their account and use it anywhere." },
];

/** Permissions a command can require by default. Names match discord.js. */
export const PERMISSIONS = [
  { value: "Administrator", label: "Administrator" },
  { value: "ManageGuild", label: "Manage Server" },
  { value: "ManageRoles", label: "Manage Roles" },
  { value: "ManageChannels", label: "Manage Channels" },
  { value: "KickMembers", label: "Kick Members" },
  { value: "BanMembers", label: "Ban Members" },
  { value: "ModerateMembers", label: "Timeout Members" },
  { value: "ManageMessages", label: "Manage Messages" },
  { value: "ManageNicknames", label: "Manage Nicknames" },
  { value: "ManageWebhooks", label: "Manage Webhooks" },
  { value: "ManageGuildExpressions", label: "Manage Expressions" },
  { value: "ManageThreads", label: "Manage Threads" },
  { value: "ManageEvents", label: "Manage Events" },
  { value: "ViewAuditLog", label: "View Audit Log" },
  { value: "ViewGuildInsights", label: "View Server Insights" },
  { value: "MentionEveryone", label: "Mention @everyone" },
  { value: "MuteMembers", label: "Mute Members" },
  { value: "DeafenMembers", label: "Deafen Members" },
  { value: "MoveMembers", label: "Move Members" },
  { value: "CreateInstantInvite", label: "Create Invite" },
  { value: "ChangeNickname", label: "Change Nickname" },
  { value: "ViewChannel", label: "View Channels" },
  { value: "SendMessages", label: "Send Messages" },
  { value: "SendMessagesInThreads", label: "Send Messages in Threads" },
  { value: "CreatePublicThreads", label: "Create Public Threads" },
  { value: "CreatePrivateThreads", label: "Create Private Threads" },
  { value: "EmbedLinks", label: "Embed Links" },
  { value: "AttachFiles", label: "Attach Files" },
  { value: "AddReactions", label: "Add Reactions" },
  { value: "UseExternalEmojis", label: "Use External Emojis" },
  { value: "UseExternalStickers", label: "Use External Stickers" },
  { value: "ReadMessageHistory", label: "Read Message History" },
  { value: "SendTTSMessages", label: "Send Text-to-Speech Messages" },
  { value: "SendVoiceMessages", label: "Send Voice Messages" },
  { value: "SendPolls", label: "Create Polls" },
  { value: "UseApplicationCommands", label: "Use Application Commands" },
  { value: "UseExternalApps", label: "Use External Apps" },
  { value: "Connect", label: "Connect to Voice" },
  { value: "Speak", label: "Speak in Voice" },
  { value: "Stream", label: "Video" },
  { value: "UseVAD", label: "Use Voice Activity" },
  { value: "PrioritySpeaker", label: "Priority Speaker" },
  { value: "RequestToSpeak", label: "Request to Speak" },
  { value: "UseEmbeddedActivities", label: "Use Activities" },
  { value: "UseSoundboard", label: "Use Soundboard" },
];

const PERMISSION_NAMES = new Set(PERMISSIONS.map((p) => p.value));

/** Discord's supported languages, for translated names and descriptions. */
export const LOCALES = [
  { value: "id", label: "Indonesian" },
  { value: "da", label: "Danish" },
  { value: "de", label: "German" },
  { value: "en-GB", label: "English (UK)" },
  { value: "en-US", label: "English (US)" },
  { value: "es-ES", label: "Spanish" },
  { value: "es-419", label: "Spanish (Latin America)" },
  { value: "fr", label: "French" },
  { value: "hr", label: "Croatian" },
  { value: "it", label: "Italian" },
  { value: "lt", label: "Lithuanian" },
  { value: "hu", label: "Hungarian" },
  { value: "nl", label: "Dutch" },
  { value: "no", label: "Norwegian" },
  { value: "pl", label: "Polish" },
  { value: "pt-BR", label: "Portuguese (Brazil)" },
  { value: "ro", label: "Romanian" },
  { value: "fi", label: "Finnish" },
  { value: "sv-SE", label: "Swedish" },
  { value: "vi", label: "Vietnamese" },
  { value: "tr", label: "Turkish" },
  { value: "cs", label: "Czech" },
  { value: "el", label: "Greek" },
  { value: "bg", label: "Bulgarian" },
  { value: "ru", label: "Russian" },
  { value: "uk", label: "Ukrainian" },
  { value: "hi", label: "Hindi" },
  { value: "th", label: "Thai" },
  { value: "zh-CN", label: "Chinese (China)" },
  { value: "ja", label: "Japanese" },
  { value: "zh-TW", label: "Chinese (Taiwan)" },
  { value: "ko", label: "Korean" },
];

const LOCALE_CODES = new Set(LOCALES.map((l) => l.value));

/* ---------------------------------------------------------------------
   Checks
   --------------------------------------------------------------------- */

/** A slash command, subcommand, group or option name. */
export function checkName(name) {
  const text = String(name ?? "");
  if (!text.length) return "Give it a name.";
  if (/\s/.test(text)) return "Names can't have spaces. Try a dash (-) or underscore (_) instead.";
  if ([...text].length > LIMITS.nameLength) return `Names can be up to ${LIMITS.nameLength} characters long.`;
  if (!NAME_PATTERN.test(text))
    return "Names can only use letters, numbers, dashes (-) and underscores (_).";
  if (text !== text.toLowerCase()) return "Names must be all lowercase.";
  return null;
}

/** A right-click (context menu) command's name: spaces and capitals are fine. */
export function checkContextMenuName(name) {
  const text = String(name ?? "");
  if (!text.trim().length) return "Give it a name.";
  if (text !== text.trim()) return "Names can't start or end with a space.";
  if ([...text].length > LIMITS.nameLength) return `Names can be up to ${LIMITS.nameLength} characters long.`;
  return null;
}

/** A command, subcommand or option description. */
export function checkDescription(description) {
  const text = String(description ?? "");
  if (!text.trim().length) return "Add a short description. Discord shows it under the name.";
  if ([...text].length > LIMITS.descriptionLength)
    return `Descriptions can be up to ${LIMITS.descriptionLength} characters long.`;
  return null;
}

/** One preset choice (or autocomplete suggestion) of an option. */
export function checkChoice(type, choice) {
  const name = String(choice?.name ?? "");
  if (!name.trim().length) return "Every choice needs a name.";
  if ([...name].length > LIMITS.choiceNameLength)
    return `Choice names can be up to ${LIMITS.choiceNameLength} characters long.`;

  const value = choice?.value;
  if (type === 3) {
    const text = String(value ?? "");
    if (!text.length) return "Every choice needs a value.";
    if ([...text].length > LIMITS.choiceValueLength)
      return `Choice values can be up to ${LIMITS.choiceValueLength} characters long.`;
  } else if (type === 4) {
    if (value === "" || value === null || !Number.isInteger(Number(value)))
      return "This choice's value must be a whole number.";
  } else if (type === 10) {
    if (value === "" || value === null || !Number.isFinite(Number(value)))
      return "This choice's value must be a number.";
  }
  return null;
}

/** An event's own label. Empty is allowed: the event's type is shown instead. */
export function checkEventLabel(label) {
  if ([...String(label ?? "")].length > LIMITS.eventLabelLength)
    return `Labels can be up to ${LIMITS.eventLabelLength} characters long.`;
  return null;
}

/** A variable's name. `others` are the names already taken. */
export function checkVariableName(name, others = []) {
  const text = String(name ?? "").trim();
  if (!text.length) return "Give the variable a name.";
  if ([...text].length > LIMITS.variableNameLength)
    return `Variable names can be up to ${LIMITS.variableNameLength} characters long.`;
  if (others.some((other) => String(other).trim().toLowerCase() === text.toLowerCase()))
    return "There's already a variable with that name.";
  return null;
}

/** Only known permission names. */
export function cleanPermissions(list) {
  return [...new Set((Array.isArray(list) ? list : []).map(String))].filter((p) =>
    PERMISSION_NAMES.has(p),
  );
}

/** Only known locales, only non-empty strings, each within `max` characters. */
export function cleanLocalizations(map, max) {
  const out = {};
  if (!map || typeof map !== "object") return out;
  for (const [locale, text] of Object.entries(map)) {
    if (!LOCALE_CODES.has(locale)) continue;
    const value = String(text ?? "").slice(0, max);
    if (value.trim()) out[locale] = value;
  }
  return out;
}
