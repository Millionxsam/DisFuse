import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import Swal from "sweetalert2";

import api, { data, errorMessage } from "../../api/client.js";
import { userCache } from "../../cache.ts";
import modalThemeColor from "../../functions/modalThemeColor.js";

import "../../styles/pages/staff-panel.css";

/* =====================================================================
   Staff Panel
   ---------------------------------------------------------------------
   Moderation: banning people, suspending projects, and telling everyone
   the Terms of Service changed.

   This was the one dashboard page the redesign never reached — it had
   four CSS rules to its name and no style at all for the selected tab,
   so which tab you were on was invisible. It now uses the same vocabulary
   as the rest of the dashboard.

   The behaviour it had is all still here, along with the things it was
   getting wrong:

     - the staff check did nothing. It computed whether the caller was
       staff and then `return`ed inside a `.then` with nothing after it,
       so anyone who typed the URL got the whole panel. (The API refuses
       the actions themselves, which is why this was never noticed.)
     - "Send TOS Change Alert" threw until the staff list had loaded,
       because `staff` started as `[]` and the handler read `staff.users`;
     - three of the four inputs were read out of the DOM by id while the
       other four were controlled React state, in one 330-line file;
     - it downloaded every user in the database to fill an autocomplete.
   ===================================================================== */

const TABS = [
  { id: "users", label: "Users", icon: "fa-solid fa-user" },
  { id: "projects", label: "Projects", icon: "fa-solid fa-cube" },
  { id: "admin", label: "Announcements", icon: "fa-solid fa-bullhorn" },
];

/** Formats a ban date the way the confirmation should read it. */
function describeDate(value) {
  const date = new Date(value);

  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function StaffPanel() {
  const [tab, setTab] = useState("users");
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const modalColors = useMemo(() => modalThemeColor(userCache.user), []);

  /* ---- Who is allowed in ------------------------------------------- */

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const roster = await api.get("/users/staff").then(data);
      setStaff(roster);
    } catch (error) {
      setLoadError(errorMessage(error, "Couldn't load the staff list."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const me = staff?.users?.find((u) => u.id === userCache.user?.id);
  const isModerator = Boolean(me?.moderator || me?.admin || me?.owner);
  const isAdmin = Boolean(me?.admin || me?.owner);

  if (loading)
    return (
      <div className="df-page df-staff-panel">
        <div className="df-staff-loading">
          <i className="fa-solid fa-circle-notch fa-spin" />
          <span>Checking your access…</span>
        </div>
      </div>
    );

  if (loadError)
    return (
      <div className="df-page df-staff-panel">
        <div className="df-staff-blocked">
          <i className="fa-solid fa-triangle-exclamation" />
          <h2>Couldn't load the Staff Panel</h2>
          <p>{loadError}</p>
          <button type="button" className="df-primary-btn" onClick={load}>
            Try again
          </button>
        </div>
      </div>
    );

  /* The API enforces this too. Doing it here as well means a non-staff
     user sees why rather than a row of buttons that all fail. */
  if (!isModerator)
    return (
      <div className="df-page df-staff-panel">
        <Helmet>
          <title>Staff Panel | DisFuse</title>
        </Helmet>
        <div className="df-staff-blocked">
          <i className="fa-solid fa-lock" />
          <h2>Staff only</h2>
          <p>This page is for DisFuse moderators.</p>
        </div>
      </div>
    );

  return (
    <div className="df-page df-staff-panel">
      <Helmet>
        <title>Staff Panel | DisFuse</title>
      </Helmet>

      <div className="df-page-head">
        <h1>
          <i className="fa-solid fa-user-tie" /> Staff Panel
        </h1>
        <p>
          Signed in as <strong>@{me.username}</strong> ·{" "}
          {me.owner ? "Owner" : me.admin ? "Admin" : "Moderator"}
        </p>
      </div>

      <nav className="df-staff-tabs" aria-label="Staff sections">
        {TABS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={tab === entry.id ? "active" : ""}
            onClick={() => setTab(entry.id)}
            aria-current={tab === entry.id ? "page" : undefined}
          >
            <i className={entry.icon} />
            {entry.label}
          </button>
        ))}
      </nav>

      {tab === "users" && <UsersTab modalColors={modalColors} />}
      {tab === "projects" && <ProjectsTab modalColors={modalColors} />}
      {tab === "admin" && (
        <AdminTab isAdmin={isAdmin} modalColors={modalColors} />
      )}
    </div>
  );
}

/* =====================================================================
   Finding a user
   ---------------------------------------------------------------------
   The old panel fetched every account in the database and put all of
   them in a `<datalist>`. This searches instead, which is both a great
   deal less data and the only way it can work now the API bounds what
   `GET /users` returns.
   ===================================================================== */

function UserSearch({ value, onChange, onPick, disabled }) {
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    const term = value.trim();

    clearTimeout(timer.current);

    if (term.length < 2) {
      setResults([]);
      return undefined;
    }

    const controller = new AbortController();
    setSearching(true);

    timer.current = setTimeout(async () => {
      try {
        setResults(
          await api
            .get("/users", {
              params: { search: term },
              signal: controller.signal,
            })
            .then(data),
        );
      } catch {
        /* A failed lookup shouldn't interrupt typing. */
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer.current);
      controller.abort();
    };
  }, [value]);

  return (
    <div className="df-staff-search">
      <div className="df-staff-search-box">
        <i className="fa-solid fa-magnifying-glass" />
        <input
          type="search"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search by username…"
          aria-label="Search for a user"
          autoComplete="off"
        />
        {searching && <i className="fa-solid fa-circle-notch fa-spin" />}
      </div>

      {results.length > 0 && (
        <ul className="df-staff-results">
          {results.map((user) => (
            <li key={user.id}>
              <button type="button" onClick={() => onPick(user)}>
                <img src={user.avatar} alt="" />
                <div>
                  <strong>{user.displayName || user.username}</strong>
                  <span>@{user.username}</span>
                </div>
                <code>{user.id}</code>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** The card wrapper every action in this panel sits in. */
function ActionCard({ icon, title, description, tone, children }) {
  return (
    <section className={`df-staff-panel-card${tone ? ` ${tone}` : ""}`}>
      <header>
        <i className={icon} />
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </header>
      {children}
    </section>
  );
}

/* =====================================================================
   Users
   ===================================================================== */

function UsersTab({ modalColors }) {
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState(null);
  const [until, setUntil] = useState("");
  const [busy, setBusy] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  async function setBan(banUntil, { lifting }) {
    setBusy(true);

    try {
      await api.put(`/users/${target.id}/ban`, { banUntil });

      await Swal.fire({
        ...modalColors,
        icon: "success",
        title: lifting ? "Unbanned" : "Banned",
        text: lifting
          ? `@${target.username} can use DisFuse again.`
          : `@${target.username} is banned until ${describeDate(banUntil)}.`,
      });

      setTarget(null);
      setQuery("");
      setUntil("");
    } catch (error) {
      Swal.fire({
        ...modalColors,
        icon: "error",
        title: "That didn't work",
        text: errorMessage(error, "The ban could not be changed."),
      });
    } finally {
      setBusy(false);
    }
  }

  async function ban() {
    if (!target) return;

    if (!until)
      return void Swal.fire({
        ...modalColors,
        icon: "warning",
        title: "Pick a date",
        text: "Choose the date the ban should end.",
      });

    const banUntil = new Date(`${until}T23:59:59`);

    if (banUntil <= new Date())
      return void Swal.fire({
        ...modalColors,
        icon: "warning",
        title: "That date has already passed",
        text: "Choose a date in the future.",
      });

    const { isConfirmed } = await Swal.fire({
      ...modalColors,
      icon: "warning",
      title: `Ban @${target.username}?`,
      text: `They won't be able to access DisFuse until ${describeDate(banUntil)}.`,
      showCancelButton: true,
      confirmButtonText: "Ban",
      confirmButtonColor: "#e40000",
    });

    if (isConfirmed) setBan(banUntil.toISOString(), { lifting: false });
  }

  async function unban() {
    if (!target) return;

    const { isConfirmed } = await Swal.fire({
      ...modalColors,
      icon: "question",
      title: `Unban @${target.username}?`,
      text: "They'll be able to use DisFuse again straight away.",
      showCancelButton: true,
      confirmButtonText: "Unban",
    });

    if (isConfirmed) setBan(new Date(0).toISOString(), { lifting: true });
  }

  return (
    <div className="df-staff-body">
      <ActionCard
        icon="fa-solid fa-gavel"
        title="Ban or unban a user"
        description="A ban blocks every DisFuse page and every API call until it expires."
      >
        {target ? (
          <div className="df-staff-target">
            <img src={target.avatar} alt="" />
            <div>
              <strong>{target.displayName || target.username}</strong>
              <span>
                @{target.username} · <code>{target.id}</code>
              </span>
            </div>
            <button
              type="button"
              className="df-staff-clear"
              onClick={() => {
                setTarget(null);
                setQuery("");
              }}
              title="Choose someone else"
              aria-label="Clear the selected user"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        ) : (
          <UserSearch
            value={query}
            onChange={setQuery}
            onPick={(user) => {
              setTarget(user);
              setQuery(user.username);
            }}
          />
        )}

        <div className="df-staff-field">
          <label htmlFor="ban-until">Banned until</label>
          <input
            id="ban-until"
            type="date"
            min={today}
            value={until}
            disabled={!target || busy}
            onChange={(event) => setUntil(event.target.value)}
          />
        </div>

        <div className="df-staff-actions">
          <button
            type="button"
            className="df-danger-btn"
            onClick={ban}
            disabled={!target || busy}
          >
            <i className="fa-solid fa-ban" /> Ban user
          </button>
          <button
            type="button"
            className="df-primary-btn"
            onClick={unban}
            disabled={!target || busy}
          >
            <i className="fa-solid fa-thumbs-up" /> Unban user
          </button>
        </div>
      </ActionCard>
    </div>
  );
}

/* =====================================================================
   Projects
   ===================================================================== */

function ProjectsTab({ modalColors }) {
  const [projectId, setProjectId] = useState("");
  const [project, setProject] = useState(null);
  const [looking, setLooking] = useState(false);
  const [lookupError, setLookupError] = useState(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  /* Looks the project up rather than making a moderator suspend an id
     they can't verify. The old panel matched the id against a cached
     copy of every project in the database. */
  useEffect(() => {
    const id = projectId.trim();

    setProject(null);
    setLookupError(null);

    if (id.length !== 24) return undefined;

    const controller = new AbortController();
    setLooking(true);

    const timer = setTimeout(async () => {
      try {
        setProject(
          await api
            .get(`/projects/${id}`, { signal: controller.signal })
            .then(data),
        );
      } catch (error) {
        if (!controller.signal.aborted)
          setLookupError(errorMessage(error, "No project with that ID."));
      } finally {
        setLooking(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [projectId]);

  const suspended = Boolean(project?.suspension?.status);

  async function apply(suspend) {
    const { isConfirmed } = await Swal.fire({
      ...modalColors,
      icon: "warning",
      title: suspend ? `Suspend "${project.name}"?` : `Unsuspend "${project.name}"?`,
      text: suspend
        ? "The owner and every collaborator will be locked out of the editor, and anyone with it open will be disconnected."
        : "The project becomes editable again straight away.",
      showCancelButton: true,
      confirmButtonText: suspend ? "Suspend" : "Unsuspend",
      confirmButtonColor: suspend ? "#e40000" : undefined,
    });

    if (!isConfirmed) return;

    setBusy(true);

    try {
      const suspension = await api
        .patch(`/projects/${project._id}/suspend`, {
          suspend,
          reason: reason.trim() || "No reason set.",
        })
        .then(data);

      setProject({ ...project, suspension });

      Swal.fire({
        ...modalColors,
        icon: "success",
        title: suspend ? "Suspended" : "Unsuspended",
        text: `"${project.name}" has been ${suspend ? "suspended" : "unsuspended"}.`,
      });
    } catch (error) {
      Swal.fire({
        ...modalColors,
        icon: "error",
        title: "That didn't work",
        text: errorMessage(error, "The project could not be changed."),
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="df-staff-body">
      <ActionCard
        icon="fa-solid fa-triangle-exclamation"
        title="Suspend a project"
        description="A suspended project can be viewed but not edited, and the reason is shown to its owner."
      >
        <div className="df-staff-field">
          <label htmlFor="suspend-id">Project ID</label>
          <input
            id="suspend-id"
            type="text"
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
            placeholder="24-character project ID"
            autoComplete="off"
            spellCheck="false"
          />
        </div>

        {looking && (
          <p className="df-staff-hint">
            <i className="fa-solid fa-circle-notch fa-spin" /> Looking it up…
          </p>
        )}

        {lookupError && (
          <p className="df-staff-hint error">
            <i className="fa-solid fa-circle-exclamation" /> {lookupError}
          </p>
        )}

        {project && (
          <div className="df-staff-target">
            {project.bot?.id && (
              <img
                src={`https://cdn.discordapp.com/avatars/${project.bot.id}/${project.bot.avatar}.webp`}
                alt=""
                onError={(event) => {
                  event.currentTarget.style.visibility = "hidden";
                }}
              />
            )}
            <div>
              <strong>{project.name}</strong>
              <span>
                by @{project.owner?.username}
                {suspended && (
                  <>
                    {" · "}
                    <em className="df-staff-flag">
                      suspended: {project.suspension.reason || "no reason set"}
                    </em>
                  </>
                )}
              </span>
            </div>
          </div>
        )}

        <div className="df-staff-field">
          <label htmlFor="suspend-reason">Reason</label>
          <input
            id="suspend-reason"
            type="text"
            value={reason}
            disabled={!project || busy}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Shown to the project's owner"
          />
        </div>

        <div className="df-staff-actions">
          <button
            type="button"
            className="df-danger-btn"
            onClick={() => apply(true)}
            disabled={!project || busy || suspended}
          >
            <i className="fa-solid fa-ban" /> Suspend
          </button>
          <button
            type="button"
            className="df-primary-btn"
            onClick={() => apply(false)}
            disabled={!project || busy || !suspended}
          >
            <i className="fa-solid fa-unlock" /> Unsuspend
          </button>
        </div>
      </ActionCard>
    </div>
  );
}

/* =====================================================================
   Announcements
   ===================================================================== */

function AdminTab({ isAdmin, modalColors }) {
  const [busy, setBusy] = useState(false);

  async function sendTosAlert() {
    const { isConfirmed } = await Swal.fire({
      ...modalColors,
      icon: "warning",
      title: "Send a Terms of Service alert?",
      html:
        "This reaches <b>every DisFuse user</b> three ways:<br /><br />" +
        "• an inbox notification, immediately<br />" +
        "• a post in the announcements channel<br />" +
        "• a direct message from the bot to everyone in the DisFuse server" +
        "<br /><br />The direct messages are paced to stay inside Discord's " +
        "rate limits, so they send in the background and can take a while.",
      showCancelButton: true,
      confirmButtonText: "Send it",
      confirmButtonColor: "#e40000",
    });

    if (!isConfirmed) return;

    setBusy(true);

    try {
      const result = await api.post("/users/tosChangeWarning").then(data);

      Swal.fire({
        ...modalColors,
        icon: "success",
        title: "Alert sent",
        text:
          "Inboxes and the announcements channel are done. The direct " +
          "messages are sending now — a summary will be posted to the staff " +
          `log when they finish.${result?.job ? ` (Job ${result.job})` : ""}`,
      });
    } catch (error) {
      Swal.fire({
        ...modalColors,
        icon: "error",
        title: "That didn't work",
        text: errorMessage(error, "The alert could not be sent."),
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="df-staff-body">
      <ActionCard
        icon="fa-solid fa-scroll"
        title="Terms of Service change alert"
        description="Tells every user the Terms have changed, by inbox, announcement and direct message."
        tone="danger"
      >
        {isAdmin ? (
          <>
            <p className="df-staff-note">
              There is no undo, and nothing stops it being sent twice — a
              second send puts a second notification in everyone's inbox and
              DMs them again.
            </p>
            <div className="df-staff-actions">
              <button
                type="button"
                className="df-danger-btn"
                onClick={sendTosAlert}
                disabled={busy}
              >
                {busy ? (
                  <i className="fa-solid fa-circle-notch fa-spin" />
                ) : (
                  <i className="fa-solid fa-paper-plane" />
                )}
                Send alert to all users
              </button>
            </div>
          </>
        ) : (
          <p className="df-staff-note">
            Sending this needs an admin. Ask one of them.
          </p>
        )}
      </ActionCard>
    </div>
  );
}
