/* =====================================================================
   DisFuse Builder: what a collaborator may do
   ---------------------------------------------------------------------
   SHARED FILE. An identical copy lives in the API at
   functions/builder/permissions.js, next to its copy of ops.js. The page
   uses it to decide which buttons to show and to refuse a change before
   it's sent; the API uses it to refuse the same change for real. Change
   both copies or neither.

   The owner of a project can do everything. Everyone in
   `project.collaborators` can open the project and see all of it, and
   can do exactly the things their entry in `project.collaboratorPermissions`
   lists:

     collaboratorPermissions = { [discordUserId]: PermissionId[] }

   Every permission is one action. "Create commands" and "Delete commands"
   are different permissions, and so are the steps of a command and the
   steps of an event, because people reasonably want to hand out one
   without the other.

   Plain JavaScript; the only import is the other shared file.
   ===================================================================== */

import {
  findAction,
  findFlow,
  isRepeatItem,
  templateCommandSettings,
  templateOptionSettings,
  walkOptions,
} from "./ops.js";

/**
 * Every permission, in the groups the collaborators page shows them in.
 *
 * `requires` lists permissions that must come with this one (changing a
 * secret's value means seeing it first). `danger` marks the ones that
 * hand over something the owner can't take back, like the bot's token.
 */
export const PERMISSION_GROUPS = [
  {
    id: "commands",
    label: "Commands",
    icon: "fa-solid fa-terminal",
    color: "#35d0a0",
    permissions: [
      { id: "commands.create", label: "Create commands", description: "Make new slash commands and right-click commands." },
      { id: "commands.rename", label: "Rename commands", description: "Change a command's name." },
      { id: "commands.describe", label: "Edit command descriptions", description: "Change the line shown under a slash command's name." },
      { id: "commands.translate", label: "Edit command translations", description: "Change a command's name and description in other languages." },
      { id: "commands.access", label: "Change who can use commands", description: "The permissions people need to use a command, and whether it's age-restricted." },
      { id: "commands.contexts", label: "Change where commands work", description: "Servers, DMs and group DMs, and how the command can be installed." },
      { id: "commands.delete", label: "Delete commands", description: "Delete a command, with its options and steps." },
    ],
  },
  {
    id: "options",
    label: "Options and subcommands",
    icon: "fa-solid fa-sliders",
    color: "#4fa8ff",
    permissions: [
      { id: "options.create", label: "Add options and subcommands", description: "Add options, subcommands and subcommand groups to slash commands." },
      { id: "options.edit", label: "Edit options and subcommands", description: "Change their names, descriptions, choices and limits." },
      { id: "options.reorder", label: "Reorder options", description: "Change the order options and subcommands are listed in." },
      { id: "options.delete", label: "Delete options and subcommands", description: "Delete an option, or a subcommand with its steps." },
    ],
  },
  {
    id: "commandSteps",
    label: "Steps in commands",
    icon: "fa-solid fa-hammer",
    color: "#2fbf8f",
    permissions: [
      { id: "commandSteps.add", label: "Add steps to commands", description: "Add new steps, and duplicate existing ones." },
      { id: "commandSteps.edit", label: "Change steps in commands", description: "Fill in a step's details, and add or remove its sections (like \"Otherwise\")." },
      { id: "commandSteps.move", label: "Move steps in commands", description: "Drag steps to a new place, or move them up and down." },
      { id: "commandSteps.toggle", label: "Turn steps in commands on and off", description: "Disable a step without deleting it, or enable it again." },
      { id: "commandSteps.delete", label: "Delete steps from commands", description: "Delete steps, including the steps inside them." },
    ],
  },
  {
    id: "events",
    label: "Events",
    icon: "fa-solid fa-bolt",
    color: "#ffb648",
    permissions: [
      { id: "events.create", label: "Add events", description: "Add new events for the bot to react to." },
      { id: "events.rename", label: "Rename events", description: "Change an event's label." },
      { id: "events.settings", label: "Change event settings", description: "Change the settings that narrow down when an event runs." },
      { id: "events.toggle", label: "Turn events on and off", description: "Stop an event from running without deleting it, or start it again." },
      { id: "events.reorder", label: "Reorder events", description: "Change the order events are listed in." },
      { id: "events.delete", label: "Delete events", description: "Delete an event and all of its steps." },
    ],
  },
  {
    id: "eventSteps",
    label: "Steps in events",
    icon: "fa-solid fa-hammer",
    color: "#ff9a3d",
    permissions: [
      { id: "eventSteps.add", label: "Add steps to events", description: "Add new steps, and duplicate existing ones." },
      { id: "eventSteps.edit", label: "Change steps in events", description: "Fill in a step's details, and add or remove its sections (like \"Otherwise\")." },
      { id: "eventSteps.move", label: "Move steps in events", description: "Drag steps to a new place, or move them up and down." },
      { id: "eventSteps.toggle", label: "Turn steps in events on and off", description: "Disable a step without deleting it, or enable it again." },
      { id: "eventSteps.delete", label: "Delete steps from events", description: "Delete steps, including the steps inside them." },
    ],
  },
  {
    id: "variables",
    label: "Variables",
    icon: "fa-solid fa-box",
    color: "#e23fe2",
    permissions: [
      { id: "variables.create", label: "Create variables", description: "Make new variables while building steps." },
      { id: "variables.rename", label: "Rename variables", description: "Change a variable's name." },
      { id: "variables.delete", label: "Delete variables", description: "Delete variables that nothing uses anymore." },
    ],
  },
  {
    id: "secrets",
    label: "Secrets",
    icon: "fa-solid fa-user-secret",
    color: "#c45cff",
    permissions: [
      { id: "secrets.view", label: "See secrets", description: "See the project's secrets and their values. They're also included when this person exports the bot." },
      { id: "secrets.create", label: "Add secrets", description: "Add new secrets.", requires: ["secrets.view"] },
      { id: "secrets.edit", label: "Change secret values", description: "Replace the value of an existing secret.", requires: ["secrets.view"] },
      { id: "secrets.delete", label: "Delete secrets", description: "Delete secrets.", requires: ["secrets.view"] },
    ],
  },
  {
    id: "settings",
    label: "Project settings",
    icon: "fa-solid fa-gear",
    color: "#8b6cff",
    permissions: [
      { id: "settings.description", label: "Edit the description", description: "Change the project's description." },
      { id: "settings.visibility", label: "Change project visibility", description: "Make the project public or private." },
      { id: "settings.botVisibility", label: "Change bot visibility", description: "Show or hide the bot on the project's page." },
      { id: "settings.invitePermissions", label: "Change invite permissions", description: "Change the permissions the bot asks for when it's added to a server." },
      { id: "token.view", label: "See the bot token", description: "Anyone with the token can log in as your bot. It's also included when this person exports the bot.", danger: true },
      { id: "token.change", label: "Change the bot token", description: "Replace the bot's token, for example after resetting it.", danger: true },
    ],
  },
  {
    id: "insights",
    label: "Insights",
    icon: "fa-solid fa-chart-line",
    color: "#35a7d0",
    permissions: [
      { id: "insights.view", label: "View Insights", description: "See the bot's charts and stats." },
      { id: "insights.logs", label: "View Insights logs", description: "See the bot's event log, including who used which command.", requires: ["insights.view"] },
      { id: "insights.settings", label: "Change Insights history", description: "Change how many days of history Insights keeps.", requires: ["insights.view"] },
      { id: "insights.clear", label: "Delete Insights logs", description: "Delete all of the bot's Insights history.", requires: ["insights.view"], danger: true },
    ],
  },
  {
    id: "collaborators",
    label: "Collaborators",
    icon: "fa-solid fa-user-group",
    color: "#ff6fa8",
    permissions: [
      { id: "collaborators.invite", label: "Invite collaborators", description: "Add people to the project. They can only be given permissions this person has." },
      { id: "collaborators.permissions", label: "Change collaborators' permissions", description: "Change what other collaborators can do, using only permissions this person has." },
      { id: "collaborators.remove", label: "Remove collaborators", description: "Take people off the project." },
    ],
  },
];

/** id → permission (with its group id). */
export const PERMISSIONS = new Map(
  PERMISSION_GROUPS.flatMap((group) => group.permissions.map((permission) => [permission.id, { ...permission, group: group.id }])),
);

export const ALL_PERMISSIONS = [...PERMISSIONS.keys()];

const groupIds = (...ids) =>
  PERMISSION_GROUPS.filter((group) => ids.includes(group.id)).flatMap((group) => group.permissions.map((p) => p.id));

/** Quick starting points on the collaborators page. */
export const PRESETS = [
  {
    id: "view",
    label: "Can view",
    icon: "fa-solid fa-eye",
    description: "Sees everything but can't change anything.",
    permissions: [],
  },
  {
    id: "build",
    label: "Can build",
    icon: "fa-solid fa-hammer",
    description: "Commands, events, their steps and variables.",
    permissions: groupIds("commands", "options", "commandSteps", "events", "eventSteps", "variables"),
  },
  {
    id: "full",
    label: "Full access",
    icon: "fa-solid fa-crown",
    description: "Every permission, including the bot token.",
    permissions: ALL_PERMISSIONS,
  },
];

/** Only real permissions, each once, with everything they require. */
export function cleanPermissionList(list) {
  const wanted = new Set((Array.isArray(list) ? list : []).filter((id) => typeof id === "string" && PERMISSIONS.has(id)));
  for (const id of [...wanted]) for (const required of PERMISSIONS.get(id).requires ?? []) wanted.add(required);
  /* Catalog order, so two equal lists compare equal. */
  return ALL_PERMISSIONS.filter((id) => wanted.has(id));
}

/** Adds a permission and what it requires, or removes it and what requires it. */
export function togglePermission(list, id, on) {
  const next = new Set(list);
  if (on) {
    next.add(id);
    for (const required of PERMISSIONS.get(id)?.requires ?? []) next.add(required);
  } else {
    next.delete(id);
    for (const [other, permission] of PERMISSIONS) if (permission.requires?.includes(id)) next.delete(other);
  }
  return cleanPermissionList([...next]);
}

/** The preset a list matches exactly, if any. */
export function presetFor(list) {
  const clean = cleanPermissionList(list);
  return PRESETS.find((preset) => preset.permissions.length === clean.length && preset.permissions.every((id) => clean.includes(id))) ?? null;
}

/* ---------------------------------------------------------------------
   Who someone is to a project
   --------------------------------------------------------------------- */

/**
 * What this user may do to this project.
 *
 * @param {object} project  needs `owner`, `collaborators` and `collaboratorPermissions`
 * @param {string} userId
 * @returns {{ isOwner: boolean, isCollaborator: boolean, permissions: string[], can: (id: string) => boolean }}
 */
export function accessFor(project, userId) {
  const isOwner = Boolean(userId) && project?.owner?.id === userId;
  const isCollaborator = !isOwner && Boolean(userId) && (project?.collaborators ?? []).includes(userId);
  const permissions = isOwner ? ALL_PERMISSIONS : isCollaborator ? cleanPermissionList(project?.collaboratorPermissions?.[userId]) : [];
  const held = new Set(permissions);
  return { isOwner, isCollaborator, permissions, can: (id) => held.has(id) };
}

/* ---------------------------------------------------------------------
   What each change needs
   --------------------------------------------------------------------- */

const COMMAND_FIELDS = {
  name: "commands.rename",
  description: "commands.describe",
  nameLocalizations: "commands.translate",
  descriptionLocalizations: "commands.translate",
  defaultMemberPermissions: "commands.access",
  nsfw: "commands.access",
  contexts: "commands.contexts",
  integrationTypes: "commands.contexts",
};

const EVENT_FIELDS = {
  label: "events.rename",
  settings: "events.settings",
  enabled: "events.toggle",
  /* Refused by updateEvent anyway; asking for "settings" keeps it from
     slipping through as a change that needs nothing. */
  type: "events.settings",
};

/** "commandSteps" or "eventSteps": which set of step permissions a flow uses. */
export function stepGroupFor(builder, flowId) {
  return findFlow(builder, flowId)?.kind === "event" ? "eventSteps" : "commandSteps";
}

function hasSteps(entries) {
  return (entries ?? []).some((entry) => (isRepeatItem(entry) ? entry.actions?.length : true));
}

/** The steps inside one branch (or one section of it) of a step. */
function branchContents(builder, flowId, actionId, branch, itemId) {
  const flow = findFlow(builder, flowId);
  const found = flow && findAction(flow.owner.actions ?? [], actionId);
  const entries = found?.action?.branches?.[branch];
  if (!Array.isArray(entries)) return [];
  if (itemId === undefined) return entries;
  return entries.find((entry) => entry.id === itemId)?.actions ?? [];
}

/**
 * The permissions a change needs, worked out against the builder it's
 * about to be applied to (a section that still holds steps needs
 * permission to delete steps as well as to change the step).
 *
 * @param {object} builder  the current builder
 * @param {string} name     a key of OPS in ops.js
 * @param {object} payload
 * @returns {string[]}  empty when anyone on the project may do it;
 *   ["owner"] when only the owner may
 */
export function permissionsForOp(builder, name, payload = {}) {
  const steps = () => stepGroupFor(builder, payload.flowId);
  const fields = (patch, map) => {
    const keys = Object.keys(patch && typeof patch === "object" ? patch : {});
    return [...new Set(keys.map((key) => map[key] ?? "owner"))];
  };

  switch (name) {
    case "createCommand":
      return ["commands.create"];
    case "updateCommand":
      return fields(payload.patch, COMMAND_FIELDS);
    case "deleteCommand":
      return ["commands.delete"];

    case "createOption":
      return ["options.create"];
    case "updateOption":
      return ["options.edit"];
    case "deleteOption":
      return ["options.delete"];
    case "reorderOptions":
      return ["options.reorder"];

    case "createEvent":
      return ["events.create"];
    case "updateEvent":
      return fields(payload.patch, EVENT_FIELDS);
    case "deleteEvent":
      return ["events.delete"];
    case "reorderEvents":
      return ["events.reorder"];

    case "insertAction":
      return [`${steps()}.add`];
    case "updateAction": {
      const patch = payload.patch && typeof payload.patch === "object" ? payload.patch : {};
      const needed = [];
      if ("inputs" in patch) needed.push(`${steps()}.edit`);
      if ("disabled" in patch) needed.push(`${steps()}.toggle`);
      if (Object.keys(patch).some((key) => key !== "inputs" && key !== "disabled")) needed.push("owner");
      return needed;
    }
    case "moveAction":
      return [`${steps()}.move`];
    case "deleteAction":
      return [`${steps()}.delete`];

    case "setBranchEnabled": {
      const removing = payload.enabled === false;
      const losesSteps = removing && hasSteps(branchContents(builder, payload.flowId, payload.actionId, payload.branch));
      return losesSteps ? [`${steps()}.edit`, `${steps()}.delete`] : [`${steps()}.edit`];
    }
    case "removeBranchItem": {
      const losesSteps = hasSteps(branchContents(builder, payload.flowId, payload.actionId, payload.branch, payload.itemId));
      return losesSteps ? [`${steps()}.edit`, `${steps()}.delete`] : [`${steps()}.edit`];
    }
    case "addBranchItem":
    case "updateBranchItem":
    case "moveBranchItem":
      return [`${steps()}.edit`];

    case "createVariable":
      return ["variables.create"];
    case "renameVariable":
      return ["variables.rename"];
    case "deleteVariable":
      return ["variables.delete"];

    /* Everything the template adds, as if it were added by hand. */
    case "importTemplate":
      return templatePermissions(payload.content, fields);

    default:
      return ["owner"];
  }
}

/** What importing a template needs: one permission per kind of thing in it. */
function templatePermissions(content, fields) {
  const needed = new Set();
  const list = (value) => (Array.isArray(value) ? value : []);
  const source = content && typeof content === "object" ? content : {};

  if (list(source.variables).length) needed.add("variables.create");
  for (const command of list(source.commands)) {
    needed.add("commands.create");
    for (const id of fields(templateCommandSettings(command), COMMAND_FIELDS)) needed.add(id);
    if (list(command?.actions).length) needed.add("commandSteps.add");
    walkOptions(list(command?.options), (option) => {
      needed.add("options.create");
      if (Object.keys(templateOptionSettings(option)).length) needed.add("options.edit");
      if (list(option?.actions).length) needed.add("commandSteps.add");
    });
  }
  for (const event of list(source.events)) {
    needed.add("events.create");
    if (event?.enabled === false) needed.add(EVENT_FIELDS.enabled);
    if (list(event?.actions).length) needed.add("eventSteps.add");
  }
  return [...needed];
}

/**
 * Why this person can't make this change, or null when they can.
 *
 * @param {{ isOwner: boolean, can: (id: string) => boolean }} access  from accessFor()
 */
export function opRefusal(access, builder, name, payload) {
  if (access?.isOwner) return null;
  if (!access?.isCollaborator) return "You can't change this project.";
  const missing = permissionsForOp(builder, name, payload).filter((id) => !access.can(id));
  if (!missing.length) return null;
  if (missing.includes("owner")) return "Only the project's owner can do that.";
  const labels = missing.map((id) => `"${PERMISSIONS.get(id)?.label ?? id}"`);
  return `You need the ${labels.join(" and ")} permission${missing.length === 1 ? "" : "s"} for that. Ask the project's owner.`;
}
