import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Swal from "sweetalert2";

import LoadingAnim from "../../../components/LoadingAnim";
import { getControlBots } from "../../../api/control";
import modalThemeColor from "../../../functions/modalThemeColor";
import { avatarUrl } from "../../../components/control/discordUtils";

import DocsLink from "../../../components/DocsLink.jsx";
import { DOCS } from "../../../config/docs.js";

const modalColors = modalThemeColor(null, true);

/**
 * The Control landing page: which of your bots do you want to drive?
 *
 * Only bots you OWN appear here. A project you were invited to as a
 * collaborator is deliberately absent, and the API refuses it by ID too
 * — editing someone's blocks is not the same as holding their bot.
 */
export default function Control() {
  const [bots, setBots] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    getControlBots()
      .then((data) => {
        setBots(data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);

        Swal.fire({
          icon: "error",
          title: "Couldn't load your bots",
          text:
            err.response?.data?.error ||
            "An error occurred while loading your bots. Please try again.",
          ...modalColors,
        });
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const shown = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return bots;

    return bots.filter(
      (bot) =>
        bot.name?.toLowerCase().includes(search) ||
        bot.bot?.username?.toLowerCase().includes(search) ||
        bot.bot?.id?.includes(search),
    );
  }, [bots, query]);

  const ready = bots.filter((bot) => bot.hasToken && bot.bot && !bot.suspended)
    .length;

  return (
    <div className="df-page">
      <Helmet>
        <title>Control | DisFuse</title>
      </Helmet>

      <div className="df-page-head">
        <h1>
          <i className="fa-solid fa-satellite-dish"></i> Control
        </h1>
        <div className="df-toolbar">
          <input
            onChange={(event) => setQuery(event.target.value)}
            type="search"
            placeholder="Search bots"
            className="search"
          />
          <div className="df-btn-group">
            <button onClick={load}>
              <i className="fa-solid fa-rotate-right"></i> Refresh
            </button>
            <DocsLink page={DOCS.control} />
          </div>
        </div>
      </div>

      <p className="df-page-lead">
        Open a Discord-style client and use Discord <strong>as your bot</strong>
        {": "}read its servers, send and edit messages, react, moderate members
        and manage roles and channels. Everything is performed by the bot
        itself, so it can only do what Discord actually allows a bot to do.
        {bots.length > 0 && (
          <>
            {" "}
            <strong>
              {ready} of {bots.length}
            </strong>{" "}
            of your bots {ready === 1 ? "is" : "are"} ready to control.
          </>
        )}
      </p>

      {loading ? (
        <LoadingAnim />
      ) : shown.length ? (
        <div className="df-grid">
          {shown.map((bot) => (
            <ControlBotCard bot={bot} key={bot.id} />
          ))}
        </div>
      ) : (
        <div className="df-empty">
          <i className="fa-solid fa-satellite-dish"></i>
          <h3>{bots.length ? "No matching bots" : "No bots yet"}</h3>
          <p>
            {bots.length
              ? "Try a different search."
              : "Control works with bots you own. Create a project with your bot's token and it'll show up here."}
          </p>
          {!bots.length && (
            <Link to="/projects/new">
              <button className="df-primary-btn">
                <i className="fa-solid fa-plus"></i> New Project
              </button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function ControlBotCard({ bot }) {
  const [avatarFailed, setAvatarFailed] = useState(false);

  const avatar =
    bot.bot && !avatarFailed ? avatarUrl(bot.bot, 128) : null;

  /* Three separate reasons a bot can't be opened, and each one needs a
     different sentence — "unavailable" on its own helps nobody. */
  const blocked = bot.suspended
    ? "This project is suspended."
    : !bot.bot
      ? "DisFuse doesn't know which Discord bot this project is for."
      : !bot.hasToken
        ? "This project has no bot token saved."
        : null;

  return (
    <div className="df-project-card df-control-card">
      <div className="card-top">
        {avatar ? (
          <img
            className="avatar"
            src={avatar}
            alt=""
            onError={() => setAvatarFailed(true)}
          />
        ) : (
          <div className="avatar df-insights-avatar">
            <i className="fa-solid fa-robot"></i>
          </div>
        )}

        <div className="title-block">
          <h1>{bot.name}</h1>
          <div className="badges">
            <span className={`badge ${blocked ? "draft" : "published"}`}>
              <i
                className={`fa-solid ${
                  blocked ? "fa-circle-exclamation" : "fa-circle-check"
                }`}
              ></i>
              {blocked ? "Unavailable" : "Ready"}
            </span>
            {bot.suspended && (
              <span className="badge suspended">
                <i className="fa-solid fa-ban"></i> Suspended
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="stat-row">
        <span className="stat-chip">
          <i className="fa-solid fa-robot"></i>{" "}
          {bot.bot?.username || "No bot linked"}
        </span>
        {bot.servers !== null && bot.servers !== undefined && (
          <span className="stat-chip">
            <i className="fa-solid fa-server"></i> {bot.servers} servers
          </span>
        )}
      </div>

      <p className="meta">
        {blocked || "Opens a live Discord client driven by this bot."}
      </p>

      <div className="card-buttons">
        {blocked ? (
          <Link to={`/projects`}>
            <button>
              <i className="fa-solid fa-wrench"></i> Fix in Projects
            </button>
          </Link>
        ) : (
          <Link to={`/control/${bot.id}`}>
            <button className="primary">
              <i className="fa-solid fa-satellite-dish"></i> Open Control
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}
