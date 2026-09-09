import { useMemo, useRef, useState } from "react";

/* =====================================================================
   Insights charts
   ---------------------------------------------------------------------
   Small, dependency-free SVG/CSS charts drawn with the same tokens as
   the rest of DisFuse (--main-color, --df-mint, --df-amber…), so they
   look like part of the app rather than an embedded library.

   Every one of them takes data that the API already aggregated: nothing
   here loops over raw logs, and nothing here does arithmetic the server
   could have done once for everybody.
   ===================================================================== */

export const CHART_COLOURS = {
  blue: "#3d8ee0",
  mint: "#35d0a0",
  amber: "#ffb648",
  pink: "#e23fe2",
  danger: "#ff5c5c",
  violet: "#8b7bff",
};

/** 1234567 → "1.23M". Long numbers wreck a stat card's layout. */
export function compactNumber(value) {
  const number = Number(value) || 0;

  if (Math.abs(number) >= 1e9) return `${(number / 1e9).toFixed(2)}B`;
  if (Math.abs(number) >= 1e6) return `${(number / 1e6).toFixed(2)}M`;
  if (Math.abs(number) >= 10000) return `${(number / 1000).toFixed(1)}K`;

  return number.toLocaleString();
}

/** Round the axis up to something a person would have chosen. */
function niceMax(value) {
  if (!value || value <= 0) return 1;

  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => value <= s * magnitude);

  return step * magnitude;
}

/* =====================================================================
   Trend chart — activity over time
   ===================================================================== */

const VIEW_WIDTH = 1000;
const VIEW_HEIGHT = 260;

/**
 * A series can be plotted against its own axis on the right. That is
 * what makes "150 events and 6 users" one readable chart instead of a
 * flat line pinned to zero.
 *
 * @param {{
 *   data: Array<object>,               rows, already in order
 *   series: Array<{key: string, label: string, colour: string,
 *                  fill?: boolean, axis?: "left"|"right"}>,
 *   labelKey?: string,                 which field holds the x label
 *   height?: number,
 *   empty?: string
 * }} props
 */
export function TrendChart({
  data = [],
  series = [],
  labelKey = "label",
  height = 240,
  empty = "No activity in this period",
}) {
  const [active, setActive] = useState(null);
  const frame = useRef(null);

  const [max, rightMax] = useMemo(() => {
    const peak = (lines) =>
      niceMax(
        data.reduce(
          (top, row) =>
            lines.reduce((best, line) => Math.max(best, row[line.key] || 0), top),
          0,
        ),
      );

    return [
      peak(series.filter((line) => line.axis !== "right")),
      peak(series.filter((line) => line.axis === "right")),
    ];
  }, [data, series]);

  const hasRightAxis = series.some((line) => line.axis === "right");
  const rightSeries = series.find((line) => line.axis === "right");

  if (!data.length)
    return <div className="df-chart-empty">{empty}</div>;

  const points = data.length;
  const x = (index) =>
    points === 1 ? VIEW_WIDTH / 2 : (index / (points - 1)) * VIEW_WIDTH;
  const y = (value, entry) =>
    VIEW_HEIGHT -
    ((value || 0) / (entry?.axis === "right" ? rightMax : max)) * VIEW_HEIGHT;

  const line = (entry) =>
    data.map((row, index) => `${x(index)},${y(row[entry.key], entry)}`).join(" ");

  const area = (entry) =>
    `M0,${VIEW_HEIGHT} ` +
    data.map((row, index) => `L${x(index)},${y(row[entry.key], entry)}`).join(" ") +
    ` L${VIEW_WIDTH},${VIEW_HEIGHT} Z`;

  /* Nearest point to the cursor, in data space rather than pixels. */
  const track = (event) => {
    const bounds = frame.current?.getBoundingClientRect();
    if (!bounds?.width) return;

    const ratio = (event.clientX - bounds.left) / bounds.width;
    setActive(Math.max(0, Math.min(points - 1, Math.round(ratio * (points - 1)))));
  };

  const row = active === null ? null : data[active];

  return (
    <div
      className={`df-trend${hasRightAxis ? " has-right-axis" : ""}`}
      ref={frame}
      style={{ height }}
      onMouseMove={track}
      onMouseLeave={() => setActive(null)}
    >
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          {series.map((entry) => (
            <linearGradient
              key={entry.key}
              id={`df-trend-${entry.key}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={entry.colour} stopOpacity="0.35" />
              <stop offset="100%" stopColor={entry.colour} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {[0.25, 0.5, 0.75].map((step) => (
          <line
            key={step}
            className="df-trend-grid"
            x1="0"
            x2={VIEW_WIDTH}
            y1={VIEW_HEIGHT * step}
            y2={VIEW_HEIGHT * step}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {series
          .filter((entry) => entry.fill !== false)
          .map((entry) => (
            <path
              key={`area-${entry.key}`}
              d={area(entry)}
              fill={`url(#df-trend-${entry.key})`}
            />
          ))}

        {series.map((entry) => (
          <polyline
            key={`line-${entry.key}`}
            className="df-trend-line"
            points={line(entry)}
            stroke={entry.colour}
            strokeDasharray={entry.axis === "right" ? "6 5" : undefined}
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {row && (
          <line
            className="df-trend-cursor"
            x1={x(active)}
            x2={x(active)}
            y1="0"
            y2={VIEW_HEIGHT}
            vectorEffect="non-scaling-stroke"
          />
        )}

        {row &&
          series.map((entry) => (
            <circle
              key={`dot-${entry.key}`}
              cx={x(active)}
              cy={y(row[entry.key], entry)}
              r="7"
              fill={entry.colour}
            />
          ))}
      </svg>

      <div className="df-trend-axis">
        <span>{compactNumber(max)}</span>
        <span>{compactNumber(max / 2)}</span>
        <span>0</span>
      </div>

      {hasRightAxis && (
        <div className="df-trend-axis right" style={{ color: rightSeries.colour }}>
          <span>{compactNumber(rightMax)}</span>
          <span>{compactNumber(rightMax / 2)}</span>
          <span>0</span>
        </div>
      )}

      <div className="df-trend-labels">
        <span>{data[0]?.[labelKey]}</span>
        {points > 2 && (
          <span>{data[Math.floor((points - 1) / 2)]?.[labelKey]}</span>
        )}
        <span>{data[points - 1]?.[labelKey]}</span>
      </div>

      {row && (
        <div
          className="df-trend-tip"
          style={{
            left: `${points === 1 ? 50 : (active / (points - 1)) * 100}%`,
          }}
        >
          <strong>{row[labelKey]}</strong>
          {series.map((entry) => (
            <span key={entry.key}>
              <i style={{ background: entry.colour }} />
              {entry.label}
              <b>{compactNumber(row[entry.key] || 0)}</b>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* =====================================================================
   Column chart — activity by hour of day / by weekday
   ===================================================================== */

/**
 * @param {{data: Array<{label: string, value: number, title?: string}>,
 *          colour?: string, empty?: string, everyLabel?: number}} props
 */
export function ColumnChart({
  data = [],
  colour = CHART_COLOURS.blue,
  empty = "Nothing recorded yet",
  everyLabel = 1,
}) {
  const max = Math.max(...data.map((row) => row.value || 0), 0);

  if (!data.length || !max)
    return <div className="df-chart-empty">{empty}</div>;

  return (
    <div className="df-columns">
      {data.map((row, index) => {
        const share = (row.value || 0) / max;

        return (
          <div
            className="df-column"
            key={row.label}
            title={row.title || `${row.label}: ${row.value}`}
          >
            <div className="track">
              <div
                className="fill"
                style={{
                  height: `${Math.max(share * 100, row.value ? 3 : 0)}%`,
                  background: colour,
                  /* The busiest bars read as solid, quiet ones fade —
                     the shape of a day is visible at a glance. */
                  opacity: row.value ? 0.35 + share * 0.65 : 0.12,
                }}
              />
            </div>
            <span className="label">
              {index % everyLabel === 0 ? row.label : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* =====================================================================
   Donut — how interactions break down
   ===================================================================== */

const CIRCUMFERENCE = 2 * Math.PI * 60;

/**
 * @param {{segments: Array<{label: string, value: number, colour: string}>,
 *          total?: number, caption?: string, empty?: string}} props
 */
export function Donut({ segments = [], total, caption, empty = "No data" }) {
  const sum = total ?? segments.reduce((count, part) => count + part.value, 0);

  if (!sum) return <div className="df-chart-empty">{empty}</div>;

  let offset = 0;

  return (
    <div className="df-donut">
      <svg viewBox="0 0 160 160" aria-hidden="true">
        <circle className="df-donut-track" cx="80" cy="80" r="60" />
        {segments.map((part) => {
          const length = (part.value / sum) * CIRCUMFERENCE;
          const dash = `${length} ${CIRCUMFERENCE - length}`;
          const rotation = offset;
          offset += length;

          return (
            <circle
              key={part.label}
              cx="80"
              cy="80"
              r="60"
              className="df-donut-segment"
              stroke={part.colour}
              strokeDasharray={dash}
              strokeDashoffset={-rotation}
            />
          );
        })}
        <text className="df-donut-value" x="80" y="76">
          {compactNumber(sum)}
        </text>
        <text className="df-donut-caption" x="80" y="96">
          {caption || "total"}
        </text>
      </svg>

      <ul className="df-donut-legend">
        {segments.map((part) => (
          <li key={part.label}>
            <i style={{ background: part.colour }} />
            <span>{part.label}</span>
            <b>{compactNumber(part.value)}</b>
            <em>{Math.round((part.value / sum) * 100)}%</em>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* =====================================================================
   Ranked list — commands, users and servers by usage
   ===================================================================== */

/**
 * @param {{items: Array<object>, max?: number, colour?: string,
 *          onSelect?: (item: object) => void, empty?: string,
 *          meta?: (item: object) => string, limit?: number}} props
 */
export function RankedList({
  items = [],
  colour = CHART_COLOURS.blue,
  onSelect,
  empty = "Nothing here yet",
  meta,
  limit = 10,
}) {
  const shown = items.slice(0, limit);
  const max = Math.max(...shown.map((item) => item.count || 0), 1);

  if (!shown.length) return <div className="df-chart-empty">{empty}</div>;

  return (
    <ol className="df-rank-list">
      {shown.map((item, index) => (
        <li key={item.id ?? index}>
          <button
            type="button"
            className="df-rank-row"
            onClick={onSelect ? () => onSelect(item) : undefined}
            disabled={!onSelect}
          >
            <span className="rank">{index + 1}</span>
            <span className="body">
              <span className="name" title={item.name}>
                {item.name}
              </span>
              <span
                className="bar"
                style={{
                  width: `${Math.max(((item.count || 0) / max) * 100, 2)}%`,
                  background: colour,
                }}
              />
              {meta && <span className="meta">{meta(item)}</span>}
            </span>
            <span className="count">{compactNumber(item.count || 0)}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}

/* =====================================================================
   Stat card — the summary row
   ===================================================================== */

/**
 * @param {{label: string, value: React.ReactNode, icon?: string,
 *          sub?: React.ReactNode, delta?: number|null,
 *          tone?: string, spark?: Array<number>}} props
 */
export function StatCard({ label, value, icon, sub, delta, tone, spark }) {
  return (
    <div className={`df-stat-card${tone ? ` ${tone}` : ""}`}>
      <div className="head">
        {icon && <i className={icon}></i>}
        <span>{label}</span>
      </div>

      <strong className="value">{value}</strong>

      <div className="foot">
        {delta !== undefined && delta !== null && (
          <span
            className={`df-delta ${delta > 0 ? "up" : delta < 0 ? "down" : ""}`}
          >
            <i
              className={`fa-solid ${
                delta > 0
                  ? "fa-arrow-trend-up"
                  : delta < 0
                    ? "fa-arrow-trend-down"
                    : "fa-minus"
              }`}
            ></i>
            {delta > 0 ? "+" : ""}
            {delta}%
          </span>
        )}
        {sub && <span className="sub">{sub}</span>}
      </div>

      {spark?.length > 1 && <Sparkline values={spark} />}
    </div>
  );
}

/** Tiny trend line for the corner of a card. */
export function Sparkline({ values = [], colour = CHART_COLOURS.blue }) {
  const max = Math.max(...values, 1);
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      return `${x},${28 - (value / max) * 26}`;
    })
    .join(" ");

  return (
    <svg className="df-sparkline" viewBox="0 0 100 30" preserveAspectRatio="none">
      <polyline points={points} stroke={colour} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
