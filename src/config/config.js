const isLocal = window.location.hostname === "localhost";

export const discordUrl = "https://discord.com/api/v6";
export const apiUrl = isLocal
  ? "http://localhost:80"
  : "https://api.disfuse.xyz";
export const hostUrl = isLocal
  ? "http://localhost:30"
  : "https://host.disfuse.xyz";
export const authUrl = isLocal
  ? "https://discord.com/oauth2/authorize?client_id=1234163623081934889&response_type=token&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fprojects&scope=identify"
  : "https://discord.com/oauth2/authorize?client_id=1234163623081934889&response_type=token&redirect_uri=https%3A%2F%2Fdisfuse.xyz%2Fprojects&scope=identify";

export const discordClientId = "1234163623081934889";

/* ---- Websites -------------------------------------------------------
   Websites are BUILT here and PUBLISHED somewhere else: DisFuse-Sites,
   a separate application deployed to sites.disfuse.xyz whose only job is
   rendering them. This app therefore never renders a published website —
   it only ever links to one.

   A website's public address is its custom URL if the owner chose one,
   and its bot's Discord ID otherwise. `path` is a real database field, so
   the address is decided by the API, not calculated in the browser; these
   helpers exist for links and previews and always agree with it. */

export const sitesUrl = isLocal
  ? "http://localhost:3001"
  : "https://sites.disfuse.xyz";

/** The public path segment for a website: its custom URL, or its bot ID. */
export const websitePublicPath = (website) =>
  website?.path || website?.botID || "";

/**
 * The full public URL of a website.
 *
 * The API returns the same value as `website.url`; prefer that when you
 * have it, and use this for websites still being edited locally.
 */
export const publishedWebsiteUrl = (website) =>
  `${sitesUrl}/${websitePublicPath(website)}`;

/** Where a published website's other pages live, e.g. /my-bot/commands. */
export const websitePagePath = (website, pagePath) =>
  `${publishedWebsiteUrl(website)}${pagePath ? `/${pagePath}` : ""}`;
