import { useEffect, useMemo, useRef, useState } from "react";

import api, { data, errorMessage } from "../../api/client.js";
import WorkspaceModal, { ModalEmpty, ModalError } from "./WorkspaceModal.jsx";

import "../../styles/workspace/secrets-modal.css";

/* =====================================================================
   Secrets
   ---------------------------------------------------------------------
   Environment values the generated bot reads at runtime — API keys and
   the like — so they never end up inside the blocks.

   The previous version read its inputs with `document.querySelector`,
   pushed straight into `project.secrets` before the request had
   succeeded, and wrote validation messages by assigning `innerHTML`. All
   of it is React state now, which is what makes the redesign safe: the
   old markup could not be restyled without breaking the code that
   reached into it by class name.
   ===================================================================== */

/** Never renders a real value; length is enough to recognise it by. */
function mask(value = "") {
  return "•".repeat(Math.min(value.length, 24));
}

export default function SecretsModal({
  open,
  project,
  canManage,
  onClose,
  onSave,
}) {
  const [secrets, setSecrets] = useState([]);
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [revealed, setRevealed] = useState(() => new Set());
  const [copied, setCopied] = useState(null);

  const nameInput = useRef(null);
  const copyTimer = useRef(null);

  useEffect(() => {
    setSecrets(project?.secrets ?? []);
  }, [project?.secrets]);

  /* A closed dialog shouldn't keep a half-typed key, and it certainly
     shouldn't keep a value revealed. */
  useEffect(() => {
    if (open) return;

    setName("");
    setValue("");
    setError(null);
    setRevealed(new Set());
  }, [open]);

  useEffect(() => () => clearTimeout(copyTimer.current), []);

  const duplicate = useMemo(
    () =>
      secrets.some(
        (secret) => secret.name.toLowerCase() === name.trim().toLowerCase(),
      ),
    [name, secrets],
  );

  async function persist(next, { clearForm = false } = {}) {
    setSaving(true);
    setError(null);

    try {
      const updated = await api
        .patch(`/projects/${project._id}/secrets`, { secrets: next })
        .then(data);

      setSecrets(updated.secrets ?? []);
      onSave?.(updated);

      if (clearForm) {
        setName("");
        setValue("");
        nameInput.current?.focus();
      }
    } catch (requestError) {
      setError(errorMessage(requestError, "Couldn't save that secret."));
    } finally {
      setSaving(false);
    }
  }

  function add(event) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName.length || !value.length)
      return setError("A secret needs both a name and a value.");

    if (duplicate) return setError("You already have a secret with that name.");

    persist([...secrets, { name: trimmedName, value }], { clearForm: true });
  }

  function remove(index) {
    persist(secrets.filter((_, position) => position !== index));
  }

  function copy(secret) {
    navigator.clipboard?.writeText(secret.value);

    setCopied(secret.name);
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(null), 1400);
  }

  function toggleReveal(secretName) {
    setRevealed((current) => {
      const next = new Set(current);

      if (next.has(secretName)) next.delete(secretName);
      else next.add(secretName);

      return next;
    });
  }

  return (
    <WorkspaceModal
      open={open}
      onClose={onClose}
      icon="fa-solid fa-key"
      title="Secrets"
      subtitle="Values your bot reads at runtime, kept out of your blocks"
    >
      {!canManage ? (
        <ModalEmpty icon="fa-solid fa-lock" title="Only the owner can see these">
          Secrets hold credentials, so they're never sent to collaborators.
        </ModalEmpty>
      ) : (
        <>
          {error && <ModalError onRetry={null}>{error}</ModalError>}

          {secrets.length === 0 ? (
            <ModalEmpty
              icon="fa-solid fa-key"
              title="No secrets yet"
            >
              Add one below, then use the “secret” block to read it in your bot.
            </ModalEmpty>
          ) : (
            <ul className="df-secrets-list">
              {secrets.map((secret, index) => (
                <li key={secret.name} className="df-secret">
                  <div className="df-secret-text">
                    <span className="df-secret-name">{secret.name}</span>
                    <span className="df-secret-value">
                      {revealed.has(secret.name)
                        ? secret.value
                        : mask(secret.value)}
                    </span>
                  </div>

                  <div className="df-secret-actions">
                    <button
                      type="button"
                      onClick={() => toggleReveal(secret.name)}
                      title={revealed.has(secret.name) ? "Hide" : "Reveal"}
                      aria-label={
                        revealed.has(secret.name)
                          ? `Hide ${secret.name}`
                          : `Reveal ${secret.name}`
                      }
                    >
                      <i
                        className={`fa-solid ${
                          revealed.has(secret.name) ? "fa-eye-slash" : "fa-eye"
                        }`}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => copy(secret)}
                      title="Copy value"
                      aria-label={`Copy ${secret.name}`}
                      className={copied === secret.name ? "done" : ""}
                    >
                      <i
                        className={`fa-solid ${
                          copied === secret.name ? "fa-check" : "fa-copy"
                        }`}
                      />
                    </button>

                    <button
                      type="button"
                      className="danger"
                      onClick={() => remove(index)}
                      disabled={saving}
                      title="Delete"
                      aria-label={`Delete ${secret.name}`}
                    >
                      <i className="fa-solid fa-trash" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <form className="df-secret-form" onSubmit={add}>
            <h3>Add a secret</h3>

            <div className="df-secret-fields">
              <input
                ref={nameInput}
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="NAME"
                aria-label="Secret name"
                autoComplete="off"
                spellCheck="false"
              />
              <input
                type="password"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="Value"
                aria-label="Secret value"
                autoComplete="off"
              />
              <button
                type="submit"
                className="df-primary-btn"
                disabled={saving || !name.trim().length || !value.length}
              >
                {saving ? (
                  <i className="fa-solid fa-circle-notch fa-spin" />
                ) : (
                  <i className="fa-solid fa-plus" />
                )}
                Add
              </button>
            </div>

            {duplicate && name.trim().length > 0 && (
              <p className="df-secret-hint">
                You already have a secret called “{name.trim()}”.
              </p>
            )}
          </form>
        </>
      )}
    </WorkspaceModal>
  );
}
