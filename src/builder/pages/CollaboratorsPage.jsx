import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../../styles/builder/collaborators.css";

import api, { data, errorMessage } from "../../api/client.js";
import PermissionEditor, { permissionSummary } from "../components/collaborators/PermissionEditor.jsx";
import PageLayout, { PageHeader, Section } from "../components/layout/PageLayout.jsx";
import { PRESETS, cleanPermissionList } from "../model/permissions.js";
import { useBuilder } from "../state/BuilderProvider.jsx";
import { builderApi } from "../state/api.js";
import { Badge, Button, EmptyState, SearchInput, Skeleton, confirm, toast } from "../ui/index.js";
import { DOCS } from "../../config/docs.js";

/* =====================================================================
   Collaborators
   ---------------------------------------------------------------------
   /workspace/collaborators: who's working on this bot and exactly what
   each of them can do.

   The owner invites people (searching DisFuse by username), picks their
   permissions as they're added, changes them later and removes people.
   A collaborator can do the same if the owner gave them the matching
   permission, but only with permissions they have themselves. Anyone on
   the project can see the list, and a collaborator can leave from here.

   Saved straight away through the collaborator routes, not the
   builder's autosave: who's on a project isn't part of its commands and
   events. Each call answers with the whole list again.
   ===================================================================== */

const SEARCH_DEBOUNCE_MS = 250;
const DEFAULT_PRESET = PRESETS.find((preset) => preset.id === "build");

function avatarOf(user) {
  if (user?.avatar) return user.avatar;
  const index = user?.id ? Number(BigInt(user.id) >> 22n) % 6 : 0;
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
}

function Person({ user, children, badges }) {
  return (
    <div className="dfb-person">
      <img className="dfb-person__avatar" src={avatarOf(user)} alt="" />
      <div className="dfb-person__who">
        <span className="dfb-person__name">
          {user.displayName || user.username}
          {badges}
        </span>
        <span className="dfb-person__handle">@{user.username}</span>
      </div>
      {children && <div className="dfb-person__actions">{children}</div>}
    </div>
  );
}

/* ---- Inviting ---------------------------------------------------------- */

function InviteSection({ list, onInvited, allowed }) {
  const { projectId } = useBuilder();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [chosen, setChosen] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [sending, setSending] = useState(false);
  const timer = useRef(null);

  /* What a new collaborator starts with: "Can build", cut down to what
     the person inviting may give. */
  const startingPermissions = useCallback(() => cleanPermissionList(DEFAULT_PRESET.permissions.filter((id) => !allowed || allowed.includes(id))), [allowed]);

  useEffect(() => {
    const term = query.trim();
    clearTimeout(timer.current);
    setSearchError(null);

    if (term.length < 2) {
      setResults([]);
      setSearching(false);
      return undefined;
    }

    setSearching(true);
    const controller = new AbortController();
    timer.current = setTimeout(async () => {
      try {
        const found = await api.get("/users", { params: { search: term }, signal: controller.signal }).then(data);
        setResults(found);
      } catch (error) {
        if (!controller.signal.aborted) setSearchError(errorMessage(error, "Couldn't search for people."));
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer.current);
      controller.abort();
    };
  }, [query]);

  const statusOf = (user) => {
    if (user.id === list.owner.id) return "Owner";
    if (list.collaborators.some((c) => c.id === user.id)) return "Already added";
    return null;
  };

  const choose = (user) => {
    setChosen(user);
    setPermissions(startingPermissions());
    setQuery("");
    setResults([]);
  };

  const send = async () => {
    setSending(true);
    try {
      const updated = await builderApi.inviteCollaborator(projectId, { userId: chosen.id, permissions });
      onInvited(updated);
      toast.success(`${chosen.displayName || chosen.username} was added`, { detail: "They'll get a notification about it." });
      setChosen(null);
    } catch (error) {
      toast.error("Couldn't add them", { detail: errorMessage(error, "Try again in a moment.") });
    } finally {
      setSending(false);
    }
  };

  const full = list.collaborators.length >= list.limit;

  return (
    <Section
      title="Invite someone"
      icon="fa-solid fa-user-plus"
      description="Find people by their DisFuse username, then choose what they can do. You can change it any time."
      className="dfb-invite"
    >
      {full ? (
        <div className="dfb-note dfb-note--amber">
          <i className="fa-solid fa-users" aria-hidden />
          <div>This project has the most collaborators it can have ({list.limit}). Remove someone to invite someone new.</div>
        </div>
      ) : chosen ? (
        <div className="dfb-invite__draft">
          <Person user={chosen}>
            <Button variant="ghost" size="sm" icon="fa-solid fa-arrow-left" onClick={() => setChosen(null)} disabled={sending}>
              Choose someone else
            </Button>
          </Person>
          <h3 className="dfb-invite__question">What can they do?</h3>
          <PermissionEditor value={permissions} onChange={setPermissions} allowed={allowed} />
          <div className="dfb-invite__foot">
            <span className="dfb-invite__summary">
              <i className="fa-solid fa-shield-halved" aria-hidden /> {permissionSummary(permissions)}
            </span>
            <Button variant="ghost" onClick={() => setChosen(null)} disabled={sending}>
              Cancel
            </Button>
            <Button variant="primary" icon="fa-solid fa-paper-plane" loading={sending} onClick={send}>
              Add to project
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="dfb-invite__search">
            <SearchInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by username" aria-label="Search for someone to invite" autoComplete="off" />
            {searching && <span className="dfb-spinner dfb-invite__spinner" aria-label="Searching" />}
          </div>

          {searchError && <p className="dfb-field__error">{searchError}</p>}

          {results.length > 0 && (
            <ul className="dfb-invite__results" aria-label="People found">
              {results.map((user) => {
                const status = statusOf(user);
                return (
                  <li key={user.id}>
                    <Person user={user}>
                      {status ? (
                        <Badge>{status}</Badge>
                      ) : (
                        <Button size="sm" variant="secondary" icon="fa-solid fa-plus" onClick={() => choose(user)}>
                          Choose
                        </Button>
                      )}
                    </Person>
                  </li>
                );
              })}
            </ul>
          )}

          {query.trim().length >= 2 && !searching && !searchError && results.length === 0 && (
            <p className="dfb-invite__none">Nobody on DisFuse is called “{query.trim()}”. They need to have signed in to DisFuse at least once.</p>
          )}
        </>
      )}
    </Section>
  );
}

/* ---- One person on the project ---------------------------------------- */

function CollaboratorRow({ person, isYou, canEdit, canRemove, allowed, onSaved, onRemove, onLeave, index }) {
  const { projectId } = useBuilder();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(person.permissions);
  const [saving, setSaving] = useState(false);

  /* Someone else may have changed them meanwhile. */
  useEffect(() => {
    if (!open) setDraft(person.permissions);
  }, [open, person.permissions]);

  const dirty = cleanPermissionList(draft).join() !== cleanPermissionList(person.permissions).join();

  const save = async () => {
    setSaving(true);
    try {
      const updated = await builderApi.updateCollaborator(projectId, { userId: person.id, permissions: draft });
      onSaved(updated);
      toast.success(`${person.displayName || person.username}'s permissions were saved`);
      setOpen(false);
    } catch (error) {
      toast.error("Couldn't save their permissions", { detail: errorMessage(error, "Try again in a moment.") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <li className={`dfb-member ${open ? "dfb-member--open" : ""}`} style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}>
      <Person
        user={person}
        badges={
          <>
            {isYou && <Badge tone="violet">You</Badge>}
            {person.missing && <Badge tone="amber">Account deleted</Badge>}
          </>
        }
      >
        <span className="dfb-member__summary">{permissionSummary(person.permissions)}</span>
        <Button size="sm" variant="ghost" icon={open ? "fa-solid fa-chevron-up" : canEdit ? "fa-solid fa-sliders" : "fa-solid fa-eye"} onClick={() => setOpen((on) => !on)} aria-expanded={open}>
          {open ? "Close" : canEdit ? "Permissions" : isYou ? "Your permissions" : "See permissions"}
        </Button>
        {isYou ? (
          <Button size="sm" variant="danger" icon="fa-solid fa-right-from-bracket" onClick={onLeave}>
            Leave
          </Button>
        ) : (
          canRemove && (
            <Button size="sm" variant="danger" icon="fa-solid fa-user-minus" onClick={() => onRemove(person)}>
              Remove
            </Button>
          )
        )}
      </Person>

      {open && (
        <div className="dfb-member__body">
          <PermissionEditor value={canEdit ? draft : person.permissions} onChange={canEdit ? setDraft : undefined} allowed={allowed} />
          {canEdit && (
            <div className="dfb-invite__foot">
              <span className="dfb-invite__summary">
                <i className="fa-solid fa-shield-halved" aria-hidden /> {permissionSummary(draft)}
              </span>
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button variant="primary" icon="fa-solid fa-check" loading={saving} disabled={!dirty} onClick={save}>
                Save permissions
              </Button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

/* ---- The page ---------------------------------------------------------- */

export default function CollaboratorsPage() {
  const { projectId, project, readOnly, patchProject, setAccess, setMemberCount } = useBuilder();
  const navigate = useNavigate();
  const [list, setList] = useState(null);
  const [error, setError] = useState(null);

  /** Takes a fresh list from the API and tells the rest of the builder. */
  const take = useCallback(
    (next) => {
      setList(next);
      patchProject({ collaborators: next.collaborators.map((c) => c.id) });
      setMemberCount(next.collaborators.length);
      if (next.you) setAccess({ isOwner: next.you.isOwner, isCollaborator: next.you.isCollaborator, permissions: next.you.permissions });
    },
    [patchProject, setAccess, setMemberCount],
  );

  const load = useCallback(async () => {
    setError(null);
    try {
      take(await builderApi.collaborators(projectId));
    } catch (loadError) {
      setError(errorMessage(loadError, "Couldn't load the collaborators."));
    }
  }, [projectId, take]);

  useEffect(() => {
    load();
  }, [load]);

  const you = list?.you;
  const isOwner = Boolean(you?.isOwner);
  const has = (id) => isOwner || Boolean(you?.permissions?.includes(id));
  /* A collaborator managing people can only hand out what they hold. */
  const allowed = isOwner ? null : you?.permissions ?? [];
  const canInvite = !readOnly && has("collaborators.invite");

  const remove = async (person) => {
    const name = person.displayName || person.username;
    const sure = await confirm({
      title: `Remove ${name}?`,
      message: "They won't be able to open this project anymore. You can invite them again later.",
      confirmLabel: "Remove",
      danger: true,
    });
    if (!sure) return;
    try {
      take(await builderApi.removeCollaborator(projectId, { userId: person.id }));
      toast.success(`${name} was removed`);
    } catch (removeError) {
      toast.error("Couldn't remove them", { detail: errorMessage(removeError, "Try again in a moment.") });
    }
  };

  const leave = async () => {
    const sure = await confirm({
      title: "Leave this project?",
      message: "You won't be able to open it anymore unless someone invites you again.",
      confirmLabel: "Leave project",
      danger: true,
    });
    if (!sure) return;
    try {
      await builderApi.removeCollaborator(projectId, { userId: you.id });
      toast.success(`You left ${project.name}`);
      navigate("/projects");
    } catch (leaveError) {
      toast.error("Couldn't leave the project", { detail: errorMessage(leaveError, "Try again in a moment.") });
    }
  };

  return (
    <PageLayout crumbs={[{ label: "Collaborators", icon: "fa-solid fa-user-group" }]}>
      <PageHeader
        docs={DOCS.builderCollaborators}
        icon="fa-solid fa-user-group"
        color="linear-gradient(135deg, #ff6fa8, #8b6cff)"
        title="Collaborators"
        subtitle={
          isOwner || !list
            ? "Build this bot together. Everyone you add can open the project and see all of it, and can change exactly what you allow."
            : "Everyone working on this bot, and what each person can do."
        }
      />

      {error ? (
        <EmptyState
          icon="fa-solid fa-plug-circle-xmark"
          title="We couldn't load this"
          action={
            <Button variant="primary" onClick={load}>
              Try again
            </Button>
          }
        >
          {error}
        </EmptyState>
      ) : !list ? (
        <Section>
          <div className="dfb-stack">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height={58} radius={16} />
            ))}
          </div>
        </Section>
      ) : (
        <>
          {canInvite && <InviteSection list={list} onInvited={take} allowed={allowed} />}

          <Section
            title="On this project"
            icon="fa-solid fa-users"
            actions={<Badge>{list.collaborators.length + 1}</Badge>}
            description={
              isOwner
                ? "Open someone's permissions to change what they can do."
                : `You can do ${you.permissions.length} of the things the owner can. Ask them if you need more.`
            }
          >
            <ul className="dfb-members">
              <li className="dfb-member dfb-member--owner">
                <Person
                  user={list.owner}
                  badges={
                    <>
                      <Badge tone="amber" icon="fa-solid fa-crown">
                        Owner
                      </Badge>
                      {isOwner && <Badge tone="violet">You</Badge>}
                    </>
                  }
                >
                  <span className="dfb-member__summary">Can do everything</span>
                </Person>
              </li>
              {list.collaborators.map((person, index) => {
                const isYou = person.id === you.id;
                return (
                  <CollaboratorRow
                    key={person.id}
                    index={index}
                    person={person}
                    isYou={isYou}
                    canEdit={!readOnly && !isYou && has("collaborators.permissions")}
                    canRemove={!readOnly && has("collaborators.remove")}
                    allowed={allowed}
                    onSaved={take}
                    onRemove={remove}
                    onLeave={leave}
                  />
                );
              })}
            </ul>

            {list.collaborators.length === 0 && (
              <EmptyState icon="fa-solid fa-user-plus" color="linear-gradient(135deg, #ff6fa8, #8b6cff)" title="Just you so far">
                {canInvite ? "Search above to add someone. They'll get a notification in their DisFuse inbox, and a Discord DM if they have those turned on." : "Nobody else is on this project yet."}
              </EmptyState>
            )}
          </Section>

          {isOwner && (
            <div className="dfb-note" style={{ marginTop: 22 }}>
              <i className="fa-solid fa-lock" aria-hidden />
              <div>
                Collaborators never get the bot token or your secrets unless you give them the permission for it, and only you can delete the project or use Control. Someone you allow to invite or manage people can only pass on
                permissions they have themselves.
              </div>
            </div>
          )}
        </>
      )}
    </PageLayout>
  );
}
