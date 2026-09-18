import Swal from "sweetalert2";

import { planLimits, premiumLogo } from "../config/premiumPlans";
import { premiumModalHero } from "../functions/premiumModal";
import WorkspaceModal, { ModalEmpty } from "./workspace/WorkspaceModal.jsx";
import {
  closeVersionControl,
  openVersionControl,
  useVersionControlOpen,
} from "./workspace/versionControlDialog.js";

/* Re-exported so the navbar keeps importing this from one place.

   Imported *and* re-exported deliberately: `export { x } from "…"` moves
   the name on without binding it locally, so `withDialog` below — the
   only caller — threw a ReferenceError in its `finally` and the panel
   never came back after creating, renaming or deleting a version. */
export { closeVersionControl, openVersionControl };

import "../styles/workspace/version-control.css";

import { DOCS } from "../config/docs.js";

/* =====================================================================
   Version Control panel
   ---------------------------------------------------------------------
   Opened from the workspace navbar. A version is the whole project — all
   of its sub-workspaces — saved as one snapshot, so everything in here
   talks about the project rather than about the tab you happen to be on.

   The panel does the asking (name this version, are you sure) and hands
   the answer to the editor, which owns the Blockly workspace and is the
   only thing that can safely load blocks into it.

   What is greyed out here mirrors what the API enforces:

     collaborators   switch between versions and edit them
     the owner       also creates, renames and deletes them
     the limit       how many versions a project can keep follows its
                     owner's plan: 3 free, 25 with Premium. It only stops
                     new versions. A project already past it (Premium
                     lapsed) keeps every version, and they can all still
                     be opened, edited, renamed, switched and deleted.
   ===================================================================== */

function formatMoment(value) {
  if (!value) return "Unknown";

  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * @param {object} props
 * @param {Array} props.versions     summaries, oldest first
 * @param {string} props.activeVersionId
 * @param {boolean} props.canManage  the caller owns this project
 * @param {boolean} props.premium    the project's OWNER has Premium
 * @param {number} props.maxVersions the owner's limit for this project
 * @param {number} props.premiumMaxVersions what Premium raises it to
 * @param {boolean} props.busy       an operation is in flight
 * @param {(versionId: string) => void} props.onSwitch
 * @param {(options: {name: string, source: string}) => void} props.onCreate
 * @param {(versionId: string, name: string) => void} props.onRename
 * @param {(versionId: string) => void} props.onDelete
 */
export default function VersionControl({
  versions = [],
  activeVersionId,
  canManage = false,
  premium = false,
  maxVersions = planLimits.free.versionsPerProject,
  premiumMaxVersions = planLimits.premium.versionsPerProject,
  busy = false,
  modalColors = {},
  onSwitch,
  onCreate,
  onRename,
  onDelete,
}) {
  const open = useVersionControlOpen();

  const versioned = versions.length > 0;
  const full = versions.length >= maxVersions;
  /* Only the owner can upgrade, and only a free plan has anything to
     upgrade to. */
  const canUpgrade = canManage && !premium && premiumMaxVersions > maxVersions;

  const ordered = [...versions].sort(
    (a, b) => (a.number ?? 0) - (b.number ?? 0),
  );

  const latest = ordered[ordered.length - 1];

  /**
   * What to call the version this one was copied from.
   *
   * The name is snapshotted on the copy so it survives the source being
   * deleted, but while the source is still here its current name is the
   * one the user recognises — a version that has been renamed since
   * shouldn't show up under its old name.
   */
  function sourceName(origin) {
    const source = versions.find(
      (version) => String(version._id) === String(origin.version),
    );

    return source?.name || origin.name;
  }

  /**
   * Runs one of the flows below with the panel out of the way.
   *
   * A `<dialog>` opened with showModal() sits in the browser's top
   * layer, which is above everything else on the page whatever its
   * z-index — including Swal. So the panel steps aside for the dialog
   * that asks the question, and comes back with the answer applied.
   */
  function withDialog(flow) {
    return async (...args) => {
      closeVersionControl();

      try {
        await flow(...args);
      } finally {
        /* Unless the flow navigated away, which reload does. */
        openVersionControl();
      }
    };
  }

  /**
   * The project has as many versions as its owner's plan keeps. Deleting
   * one always makes room, and a free owner can also upgrade.
   */
  function limitReached() {
    const over = versions.length > maxVersions;
    const count = over
      ? `This project has ${versions.length} versions, more than the ${maxVersions} your plan keeps.`
      : `This project already has ${maxVersions} versions, the most your plan keeps.`;

    if (!canUpgrade)
      return Swal.fire({
        title: "No room for another version",
        text: `${count} Delete one you no longer need first.`,
        icon: "warning",
        ...modalColors,
      });

    return Swal.fire({
      title: "No room for another version",
      html: `${count} Delete a version you no longer need to make room, or upgrade to DisFuse Premium to keep up to ${premiumMaxVersions} versions per project.<br /><br />Every version you already have stays exactly where it is, and you can keep opening, editing, switching between and deleting them.`,
      confirmButtonText: "See Premium",
      showCancelButton: true,
      cancelButtonText: "Not now",
      ...premiumModalHero,
      ...modalColors,
    }).then((result) => {
      if (result.isConfirmed) window.open("/settings/premium", "_blank");
    });
  }

  async function newVersion() {
    if (!canManage) return;
    if (full) return limitReached();

    const nextNumber =
      ordered.reduce((highest, v) => Math.max(highest, v.number ?? 0), 0) + 1;

    /* Copying the newest version is what people almost always want: a
       new version is where the next iteration of the bot starts, and it
       starts from where the bot is now. Every other version — and an
       empty one — is one click away in the same menu.

       The FIRST version has no such choice: it is the copy that moves
       the project onto Version Control, so it is always the project as
       it stands. Anything else would leave the blocks it already has
       somewhere nothing reads. */
    const sourcePicker = versioned
      ? `<label class="df-version-dialog-label" for="df-version-source">Start from</label>
         <select id="df-version-source" class="df-version-dialog-select">${[
           ...[...ordered]
             .reverse()
             .map(
               (version) =>
                 `<option value="${version._id}"${
                   version._id === latest?._id ? " selected" : ""
                 }>Copy of ${escapeHtml(version.name)}</option>`,
             ),
           `<option value="blank">Start from an empty version</option>`,
         ].join("")}</select>`
      : "";

    const result = await Swal.fire({
      title: versioned ? "New Version" : "Start Version Control",
      html: `
        <p class="df-version-dialog-text">${
          versioned
            ? "A new version starts as an exact copy of the version you pick. Changes you make afterwards belong to the new version only. The one you copied stays exactly as it is."
            : "This saves everything in your project right now as its first version. From then on this project saves into versions, and you can create more of them whenever you start a new iteration of your bot."
        }</p>
        ${sourcePicker}
        <label class="df-version-dialog-label" for="df-version-name">Name</label>
      `,
      input: "text",
      inputPlaceholder: `Version ${nextNumber}`,
      inputAttributes: { id: "df-version-name", maxlength: 60 },
      showCancelButton: true,
      confirmButtonText: versioned ? "Create Version" : "Create First Version",
      preConfirm: (name) => ({
        name,
        source:
          document.querySelector("#df-version-source")?.value || "current",
      }),
      ...modalColors,
    });

    if (!result.isConfirmed) return;

    onCreate?.({
      name: String(result.value?.name ?? "").trim(),
      source: result.value?.source || "current",
    });
  }

  async function rename(version) {
    if (!canManage) return;

    const result = await Swal.fire({
      title: "Rename Version",
      text: `Version ${version.number} keeps its blocks and its place in your history. Only its name changes.`,
      input: "text",
      inputValue: version.name,
      inputAttributes: { maxlength: 60 },
      inputValidator: (value) =>
        String(value ?? "").trim().length ? undefined : "Give it a name",
      showCancelButton: true,
      confirmButtonText: "Rename",
      ...modalColors,
    });

    if (!result.isConfirmed) return;

    onRename?.(version._id, String(result.value).trim());
  }

  async function remove(version) {
    if (!canManage) return;

    const isLast = ordered.length === 1;
    const isActive = String(version._id) === String(activeVersionId);

    const result = await Swal.fire({
      title: `Delete ${version.name}?`,
      html: isLast
        ? `This is the only version left. Deleting it turns Version Control off and starts this project again as an <b>empty</b> project, and the blocks saved in this version go with it.`
        : `The blocks saved in this version will be deleted.${
            isActive
              ? " You are editing it right now, so the editor will move to another version."
              : ""
          }`,
      icon: "warning",
      footer: "This is not reversible!",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#e40000",
      ...modalColors,
    });

    if (!result.isConfirmed) return;

    onDelete?.(version._id);
  }

  /** "Free accounts keep 3 versions per project. Upgrade for up to 25." */
  const upgradeHint = canUpgrade ? (
    <span className="df-plan-hint">
      Free accounts keep {maxVersions} versions per project.
      <a href="/settings/premium" target="_blank" rel="noopener noreferrer">
        <img src={premiumLogo} alt="" /> Upgrade to Premium for up to{" "}
        {premiumMaxVersions}
      </a>
    </span>
  ) : null;

  return (
    <WorkspaceModal
      open={open}
      onClose={closeVersionControl}
      wide
      icon="fa-solid fa-code-branch"
      title="Version Control"
      subtitle="Snapshots of the whole project, every workspace included"
      docsPage={DOCS.versionControl}
      footer={
        versioned ? (
          <>
            <span className="versionControl-count">
              <span>
                {ordered.length} of {maxVersions} versions
              </span>
              {upgradeHint}
            </span>

            {canManage ? (
              <button
                type="button"
                className={`df-primary-btn${full ? " locked" : ""}`}
                title={
                  full
                    ? "This project has as many versions as its plan keeps"
                    : undefined
                }
                disabled={busy}
                onClick={withDialog(newVersion)}
              >
                <i className="fa-solid fa-plus"></i> New Version
              </button>
            ) : (
              ""
            )}
          </>
        ) : null
      }
    >
      {!versioned ? (
        <ModalEmpty
          icon="fa-solid fa-code-branch"
          title="This project isn't using versions yet"
        >
          Save the whole project, every workspace included, as a version you can
          come back to. Start a new version whenever you begin the next
          iteration of your bot, and switch between them whenever you like.
          Version Control is optional: turn it on only for the projects you want
          it in.
          {canManage ? (
            <>
              <br />
              <br />
              <button
                type="button"
                className="df-primary-btn"
                disabled={busy}
                onClick={withDialog(newVersion)}
              >
                <i className="fa-solid fa-plus"></i> Create first version
              </button>
              {upgradeHint && (
                <>
                  <br />
                  <br />
                  {upgradeHint}
                </>
              )}
            </>
          ) : (
            <>
              <br />
              <br />
              Only the owner of this project can turn Version Control on.
            </>
          )}
        </ModalEmpty>
      ) : (
        <>
          <ul className="versionControl-list">
            {ordered.map((version) => {
              const isActive = String(version._id) === String(activeVersionId);

              return (
                <li
                  className={`versionControl-version${
                    isActive ? " active" : ""
                  }`}
                  key={version._id}
                >
                  <div className="number">v{version.number}</div>

                  <div className="details">
                    <h3>
                      {version.name}
                      {isActive ? (
                        <span className="tag active">Editing</span>
                      ) : (
                        ""
                      )}
                      {version._id === latest?._id ? (
                        <span className="tag">Newest</span>
                      ) : (
                        ""
                      )}
                    </h3>
                    <p>
                      <span>
                        <i className="fa-solid fa-layer-group"></i>{" "}
                        {version.workspaces?.length || 0} workspace
                        {version.workspaces?.length === 1 ? "" : "s"}
                      </span>
                      <span>
                        <i className="fa-solid fa-clock"></i> Created{" "}
                        {formatMoment(version.created)}
                      </span>
                      <span>
                        <i className="fa-solid fa-pen"></i> Edited{" "}
                        {formatMoment(version.updated)}
                      </span>
                      {version.createdFrom?.number ? (
                        <span>
                          <i className="fa-solid fa-code-branch"></i> Copied
                          from {sourceName(version.createdFrom)}
                        </span>
                      ) : (
                        ""
                      )}
                    </p>
                  </div>

                  <div className="buttons">
                    {isActive ? (
                      <span className="editing">
                        <i className="fa-solid fa-circle-check"></i> Active
                      </span>
                    ) : (
                      <button
                        className="switch"
                        disabled={busy}
                        onClick={() => onSwitch?.(version._id)}
                      >
                        <i className="fa-solid fa-right-left"></i> Switch
                      </button>
                    )}

                    {canManage ? (
                      <>
                        <button
                          className="icon"
                          title="Rename this version"
                          disabled={busy}
                          onClick={withDialog(() => rename(version))}
                        >
                          <i className="fa-solid fa-pen"></i>
                        </button>
                        <button
                          className="icon danger"
                          title="Delete this version"
                          disabled={busy}
                          onClick={withDialog(() => remove(version))}
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </>
                    ) : (
                      ""
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </WorkspaceModal>
  );
}

/** Version names go into a Swal `html` string, so they get escaped. */
function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
