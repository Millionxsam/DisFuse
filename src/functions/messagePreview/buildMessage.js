import { SEND_BLOCKS } from "./sendBlocks.js";
import {
  literalOnly,
  parseEmoji,
  placeholderImage,
  resolveBoolean,
  resolveColour,
  resolveText,
  toDisplay,
} from "./values.js";

/* =====================================================================
   Blocks → the message Discord would receive
   ---------------------------------------------------------------------
   The output of this file is a message object in the shape the Discord
   API actually delivers — numeric component types, `accent_color`,
   `media.url`, `attachment://` references — and not an invented one.

   That is the whole trick. DisFuse already has a faithful renderer for
   that shape, written for the Control client, and pointing it at this
   means the preview is drawn by the same code that draws real messages
   from real bots. A preview built on its own private format would drift
   away from Discord the first time either side changed.

   Everything here mirrors what the JavaScript generators in
   `src/blocks/componentsV2.js` emit, field for field. A preview that
   shows more than the bot will actually send is worse than no preview,
   so when the two disagree the generator is the one that is right —
   and if the generator is the one that is wrong, it gets fixed rather
   than worked around here.
   ===================================================================== */

/** The flag that makes a message a Components V2 message. */
export const IS_COMPONENTS_V2 = 1 << 15;

/* Discord's published limits, checked so the editor can say so before
   the bot hits a 400 at runtime. */
const LIMITS = {
  totalComponents: 40,
  textDisplay: 4000,
  galleryItems: 10,
  buttonsPerRow: 5,
};

/** The dropdown on the section blocks, in Discord's own numbering. */
const BUTTON_STYLES = {
  Primary: 1,
  Secondary: 2,
  Success: 3,
  Danger: 4,
  Link: 5,
};

/** Select menu blocks, and the component type each one becomes. */
const SELECT_TYPES = {
  menus_add: 3,
  menus_addUserMenu: 5,
  menus_addRoleMenu: 6,
  menus_addMentionableMenu: 7,
  menus_addChannelMenu: 8,
};

/* ---- Walking the blocks ------------------------------------------------ */

/** Every block in a statement input, in order, skipping disabled ones. */
function statementChain(block, inputName) {
  if (!block?.getInput?.(inputName)) return [];

  const out = [];
  let current = block.getInputTargetBlock(inputName);

  while (current) {
    if (current.isEnabled() && !current.isInsertionMarker()) out.push(current);
    current = current.getNextBlock();
  }

  return out;
}

function walk(block, inputName, ctx, depth) {
  const out = [];

  for (const child of statementChain(block, inputName)) {
    const node = convert(child, ctx, depth);
    if (node) out.push(node);
  }

  return out;
}

function note(ctx, level, text) {
  if (ctx.notes.some((existing) => existing.text === text)) return;
  ctx.notes.push({ level, text });
}

/* ---- One block --------------------------------------------------------- */

function convert(block, ctx, depth) {
  /* Blocks can't nest this deeply through the toolbox's type checks, but
     a hand-edited or imported project is not obliged to be sane. */
  if (depth > 8) return null;

  ctx.total += 1;

  switch (block.type) {
    case "cv2_textDisplay": {
      const content = resolveText(block, "content");

      if (content.length > LIMITS.textDisplay)
        note(
          ctx,
          "warn",
          `A text display is ${content.length} characters. Discord allows ${LIMITS.textDisplay}.`,
        );

      return { type: 10, content };
    }

    case "cv2_separator":
      return {
        type: 14,
        divider: block.getFieldValue("divider") === "TRUE",
        spacing: block.getFieldValue("spacing") === "Large" ? 2 : 1,
      };

    case "cv2_section_thumbnail": {
      const url = literalOnly(resolveText(block, "thumbnailUrl"));
      const alt = toDisplay(resolveText(block, "thumbnailAlt"));

      ctx.total += 2; // the text display and the thumbnail

      return {
        type: 9,
        components: [{ type: 10, content: resolveText(block, "text") }],
        accessory: {
          type: 11,
          media: { url: url || placeholderImage(alt || "thumbnail") },
          description: alt,
        },
      };
    }

    case "cv2_section_button": {
      const style = BUTTON_STYLES[block.getFieldValue("style")] ?? 1;
      const link = style === 5;
      const emoji = parseEmoji(resolveText(block, "buttonEmoji"));

      ctx.total += 2; // the text display and the button

      return {
        type: 9,
        components: [{ type: 10, content: resolveText(block, "text") }],
        accessory: {
          type: 2,
          style,
          label: toDisplay(resolveText(block, "buttonLabel")),
          ...(emoji ? { emoji } : {}),
          ...(link
            ? { url: literalOnly(resolveText(block, "url")) || undefined }
            : { custom_id: toDisplay(resolveText(block, "buttonId")) }),
        },
      };
    }

    case "cv2_mediaGallery": {
      const items = statementChain(block, "items")
        .filter((item) => item.type === "cv2_mediaGalleryItem")
        .map((item) => {
          const url = literalOnly(resolveText(item, "url"));
          const description = toDisplay(resolveText(item, "alt"));

          return {
            media: { url: url || placeholderImage(description || "image") },
            description,
            spoiler: item.getFieldValue("spoiler") === "TRUE",
          };
        });

      if (!items.length)
        note(ctx, "warn", "A media gallery needs at least one image.");
      else if (items.length > LIMITS.galleryItems)
        note(
          ctx,
          "warn",
          `A media gallery holds ${LIMITS.galleryItems} images at most; this one has ${items.length}.`,
        );

      return { type: 12, items };
    }

    case "cv2_container":
      return {
        type: 17,
        accent_color: resolveColour(block, "color"),
        components: walk(block, "components", ctx, depth + 1),
      };

    case "cv2_file": {
      const filename = toDisplay(resolveText(block, "file"));

      if (filename && !ctx.attachments.some((a) => a.filename === filename))
        note(
          ctx,
          "warn",
          `No file called “${filename}” is attached to this message, so it won't show.`,
        );

      return {
        type: 13,
        file: { url: `attachment://${filename}` },
        spoiler: block.getFieldValue("spoiler") === "TRUE",
      };
    }

    case "misc_addrow": {
      const components = walk(block, "components", ctx, depth + 1);
      const buttons = components.filter((child) => child.type === 2).length;
      const selects = components.length - buttons;

      if (buttons > LIMITS.buttonsPerRow)
        note(
          ctx,
          "warn",
          `An interactive row holds ${LIMITS.buttonsPerRow} buttons at most; this one has ${buttons}.`,
        );

      if (selects && buttons)
        note(
          ctx,
          "warn",
          "An interactive row holds either buttons or one menu, never both.",
        );
      else if (selects > 1)
        note(ctx, "warn", "An interactive row holds only one menu.");

      return { type: 1, components };
    }

    case "buttons_add": {
      const style = Number(block.getFieldValue("style")) || 1;
      const link = style === 5;
      const emoji = parseEmoji(resolveText(block, "emoji"));

      return {
        type: 2,
        style,
        label: toDisplay(resolveText(block, "label")),
        disabled: resolveBoolean(block, "disabled") === true,
        ...(emoji ? { emoji } : {}),
        ...(link
          ? { url: literalOnly(resolveText(block, "url")) || undefined }
          : { custom_id: toDisplay(resolveText(block, "id")) }),
      };
    }

    default: {
      const selectType = SELECT_TYPES[block.type];

      if (selectType)
        return {
          type: selectType,
          custom_id: toDisplay(resolveText(block, "id")),
          placeholder: toDisplay(resolveText(block, "placeholder")),
          disabled: resolveBoolean(block, "disabled") === true,
          ...(selectType === 3 ? { options: readSelectOptions(block) } : {}),
        };

      /* A block pack, or a block from a category that has nothing to do
         with the message body. Counting it would be wrong too. */
      ctx.total -= 1;
      note(
        ctx,
        "info",
        `DisFuse can't preview “${block.toString(40)}”, so it isn't shown.`,
      );

      return null;
    }
  }
}

function readSelectOptions(block) {
  return statementChain(block, "options")
    .filter((option) => option.type === "menus_addoption")
    .map((option) => ({
      label: toDisplay(resolveText(option, "label")),
      description: toDisplay(resolveText(option, "dsc")),
      value: toDisplay(resolveText(option, "value")),
      default: resolveBoolean(option, "default") === true,
    }));
}

/* ---- Files ------------------------------------------------------------- */

/**
 * The uploads that go alongside the message.
 *
 * A V2 file or gallery item points at `attachment://name`, which the
 * renderer resolves against the message's attachment list — exactly the
 * way Discord does — so the "add file" blocks have to be read first.
 */
function collectAttachments(block) {
  return statementChain(block, "files")
    .filter((file) => file.type === "cv2_addFile")
    .map((file, index) => {
      const path = resolveText(file, "path");

      return {
        id: String(index),
        filename: toDisplay(resolveText(file, "name")) || `file-${index + 1}`,
        url: literalOnly(path) || undefined,
        size: 0,
      };
    });
}

/* ---- The message ------------------------------------------------------- */

/**
 * @param {object} block a block listed in SEND_BLOCKS
 * @returns {null | {
 *   blockId: string, type: string, title: string, icon: string,
 *   context: string | null, destination: string | null,
 *   ephemeral: boolean | null, message: object,
 *   notes: Array<{level: string, text: string}>, componentCount: number
 * }}
 */
export default function buildMessage(block) {
  const descriptor = SEND_BLOCKS[block?.type];
  if (!descriptor) return null;

  const attachments = collectAttachments(block);
  const ctx = { notes: [], attachments, total: 0 };

  const components = walk(block, "components", ctx, 0);

  if (!components.length)
    note(
      ctx,
      "info",
      "This message has no components yet. Add a text display to get started.",
    );

  if (ctx.total > LIMITS.totalComponents)
    note(
      ctx,
      "warn",
      `This message uses ${ctx.total} components. Discord allows ${LIMITS.totalComponents}.`,
    );

  if (descriptor.note) note(ctx, "info", descriptor.note);

  let destination = null;

  if (descriptor.target) {
    const resolved = toDisplay(resolveText(block, descriptor.target.input));

    destination = `${descriptor.target.preposition} ${
      resolved || descriptor.target.fallback
    }`;
  }

  return {
    blockId: block.id,
    type: block.type,
    title: descriptor.title,
    icon: descriptor.icon,
    context: descriptor.context ?? null,
    destination,
    ephemeral: descriptor.ephemeralInput
      ? resolveBoolean(block, descriptor.ephemeralInput)
      : null,
    componentCount: ctx.total,
    notes: ctx.notes,
    message: {
      id: `preview-${block.id}`,
      flags: IS_COMPONENTS_V2,
      content: "",
      components,
      attachments,
    },
  };
}
