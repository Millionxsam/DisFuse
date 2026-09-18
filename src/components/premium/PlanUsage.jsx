import { Link } from "react-router-dom";

import { premiumLogo } from "../../config/premiumPlans";

/**
 * Stands in for a "create" form when there is no room for another
 * project or website, so nobody fills one in only to be refused.
 *
 * @param {object} props
 * @param {"projects"|"websites"} props.resource
 * @param {object} props.data the answer from usePlanLimits
 */
export function PlanLimitReached({ resource, data }) {
  const limit = data.limits[resource];
  const premiumLimit = data.premiumLimits?.[resource];
  const noun = resource === "projects" ? "project" : "website";

  return (
    <div className="df-empty">
      <i className={resource === "projects" ? "fa-solid fa-cubes" : "fa-solid fa-globe"}></i>
      <h3>You've reached your {noun} limit</h3>
      <p>
        {data.premium
          ? `You can own up to ${limit} ${noun}s. Delete a ${noun} to make room for a new one.`
          : `Free accounts can own up to ${limit} ${noun}s. Delete a ${noun} to make room, or upgrade to DisFuse Premium to own up to ${premiumLimit}.`}
      </p>
      <div className="df-btn-group">
        {!data.premium && (
          <Link to="/settings/premium">
            <button className="df-primary-btn">
              <img className="df-plan-button-logo" src={premiumLogo} alt="" />{" "}
              See Premium
            </button>
          </Link>
        )}
        <Link to={`/${resource}`}>
          <button>
            <i className={resource === "projects" ? "fa-solid fa-cubes" : "fa-solid fa-globe"}></i>{" "}
            My {noun === "project" ? "Projects" : "Websites"}
          </button>
        </Link>
      </div>
    </div>
  );
}

/**
 * How much of a plan limit is in use: "3 of 5 projects", a bar, and for
 * a free account a way to see what Premium raises it to.
 *
 * Renders nothing until the limits have loaded, so a slow or failed read
 * never shows a wrong number. The API enforces the limit regardless.
 *
 * @param {object} props
 * @param {"projects"|"websites"} props.resource
 * @param {object|null} props.data the answer from usePlanLimits
 */
export default function PlanUsage({ resource, data }) {
  if (!data?.limits || !data?.usage) return null;

  const used = data.usage[resource] ?? 0;
  const limit = data.limits[resource];
  const premiumLimit = data.premiumLimits?.[resource];
  const noun = resource === "projects" ? "project" : "website";

  const full = used >= limit;
  const over = used > limit;
  const percent = Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));

  return (
    <div
      className={`df-plan-usage${full ? " full" : ""}`}
      title={`Only ${noun}s you own count toward this limit. ${
        noun === "project" ? "Projects" : "Websites"
      } you collaborate on don't.`}
    >
      <div className="df-plan-usage-head">
        <span className="df-plan-usage-count">
          <strong>{used}</strong> of {limit} {noun}s
          {data.premium && (
            <span className="df-plan-usage-tag">
              <img src={premiumLogo} alt="" /> Premium
            </span>
          )}
        </span>

        {!data.premium && premiumLimit > limit && (
          <Link to="/settings/premium" className="df-plan-usage-upgrade">
            <img src={premiumLogo} alt="" />
            Upgrade to Premium for up to {premiumLimit} {noun}s
          </Link>
        )}
      </div>

      <div className="df-plan-usage-bar" aria-hidden="true">
        <span style={{ width: `${percent}%` }} />
      </div>

      {full && (
        <p className="df-plan-usage-note">
          {over
            ? `You have more ${noun}s than your plan's limit of ${limit}. Everything you have keeps working, but you can't create a new ${noun} until you have fewer than ${limit}.`
            : `You've reached your limit of ${limit} ${noun}s. Delete one to make room for a new one${
                data.premium ? "." : ", or upgrade to Premium for more."
              }`}
        </p>
      )}
    </div>
  );
}
