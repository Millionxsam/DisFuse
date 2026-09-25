import Swal from "sweetalert2";

import api, { data, errorMessage } from "../../api/client.js";
import { createTemplate } from "../../api/templates.js";
import { userCache } from "../../cache.ts";

/* =====================================================================
   Template dialogs
   ---------------------------------------------------------------------
   The questions every place that handles templates asks — the gallery,
   a template's page, the builder and the editor — so each is worded and
   validated once.

   All of them are SweetAlert, which renders *under* a `<dialog>` opened
   with showModal(). Anything that calls these from inside a
   WorkspaceModal has to close it first, the way Version Control does.
   ===================================================================== */

/** Must match templateLimits in the API's config.js. */
export const TEMPLATE_LIMITS = {
  minNameLength: 3,
  maxNameLength: 50,
  maxDescriptionLength: 2000,
};

export function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * Name, description and visibility, in one form.
 *
 * Public is the default for a new template: the whole point of one is
 * that other people can use it.
 *
 * @param {object} options
 * @param {string} options.title
 * @param {string} options.confirmButtonText
 * @param {{name?: string, description?: string, private?: boolean}} [options.initial]
 * @param {string} [options.intro]   a line above the form
 * @param {object} [options.modalColors]
 * @param {boolean} [options.showDelete]  adds a Delete button — the
 *   result's `action` is "delete" when it's pressed
 * @param {() => any} [options.onConfirm]  runs inside the click that
 *   confirms the form, once it is valid; what it returns comes back as
 *   `confirmed`. For the one thing a browser only allows during a click:
 *   opening a tab.
 * @returns {Promise<null | {action: "save"|"delete", name?: string, description?: string, private?: boolean, confirmed?: any}>}
 */
export async function askForTemplateDetails({
  title,
  confirmButtonText,
  initial = {},
  intro,
  modalColors = {},
  showDelete = false,
  onConfirm,
}) {
  const isPrivate = Boolean(initial.private);

  const result = await Swal.fire({
    title,
    html: `
      <div class="df-template-form">
        ${intro ? `<p class="df-template-form-intro">${intro}</p>` : ""}
        <label for="df-template-name">Name</label>
        <input id="df-template-name" type="text" maxlength="${TEMPLATE_LIMITS.maxNameLength}"
          placeholder="e.g. Welcome messages" value="${escapeHtml(initial.name ?? "")}" />
        <label for="df-template-description">Description</label>
        <textarea id="df-template-description" rows="5" maxlength="${TEMPLATE_LIMITS.maxDescriptionLength}"
          placeholder="What does it do, and how do people use it? You can use Markdown to format this text.">${escapeHtml(
            initial.description ?? "",
          )}</textarea>
        <fieldset class="df-template-visibility">
          <legend>Who can see it</legend>
          <label>
            <input type="radio" name="df-template-visibility" value="public"${isPrivate ? "" : " checked"} />
            <span><strong><i class="fa-solid fa-earth-americas"></i> Public</strong>
            Anyone can find it, like it and add it to their projects once you publish it.</span>
          </label>
          <label>
            <input type="radio" name="df-template-visibility" value="private"${isPrivate ? " checked" : ""} />
            <span><strong><i class="fa-solid fa-lock"></i> Private</strong>
            Only you can see it and add it to your projects.</span>
          </label>
        </fieldset>
      </div>`,
    focusConfirm: false,
    showCancelButton: true,
    showDenyButton: showDelete,
    denyButtonText: "Delete template",
    confirmButtonText,
    customClass: {
      ...(modalColors.customClass ?? {}),
      popup: "df-template-dialog",
    },
    background: modalColors.background,
    color: modalColors.color,
    didOpen: () => document.getElementById("df-template-name")?.focus(),
    preConfirm: () => {
      const name = document.getElementById("df-template-name").value.trim();
      const description = document
        .getElementById("df-template-description")
        .value.trim();
      const visibility = document.querySelector(
        'input[name="df-template-visibility"]:checked',
      )?.value;

      if (name.length < TEMPLATE_LIMITS.minNameLength) {
        Swal.showValidationMessage(
          `The name must be at least ${TEMPLATE_LIMITS.minNameLength} characters long`,
        );
        return false;
      }

      return {
        name,
        description,
        private: visibility === "private",
        confirmed: onConfirm?.(),
      };
    },
  });

  if (result.isDenied) return { action: "delete" };
  if (!result.isConfirmed) return null;

  return { action: "save", ...result.value };
}

/**
 * Opens a template's builder.
 *
 * From the editor it opens in a new tab, so nobody loses their place in
 * the project they were working on. A browser only allows that while it
 * is still handling a click — Safari only during the click handler
 * itself — and the template doesn't exist until a request later. So the
 * tab is opened blank inside the click that confirms the form, and
 * pointed at the builder once there is one to point at. Where the tab
 * was blocked anyway, the builder opens in this one.
 */
export function reserveBuilderTab() {
  const tab = window.open("", "_blank");

  return {
    go(templateId) {
      const url = `/templates/${templateId}/builder`;
      if (tab && !tab.closed) tab.location.href = url;
      else window.location.href = url;
    },
    cancel() {
      if (tab && !tab.closed) tab.close();
    },
  };
}

/**
 * The whole "create a template" flow: ask, create, open the builder.
 *
 * @param {object} options
 * @param {"here"|"new-tab"} [options.openIn]
 * @param {string} [options.draft]   blocks to start with ("Save as template")
 * @param {string} [options.initialName]
 * @param {string} [options.intro]
 * @param {(path: string) => void} [options.navigate]  for "here"
 * @returns {Promise<object|null>} the new template
 */
export async function createTemplateFlow({
  openIn = "here",
  draft,
  initialName = "",
  intro,
  navigate,
  modalColors = {},
}) {
  const details = await askForTemplateDetails({
    title: draft ? "Save as Template" : "Create a Template",
    confirmButtonText: "Create and start building",
    initial: { name: initialName },
    intro:
      intro ??
      "You'll build it in its own workspace. Nobody else can see it until you publish it.",
    modalColors,
    onConfirm: openIn === "new-tab" ? reserveBuilderTab : undefined,
  });

  if (!details) return null;

  const tab = details.confirmed ?? null;

  try {
    const template = await createTemplate({
      name: details.name,
      description: details.description,
      private: details.private,
      ...(draft ? { draft } : {}),
    });

    if (tab) tab.go(template._id);
    else if (navigate) navigate(`/templates/${template._id}/builder`);
    else window.location.href = `/templates/${template._id}/builder`;

    return template;
  } catch (error) {
    tab?.cancel();

    await Swal.fire({
      title: "Couldn't create that template",
      text: errorMessage(error, "Please try again."),
      icon: "error",
      ...modalColors,
    });

    return null;
  }
}

/** Asks before deleting. Imported copies are unaffected, which is worth saying. */
export async function confirmDeleteTemplate(template, modalColors = {}) {
  const result = await Swal.fire({
    title: "Delete this template?",
    html: `<b>${escapeHtml(template.name)}</b> will be deleted, along with its likes and comments.<br /><br />Projects that already added it will keep their copy of the blocks.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Delete",
    confirmButtonColor: "#d33",
    ...modalColors,
  });

  return result.isConfirmed;
}

export async function confirmUnpublishTemplate(template, modalColors = {}) {
  const result = await Swal.fire({
    title: "Unpublish this template?",
    html: `<b>${escapeHtml(template.name)}</b> will be removed from the Templates page, and nobody will be able to add it to a project. Your blocks stay saved, so you can publish it again anytime.<br /><br />Projects that already added it will keep their copy of the blocks.`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Unpublish",
    ...modalColors,
  });

  return result.isConfirmed;
}

/**
 * "Use in a project", from outside the editor: which project?
 *
 * Every project the user can edit — their own and the ones they
 * collaborate on. Importing happens in the editor, so this only picks;
 * the caller opens the project with the template waiting.
 *
 * @returns {Promise<object|null>} the chosen project
 */
export async function pickProjectForTemplate(template, modalColors = {}) {
  const user = userCache.user;

  let projects = [];
  try {
    projects = await api.get(`/users/${user.id}/projects`).then(data);
  } catch (error) {
    await Swal.fire({
      title: "Couldn't load your projects",
      text: errorMessage(error, "Please try again."),
      icon: "error",
      ...modalColors,
    });
    return null;
  }

  const editable = projects
    .filter(
      (project) =>
        project.owner?.id === user.id ||
        (project.collaborators ?? []).includes(user.id),
    )
    .filter((project) => !project.suspension?.status);

  if (!editable.length) {
    await Swal.fire({
      title: "No projects yet",
      text: "Create a project first, then come back to add this template to it.",
      icon: "info",
      confirmButtonText: "OK",
      ...modalColors,
    });
    return null;
  }

  const result = await Swal.fire({
    title: "Which project do you want to add it to?",
    html: `We'll open the project with <b>${escapeHtml(
      template.name,
    )}</b> ready to add. You'll pick where its blocks go.`,
    input: "select",
    /* SweetAlert parses option labels as HTML, and project names are
       whatever their owners typed. */
    inputOptions: Object.fromEntries(
      editable.map((project) => [
        project._id,
        escapeHtml(
          project.owner?.id === user.id
            ? project.name
            : `${project.name} (${project.owner?.username ?? "shared"})`,
        ),
      ]),
    ),
    showCancelButton: true,
    confirmButtonText: "Open project",
    ...modalColors,
  });

  if (!result.isConfirmed) return null;

  return (
    editable.find((project) => String(project._id) === result.value) ?? null
  );
}

/** Where the editor opens a project with a template waiting to be imported. */
export function projectUrlWithTemplate(project, templateId) {
  return `/@${project.owner?.username}/${project._id}/workspace?template=${templateId}`;
}
