import PremiumUpgrade from "../../../components/premium/PremiumUpgrade";

import { DOCS } from "../../../config/docs.js";

/**
 * Shown instead of the Websites feature when the account isn't premium.
 *
 * The upgrade screen itself — perks, plans and checkout — is shared with
 * every other Premium feature; only the pitch is specific to Websites.
 */
export default function WebsitesUpgrade() {
  return (
    <PremiumUpgrade
      icon="fa-solid fa-globe"
      title="Websites"
      heroTitle="Build a website for your bot"
      heroBody="Websites is part of DisFuse Premium. Design a landing page, an information site, or a full dashboard where server owners configure your bot, all with a visual builder and no code needed."
      docsPage={DOCS.websites}
    />
  );
}
