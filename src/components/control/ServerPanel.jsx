import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";

import ControlModal from "./ControlModal";
import LoadingAnim from "../LoadingAnim";
import modalThemeColor from "../../functions/modalThemeColor";
import {
  avatarUrl,
  emojiUrl,
  guildIconUrl,
  guildInitials,
  roleColor,
  snowflakeDate,
} from "./discordUtils";

const modalColors = modalThemeColor(null, true);

/* =====================================================================
   Server settings
   ---------------------------------------------------------------------
   The parts of Discord's server settings a BOT can reach: the overview,
   roles, bans, invites, emoji and the audit log. Each tab loads its data
   the first time it is opened rather than all at once — the audit log
   and the ban list are both expensive and neither is usually wanted.

   Tabs the bot has no permission for are not rendered, because a bot
   without View Audit Log has literally nothing to show there.
   ===================================================================== */

export default function ServerPanel({ guild, onClose, action, notify }) {
  const [tab, setTab] = useState("overview");

  const perms = guild?.permissionNames || [];
  const admin = perms.includes("Administrator");
  const can = (permission) => admin || perms.includes(permission);

  const tabs = [
    { id: "overview", label: "Overview", icon: "fa-solid fa-circle-info" },
    { id: "roles", label: "Roles", icon: "fa-solid fa-user-tag" },
    ...(can("BanMembers")
      ? [{ id: "bans", label: "Bans", icon: "fa-solid fa-gavel" }]
      : []),
    ...(can("ManageGuild")
      ? [{ id: "invites", label: "Invites", icon: "fa-solid fa-link" }]
      : []),
    { id: "emojis", label: "Emoji", icon: "fa-solid fa-face-smile" },
    ...(can("ViewAuditLog")
      ? [{ id: "audit", label: "Audit log", icon: "fa-solid fa-scroll" }]
      : []),
  ];

  return (
    <ControlModal
      title={guild.name}
      icon="fa-solid fa-server"
      subtitle="What this bot can see and change in this server"
      wide
      onClose={onClose}
    >
      <nav className="dc-tabs">
        {tabs.map((entry) => (
          <button
            key={entry.id}
            className={tab === entry.id ? "active" : ""}
            onClick={() => setTab(entry.id)}
          >
            <i className={entry.icon}></i> {entry.label}
          </button>
        ))}
      </nav>

      {tab === "overview" && (
        <Overview guild={guild} can={can} action={action} notify={notify} />
      )}
      {tab === "roles" && <Roles guild={guild} can={can} />}
      {tab === "bans" && (
        <Bans guild={guild} action={action} notify={notify} />
      )}
      {tab === "invites" && (
        <Invites guild={guild} action={action} notify={notify} />
      )}
      {tab === "emojis" && <Emojis guild={guild} action={action} />}
      {tab === "audit" && <AuditLog guild={guild} action={action} />}
    </ControlModal>
  );
}

/* ---- A tiny loader shared by every tab that fetches ---------------------- */

function useTabData(load) {
  const [state, setState] = useState({ loading: true, error: null, data: null });

  const run = useCallback(() => {
    setState({ loading: true, error: null, data: null });

    load()
      .then((data) => setState({ loading: false, error: null, data }))
      .catch((err) =>
        setState({ loading: false, error: err.message, data: null }),
      );
  }, [load]);

  useEffect(() => {
    run();
  }, [run]);

  return { ...state, reload: run };
}

function TabState({ loading, error, empty, emptyText, onRetry, children }) {
  if (loading)
    return (
      <div className="dc-tab-loading">
        <LoadingAnim onlySpinner />
      </div>
    );

  if (error)
    return (
      <div className="dc-tab-error">
        <i className="fa-solid fa-triangle-exclamation"></i>
        <p>{error}</p>
        {onRetry && (
          <button onClick={onRetry}>
            <i className="fa-solid fa-rotate-right"></i> Try again
          </button>
        )}
      </div>
    );

  if (empty)
    return (
      <div className="dc-tab-empty">
        <i className="fa-solid fa-inbox"></i>
        <p>{emptyText}</p>
      </div>
    );

  return children;
}

/* ---- Overview ------------------------------------------------------------ */

function Overview({ guild, can, action, notify }) {
  const [name, setName] = useState(guild.name);
  const [description, setDescription] = useState(guild.description || "");
  const [busy, setBusy] = useState(false);

  const icon = guildIconUrl(guild, 128);
  const editable = can("ManageGuild");

  return (
    <div className="dc-tab">
      <div className="dc-panel-hero">
        {icon ? (
          <img src={icon} alt="" />
        ) : (
          <span className="dc-hero-initials">{guildInitials(guild.name)}</span>
        )}
        <div>
          <h3>{guild.name}</h3>
          <p className="dc-muted">
            <code>{guild.id}</code> · created{" "}
            {snowflakeDate(guild.id)?.toLocaleDateString([], {
              dateStyle: "long",
            })}
          </p>
        </div>
      </div>

      <div className="dc-detail-grid">
        <div>
          <h5>Members</h5>
          <p>{guild.memberCount?.toLocaleString() ?? "Unknown"}</p>
        </div>
        <div>
          <h5>Channels</h5>
          <p>{guild.channels?.length ?? 0}</p>
        </div>
        <div>
          <h5>Roles</h5>
          <p>{guild.roles?.length ?? 0}</p>
        </div>
        <div>
          <h5>Boost level</h5>
          <p>
            Tier {guild.premiumTier ?? 0} · {guild.premiumSubscriptionCount ?? 0}{" "}
            boosts
          </p>
        </div>
        <div>
          <h5>Owner</h5>
          <p>
            <code>{guild.ownerId}</code>
          </p>
        </div>
        <div>
          <h5>Locale</h5>
          <p>{guild.preferredLocale || "Unknown"}</p>
        </div>
      </div>

      <section className="dc-panel-section">
        <h4>The bot's permissions here</h4>
        <div className="dc-perm-chips">
          {(guild.permissionNames || []).length ? (
            guild.permissionNames.map((permission) => (
              <span className="dc-perm-chip" key={permission}>
                {permission.replace(/([a-z])([A-Z])/g, "$1 $2")}
              </span>
            ))
          ) : (
            <p className="dc-muted small">
              This bot has no permissions in this server.
            </p>
          )}
        </div>
      </section>

      {editable && (
        <section className="dc-panel-section">
          <h4>Edit server</h4>
          <label>
            Name
            <input
              type="text"
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label>
            Description
            <textarea
              maxLength={300}
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
          <button
            className="dc-primary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await action("guild.edit", {
                  guildId: guild.id,
                  name,
                  description,
                });
                notify.success("Server updated.");
              } catch (err) {
                notify.error(err.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Saving…" : "Save changes"}
          </button>
        </section>
      )}
    </div>
  );
}

/* ---- Roles --------------------------------------------------------------- */

function Roles({ guild }) {
  const roles = [...(guild.roles || [])].sort(
    (a, b) => b.position - a.position,
  );

  return (
    <div className="dc-tab">
      <p className="dc-muted small">
        A bot can only manage roles below its own highest role, and never a role
        an integration owns.
      </p>

      <ul className="dc-role-list">
        {roles.map((role) => (
          <li key={role.id}>
            <span
              className="dc-role-dot"
              style={{ background: roleColor(role) }}
            />
            <span className="dc-role-name">{role.name}</span>
            <span className="dc-role-meta">
              #{role.position}
              {role.managed ? " · integration" : ""}
              {role.hoist ? " · shown separately" : ""}
              {role.mentionable ? " · mentionable" : ""}
            </span>
            <span className="dc-role-perms">
              {role.permissionNames?.length || 0} permissions
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---- Bans ---------------------------------------------------------------- */

function Bans({ guild, action, notify }) {
  const load = useCallback(
    () => action("guild.fetchBans", { guildId: guild.id, limit: 100 }),
    [action, guild.id],
  );

  const { loading, error, data, reload } = useTabData(load);
  const bans = data?.bans || [];

  return (
    <div className="dc-tab">
      <TabState
        loading={loading}
        error={error}
        empty={!bans.length}
        emptyText="Nobody is banned from this server."
        onRetry={reload}
      >
        <ul className="dc-entity-list">
          {bans.map((ban) => (
            <li key={ban.user.id}>
              <img src={avatarUrl(ban.user, 48)} alt="" loading="lazy" />
              <div>
                <strong>{ban.user.globalName || ban.user.username}</strong>
                <span className="dc-muted small">
                  {ban.reason || "No reason given"}
                </span>
              </div>
              <button
                onClick={async () => {
                  const confirmed = await Swal.fire({
                    ...modalColors,
                    icon: "question",
                    title: `Unban ${ban.user.username}?`,
                    showCancelButton: true,
                    confirmButtonText: "Unban",
                  });

                  if (!confirmed.isConfirmed) return;

                  try {
                    await action("member.unban", {
                      guildId: guild.id,
                      userId: ban.user.id,
                    });
                    notify.success("Member unbanned.");
                    reload();
                  } catch (err) {
                    notify.error(err.message);
                  }
                }}
              >
                Unban
              </button>
            </li>
          ))}
        </ul>
      </TabState>
    </div>
  );
}

/* ---- Invites ------------------------------------------------------------- */

function Invites({ guild, action, notify }) {
  const load = useCallback(
    () => action("guild.fetchInvites", { guildId: guild.id }),
    [action, guild.id],
  );

  const { loading, error, data, reload } = useTabData(load);
  const invites = data?.invites || [];

  return (
    <div className="dc-tab">
      <TabState
        loading={loading}
        error={error}
        empty={!invites.length}
        emptyText="There are no invites for this server."
        onRetry={reload}
      >
        <ul className="dc-entity-list">
          {invites.map((invite) => (
            <li key={invite.code}>
              <span className="dc-invite-code">
                <i className="fa-solid fa-link"></i> {invite.code}
              </span>
              <div>
                <strong>#{invite.channel?.name || "unknown"}</strong>
                <span className="dc-muted small">
                  {invite.uses ?? 0}
                  {invite.max_uses ? `/${invite.max_uses}` : ""} uses
                  {invite.inviter
                    ? ` · by ${invite.inviter.username}`
                    : ""}
                </span>
              </div>
              <button
                onClick={async () => {
                  try {
                    await action("invite.delete", {
                      guildId: guild.id,
                      code: invite.code,
                    });
                    notify.success("Invite revoked.");
                    reload();
                  } catch (err) {
                    notify.error(err.message);
                  }
                }}
              >
                Revoke
              </button>
            </li>
          ))}
        </ul>
      </TabState>
    </div>
  );
}

/* ---- Emoji --------------------------------------------------------------- */

function Emojis({ guild, action }) {
  const load = useCallback(
    () => action("guild.fetchEmojis", { guildId: guild.id }),
    [action, guild.id],
  );

  const { loading, error, data, reload } = useTabData(load);
  const emojis = data?.emojis || guild.emojis || [];

  return (
    <div className="dc-tab">
      <TabState
        loading={loading}
        error={error}
        empty={!emojis.length}
        emptyText="This server has no custom emoji."
        onRetry={reload}
      >
        <div className="dc-emoji-list">
          {emojis.map((emoji) => (
            <div className="dc-emoji-item" key={emoji.id}>
              <img
                src={emojiUrl(emoji.id, emoji.animated, 48)}
                alt={emoji.name}
                loading="lazy"
              />
              <span>:{emoji.name}:</span>
            </div>
          ))}
        </div>
      </TabState>
    </div>
  );
}

/* ---- Audit log ----------------------------------------------------------- */

/** The audit-log actions Control is likely to show, in Discord's numbering. */
const AUDIT_ACTIONS = {
  1: "Server updated",
  10: "Channel created",
  11: "Channel updated",
  12: "Channel deleted",
  13: "Channel permissions updated",
  14: "Channel permissions updated",
  15: "Channel permissions removed",
  20: "Member kicked",
  21: "Members pruned",
  22: "Member banned",
  23: "Member unbanned",
  24: "Member updated",
  25: "Member roles updated",
  26: "Member moved",
  27: "Member disconnected",
  28: "Bot added",
  30: "Role created",
  31: "Role updated",
  32: "Role deleted",
  40: "Invite created",
  42: "Invite deleted",
  50: "Webhook created",
  51: "Webhook updated",
  52: "Webhook deleted",
  60: "Emoji created",
  61: "Emoji updated",
  62: "Emoji deleted",
  72: "Message deleted",
  73: "Messages bulk deleted",
  74: "Message pinned",
  75: "Message unpinned",
  110: "Thread created",
  111: "Thread updated",
  112: "Thread deleted",
};

function AuditLog({ guild, action }) {
  const load = useCallback(
    () => action("guild.fetchAuditLog", { guildId: guild.id, limit: 50 }),
    [action, guild.id],
  );

  const { loading, error, data, reload } = useTabData(load);
  const entries = data?.entries || [];
  const users = data?.users || [];

  return (
    <div className="dc-tab">
      <TabState
        loading={loading}
        error={error}
        empty={!entries.length}
        emptyText="Nothing in the audit log yet."
        onRetry={reload}
      >
        <ul className="dc-audit-list">
          {entries.map((entry) => {
            const user = users.find((u) => u.id === entry.user_id);

            return (
              <li key={entry.id}>
                <img src={avatarUrl(user, 40)} alt="" loading="lazy" />
                <div>
                  <strong>
                    {AUDIT_ACTIONS[entry.action_type] ||
                      `Action ${entry.action_type}`}
                  </strong>
                  <span className="dc-muted small">
                    {user?.globalName || user?.username || "Unknown"}
                    {entry.reason ? ` · ${entry.reason}` : ""}
                  </span>
                </div>
                <time>
                  {snowflakeDate(entry.id)?.toLocaleString([], {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </time>
              </li>
            );
          })}
        </ul>
      </TabState>
    </div>
  );
}
