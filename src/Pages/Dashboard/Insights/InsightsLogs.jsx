import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import LoadingAnim from "../../../components/LoadingAnim";
import InsightEvent, { timeAgo } from "../../../components/insights/InsightEvent";
import { compactNumber } from "../../../components/insights/charts";
import { getInsightLogs } from "../../../api/insights";

/* One page at a time, always. The API caps the page size, so this page
   physically cannot pull a bot's whole history into the browser. */
const PAGE_SIZE = 50;
const LIVE_INTERVAL_MS = 15000;

const TYPE_OPTIONS = [
  { id: "", label: "All events" },
  { id: "interaction", label: "Interactions" },
  { id: "command", label: "Slash commands" },
  { id: "component", label: "Buttons & menus" },
  { id: "modal", label: "Modals" },
  { id: "context", label: "Context menus" },
  { id: "guildJoin", label: "Server joins" },
  { id: "guildLeave", label: "Server leaves" },
  { id: "error", label: "Errors" },
  { id: "ready", label: "Bot restarts" },
];

const RANGE_OPTIONS = [
  { id: "all", label: "All time" },
  { id: "24h", label: "Last 24 hours" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
];

/**
 * The raw event stream behind Insights.
 *
 * Same data, no analysis: this is what the bot actually reported, in the
 * order it arrived. Filters and paging both happen in MongoDB.
 */
export default function InsightsLogs() {
  const { projectId } = useParams();
  const [params, setParams] = useSearchParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [live, setLive] = useState(false);
  const [search, setSearch] = useState(params.get("search") || "");

  const request = useRef(null);

  const page = Math.max(parseInt(params.get("page"), 10) || 1, 1);
  const type = params.get("type") || "";
  const range = params.get("range") || "all";
  const command = params.get("command") || "";
  const userId = params.get("userId") || "";
  const guildId = params.get("guildId") || "";
  const query = params.get("search") || "";

  const filtered = Boolean(type || command || userId || guildId || query || range !== "all");

  const load = useCallback(
    ({ quiet = false } = {}) => {
      request.current?.abort();

      const controller = new AbortController();
      request.current = controller;

      if (quiet) setRefreshing(true);
      else setLoading(true);

      return getInsightLogs(projectId, {
        page,
        limit: PAGE_SIZE,
        range,
        type,
        search: query,
        command,
        userId,
        guildId,
        signal: controller.signal,
      })
        .then((result) => {
          setData(result);
          setError(null);
        })
        .catch((err) => {
          if (controller.signal.aborted) return;
          console.error(err);
          setError(
            err.response?.data?.error ||
              "Couldn't load this bot's logs. Please try again.",
          );
        })
        .finally(() => {
          if (controller.signal.aborted) return;
          setLoading(false);
          setRefreshing(false);
        });
    },
    [projectId, page, range, type, query, command, userId, guildId],
  );

  useEffect(() => {
    load();
    return () => request.current?.abort();
  }, [load]);

  /* "Live" is a poll, not a socket: new events only ever appear at the
     top, so re-reading the first page is all it takes. */
  useEffect(() => {
    if (!live || page !== 1) return;

    const timer = setInterval(() => load({ quiet: true }), LIVE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [live, page, load]);

  const update = (changes, { resetPage = true } = {}) => {
    const next = new URLSearchParams(params);

    Object.entries(changes).forEach(([key, value]) => {
      if (value === "" || value == null) next.delete(key);
      else next.set(key, value);
    });

    if (resetPage) next.delete("page");

    setParams(next, { replace: true });
  };

  /* Typing shouldn't fire a request per keystroke. */
  useEffect(() => {
    if (search === query) return;

    const timer = setTimeout(() => update({ search }), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const project = data?.project;
  const logs = data?.logs || [];

  return (
    <div className="df-page df-insights-page">
      <Helmet>
        <title>
          {project?.name ? `${project.name} Logs` : "Logs"} | DisFuse
        </title>
      </Helmet>

      <div className="df-page-head">
        <h1>
          <i className="fa-solid fa-list-ul"></i> Logs
          {project?.name && (
            <span className="df-insights-bot">{project.name}</span>
          )}
        </h1>

        <div className="df-toolbar">
          <div className="df-btn-group">
            <Link to={`/insights/${projectId}`}>
              <button>
                <i className="fa-solid fa-chart-line"></i> Insights
              </button>
            </Link>
            <button
              className={live ? "df-primary-btn" : ""}
              onClick={() => setLive(!live)}
              title="Re-check for new events every 15 seconds"
            >
              <i className={`fa-solid ${live ? "fa-circle-dot" : "fa-play"}`}></i>
              {live ? "Live" : "Go live"}
            </button>
            <button onClick={() => load({ quiet: true })} disabled={refreshing}>
              <i
                className={`fa-solid fa-rotate-right${refreshing ? " fa-spin" : ""}`}
              ></i>
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      <div className="df-insights-bar">
        <div className="df-log-filters">
          <input
            type="search"
            className="search"
            placeholder="Search commands, users, servers…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select value={type} onChange={(e) => update({ type: e.target.value })}>
            {TYPE_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={range}
            onChange={(e) => update({ range: e.target.value })}
          >
            {RANGE_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="df-freshness">
          <span>
            <i className="fa-solid fa-satellite-dish"></i> Last event{" "}
            <strong>{timeAgo(project?.lastEventAt)}</strong>
          </span>
          {data && (
            <span>
              <i className="fa-solid fa-database"></i>{" "}
              <strong>{compactNumber(data.total)}</strong> matching events
            </span>
          )}
        </div>
      </div>

      {(command || userId || guildId) && (
        <div className="df-active-filters">
          <span>Filtered to</span>
          {command && (
            <button onClick={() => update({ command: "" })}>
              <i className="fa-solid fa-terminal"></i> /{command}
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
          {userId && (
            <button onClick={() => update({ userId: "" })}>
              <i className="fa-solid fa-user"></i> {userId}
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
          {guildId && (
            <button onClick={() => update({ guildId: "" })}>
              <i className="fa-solid fa-server"></i> {guildId}
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>
      )}

      {loading && !data ? (
        <LoadingAnim />
      ) : error ? (
        <div className="df-empty">
          <i className="fa-solid fa-triangle-exclamation"></i>
          <h3>Couldn't load the logs</h3>
          <p>{error}</p>
          <button className="df-primary-btn" onClick={() => load()}>
            <i className="fa-solid fa-rotate-right"></i> Try again
          </button>
        </div>
      ) : logs.length ? (
        <>
          <ul className={`df-event-list df-log-list${refreshing ? " busy" : ""}`}>
            {logs.map((event, index) => (
              <InsightEvent
                key={`${event.at}-${index}`}
                event={event}
                onSelectCommand={(value) => update({ command: value })}
                onSelectUser={(row) => update({ userId: row.userId })}
                onSelectServer={(row) => update({ guildId: row.guildId })}
              />
            ))}
          </ul>

          {data.pages > 1 && (
            <div className="df-pagination">
              <button
                disabled={page <= 1}
                onClick={() => update({ page: page - 1 }, { resetPage: false })}
              >
                <i className="fa-solid fa-arrow-left"></i> Previous
              </button>
              <span className="page-indicator">
                Page {data.page} of {data.pages}
              </span>
              <button
                disabled={page >= data.pages}
                onClick={() => update({ page: page + 1 }, { resetPage: false })}
              >
                Next <i className="fa-solid fa-arrow-right"></i>
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="df-empty">
          <i className="fa-solid fa-inbox"></i>
          <h3>{filtered ? "No matching events" : "No events yet"}</h3>
          <p>
            {filtered
              ? "Nothing matches these filters. Try clearing them or widening the time range."
              : "This bot hasn't reported anything yet. Run the latest generated code and its events will appear here."}
          </p>
          {filtered && (
            <button
              className="df-primary-btn"
              onClick={() => {
                setSearch("");
                setParams(new URLSearchParams(), { replace: true });
              }}
            >
              <i className="fa-solid fa-filter-circle-xmark"></i> Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
