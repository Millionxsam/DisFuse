import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Swal from "sweetalert2";

import LoadingAnim from "../../../components/LoadingAnim";
import { getInsightsProjects } from "../../../api/insights";
import { timeAgo } from "../../../components/insights/InsightEvent";
import { compactNumber } from "../../../components/insights/charts";
import modalThemeColor from "../../../functions/modalThemeColor";

const modalColors = modalThemeColor(null, true);

/**
 * The Insights landing page: which of your bots do you want to look at?
 *
 * Only bots you OWN appear here. Projects you were invited to as a
 * collaborator are not listed, and the API refuses them by ID too — a
 * bot's analytics belong to the person whose bot it is.
 */
export default function Insights() {
  const [projects, setProjects] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    getInsightsProjects()
      .then((data) => {
        setProjects(data || []);
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
    if (!search) return projects;

    return projects.filter(
      (project) =>
        project.name?.toLowerCase().includes(search) ||
        project.bot?.username?.toLowerCase().includes(search) ||
        project.bot?.id?.includes(search),
    );
  }, [projects, query]);

  const collecting = projects.filter((project) => project.events > 0).length;

  return (
    <div className="df-page">
      <Helmet>
        <title>Insights | DisFuse</title>
      </Helmet>

      <div className="df-page-head">
        <h1>
          <i className="fa-solid fa-chart-line"></i> Insights
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
          </div>
        </div>
      </div>

      <p className="df-page-lead">
        See how your bots are actually used: which commands people run, who
        runs them, which servers are busiest and how that changes over time.
        {projects.length > 0 && (
          <>
            {" "}
            <strong>
              {collecting} of {projects.length}
            </strong>{" "}
            of your bots {collecting === 1 ? "has" : "have"} reported activity.
          </>
        )}
      </p>

      {loading ? (
        <LoadingAnim />
      ) : shown.length ? (
        <div className="df-grid">
          {shown.map((project) => (
            <InsightsProjectCard project={project} key={project.id} />
          ))}
        </div>
      ) : (
        <div className="df-empty">
          <i className="fa-solid fa-chart-line"></i>
          <h3>{projects.length ? "No matching bots" : "No bots yet"}</h3>
          <p>
            {projects.length
              ? "Try a different search."
              : "Insights are collected per bot. Create a project, run your bot, and its activity shows up here."}
          </p>
          {!projects.length && (
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

function InsightsProjectCard({ project }) {
  const [avatarFailed, setAvatarFailed] = useState(false);

  const hasData = project.events > 0;
  const avatar =
    project.bot?.id && project.bot?.avatar && !avatarFailed
      ? `https://cdn.discordapp.com/avatars/${project.bot.id}/${project.bot.avatar}.png`
      : null;

  return (
    <div className="df-project-card df-insights-card">
      <div className="card-top">
        {avatar ? (
          <img
            className="avatar"
            src={avatar}
            alt=""
            onError={() => setAvatarFailed(true)}
          />
        ) : (
          /* Bots with no Discord avatar get the same sized tile, with a
             centred robot in it — see .df-insights-avatar. */
          <div className="avatar df-insights-avatar">
            <i className="fa-solid fa-robot"></i>
          </div>
        )}

        <div className="title-block">
          <h1>{project.name}</h1>
          <div className="badges">
            <span className={`badge ${hasData ? "published" : "draft"}`}>
              <i
                className={`fa-solid ${
                  hasData ? "fa-circle-check" : "fa-hourglass-half"
                }`}
              ></i>
              {hasData ? "Collecting" : "No data yet"}
            </span>
            {project.suspended && (
              <span className="badge suspended">
                <i className="fa-solid fa-ban"></i> Suspended
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="stat-row">
        <span className="stat-chip">
          <i className="fa-solid fa-terminal"></i>{" "}
          {compactNumber(project.commands)} commands
        </span>
        <span className="stat-chip">
          <i className="fa-solid fa-server"></i>{" "}
          {compactNumber(project.servers)} servers
        </span>
        <span className="stat-chip">
          <i className="fa-solid fa-bolt"></i> {compactNumber(project.events)}{" "}
          events
        </span>
      </div>

      <p className="meta">
        {hasData
          ? `Last event ${timeAgo(project.lastEventAt)}`
          : "Waiting for this bot's first event"}
      </p>

      <div className="card-buttons">
        <Link to={`/insights/${project.id}`}>
          <button className="primary">
            <i className="fa-solid fa-chart-line"></i> Open Insights
          </button>
        </Link>
        <Link to={`/insights/${project.id}/logs`}>
          <button>
            <i className="fa-solid fa-list-ul"></i> Logs
          </button>
        </Link>
      </div>
    </div>
  );
}
