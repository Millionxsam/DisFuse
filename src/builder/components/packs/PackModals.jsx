import { useEffect, useState } from "react";

import { errorMessage } from "../../../api/client.js";
import { parseVersion, versionIsHigher } from "../../model/packs.js";
import { Badge, Button, ColorInput, Field, Modal, NumberInput, TextArea, TextInput, Toggle } from "../../ui/index.js";
import { savePackDetails } from "./packApi.js";

/* =====================================================================
   The pack's details, and publishing it
   ---------------------------------------------------------------------
   The same settings a block pack's Configure dialog has (name,
   description, npm packages, color) plus who can see it, and the same
   publish rules: a higher version and a changelog, and nothing that
   would break projects already using the last version.
   ===================================================================== */

export function PackDetailsModal({ open, onClose, pack, onSaved }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm({
      name: pack.name ?? "",
      description: pack.description ?? "",
      color: (pack.color || "#014f98").toUpperCase(),
      dependencies: (pack.dependencies ?? []).join(", "),
      private: Boolean(pack.private),
    });
  }, [open, pack]);

  if (!form) return null;
  const set = (fields) => setForm((current) => ({ ...current, ...fields }));

  const nameError = form.name.trim().length < 3 ? "At least 3 characters." : null;
  const descriptionError = form.description.trim().length < 15 ? "At least 15 characters." : null;
  const colorError = /^#[0-9A-F]{6}$/i.test(form.color) ? null : "A color like #014F98.";

  const save = async () => {
    if (nameError || descriptionError || colorError) return;
    setSaving(true);
    setError(null);
    try {
      const saved = await savePackDetails(pack._id, {
        name: form.name.trim(),
        description: form.description,
        color: form.color,
        private: form.private,
        dependencies: form.dependencies
          .split(",")
          .map((d) => d.trim())
          .filter(Boolean),
      });
      onSaved(saved);
      onClose();
    } catch (failure) {
      setError(errorMessage(failure, "Couldn't save the pack. Try again."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Pack details"
      subtitle="How your pack shows up in the Workshop and in people's projects."
      icon="fa-solid fa-sliders"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save} loading={saving} disabled={Boolean(nameError || descriptionError || colorError)}>
            Save
          </Button>
        </>
      }
    >
      <div className="dfb-pack-form">
        <Field label="Name" error={form.name && nameError} counter={{ value: form.name.length, max: 12 }}>
          <TextInput value={form.name} maxLength={12} onChange={(event) => set({ name: event.target.value })} />
        </Field>
        <Field label="Description" error={form.description && descriptionError} help="What's in your pack. Markdown works.">
          <TextArea value={form.description} maxLength={2000} minRows={4} onChange={(event) => set({ description: event.target.value })} />
        </Field>
        <Field label="Color" error={colorError} help="The color of your pack's category in people's pickers.">
          <ColorInput value={form.color} onChange={(color) => set({ color })} />
        </Field>
        <Field
          label="npm packages"
          optional
          help={
            <>
              Packages your pack needs, split by commas. They're added to the bot's package.json. Require them in your pack's shared code, like{" "}
              <code>{'const axios = require("axios");'}</code>
            </>
          }
        >
          <TextArea value={form.dependencies} placeholder="axios, lodash" style={{ fontFamily: "var(--dfb-mono)" }} onChange={(event) => set({ dependencies: event.target.value })} />
        </Field>
        <Toggle checked={form.private} onChange={(value) => set({ private: value })} label="Private: only you can see and install it" />
        {error && (
          <p className="dfb-field__error" role="alert">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}

function nextVersion(latest) {
  const parts = parseVersion(latest);
  if (!parts) return [1, 0, 0];
  return [parts[0], parts[1], parts[2] + 1];
}

/**
 * @param {object} props
 * @param {object[]} props.problems  from packProblems(): publishing waits until there are none
 * @param {(fields: { version, changelog }) => Promise<object>} props.onPublish
 */
export function PublishModal({ open, onClose, pack, problems, breaking = [], onRestore, onPublish, onShowProblem }) {
  const latest = pack.versions?.[pack.versions.length - 1];
  const [version, setVersion] = useState([1, 0, 0]);
  const [changelog, setChangelog] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setVersion(nextVersion(latest?.version));
    setChangelog(latest ? "" : "First release.");
    setError(null);
  }, [open, latest]);

  const text = version.map((n) => (Number.isFinite(n) ? n : 0)).join(".");
  const versionError = versionIsHigher(text, latest?.version) ? null : `Must be higher than v${latest?.version ?? "0.0.0"}.`;
  const changelogError = changelog.trim().length < 10 ? "At least 10 characters." : null;
  const blocked = problems.length > 0 || breaking.length > 0;

  const publish = async () => {
    if (blocked || versionError || changelogError) return;
    setPublishing(true);
    setError(null);
    try {
      await onPublish({ version: text, changelog: changelog.trim() });
      onClose();
    } catch (failure) {
      const errors = failure?.response?.data?.errors;
      setError({
        message: errorMessage(failure, "Couldn't publish the pack. Try again."),
        list: Array.isArray(errors) ? errors : [],
      });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Publish your pack"
      subtitle={latest ? `People using v${latest.version} get the new version the next time they open a project.` : "Once it's published, people can install it from the Workshop."}
      icon="fa-solid fa-upload"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" icon="fa-solid fa-upload" onClick={publish} loading={publishing} disabled={blocked || Boolean(versionError || changelogError)}>
            Publish v{text}
          </Button>
        </>
      }
    >
      {breaking.length > 0 && (
        <div className="dfb-pack-problems dfb-pack-problems--error" style={{ marginTop: 0, marginBottom: 12 }}>
          <b>These would break projects using v{latest?.version}</b>
          <ul>
            {breaking.map(([name, message], index) => (
              <li key={index}>
                <b>{name}</b>: {message}
              </li>
            ))}
          </ul>
          <div>
            <Button size="sm" icon="fa-solid fa-rotate-left" onClick={onRestore}>
              Put them back
            </Button>
          </div>
        </div>
      )}
      {problems.length > 0 ? (
        <div className="dfb-pack-problems">
          <Badge tone="amber" icon="fa-solid fa-triangle-exclamation">
            Fix these first
          </Badge>
          <ul>
            {problems.slice(0, 12).map((problem, index) => (
              <li key={index}>
                {problem.id ? (
                  <button type="button" className="dfb-pack-link" onClick={() => onShowProblem(problem)}>
                    {problem.label}
                  </button>
                ) : (
                  <b>{problem.label}</b>
                )}
                : {problem.message}
              </li>
            ))}
          </ul>
          {problems.length > 12 && <p className="dfb-pack-hint">And {problems.length - 12} more.</p>}
        </div>
      ) : breaking.length > 0 ? null : (
        <div className="dfb-pack-form">
          <Field label="Version" error={versionError} help={latest ? `The last one was v${latest.version}.` : "Most first versions are 1.0.0."}>
            <div className="dfb-pack-version">
              {version.map((part, index) => (
                <span key={index} className="dfb-pack-version__part">
                  {index > 0 && <b aria-hidden>.</b>}
                  <NumberInput
                    value={part}
                    min={0}
                    integer
                    aria-label={["Major", "Minor", "Patch"][index]}
                    onChange={(n) => setVersion((current) => current.map((p, i) => (i === index ? Math.max(0, n ?? 0) : p)))}
                  />
                </span>
              ))}
            </div>
          </Field>
          <Field label="What changed" error={changelog && changelogError} counter={{ value: changelog.length, max: 1000 }}>
            <TextArea value={changelog} maxLength={1000} minRows={4} placeholder="Describe your changes..." onChange={(event) => setChangelog(event.target.value)} />
          </Field>
          <p className="dfb-pack-hint">
            <i className="fa-solid fa-shield-halved" aria-hidden /> To keep people's projects working, a new version can't remove an event, step, value, input or section that the last one had, or change the type a value gives.
          </p>
        </div>
      )}
      {error && (
        <div className="dfb-pack-problems dfb-pack-problems--error" role="alert">
          <b>{error.message}</b>
          {error.list.length > 0 && (
            <ul>
              {error.list.map(([name, message], index) => (
                <li key={index}>
                  <b>{name}</b>: {message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Modal>
  );
}
