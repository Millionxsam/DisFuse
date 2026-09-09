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

const COMPONENTS_V2_SLIDES = [
  {
    title: "Introducing Components V2",
    confirmButtonText: "Next →",
    showCancelButton: false,
    text: "Components V2 is here! Components V2 is a new components system by Discord that allows for more flexibility for message components. You can now have components (buttons, menus, images) in the middle of your messages mixed with text.",
  },
  {
    title: "What's new?",
    confirmButtonText: "Next →",
    cancelButtonText: "← Back",
    text: 'The biggest change is that sending messages is now fully components-based. There is no more "content" or "embeds". You can instead use the "text display" component for text, "containers" for embeds, and other new components. These components are in the new "Components" category.',
  },
  {
    title: "Existing Projects",
    confirmButtonText: "Next →",
    cancelButtonText: "← Back",
    text: "Projects that are already using the old system are not changed. The existing blocks are still in your workspace, but you cannot add the old blocks to your workspace anymore because they have been removed from the toolbox (the categories on the left).",
  },
  {
    title: "Learn more",
    confirmButtonText: "Done",
    cancelButtonText: "← Back",
    html: "We understand this is a huge change and it might be confusing if you were already used to the old system. To learn more about how to use the new system, we encourage you to read our <a href='https://docs.disfuse.xyz/docs/Guide/componentsV2' target='_blank' rel='noopener noreferrer'>new detailed guide</a> that shows how to use all the new components in Components V2. You can also join our <a href='https://dsc.gg/disfuse' target='_blank' rel='noopener noreferrer'>Discord server</a> and post in the support channel if you need help with this new system.",
  },
];

/** The Components V2 walkthrough, which can be stepped back through. */
export async function showComponentsV2Onboarding(modalColors) {
  if (localStorage.getItem("componentsV2Onboarding") === "true") return;

  const step = Swal.mixin({
    progressSteps: ["1", "2", "3", "4"],
    animation: false,
    icon: "info",
    allowEscapeKey: false,
    allowOutsideClick: false,
    footer: "You may ignore this if you are new to DisFuse",
    showCancelButton: true,
    reverseButtons: true,
    ...modalColors,
  });

  let current = 0;
  let started = false;

  while (current >= 0 && current < COMPONENTS_V2_SLIDES.length) {
    const result = await step.fire({
      currentProgressStep: current,
      ...COMPONENTS_V2_SLIDES[current],
      animation: !started,
    });

    started = true;

    if (result.isConfirmed) current++;
    else if (result.dismiss === Swal.DismissReason.cancel) {
      if (current === 0) break;
      current--;
    } else break;
  }

  localStorage.setItem("componentsV2Onboarding", "true");
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
