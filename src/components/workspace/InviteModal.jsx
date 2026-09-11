import { useCallback, useEffect, useRef, useState } from "react";

import api, { data, errorMessage } from "../../api/client.js";
import WorkspaceModal, {
  ModalEmpty,
  ModalError,
  ModalLoading,
} from "./WorkspaceModal.jsx";

import "../../styles/workspace/invite-modal.css";

import { DOCS } from "../../config/docs.js";

/* =====================================================================
   Collaborators
   ---------------------------------------------------------------------
   Who else may edit this project.

   Two things changed beyond the styling.

   It no longer downloads the entire user table. The old version fetched
   `GET /users` — every account on DisFuse, unauthenticated, refetched
   whenever the collaborator list changed — purely to populate a
   `<datalist>`. It now searches as you type and resolves the existing
   collaborators by id.

   And it no longer opens itself by reaching across the tree for
   `document.querySelector("button.invite").addEventListener(...)` — in
   an effect with no cleanup, so a listener was added every time the
   project changed and one click fired the handler several times over.
   ===================================================================== */

const SEARCH_DEBOUNCE_MS = 250;

export default function InviteModal({ open, project, onClose, onSave }) {
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const searchTimer = useRef(null);

  /** Turns the stored ids into people, once, when the dialog opens. */
  const loadCollaborators = useCallback(async () => {
    const ids = project?.collaborators ?? [];

    if (!ids.length) {
      setCollaborators([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const found = await api
        .get("/users", { params: { ids: ids.join(",") } })
        .then(data);

      /* An id with no account behind it any more still has to be
         listed — otherwise saving would silently drop it. */
      setCollaborators(
        ids.map(
          (id) =>
            found.find((user) => user.id === id) ?? {
              id,
              username: "unknown user",
              displayName: "Unknown user",
            },
        ),
      );
    } catch (requestError) {
      setError(errorMessage(requestError, "Couldn't load the collaborators."));
    } finally {
      setLoading(false);
    }
  }, [project?.collaborators]);

  useEffect(() => {
    if (!open) return;

    setDirty(false);
    setQuery("");
    setResults([]);
    loadCollaborators();
  }, [loadCollaborators, open]);

  /* ---- Searching ---------------------------------------------------- */

  useEffect(() => {
    const term = query.trim();

    clearTimeout(searchTimer.current);

    if (term.length < 2) {
      setResults([]);
      setSearching(false);
      return undefined;
    }

    setSearching(true);

    const controller = new AbortController();

    searchTimer.current = setTimeout(async () => {
      try {
        const found = await api
          .get("/users", { params: { search: term }, signal: controller.signal })
          .then(data);

        setResults(found);
      } catch (requestError) {
        if (!controller.signal.aborted)
          setError(errorMessage(requestError, "Couldn't search for users."));
      } finally {
        setSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(searchTimer.current);
      controller.abort();
    };
  }, [query]);

  const alreadyIn = (id) =>
    id === project?.owner?.id || collaborators.some((user) => user.id === id);

  function add(user) {
    setCollaborators((current) => [...current, user]);
    setDirty(true);
    setQuery("");
    setResults([]);
  }

  function remove(id) {
    setCollaborators((current) => current.filter((user) => user.id !== id));
    setDirty(true);
  }

  async function save() {
    setSaving(true);
    setError(null);

    try {
      const updated = await api
        .patch(`/projects/${project._id}/collaborators`, {
          collaborators: collaborators.map((user) => user.id),
        })
        .then(data);

      onSave?.(updated);
      setDirty(false);
      onClose?.();
    } catch (requestError) {
      setError(errorMessage(requestError, "Couldn't save the collaborators."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <WorkspaceModal
      open={open}
      onClose={onClose}
      icon="fa-solid fa-user-group"
      title="Collaborators"
      subtitle="People who can open and edit this project with you"
      docsPage={DOCS.collaboration}
      footer={
        <>
          <button type="button" className="df-modal-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="df-primary-btn"
            onClick={save}
            disabled={saving || !dirty}
          >
            {saving && <i className="fa-solid fa-circle-notch fa-spin" />}
            Save changes
          </button>
        </>
      }
    >
      {error && <ModalError onRetry={loadCollaborators}>{error}</ModalError>}

      <div className="df-invite-search">
        <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by username…"
          aria-label="Search for a user to add"
          autoComplete="off"
        />
        {searching && <i className="fa-solid fa-circle-notch fa-spin" />}
      </div>

      {results.length > 0 && (
        <ul className="df-invite-results">
          {results.map((user) => (
            <li key={user.id}>
              <img src={user.avatar} alt="" />
              <div>
                <strong>{user.displayName || user.username}</strong>
                <span>@{user.username}</span>
              </div>
              <button
                type="button"
                className="df-primary-btn small"
                onClick={() => add(user)}
                disabled={alreadyIn(user.id)}
              >
                {user.id === project?.owner?.id
                  ? "Owner"
                  : alreadyIn(user.id)
                    ? "Added"
                    : "Add"}
              </button>
            </li>
          ))}
        </ul>
      )}

      {query.trim().length >= 2 && !searching && results.length === 0 && (
        <p className="df-invite-none">No users matched “{query.trim()}”.</p>
      )}

      <h3 className="df-invite-heading">
        On this project
        <span>{collaborators.length}</span>
      </h3>

      {loading ? (
        <ModalLoading label="Loading collaborators…" />
      ) : collaborators.length === 0 ? (
        <ModalEmpty icon="fa-solid fa-user-plus" title="No collaborators yet">
          Search above to invite someone. They'll be able to edit this project's
          blocks, but not its secrets or its bot token.
        </ModalEmpty>
      ) : (
        <ul className="df-invite-list">
          {collaborators.map((user) => (
            <li key={user.id}>
              <img src={user.avatar} alt="" />
              <div>
                <strong>{user.displayName || user.username}</strong>
                <span>@{user.username}</span>
              </div>
              <button
                type="button"
                className="df-invite-remove"
                onClick={() => remove(user.id)}
                title="Remove"
                aria-label={`Remove ${user.username}`}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </WorkspaceModal>
  );
}
