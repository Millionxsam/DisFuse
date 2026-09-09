import ControlModal from "./ControlModal";
import { avatarUrl, snowflakeDate } from "./discordUtils";

/**
 * A plain Discord user, with no server around them.
 *
 * MemberPanel needs a guild — roles, moderation, hierarchy all come from
 * one. In a DM there is no guild at all, so opening someone's profile
 * there used to do nothing. This is the honest version of that screen:
 * who they are, and the one action a bot has outside a server.
 */
export default function UserPanel({ user, onClose, onOpenDm, busy }) {
  if (!user) return null;

  return (
    <ControlModal
      title={user.globalName || user.username || "User"}
      icon="fa-solid fa-user"
      onClose={onClose}
    >
      <div className="dc-panel-hero">
        <img src={avatarUrl(user, 128)} alt="" />
        <div>
          <h3>
            {user.globalName || user.username}
            {user.bot && <span className="dc-bot-tag">APP</span>}
          </h3>
          <p className="dc-muted">
            @{user.username} · <code>{user.id}</code>
          </p>
        </div>
      </div>

      <div className="dc-detail-grid">
        <div>
          <h5>Account created</h5>
          <p>
            {snowflakeDate(user.id)?.toLocaleDateString([], {
              dateStyle: "long",
            }) || "Unknown"}
          </p>
        </div>
        <div>
          <h5>Type</h5>
          <p>{user.bot ? "Bot application" : "Discord user"}</p>
        </div>
      </div>

      <p className="dc-muted small">
        Roles, nicknames and moderation belong to a server. Open this person
        from a server's member list to act on them there.
      </p>

      {!user.bot && onOpenDm && (
        <button className="dc-primary" disabled={busy} onClick={onOpenDm}>
          <i className="fa-solid fa-paper-plane"></i>{" "}
          {busy ? "Opening…" : "Message as bot"}
        </button>
      )}
    </ControlModal>
  );
}
