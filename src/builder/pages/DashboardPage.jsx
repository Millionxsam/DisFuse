import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import CodeModal from "../components/export/CodeModal.jsx";
import ExportModal from "../components/export/ExportModal.jsx";
import PageLayout, { Section } from "../components/layout/PageLayout.jsx";
import SecretsModal from "../components/settings/SecretsModal.jsx";
import { validateProject } from "../model/validate.js";
import { useBuilder } from "../state/BuilderProvider.jsx";
import useBotInfo from "../state/useBotInfo.js";
import { AnimatedNumber, Badge, Button, Chip, Skeleton, toast } from "../ui/index.js";

/* =====================================================================
   The dashboard
   ---------------------------------------------------------------------
   What opens at /workspace: the bot at the top (read from Discord with
   its own token), the things you do with the whole bot (add it to a
   server, export it, look at its code), and then the places you build
   it: Commands, Events, Secrets, Collaborators, Versions and Settings.

   Collaborators see the cards their permissions make useful: Secrets
   only if they may see them, Settings only if they may change one.
   ===================================================================== */

const SETTINGS_PERMISSIONS = [
  "settings.description",
  "settings.visibility",
  "settings.botVisibility",
  "settings.invitePermissions",
  "token.view",
  "token.change",
];

const LEVEL_ICONS = {
  error: "fa-solid fa-circle-xmark",
  warning: "fa-solid fa-triangle-exclamation",
  info: "fa-solid fa-circle-info",
};

function BotHero({ onExport, onCode }) {
  const { project, builder, paths, isOwner, can } = useBuilder();
  const bot = useBotInfo(project);

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(bot.user?.id ?? "");
      toast.success("Bot ID copied");
    } catch {
      toast.error("Couldn't copy the ID");
    }
  };

  const verified = Boolean(bot.application?.flags & (1 << 16)) || Boolean(bot.user?.flags & (1 << 16));
  const slash = builder.commands.filter((c) => (c.kind ?? "slash") === "slash").length;
  const rightClick = builder.commands.length - slash;

  return (
    <div className="dfb-hero">
      <div className="dfb-hero__body">
        <div className="dfb-hero__avatar">{bot.loading ? <Skeleton width="100%" height="100%" radius="50%" /> : <img src={bot.avatarUrl} alt="" />}</div>
        <div className="dfb-hero__who">
          <h1 className="dfb-hero__name">
            {bot.user?.username ?? project.name}
            <Badge tone="violet" icon="fa-solid fa-robot">
              Bot
            </Badge>
            {verified && (
              <Badge tone="mint" icon="fa-solid fa-circle-check">
                Verified
              </Badge>
            )}
          </h1>
          <div className="dfb-hero__meta">
            {bot.user?.id && (
              <button type="button" onClick={copyId} title="Copy the bot's ID">
                <i className="fa-regular fa-copy" aria-hidden /> {bot.user.id}
              </button>
            )}
            {project.private ? (
              <span>
                <i className="fa-solid fa-lock" aria-hidden /> Private project
              </span>
            ) : (
              <span>
                <i className="fa-solid fa-earth-americas" aria-hidden /> Public project
              </span>
            )}
          </div>
        </div>
      </div>

      {bot.tokenInvalid && (
        <div className="dfb-note dfb-note--danger" style={{ margin: "0 26px 18px" }}>
          <i className="fa-solid fa-key" aria-hidden />
          <div>
            <strong>Discord doesn't accept this bot's token anymore.</strong> It may have been reset in the Discord Developer Portal.{" "}
            {can("token.change") ? (
              <>
                <Link to={paths.edit}>Update the token in Settings</Link> so your exported bot can log in.
              </>
            ) : (
              "Let the project's owner know, so they can update it."
            )}
          </div>
        </div>
      )}

      {bot.application?.description && <p className="dfb-hero__about">{bot.application.description}</p>}

      <div className="dfb-hero__actions">
        {bot.inviteUrl && (
          <Button variant="primary" icon="fa-brands fa-discord" onClick={() => window.open(bot.inviteUrl, "_blank", "noopener")}>
            Add to a server
          </Button>
        )}
        <Button variant="mint" icon="fa-solid fa-file-zipper" onClick={onExport}>
          Export bot
        </Button>
        <Button variant="secondary" icon="fa-solid fa-code" onClick={onCode}>
          View code
        </Button>
        {can("insights.view") && (
          <Link className="dfb-btn dfb-btn--ghost" to={`/insights/${project._id}`}>
            <i className="fa-solid fa-chart-line" aria-hidden /> Insights
          </Link>
        )}
        {/* Control drives the bot live, so it stays with the owner. */}
        {isOwner && (
          <Link className="dfb-btn dfb-btn--ghost" to={`/control/${project._id}`}>
            <i className="fa-solid fa-gamepad" aria-hidden /> Control
          </Link>
        )}
      </div>

      <div className="dfb-stats">
        {[
          { icon: "fa-solid fa-server", tint: "#8b6cff", value: bot.guildCount, label: "Servers" },
          { icon: "fa-solid fa-user-plus", tint: "#4fa8ff", value: bot.userInstallCount, label: "Personal installs" },
          { icon: "fa-solid fa-terminal", tint: "#35d0a0", value: builder.commands.length, label: rightClick ? `Commands (${rightClick} right-click)` : "Commands" },
          { icon: "fa-solid fa-bolt", tint: "#ffb648", value: builder.events.length, label: "Events" },
        ].map((stat) => (
          <div className="dfb-stat" key={stat.label} style={{ "--tint": stat.tint }}>
            <span className="dfb-stat__icon">
              <i className={stat.icon} aria-hidden />
            </span>
            <span>
              <span className="dfb-stat__value">{stat.value === null || stat.value === undefined ? (bot.loading ? "…" : "–") : <AnimatedNumber value={stat.value} />}</span>
              <span className="dfb-stat__label">{stat.label}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NavCard({ to, onClick, icon, tint, title, description, children, badge }) {
  const content = (
    <>
      <span className="dfb-navcard__icon">
        <i className={icon} aria-hidden />
      </span>
      <span className="dfb-navcard__text">
        <span className="dfb-navcard__title">
          {title}
          {badge}
        </span>
        <span className="dfb-navcard__desc" style={{ display: "block" }}>
          {description}
        </span>
        {children}
      </span>
      <span className="dfb-navcard__arrow" aria-hidden>
        <i className="fa-solid fa-arrow-right" />
      </span>
    </>
  );
  return to ? (
    <Link to={to} className="dfb-navcard" style={{ "--tint": tint }}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className="dfb-navcard" style={{ "--tint": tint }}>
      {content}
    </button>
  );
}

export default function DashboardPage() {
  const { project, builder, catalog, paths, isOwner, can, versions } = useBuilder();
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);
  const [showingCode, setShowingCode] = useState(false);
  const [showingSecrets, setShowingSecrets] = useState(false);
  const secretCount = project?.secrets?.length ?? 0;
  const collaboratorCount = project?.collaborators?.length ?? 0;
  const showSettings = isOwner || SETTINGS_PERMISSIONS.some(can);

  const problems = useMemo(() => validateProject(builder, catalog), [builder, catalog]);
  const serious = problems.filter((p) => p.level !== "info");
  const empty = !builder.commands.length && !builder.events.length;

  const commandChips = builder.commands.slice(0, 6).map((c) => (
    <Chip key={c.id} icon={(c.kind ?? "slash") === "slash" ? "fa-solid fa-slash" : "fa-solid fa-computer-mouse"} color="#35d0a0">
      {(c.kind ?? "slash") === "slash" ? c.name : c.name}
    </Chip>
  ));
  const eventChips = builder.events.slice(0, 6).map((e) => {
    const def = catalog.events.get(e.type);
    return (
      <Chip key={e.id} icon={def?.icon ?? "fa-solid fa-bolt"} color={catalog.categoryById[def?.category]?.color ?? "#ffb648"}>
        {e.label || def?.label || "Event"}
      </Chip>
    );
  });

  return (
    <PageLayout crumbs={[]}>
      <BotHero onExport={() => setExporting(true)} onCode={() => setShowingCode(true)} />

      {empty && (
        <Section title="Let's build your bot" icon="fa-solid fa-rocket" description="Three steps from here to a working bot.">
          <ol className="dfb-steps-guide" style={{ margin: 0, padding: 0 }}>
            <li>
              <span className="dfb-steps-guide__num">1</span>
              <span>
                <b>Add a command or an event</b>A command is something people type, like /ping. An event is something that happens, like someone joining.
              </span>
            </li>
            <li>
              <span className="dfb-steps-guide__num">2</span>
              <span>
                <b>Add steps</b>Pick what the bot does, like sending a message, and fill in the details.
              </span>
            </li>
            <li>
              <span className="dfb-steps-guide__num">3</span>
              <span>
                <b>Export and run it</b>Download your bot and start it, on your computer or a hosting service.
              </span>
            </li>
          </ol>
        </Section>
      )}

      <nav className="dfb-navcards" aria-label="Build your bot">
        <NavCard
          to={`${paths.workspace}/commands`}
          icon="fa-solid fa-terminal"
          tint="#35d0a0"
          title="Commands"
          badge={<Badge>{builder.commands.length}</Badge>}
          description="Slash commands people type, like /ping, and right-click commands. Choose what each one does."
        >
          {commandChips.length > 0 && <span className="dfb-navcard__chips">{commandChips}</span>}
        </NavCard>
        <NavCard
          to={`${paths.workspace}/events`}
          icon="fa-solid fa-bolt"
          tint="#ffb648"
          title="Events"
          badge={<Badge>{builder.events.length}</Badge>}
          description="Things that happen on Discord, like a new message or someone joining a server, and what your bot does then."
        >
          {eventChips.length > 0 && <span className="dfb-navcard__chips">{eventChips}</span>}
        </NavCard>
        {(can("commands.create") || can("events.create")) && (
          <NavCard
            to="/templates"
            icon="fa-solid fa-shapes"
            tint="#4fa8ff"
            title="Templates"
            description="Ready-made commands and events shared by the community and the DisFuse team. Add one and change it however you like."
          />
        )}
        {can("secrets.view") && (
          <NavCard
            onClick={() => setShowingSecrets(true)}
            icon="fa-solid fa-user-secret"
            tint="#e23fe2"
            title="Secrets"
            badge={<Badge>{secretCount}</Badge>}
            description="API keys and other private values your bot uses. They go in the .env file when you export, never in your steps."
          />
        )}
        <NavCard
          to={paths.collaborators}
          icon="fa-solid fa-user-group"
          tint="#ff6fa8"
          title="Collaborators"
          badge={<Badge>{collaboratorCount}</Badge>}
          description={
            isOwner
              ? "Invite people to build this bot with you, and choose exactly what each of them can do."
              : "Who's working on this bot, and what each person can do. You can leave the project here too."
          }
        />
        <NavCard
          to={paths.versions}
          icon="fa-solid fa-code-branch"
          tint="#4fa8ff"
          title="Versions"
          badge={versions.versions.length > 0 && <Badge>{versions.versions.length}</Badge>}
          description={
            versions.active
              ? `Editing ${versions.active.name}. Make a new version before a big change, switch between them, or export any of them.`
              : "Save your whole bot as a version you can come back to, and try big changes without touching what works."
          }
        />
        {showSettings && (
          <NavCard
            onClick={() => navigate(paths.edit)}
            icon="fa-solid fa-gear"
            tint="#8b6cff"
            title="Settings"
            description="The bot token, description, who can see the project and the bot's permissions."
          />
        )}
      </nav>

      {serious.length > 0 && (
        <Section
          title="Things to fix"
          icon="fa-solid fa-screwdriver-wrench"
          description="Your bot can still be exported, but these parts probably won't work as built."
          actions={<Badge tone={serious.some((p) => p.level === "error") ? "danger" : "amber"}>{serious.length}</Badge>}
        >
          <ul className="dfb-problems">
            {serious.slice(0, 8).map((problem, index) => (
              <li key={index}>
                <Link to={`${paths.workspace}/${problem.to}`} className={`dfb-problem dfb-problem--${problem.level}`}>
                  <i className={LEVEL_ICONS[problem.level]} aria-hidden />
                  <span className="dfb-problem__text">
                    <small>{problem.where}</small>
                    {problem.message}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {serious.length > 8 && <p style={{ margin: "10px 2px 0", color: "var(--dfb-faint)", fontSize: "0.85rem" }}>And {serious.length - 8} more.</p>}
        </Section>
      )}

      <ExportModal open={exporting} onClose={() => setExporting(false)} />
      <CodeModal open={showingCode} onClose={() => setShowingCode(false)} />
      <SecretsModal open={showingSecrets} onClose={() => setShowingSecrets(false)} />
    </PageLayout>
  );
}
