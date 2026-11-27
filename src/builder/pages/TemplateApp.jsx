import { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link, Navigate, Route, Routes } from "react-router-dom";

import PageLayout, { Section } from "../components/layout/PageLayout.jsx";
import { secretNamesIn } from "../model/templates.js";
import { validateProject } from "../model/validate.js";
import { useBuilder } from "../state/BuilderProvider.jsx";
import { TemplateBuilderProvider } from "../state/TemplateBuilderProvider.jsx";
import { Badge, Chip, DialogHost, Toaster } from "../ui/index.js";
import CommandPage from "./CommandPage.jsx";
import CommandsPage from "./CommandsPage.jsx";
import EventPage from "./EventPage.jsx";
import EventsPage from "./EventsPage.jsx";
import FlowPage from "./FlowPage.jsx";
import OptionPage from "./OptionPage.jsx";

import "../../styles/builder/pages.css";
import "../../styles/builder/templates.css";

/* =====================================================================
   The template builder, for DisFuse Builder templates
   ---------------------------------------------------------------------
   What /templates/:templateId/builder shows for a template made with
   DisFuse Builder (it can still be added to any project). It's the builder itself (the same Commands
   and Events pages, the same step builder) with a template behind it
   instead of a project, so a template is built exactly the way a bot
   is. What's missing is everything about a bot: no token, no secrets,
   no collaborators, no export. Those belong to whoever adds it.

     /templates/:id/builder                                 the template's home
     /templates/:id/builder/commands                        its commands
     /templates/:id/builder/commands/:commandId             one command
     /templates/:id/builder/commands/:commandId/builder     its steps
     /templates/:id/builder/commands/:c/options/:optionId   an option, subcommand or group
     /templates/:id/builder/commands/:c/options/:o/builder  a subcommand's steps
     /templates/:id/builder/events                          its events
     /templates/:id/builder/events/:eventId                 one event
     /templates/:id/builder/events/:eventId/builder         its steps
   ===================================================================== */

const LEVEL_ICONS = {
  error: "fa-solid fa-circle-xmark",
  warning: "fa-solid fa-triangle-exclamation",
  info: "fa-solid fa-circle-info",
};

function NavCard({ to, icon, tint, title, description, badge, children }) {
  return (
    <Link to={to} className="dfb-navcard" style={{ "--tint": tint }}>
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
    </Link>
  );
}

function TemplateHome() {
  const { template, builder, catalog, paths } = useBuilder();

  const problems = useMemo(() => validateProject(builder, catalog), [builder, catalog]);
  const serious = problems.filter((p) => p.level !== "info");
  const secrets = useMemo(() => secretNamesIn(builder), [builder]);
  const empty = !builder.commands.length && !builder.events.length;

  const commandChips = builder.commands.slice(0, 6).map((c) => (
    <Chip key={c.id} icon={(c.kind ?? "slash") === "slash" ? "fa-solid fa-slash" : "fa-solid fa-computer-mouse"} color="#35d0a0">
      {c.name}
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
      <div className="dfb-hero dfb-tpl-hero">
        <div className="dfb-hero__body">
          <div className="dfb-tpl-hero__icon" aria-hidden>
            <i className="fa-solid fa-shapes" />
          </div>
          <div className="dfb-hero__who">
            <h1 className="dfb-hero__name">
              {template.name}
              <Badge tone="violet" icon="fa-solid fa-wand-magic-sparkles">
                DisFuse Builder template
              </Badge>
            </h1>
            <div className="dfb-hero__meta">
              <span>
                <i className={template.private ? "fa-solid fa-lock" : "fa-solid fa-earth-americas"} aria-hidden />{" "}
                {template.private ? "Private: only you can add it" : "Public once you publish it"}
              </span>
            </div>
          </div>
        </div>
        <div className="dfb-hero__about dfb-tpl-hero__about">
          {template.description ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{template.description}</ReactMarkdown>
          ) : (
            "Add the commands and events you want to share. People pick which of their bots to add them to, so there's no bot token, secrets or bot settings here. Your work saves as you go, and nobody else sees it until you press Publish."
          )}
        </div>
      </div>

      {empty && (
        <Section title="Build your template" icon="fa-solid fa-rocket" description="It works just like building a bot.">
          <ol className="dfb-steps-guide" style={{ margin: 0, padding: 0 }}>
            <li>
              <span className="dfb-steps-guide__num">1</span>
              <span>
                <b>Add commands and events</b>Everything you add here goes into the bot of whoever adds your template.
              </span>
            </li>
            <li>
              <span className="dfb-steps-guide__num">2</span>
              <span>
                <b>Add steps</b>Pick what each one does. Need an API key or a password? Use the Secret value, and people will add their own.
              </span>
            </li>
            <li>
              <span className="dfb-steps-guide__num">3</span>
              <span>
                <b>Publish it</b>Then anyone can add it to any of their projects from the Templates page. In a Block Editor project, it becomes blocks.
              </span>
            </li>
          </ol>
        </Section>
      )}

      <nav className="dfb-navcards" aria-label="Build your template">
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
          description="Things that happen on Discord, like a new message or someone joining a server, and what the bot does then."
        >
          {eventChips.length > 0 && <span className="dfb-navcard__chips">{eventChips}</span>}
        </NavCard>
      </nav>

      {secrets.length > 0 && (
        <Section
          title="Secrets it needs"
          icon="fa-solid fa-user-secret"
          description="Secrets aren't part of a template. When someone adds it, we'll tell them to save these on their own bot, with these exact names."
        >
          <span className="dfb-navcard__chips">
            {secrets.map((name) => (
              <Chip key={name} icon="fa-solid fa-key" color="#e23fe2">
                {name}
              </Chip>
            ))}
          </span>
        </Section>
      )}

      {serious.length > 0 && (
        <Section
          title="Things to fix"
          icon="fa-solid fa-screwdriver-wrench"
          description="You can still publish, but people who add the template will get these problems too."
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
    </PageLayout>
  );
}

function Shell() {
  const { template, paths } = useBuilder();
  return (
    <>
      <Helmet>
        <title>{`${template.name} | Template Builder | DisFuse`}</title>
      </Helmet>
      <Routes>
        <Route index element={<TemplateHome />} />
        <Route path="commands" element={<CommandsPage />} />
        <Route path="commands/:commandId" element={<CommandPage />} />
        <Route path="commands/:commandId/builder" element={<FlowPage source="command" />} />
        <Route path="commands/:commandId/options/:optionId" element={<OptionPage />} />
        <Route path="commands/:commandId/options/:optionId/builder" element={<FlowPage source="option" />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="events/:eventId" element={<EventPage />} />
        <Route path="events/:eventId/builder" element={<FlowPage source="event" />} />
        <Route path="*" element={<Navigate to={paths.workspace} replace />} />
      </Routes>
    </>
  );
}

/**
 * @param {object} props
 * @param {object} props.template  GET /templates/:id, already checked to be the viewer's own
 */
export default function TemplateApp({ template }) {
  return (
    <TemplateBuilderProvider template={template}>
      <div className="dfb-root dfb-app">
        <Shell />
        <Toaster />
        <DialogHost />
      </div>
    </TemplateBuilderProvider>
  );
}
