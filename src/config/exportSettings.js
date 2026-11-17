/* =====================================================================
   Export settings
   ---------------------------------------------------------------------
   What an exported bot is set up to run with: the JavaScript runtime
   that starts it and the package manager that installs its packages.

   Each user picks defaults in Settings → Export, and a project can
   override either one in its project settings. The API accepts the same
   values (functions/exportSettings.js there).
   ===================================================================== */

export const RUNTIMES = {
  node: { label: "Node.js", start: "node index.js", url: "https://nodejs.org" },
  bun: { label: "Bun", start: "bun index.js", url: "https://bun.sh" },
};

/** `comesWith` is the runtime that already includes it, if any. */
export const PACKAGE_MANAGERS = {
  npm: {
    label: "npm",
    install: "npm install",
    run: "npm start",
    url: "https://nodejs.org",
    comesWith: "node",
  },
  pnpm: {
    label: "pnpm",
    install: "pnpm install",
    run: "pnpm start",
    url: "https://pnpm.io/installation",
  },
  yarn: {
    label: "Yarn",
    install: "yarn install",
    run: "yarn start",
    url: "https://yarnpkg.com/getting-started/install",
  },
  bun: {
    label: "Bun",
    install: "bun install",
    run: "bun start",
    url: "https://bun.sh",
    comesWith: "bun",
  },
};

export const DEFAULT_EXPORT_SETTINGS = { runtime: "node", packageManager: "npm" };

/** The user's own defaults, falling back to Node.js and npm. */
export function userExportSettings(user) {
  const saved = user?.settings?.export ?? {};

  return {
    runtime: RUNTIMES[saved.runtime]
      ? saved.runtime
      : DEFAULT_EXPORT_SETTINGS.runtime,
    packageManager: PACKAGE_MANAGERS[saved.packageManager]
      ? saved.packageManager
      : DEFAULT_EXPORT_SETTINGS.packageManager,
  };
}

/** What this project exports with: its own override, else the user's default. */
export function resolveExportSettings(user, project) {
  const defaults = userExportSettings(user);
  const own = project?.exportSettings ?? {};

  return {
    runtime: RUNTIMES[own.runtime] ? own.runtime : defaults.runtime,
    packageManager: PACKAGE_MANAGERS[own.packageManager]
      ? own.packageManager
      : defaults.packageManager,
  };
}
