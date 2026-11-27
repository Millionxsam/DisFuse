/* =====================================================================
   DisFuse Builder: contexts
   ---------------------------------------------------------------------
   A context is something that exists while a command or event runs:
   "there is an interaction you can reply to", "there is a message".
   Commands and events PROVIDE contexts, and actions and values can
   REQUIRE them. An action whose requirements aren't met can't be added
   there, which is how "reply to the command" is kept out of "when the
   bot starts".

   Values that only make sense inside ONE event ("the deleted message")
   don't need a context: they are listed on the event itself, and only
   ever offered inside that event. Contexts are for things shared by
   several triggers, like everything that works on any interaction.

   Each context names the JavaScript variable that holds it, because
   generated code refers to it directly (`interaction.reply(...)`).

   Catalog modules can declare extra contexts by exporting a `contexts`
   array of the same shape; the catalog index merges them in.
   ===================================================================== */

export const CONTEXTS = {
  interaction: {
    label: "a command, button, menu or form",
    description: "Only works when someone uses a command, button, menu or form.",
    variable: "interaction",
  },
  repliable: {
    label: "a command, button, menu or form",
    description: "Only works in a command, or when someone uses a button, menu or form, because it answers them.",
    variable: "interaction",
  },
  showModal: {
    label: "a command, button or menu",
    description: "Only works in a command, or when someone clicks a button or picks from a menu. Forms can't open from another form.",
    variable: "interaction",
  },
  chatInput: {
    label: "a slash command",
    description: "Only works in a slash command.",
    variable: "interaction",
  },
  contextMenu: {
    label: "a right-click command",
    description: "Only works in a right-click command.",
    variable: "interaction",
  },
  userContextMenu: {
    label: "a right-click command on a user",
    description: "Only works in a right-click command used on a user.",
    variable: "interaction",
  },
  messageContextMenu: {
    label: "a right-click command on a message",
    description: "Only works in a right-click command used on a message.",
    variable: "interaction",
  },
  component: {
    label: "a button click or menu pick",
    description: "Only works when someone clicks a button or picks from a menu.",
    variable: "interaction",
  },
  button: {
    label: "a button click",
    description: "Only works when someone clicks a button.",
    variable: "interaction",
  },
  selectMenu: {
    label: "a menu pick",
    description: "Only works when someone picks from a menu.",
    variable: "interaction",
  },
  modalSubmit: {
    label: "a form being sent",
    description: "Only works in \"When a form is submitted\".",
    variable: "interaction",
  },
  autocomplete: {
    label: "option suggestions",
    description: "Only works while Discord asks for option suggestions.",
    variable: "interaction",
  },
  message: {
    label: "a received message",
    description: "Only works in \"When a message is sent\" or \"When someone replies to a message\", where there's a message to work with.",
    variable: "message",
  },
};

/**
 * What each kind of command flow provides. Events declare their own
 * `provides` in their definitions.
 */
export const FLOW_CONTEXTS = {
  slash: ["interaction", "repliable", "showModal", "chatInput"],
  user: ["interaction", "repliable", "showModal", "contextMenu", "userContextMenu"],
  message: ["interaction", "repliable", "showModal", "contextMenu", "messageContextMenu"],
};

/** A readable "Only works in ..." line for a list of required contexts. */
export function describeRequirement(requires = [], contexts = CONTEXTS) {
  if (!requires.length) return "";
  /* The most specific requirement says it best: "a slash command" is
     more useful than "a command, button, menu or form, and a slash
     command". Contexts are listed from general to specific. */
  const last = requires[requires.length - 1];
  if (contexts[last]?.description) return contexts[last].description;
  const labels = [...new Set(requires.map((key) => contexts[key]?.label ?? key))];
  return `Only works in ${labels.join(" and ")}.`;
}

/** Does a set of available contexts satisfy a list of requirements? */
export function satisfies(available, requires = []) {
  const set = available instanceof Set ? available : new Set(available);
  return requires.every((key) => set.has(key));
}
