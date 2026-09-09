import { useMemo, useState } from "react";

import {
  avatarUrl,
  hoistRole,
  isTimedOut,
  memberAvatarUrl,
  memberColor,
  roleColor,
} from "./discordUtils";

/* =====================================================================
   Member list
   ---------------------------------------------------------------------
   Discord's right-hand column: members grouped under their highest
   hoisted role, offline last, with presence dots.

   How complete this is depends on the bot, and the interface says so.
   Without the Server Members privileged intent the gateway sends no
   member list at all, so Control pages members in over REST instead —
   and without the Presence intent nobody has a status. Both are switches
   in the Discord developer portal, so the empty state explains that
   rather than looking broken.
   ===================================================================== */

const ORDER = { online: 0, idle: 1, dnd: 2, offline: 3 };

export default function MemberList({
  guild,
  privileged,
  onOpenMember,
  onLoadMore,
  loadingMore,
  hasMore,
}) {
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const members = guild?.members || [];
    const roles = guild?.roles || [];
    const search = query.trim().toLowerCase();

    const filtered = search
      ? members.filter((member) =>
          [member.nick, member.user?.globalName, member.user?.username, member.user?.id]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(search)),
        )
      : members;

    const buckets = new Map();

    for (const member of filtered) {
      const role = hoistRole(member, roles);
      const offline = !member.status || member.status === "offline";

      /* Discord buckets offline members separately from every role. */
      const key = offline && privileged?.presences ? "__offline" : role?.id || "__online";
      if (!buckets.has(key))
        buckets.set(key, {
          key,
          role: key === "__offline" || key === "__online" ? null : role,
          label:
            key === "__offline"
              ? "Offline"
              : key === "__online"
                ? privileged?.presences
                  ? "Online"
                  : "Members"
                : role.name,
          position: key === "__offline" ? -1 : role?.position ?? 0,
          members: [],
        });

      buckets.get(key).members.push(member);
    }

    return [...buckets.values()]
      .sort((a, b) => b.position - a.position)
      .map((bucket) => ({
        ...bucket,
        members: bucket.members.sort((a, b) => {
          const statusDiff =
            (ORDER[a.status] ?? 3) - (ORDER[b.status] ?? 3);
          if (statusDiff !== 0) return statusDiff;

          return (a.nick || a.user?.username || "").localeCompare(
            b.nick || b.user?.username || "",
          );
        }),
      }));
  }, [guild, query, privileged]);

  const total = guild?.memberCount;
  const loaded = guild?.members?.length || 0;

  return (
    <aside className="dc-members">
      <div className="dc-members-search">
        <input
          type="search"
          placeholder="Search members"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {!privileged?.members && (
        <div className="dc-members-note">
          <i className="fa-solid fa-circle-info"></i>
          <span>
            <strong>Server Members Intent</strong> is off for this bot, so
            Discord won't send its member list. Members are loaded a page at a
            time instead. Turn the intent on in the Discord developer portal
            to load the full list.
          </span>
        </div>
      )}

      <div className="dc-members-scroll">
        {groups.map((group) => (
          <section className="dc-member-group" key={group.key}>
            <h4
              style={
                group.role?.color
                  ? { color: roleColor(group.role) }
                  : undefined
              }
            >
              {group.label} ({group.members.length})
            </h4>

            {group.members.map((member) => (
              <MemberRow
                key={member.user?.id}
                member={member}
                guild={guild}
                onOpen={onOpenMember}
              />
            ))}
          </section>
        ))}

        {!groups.length && (
          <div className="dc-sidebar-empty">
            <i className="fa-solid fa-users"></i>
            <p>
              {query
                ? "No members match that search."
                : "No members loaded yet."}
            </p>
          </div>
        )}

        {hasMore && (
          <button
            className="dc-load-more"
            onClick={onLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin"></i> Loading…
              </>
            ) : (
              <>
                <i className="fa-solid fa-arrow-down"></i> Load more members
              </>
            )}
          </button>
        )}

        {typeof total === "number" && (
          <p className="dc-members-count">
            Showing {loaded} of {total.toLocaleString()} members
          </p>
        )}
      </div>
    </aside>
  );
}

function MemberRow({ member, guild, onOpen }) {
  const colour = memberColor(member, guild?.roles);
  const status = member.status || "offline";
  const timedOut = isTimedOut(member);

  const activity = (member.activities || []).find(
    (entry) => entry.type !== 4,
  );
  const custom = (member.activities || []).find((entry) => entry.type === 4);

  return (
    <button
      className={`dc-member${status === "offline" ? " offline" : ""}`}
      onClick={() => onOpen?.(member.user?.id)}
    >
      <span className="dc-member-avatar">
        <img
          src={
            member.avatar
              ? memberAvatarUrl(member, guild?.id, 48)
              : avatarUrl(member.user, 48)
          }
          alt=""
          loading="lazy"
        />
        <span className={`dc-status dc-status-${status}`} />
      </span>

      <span className="dc-member-text">
        <span className="dc-member-name" style={colour ? { color: colour } : undefined}>
          {member.nick || member.user?.globalName || member.user?.username}
          {member.user?.bot && <span className="dc-bot-tag small">APP</span>}
          {timedOut && (
            <i
              className="fa-solid fa-clock dc-timeout-flag"
              title="Timed out"
            ></i>
          )}
        </span>
        {(custom?.state || activity?.name) && (
          <span className="dc-member-activity">
            {custom?.state || `${activityVerb(activity.type)} ${activity.name}`}
          </span>
        )}
      </span>
    </button>
  );
}

function activityVerb(type) {
  switch (type) {
    case 1:
      return "Streaming";
    case 2:
      return "Listening to";
    case 3:
      return "Watching";
    case 5:
      return "Competing in";
    default:
      return "Playing";
  }
}
