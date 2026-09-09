import LoadingAnim from "../LoadingAnim";
import WebsitesUpgrade from "../../Pages/Dashboard/Websites/WebsitesUpgrade";
import usePremium from "../../functions/usePremium";

/**
 * Gate for a premium feature: renders the upgrade screen for anyone
 * without an active subscription.
 *
 * `fallback` is what a non-subscriber sees, so each feature can make its
 * own pitch; Websites is the default because it was the first one.
 *
 * It's a UX gate only — every premium endpoint enforces the
 * subscription on the backend as well, so bypassing this achieves
 * nothing.
 */
export default function PremiumGate({ children, fallback }) {
  const { loading, premium, error, refresh } = usePremium();

  if (loading)
    return (
      <div className="df-page">
        <LoadingAnim />
      </div>
    );

  if (error)
    return (
      <div className="df-page">
        <div className="df-empty">
          <i className="fa-solid fa-triangle-exclamation"></i>
          <h3>Couldn't check your subscription</h3>
          <p>
            We couldn't reach DisFuse to confirm your Premium status. Check your
            connection and try again.
          </p>
          <button className="df-primary-btn" onClick={refresh}>
            <i className="fa-solid fa-rotate-right"></i> Try again
          </button>
        </div>
      </div>
    );

  if (!premium) return fallback || <WebsitesUpgrade />;

  return children;
}
