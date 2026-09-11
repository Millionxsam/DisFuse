import PremiumUpgrade from "../../../components/premium/PremiumUpgrade";

import { DOCS } from "../../../config/docs.js";

/**
 * Shown instead of Insights when the account isn't premium.
 *
 * Bots keep sending their events either way — a free user's bot is
 * still collecting, so the history is already there the moment they
 * subscribe. This screen says so, because it is the honest pitch.
 */
export default function InsightsUpgrade() {
  return (
    <PremiumUpgrade
      icon="fa-solid fa-chart-line"
      title="Insights"
      heroTitle="See how your bot is really used"
      heroBody="Insights is part of DisFuse Premium. Every command, user, server and error your bot handles, turned into rankings, trends and live logs. Your bots are already recording their activity, so subscribe and it's waiting for you."
      docsPage={DOCS.insights}
    />
  );
}
