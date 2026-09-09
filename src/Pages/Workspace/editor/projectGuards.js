import Swal from "sweetalert2";

/* =====================================================================
   Reasons a project can't be opened
   ---------------------------------------------------------------------
   Four conditions, each of which ends with the user somewhere other than
   the editor. They were three hundred lines threaded through the middle
   of the loading flow, which made that flow hard to follow for cases
   that end it.

   Each returns a destination, or null to carry on. The page navigates;
   nothing here touches the router, so the order these are checked in is
   visible in one place rather than implied by where the `return`s fell.
   ===================================================================== */

const SUPPORT_FOOTER =
  '<a href="https://discord.gg/Xwx4zkQcmJ" target="_blank" rel="noopener">Join our Discord for support</a>';

/**
 * @param {object} options
 * @param {object} options.project
 * @param {object} options.user
 * @param {boolean} options.isOwner
 * @param {object} options.modalColors
 * @returns {Promise<{to: string, replace?: boolean} | null>} where to send
 *   the user, or null if the project is fine to open
 */
export default async function checkProject({
  project,
  user,
  isOwner,
  modalColors,
}) {
  /* A suspension freezes the project. Its owner can still see it and
     still delete it, but nobody edits it. */
  if (project.suspension?.status) {
    await Swal.fire({
      ...modalColors,
      title: "Project Suspended",
      icon: "error",
      html:
        "This project was detected to be violating our terms of service. " +
        "Please join our Discord server if you think this is a mistake." +
        `<br /><br />Reason: ${project.suspension.reason || "None"}`,
      showConfirmButton: true,
      footer: SUPPORT_FOOTER,
      allowEscapeKey: false,
      allowOutsideClick: false,
    });

    return { to: "/projects" };
  }

  /* The socket refuses this too. Checking here as well means somebody
     who followed a link to a project they were removed from is told so
     rather than watching a spinner. */
  if (!isOwner && !(project.collaborators ?? []).includes(user.id))
    return { to: "/projects", replace: true };

  /* Bot tokens used to be a block in the workspace and are now a project
     setting, so a project made before that change has nowhere to log in
     from. */
  if (!project.botToken?.length) {
    await Swal.fire({
      ...modalColors,
      title: "Project Setup Incomplete",
      icon: "warning",
      text: isOwner
        ? "We've made changes to the project creation process. You now have to enter your bot token in project settings before creating a project. In order to use this project, you must enter your bot token in the project settings."
        : "We've made changes to the project creation process. You now have to enter your bot token in project settings before creating a project. In order to use this project, ask the owner to enter the bot token in the project settings.",
      confirmButtonText: isOwner ? "Edit project" : "Back to Dashboard",
      allowEscapeKey: false,
      allowOutsideClick: false,
      showCancelButton: false,
    });

    return {
      to: isOwner
        ? `/@${project.owner.username}/${project._id}/edit`
        : "/projects",
      replace: true,
    };
  }

  return null;
}

/**
 * Warns the owner when Discord no longer accepts their bot token.
 *
 * Deliberately not one of the checks above: it doesn't stop the project
 * opening, and it is only asked of the owner. A collaborator receives
 * `botToken: "[HIDDEN]"` — they are not given the credentials — so
 * asking Discord about it on their behalf could only ever fail and tell
 * them something they cannot act on.
 */
export async function warnAboutBotToken({ project, isOwner, modalColors }) {
  if (!isOwner || !project.botToken?.length) return null;

  const { default: axios } = await import("axios");

  try {
    await axios.get("https://discord.com/api/v10/users/@me", {
      headers: { Authorization: `Bot ${project.botToken}` },
      timeout: 10_000,
    });

    return null;
  } catch (error) {
    /* Only a refusal from Discord means the token is bad. A network
       failure means we couldn't ask. */
    if (!error.response || error.response.status !== 401) return null;
  }

  await Swal.fire({
    ...modalColors,
    title: "Invalid Bot Token",
    icon: "warning",
    allowEscapeKey: false,
    allowOutsideClick: false,
    text: "Your bot token is no longer valid; it may have been reset in the Discord Developer Portal. To use your project, you must update your bot token.",
    confirmButtonText: "Edit Project",
    showCancelButton: false,
  });

  return { to: `/@${project.owner.username}/${project._id}/edit`, replace: true };
}
