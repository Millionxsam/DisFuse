import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { errorMessage } from "../../api/client.js";
import usePlanLimits, { hasRoom } from "../../functions/usePlanLimits.js";
import {
  createBuilderCopy,
  prepareBuilderCopy,
} from "../../Pages/Workspace/editor/builderCopy.js";
import WorkspaceModal, { ModalError, ModalLoading } from "./WorkspaceModal.jsx";

import "../../styles/workspace/builder-copy-modal.css";

import { DOCS } from "../../config/docs.js";

/* =====================================================================
   Copy to DisFuse Builder
   ---------------------------------------------------------------------
   Utilities → "Copy to DisFuse Builder". Reads every workspace of this
   project, shows what the DisFuse Builder copy will have (and anything
   that can't come along), and makes the copy as a new project when the
   owner says so. This project is never changed.

   The copy counts as a new project, so it needs room under the owner's
   project limit: when there's none, the dialog says so and the button
   stays off. The API checks again either way.
   ===================================================================== */

const plural = (n, one, many = `${one}s`) => `${n.toLocaleString()} ${n === 1 ? one : many}`;

/** label → count, as a sorted list. */
function counted(map = {}) {
  return Object.entries(map).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {object} props.project
 * @param {boolean} props.isOwner
 * @param {() => object} props.getSource  what to copy, at the moment of
 *   opening: { project, activeVersion, workspace, currentWorkspaceId }
 * @param {(project: object) => void} props.onOpenCopy  opens the new project
 * @param {() => void} props.onClose
 */
export default function BuilderCopyModal({ open, project, isOwner, getSource, onOpenCopy, onClose }) {
  const limits = usePlanLimits();
  const [phase, setPhase] = useState("idle");
  const [prepared, setPrepared] = useState(null);
  const [error, setError] = useState(null);
  /* Set when the API refused the copy over the project limit. */
  const [limitRefusal, setLimitRefusal] = useState(null);
  /* Another bot, for when this one already has a DisFuse Builder project. */
  const [askForToken, setAskForToken] = useState(false);
  const [botToken, setBotToken] = useState("");
  const [created, setCreated] = useState(null);
  const run = useRef(0);

  const prepare = useCallback(async () => {
    const id = (run.current += 1);
    setPhase("preparing");
    setError(null);
    setPrepared(null);

    try {
      const result = await prepareBuilderCopy(getSource());
      if (run.current !== id) return;
      setPrepared(result);
      setPhase("ready");
    } catch (prepareError) {
      console.error("Couldn't prepare the DisFuse Builder copy:", prepareError);
      if (run.current !== id) return;
      setError("Something went wrong while reading this project's blocks. Please try again.");
      setPhase("failed");
    }
  }, [getSource]);

  /* Fresh every time it opens: the blocks, and the room left for projects. */
  useEffect(() => {
    if (!open) {
      run.current += 1;
      return;
    }
    setCreated(null);
    setLimitRefusal(null);
    setAskForToken(false);
    setBotToken("");
    limits.refresh();
    if (isOwner) prepare();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const noRoom = Boolean(limitRefusal) || (!limits.loading && !hasRoom(limits.data, "projects"));
  const stats = prepared?.stats;
  const empty = prepared && !stats.commands && !stats.events;

  const canCreate =
    isOwner &&
    phase === "ready" &&
    !noRoom &&
    !limits.loading &&
    !prepared?.problem &&
    !empty &&
    (!askForToken || botToken.trim().length > 0);

  async function create() {
    if (!canCreate) return;
    setPhase("creating");
    setError(null);

    try {
      const copy = await createBuilderCopy(project._id, prepared.builder, askForToken ? botToken.trim() : undefined);
      setCreated(copy);
      setPhase("done");
    } catch (createError) {
      const body = createError?.response?.data;
      setPhase("ready");

      if (body?.limitReached) {
        setLimitRefusal(body);
        return;
      }
      if (body?.duplicate || (body?.invalidToken && !askForToken)) {
        setAskForToken(true);
        setError(
          body.duplicate
            ? "You already have a DisFuse Builder project for this bot. Each bot can have one, so the copy needs another bot. Paste its token below."
            : errorMessage(createError),
        );
        return;
      }
      setError(errorMessage(createError, "Couldn't make the copy. Please try again."));
    }
  }

  const footer =
    phase === "done" ? (
      <>
        <button type="button" className="df-modal-secondary" onClick={onClose}>
          Stay here
        </button>
        <button type="button" className="df-primary-btn" onClick={() => onOpenCopy?.(created)}>
          <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" />
          Open the copy
        </button>
      </>
    ) : (
      <>
        <button type="button" className="df-modal-secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="df-primary-btn df-builder-copy-go" onClick={create} disabled={!canCreate}>
          {phase === "creating" ? (
            <i className="fa-solid fa-circle-notch fa-spin" aria-hidden="true" />
          ) : (
            <i className="fa-solid fa-wand-magic-sparkles" aria-hidden="true" />
          )}
          Make the copy
        </button>
      </>
    );

  return (
    <WorkspaceModal
      open={open}
      onClose={onClose}
      icon="fa-solid fa-wand-magic-sparkles"
      title="Copy to DisFuse Builder"
      subtitle="A new DisFuse Builder project, made from this one"
      docsPage={DOCS.builderCopy}
      className="df-builder-copy"
      footer={footer}
    >
      {!isOwner ? (
        <Notice icon="fa-solid fa-lock" title="Only the owner can do this">
          The copy is a new project that uses this project&apos;s bot, so only the project&apos;s owner can make it.
        </Notice>
      ) : phase === "done" ? (
        <Notice icon="fa-solid fa-circle-check" title="Your DisFuse Builder project is ready" tone="success">
          It&apos;s a separate project, so this one is exactly as you left it. Open the copy to check its commands and
          events, and to look over anything listed as not copied.
        </Notice>
      ) : noRoom ? (
        <LimitNotice refusal={limitRefusal} data={limits.data} />
      ) : (
        <>
          <p className="df-builder-copy-intro">
            This makes a <strong>new project</strong> that does what this one does, built with DisFuse Builder. Your
            commands, events and variables are set up on their own pages, the way they would be in a project made from
            scratch. This project isn&apos;t changed, and changing one later won&apos;t change the other.
          </p>

          {phase === "preparing" || phase === "idle" || limits.loading ? (
            <ModalLoading label="Reading your workspaces…" />
          ) : phase === "failed" ? (
            <ModalError onRetry={prepare}>{error}</ModalError>
          ) : (
            prepared && (
              <>
                <div className="df-builder-copy-stats">
                  <Stat icon="fa-solid fa-terminal" value={stats.commands} label="commands" />
                  <Stat icon="fa-solid fa-bolt" value={stats.events} label="events" />
                  <Stat icon="fa-solid fa-list-check" value={stats.steps} label="steps" />
                  <Stat icon="fa-solid fa-box-archive" value={stats.variables} label="variables" />
                </div>

                <BotLine project={project} other={askForToken} />

                {error && <ModalError>{error}</ModalError>}
                {askForToken && (
                  <label className="df-builder-copy-token">
                    <span>Another bot&apos;s token</span>
                    <input
                      type="password"
                      autoComplete="off"
                      value={botToken}
                      onChange={(event) => setBotToken(event.target.value)}
                      placeholder="Paste a bot token"
                    />
                  </label>
                )}

                {prepared.problem && (
                  <ModalError>This project can&apos;t be copied as it is: {prepared.problem}</ModalError>
                )}
                {empty && (
                  <ModalError>
                    There&apos;s nothing to copy yet. Add some commands or events in the block editor first.
                  </ModalError>
                )}

                <LeftOut report={prepared.report} />
              </>
            )
          )}
        </>
      )}
    </WorkspaceModal>
  );
}

/* ---- Pieces --------------------------------------------------------- */

function Notice({ icon, title, tone, children }) {
  return (
    <div className={`df-builder-copy-notice${tone ? ` ${tone}` : ""}`}>
      <i className={icon} aria-hidden="true" />
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}

function LimitNotice({ refusal, data }) {
  const premium = refusal ? refusal.premium : data?.premium;
  const limit = data?.limits?.projects;
  const text =
    refusal?.error ??
    (premium
      ? `You can own up to ${limit} projects, and the copy would be a new one. Delete a project to make room for it.`
      : `Free accounts can own up to ${limit} projects, and the copy would be a new one. Delete a project to make room, or upgrade to DisFuse Premium to own up to ${data?.premiumLimits?.projects}.`);

  return (
    <div className="df-builder-copy-notice">
      <i className="fa-solid fa-cubes" aria-hidden="true" />
      <h3>You&apos;ve reached your project limit</h3>
      <p>{text}</p>
      <div className="df-builder-copy-notice-actions">
        {!premium && (
          <Link to="/settings/premium" className="df-primary-btn small">
            See Premium
          </Link>
        )}
        <Link to="/projects" className="df-modal-secondary">
          My Projects
        </Link>
      </div>
    </div>
  );
}

function Stat({ icon, value, label }) {
  return (
    <div className="df-builder-copy-stat">
      <i className={icon} aria-hidden="true" />
      <strong>{value.toLocaleString()}</strong>
      <span>{label}</span>
    </div>
  );
}

function BotLine({ project, other }) {
  const bot = project?.bot;
  const avatar = bot?.avatar
    ? `https://cdn.discordapp.com/avatars/${bot.id}/${bot.avatar}.png?size=64`
    : "https://cdn.discordapp.com/embed/avatars/0.png";

  return (
    <div className="df-builder-copy-bot">
      {other ? (
        <>
          <i className="fa-solid fa-robot" aria-hidden="true" />
          <span>The copy will use the bot whose token you paste below.</span>
        </>
      ) : (
        <>
          <img src={avatar} alt="" />
          <span>
            Uses the same bot, <strong>{bot?.username ?? project?.name}</strong>, with the same secrets and settings.
          </span>
        </>
      )}
    </div>
  );
}

/** Everything that won't be in the copy, grouped by why. */
function LeftOut({ report }) {
  const unsupported = counted(report.unsupported);
  const partial = counted(report.partial);
  const groups = [];

  if (report.packBlocks)
    groups.push({
      key: "packs",
      icon: "fa-solid fa-puzzle-piece",
      title: `${plural(report.packBlocks, "block")} from Workshop packs`,
      text: "These blocks couldn't be read as steps, so they were left out. The steps around them were kept.",
    });
  if (report.blockBuddyBlocks)
    groups.push({
      key: "blockbuddy",
      icon: "fa-solid fa-robot",
      title: `${plural(report.blockBuddyBlocks, "BlockBuddy block")}`,
      text: "BlockBuddy isn't available in DisFuse Builder, so these were left out. The steps around them were kept.",
    });
  if (report.unknownBlocks)
    groups.push({
      key: "unknown",
      icon: "fa-solid fa-circle-question",
      title: `${plural(report.unknownBlocks, "block")} the editor doesn't recognize`,
      text: "Usually blocks from a pack you don't have installed. They were left out.",
    });
  if (unsupported.length)
    groups.push({
      key: "unsupported",
      icon: "fa-solid fa-ban",
      title: `${plural(unsupported.reduce((n, [, c]) => n + c, 0), "block")} with nothing like them in DisFuse Builder`,
      list: unsupported,
    });
  if (partial.length)
    groups.push({
      key: "partial",
      icon: "fa-solid fa-triangle-exclamation",
      title: `${plural(partial.reduce((n, [, c]) => n + c, 0), "step")} where something couldn't be copied`,
      text: "These were copied, but a setting or value didn't fit. Check them in the copy.",
      list: partial,
    });

  if (!groups.length && !report.notes.length)
    return (
      <p className="df-builder-copy-all">
        <i className="fa-solid fa-circle-check" aria-hidden="true" /> Everything in this project can be copied.
      </p>
    );

  return (
    <div className="df-builder-copy-leftout">
      <h3>Good to know</h3>
      {groups.map((group) => (
        <details key={group.key} className="df-builder-copy-group">
          <summary>
            <i className={group.icon} aria-hidden="true" />
            <span>{group.title}</span>
            <i className="fa-solid fa-chevron-down df-builder-copy-chevron" aria-hidden="true" />
          </summary>
          {group.text && <p>{group.text}</p>}
          {group.list && (
            <ul>
              {group.list.map(([label, count]) => (
                <li key={label}>
                  {label}
                  {count > 1 && <span className="df-builder-copy-count">×{count}</span>}
                </li>
              ))}
            </ul>
          )}
        </details>
      ))}
      {report.notes.length > 0 && (
        <details className="df-builder-copy-group">
          <summary>
            <i className="fa-solid fa-circle-info" aria-hidden="true" />
            <span>{plural(report.notes.length, "thing works", "things work")} a little differently</span>
            <i className="fa-solid fa-chevron-down df-builder-copy-chevron" aria-hidden="true" />
          </summary>
          <ul>
            {report.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
