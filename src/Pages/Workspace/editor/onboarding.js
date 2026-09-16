import Swal from "sweetalert2";

/* =====================================================================
   One-off explanations
   ---------------------------------------------------------------------
   The three walkthroughs the editor shows once and then never again,
   each remembered in localStorage. They were three hundred lines of
   inline SweetAlert calls in the middle of the project-loading flow,
   which made that flow very hard to read for something that runs once
   in a user's lifetime.
   ===================================================================== */

const SUB_WORKSPACES_SLIDES = [
  {
    title: "Set Up Sub-Workspaces",
    text: "Sub-workspaces are here! You can now create multiple workspaces in a single project to organize your code better.",
  },
  {
    title: "How it works",
    text: "Use the new tab bar at the top to create a new workspace or switch between workspaces. Each workspace can contain different blocks.",
  },
  {
    title: "Extra Features",
    text: 'Right-click a block and click "Move to workspace" to move it to a different workspace. Right click anywhere in the view and click "Merge workspace" to merge two workspaces together.',
  },
];

/**
 * The migration prompt for a project still holding its blocks in the old
 * single-workspace field.
 *
 * @returns {Promise<string|null>} the name for the first workspace, or
 *   null if the user backed out
 */
export async function askToMigrateToSubWorkspaces(modalColors) {
  const step = Swal.mixin({
    progressSteps: ["1", "2", "3", "4"],
    confirmButtonText: "Next",
    allowEscapeKey: false,
    allowOutsideClick: false,
    animation: false,
    footer:
      "This project needs to be migrated to sub-workspaces. This won't show for new projects.",
    ...modalColors,
  });

  for (const [index, slide] of SUB_WORKSPACES_SLIDES.entries())
    await step.fire({ ...slide, currentProgressStep: index });

  const { value } = await step.fire({
    title: "Name your workspace",
    currentProgressStep: 3,
    text: "Enter a name for your first workspace. Your current project data will be moved to the new workspace. You can create more workspaces and move blocks to them later.",
    input: "text",
    inputPlaceholder: "My workspace",
    inputValidator: (name) =>
      name?.length >= 3 ? false : "The name must be at least 3 characters",
  });

  return value ?? null;
}

/**
 * Asks for the name of a project's — or a version's — first workspace.
 *
 * @returns {Promise<string|null>}
 */
export async function askForFirstWorkspaceName(versionName, modalColors) {
  const { value } = await Swal.fire({
    title: versionName
      ? `Name the first workspace in ${versionName}`
      : "Name your first workspace",
    text: "Create multiple workspaces to organize your blocks into separate tabs",
    input: "text",
    inputValidator: (name) =>
      name?.length >= 3 ? undefined : "Name needs at least 3 characters",
    inputPlaceholder: "Initial workspace",
    showCancelButton: false,
    allowEscapeKey: false,
    confirmButtonText: "Create",
    allowOutsideClick: false,
    ...modalColors,
  });

  return value ?? null;
}

/** The welcome links, shown once to a brand new user. */
export async function showWelcome(modalColors) {
  if (localStorage.getItem("isNew") === "true") return;

  await Swal.fire({
    title: "New to DisFuse?",
    html: `
      <p>Welcome! Here are some useful links to help you use DisFuse:</p>
      <a href="https://docs.disfuse.xyz" target="_blank" rel="noopener noreferrer">📘 DisFuse Documentation</a><br>
      <a href="https://www.youtube.com/watch?v=OOrapVifGoE" target="_blank" rel="noopener noreferrer">▶️ DisFuse's YouTube Channel</a><br>
      <a href="https://discord.gg/Xwx4zkQcmJ" target="_blank" rel="noopener noreferrer">💬 Join the Discord Server</a>`,
    ...modalColors,
  });

  localStorage.setItem("isNew", "true");
}
