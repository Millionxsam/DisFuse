import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { userCache } from "../../../cache.ts";
import { DOCS, docsUrl } from "../../../config/docs.js";
import { PACKAGE_MANAGERS, RUNTIMES, resolveExportSettings } from "../../../config/exportSettings.js";
import { downloadExport, downloadIndexFile, prepareExport } from "../../codegen/export.js";
import { useBuilder } from "../../state/BuilderProvider.jsx";
import { Button, Field, Modal, Select, Spinner, toast } from "../../ui/index.js";

/* =====================================================================
   Export
   ---------------------------------------------------------------------
   Builds the bot, shows anything that looks wrong (with links to where
   it is), then downloads the same ZIP a block editor project exports.

   With Version Control, any version can be exported, not only the one
   being edited: that's how a stable version keeps running while the next
   one is built. `versionId` picks which one it opens on.
   ===================================================================== */

const ICONS = { error: "fa-solid fa-circle-xmark", warning: "fa-solid fa-triangle-exclamation" };

export default function ExportModal({ open, onClose, versionId = null }) {
  const { project, builder, catalog, paths, flush, can, versions } = useBuilder();
  const [prepared, setPrepared] = useState(null);
  const [failed, setFailed] = useState(null);
  const [downloading, setDownloading] = useState(false);
  /* Which version to export (null without Version Control), and its builder. */
  const [chosen, setChosen] = useState(null);
  const [target, setTarget] = useState(null);

  const versionList = versions?.versions ?? [];
  const activeId = versions?.active ? String(versions.active._id) : null;
  const exportingActive = !chosen || chosen === activeId;

  useEffect(() => {
    if (open) setChosen(versionId ? String(versionId) : activeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, versionId]);

  /* The builder to export: what's on screen for the version being
     edited (once everything waiting is saved), another version's from
     the API. */
  useEffect(() => {
    if (!open) return undefined;
    let current = true;
    setTarget(null);
    setPrepared(null);
    setFailed(null);
    (versions && chosen ? versions.builderOf(chosen) : flush().then(() => builder))
      .then((loaded) => current && setTarget({ builder: loaded }))
      .catch((error) => {
        console.error(error);
        if (current) setFailed("Couldn't read that version. Please try again.");
      });
    return () => {
      current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, chosen]);

  useEffect(() => {
    if (!open || !target) return undefined;
    let current = true;
    setPrepared(null);
    prepareExport(project, target.builder, catalog, resolveExportSettings(userCache.user, project))
      .then((result) => current && setPrepared(result))
      .catch((error) => {
        console.error(error);
        if (current) setFailed("Something went wrong while building your bot. Please try again.");
      });
    return () => {
      current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, target, catalog]);

  const exported = target?.builder ?? builder;
  const versionName = versionList.find((v) => String(v._id) === chosen)?.name;

  const download = async () => {
    setDownloading(true);
    try {
      await downloadExport(prepared);
      toast.success(versionName ? `${versionName} was downloaded` : "Your bot was downloaded", { detail: "Unzip it and open instructions.txt to see how to run it." });
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Couldn't download your bot", { detail: "Please try again." });
    } finally {
      setDownloading(false);
    }
  };

  const downloadIndex = () => {
    try {
      downloadIndexFile(prepared);
      toast.success("index.js was downloaded", { detail: "Replace the one in your bot's folder with it, then restart the bot." });
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Couldn't download the file", { detail: "Please try again." });
    }
  };

  const settings = prepared?.exportSettings;

  const errors = prepared?.problems.filter((p) => p.level === "error") ?? [];
  const warnings = prepared?.problems.filter((p) => p.level === "warning") ?? [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      docs={DOCS.builderExport}
      title="Export your bot"
      subtitle="Download a ZIP with your bot's code, ready to run."
      icon="fa-solid fa-file-zipper"
      iconColor="var(--dfb-grad-mint)"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="secondary" icon="fa-solid fa-file-code" disabled={!prepared} onClick={downloadIndex} title="Only index.js, for updating a bot you already set up">
            Download file
          </Button>
          <Button variant={errors.length ? "danger" : "primary"} icon="fa-solid fa-download" disabled={!prepared} loading={downloading} onClick={download}>
            {errors.length ? "Download anyway" : "Download ZIP"}
          </Button>
        </>
      }
    >
      {versionList.length > 0 && (
        <Field label="Version" help="Export any version, not only the one you're editing." className="dfb-export-version">
          <Select
            value={chosen ?? ""}
            options={[...versionList]
              .sort((a, b) => (b.number ?? 0) - (a.number ?? 0))
              .map((v) => ({ value: String(v._id), label: `v${v.number} · ${v.name}${String(v._id) === activeId ? " (editing)" : ""}`, icon: "fa-solid fa-code-branch" }))}
            onChange={(value) => setChosen(String(value))}
            ariaLabel="Version to export"
          />
        </Field>
      )}
      {!prepared && !failed && (
        <div style={{ display: "grid", placeItems: "center", gap: 12, padding: 30 }}>
          <Spinner size={30} />
          <span style={{ color: "var(--dfb-dim)" }}>Putting your bot together…</span>
        </div>
      )}
      {failed && (
        <div className="dfb-note dfb-note--danger">
          <i className="fa-solid fa-circle-xmark" aria-hidden />
          {failed}
        </div>
      )}
      {prepared && (
        <div className="dfb-stack">
          {errors.length + warnings.length === 0 ? (
            <div className="dfb-note">
              <i className="fa-solid fa-circle-check" aria-hidden style={{ color: "var(--dfb-mint)" }} />
              <div>
                <strong>Everything looks good.</strong> {versionName ? `${versionName} has` : "Your bot has"} {exported.commands.length} command{exported.commands.length === 1 ? "" : "s"} and {exported.events.length} event
                {exported.events.length === 1 ? "" : "s"}.
              </div>
            </div>
          ) : (
            <div>
              <div className={`dfb-note ${errors.length ? "dfb-note--danger" : "dfb-note--amber"}`} style={{ marginBottom: 10 }}>
                <i className="fa-solid fa-triangle-exclamation" aria-hidden />
                <div>
                  {errors.length ? (
                    <>
                      <strong>Some parts of your bot won't work yet.</strong> You can still download it, but it's best to fix these first.
                    </>
                  ) : (
                    <>
                      <strong>A few things to check.</strong> Your bot will run, but these might not do what you want.
                    </>
                  )}
                </div>
              </div>
              <ul className="dfb-problems" style={{ maxHeight: 260, overflow: "auto" }}>
                {[...errors, ...warnings].map((problem, index) => (
                  <li key={index}>
                    {problem.to && exportingActive ? (
                      <Link to={`${paths.workspace}/${problem.to}`} onClick={onClose} className={`dfb-problem dfb-problem--${problem.level}`}>
                        <i className={ICONS[problem.level]} aria-hidden />
                        <span className="dfb-problem__text">
                          <small>{problem.where}</small>
                          {problem.message}
                        </span>
                      </Link>
                    ) : (
                      <div className={`dfb-problem dfb-problem--${problem.level}`}>
                        <i className={ICONS[problem.level]} aria-hidden />
                        <span className="dfb-problem__text">
                          <small>{problem.where}</small>
                          {problem.message}
                        </span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {settings && (
            <div className="dfb-note">
              <i className="fa-solid fa-gear" aria-hidden />
              <div>
                Exporting for <strong>{RUNTIMES[settings.runtime]?.label}</strong> with <strong>{PACKAGE_MANAGERS[settings.packageManager]?.label}</strong>. Change it in{" "}
                <Link to="/settings/export" onClick={onClose}>
                  Settings → Export
                </Link>
                , or for just this bot in its settings.
              </div>
            </div>
          )}

          <div className="dfb-note">
            <i className="fa-solid fa-circle-info" aria-hidden />
            <div>
              "Download file" downloads only index.js, for updating a bot you already set up. After downloading the ZIP, unzip the file and open <strong>instructions.txt</strong> to see how to run your bot.{" "}
              <a href={docsUrl(DOCS.runningYourBot)} target="_blank" rel="noopener noreferrer">
                How to run your bot
              </a>{" "}
              ·{" "}
              <a href={docsUrl(DOCS.hosting)} target="_blank" rel="noopener noreferrer">
                Where to host it
              </a>
            </div>
          </div>
          {project?.botToken === "[HIDDEN]" ? (
            <div className="dfb-note dfb-note--amber">
              <i className="fa-solid fa-key" aria-hidden />
              <div>
                The bot token isn't included, because the project's owner hasn't let you see it. Put it in the <strong>.env</strong> file, after <code>DISFUSE_SECURE_BOT_TOKEN=</code>, before you run the bot.
                {!can("secrets.view") && " The project's secrets aren't included either."}
              </div>
            </div>
          ) : (
            <p style={{ margin: 0, color: "var(--dfb-faint)", fontSize: "0.8rem" }}>
              The ZIP includes {can("secrets.view") ? "the bot token and secrets" : "the bot token"} in a .env file. Don't share it with anyone.
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
