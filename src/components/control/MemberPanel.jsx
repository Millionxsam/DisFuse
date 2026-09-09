import { useEffect, useState } from "react";
import Swal from "sweetalert2";

import ControlModal from "./ControlModal";
import modalThemeColor from "../../functions/modalThemeColor";
import {
  avatarUrl,
  isTimedOut,
  memberAvatarUrl,
  memberColor,
  roleColor,
  snowflakeDate,
} from "./discordUtils";

const modalColors = modalThemeColor(null, true);

/* =====================================================================
   A member, and what the bot may do to them
   ---------------------------------------------------------------------
   Discord's profile popout, plus the moderation actions a bot can
   actually perform. Two separate rules decide what appears:

     PERMISSIONS  the bot's own permissions in this server
     HIERARCHY    Discord refuses anything aimed at someone whose highest
                  role sits at or above the bot's, and nothing at all can
                  be done to the server owner

   Both are computed on the backend too, so a hidden button is a
   courtesy rather than the enforcement — the API rejects the action
   either way, with the same explanation.
   ===================================================================== */

const TIMEOUT_OPTIONS = [
  { minutes: 60, label: "1 hour" },
  { minutes: 60 * 24, label: "1 day" },
  { minutes: 60 * 24 * 7, label: "1 week" },
  { minutes: 60 * 24 * 28, label: "28 days" },
];

export default function MemberPanel({
  member,
  guild,
  session,
  onClose,
  action,
  notify,
  onOpenDm,
}) {
  const [busy, setBusy] = useState(null);
  const [nick, setNick] = useState(member?.nick || "");
  const [rolesOpen, setRolesOpen] = useState(false);
  const [live, setLive] = useState(member);

  useEffect(() => {
    setLive(member);
    setNick(member?.nick || "");
  }, [member]);

  if (!live) return null;

  const user = live.user;
  const roles = guild?.roles || [];
  const colour = memberColor(live, roles);
  const botPerms = guild?.permissionNames || [];
  const admin = botPerms.includes("Administrator");
  const can = (permission) => admin || botPerms.includes(permission);

  const isOwner = guild?.ownerId === user?.id;
  const isSelf = user?.id === session?.bot?.id;

  /* The bot's own top role, so the hierarchy rule can be explained here
     rather than only discovered when Discord says no. */
  const selfTopRole = topRole(guild?.self, roles);
  const targetTopRole = topRole(live, roles);
  /* Strictly outranking is required — equal rank is not enough. */
  const outranked =
    !isSelf && (isOwner || compareRoles(selfTopRole, targetTopRole) <= 0);

  /**
   * Roles the bot can actually give this member.
   *
   * Discord only lets a bot assign roles strictly BELOW its own highest
   * one, and never a role an integration manages. On a server where the
   * bot's role sits near the bottom that legitimately leaves nothing —
   * which used to render as an empty box with no explanation, and read
   * as the picker being broken.
   */
  const assignableRoles = roles
    .filter(
      (role) =>
        role.id !== guild?.id &&
        !role.managed &&
        compareRoles(selfTopRole, role) > 0 &&
        !(live.roles || []).includes(role.id),
    )
    .sort((a, b) => compareRoles(b, a));

  /* Everything excluded purely because of the hierarchy, so the empty
     state can say how many and why. */
  const blockedByHierarchy = roles.filter(
    (role) =>
      role.id !== guild?.id &&
      !role.managed &&
      compareRoles(selfTopRole, role) <= 0 &&
      !(live.roles || []).includes(role.id),
  ).length;

  const memberRoles = (live.roles || [])
    .map((id) => roles.find((role) => role.id === id))
    .filter(Boolean)
    .sort((a, b) => b.position - a.position);

  async function run(key, type, params, success) {
    setBusy(key);

    try {
      const result = await action(type, params);
      if (result?.member) setLive(result.member);
      notify.success(success);
      return result;
    } catch (err) {
      notify.error(err.message);
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function confirmThen(options, run_) {
    const result = await Swal.fire({
      ...modalColors,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: options.confirm,
      ...options,
    });

    if (result.isConfirmed) run_(result.value);
  }

  return (
    <ControlModal
      title={live.nick || user?.globalName || user?.username || "Member"}
      icon="fa-solid fa-user"
      subtitle={guild ? `In ${guild.name}` : undefined}
      onClose={onClose}
    >
      <div className="dc-panel-hero">
        <img
          src={
            live.avatar ? memberAvatarUrl(live, guild?.id, 128) : avatarUrl(user, 128)
          }
          alt=""
        />
        <div>
          <h3 style={colour ? { color: colour } : undefined}>
            {live.nick || user?.globalName || user?.username}
            {user?.bot && <span className="dc-bot-tag">APP</span>}
          </h3>
          <p className="dc-muted">
            @{user?.username} · <code>{user?.id}</code>
          </p>
          {live.status && (
            <p className="dc-muted small">
              <span className={`dc-status dc-status-${live.status} inline`} />{" "}
              {live.status}
            </p>
          )}
        </div>
      </div>

      <div className="dc-detail-grid">
        <div>
          <h5>Joined server</h5>
          <p>
            {live.joinedAt
              ? new Date(live.joinedAt).toLocaleDateString([], {
                  dateStyle: "long",
                })
              : "Unknown"}
          </p>
        </div>
        <div>
          <h5>Account created</h5>
          <p>
            {snowflakeDate(user?.id)?.toLocaleDateString([], {
              dateStyle: "long",
            }) || "Unknown"}
          </p>
        </div>
        {live.premiumSince && (
          <div>
            <h5>Boosting since</h5>
            <p>
              {new Date(live.premiumSince).toLocaleDateString([], {
                dateStyle: "long",
              })}
            </p>
          </div>
        )}
        {isTimedOut(live) && (
          <div>
            <h5>Timed out until</h5>
            <p className="dc-danger-text">
              {new Date(live.communicationDisabledUntil).toLocaleString()}
            </p>
          </div>
        )}
      </div>

      <section className="dc-panel-section">
        <h4>Roles</h4>
        <div className="dc-role-chips">
          {memberRoles.length ? (
            memberRoles.map((role) => (
              <span
                className="dc-role-chip"
                key={role.id}
                style={{ borderColor: roleColor(role) }}
              >
                <span
                  className="dc-role-dot"
                  style={{ background: roleColor(role) }}
                />
                {role.name}
                {can("ManageRoles") && !outranked && !role.managed && (
                  <button
                    title="Remove role"
                    disabled={busy === `role-${role.id}`}
                    onClick={() =>
                      run(
                        `role-${role.id}`,
                        "member.removeRole",
                        {
                          guildId: guild.id,
                          userId: user.id,
                          roleId: role.id,
                        },
                        `Removed ${role.name}.`,
                      ).then((result) => {
                        /* `run` resolves to null when the action failed,
                           and the role is still on them — don't show it
                           gone because the button was pressed. */
                        if (!result) return;

                        setLive((current) => ({
                          ...current,
                          roles: (current.roles || []).filter(
                            (id) => id !== role.id,
                          ),
                        }));
                      })
                    }
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                )}
              </span>
            ))
          ) : (
            <p className="dc-muted small">No roles.</p>
          )}
        </div>

        {can("ManageRoles") && !outranked && (
          <>
            <button
              className="dc-ghost"
              onClick={() => setRolesOpen((open) => !open)}
            >
              <i className="fa-solid fa-plus"></i> Add a role
            </button>

            {rolesOpen && (
              <div className="dc-role-picker">
                {!assignableRoles.length && (
                  <p className="dc-role-picker-empty">
                    {!guild?.self ? (
                      <>
                        The bot's own member data hasn't loaded for this server
                        yet, so its role hierarchy can't be worked out. Try
                        reopening this profile.
                      </>
                    ) : blockedByHierarchy ? (
                      <>
                        There's no role the bot can give out here.{" "}
                        <strong>{blockedByHierarchy}</strong>{" "}
                        {blockedByHierarchy === 1 ? "role sits" : "roles sit"} at
                        or above the bot's highest role
                        {selfTopRole ? (
                          <>
                            {" "}
                            (<strong>{selfTopRole.name}</strong>)
                          </>
                        ) : null}
                        , and Discord won't let a bot assign those. Move the
                        bot's role higher in Server&nbsp;Settings to change that.
                      </>
                    ) : (
                      <>This member already has every role the bot can assign.</>
                    )}
                  </p>
                )}

                {assignableRoles.map((role) => (
                    <button
                      key={role.id}
                      disabled={busy === `add-${role.id}`}
                      onClick={() =>
                        run(
                          `add-${role.id}`,
                          "member.addRole",
                          {
                            guildId: guild.id,
                            userId: user.id,
                            roleId: role.id,
                          },
                          `Added ${role.name}.`,
                        ).then((result) => {
                          if (!result) return;

                          setLive((current) => ({
                            ...current,
                            roles: [...(current.roles || []), role.id],
                          }));
                          setRolesOpen(false);
                        })
                      }
                    >
                      <span
                        className="dc-role-dot"
                        style={{ background: roleColor(role) }}
                      />
                      {role.name}
                    </button>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {outranked && !isSelf && (
        <p className="dc-warning">
          <i className="fa-solid fa-triangle-exclamation"></i>{" "}
          {isOwner
            ? "This is the server owner, and Discord doesn't allow a bot to act on them."
            : "This member's highest role is at or above the bot's, so Discord won't let the bot moderate them."}
        </p>
      )}

      <section className="dc-panel-section">
        <h4>Actions</h4>
        <div className="dc-action-grid">
          {can("ManageNicknames") && !outranked && (
            <div className="dc-field-row full">
              <input
                type="text"
                maxLength={32}
                placeholder="Nickname"
                value={nick}
                onChange={(event) => setNick(event.target.value)}
              />
              <button
                disabled={busy === "nick"}
                onClick={() =>
                  run(
                    "nick",
                    "member.edit",
                    { guildId: guild.id, userId: user.id, nick },
                    "Nickname updated.",
                  )
                }
              >
                Set nickname
              </button>
            </div>
          )}

          {!user?.bot && (
            <button
              disabled={busy === "dm"}
              onClick={async () => {
                setBusy("dm");

                try {
                  /* Opening the DM *and* switching to it is the page's
                     job — it owns the channel selection. Doing half of
                     it here left the conversation open in the backend
                     but the user still looking at the server. */
                  await onOpenDm?.(user.id);
                } catch (err) {
                  notify.error(err.message);
                } finally {
                  setBusy(null);
                }
              }}
            >
              <i className="fa-solid fa-paper-plane"></i>{" "}
              {busy === "dm" ? "Opening…" : "Message as bot"}
            </button>
          )}

          {can("ModerateMembers") && !outranked && (
            <>
              {isTimedOut(live) ? (
                <button
                  disabled={busy === "untimeout"}
                  onClick={() =>
                    run(
                      "untimeout",
                      "member.timeout",
                      { guildId: guild.id, userId: user.id, minutes: 0 },
                      "Timeout removed.",
                    )
                  }
                >
                  <i className="fa-solid fa-clock-rotate-left"></i> Remove timeout
                </button>
              ) : (
                <div className="dc-split-button">
                  <span>
                    <i className="fa-solid fa-clock"></i> Timeout
                  </span>
                  <div>
                    {TIMEOUT_OPTIONS.map((option) => (
                      <button
                        key={option.minutes}
                        disabled={busy === `to-${option.minutes}`}
                        onClick={() =>
                          run(
                            `to-${option.minutes}`,
                            "member.timeout",
                            {
                              guildId: guild.id,
                              userId: user.id,
                              minutes: option.minutes,
                            },
                            `Timed out for ${option.label}.`,
                          )
                        }
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {can("MoveMembers") && !outranked && (
            <button
              disabled={busy === "disconnect"}
              onClick={() =>
                run(
                  "disconnect",
                  "member.edit",
                  { guildId: guild.id, userId: user.id, voiceChannelId: null },
                  "Disconnected from voice.",
                )
              }
            >
              <i className="fa-solid fa-phone-slash"></i> Disconnect from voice
            </button>
          )}

          {can("KickMembers") && !outranked && (
            <button
              className="danger"
              onClick={() =>
                confirmThen(
                  {
                    title: `Kick ${live.nick || user.username}?`,
                    text: "They can rejoin with a new invite.",
                    confirm: "Kick",
                    input: "text",
                    inputPlaceholder: "Reason (optional)",
                  },
                  (reason) =>
                    run(
                      "kick",
                      "member.kick",
                      { guildId: guild.id, userId: user.id, reason },
                      "Member kicked.",
                    ).then((result) => result && onClose()),
                )
              }
            >
              <i className="fa-solid fa-user-minus"></i> Kick
            </button>
          )}

          {can("BanMembers") && !outranked && (
            <button
              className="danger"
              onClick={() =>
                confirmThen(
                  {
                    title: `Ban ${live.nick || user.username}?`,
                    text: "They won't be able to rejoin until they're unbanned.",
                    confirm: "Ban",
                    input: "text",
                    inputPlaceholder: "Reason (optional)",
                  },
                  (reason) =>
                    run(
                      "ban",
                      "member.ban",
                      {
                        guildId: guild.id,
                        userId: user.id,
                        reason,
                        deleteMessageSeconds: 0,
                      },
                      "Member banned.",
                    ).then((result) => result && onClose()),
                )
              }
            >
              <i className="fa-solid fa-gavel"></i> Ban
            </button>
          )}
        </div>

        {!can("KickMembers") && !can("BanMembers") && !can("ModerateMembers") && (
          <p className="dc-muted small">
            This bot has no moderation permissions in this server, so there's
            nothing it can do to members here.
          </p>
        )}
      </section>
    </ControlModal>
  );
}

/**
 * Discord's role ordering, mirroring functions/control/permissions.js on
 * the API. Position first; when two roles share one — which every
 * integration role in a server tends to — the OLDER role (smaller
 * snowflake) ranks higher.
 *
 * Comparing positions alone hid roles the bot is actually allowed to
 * assign, which is what made the picker look empty.
 */
function compareRoles(a, b) {
  if (!a && !b) return 0;
  if (!a) return -1;
  if (!b) return 1;

  if (a.position !== b.position) return a.position - b.position;

  try {
    const left = BigInt(a.id);
    const right = BigInt(b.id);
    if (left === right) return 0;
    return left < right ? 1 : -1;
  } catch {
    return 0;
  }
}

/** The member's highest role by that ordering. */
function topRole(member, roles) {
  if (!member?.roles?.length) return null;

  return member.roles
    .map((id) => roles.find((r) => r.id === id))
    .filter(Boolean)
    .reduce((highest, role) => (compareRoles(role, highest) > 0 ? role : highest), null);
}
