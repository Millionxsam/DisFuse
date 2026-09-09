import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

import {
  checkWebsitePath,
  getDashboardPermissions,
} from "../../../../api/websites";
import { publishedWebsiteUrl, sitesUrl } from "../../../../config/config";
import { Field } from "./PropertyControls";

/* =====================================================================
   Site-wide settings that aren't part of the page design
   ---------------------------------------------------------------------
   Both of these are stored on the website document rather than in its
   `config`, and both are enforced by the API — what's here is the
   authoring side of them.
   ===================================================================== */

/** Shown before the API answers, and if it can't be reached. */
const FALLBACK_PERMISSIONS = [
  { name: "ManageGuild", label: "Manage Guild" },
  { name: "Administrator", label: "Administrator" },
  { name: "ManageChannels", label: "Manage Channels" },
  { name: "ManageRoles", label: "Manage Roles" },
  { name: "ModerateMembers", label: "Moderate Members" },
  { name: "BanMembers", label: "Ban Members" },
  { name: "KickMembers", label: "Kick Members" },
];

const host = sitesUrl.replace(/^https?:\/\//, "");

/* ---- Public address --------------------------------------------------- */

/**
 * The website's custom URL.
 *
 * A path is only written to the website once the API has confirmed it is
 * valid and free, so an in-progress or rejected value can never be saved
 * — and typing one never marks the editor dirty.
 */
export function PublicAddress({ editor }) {
  const { website } = editor;

  const [draft, setDraft] = useState(website.path || "");
  const [state, setState] = useState({ status: "idle" });
  const [copied, setCopied] = useState(false);

  /* What's currently stored, and the editor itself, held in refs.

     Both change identity on every keystroke anywhere in the builder, and
     the effect below must not restart because of that: it would reset the
     debounce (re-checking the same path over and over) and wipe the
     "available" confirmation the moment the path is committed. */
  const stored = useRef(website.path || "");
  useEffect(() => {
    stored.current = website.path || "";
  }, [website.path]);

  const editorRef = useRef(editor);
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  useEffect(() => {
    const value = draft.trim().toLowerCase();

    if (value === stored.current) {
      setState((current) =>
        /* Keep the confirmation up after a successful commit. */
        current.status === "available" ? current : { status: "idle" },
      );
      return undefined;
    }

    setState({ status: "checking" });

    const controller = new AbortController();
    const timer = setTimeout(() => {
      checkWebsitePath(value, website._id, { signal: controller.signal })
        .then((result) => {
          if (!result.available)
            return setState({ status: "error", message: result.error });

          setState({
            status: "available",
            message: result.path
              ? "This URL is available"
              : "Using your bot's ID",
          });

          editorRef.current.updateMeta({ path: result.path });
        })
        .catch((err) => {
          if (axios.isCancel(err)) return;

          setState({
            status: "error",
            message:
              err.response?.data?.error ||
              "Couldn't check that URL. Please try again.",
          });
        });
    }, 450);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [draft, website._id]);

  const url = publishedWebsiteUrl(website);

  const copy = () => {
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };

  return (
    <section className="df-ws-section">
      <h4>Public address</h4>

      <Field
        label="Custom URL"
        help="Optional. Leave this empty to use your bot's ID. Lowercase letters, numbers, - and _."
      >
        <div className="df-ws-url-input">
          <span>{host}/</span>
          <input
            type="text"
            className="df-ws-mono"
            value={draft}
            placeholder={website.botID}
            spellCheck={false}
            onChange={(e) => setDraft(e.target.value)}
          />
        </div>
      </Field>

      {state.status !== "idle" && (
        <p className={`df-ws-url-status ${state.status}`}>
          {state.status === "checking" ? (
            <>
              <i className="fa-solid fa-spinner fa-spin"></i> Checking…
            </>
          ) : (
            <>
              <i
                className={`fa-solid ${
                  state.status === "available"
                    ? "fa-circle-check"
                    : "fa-circle-exclamation"
                }`}
              ></i>{" "}
              {state.message}
            </>
          )}
        </p>
      )}

      <Field label="Live at" help="Save the website to apply a changed URL.">
        <div className="df-ws-url-input">
          <input
            type="text"
            className="df-ws-mono"
            readOnly
            value={url}
            onFocus={(e) => e.target.select()}
          />
          <button type="button" title="Copy link" onClick={copy}>
            <i className={`fa-solid ${copied ? "fa-check" : "fa-copy"}`}></i>
          </button>
        </div>
      </Field>
    </section>
  );
}

/* ---- The project behind the website ----------------------------------- */

/**
 * Why this website isn't linked from its project, if it isn't.
 *
 * The API applies this rule for real — this only explains it. None of
 * these stop the website working: a published site stays live at its own
 * address whatever the project says.
 */
function listingState(website, project) {
  if (!website.published)
    return {
      tone: "info",
      text: "Publish this website and it will be linked from your project page and your project card.",
    };

  if (project.suspended)
    return {
      tone: "warn",
      text: "This project is suspended, so DisFuse doesn't link to its website.",
    };

  if (project.botPrivate)
    return {
      tone: "warn",
      text: "Your bot's visibility is private, so this website isn't linked from your project page or your project card. It stays live for anyone with the link.",
    };

  return {
    tone: "ok",
    text: "Linked from your project page and your project card.",
  };
}

/**
 * The project this website belongs to.
 *
 * A website is always built for a bot, and a bot always comes from a
 * project — so there is always something to link back to, and the two
 * settings that decide whether DisFuse advertises this website (the bot's
 * visibility, and publishing) live one on each side of that link. This is
 * where they meet.
 */
export function LinkedProject({ editor }) {
  const { website } = editor;
  const project = website.project;

  if (!project)
    return (
      <section className="df-ws-section">
        <h4>Project</h4>
        <p className="df-ws-url-status error">
          <i className="fa-solid fa-link-slash"></i> This website isn't linked
          to a project any more. It still works, but dashboard controls need a
          project's bot token to read or change anything on Discord.
        </p>
      </section>
    );

  const base = `/@${project.owner?.username}/${project._id}`;
  const state = listingState(website, project);

  return (
    <section className="df-ws-section">
      <h4>Project</h4>

      <Field label="Built for" help="The bot this website belongs to.">
        <div className="df-ws-linked-project">
          <Link to={base}>
            <i className="fa-solid fa-cubes"></i> {project.name}
          </Link>
          <Link to={`${base}/workspace`} title="Open the block editor">
            <i className="fa-solid fa-puzzle-piece"></i> Blocks
          </Link>
        </div>
      </Field>

      <p className={`df-ws-url-status ${state.tone}`}>
        <i
          className={`fa-solid ${
            state.tone === "ok"
              ? "fa-circle-check"
              : state.tone === "warn"
                ? "fa-eye-slash"
                : "fa-circle-info"
          }`}
        ></i>{" "}
        {state.text}
      </p>

      {state.tone === "warn" && project.botPrivate && (
        <Link className="df-ws-inline-link" to={`${base}/edit`}>
          <i className="fa-solid fa-sliders"></i> Change bot visibility
        </Link>
      )}
    </section>
  );
}

/* ---- Dashboard access ------------------------------------------------- */

/**
 * Who is allowed to configure a server's settings on this website.
 *
 * Only relevant to SERVER-scoped controls. User-scoped settings belong to
 * the visitor themselves, so they're never gated on a server permission.
 *
 * The API enforces whatever is chosen here on every read and write, so
 * this is a real access rule and not a UI hint.
 */
export function DashboardAccess({ editor }) {
  const { website } = editor;
  const [permissions, setPermissions] = useState(FALLBACK_PERMISSIONS);

  useEffect(() => {
    let cancelled = false;

    getDashboardPermissions()
      .then((list) => {
        if (!cancelled && Array.isArray(list) && list.length)
          setPermissions(list);
      })
      .catch(() => {
        /* The fallback list is a subset of what the API accepts, so the
           editor still works if this request fails. */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const access = website.dashboardAccess || { type: "owner" };

  const setAccess = (changes) =>
    editor.updateMeta({ dashboardAccess: { ...access, ...changes } });

  return (
    <>
      <Field
        label="Who can configure a server"
        help="Checked by the API every time someone opens or saves server settings."
      >
        <select
          value={access.type === "permission" ? "permission" : "owner"}
          onChange={(e) =>
            setAccess(
              e.target.value === "permission"
                ? {
                    type: "permission",
                    permission: access.permission || "ManageGuild",
                  }
                : { type: "owner", permission: null },
            )
          }
        >
          <option value="owner">The server's owner only</option>
          <option value="permission">Anyone with a Discord permission</option>
        </select>
      </Field>

      {access.type === "permission" && (
        <Field
          label="Required permission"
          help="Server owners and administrators always qualify."
        >
          <select
            value={access.permission || "ManageGuild"}
            onChange={(e) => setAccess({ permission: e.target.value })}
          >
            {permissions.map((permission) => (
              <option key={permission.name} value={permission.name}>
                {permission.label}
              </option>
            ))}
          </select>
        </Field>
      )}
    </>
  );
}
