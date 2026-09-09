import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import LoadingAnim from "../LoadingAnim";
import InsightEvent, { formatMoment } from "./InsightEvent";
import { CHART_COLOURS, ColumnChart, RankedList, TrendChart, compactNumber } from "./charts";
import { getInsightsFocus } from "../../api/insights";
import { bucketLabel } from "../../functions/insightsFormat";

/* =====================================================================
   Drill-down panel
   ---------------------------------------------------------------------
   "Show me everything about /ping", or about one user, or one server.
   The API answers with the same shape for all three dimensions, so this
   panel renders all three — only the two related rankings differ.
   ===================================================================== */

const TITLES = {
  command: { icon: "fa-solid fa-terminal", noun: "Command" },
  user: { icon: "fa-solid fa-user", noun: "User" },
  server: { icon: "fa-solid fa-server", noun: "Server" },
};

/**
 * @param {{projectId: string, focus: {dimension: string, value: string},
 *          range: string, onClose: Function, onFocus: Function}} props
 */
export default function FocusPanel({ projectId, focus, range, onClose, onFocus }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    setData(null);
    setError(null);

    getInsightsFocus(projectId, {
      dimension: focus.dimension,
      value: focus.value,
      range,
      signal: controller.signal,
    })
      .then(setData)
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err.response?.data?.error || "Couldn't load this breakdown");
      });

    return () => controller.abort();
  }, [projectId, focus.dimension, focus.value, range]);

  /* Escape closes, like the rest of the app's overlays. */
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const title = TITLES[focus.dimension] || TITLES.command;

  const logQuery = {
    command: `command=${encodeURIComponent(focus.value)}`,
    user: `userId=${encodeURIComponent(focus.value)}`,
    server: `guildId=${encodeURIComponent(focus.value)}`,
  }[focus.dimension];

  return (
    <div className="df-focus-overlay" onClick={onClose}>
      <aside
        className="df-focus-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="df-focus-head">
          <div>
            <span className="df-focus-kind">
              <i className={title.icon}></i> {title.noun}
            </span>
            <h2>
              {focus.dimension === "command" ? "/" : ""}
              {data?.label || focus.value}
            </h2>
          </div>

          <div className="df-focus-actions">
            <Link to={`/insights/${projectId}/logs?${logQuery}`}>
              <button>
                <i className="fa-solid fa-list-ul"></i> View logs
              </button>
            </Link>
            <button className="df-focus-close" onClick={onClose} title="Close">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </header>

        {error ? (
          <div className="df-empty">
            <i className="fa-solid fa-triangle-exclamation"></i>
            <h3>Couldn't load this</h3>
            <p>{error}</p>
          </div>
        ) : !data ? (
          <LoadingAnim />
        ) : !data.summary.total ? (
          <div className="df-empty">
            <i className="fa-solid fa-chart-simple"></i>
            <h3>No activity in this period</h3>
            <p>
              Nothing was recorded for this {title.noun.toLowerCase()} in the
              selected time range. Try a longer range.
            </p>
          </div>
        ) : (
          <div className="df-focus-body">
            <div className="df-focus-stats">
              <div>
                <span>Events</span>
                <strong>{compactNumber(data.summary.total)}</strong>
              </div>
              {focus.dimension !== "user" && (
                <div>
                  <span>Unique users</span>
                  <strong>{compactNumber(data.summary.users)}</strong>
                </div>
              )}
              {focus.dimension !== "server" && (
                <div>
                  <span>Servers</span>
                  <strong>{compactNumber(data.summary.servers)}</strong>
                </div>
              )}
              {data.summary.avgMs != null && (
                <div>
                  <span>Avg response</span>
                  <strong>{data.summary.avgMs}ms</strong>
                </div>
              )}
              <div>
                <span>First seen</span>
                <strong>{formatMoment(data.summary.first)}</strong>
              </div>
              <div>
                <span>Last seen</span>
                <strong>{formatMoment(data.summary.last)}</strong>
              </div>
            </div>

            <section className="df-card">
              <h3>Activity over time</h3>
              <TrendChart
                height={200}
                data={data.timeline.map((row) => ({
                  label: bucketLabel(row.bucket, data.bucket),
                  total: row.total,
                }))}
                series={[
                  { key: "total", label: "Events", colour: CHART_COLOURS.blue },
                ]}
              />
            </section>

            <section className="df-card">
              <h3>By hour of day</h3>
              <ColumnChart
                everyLabel={3}
                colour={CHART_COLOURS.mint}
                data={data.hours.map((row) => ({
                  label: `${String(row.hour).padStart(2, "0")}`,
                  value: row.count,
                  title: `${row.count} events at ${String(row.hour).padStart(2, "0")}:00`,
                }))}
              />
            </section>

            <div className="df-focus-columns">
              {data.commands && (
                <section className="df-card">
                  <h3>Top commands</h3>
                  <RankedList
                    items={data.commands}
                    colour={CHART_COLOURS.blue}
                    onSelect={(item) =>
                      onFocus({ dimension: "command", value: item.id })
                    }
                  />
                </section>
              )}

              {data.users && (
                <section className="df-card">
                  <h3>Top users</h3>
                  <RankedList
                    items={data.users}
                    colour={CHART_COLOURS.amber}
                    onSelect={(item) =>
                      onFocus({ dimension: "user", value: item.id })
                    }
                  />
                </section>
              )}

              {data.servers && (
                <section className="df-card">
                  <h3>Top servers</h3>
                  <RankedList
                    items={data.servers}
                    colour={CHART_COLOURS.violet}
                    onSelect={(item) =>
                      onFocus({ dimension: "server", value: item.id })
                    }
                  />
                </section>
              )}
            </div>

            <section className="df-card">
              <h3>Recent activity</h3>
              <ul className="df-event-list">
                {data.recent.map((event, index) => (
                  <InsightEvent key={index} event={event} compact />
                ))}
              </ul>
            </section>
          </div>
        )}
      </aside>
    </div>
  );
}
