/* =====================================================================
   DisFuse Builder: form builder → a discord.js modal
   ---------------------------------------------------------------------
   A form (Discord calls it a modal) built in the form builder is saved as:

     ModalSpec {
       inputs: { title: InputValue, customId: InputValue }
       components: Component[]   labels and text blocks, in order
     }

   `type` on each component is the id of something defined with
   defineComponent({ family: "modal" }) in the catalog. This file wraps
   them in a ModalBuilder the same way the block editor's "create modal"
   block does.
   ===================================================================== */

import { input } from "../catalog/define.js";

/** The form's own settings, shared with the form builder UI. */
export const MODAL_FIELDS = [
  input.text("title", "Title", { maxLength: 45, placeholder: "Tell us about yourself" }),
  input.text("customId", "Form ID", {
    maxLength: 100,
    placeholder: "my-form",
    help: "Used to tell which form was submitted, in \"When a form is submitted\".",
  }),
];

/**
 * @param {import("./context.js").Generator} gen
 * @param {object} spec  the saved ModalSpec
 * @param {object} scope
 * @param {object} [options]
 * @returns {string} an expression
 */
export function modalCode(gen, spec, scope, options = {}) {
  const where = options.where ?? "form";
  const ctx = gen.makeCtx({ label: "form" }, MODAL_FIELDS, spec ?? {}, scope, where);

  const components = (spec?.components ?? [])
    .map((component) => gen.componentCode(component, scope, where))
    .filter(Boolean);

  if (!components.length)
    gen.issue(where, "This form is empty. Add at least one question to it in the form builder.");

  return `new Discord.ModalBuilder()
  .setTitle(${ctx.input("title")})
  .setCustomId(${ctx.input("customId")})
  .addComponents(
${components.join(",\n")}
  )`;
}
