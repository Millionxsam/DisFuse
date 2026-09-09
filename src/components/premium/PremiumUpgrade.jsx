import { useState } from "react";
import Swal from "sweetalert2";
import { Helmet } from "react-helmet-async";

import { startCheckout } from "../../api/premium";
import {
  premiumFeatures,
  premiumHighlights,
  premiumLogo,
  premiumPlans,
} from "../../config/premiumPlans";
import modalThemeColor from "../../functions/modalThemeColor";
import { premiumModalBrand } from "../../functions/premiumModal";
import { userCache } from "../../cache.ts";

/**
 * The upgrade screen, shown in place of any Premium feature when the
 * account isn't subscribed.
 *
 * Premium is one product: the perks are listed once, above the plans,
 * and a plan is only a way to pay for them. The page that renders this
 * supplies the heading and the pitch for whichever feature the person
 * was trying to open.
 *
 * Checkout is delegated to the backend, which creates the Stripe session
 * and returns a URL to redirect to. Nothing Stripe-related happens here.
 *
 * @param {{icon: string, title: string, heroTitle: string,
 *          heroBody: React.ReactNode}} props
 */
export default function PremiumUpgrade({ icon, title, heroTitle, heroBody }) {
  const [busy, setBusy] = useState(null);

  async function upgrade(plan) {
    setBusy(plan.id);

    try {
      const url = await startCheckout(plan.id);
      if (!url) throw new Error("No checkout URL returned");

      window.location = url;
    } catch (err) {
      console.error(err);
      setBusy(null);

      Swal.fire({
        icon: "error",
        title: "Couldn't start checkout",
        text:
          err.response?.data?.error ||
          "Something went wrong starting your subscription. Please try again.",
        ...premiumModalBrand,
        ...modalThemeColor(userCache.user),
      });
    }
  }

  return (
    <div className="df-page df-premium-page">
      <Helmet>
        <title>{title} | DisFuse</title>
      </Helmet>
      <div className="df-page-head">
        <h1>
          <i className={icon}></i> {title}
        </h1>
      </div>

      <div className="df-premium-hero">
        <img
          className="df-premium-logo"
          src={premiumLogo}
          alt="DisFuse Premium"
          width="112"
          height="112"
        />
        <span className="df-tag">
          <i className="fa-solid fa-crown"></i> PREMIUM
        </span>
        <h2>{heroTitle}</h2>
        <p>{heroBody}</p>
      </div>

      <div className="df-premium-highlights">
        {premiumHighlights.map((highlight) => (
          <div className="df-premium-highlight" key={highlight.title}>
            <div className="icon">
              <i className={highlight.icon}></i>
            </div>
            <h3>{highlight.title}</h3>
            <p>{highlight.body}</p>
          </div>
        ))}
      </div>

      <PremiumPerks />

      <div className="df-premium-plans">
        {premiumPlans.map((plan) => (
          <div
            className={`df-premium-plan${plan.highlight ? " highlight" : ""}`}
            key={plan.id}
          >
            {plan.badge && <span className="plan-badge">{plan.badge}</span>}
            <h3>{plan.name}</h3>
            <div className="plan-price">
              <strong>{plan.price}</strong>
              <span>{plan.interval}</span>
            </div>
            <p className="plan-description">{plan.description}</p>
            <p className="plan-note">
              <i className="fa-solid fa-check"></i> Everything above
              {plan.note ? ` · ${plan.note}` : ""}
            </p>
            <button
              className={plan.highlight ? "df-primary-btn" : ""}
              disabled={busy === plan.id}
              onClick={() => upgrade(plan)}
            >
              {busy === plan.id ? "Redirecting…" : `Get ${plan.name}`}
            </button>
          </div>
        ))}
      </div>

      <p className="df-premium-note">
        <i className="fa-brands fa-cc-stripe"></i> Payments are handled securely
        by Stripe. Cancel any time from your DisFuse settings.
      </p>
    </div>
  );
}

/**
 * Everything Premium unlocks, listed once.
 *
 * Also used on the Premium settings tab, so subscribers and
 * non-subscribers read the same list.
 */
export function PremiumPerks({ heading = "Everything in DisFuse Premium" }) {
  return (
    <section className="df-premium-perks">
      <div className="df-premium-perks-head">
        <img src={premiumLogo} alt="" width="44" height="44" />
        <div>
          <h3>{heading}</h3>
          <p>
            Every plan below unlocks all of it. The only difference is how you
            pay.
          </p>
        </div>
      </div>

      <ul>
        {premiumFeatures.map((feature) => (
          <li key={feature.title}>
            <span className="icon">
              <i className={feature.icon}></i>
            </span>
            <div>
              <strong>{feature.title}</strong>
              <span>{feature.body}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
