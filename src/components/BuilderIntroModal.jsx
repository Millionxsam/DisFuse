import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";

import { DOCS, docsUrl } from "../config/docs.js";
import "../styles/components/builder-intro.css";

/* =====================================================================
   DisFuse Builder intro
   ---------------------------------------------------------------------
   Shown on My Projects the first time someone visits after DisFuse
   Builder came out. A few pages explain what it is and how it works.

   It only counts as seen once the person has reached the last page and
   closes it (Done, the X, Escape or the backdrop). Closing it any
   earlier just hides it for now; it comes back on the next visit.
   ===================================================================== */

export const BUILDER_INTRO_KEY = "disfuseBuilderIntroSeen";

/** Whether this browser has been through the whole intro. */
export function builderIntroSeen() {
  try {
    return localStorage.getItem(BUILDER_INTRO_KEY) === "true";
  } catch {
    return true;
  }
}

/* ---- The pictures --------------------------------------------------- */

function StepRow({ icon, color, label, value, delay = 0 }) {
  return (
    <div className="bi-mock-step" style={{ "--c": color, animationDelay: `${delay}ms` }}>
      <span className="bi-mock-step__icon">
        <i className={icon} aria-hidden />
      </span>
      <span className="bi-mock-step__label">{label}</span>
      {value && <span className="bi-mock-pill">{value}</span>}
    </div>
  );
}

function WelcomeArt() {
  return (
    <div className="bi-art bi-art--welcome" aria-hidden>
      <div className="bi-mock-card">
        <div className="bi-mock-card__head">
          <span className="bi-mock-chip">/ping</span>
          <span className="bi-mock-card__title">Slash command</span>
        </div>
        <StepRow icon="fa-solid fa-reply" color="#26a4af" label="Reply to the command" value="Pong! 🏓" delay={80} />
        <StepRow icon="fa-solid fa-hourglass-half" color="#c2724a" label="Wait" value="2 seconds" delay={160} />
        <StepRow icon="fa-solid fa-pen-to-square" color="#336eff" label="Edit the reply" value="Latency: 42ms" delay={240} />
      </div>
      <span className="bi-spark bi-spark--1">
        <i className="fa-solid fa-wand-magic-sparkles" />
      </span>
      <span className="bi-spark bi-spark--2">
        <i className="fa-solid fa-star" />
      </span>
    </div>
  );
}

function PiecesArt() {
  const pieces = [
    { icon: "fa-solid fa-terminal", color: "#3366cc", title: "Commands", text: "/ping, /ban, /rank" },
    { icon: "fa-solid fa-bolt", color: "#ffb648", title: "Events", text: "When someone joins" },
    { icon: "fa-solid fa-list-check", color: "#35d0a0", title: "Steps", text: "What the bot does" },
  ];
  return (
    <div className="bi-art bi-art--pieces" aria-hidden>
      {pieces.map((piece, index) => (
        <div className="bi-piece" key={piece.title} style={{ "--c": piece.color, animationDelay: `${index * 90}ms` }}>
          <span className="bi-piece__icon">
            <i className={piece.icon} />
          </span>
          <b>{piece.title}</b>
          <small>{piece.text}</small>
        </div>
      ))}
    </div>
  );
}

function ValuesArt() {
  return (
    <div className="bi-art bi-art--values" aria-hidden>
      <div className="bi-mock-card">
        <div className="bi-mock-card__head">
          <span className="bi-mock-chip bi-mock-chip--amber">
            <i className="fa-solid fa-bolt" /> Event
          </span>
          <span className="bi-mock-card__title">When a member joins</span>
        </div>
        <div className="bi-mock-step" style={{ "--c": "#336eff" }}>
          <span className="bi-mock-step__icon">
            <i className="fa-solid fa-paper-plane" />
          </span>
          <span className="bi-mock-step__label">Send a message to</span>
          <span className="bi-mock-pill bi-mock-pill--value">
            <i className="fa-solid fa-hashtag" /> #welcome
          </span>
        </div>
        <div className="bi-mock-message">
          <span className="bi-mock-message__bar" />
          <div>
            <b>Welcome!</b>
            <span>
              Hi <span className="bi-mock-pill bi-mock-pill--value bi-mock-pill--inline">The member</span>, you're member{" "}
              <span className="bi-mock-pill bi-mock-pill--value bi-mock-pill--inline">Member count</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditorsArt() {
  return (
    <div className="bi-art bi-art--editors" aria-hidden>
      <div className="bi-editor" style={{ "--c": "#ffb648" }}>
        <span className="bi-editor__icon">
          <i className="fa-solid fa-puzzle-piece" />
        </span>
        <b>Block Editor</b>
        <small>Snap blocks together</small>
      </div>
      <span className="bi-editors__link">
        <i className="fa-solid fa-arrow-right-arrow-left" />
      </span>
      <div className="bi-editor" style={{ "--c": "#8b6cff" }}>
        <span className="bi-editor__icon">
          <i className="fa-solid fa-wand-magic-sparkles" />
        </span>
        <b>DisFuse Builder</b>
        <small>Pick steps from menus</small>
      </div>
    </div>
  );
}

function StartArt() {
  return (
    <div className="bi-art bi-art--start" aria-hidden>
      <div className="bi-start-ring">
        <i className="fa-solid fa-rocket" />
      </div>
    </div>
  );
}

/* ---- The pages ------------------------------------------------------- */

const PAGES = [
  {
    eyebrow: "New in DisFuse",
    title: "Meet DisFuse Builder",
    art: WelcomeArt,
    body: (
      <>
        <p>
          A brand new way to make Discord bots. Instead of snapping blocks together, you pick what your bot should do from simple menus
          and fill in a few boxes.
        </p>
        <p>No blocks and no code. It's the easiest way to build a bot on DisFuse yet.</p>
      </>
    ),
  },
  {
    eyebrow: "How it works",
    title: "Commands, events and steps",
    art: PiecesArt,
    body: (
      <ul className="bi-list">
        <li>
          <i className="fa-solid fa-terminal" style={{ color: "#5b8cff" }} aria-hidden />
          <span>
            <b>Commands</b> are the slash commands and right-click commands people use, made on their own page with their options.
          </span>
        </li>
        <li>
          <i className="fa-solid fa-bolt" style={{ color: "#ffb648" }} aria-hidden />
          <span>
            <b>Events</b> run when something happens in a server, like a new member, a message or a button click.
          </span>
        </li>
        <li>
          <i className="fa-solid fa-list-check" style={{ color: "#35d0a0" }} aria-hidden />
          <span>
            <b>Steps</b> are what your bot does, in order: reply, send a message, give a role, wait, check something and more.
          </span>
        </li>
      </ul>
    ),
  },
  {
    eyebrow: "Values and messages",
    title: "Fill in the blanks",
    art: ValuesArt,
    body: (
      <>
        <p>
          Any box can use a <b>value</b> instead of text, like the member who used a command or the server's member count. Only the
          values that make sense in that spot are offered.
        </p>
        <p>
          Messages are built in the <b>message builder</b>, with containers, buttons, menus and pictures, and a live preview that looks
          just like Discord.
        </p>
      </>
    ),
  },
  {
    eyebrow: "Two editors",
    title: "The block editor isn't going anywhere",
    art: EditorsArt,
    body: (
      <>
        <p>
          You pick an editor when you make a new project. Your block projects stay exactly as they are, and you can copy one into
          DisFuse Builder any time from the block editor's <b>Utilities</b> menu.
        </p>
        <p>Templates and Workshop packs work in both editors, whichever one they were made with.</p>
      </>
    ),
  },
  {
    eyebrow: "You're all set",
    title: "Build your first bot",
    art: StartArt,
    body: (
      <>
        <p>
          Make a new project and choose <b>DisFuse Builder</b> as its editor. Collaborators, secrets, templates, exporting, Insights and
          Websites all work with it.
        </p>
        <p>
          Want a walkthrough first?{" "}
          <a href={docsUrl(DOCS.builderIntro)} target="_blank" rel="noopener noreferrer">
            Read the DisFuse Builder guide <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden />
          </a>
        </p>
      </>
    ),
  },
];

/* ---- The modal ------------------------------------------------------- */

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose  called however it closes; the intro
 *   has already been remembered as seen if it should be
 */
export default function BuilderIntroModal({ open, onClose }) {
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(1);
  const reachedEnd = useRef(false);
  const dialogRef = useRef(null);
  const last = page === PAGES.length - 1;

  if (last) reachedEnd.current = true;

  const close = useCallback(() => {
    if (reachedEnd.current) {
      try {
        localStorage.setItem(BUILDER_INTRO_KEY, "true");
      } catch {
        /* Storage can be unavailable; it just shows again next time. */
      }
    }
    onClose?.();
  }, [onClose]);

  const go = useCallback((next) => {
    setPage((current) => {
      const target = Math.max(0, Math.min(PAGES.length - 1, next(current)));
      setDirection(target >= current ? 1 : -1);
      return target;
    });
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    setPage(0);
    reachedEnd.current = false;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => dialogRef.current?.focus());

    const onKey = (event) => {
      if (event.key === "Escape") close();
      else if (event.key === "ArrowRight") go((p) => p + 1);
      else if (event.key === "ArrowLeft") go((p) => p - 1);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, [open, close, go]);

  if (!open) return null;

  const current = PAGES[page];
  const Art = current.art;

  return createPortal(
    <div className="bi-backdrop" onMouseDown={(event) => event.target === event.currentTarget && close()}>
      <div
        className="bi-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bi-title"
        tabIndex={-1}
        ref={dialogRef}
      >
        <button type="button" className="bi-close" onClick={close} aria-label="Close">
          <i className="fa-solid fa-xmark" aria-hidden />
        </button>

        <div className="bi-stage" key={page} data-direction={direction > 0 ? "next" : "back"}>
          <Art />
          <div className="bi-text">
            <span className="bi-eyebrow">{current.eyebrow}</span>
            <h2 id="bi-title">{current.title}</h2>
            <div className="bi-body">{current.body}</div>
          </div>
        </div>

        <div className="bi-footer">
          <div className="bi-dots" role="tablist" aria-label="Pages">
            {PAGES.map((p, index) => (
              <button
                type="button"
                key={p.title}
                role="tab"
                aria-selected={index === page}
                aria-label={`Page ${index + 1}: ${p.title}`}
                className={`bi-dot ${index === page ? "bi-dot--active" : ""} ${index < page ? "bi-dot--done" : ""}`}
                onClick={() => go(() => index)}
              />
            ))}
          </div>
          <div className="bi-buttons">
            {page > 0 && (
              <button type="button" className="bi-button bi-button--ghost" onClick={() => go((p) => p - 1)}>
                Back
              </button>
            )}
            {last ? (
              <>
                <Link to="/projects/new" className="bi-button bi-button--ghost bi-button--create" onClick={close}>
                  New project
                </Link>
                <button type="button" className="bi-button bi-button--primary" onClick={close}>
                  Done
                </button>
              </>
            ) : (
              <button type="button" className="bi-button bi-button--primary" onClick={() => go((p) => p + 1)}>
                Next <i className="fa-solid fa-arrow-right" aria-hidden />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
