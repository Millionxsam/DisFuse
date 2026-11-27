import { useEffect, useMemo, useState } from "react";

import "../../styles/builder/versions.css";

import { premiumLogo } from "../../config/premiumPlans.js";
import { DOCS } from "../../config/docs.js";
import ExportModal from "../components/export/ExportModal.jsx";
import PageLayout, {
  PageHeader,
  Section,
} from "../components/layout/PageLayout.jsx";
import { useBuilder } from "../state/BuilderProvider.jsx";
import {
  Badge,
  Button,
  EmptyState,
  Field,
  IconButton,
  Modal,
  Select,
  Skeleton,
  TextInput,
  confirm,
  promptText,
} from "../ui/index.js";

/* =====================================================================
   Versions
   ---------------------------------------------------------------------
   /workspace/versions: Version Control for a DisFuse Builder project.
   The block editor has the same feature in a panel (components/
   VersionControl.jsx); here it's a page of its own, and works the same:

     - A version is the whole bot: every command, event and variable,
       saved as its own copy. Secrets, the token, collaborators and
       settings belong to the project, so every version shares them.
     - The first version is a copy of the project as it is, and from then
       on the project saves into versions. Later ones start as a copy of
       any version, or empty.
     - Switching moves only this page (this browser) onto another
       version; someone else can be on a different one at the same time.
     - Any version can be exported, not only the one being edited.
     - Deleting the last version turns Version Control off and starts the
       project again empty.

   Who can do what is the API's to enforce (Routes/versionRouter.js);
   this page only offers what it will allow:

     the owner        creates, renames and deletes versions
     collaborators    switch between versions and change the one they're
                      on, as far as their permissions go
     the plan limit   the owner's: how many versions the project can
                      keep. It only stops new ones being made.
   ===================================================================== */

const NAME_MAX = 60;

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

const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;

/** The next version's number: one more than the highest ever used. */
function nextNumber(versions) {
  return (
    versions.reduce((highest, v) => Math.max(highest, v.number ?? 0), 0) + 1
  );
}

/* ---- Creating ----------------------------------------------------------- */

function NewVersionModal({ open, onClose, ordered, first }) {
  const { versions } = useBuilder();
  const newest = ordered[0];
  const [name, setName] = useState("");
  const [source, setSource] = useState("");

  useEffect(() => {
    if (!open) return;
    setName("");
    /* Copying the newest version is what people almost always want: a
       new version is where the next iteration of the bot starts. */
    setSource(first ? "current" : String(newest?._id ?? "blank"));
  }, [first, newest?._id, open]);

  const options = useMemo(
    () => [
      ...ordered.map((v) => ({
        value: String(v._id),
        label: `Copy of ${v.name}`,
        icon: "fa-regular fa-copy",
      })),
      {
        value: "blank",
        label: "Start from an empty version",
        icon: "fa-regular fa-file",
      },
    ],
    [ordered],
  );

  const submit = async (event) => {
    event?.preventDefault();
    const made = await versions.create({
      name: name.trim(),
      source: first ? "current" : source,
    });
    if (made) onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      docs={DOCS.builderVersions}
      title={first ? "Start Version Control" : "New version"}
      icon="fa-solid fa-code-branch"
      iconColor="var(--dfb-grad-cool)"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            icon="fa-solid fa-plus"
            loading={versions.busy}
            onClick={submit}
          >
            {first ? "Create first version" : "Create version"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="dfb-stack">
        <p className="dfb-modal__message">
          {first
            ? "This saves your whole bot as it is right now as its first version. From then on this project saves into versions, and you can make more whenever you start on the next iteration of your bot."
            : "A new version starts as an exact copy of the version you pick. Changes you make afterwards only go into the new version, and the one you copied stays exactly as it is."}
        </p>
        {!first && (
          <Field label="Start from">
            <Select
              value={source}
              options={options}
              onChange={setSource}
              ariaLabel="Start from"
            />
          </Field>
        )}
        <Field
          label="Name"
          optional
          help="Leave it empty to call it by its number."
          counter={{ value: name.length, max: NAME_MAX }}
        >
          <TextInput
            value={name}
            maxLength={NAME_MAX}
            placeholder={`Version ${nextNumber(ordered)}`}
            onChange={(event) => setName(event.target.value)}
            data-autofocus
          />
        </Field>
      </form>
    </Modal>
  );
}

/* ---- One version -------------------------------------------------------- */

function VersionRow({
  version,
  index,
  isActive,
  isNewest,
  sourceName,
  onExport,
}) {
  const { versions } = useBuilder();
  const counts = version.builder ?? { commands: 0, events: 0, variables: 0 };
  const isLast = versions.versions.length === 1;

  const rename = async () => {
    const name = await promptText({
      title: "Rename version",
      message: `Version ${version.number} keeps everything in it and its place in your history. Only its name changes.`,
      label: "Name",
      initial: version.name,
      maxLength: NAME_MAX,
      confirmLabel: "Rename",
      validate: (text) =>
        !text.trim().length
          ? "Give it a name"
          : text.trim().length > NAME_MAX
            ? `Up to ${NAME_MAX} characters`
            : null,
    });
    if (name !== null && name.trim() !== version.name)
      versions.rename(version._id, name.trim());
  };

  const remove = async () => {
    const sure = await confirm({
      title: `Delete ${version.name}?`,
      message: isLast
        ? "This is the only version left. Deleting it turns Version Control off and starts this project again empty: every command, event and variable in this version goes with it. This can't be undone."
        : `Every command, event and variable saved in this version will be deleted.${isActive ? " You're editing it right now, so you'll move to the newest version left." : ""} This can't be undone.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (sure) versions.remove(version._id);
  };

  return (
    <li
      className={`dfb-version ${isActive ? "dfb-version--active" : ""}`}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <span className="dfb-version__number">v{version.number}</span>
      <div className="dfb-version__text">
        <span className="dfb-version__name">
          {version.name}
          {isActive && (
            <Badge tone="violet" icon="fa-solid fa-pen">
              Editing
            </Badge>
          )}
          {isNewest && <Badge tone="mint">Newest</Badge>}
        </span>
        <span className="dfb-version__meta">
          <span>
            <i className="fa-solid fa-terminal" aria-hidden />{" "}
            {plural(counts.commands, "command")}
          </span>
          <span>
            <i className="fa-solid fa-bolt" aria-hidden />{" "}
            {plural(counts.events, "event")}
          </span>
          <span>
            <i className="fa-solid fa-cube" aria-hidden />{" "}
            {plural(counts.variables, "variable")}
          </span>
        </span>
        <span className="dfb-version__meta">
          <span>
            <i className="fa-solid fa-clock" aria-hidden /> Created{" "}
            {formatMoment(version.created)}
          </span>
          <span>
            <i className="fa-solid fa-pen" aria-hidden /> Edited{" "}
            {formatMoment(version.updated)}
          </span>
          {version.createdFrom?.number ? (
            <span>
              <i className="fa-solid fa-code-branch" aria-hidden /> Copied from{" "}
              {sourceName(version.createdFrom)}
            </span>
          ) : null}
        </span>
      </div>
      <div className="dfb-version__actions">
        {isActive ? (
          <span className="dfb-version__current">
            <i className="fa-solid fa-circle-check" aria-hidden /> Active
          </span>
        ) : (
          <Button
            size="sm"
            icon="fa-solid fa-right-left"
            disabled={versions.busy}
            onClick={() => versions.switchTo(version._id)}
          >
            Switch
          </Button>
        )}
        <IconButton
          icon="fa-solid fa-file-zipper"
          label="Export this version"
          disabled={versions.busy}
          onClick={() => onExport(version._id)}
        />
        {versions.canManage && (
          <>
            <IconButton
              icon="fa-solid fa-pen"
              label="Rename this version"
              disabled={versions.busy}
              onClick={rename}
            />
            <IconButton
              icon="fa-solid fa-trash"
              label="Delete this version"
              tone="danger"
              disabled={versions.busy}
              onClick={remove}
            />
          </>
        )}
      </div>
    </li>
  );
}

/* ---- The page ----------------------------------------------------------- */

export default function VersionsPage() {
  const { versions, readOnly } = useBuilder();
  const [creating, setCreating] = useState(false);
  const [exporting, setExporting] = useState(null);
  const [limitOpen, setLimitOpen] = useState(false);

  /* Fresh every time the page opens: someone else may have made or
     deleted one since the project was opened. */
  useEffect(() => {
    versions.refresh().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const list = versions.versions;
  const ordered = useMemo(
    () => [...list].sort((a, b) => (b.number ?? 0) - (a.number ?? 0)),
    [list],
  );
  const newest = ordered[0];
  const versioned = list.length > 0;
  const full = list.length >= versions.maxVersions;
  const canManage = versions.canManage && !readOnly;
  /* Only the owner can upgrade, and only a free plan has anything to upgrade to. */
  const canUpgrade =
    versions.canManage &&
    !versions.premium &&
    versions.premiumMaxVersions > versions.maxVersions;
  const activeId = String(versions.active?._id ?? "");

  /* The source's current name if it's still here (it may have been
     renamed since), the name it had when copied otherwise. */
  const sourceName = (origin) =>
    list.find((v) => String(v._id) === String(origin.version))?.name ||
    origin.name;

  const startCreating = () => (full ? setLimitOpen(true) : setCreating(true));

  const upgradeHint = canUpgrade && (
    <a
      className="dfb-version-upgrade"
      href="/settings/premium"
      target="_blank"
      rel="noopener noreferrer"
    >
      <img src={premiumLogo} alt="" /> Upgrade to Premium for up to{" "}
      {versions.premiumMaxVersions}
    </a>
  );

  return (
    <PageLayout
      crumbs={[{ label: "Versions", icon: "fa-solid fa-code-branch" }]}
    >
      <PageHeader
        docs={DOCS.builderVersions}
        icon="fa-solid fa-code-branch"
        color="linear-gradient(135deg, #4fa8ff, #8b6cff)"
        title="Versions"
        subtitle="Snapshots of your whole bot: every command, event and variable. Switch between them, work on one without touching the others, and export whichever you like."
      >
        {versioned && canManage && (
          <Button
            variant="primary"
            icon="fa-solid fa-plus"
            disabled={versions.busy}
            onClick={startCreating}
          >
            New version
          </Button>
        )}
      </PageHeader>

      {!versions.loaded ? (
        <div className="dfb-stack">
          <Skeleton height={96} radius="var(--dfb-r-lg)" />
          <Skeleton height={96} radius="var(--dfb-r-lg)" />
        </div>
      ) : !versioned ? (
        <EmptyState
          icon="fa-solid fa-code-branch"
          color="var(--dfb-grad-cool)"
          title="This project isn't using versions yet"
          action={
            canManage ? (
              <Button
                variant="primary"
                icon="fa-solid fa-plus"
                disabled={versions.busy}
                onClick={startCreating}
              >
                Create first version
              </Button>
            ) : null
          }
        >
          Save your whole bot as a version you can come back to. Start a new
          version whenever you begin the next iteration of your bot, and switch
          between them whenever you like. Versions are optional: turn them on
          only for the projects you want them in.
          {!versions.canManage && (
            <> Only the project's owner can turn Version Control on.</>
          )}
          {upgradeHint && (
            <span className="dfb-version-plan">
              Free accounts keep {versions.maxVersions} versions per project.{" "}
              {upgradeHint}
            </span>
          )}
        </EmptyState>
      ) : (
        <>
          {versions.active && (
            <div className="dfb-note">
              <i className="fa-solid fa-pen" aria-hidden />
              <div>
                You're editing <strong>{versions.active.name}</strong>.
                Everything you change is saved into this version only. Switching
                only moves you, so other people on this project can stay on
                another version.
              </div>
            </div>
          )}

          <Section
            title="Version list"
            icon="fa-solid fa-layer-group"
            description="Newest first. Secrets, the bot token, collaborators and settings belong to the project, so every version shares them."
            actions={
              <Badge tone={full ? "amber" : undefined}>
                {list.length} of {versions.maxVersions}
              </Badge>
            }
          >
            <ul className="dfb-versions">
              {ordered.map((version, index) => (
                <VersionRow
                  key={version._id}
                  version={version}
                  index={index}
                  isActive={String(version._id) === activeId}
                  isNewest={version._id === newest?._id}
                  sourceName={sourceName}
                  onExport={setExporting}
                />
              ))}
            </ul>
            {(upgradeHint || (full && canManage)) && (
              <p className="dfb-version-plan">
                {full
                  ? `This project has ${list.length > versions.maxVersions ? `${list.length} versions, more than` : "as many versions as"} the ${versions.maxVersions} its owner's plan keeps. Delete one to make room for a new one.`
                  : `Free accounts keep ${versions.maxVersions} versions per project.`}{" "}
                {upgradeHint}
              </p>
            )}
          </Section>
        </>
      )}

      <NewVersionModal
        open={creating}
        onClose={() => setCreating(false)}
        ordered={ordered}
        first={!versioned}
      />

      <Modal
        open={limitOpen}
        onClose={() => setLimitOpen(false)}
        title="No room for another version"
        icon="fa-solid fa-triangle-exclamation"
        tone="danger"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setLimitOpen(false)}>
              {canUpgrade ? "Not now" : "OK"}
            </Button>
            {canUpgrade && (
              <Button
                variant="primary"
                icon="fa-solid fa-crown"
                onClick={() =>
                  window.open("/settings/premium", "_blank", "noopener")
                }
              >
                See Premium
              </Button>
            )}
          </>
        }
      >
        <p className="dfb-modal__message">
          {list.length > versions.maxVersions
            ? `This project has ${list.length} versions, more than the ${versions.maxVersions} your plan keeps.`
            : `This project already has ${versions.maxVersions} versions, the most your plan keeps.`}{" "}
          Delete one you no longer need to make room
          {canUpgrade
            ? `, or upgrade to DisFuse Premium to keep up to ${versions.premiumMaxVersions} versions per project`
            : ""}
          . Every version you already have stays exactly where it is.
        </p>
      </Modal>

      <ExportModal
        open={Boolean(exporting)}
        versionId={exporting}
        onClose={() => setExporting(null)}
      />
    </PageLayout>
  );
}
