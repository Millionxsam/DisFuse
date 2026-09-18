import { premiumFeatures, premiumLogo } from "../../config/premiumPlans";

/**
 * Everything Premium includes, listed once.
 *
 * Shown on the Premium settings tab, to subscribers and non-subscribers
 * alike, so both read the same list.
 */
export default function PremiumPerks({
  heading = "Everything in DisFuse Premium",
}) {
  return (
    <section className="df-premium-perks">
      <div className="df-premium-perks-head">
        <img src={premiumLogo} alt="" width="44" height="44" />
        <div>
          <h3>{heading}</h3>
          <p>
            Every feature on DisFuse is free. Premium raises your limits, and
            every plan below includes all of it. The only difference is how you
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
