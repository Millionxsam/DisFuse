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

/**
 * The two ways to make a template, matching the two editors a project
 * can be built with. Which one only decides how the template is built:
 * every template can be added to every project, and is converted on the
 * way in when the project uses the other editor
 * (Pages/Workspace/editor/templateConversion.js). It can't change once
 * the template is made.
 */
export const TEMPLATE_TYPES = {
  blocks: {
    label: "Build it with blocks",
    editor: "Block Editor",
    icon: "fa-solid fa-puzzle-piece",
    description: "Make it in the Block Editor, with blocks.",
  },
  builder: {
    label: "Build it with DisFuse Builder",
    editor: "DisFuse Builder",
    icon: "fa-solid fa-wand-magic-sparkles",
    description: "Make it in DisFuse Builder, with commands and events.",
  },
};

/** Templates from before there were two kinds have no type: they're block templates. */
export function templateType(template) {
  return template?.type === "builder" ? "builder" : "blocks";
}

/** A project's editor, in the same words. */
export function projectType(project) {
  return project?.type === "builder" ? "builder" : "blocks";
}

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
 * @param {boolean} [options.chooseType]  asks which kind of template it
 *   is (creating one); the result has `type`
 * @param {boolean} [options.showDelete]  adds a Delete button — the
 *   result's `action` is "delete" when it's pressed
 * @param {() => any} [options.onConfirm]  runs inside the click that
 *   confirms the form, once it is valid; what it returns comes back as
 *   `confirmed`. For the one thing a browser only allows during a click:
 *   opening a tab.
 * @returns {Promise<null | {action: "save"|"delete", name?: string, description?: string, private?: boolean, type?: "blocks"|"builder", confirmed?: any}>}
 */
export async function askForTemplateDetails({
  title,
  confirmButtonText,
  initial = {},
  intro,
  modalColors = {},
  chooseType = false,
  showDelete = false,
  onConfirm,
}) {
  const isPrivate = Boolean(initial.private);

  /* Nothing is picked for the user: it can't be changed afterwards. */
  const typeChooser = chooseType
    ? `
        <fieldset class="df-template-types">
          <legend>How do you want to build it?</legend>
          ${Object.entries(TEMPLATE_TYPES)
            .map(
              ([value, type]) => `
          <label class="df-template-type df-template-type-${value}">
            <input type="radio" name="df-template-type" value="${value}" />
            <span class="df-template-type-icon"><i class="${type.icon}"></i></span>
            <span><strong>${type.label}</strong>${type.description}</span>
          </label>`,
            )
            .join("")}
          <p class="df-template-types-note"><i class="fa-solid fa-circle-info"></i> This only changes how you build it. Anyone can add it to any project, whether it uses the Block Editor or DisFuse Builder. You can't change this later.</p>
        </fieldset>`
    : "";

  const result = await Swal.fire({
    title,
    html: `
      <div class="df-template-form">
        ${intro ? `<p class="df-template-form-intro">${intro}</p>` : ""}
        ${typeChooser}
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
      const type = document.querySelector(
        'input[name="df-template-type"]:checked',
      )?.value;

      if (chooseType && !type) {
        Swal.showValidationMessage("Pick how you want to build it");
        return false;
      }

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
        ...(chooseType ? { type } : {}),
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
 * @param {string} [options.draft]   blocks to start with ("Save as template");
 *   always a block template. Without one, the person picks which kind.
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
    chooseType: !draft,
    onConfirm: openIn === "new-tab" ? reserveBuilderTab : undefined,
  });

  if (!details) return null;

  const tab = details.confirmed ?? null;

  try {
    const template = await createTemplate({
      name: details.name,
      description: details.description,
      private: details.private,
      type: draft ? "blocks" : details.type,
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
    html: `<b>${escapeHtml(template.name)}</b> will be deleted, along with its likes and comments.<br /><br />Projects that already added it will keep their copy of ${
      templateType(template) === "builder" ? "its commands and events" : "the blocks"
    }.`,
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
    html: `<b>${escapeHtml(template.name)}</b> will be removed from the Templates page, and nobody will be able to add it to a project. Your work stays saved, so you can publish it again anytime.<br /><br />Projects that already added it will keep their copy of ${
      templateType(template) === "builder" ? "its commands and events" : "the blocks"
    }.`,
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
 * collaborate on — whichever editor it uses: a template made with the
 * other one is converted when it's imported. Importing happens in the
 * editor, so this only picks; the caller opens the project with the
 * template waiting.
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
  const kind = templateType(template);

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

  const otherEditor = editable.some((project) => projectType(project) !== kind);

  const result = await Swal.fire({
    title: "Which project do you want to add it to?",
    html: `We'll open the project with <b>${escapeHtml(template.name)}</b> ready to add.${
      otherEditor
        ? `<p class="df-template-picker-note">It works in every project. It was made with ${escapeHtml(
            TEMPLATE_TYPES[kind].editor,
          )}, so in a project that uses the ${
            kind === "builder" ? "Block Editor it becomes blocks" : "DisFuse Builder it becomes commands and events"
          } when you add it.</p>`
        : ""
    }`,
    input: "select",
    /* SweetAlert parses option labels as HTML, and project names are
       whatever their owners typed. */
    inputOptions: Object.fromEntries(
      editable.map((project) => [
        project._id,
        escapeHtml(
          `${
            project.owner?.id === user.id
              ? project.name
              : `${project.name} (${project.owner?.username ?? "shared"})`
          } · ${TEMPLATE_TYPES[projectType(project)].editor}`,
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
