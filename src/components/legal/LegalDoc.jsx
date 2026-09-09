import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";

/* =====================================================================
   Legal document shell
   ---------------------------------------------------------------------
   Both legal pages (Terms of Service, Privacy Policy) are the same
   shape: a long numbered document nobody wants to scroll blindly. This
   component supplies everything around the words — the header, the
   "in short" cards, the sticky contents rail with its filter and
   scroll-spy, the deep-linkable section headings and the progress bar —
   so each page file only has to hold its own text.

   The pages pass `parts`: an ordered list of groups, each with its own
   sections. Sections are numbered continuously across the whole
   document (1, 2, 3 …) rather than per group, so "section 14" means one
   thing whichever group it happens to live in.

     parts = [{
       title: "The agreement",
       sections: [{ id, title, body }],
     }]

   `id` is the anchor: /tos#premium-billing has to keep working once it
   is written down somewhere, so ids are chosen by the page and never
   derived from the title.
   ===================================================================== */

/** Flattens `parts` into one numbered list, keeping the group on each. */
function numberSections(parts) {
  let n = 0;

  return parts.map((part) => ({
    ...part,
    sections: part.sections.map((section) => ({ ...section, number: ++n })),
  }));
}

/**
 * id → section, so a cross-reference can look its own number up.
 *
 * See `Ref` at the bottom of this file: writing "see section 14" by hand
 * is a bug waiting for the next edit, because inserting one section
 * silently renumbers every reference after it.
 */
const SectionContext = createContext(new Map());

export default function LegalDoc({
  tag,
  title,
  icon,
  lead,
  lastUpdated,
  effective,
  summary = [],
  parts = [],
  related,
  children,
}) {
  const location = useLocation();

  const numbered = useMemo(() => numberSections(parts), [parts]);
  const flat = useMemo(
    () => numbered.flatMap((part) => part.sections),
    [numbered],
  );

  const byId = useMemo(
    () => new Map(flat.map((section) => [section.id, section])),
    [flat],
  );

  const [query, setQuery] = useState("");
  const [active, setActive] = useState(flat[0]?.id ?? null);
  const [scrolled, setScrolled] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [copied, setCopied] = useState(null);

  const articleRef = useRef(null);
  const progressRef = useRef(null);

  /* ---- Scroll spy -------------------------------------------------
     `active` is the last heading to have crossed the top of the
     viewport, not whichever section happens to be the most visible:
     the reader is looking at the text under the heading they scrolled
     past, and short sections would otherwise never light up at all.

     Two things this handler must not do, because these documents are
     tens of thousands of pixels long and hold dozens of sections:

       - re-render on every scroll event. The progress bar therefore
         moves by writing to the DOM node directly, and the two pieces
         of state left here only change when you actually cross a
         heading or the top of the page. Driving the bar from state
         re-rendered the whole document on every frame and made
         scrolling on a phone unusable.
       - do work synchronously per event. Everything is coalesced into
         one animation frame. */
  useEffect(() => {
    const headings = flat
      .map((section) => document.getElementById(section.id))
      .filter(Boolean);

    if (!headings.length) return;

    let frame = null;

    const measure = () => {
      frame = null;

      const line = window.innerHeight * 0.25;

      let current = headings[0];
      for (const heading of headings) {
        if (heading.getBoundingClientRect().top <= line) current = heading;
        else break;
      }

      setActive(current.id);
      setScrolled(window.scrollY > 400);

      const article = articleRef.current;
      const bar = progressRef.current;

      if (article && bar) {
        const total = article.offsetHeight - window.innerHeight;
        const past = window.scrollY - article.offsetTop;
        const percent =
          total > 0 ? Math.min(100, Math.max(0, (past / total) * 100)) : 0;

        bar.style.width = `${percent}%`;
      }
    };

    const onScroll = () => {
      if (frame === null) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [flat]);

  /* Deep links. The document is long and people link to parts of it, so
     /pp#insights has to land on the right section even on a cold load,
     after the sections have actually rendered. */
  useEffect(() => {
    if (!location.hash) return;

    const target = document.getElementById(location.hash.slice(1));
    if (!target) return;

    const frame = requestAnimationFrame(() =>
      target.scrollIntoView({ behavior: "smooth", block: "start" }),
    );

    return () => cancelAnimationFrame(frame);
  }, [location.hash, flat]);

  /* Keeps the active entry in view inside the rail on long documents.

     Deliberately not `scrollIntoView`: that scrolls every scrollport
     between the link and the document, so on a page whose own scroll
     position is what decides `active`, it feeds straight back into the
     scroll handler. Moving the rail's own `scrollTop` cannot. */
  useEffect(() => {
    if (!active) return;

    const list = document.querySelector(".df-legal-toc-list");
    const link = list?.querySelector(`a[data-for="${active}"]`);
    if (!list || !link || !link.offsetParent) return;

    const top = link.offsetTop;
    const bottom = top + link.offsetHeight;

    if (top < list.scrollTop) list.scrollTop = top - 8;
    else if (bottom > list.scrollTop + list.clientHeight)
      list.scrollTop = bottom - list.clientHeight + 8;
  }, [active]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return numbered;

    return numbered
      .map((part) => ({
        ...part,
        sections: part.sections.filter(
          (section) =>
            section.title.toLowerCase().includes(needle) ||
            String(section.number) === needle ||
            part.title.toLowerCase().includes(needle),
        ),
      }))
      .filter((part) => part.sections.length);
  }, [numbered, query]);

  const goTo = useCallback((event, id) => {
    event.preventDefault();
    setTocOpen(false);

    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });

    /* Update the address bar without another scroll from the router. */
    window.history.replaceState(null, "", `#${id}`);
  }, []);

  const copyLink = useCallback((id) => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`;

    navigator.clipboard?.writeText(url).then(
      () => {
        setCopied(id);
        setTimeout(() => setCopied(null), 1600);
      },
      () => {},
    );
  }, []);

  const activeSection = flat.find((section) => section.id === active);

  /* The document itself only depends on the sections and on which
     anchor was last copied — never on scroll position or on the rail's
     filter. Memoising it means scrolling reconciles the rail and
     nothing else, which on a document this size is the difference
     between smooth and unusable. */
  const document_ = useMemo(
    () =>
      numbered.map((part) => (
        <div className="df-legal-part" key={part.title}>
          <div className="df-legal-part-head">
            <span className="line"></span>
            <h2>{part.title}</h2>
            <span className="line"></span>
          </div>

          {part.sections.map((section) => (
            <section
              className="df-legal-section"
              id={section.id}
              key={section.id}
            >
              <h3>
                <span className="df-legal-number">{section.number}</span>
                <span className="df-legal-heading">{section.title}</span>
                <button
                  className="df-legal-anchor"
                  onClick={() => copyLink(section.id)}
                  title="Copy a link to this section"
                  aria-label={`Copy a link to section ${section.number}`}
                >
                  <i
                    className={`fa-solid fa-${
                      copied === section.id ? "check" : "link"
                    }`}
                  ></i>
                </button>
              </h3>

              <div className="df-legal-content">{section.body}</div>
            </section>
          ))}
        </div>
      )),
    [numbered, copied, copyLink],
  );

  return (
    <SectionContext.Provider value={byId}>
      <div className="df-legal">
        <Helmet>
          <title>{title} | DisFuse</title>
        </Helmet>

        <div className="df-legal-progress" aria-hidden="true">
          <span ref={progressRef} />
        </div>

        <header className="df-legal-hero">
          <span className="df-tag">
            <i className={icon}></i> {tag}
          </span>
          <h1>{title}</h1>
          <p className="lead">{lead}</p>

          <div className="df-legal-meta">
            <span className="df-legal-chip">
              <i className="fa-solid fa-clock-rotate-left"></i>
              Last updated <strong>{lastUpdated}</strong>
            </span>
            {effective && (
              <span className="df-legal-chip">
                <i className="fa-solid fa-calendar-check"></i>
                Effective <strong>{effective}</strong>
              </span>
            )}
            <span className="df-legal-chip">
              <i className="fa-solid fa-list-ol"></i>
              <strong>{flat.length}</strong> sections
            </span>
            {related && (
              <Link className="df-legal-chip link" to={related.to}>
                <i className={related.icon}></i>
                {related.label}
                <i className="fa-solid fa-arrow-right"></i>
              </Link>
            )}
          </div>
        </header>

        {summary.length > 0 && (
          <section className="df-legal-summary" aria-label="Summary">
            <div className="df-legal-summary-head">
              <h2>
                <i className="fa-solid fa-bolt"></i> The short version
              </h2>
              <p>
                A plain-language overview, for orientation only. It is not part
                of this document and the full sections below are what actually
                applies.
              </p>
            </div>

            <div className="df-legal-summary-grid">
              {summary.map((item) => (
                <div className="df-legal-summary-card" key={item.title}>
                  <div className="icon">
                    <i className={item.icon}></i>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="df-legal-body">
          <aside className={`df-legal-toc${tocOpen ? " open" : ""}`}>
            <button
              className="df-legal-toc-toggle"
              onClick={() => setTocOpen((open) => !open)}
              aria-expanded={tocOpen}
            >
              <span>
                <i className="fa-solid fa-list-ul"></i>
                {activeSection
                  ? `${activeSection.number}. ${activeSection.title}`
                  : "Contents"}
              </span>
              <i
                className={`fa-solid fa-chevron-${tocOpen ? "up" : "down"}`}
              ></i>
            </button>

            <div className="df-legal-toc-inner">
              <div className="df-legal-toc-search">
                <i className="fa-solid fa-magnifying-glass"></i>
                <input
                  type="text"
                  value={query}
                  placeholder="Find a section…"
                  onChange={(event) => setQuery(event.target.value)}
                  aria-label="Filter sections"
                />
                {query && (
                  <button
                    className="clear"
                    onClick={() => setQuery("")}
                    aria-label="Clear filter"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                )}
              </div>

              <nav className="df-legal-toc-list" aria-label="Contents">
                {filtered.map((part) => (
                  <div className="df-legal-toc-group" key={part.title}>
                    <h4>{part.title}</h4>
                    <ul>
                      {part.sections.map((section) => (
                        <li key={section.id}>
                          <a
                            href={`#${section.id}`}
                            data-for={section.id}
                            className={active === section.id ? "active" : ""}
                            onClick={(event) => goTo(event, section.id)}
                          >
                            <span className="num">{section.number}</span>
                            <span className="label">{section.title}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                {!filtered.length && (
                  <p className="df-legal-toc-empty">
                    No section matches “{query}”.
                  </p>
                )}
              </nav>
            </div>
          </aside>

          <article className="df-legal-article" ref={articleRef}>
            {children}
            {document_}
          </article>
        </div>

        <button
          className={`df-legal-top${scrolled ? " visible" : ""}`}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
        >
          <i className="fa-solid fa-arrow-up"></i>
        </button>
      </div>
    </SectionContext.Provider>
  );
}

/* ---- Small pieces the documents use ------------------------------- */

/**
 * A cross-reference to another section of the same document.
 *
 *   <Ref to="acceptable-use" />          → "section 11"
 *   <Ref to="acceptable-use" name />     → "section 11 (Acceptable use)"
 *   <Ref to="refunds">our refund policy</Ref>
 *
 * The number is read from the document rather than typed, so inserting a
 * section renumbers every reference to it automatically. A `to` that
 * matches nothing renders its own text with no link, which is visible in
 * review but never a broken anchor for a reader.
 */
export function Ref({ to, name = false, children }) {
  const section = useContext(SectionContext).get(to);

  if (!section) return <>{children || to}</>;

  return (
    <a href={`#${to}`}>
      {children || (
        <>
          section {section.number}
          {name ? ` (${section.title})` : ""}
        </>
      )}
    </a>
  );
}

/** A highlighted aside: a rule worth not missing, or a warning. */
export function Callout({ tone = "info", icon, title, children }) {
  return (
    <div className={`df-legal-callout ${tone}`}>
      <i className={icon || defaultIcon(tone)}></i>
      <div>
        {title && <strong>{title}</strong>}
        <div>{children}</div>
      </div>
    </div>
  );
}

function defaultIcon(tone) {
  if (tone === "warning") return "fa-solid fa-triangle-exclamation";
  if (tone === "danger") return "fa-solid fa-circle-exclamation";
  if (tone === "success") return "fa-solid fa-circle-check";
  return "fa-solid fa-circle-info";
}

/** A two-column definition list, for "term — what it means" tables. */
export function DefTable({ rows, headings }) {
  return (
    <div className="df-legal-table-wrap">
      <table className="df-legal-table">
        {headings && (
          <thead>
            <tr>
              {headings.map((heading) => (
                <th key={heading}>{heading}</th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
