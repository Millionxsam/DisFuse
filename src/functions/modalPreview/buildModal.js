import {
  CREATE_BLOCK,
  MODAL_EVENTS,
  SHOW_BLOCK,
  findEvent,
  resolveCreateBlock,
  respondedBefore,
} from "./modalBlocks.js";
import {
  hasDynamic,
  literalOnly,
  parseEmoji,
  resolveBoolean,
  resolveText,
  toDisplay,
} from "../messagePreview/values.js";

/* =====================================================================
   Blocks → the modal Discord would show
   ---------------------------------------------------------------------
   The output mirrors the modal payload the bot sends — numeric component
   types, a Label (18) wrapping each input, `min_values`, `required` —
   so the component drawing it reads the same fields Discord does.

   Everything here follows what the JavaScript generators in
   `src/blocks/modals.js` and `src/blocks/modalComponents.js` emit. When
   an input is left empty the generator leaves the setter out, and
   Discord's default applies — which, for `required`, is *true*. The
   preview uses the same defaults, or it would show optional fields the
   user can't actually skip.

   Text keeps its runtime placeholders (see `values.js`) so the panel
   can draw them as chips; `toDisplay` is only used where a plain string
   is needed.
   ===================================================================== */

/* Discord's published limits for modals, checked so the editor can say
   so before Discord refuses to open the modal at runtime. */
const LIMITS = {
  components: 5,
  title: 45,
  label: 45,
  labelDescription: 100,
  textInputLength: 4000,
  textInputPlaceholder: 100,
  selectPlaceholder: 150,
  selectOptions: 25,
  radioOptions: { min: 2, max: 10 },
  checkboxOptions: { min: 1, max: 10 },
  files: 10,
};

const TEXT_STYLES = { Short: 1, Paragraph: 2, short: 1, paragraph: 2 };

const ENTITY_SELECTS = {
  modalc_userSelect: { type: 5, defaults: "defaultUsers" },
  modalc_roleSelect: { type: 6, defaults: "defaultRoles" },
  modalc_mentionableSelect: { type: 7, defaults: "defaultValues" },
  modalc_channelSelect: { type: 8, defaults: "defaultChannels" },
};

/* ---- Reading blocks ---------------------------------------------------- */

function usable(block) {
  return Boolean(block) && block.isEnabled() && !block.isInsertionMarker();
}

/** Every enabled block in a statement input, in order. */
function statementChain(block, inputName) {
  if (!block?.getInput?.(inputName)) return [];

  const out = [];
  let current = block.getInputTargetBlock(inputName);

  while (current) {
    if (usable(current)) out.push(current);
    current = current.getNextBlock();
  }

  return out;
}

/** A number input, or null when it is empty or only known at runtime. */
function resolveNumber(block, inputName) {
  const literal = literalOnly(resolveText(block, inputName));
  if (literal === null) return null;

  const number = Number(literal);
  return Number.isFinite(number) ? number : null;
}

/** Discord's default for an unset `required` is true, in every input. */
function resolveRequired(block, inputName = "required") {
  return resolveBoolean(block, inputName) !== false;
}

/** The length of a string, or null if some of it isn't known yet. */
function knownLength(text) {
  return hasDynamic(text) ? null : text.length;
}

function note(ctx, level, text) {
  if (ctx.notes.some((existing) => existing.text === text)) return;
  ctx.notes.push({ level, text });
}

/**
 * What a block calls itself: the words on its first line, without the
 * empty-socket "?"s that `toString` puts in — "defer reply", not "defer
 * reply visible only to the user? ?".
 */
function blockName(block) {
  const words = (block.inputList[0]?.fieldRow ?? [])
    .map((field) => field.getText())
    .join(" ")
    .replace(/\s+/g, " ")
    .replace(/:$/, "")
    .trim();

  return words || block.type;
}

function name(text, fallback) {
  const plain = toDisplay(text).trim();
  if (!plain) return fallback;
  return `“${plain.length > 32 ? `${plain.slice(0, 31)}…` : plain}”`;
}

function trackCustomId(ctx, block, inputName = "customId") {
  const id = literalOnly(resolveText(block, inputName));
  if (!id) return;

  if (ctx.customIds.has(id))
    note(
      ctx,
      "warn",
      `Two inputs use the custom ID “${id}”. Each input in a modal needs its own, or Discord won't open it.`,
    );

  ctx.customIds.add(id);
}

/* ---- Inputs (what goes inside a label) --------------------------------- */

function readOptions(block, withEmoji) {
  const type = withEmoji ? "modalc_selectOption" : "modalc_choiceOption";

  return statementChain(block, "options")
    .filter((option) => option.type === type)
    .map((option) => {
      const emoji = withEmoji
        ? parseEmoji(resolveText(option, "emoji"))
        : null;

      return {
        label: resolveText(option, "label"),
        description: resolveText(option, "description"),
        value: toDisplay(resolveText(option, "value")),
        default: resolveBoolean(option, "default") === true,
        ...(emoji ? { emoji } : {}),
      };
    });
}

function checkMinMax(ctx, component, what, cap) {
  const { min_values: min, max_values: max } = component;

  if (min !== null && max !== null && min > max)
    note(
      ctx,
      "warn",
      `${what} asks for at least ${min} but at most ${max}, so it can never be filled in.`,
    );

  if (cap && max !== null && max > cap)
    note(ctx, "warn", `${what} allows ${max}; Discord's limit is ${cap}.`);
}

function convertInput(block, ctx, labelName) {
  switch (block.type) {
    case "modalc_textInput": {
      const component = {
        type: 4,
        style: TEXT_STYLES[block.getFieldValue("style")] ?? 1,
        placeholder: resolveText(block, "placeholder"),
        value: resolveText(block, "value"),
        min_length: resolveNumber(block, "min"),
        max_length: resolveNumber(block, "max"),
        required: resolveRequired(block),
      };

      checkTextInput(ctx, component, labelName);
      trackCustomId(ctx, block);
      return component;
    }

    case "modalc_stringSelect": {
      const options = readOptions(block, true);
      const component = {
        type: 3,
        placeholder: resolveText(block, "placeholder"),
        min_values: resolveNumber(block, "min"),
        max_values: resolveNumber(block, "max"),
        required: resolveRequired(block),
        options,
      };

      const what = `The select menu in ${labelName}`;

      if (!options.length)
        note(ctx, "warn", `${what} has no options to pick from.`);
      else if (options.length > LIMITS.selectOptions)
        note(
          ctx,
          "warn",
          `${what} has ${options.length} options. Discord allows ${LIMITS.selectOptions}.`,
        );

      if (
        component.max_values !== null &&
        options.length &&
        component.max_values > options.length
      )
        note(
          ctx,
          "warn",
          `${what} lets people pick ${component.max_values}, but only has ${options.length} option${options.length === 1 ? "" : "s"}.`,
        );

      checkMinMax(ctx, component, what, LIMITS.selectOptions);
      checkPlaceholder(ctx, component, what, LIMITS.selectPlaceholder);
      trackCustomId(ctx, block);
      return component;
    }

    case "modalc_fileUpload": {
      const component = {
        type: 19,
        min_values: resolveNumber(block, "min"),
        max_values: resolveNumber(block, "max"),
        required: resolveRequired(block),
      };

      checkMinMax(
        ctx,
        component,
        `The file upload in ${labelName}`,
        LIMITS.files,
      );
      trackCustomId(ctx, block);
      return component;
    }

    case "modalc_radioGroup": {
      const options = readOptions(block, false);
      const { min, max } = LIMITS.radioOptions;

      if (options.length < min || options.length > max)
        note(
          ctx,
          "warn",
          `The radio buttons in ${labelName} have ${options.length} option${options.length === 1 ? "" : "s"}. Discord needs between ${min} and ${max}.`,
        );

      if (options.filter((option) => option.default).length > 1)
        note(
          ctx,
          "warn",
          `More than one radio button in ${labelName} is selected by default — only one can be.`,
        );

      trackCustomId(ctx, block);
      return { type: 21, required: resolveRequired(block), options };
    }

    case "modalc_checkboxGroup": {
      const options = readOptions(block, false);
      const { min, max } = LIMITS.checkboxOptions;
      const component = {
        type: 22,
        min_values: resolveNumber(block, "min"),
        max_values: resolveNumber(block, "max"),
        required: resolveRequired(block),
        options,
      };

      if (options.length < min || options.length > max)
        note(
          ctx,
          "warn",
          `The checkboxes in ${labelName} have ${options.length} option${options.length === 1 ? "" : "s"}. Discord needs between ${min} and ${max}.`,
        );

      checkMinMax(ctx, component, `The checkboxes in ${labelName}`, max);
      trackCustomId(ctx, block);
      return component;
    }

    case "modalc_checkbox":
      trackCustomId(ctx, block);
      return {
        type: 23,
        default: resolveBoolean(block, "checked") === true,
        /* A lone checkbox can't be required — unticked is an answer. */
        required: false,
      };

    default: {
      const entity = ENTITY_SELECTS[block.type];

      if (entity) {
        const component = {
          type: entity.type,
          placeholder: resolveText(block, "placeholder"),
          min_values: resolveNumber(block, "min"),
          max_values: resolveNumber(block, "max"),
          required: resolveRequired(block),
          hasDefaults: Boolean(block.getInputTargetBlock(entity.defaults)),
        };

        const what = `The select menu in ${labelName}`;
        checkMinMax(ctx, component, what, LIMITS.selectOptions);
        checkPlaceholder(ctx, component, what, LIMITS.selectPlaceholder);
        trackCustomId(ctx, block);
        return component;
      }

      note(
        ctx,
        "warn",
        `“${blockName(block)}” can't go inside a modal label — use one of the inputs from the Modals category.`,
      );
      return null;
    }
  }
}

function checkPlaceholder(ctx, component, what, limit) {
  const length = knownLength(component.placeholder);

  if (length !== null && length > limit)
    note(
      ctx,
      "warn",
      `${what} has a ${length}-character placeholder. Discord allows ${limit}.`,
    );
}

function checkTextInput(ctx, component, labelName) {
  const what = `The text input in ${labelName}`;
  const { min_length: min, max_length: max } = component;

  if (min !== null && (min < 0 || min > LIMITS.textInputLength))
    note(
      ctx,
      "warn",
      `${what} has a minimum length of ${min}. Discord allows 0 to ${LIMITS.textInputLength}.`,
    );

  if (max !== null && (max < 1 || max > LIMITS.textInputLength))
    note(
      ctx,
      "warn",
      `${what} has a maximum length of ${max}. Discord allows 1 to ${LIMITS.textInputLength}.`,
    );

  if (min !== null && max !== null && min > max)
    note(
      ctx,
      "warn",
      `${what} needs at least ${min} characters but allows at most ${max}, so nobody can submit it.`,
    );

  checkPlaceholder(ctx, component, what, LIMITS.textInputPlaceholder);

  const valueLength = knownLength(component.value);
  if (valueLength && max !== null && valueLength > max)
    note(
      ctx,
      "warn",
      `${what} is prefilled with ${valueLength} characters but only allows ${max}.`,
    );
}

/* ---- Top-level components ---------------------------------------------- */

function convertLabel(block, ctx) {
  const label = resolveText(block, "label");
  const description = resolveText(block, "description");
  const labelName = name(label, "a label");

  const labelLength = knownLength(label);
  if (labelLength !== null && labelLength > LIMITS.label)
    note(
      ctx,
      "warn",
      `The label ${labelName} is ${labelLength} characters. Discord allows ${LIMITS.label}.`,
    );

  const descriptionLength = knownLength(description);
  if (descriptionLength !== null && descriptionLength > LIMITS.labelDescription)
    note(
      ctx,
      "warn",
      `The description under ${labelName} is ${descriptionLength} characters. Discord allows ${LIMITS.labelDescription}.`,
    );

  const inner = block.getInputTargetBlock("component");
  const component = usable(inner) ? convertInput(inner, ctx, labelName) : null;

  if (!usable(inner))
    note(
      ctx,
      "warn",
      `The label ${labelName} has no input plugged into it, and Discord won't open a modal with an empty label.`,
    );

  return { type: 18, label, description, component };
}

/** The retired "add text input" blocks, which held their own label. */
function convertLegacyTextInput(block, ctx, advanced) {
  const label = resolveText(block, "label");
  const component = {
    type: 4,
    style: TEXT_STYLES[block.getFieldValue("style")] ?? 1,
    placeholder: advanced ? resolveText(block, "placeholder") : "",
    value: "",
    min_length: advanced ? resolveNumber(block, "min") : null,
    max_length: advanced ? resolveNumber(block, "max") : null,
    required: resolveRequired(block),
  };

  checkTextInput(ctx, component, name(label, "a text input"));
  trackCustomId(ctx, block);

  return { type: 18, label, description: "", component };
}

function convertTop(block, ctx) {
  switch (block.type) {
    case "modalc_label":
      return convertLabel(block, ctx);

    case "modalc_textDisplay":
      return { type: 10, content: resolveText(block, "content") };

    case "modal_add_text_input":
      return convertLegacyTextInput(block, ctx, false);

    case "modal_add_text_input_advanced":
      return convertLegacyTextInput(block, ctx, true);

    default:
      note(
        ctx,
        "info",
        `DisFuse can't preview “${block.toString(40)}”, so it isn't shown.`,
      );
      return null;
  }
}

/* ---- Where the modal is shown from -------------------------------------- */

function describeShow(show, ctx) {
  if (!show.isEnabled())
    note(
      ctx,
      "warn",
      "This “show modal” block is disabled, so the bot will skip it.",
    );

  const event = findEvent(show);

  if (event?.type === "modal_handle_interaction")
    note(
      ctx,
      "warn",
      "This block is under “when a modal is submitted”. Discord can't open a modal in answer to another modal, so this one will never appear.",
    );
  else if (!event)
    note(
      ctx,
      "info",
      "This block isn't inside an interaction event yet. Modals open in answer to a slash command, context menu, button or select menu.",
    );

  const answered = respondedBefore(show);
  if (answered)
    note(
      ctx,
      "warn",
      `“${blockName(answered)}” runs above this block and answers the interaction first. Discord only accepts a modal as the first response, so it won't open.`,
    );

  return event ? MODAL_EVENTS[event.type] : null;
}

/* ---- The modal ---------------------------------------------------------- */

/**
 * @param {object} block a "show modal" or "create modal" block
 * @returns {null | {
 *   blockId: string, title: string, customId: string,
 *   context: string | null, source: string | null,
 *   empty: string | null, components: Array<object>,
 *   notes: Array<{level: string, text: string}>, componentCount: number
 * }}
 */
export default function buildModal(block) {
  if (block?.type !== SHOW_BLOCK && block?.type !== CREATE_BLOCK) return null;

  const ctx = { notes: [], customIds: new Set() };

  let create = block;
  let context = null;
  let source = null;

  if (block.type === SHOW_BLOCK) {
    context = describeShow(block, ctx);

    const resolved = resolveCreateBlock(block);
    create = resolved.create;

    if (resolved.variable) {
      source = `from the variable “${resolved.variable}”`;

      if (resolved.ambiguous)
        note(
          ctx,
          "info",
          `“${resolved.variable}” is given a modal in more than one place. This is the first one found.`,
        );
    }

    if (!usable(create)) {
      const plugged = block.getInputTargetBlock("modal");

      let empty =
        "Plug a “create modal” block into this block to see what it will show.";

      if (resolved.variable)
        empty = `Couldn't find a “create modal” block stored in “${resolved.variable}”. Set the variable to one to preview it.`;
      else if (plugged && plugged.type !== CREATE_BLOCK)
        empty = `The modal comes from “${plugged.toString(40)}”, which is only known once the bot runs.`;

      return {
        blockId: block.id,
        title: "",
        customId: "",
        context,
        source,
        empty,
        components: [],
        notes: ctx.notes,
        componentCount: 0,
      };
    }
  } else {
    const holder = block.getParent();

    if (holder?.type === "variables_set")
      source = `stored in “${holder.getField("VAR")?.getText() || "a variable"}”`;
    else if (!holder)
      note(
        ctx,
        "info",
        "Nothing shows this modal yet. Plug it into a “show modal” block to open it.",
      );
  }

  const title = resolveText(create, "title");
  const customId = toDisplay(resolveText(create, "customId"));

  const titleLength = knownLength(title);
  if (!title.trim())
    note(ctx, "warn", "This modal has no title, and Discord requires one.");
  else if (titleLength !== null && titleLength > LIMITS.title)
    note(
      ctx,
      "warn",
      `The title is ${titleLength} characters. Discord allows ${LIMITS.title}, and won't open the modal.`,
    );

  if (!customId.trim())
    note(
      ctx,
      "warn",
      "This modal has no custom ID. Your bot uses it to tell which modal was submitted.",
    );

  const components = statementChain(create, "components")
    .map((child) => convertTop(child, ctx))
    .filter(Boolean);

  if (!components.length)
    note(
      ctx,
      "warn",
      "This modal has no components yet. Add a label with a text input to get started.",
    );
  else if (components.length > LIMITS.components)
    note(
      ctx,
      "warn",
      `This modal has ${components.length} components. Discord allows ${LIMITS.components}, and won't open it.`,
    );

  return {
    blockId: block.id,
    title,
    customId,
    context,
    source,
    empty: null,
    components,
    notes: ctx.notes,
    componentCount: components.length,
  };
}
