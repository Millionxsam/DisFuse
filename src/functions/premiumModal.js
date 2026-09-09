import { premiumLogo } from "../config/premiumPlans";

/**
 * Shared Swal options that put the Premium mark on a dialog.
 *
 * Spread these alongside `modalThemeColor(...)`, the way every other
 * dialog in the app is themed. Neither object sets `customClass` —
 * `modalThemeColor` owns that, and a second one would silently drop the
 * dark theme.
 */

/**
 * Puts the mark where the Swal icon would go, for the good news.
 *
 * Drop the dialog's `icon` when using this: Swal renders the icon and the
 * image as two separate blocks, so keeping both stacks them.
 */
export const premiumModalHero = {
  imageUrl: premiumLogo,
  imageWidth: 96,
  imageHeight: 96,
  imageAlt: "DisFuse Premium",
};

/**
 * Signs a dialog with the mark without touching its icon — for the
 * warnings and errors, where the red or amber icon is carrying meaning.
 */
export const premiumModalBrand = {
  footer: `<span class="df-swal-premium"><img src="${premiumLogo}" alt="" /> DisFuse Premium</span>`,
};
