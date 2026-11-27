/* =====================================================================
   DisFuse Builder: message builder → discord.js options
   ---------------------------------------------------------------------
   A message built in the message builder is saved as:

     MessageSpec {
       components: Component[]     top-level pieces, in order
       files?: FileItem[]          attachments the message carries
     }
     Component { id, type, inputs: { [key]: InputValue }, children?: Component[] }
     FileItem  { id, inputs: { source: InputValue, name: InputValue, spoiler? } }

   `type` is the id of a component defined with defineComponent({ family:
   "message" }) in the catalog; each one knows how to write its own
   discord.js builder expression. This file only assembles the pieces
   into the object `channel.send()` / `interaction.reply()` take.

   Every message is a Components V2 message, the same as every message
   the block editor sends.
   ===================================================================== */

import { input } from "../catalog/define.js";

/** The fields of one attached file, shared with the message builder UI. */
export const FILE_FIELDS = [
  /* File data (a captcha or canvas picture) goes in as it is; anything
     else is a link or a path. */
  input.text("source", "File link or path", {
    placeholder: "https://example.com/picture.png",
    accepts: ["String", "buffer"],
    help: "A link, a file path, or file data from a step like Make a captcha.",
  }),
  input.text("name", "File name", { placeholder: "picture.png" }),
  input.boolean("spoiler", "Hide as spoiler"),
];

/**
 * @param {import("./context.js").Generator} gen
 * @param {object} spec  the saved MessageSpec
 * @param {object} scope
 * @param {object} [options]
 * @param {string} [options.ephemeral]  code for "only the user can see it"
 *   (interaction replies only)
 * @param {boolean} [options.edit]  for edits: leave out the flags Discord
 *   refuses to change on an existing message
 * @returns {string} an object expression
 */
/** Which pings a message lets notify, when the message builder doesn't say. */
export const DEFAULT_PINGS = { users: true, roles: false, everyone: false };

/**
 * The `allowedMentions` option for a message: who its pings notify.
 * Only users by default, so a bot that repeats what someone typed can't
 * be used to ping a role or @everyone.
 */
export function allowedMentionsCode(pings = DEFAULT_PINGS) {
  const picked = { ...DEFAULT_PINGS, ...(pings ?? {}) };
  const parse = ["users", "roles", "everyone"].filter((key) => picked[key]).map((key) => `"${key}"`);
  return `allowedMentions: { parse: [${parse.join(", ")}] }`;
}

export function messageCode(gen, spec, scope, options = {}) {
  const where = options.where ?? "message";
  const components = (spec?.components ?? [])
    .map((component) => gen.componentCode(component, scope, where))
    .filter(Boolean);

  if (!components.length)
    gen.issue(where, "This message is empty. Add something to it in the message builder.");

  const files = (spec?.files ?? []).map((file, index) => {
    const ctx = gen.makeCtx(
      { label: `file ${index + 1}` },
      FILE_FIELDS,
      file,
      scope,
      where,
    );
    const spoiler = ctx.raw("spoiler") === true;
    const name = ctx.has("name") ? ctx.input("name") : `"file${index + 1}"`;
    const finalName = spoiler ? `"SPOILER_" + ${name}` : name;
    return `new Discord.AttachmentBuilder(${ctx.input("source")}, { name: ${finalName} })`;
  });

  let flags = "Discord.MessageFlags.IsComponentsV2";
  if (options.ephemeral && options.ephemeral !== "false")
    flags += options.ephemeral === "true"
      ? " | Discord.MessageFlags.Ephemeral"
      : ` | (${options.ephemeral} ? Discord.MessageFlags.Ephemeral : 0)`;

  const parts = [`components: [\n${components.join(",\n")}\n]`];
  if (files.length) parts.push(`files: [${files.join(", ")}]`);
  parts.push(allowedMentionsCode(spec?.pings));
  parts.push(`flags: ${flags}`);

  return `{\n${parts.join(",\n")}\n}`;
}
