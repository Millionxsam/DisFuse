import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Swal from "sweetalert2";

import LoadingAnim from "../../../components/LoadingAnim";
import FocusPanel from "../../../components/insights/FocusPanel";
import InsightEvent, {
  KIND_LABELS,
  formatMoment,
  timeAgo,
} from "../../../components/insights/InsightEvent";
import {
  CHART_COLOURS,
  ColumnChart,
  Donut,
  RankedList,
  StatCard,
  TrendChart,
  compactNumber,
} from "../../../components/insights/charts";
import {
  clearInsightLogs,
  getInsights,
  updateInsightSettings,
} from "../../../api/insights";
import {
  bucketLabel,
  hourLabel,
  percentChange,
  plural,
  weekdayLabel,
} from "../../../functions/insightsFormat";
import modalThemeColor from "../../../functions/modalThemeColor";

import DocsLink from "../../../components/DocsLink.jsx";
import { DOCS } from "../../../config/docs.js";

const modalColors = modalThemeColor(null, true);

/**
 * One bot's Insights.
 *
 * Everything on this page comes from a single request: the API does the
 * aggregation in MongoDB and sends back rankings, buckets and totals
 * that are already the right size. The browser never sees a raw log
 * here — that is what the Logs page is for.
 */
export default function BotInsights() {
  const { projectId } = useParams();
  const [params, setParams] = useSearchParams();

  const range = params.get("range") || "7d";

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingRetention, setSavingRetention] = useState(false);
  const [focus, setFocus] = useState(null);

  /* Range changes swap the whole page, so an in-flight request for the
     previous range must not land after the new one. */
  const request = useRef(null);

  const load = useCallback(
    ({ quiet = false } = {}) => {
      request.current?.abort();

      const controller = new AbortController();
      request.current = controller;

      if (quiet) setRefreshing(true);
      else setLoading(true);

      return getInsights(projectId, { range, signal: controller.signal })
        .then((result) => {
          setData(result);
          setError(null);
        })
        .catch((err) => {
          if (controller.signal.aborted) return;
          console.error(err);
          setError(
            err.response?.data?.error ||
              "Couldn't load Insights for this bot. Please try again.",
          );
        })
        .finally(() => {
          if (controller.signal.aborted) return;
          setLoading(false);
          setRefreshing(false);
        });
    },
    [projectId, range],
  );

  useEffect(() => {
    load();
    return () => request.current?.abort();
  }, [load]);

  const setRange = (value) => {
    params.set("range", value);
    setParams(params, { replace: true });
  };

  const project = data?.project;
  const period = data?.period;

  const timeline = useMemo(
    () =>
      (data?.timeline || []).map((row) => ({
        label: bucketLabel(row.bucket, data.bucket),
        events: row.total,
        commands: row.commands,
        users: row.users,
        errors: row.errors,
        joins: row.joins,
        leaves: row.leaves,
      })),
    [data],
  );

  async function saveRetention(days) {
    setSavingRetention(true);

    try {
      const result = await updateInsightSettings(projectId, {
        retentionDays: Number(days),
      });

      setData((current) =>
        current ? { ...current, project: result.project } : current,
      );

      /* Shortening retention deletes on the spot, so the numbers on the
         page are stale the moment it succeeds. */
      await load({ quiet: true });
    } catch (err) {
      console.error(err);

      Swal.fire({
        icon: "error",
        title: "Couldn't change retention",
        text: err.response?.data?.error || "Please try again in a moment.",
        ...modalColors,
      });
    } finally {
      setSavingRetention(false);
    }
  }

  function confirmClear() {
    Swal.fire({
      title: "Delete all Insight data?",
      text: `Every recorded event for "${project?.name}" will be erased. Your bot will start collecting again from its next event.`,
      icon: "warning",
      footer: "This action is irreversible!",
      confirmButtonColor: "red",
      confirmButtonText: "Delete everything",
      showCancelButton: true,
      focusCancel: true,
      ...modalColors,
    }).then((result) => {
      if (!result.isConfirmed) return;

      clearInsightLogs(projectId)
        .then(() => load({ quiet: true }))
        .catch((err) => {
          console.error(err);

          Swal.fire({
            icon: "error",
            title: "Couldn't clear the logs",
            text: err.response?.data?.error || "Please try again in a moment.",
            ...modalColors,
          });
        });
    });
  }

  if (loading && !data)
    return (
      <div className="df-page">
        <Helmet>
          <title>Insights | DisFuse</title>
        </Helmet>
        <LoadingAnim />
      </div>
    );

  if (error && !data)
    return (
      <div className="df-page">
        <Helmet>
          <title>Insights | DisFuse</title>
        </Helmet>
        <div className="df-empty">
          <i className="fa-solid fa-triangle-exclamation"></i>
          <h3>Couldn't load Insights</h3>
          <p>{error}</p>
          <div className="df-btn-group">
            <button className="df-primary-btn" onClick={() => load()}>
              <i className="fa-solid fa-rotate-right"></i> Try again
            </button>
            <Link to="/insights">
              <button>
                <i className="fa-solid fa-arrow-left"></i> All bots
              </button>
            </Link>
          </div>
        </div>
      </div>
    );

  const lifetime = project?.lifetime || {};
  const servers = project?.servers || {};
  const neverReported = !lifetime.total;

  return (
    <div className="df-page df-insights-page">
      <Helmet>
        <title>{project?.name ? `${project.name} Insights` : "Insights"} | DisFuse</title>
      </Helmet>

      <div className="df-page-head">
        <h1>
          <i className="fa-solid fa-chart-line"></i> Insights
          {project?.name && <span className="df-insights-bot">{project.name}</span>}
        </h1>

        <div className="df-toolbar">
          <div className="df-btn-group">
            <Link to="/insights">
              <button title="All bots">
                <i className="fa-solid fa-arrow-left"></i> All bots
              </button>
            </Link>
            <Link to={`/insights/${projectId}/logs`}>
              <button>
                <i className="fa-solid fa-list-ul"></i> Live logs
              </button>
            </Link>
            <button
              className="df-primary-btn"
              onClick={() => load({ quiet: true })}
              disabled={refreshing}
            >
              <i
                className={`fa-solid fa-rotate-right${refreshing ? " fa-spin" : ""}`}
              ></i>
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
            <DocsLink page={`${DOCS.insights}#the-dashboard`} />
          </div>
        </div>
      </div>

      {/* ---- Range + freshness ------------------------------------- */}

      <div className="df-insights-bar">
        <div className="df-range-picker">
          {(data?.ranges || []).map((option) => (
            <button
              key={option.id}
              className={option.id === range ? "active" : ""}
              onClick={() => setRange(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="df-freshness" title="Bots send their events in batches">
          <span>
            <i className="fa-solid fa-satellite-dish"></i> Last event{" "}
            <strong>{timeAgo(project?.lastEventAt)}</strong>
          </span>
          <span>
            <i className="fa-solid fa-clock-rotate-left"></i> Updated{" "}
            <strong>{timeAgo(data?.generatedAt)}</strong>
          </span>
          <span className="df-freshness-note">
            Logs arrive in batches, so this can lag by a few seconds.
          </span>
        </div>
      </div>

      {neverReported ? (
        <NoDataYet project={project} />
      ) : (
        <>
          {/* ---- Summary ------------------------------------------- */}

          <div className="df-stat-grid">
            <StatCard
              icon="fa-solid fa-bolt"
              label="Events this period"
              value={compactNumber(period.total)}
              delta={percentChange(period.total, data.comparison?.total)}
              sub={`${compactNumber(lifetime.total)} all time`}
              spark={timeline.map((row) => row.events)}
            />
            <StatCard
              icon="fa-solid fa-terminal"
              label="Commands run"
              value={compactNumber(period.commands)}
              delta={percentChange(period.commands, data.comparison?.commands)}
              sub={`${compactNumber(period.uniqueCommands)} different commands`}
              spark={timeline.map((row) => row.commands)}
            />
            <StatCard
              icon="fa-solid fa-users"
              label="Unique users"
              value={compactNumber(period.uniqueUsers)}
              delta={percentChange(
                period.uniqueUsers,
                data.comparison?.uniqueUsers,
              )}
              sub={`across ${plural(period.uniqueServers, "server")}`}
            />
            <StatCard
              icon="fa-solid fa-server"
              label="Servers"
              value={compactNumber(servers.count)}
              tone={period.joins - period.leaves < 0 ? "warn" : ""}
              sub={
                servers.updatedAt
                  ? `+${period.joins} / −${period.leaves} this period`
                  : "Waiting for the bot to report"
              }
            />
            <StatCard
              icon="fa-solid fa-user-group"
              label="Members reached"
              value={compactNumber(servers.members)}
              sub={
                servers.updatedAt
                  ? `as of ${timeAgo(servers.updatedAt)}`
                  : "Waiting for the bot to report"
              }
            />
            <StatCard
              icon="fa-solid fa-triangle-exclamation"
              label="Errors & no-shows"
              tone={period.errors ? "danger" : ""}
              value={compactNumber(period.errors)}
              sub={
                period.restarts
                  ? `${plural(period.restarts, "restart")} this period`
                  : "No restarts this period"
              }
              spark={timeline.map((row) => row.errors)}
            />
          </div>

          {/* ---- Activity over time -------------------------------- */}

          <section className="df-card">
            <div className="df-card-head">
              <h2>
                <i className="fa-solid fa-chart-area"></i> Activity over time
              </h2>
              <div className="df-legend">
                <span>
                  <i style={{ background: CHART_COLOURS.blue }} /> All events
                </span>
                <span>
                  <i style={{ background: CHART_COLOURS.mint }} /> Commands
                </span>
                <span>
                  <i style={{ background: CHART_COLOURS.amber }} /> Unique users
                  <em className="df-legend-axis">right axis</em>
                </span>
              </div>
            </div>

            <TrendChart
              data={timeline}
              series={[
                { key: "events", label: "Events", colour: CHART_COLOURS.blue },
                {
                  key: "commands",
                  label: "Commands",
                  colour: CHART_COLOURS.mint,
                  fill: false,
                },
                {
                  key: "users",
                  label: "Users",
                  colour: CHART_COLOURS.amber,
                  fill: false,
                  /* A handful of people against hundreds of events would
                     be a flat line on the same scale. */
                  axis: "right",
                },
              ]}
              empty="No activity recorded in this period. Try a longer range."
            />
          </section>

          {/* ---- When the bot is used ------------------------------ */}

          <div className="df-insights-split">
            <section className="df-card">
              <div className="df-card-head">
                <h2>
                  <i className="fa-solid fa-clock"></i> Activity by hour
                </h2>
                {period.peakHour && (
                  <span className="df-card-note">
                    Busiest at <strong>{hourLabel(period.peakHour.hour)}</strong>
                  </span>
                )}
              </div>

              <ColumnChart
                everyLabel={3}
                colour={CHART_COLOURS.blue}
                data={(data.hours || []).map((row) => ({
                  label: String(row.hour).padStart(2, "0"),
                  value: row.count,
                  title: `${plural(row.count, "event")} at ${hourLabel(row.hour)}`,
                }))}
                empty="No activity in this period"
              />
              <p className="df-card-foot">
                Times are shown in your own timezone.
                {period.quietHour && (
                  <>
                    {" "}
                    Quietest hour: <strong>{hourLabel(period.quietHour.hour)}</strong>.
                  </>
                )}
              </p>
            </section>

            <section className="df-card">
              <div className="df-card-head">
                <h2>
                  <i className="fa-solid fa-calendar-week"></i> Activity by day
                </h2>
                {period.busiestDay && (
                  <span className="df-card-note">
                    Busiest day{" "}
                    <strong>{bucketLabel(period.busiestDay.date, "day")}</strong>
                  </span>
                )}
              </div>

              <ColumnChart
                colour={CHART_COLOURS.violet}
                data={(data.weekdays || []).map((row) => ({
                  label: weekdayLabel(row.day),
                  value: row.count,
                  title: `${plural(row.count, "event")} on ${weekdayLabel(
                    row.day,
                    false,
                  )}`,
                }))}
                empty="No activity in this period"
              />
              <p className="df-card-foot">
                {period.averagePerDay} events per day on average across{" "}
                {plural(period.activeDays, "active day")}.
              </p>
            </section>
          </div>

          {/* ---- Commands ------------------------------------------ */}

          <div className="df-insights-split">
            <section className="df-card">
              <div className="df-card-head">
                <h2>
                  <i className="fa-solid fa-terminal"></i> Commands by usage
                </h2>
                <span className="df-card-note">Select one for a breakdown</span>
              </div>

              <RankedList
                items={data.commands.ranked}
                limit={12}
                colour={CHART_COLOURS.blue}
                meta={(item) =>
                  `${plural(item.users, "user")} · ${plural(
                    item.servers,
                    "server",
                  )}${item.avgMs ? ` · ${item.avgMs}ms avg` : ""}`
                }
                onSelect={(item) =>
                  setFocus({ dimension: "command", value: item.id })
                }
                empty="No commands were run in this period"
              />
            </section>

            <div className="df-insights-stack">
              <section className="df-card">
                <h2>
                  <i className="fa-solid fa-ranking-star"></i> Standouts
                </h2>

                <ul className="df-highlight-list">
                  <Highlight
                    icon="fa-solid fa-trophy"
                    tone="amber"
                    label="Most-used command"
                    value={
                      data.commands.top ? `/${data.commands.top.name}` : "None"
                    }
                    sub={
                      data.commands.top
                        ? plural(data.commands.top.count, "run")
                        : "Nothing yet"
                    }
                    onClick={
                      data.commands.top &&
                      (() =>
                        setFocus({
                          dimension: "command",
                          value: data.commands.top.id,
                        }))
                    }
                  />
                  <Highlight
                    icon="fa-solid fa-feather"
                    label="Least-used command"
                    value={
                      data.commands.quiet ? `/${data.commands.quiet.name}` : "None"
                    }
                    sub={
                      data.commands.quiet
                        ? plural(data.commands.quiet.count, "run")
                        : "Needs at least two commands"
                    }
                    onClick={
                      data.commands.quiet &&
                      (() =>
                        setFocus({
                          dimension: "command",
                          value: data.commands.quiet.id,
                        }))
                    }
                  />
                  <Highlight
                    icon="fa-solid fa-user-astronaut"
                    tone="mint"
                    label="Most active user"
                    value={data.users.top ? data.users.top.name : "None"}
                    sub={
                      data.users.top
                        ? plural(data.users.top.count, "interaction")
                        : "Nothing yet"
                    }
                    onClick={
                      data.users.top &&
                      (() =>
                        setFocus({ dimension: "user", value: data.users.top.id }))
                    }
                  />
                  <Highlight
                    icon="fa-solid fa-crown"
                    tone="violet"
                    label="Most active server"
                    value={data.servers.top ? data.servers.top.name : "None"}
                    sub={
                      data.servers.top
                        ? plural(data.servers.top.count, "interaction")
                        : "Nothing yet"
                    }
                    onClick={
                      data.servers.top &&
                      (() =>
                        setFocus({
                          dimension: "server",
                          value: data.servers.top.id,
                        }))
                    }
                  />
                  <Highlight
                    icon="fa-solid fa-arrow-up-right-dots"
                    tone="mint"
                    label="Largest server"
                    value={servers.largest?.name || "None"}
                    sub={
                      servers.largest
                        ? plural(servers.largest.members, "member")
                        : "Waiting for the bot to report"
                    }
                    onClick={
                      servers.largest &&
                      (() =>
                        setFocus({
                          dimension: "server",
                          value: servers.largest.id,
                        }))
                    }
                  />
                  <Highlight
                    icon="fa-solid fa-arrow-down-short-wide"
                    label="Smallest server"
                    value={servers.smallest?.name || "None"}
                    sub={
                      servers.smallest
                        ? plural(servers.smallest.members, "member")
                        : "Waiting for the bot to report"
                    }
                    onClick={
                      servers.smallest &&
                      (() =>
                        setFocus({
                          dimension: "server",
                          value: servers.smallest.id,
                        }))
                    }
                  />
                </ul>
              </section>

              <section className="df-card">
                <div className="df-card-head">
                  <h2>
                    <i className="fa-solid fa-shuffle"></i> Interaction types
                  </h2>
                </div>

                <Donut
                  caption="interactions"
                  segments={(data.kinds || []).map((entry, index) => ({
                    label: KIND_LABELS[entry.kind] || entry.kind,
                    value: entry.count,
                    colour: [
                      CHART_COLOURS.blue,
                      CHART_COLOURS.mint,
                      CHART_COLOURS.amber,
                      CHART_COLOURS.violet,
                      CHART_COLOURS.pink,
                      CHART_COLOURS.danger,
                    ][index % 6],
                  }))}
                  empty="No interactions in this period"
                />
              </section>
            </div>
          </div>

          {/* ---- Unusual activity ---------------------------------- */}

          {data.commands.movers?.length > 0 && (
            <section className="df-card">
              <div className="df-card-head">
                <h2>
                  <i className="fa-solid fa-wave-square"></i> Unusual activity
                </h2>
                <span className="df-card-note">
                  Compared with the previous {data.rangeLabel.toLowerCase()}
                </span>
              </div>

              <ul className="df-mover-list">
                {data.commands.movers.map((command) => (
                  <li key={command.id}>
                    <button
                      type="button"
                      onClick={() =>
                        setFocus({ dimension: "command", value: command.id })
                      }
                    >
                      <span className="name">/{command.name}</span>
                      <span className="numbers">
                        {compactNumber(command.previous)} →{" "}
                        <strong>{compactNumber(command.count)}</strong>
                      </span>
                      <span
                        className={`df-delta ${
                          command.delta > 0 ? "up" : command.delta < 0 ? "down" : ""
                        }`}
                      >
                        <i
                          className={`fa-solid ${
                            command.delta > 0
                              ? "fa-arrow-trend-up"
                              : "fa-arrow-trend-down"
                          }`}
                        ></i>
                        {command.change === null
                          ? "new"
                          : `${command.change > 0 ? "+" : ""}${command.change}%`}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ---- People and places --------------------------------- */}

          <div className="df-insights-split">
            <section className="df-card">
              <div className="df-card-head">
                <h2>
                  <i className="fa-solid fa-users"></i> Users by activity
                </h2>
                <span className="df-card-note">
                  {plural(period.uniqueUsers, "unique user")}
                </span>
              </div>

              <RankedList
                items={data.users.ranked}
                limit={12}
                colour={CHART_COLOURS.amber}
                meta={(item) =>
                  `${plural(item.commands, "command")} · last ${timeAgo(item.last)}`
                }
                onSelect={(item) =>
                  setFocus({ dimension: "user", value: item.id })
                }
                empty="Nobody has used this bot in this period"
              />
            </section>

            <section className="df-card">
              <div className="df-card-head">
                <h2>
                  <i className="fa-solid fa-server"></i> Servers by activity
                </h2>
                <span className="df-card-note">
                  {plural(period.uniqueServers, "active server")}
                </span>
              </div>

              <RankedList
                items={data.servers.ranked}
                limit={12}
                colour={CHART_COLOURS.violet}
                meta={(item) =>
                  `${plural(item.users, "user")} · last ${timeAgo(item.last)}`
                }
                onSelect={(item) =>
                  setFocus({ dimension: "server", value: item.id })
                }
                empty="No server activity in this period"
              />
            </section>
          </div>

          {/* ---- Server growth ------------------------------------- */}

          <section className="df-card">
            <div className="df-card-head">
              <h2>
                <i className="fa-solid fa-chart-line"></i> Server growth
              </h2>
              <div className="df-legend">
                <span>
                  <i style={{ background: CHART_COLOURS.mint }} /> Joined
                </span>
                <span>
                  <i style={{ background: CHART_COLOURS.danger }} /> Left
                </span>
              </div>
            </div>

            <TrendChart
              height={190}
              data={timeline}
              series={[
                { key: "joins", label: "Joined", colour: CHART_COLOURS.mint },
                { key: "leaves", label: "Left", colour: CHART_COLOURS.danger },
              ]}
              empty="This bot hasn't joined or left a server in this period"
            />

            <div className="df-insights-split">
              <div className="df-subcard">
                <h3>
                  <i className="fa-solid fa-circle-plus"></i> Recently joined
                </h3>
                {data.servers.joined?.length ? (
                  <ul className="df-event-list">
                    {data.servers.joined.map((event, index) => (
                      <InsightEvent
                        key={index}
                        event={event}
                        compact
                        onSelectServer={(row) =>
                          setFocus({ dimension: "server", value: row.guildId })
                        }
                      />
                    ))}
                  </ul>
                ) : (
                  <div className="df-chart-empty">
                    No new servers in this period
                  </div>
                )}
              </div>

              <div className="df-subcard">
                <h3>
                  <i className="fa-solid fa-circle-minus"></i> Recently left
                </h3>
                {data.servers.left?.length ? (
                  <ul className="df-event-list">
                    {data.servers.left.map((event, index) => (
                      <InsightEvent key={index} event={event} compact />
                    ))}
                  </ul>
                ) : (
                  <div className="df-chart-empty">
                    The bot wasn't removed from any server
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ---- Feed + errors ------------------------------------- */}

          <div className="df-insights-split">
            <section className="df-card">
              <div className="df-card-head">
                <h2>
                  <i className="fa-solid fa-wifi"></i> Recent activity
                </h2>
                <Link to={`/insights/${projectId}/logs`}>
                  <button>
                    <i className="fa-solid fa-list-ul"></i> All logs
                  </button>
                </Link>
              </div>

              {data.recent?.length ? (
                <ul className="df-event-list">
                  {/* A taste of what's happening; the Logs page is where
                      you go to actually read through it. */}
                  {data.recent.slice(0, 10).map((event, index) => (
                    <InsightEvent
                      key={index}
                      event={event}
                      onSelectCommand={(value) =>
                        setFocus({ dimension: "command", value })
                      }
                      onSelectUser={(row) =>
                        setFocus({ dimension: "user", value: row.userId })
                      }
                      onSelectServer={(row) =>
                        setFocus({ dimension: "server", value: row.guildId })
                      }
                    />
                  ))}
                </ul>
              ) : (
                <div className="df-chart-empty">
                  Nothing has happened in this period
                </div>
              )}
            </section>

            <section className="df-card">
              <div className="df-card-head">
                <h2>
                  <i className="fa-solid fa-triangle-exclamation"></i> Errors
                </h2>
                <span className="df-card-note">
                  {plural(data.errors.count, "error")} this period
                </span>
              </div>

              {data.errors.recent?.length ? (
                <ul className="df-event-list">
                  {data.errors.recent.map((event, index) => (
                    <InsightEvent key={index} event={event} compact />
                  ))}
                </ul>
              ) : (
                <div className="df-chart-empty">
                  No errors reported. Nice.
                </div>
              )}
            </section>
          </div>

          {/* ---- Servers the bot is in ----------------------------- */}

          {servers.list?.length > 0 && (
            <section className="df-card">
              <div className="df-card-head">
                <h2>
                  <i className="fa-solid fa-list"></i> Servers this bot is in
                </h2>
                <span className="df-card-note">
                  {servers.truncated
                    ? `Showing the ${servers.list.length} largest of ${compactNumber(
                        servers.count,
                      )}`
                    : plural(servers.list.length, "server")}
                </span>
              </div>

              <div className="df-table-scroll">
                <table className="df-table">
                  <thead>
                    <tr>
                      <th>Server</th>
                      <th>Members</th>
                      <th>Channels</th>
                      <th>Bot joined</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {servers.list.slice(0, 25).map((guild) => (
                      <tr key={guild.id}>
                        <td>{guild.name}</td>
                        <td>{compactNumber(guild.members)}</td>
                        <td>{guild.channels || "Unknown"}</td>
                        <td>
                          {guild.joinedAt ? formatMoment(guild.joinedAt) : "Unknown"}
                        </td>
                        <td>
                          <button
                            className="df-mini-btn"
                            onClick={() =>
                              setFocus({ dimension: "server", value: guild.id })
                            }
                          >
                            <i className="fa-solid fa-chart-simple"></i> Insights
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}

      {/* ---- Data settings ---------------------------------------- */}

      <section className="df-card df-insights-settings">
        <div className="df-card-head">
          <h2>
            <i className="fa-solid fa-database"></i> Data &amp; retention
          </h2>
        </div>

        <div className="df-settings-row">
          <div>
            <h3>Keep Insight logs for</h3>
            <p>
              Events older than this are deleted from DisFuse permanently. The
              longest we keep raw logs is 90 days.
            </p>
          </div>

          <select
            value={project?.retentionDays || 90}
            disabled={savingRetention}
            onChange={(event) => saveRetention(event.target.value)}
          >
            {(project?.retentionOptions || [7, 14, 30, 60, 90]).map((days) => (
              <option value={days} key={days}>
                {days} days
              </option>
            ))}
          </select>
        </div>

        <div className="df-settings-row">
          <div>
            <h3>Delete everything</h3>
            <p>
              Erase every recorded event for this bot. Collection continues
              afterwards, so this only clears the history.
            </p>
          </div>

          <button className="red" onClick={confirmClear}>
            <i className="fa-solid fa-trash"></i> Clear Insight data
          </button>
        </div>

        <p className="df-card-foot">
          {project?.firstEventAt
            ? `Collecting since ${formatMoment(project.firstEventAt)}.`
            : "Nothing collected yet."}{" "}
          Your bot posts its events to DisFuse in batches, authenticated with
          its own Discord bot token.
        </p>
      </section>

      {focus && (
        <FocusPanel
          projectId={projectId}
          focus={focus}
          range={range}
          onFocus={setFocus}
          onClose={() => setFocus(null)}
        />
      )}
    </div>
  );
}

/** One row in the "Standouts" list. */
function Highlight({ icon, label, value, sub, tone, onClick }) {
  return (
    <li className={`df-highlight${tone ? ` ${tone}` : ""}`}>
      <span className="icon">
        <i className={icon}></i>
      </span>
      <div className="body">
        <span className="label">{label}</span>
        <strong className="value">{value}</strong>
        <span className="sub">{sub}</span>
      </div>
      {onClick && (
        <button className="df-mini-btn" onClick={onClick} title="Break this down">
          <i className="fa-solid fa-arrow-right"></i>
        </button>
      )}
    </li>
  );
}

/** Shown until a bot has reported its very first event. */
function NoDataYet({ project }) {
  return (
    <div className="df-empty df-insights-waiting">
      <i className="fa-solid fa-satellite-dish"></i>
      <h3>Waiting for {project?.name || "this bot"}'s first event</h3>
      <p>
        Insights are collected by the bot itself. Export or re-host your project
        so it runs the latest generated code, start the bot, and its commands,
        servers and errors will appear here within a few seconds.
      </p>
      <div className="df-btn-group">
        <Link to={`/insights/${project?.id}/logs`}>
          <button>
            <i className="fa-solid fa-list-ul"></i> Open live logs
          </button>
        </Link>
      </div>
    </div>
  );
}
