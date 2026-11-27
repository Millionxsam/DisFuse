import { useState } from "react";
import Lottie from "lottie-react";
import Swal from "sweetalert2";

import DocsLink from "../../../components/DocsLink.jsx";
import { DOCS, docsUrl } from "../../../config/docs.js";
import modalThemeColor from "../../../functions/modalThemeColor";
import { userCache } from "../../../cache.ts";
import newProjectLottie from "/public/media/lotties/newProjectBot.json";
import "../../../styles/pages/new-project.css";

/* =====================================================================
   The pieces the project forms share
   ---------------------------------------------------------------------
   New Project, Clone Project and Edit Project all ask for the same
   things — a bot token, a description, who can see the project and
   the bot, and the invite permissions — so they're built from these.
   Styles live in styles/pages/new-project.css, under .np-page.
   ===================================================================== */

/* Public or private, for both the project and the bot. A project's text
   depends on its editor: a builder project has commands and steps, and
   no invited viewers. */
const VISIBILITY = {
  project: [
    {
      value: "public",
      label: "Public",
      icon: "fa-solid fa-earth-americas",
      blocks: "Listed on the explore page. Anyone can view its blocks.",
      builder:
        "Listed on the explore page. Anyone can see its commands and steps.",
    },
    {
      value: "private",
      label: "Private",
      icon: "fa-solid fa-lock",
      blocks: "Only you and the people you invite can see it.",
      builder: "Only you and your collaborators can see it.",
    },
  ],
  bot: [
    {
      value: "public",
      label: "Public",
      icon: "fa-solid fa-earth-americas",
      text: "Listed on the explore page. Anyone can add it to their server.",
    },
    {
      value: "private",
      label: "Private",
      icon: "fa-solid fa-lock",
      text: "Hidden from the explore page. Its info stays private.",
    },
  ],
};

/** The numbered steps under the page head. */
export function Steps({ labels, current }) {
  return (
    <ol className="np-steps" aria-label="Progress">
      {labels.map((label, i) => (
        <li
          key={label}
          className={
            i === current ? "is-current" : i < current ? "is-done" : ""
          }
          aria-current={i === current ? "step" : undefined}
        >
          <span className="np-steps__num">
            {i < current ? <i className="fa-solid fa-check"></i> : i + 1}
          </span>
          {label}
        </li>
      ))}
    </ol>
  );
}

/** A bot token field with a show/hide button. */
export function TokenInput({
  value,
  onChange,
  placeholder,
  disabled,
  autoFocus,
}) {
  const [shown, setShown] = useState(false);

  return (
    <label className={`np-token ${disabled ? "np-token--disabled" : ""}`}>
      <i className="fa-solid fa-key np-token__icon" aria-hidden></i>
      <input
        type={shown ? "text" : "password"}
        autoComplete="off"
        spellCheck={false}
        placeholder={placeholder}
        aria-label="Bot token"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
      />
      <button
        type="button"
        className="np-token__toggle"
        onClick={() => setShown((v) => !v)}
        disabled={disabled}
        aria-label={shown ? "Hide token" : "Show token"}
        title={shown ? "Hide token" : "Show token"}
      >
        <i
          className={`fa-solid noRotate ${shown ? "fa-eye-slash" : "fa-eye"}`}
        ></i>
      </button>
    </label>
  );
}

/** Where to find a bot token, folded away until asked for. */
export function TokenHelp() {
  return (
    <details className="np-help">
      <summary>
        <i className="fa-solid fa-circle-question"></i>
        Where do I find my bot token?
        <i className="fa-solid fa-chevron-down np-help__chevron"></i>
      </summary>
      <ol>
        <li>
          Open the{" "}
          <a
            href="https://discord.com/developers/applications"
            target="_blank"
            rel="noopener noreferrer"
          >
            Discord Developer Portal
          </a>{" "}
          and pick your application, or make a new one.
        </li>
        <li>
          Go to the <b>Bot</b> tab and press <b>Reset Token</b>.
        </li>
        <li>Copy the token and paste it in.</li>
      </ol>
      <p>
        New to this?{" "}
        <a
          href={docsUrl(DOCS.creatingABot)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Read the full guide
        </a>
        .
      </p>
    </details>
  );
}

/** Step one of making a project: the graphic and the token field. */
export function ConnectBot({ token, setToken, loading, onSubmit }) {
  return (
    <section className="np-connect">
      <Lottie
        animationData={newProjectLottie}
        className="np-connect__art"
        aria-hidden
      />
      <div className="np-connect__text">
        <h2>Enter your bot token</h2>
        <p>
          DisFuse uses it to run your bot for you. Keep it secret: anyone who
          has it can control your bot.
        </p>
      </div>

      <form
        className="np-connect__form"
        onSubmit={(e) => {
          e.preventDefault();
          if (token.trim() && !loading) onSubmit();
        }}
      >
        <TokenInput
          value={token}
          onChange={setToken}
          placeholder="Paste your bot token"
          autoFocus
        />
        <button
          type="submit"
          className="np-btn np-btn--primary"
          disabled={!token.trim() || loading}
        >
          {loading ? (
            <>
              <i className="fa-solid fa-circle-notch fa-spin noRotate"></i>
              Checking
            </>
          ) : (
            <>
              Continue
              <i className="fa-solid fa-arrow-right noRotate"></i>
            </>
          )}
        </button>
      </form>

      <TokenHelp />
    </section>
  );
}

/** The bot a project runs, beside the form. `children` go at the bottom. */
export function BotCard({ bot, children }) {
  return (
    <aside className="np-bot">
      <img src={botAvatar(bot)} alt="" />
      <div className="np-bot__name">
        <b>{bot.global_name || bot.displayName || bot.username}</b>
        <span>@{bot.username}</span>
      </div>
      <dl>
        <dt>Bot ID</dt>
        <dd>{bot.id}</dd>
      </dl>
      {children}
    </aside>
  );
}

/** One section of the form. */
export function Card({
  title,
  optional,
  docs,
  description,
  className = "",
  id,
  children,
}) {
  return (
    <section className={`np-card ${className}`} id={id}>
      <header>
        <h2>
          {title}
          {optional && <span className="np-optional">Optional</span>}
          {docs && (
            <DocsLink page={docs.page} variant="icon" label={docs.label} />
          )}
        </h2>
        {description && <p>{description}</p>}
      </header>
      {children}
    </section>
  );
}

export function DescriptionCard({ value, onChange, disabled }) {
  return (
    <Card
      title="Description"
      optional
      description="A sentence or two about what your bot does."
    >
      <textarea
        className="np-input"
        placeholder="What does your bot do?"
        rows={3}
        value={value || ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </Card>
  );
}

/**
 * Who can see the project and the bot.
 * @param {"blocks"|"builder"} props.editor which text the project options use
 */
export function VisibilityCard({
  editor,
  project,
  setProject,
  bot,
  setBot,
  projectDisabled,
  botDisabled,
}) {
  return (
    <Card
      title="Visibility"
      docs={{
        page: `${DOCS.projectSettings}#project-visibility`,
        label: "About project visibility",
      }}
      description={
        <>
          Who can find your project and your bot. You can change this later.{" "}
          <button
            type="button"
            className="np-link"
            onClick={showVisibilityInfo}
          >
            See examples
          </button>
        </>
      }
    >
      <div className="np-vis">
        <h3>Project</h3>
        <Choices
          label="Project visibility"
          options={VISIBILITY.project}
          text={(o) => (editor === "builder" ? o.builder : o.blocks)}
          value={project}
          onPick={setProject}
          disabled={projectDisabled}
        />
      </div>
      <div className="np-vis">
        <h3>Bot</h3>
        <Choices
          label="Bot visibility"
          options={VISIBILITY.bot}
          text={(o) => o.text}
          value={bot}
          onPick={setBot}
          disabled={botDisabled}
        />
      </div>
    </Card>
  );
}

function Choices({ label, options, text, value, onPick, disabled }) {
  return (
    <div className="np-choices" role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <button
          type="button"
          role="radio"
          key={option.value}
          aria-checked={value === option.value}
          className={`np-choice ${value === option.value ? "np-choice--active" : ""}`}
          disabled={disabled}
          onClick={() => onPick(option.value)}
        >
          <i className={`${option.icon} noRotate`} aria-hidden></i>
          <span>
            <b>{option.label}</b>
            <small>{text(option)}</small>
          </span>
        </button>
      ))}
    </div>
  );
}

export function PermissionsCard({ value, onChange, disabled }) {
  return (
    <Card
      title="Permissions"
      docs={{
        page: `${DOCS.projectSettings}#permissions`,
        label: "About bot permissions",
      }}
      description={
        <>
          The permissions your bot asks for when someone adds it to a server.
          Pick them in the{" "}
          <a
            href="https://discordapi.com/permissions.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            permissions calculator
          </a>{" "}
          and paste the number it gives you here.
        </>
      }
    >
      <input
        className="np-input np-input--number"
        type="number"
        min={0}
        inputMode="numeric"
        aria-label="Permissions integer"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
      />
    </Card>
  );
}

/** The submit button at the bottom of a form. */
export function SubmitButton({ busy, busyLabel, icon, children, ...props }) {
  return (
    <div className="np-actions">
      <button
        type="button"
        className="np-btn np-btn--primary"
        disabled={busy}
        {...props}
      >
        {busy ? (
          <>
            <i className="fa-solid fa-circle-notch fa-spin noRotate"></i>
            {busyLabel}
          </>
        ) : (
          <>
            <i className={`${icon} noRotate`}></i>
            {children}
          </>
        )}
      </button>
    </div>
  );
}

export function botAvatar(bot) {
  if (bot?.avatar)
    return `https://cdn.discordapp.com/avatars/${bot.id}/${bot.avatar}.png?size=256`;
  // Discord's default avatars, as it picks them for new usernames.
  let index = 0;
  try {
    index = Number((BigInt(bot.id) >> 22n) % 6n);
  } catch {
    /* no id yet */
  }
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
}

/* Four examples of how project and bot visibility combine. */
export function showVisibilityInfo() {
  const Queue = Swal.mixin({
    progressSteps: ["1", "2", "3", "4"],
    animation: false,
    showCancelButton: true,
    cancelButtonText: "Close",
    confirmButtonText: "Next >",

    ...modalThemeColor(userCache.user),
  });

  Queue.fire({
    animation: true,
    title: "Situation 1",
    html: `<strong>Project visibility is public, bot visibility is private</strong> <br /> <br /> This means your project will show up on the explore page. Anyone can search for and view your project, including the blocks. However, no one will be able to view your bot information or add your bot to servers.`,
    currentProgressStep: 0,
  }).then((r) => {
    if (!r.isConfirmed) return;

    Queue.fire({
      title: "Situation 2",
      html: `<strong>Project visibility is private, bot visibility is public</strong> <br /> <br /> Your project will not show up on the explore page, and only people you invite can view your project and its blocks. However, anyone can search for and view your bot's information (username, server count, etc.) and add your bot to their servers.`,
      currentProgressStep: 1,
    }).then((r) => {
      if (!r.isConfirmed) return;

      Queue.fire({
        title: "Situation 3",
        html: `<strong>Both project and bot visibility are public</strong> <br /> <br /> Your project and bot information will both show up together on the explore page, and anyone can search for and view your project and its blocks. Additionally, anyone can add your bot to their servers and view its information.`,
        currentProgressStep: 2,
      }).then((r) => {
        if (!r.isConfirmed) return;

        Queue.fire({
          title: "Situation 4",
          html: `<strong>Both project and bot visibility are private</strong> <br /> <br /> No one except you and the people you invite can view your project, its blocks, or your bot's information. Your project will not show up on the explore page, and only invited users can view your project and its blocks.`,
          currentProgressStep: 3,
          showConfirmButton: false,
        });
      });
    });
  });
}
