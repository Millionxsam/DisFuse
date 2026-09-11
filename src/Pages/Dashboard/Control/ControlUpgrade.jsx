import PremiumUpgrade from "../../../components/premium/PremiumUpgrade";

import { DOCS } from "../../../config/docs.js";

/**
 * Shown instead of Control when the account isn't premium.
 *
 * The gate is UX only — the API refuses a Control socket from a
 * non-subscriber whether or not this screen was rendered.
 */
export default function ControlUpgrade() {
  return (
    <PremiumUpgrade
      icon="fa-solid fa-satellite-dish"
      title="Control"
      heroTitle="Use Discord as your bot"
      heroBody="Control is part of DisFuse Premium. Open a real Discord-style client for any bot you own, then read its servers and channels, send and edit messages, react, moderate members and manage roles and channels. Everything is performed by your bot, live, without ever leaving DisFuse."
      docsPage={DOCS.control}
    />
  );
}
