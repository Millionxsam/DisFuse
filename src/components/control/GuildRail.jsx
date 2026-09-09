import { guildIconUrl, guildInitials } from "./discordUtils";

/* =====================================================================
   The server rail
   ---------------------------------------------------------------------
   Discord's left-hand strip: direct messages at the top, then every
   server the BOT is in. The bot's own servers are the only ones that can
   ever appear here — the list comes from its gateway connection, not
   from the person using Control.
   ===================================================================== */

export default function GuildRail({
  guilds,
  activeGuildId,
  onSelectGuild,
  onSelectHome,
  unreadByGuild,
  dmUnread,
  botUser,
  onOpenBotSettings,
}) {
  return (
    <nav className="dc-rail" aria-label="Servers">
      <button
        className={`dc-rail-item dc-rail-home${
          activeGuildId === null ? " active" : ""
        }`}
        onClick={onSelectHome}
        title="Direct Messages"
      >
        <i className="fa-solid fa-comments"></i>
        {dmUnread > 0 && <span className="dc-rail-badge">{dmUnread}</span>}
      </button>

      <div className="dc-rail-divider" />

      <div className="dc-rail-scroll">
        {guilds.map((guild) => {
          const icon = guildIconUrl(guild, 128);
          const unread = unreadByGuild?.[guild.id] || 0;

          return (
            <button
              key={guild.id}
              className={`dc-rail-item${
                guild.id === activeGuildId ? " active" : ""
              }${unread ? " unread" : ""}`}
              onClick={() => onSelectGuild(guild.id)}
              title={guild.name}
            >
              {icon ? (
                <img src={icon} alt="" loading="lazy" />
              ) : (
                <span className="dc-rail-initials">
                  {guildInitials(guild.name)}
                </span>
              )}
              {unread > 0 && <span className="dc-rail-badge">{unread}</span>}
            </button>
          );
        })}

        {!guilds.length && (
          <div className="dc-rail-empty" title="This bot isn't in any servers">
            <i className="fa-solid fa-circle-question"></i>
          </div>
        )}
      </div>

      <div className="dc-rail-divider" />

      <button
        className="dc-rail-item dc-rail-bot"
        onClick={onOpenBotSettings}
        title={`${botUser?.username || "Bot"} status & profile`}
      >
        <i className="fa-solid fa-sliders"></i>
      </button>
    </nav>
  );
}
