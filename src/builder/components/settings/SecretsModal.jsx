import { useEffect, useRef, useState } from "react";

import api, { data, errorMessage } from "../../../api/client.js";
import { useBuilder } from "../../state/BuilderProvider.jsx";
import { Button, EmptyState, Field, IconButton, Modal, TextInput, confirm, promptText, toast } from "../../ui/index.js";

/* =====================================================================
   Secrets
   ---------------------------------------------------------------------
   Private values the bot needs, like API keys. They're saved on the
   project (the API only sends them to its owner, and to collaborators
   allowed to see them), written to the .env file when the bot is
   exported, and read with the Secret value, so a key never has to be
   typed into a step.

   Changes save straight away through PATCH /projects/:id/secrets rather
   than the builder's autosave, because secrets belong to the project,
   not to its commands and events.
   ===================================================================== */

/* The .env file already uses this one for the bot's token. */
const RESERVED = "DISFUSE_SECURE_BOT_TOKEN";

const MASK = "•".repeat(12);

/** Spaces and dashes become underscores as a name is typed. */
export const tidySecretName = (text) => text.replace(/[\s-]+/g, "_");

/** Why a secret can't have this name, or null when it can. */
export function secretNameProblem(name, secrets = []) {
  if (!name) return "Give the secret a name.";
  if (/^[0-9]/.test(name)) return "A name can't start with a number.";
  if (!/^[A-Za-z0-9_]+$/.test(name)) return "Use only letters, numbers and underscores.";
  if (name.toUpperCase() === RESERVED) return "Your bot's token already uses that name.";
  if (secrets.some((secret) => secret.name.toLowerCase() === name.toLowerCase())) return "You already have a secret with that name.";
  return null;
}

function SecretRow({ secret, index, canEdit, canDelete, busy, onChangeValue, onDelete }) {
  const [shown, setShown] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(secret.value);
      toast.success(`${secret.name} copied`);
    } catch {
      toast.error("Couldn't copy the value");
    }
  };

  return (
    <li className="dfb-secret" style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}>
      <span className="dfb-secret__icon">
        <i className="fa-solid fa-key" aria-hidden />
      </span>
      <span className="dfb-secret__text">
        <code className="dfb-secret__name">{secret.name}</code>
        <span className={`dfb-secret__value ${shown ? "" : "dfb-secret__value--hidden"}`}>{shown ? secret.value : MASK}</span>
      </span>
      <span className="dfb-secret__actions">
        <IconButton size="sm" icon={shown ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"} label={shown ? "Hide the value" : "Show the value"} onClick={() => setShown((on) => !on)} />
        <IconButton size="sm" icon="fa-regular fa-copy" label="Copy the value" onClick={copy} />
        {canEdit && <IconButton size="sm" icon="fa-solid fa-pen" label="Change the value" disabled={busy} onClick={() => onChangeValue(secret)} />}
        {canDelete && <IconButton size="sm" icon="fa-solid fa-trash" tone="danger" label="Delete" disabled={busy} onClick={() => onDelete(secret)} />}
      </span>
    </li>
  );
}

/** onAdded(name) is called after a new secret is saved. */
export default function SecretsModal({ open, onClose, onAdded }) {
  const { project, patchProject, readOnly, isOwner, can } = useBuilder();
  const secrets = project?.secrets ?? [];
  const canAdd = !readOnly && can("secrets.create");
  const canEdit = !readOnly && can("secrets.edit");
  const canDelete = !readOnly && can("secrets.delete");

  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [valueShown, setValueShown] = useState(false);
  const [saving, setSaving] = useState(false);
  const nameInput = useRef(null);

  /* A closed dialog shouldn't keep a half-typed secret. */
  useEffect(() => {
    if (open) return;
    setName("");
    setValue("");
    setValueShown(false);
  }, [open]);

  const nameError = secretNameProblem(name, secrets);

  const save = async (next, done) => {
    setSaving(true);
    try {
      const updated = await api.patch(`/projects/${project._id}/secrets`, { secrets: next }).then(data);
      patchProject({ secrets: updated?.secrets ?? next });
      toast.success(done);
      return true;
    } catch (error) {
      toast.error("Couldn't save your secrets", { detail: errorMessage(error, "Try again in a moment.") });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const add = async (event) => {
    event.preventDefault();
    if (nameError || !value || saving) return;
    const saved = await save([...secrets, { name, value }], `${name} saved`);
    if (!saved) return;
    onAdded?.(name);
    setName("");
    setValue("");
    setValueShown(false);
    nameInput.current?.focus();
  };

  const changeValue = async (secret) => {
    const next = await promptText({
      title: `Change ${secret.name}`,
      icon: "fa-solid fa-key",
      label: "New value",
      placeholder: "Paste the new value",
      confirmLabel: "Save",
      validate: (text) => (text.length ? null : "Give the secret a value."),
    });
    if (next === null || next === secret.value) return;
    save(
      secrets.map((item) => (item.name === secret.name ? { ...item, value: next } : item)),
      `${secret.name} changed`,
    );
  };

  const remove = async (secret) => {
    const sure = await confirm({
      title: `Delete ${secret.name}?`,
      message: "Any Secret value that reads it will be empty once you export your bot again.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!sure) return;
    save(
      secrets.filter((item) => item.name !== secret.name),
      `${secret.name} deleted`,
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Secrets"
      subtitle="Private values your bot uses, like API keys"
      icon="fa-solid fa-user-secret"
      iconColor="linear-gradient(135deg, #ffb648, #e23fe2)"
      size="md"
      initialFocus={canAdd ? nameInput : undefined}
      footer={
        <Button variant="secondary" onClick={onClose}>
          Done
        </Button>
      }
    >
      <div className="dfb-secrets">
        <div className="dfb-note">
          <i className="fa-solid fa-circle-info" aria-hidden />
          <div>
            Keep keys and passwords here instead of typing them into your steps. {isOwner ? "Only you (and collaborators you allow) can see them" : "Only the owner and the collaborators they allow can see them"}, and they go in the .env file when you export your bot. To use one, pick the{" "}
            <strong>Secret</strong> value and type its name.
          </div>
        </div>

        {secrets.length ? (
          <ul className="dfb-secrets__list" aria-label="Your secrets">
            {secrets.map((secret, index) => (
              <SecretRow key={secret.name} secret={secret} index={index} canEdit={canEdit} canDelete={canDelete} busy={saving} onChangeValue={changeValue} onDelete={remove} />
            ))}
          </ul>
        ) : (
          <EmptyState icon="fa-solid fa-key" color="linear-gradient(135deg, #ffb648, #e23fe2)" title="No secrets yet">
            {canAdd ? "Add your first one below." : "This project doesn't have any secrets."}
          </EmptyState>
        )}

        {canAdd && (
          <form className="dfb-secrets__form" onSubmit={add} noValidate>
            <h3 className="dfb-secrets__heading">Add a secret</h3>
            <div className="dfb-secrets__fields">
              <Field label="Name" error={name ? nameError : null} help="Letters, numbers and underscores, like API_KEY.">
                <TextInput
                  ref={nameInput}
                  value={name}
                  placeholder="API_KEY"
                  maxLength={64}
                  invalid={Boolean(name) && Boolean(nameError)}
                  onChange={(event) => setName(tidySecretName(event.target.value))}
                  style={{ fontFamily: "var(--dfb-mono)" }}
                />
              </Field>
              <Field label="Value">
                <div className="dfb-secrets__value">
                  <TextInput
                    type={valueShown ? "text" : "password"}
                    value={value}
                    placeholder="Paste the value"
                    autoComplete="new-password"
                    onChange={(event) => setValue(event.target.value)}
                  />
                  <IconButton icon={valueShown ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"} label={valueShown ? "Hide the value" : "Show the value"} onClick={() => setValueShown((on) => !on)} />
                </div>
              </Field>
            </div>
            <Button type="submit" variant="primary" icon="fa-solid fa-plus" loading={saving} disabled={!name || !value || Boolean(nameError)}>
              Add secret
            </Button>
          </form>
        )}
      </div>
    </Modal>
  );
}
