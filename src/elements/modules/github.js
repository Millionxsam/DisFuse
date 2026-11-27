/* =====================================================================
   Builder catalog: GitHub
   ---------------------------------------------------------------------
   GitHub: looking up users, repositories, issues, pull requests,
   commits, releases and gists, and (with a token) opening issues,
   commenting, starring and more.

   Reading public information needs no token. GitHub allows 60 of those
   requests an hour per bot. Steps that act as an account take a token.
   ===================================================================== */

import { group, input } from "../define.js";

const { action, value } = group({ colour: "#6e5494" });

/* The functions every GitHub step sends its requests through. */
const GITHUB = {
  key: "disfuseGithub",
  code: `/* GitHub */
async function githubRequest(path, token, options = {}) {
  const res = await fetch("https://api.github.com" + path, {
    method: options.method || "GET",
    headers: {
      Accept: options.raw ? "application/vnd.github.raw+json" : "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "DisFuse-Bot",
      ...(token ? { Authorization: "Bearer " + token } : {}),
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (options.status) return res.status;
  if (!res.ok) {
    if (res.status !== 404) console.error("GitHub API error (" + res.status + "):", await res.text().catch(() => ""));
    return null;
  }
  if (res.status === 204) return true;
  return options.raw ? res.text() : res.json();
}
/* "owner/repo", a github.com link or a clone link, as "owner/repo". */
function githubRepoPath(repo) {
  return String(repo)
    .trim()
    .replace(/^(https?:\\/\\/)?(www\\.)?github\\.com\\//i, "")
    .replace(/\\.git$/i, "")
    .split("/")
    .slice(0, 2)
    .map(encodeURIComponent)
    .join("/");
}
/* A list, or text like "bug, help wanted". */
function githubToList(value) {
  if (Array.isArray(value)) return value.map(String);
  return String(value ?? "").split(",").map((item) => item.trim()).filter(Boolean);
}`,
};

const userPath = (username) => `"/users/" + encodeURIComponent(${username})`;
const repoUrl = (repo) => `"/repos/" + githubRepoPath(${repo})`;
const filePath = (path) =>
  `String(${path}).replace(/^\\/+/, "").split("/").map(encodeURIComponent).join("/")`;

const events = [];

const actions = [
  action({
    id: "github_user",
    label: "Look up a GitHub user",
    description: "Finds a GitHub user or organization by username.",
    category: "github",
    group: "Looking up",
    icon: "fa-brands fa-github",
    keywords: ["github", "user", "profile"],
    block: {
      type: "github_getUser",
      text: ["get GitHub user: {username}", "then {code}"],
      parts: { code: { check: "default" } },
      tooltip: "Looks up a GitHub user (or organization) by username, then runs the blocks inside",
    },
    inputs: [input.text("username", "GitHub username", { default: "" })],
    branches: [
      {
        key: "code",
        label: "If it's found",
        inline: true,
        provides: [
          { key: "login", label: "Username", type: "String", code: "githubUser@@.login" },
          { key: "name", label: "Display name", type: "String", code: "githubUser@@.name" },
          { key: "bio", label: "Bio", type: "String", code: "githubUser@@.bio" },
          { key: "id", label: "User ID", type: "Number", code: "githubUser@@.id" },
          {
            key: "type",
            label: "Account type (User or Organization)",
            type: "String",
            code: "githubUser@@.type",
          },
          { key: "company", label: "Company", type: "String", code: "githubUser@@.company" },
          { key: "location", label: "Location", type: "String", code: "githubUser@@.location" },
          { key: "blog", label: "Website", type: "String", code: "githubUser@@.blog" },
          { key: "email", label: "Public email", type: "String", code: "githubUser@@.email" },
          {
            key: "twitter_username",
            label: "X (Twitter) username",
            type: "String",
            code: "githubUser@@.twitter_username",
          },
          {
            key: "hireable",
            label: "Available for hire?",
            type: "Boolean",
            code: "githubUser@@.hireable",
          },
          {
            key: "public_repos",
            label: "Number of public repositories",
            type: "Number",
            code: "githubUser@@.public_repos",
          },
          {
            key: "public_gists",
            label: "Number of public gists",
            type: "Number",
            code: "githubUser@@.public_gists",
          },
          {
            key: "followers",
            label: "Number of followers",
            type: "Number",
            code: "githubUser@@.followers",
          },
          {
            key: "following",
            label: "Number following",
            type: "Number",
            code: "githubUser@@.following",
          },
          {
            key: "created_at",
            label: "Join date",
            type: "String",
            code: "githubUser@@.created_at",
          },
          {
            key: "updated_at",
            label: "Last updated",
            type: "String",
            code: "githubUser@@.updated_at",
          },
          {
            key: "avatar_url",
            label: "Avatar picture link",
            type: "String",
            code: "githubUser@@.avatar_url",
          },
          { key: "html_url", label: "Profile link", type: "String", code: "githubUser@@.html_url" },
        ],
        valuesBlock: {
          type: "github_userInfo",
          text: "get {info} of GitHub user",
          parts: {
            info: {
              part: "dropdown",
              options: [
                ["username", "login"],
                ["display name", "name"],
                ["bio", "bio"],
                ["user ID", "id"],
                ["account type (User or Organization)", "type"],
                ["company", "company"],
                ["location", "location"],
                ["website", "blog"],
                ["public email", "email"],
                ["X / Twitter username", "twitter_username"],
                ["available for hire", "hireable"],
                ["public repositories count", "public_repos"],
                ["public gists count", "public_gists"],
                ["followers count", "followers"],
                ["following count", "following"],
                ["join date", "created_at"],
                ["last updated date", "updated_at"],
                ["avatar image URL", "avatar_url"],
                ["profile link", "html_url"],
              ],
            },
          },
          tooltip: "Information about the GitHub user you got",
          pick: "info",
          restrictions: [
            {
              type: "hasParent",
              blockTypes: ["github_getUser", "github_getTokenUser"],
              message:
                'This block must be inside a "get GitHub user" or "get GitHub account" block.',
            },
          ],
          also: ["github_token_account"],
        },
      },
    ],
    setup: [GITHUB],
    code: (ctx) => {
      const found = ctx.local("githubUser");
      return `{\nconst ${found} = await githubRequest(${userPath(ctx.input("username"))}, null).catch((error) => console.error("GitHub: couldn't find the user.", error));\nif (${found}) {\n${ctx.branch("code")}}\n}\n`;
    },
  }),
  action({
    id: "github_org",
    label: "Look up a GitHub organization",
    description: "Finds a GitHub organization by its name.",
    category: "github",
    group: "Looking up",
    icon: "fa-solid fa-building",
    keywords: ["github", "organization", "org"],
    block: {
      type: "github_getOrg",
      text: ["get GitHub organization: {org}", "then {code}"],
      parts: { code: { check: "default" } },
      tooltip: "Looks up a GitHub organization by its name, then runs the blocks inside",
    },
    inputs: [input.text("org", "Organization", { default: "" })],
    branches: [
      {
        key: "code",
        label: "If it's found",
        inline: true,
        provides: [
          { key: "login", label: "Name", type: "String", code: "githubOrg@@.login" },
          { key: "name", label: "Display name", type: "String", code: "githubOrg@@.name" },
          {
            key: "description",
            label: "Description",
            type: "String",
            code: "githubOrg@@.description",
          },
          { key: "id", label: "Organization ID", type: "Number", code: "githubOrg@@.id" },
          { key: "blog", label: "Website", type: "String", code: "githubOrg@@.blog" },
          { key: "location", label: "Location", type: "String", code: "githubOrg@@.location" },
          { key: "email", label: "Public email", type: "String", code: "githubOrg@@.email" },
          {
            key: "twitter_username",
            label: "X (Twitter) username",
            type: "String",
            code: "githubOrg@@.twitter_username",
          },
          {
            key: "is_verified",
            label: "Is verified?",
            type: "Boolean",
            code: "githubOrg@@.is_verified",
          },
          {
            key: "public_repos",
            label: "Number of public repositories",
            type: "Number",
            code: "githubOrg@@.public_repos",
          },
          {
            key: "followers",
            label: "Number of followers",
            type: "Number",
            code: "githubOrg@@.followers",
          },
          { key: "created_at", label: "Date made", type: "String", code: "githubOrg@@.created_at" },
          {
            key: "avatar_url",
            label: "Avatar picture link",
            type: "String",
            code: "githubOrg@@.avatar_url",
          },
          {
            key: "html_url",
            label: "Organization link",
            type: "String",
            code: "githubOrg@@.html_url",
          },
        ],
        valuesBlock: {
          type: "github_orgInfo",
          text: "get {info} of GitHub organization",
          parts: {
            info: {
              part: "dropdown",
              options: [
                ["name", "login"],
                ["display name", "name"],
                ["description", "description"],
                ["organization ID", "id"],
                ["website", "blog"],
                ["location", "location"],
                ["public email", "email"],
                ["X / Twitter username", "twitter_username"],
                ["is verified", "is_verified"],
                ["public repositories count", "public_repos"],
                ["followers count", "followers"],
                ["created date", "created_at"],
                ["avatar image URL", "avatar_url"],
                ["organization link", "html_url"],
              ],
            },
          },
          tooltip: "Information about the GitHub organization you got",
          pick: "info",
          restrictions: [
            {
              type: "hasParent",
              blockTypes: ["github_getOrg"],
              message: 'This block must be inside a "get GitHub organization" block.',
            },
          ],
        },
      },
    ],
    setup: [GITHUB],
    code: (ctx) => {
      const found = ctx.local("githubOrg");
      return `{\nconst ${found} = await githubRequest("/orgs/" + encodeURIComponent(${ctx.input("org")}), null).catch((error) => console.error("GitHub: couldn't find the organization.", error));\nif (${found}) {\n${ctx.branch("code")}}\n}\n`;
    },
  }),
  action({
    id: "github_repo",
    label: "Look up a GitHub repository",
    description: "Finds a repository, like octocat/Hello-World or its github.com link.",
    category: "github",
    group: "Looking up",
    icon: "fa-solid fa-book-bookmark",
    keywords: ["github", "repository", "repo"],
    block: {
      type: "github_getRepo",
      text: ["get GitHub repository (owner/name): {repo}", "then {code}"],
      parts: { code: { check: "default" } },
      tooltip:
        'Looks up a repository, like "octocat/Hello-World" or its github.com link, then runs the blocks inside',
    },
    inputs: [input.text("repo", "Repository", { default: "", placeholder: "owner/name" })],
    branches: [
      {
        key: "code",
        label: "If it's found",
        inline: true,
        provides: [
          { key: "name", label: "Name", type: "String", code: "githubRepo@@.name" },
          {
            key: "full_name",
            label: "Full name (owner/name)",
            type: "String",
            code: "githubRepo@@.full_name",
          },
          {
            key: "description",
            label: "Description",
            type: "String",
            code: "githubRepo@@.description",
          },
          {
            key: "owner_login",
            label: "Owner's username",
            type: "String",
            code: "githubRepo@@.owner?.login",
          },
          {
            key: "owner_avatar_url",
            label: "Owner's avatar picture link",
            type: "String",
            code: "githubRepo@@.owner?.avatar_url",
          },
          {
            key: "stargazers_count",
            label: "Stars",
            type: "Number",
            code: "githubRepo@@.stargazers_count",
          },
          { key: "forks_count", label: "Forks", type: "Number", code: "githubRepo@@.forks_count" },
          {
            key: "subscribers_count",
            label: "Watchers",
            type: "Number",
            code: "githubRepo@@.subscribers_count",
          },
          {
            key: "open_issues_count",
            label: "Open issues and pull requests",
            type: "Number",
            code: "githubRepo@@.open_issues_count",
          },
          {
            key: "language",
            label: "Main language",
            type: "String",
            code: "githubRepo@@.language",
          },
          { key: "topics", label: "Topics (list)", type: "Array", code: "githubRepo@@.topics" },
          {
            key: "license_name",
            label: "License",
            type: "String",
            code: "githubRepo@@.license?.name",
          },
          {
            key: "default_branch",
            label: "Default branch",
            type: "String",
            code: "githubRepo@@.default_branch",
          },
          { key: "homepage", label: "Website", type: "String", code: "githubRepo@@.homepage" },
          { key: "size", label: "Size (KB)", type: "Number", code: "githubRepo@@.size" },
          { key: "fork", label: "Is a fork?", type: "Boolean", code: "githubRepo@@.fork" },
          {
            key: "archived",
            label: "Is archived?",
            type: "Boolean",
            code: "githubRepo@@.archived",
          },
          {
            key: "is_template",
            label: "Is a template?",
            type: "Boolean",
            code: "githubRepo@@.is_template",
          },
          { key: "id", label: "Repository ID", type: "Number", code: "githubRepo@@.id" },
          {
            key: "created_at",
            label: "Date made",
            type: "String",
            code: "githubRepo@@.created_at",
          },
          {
            key: "updated_at",
            label: "Last updated",
            type: "String",
            code: "githubRepo@@.updated_at",
          },
          {
            key: "pushed_at",
            label: "Last pushed",
            type: "String",
            code: "githubRepo@@.pushed_at",
          },
          {
            key: "html_url",
            label: "Repository link",
            type: "String",
            code: "githubRepo@@.html_url",
          },
          { key: "clone_url", label: "Clone link", type: "String", code: "githubRepo@@.clone_url" },
        ],
        valuesBlock: {
          type: "github_repoInfo",
          text: "get {info} of GitHub repository",
          parts: {
            info: {
              part: "dropdown",
              options: [
                ["name", "name"],
                ["full name (owner/name)", "full_name"],
                ["description", "description"],
                ["owner username", "owner?.login"],
                ["owner avatar image URL", "owner?.avatar_url"],
                ["stars", "stargazers_count"],
                ["forks", "forks_count"],
                ["watchers", "subscribers_count"],
                ["open issues & pull requests", "open_issues_count"],
                ["main language", "language"],
                ["topics", "topics"],
                ["license", "license?.name"],
                ["default branch", "default_branch"],
                ["website", "homepage"],
                ["size (KB)", "size"],
                ["is a fork", "fork"],
                ["is archived", "archived"],
                ["is a template", "is_template"],
                ["repository ID", "id"],
                ["created date", "created_at"],
                ["last updated date", "updated_at"],
                ["last pushed date", "pushed_at"],
                ["repository link", "html_url"],
                ["clone URL", "clone_url"],
              ],
            },
          },
          tooltip: "Information about the GitHub repository you got",
          pick: {
            field: "info",
            keys: {
              "owner?.login": "owner_login",
              "owner?.avatar_url": "owner_avatar_url",
              "license?.name": "license_name",
            },
          },
          restrictions: [
            {
              type: "hasParent",
              blockTypes: [
                "github_getRepo",
                "github_forEachRepo",
                "github_searchRepos",
                "github_createRepo",
              ],
              message:
                'This block must be inside a "get GitHub repository" or "for each repository" block.',
            },
          ],
          also: ["github_each_repo", "github_search_repos", "github_create_repo"],
        },
      },
    ],
    setup: [GITHUB],
    code: (ctx) => {
      const found = ctx.local("githubRepo");
      return `{\nconst ${found} = await githubRequest(${repoUrl(ctx.input("repo"))}, null).catch((error) => console.error("GitHub: couldn't find the repository.", error));\nif (${found}) {\n${ctx.branch("code")}}\n}\n`;
    },
  }),
  action({
    id: "github_each_repo",
    label: "Repeat with each GitHub repository of a user",
    description:
      "Runs the steps inside once for each public repository of a user or organization (up to 100, recently updated first).",
    category: "github",
    group: "Repeating",
    icon: "fa-solid fa-book",
    keywords: ["github", "repositories", "for each", "loop"],
    block: {
      type: "github_forEachRepo",
      text: ["for each repository of GitHub user or organization: {username}", "do {code}"],
      parts: { code: { check: "default" } },
      tooltip:
        "Runs the blocks inside once for each public repository (up to 100, recently updated first). Use the repository info block inside",
    },
    inputs: [input.text("username", "Username or organization", { default: "" })],
    branches: [
      {
        key: "code",
        label: "Do",
        inline: true,
        provides: [
          { key: "name", label: "Name", type: "String", code: "githubRepo@@.name" },
          {
            key: "full_name",
            label: "Full name (owner/name)",
            type: "String",
            code: "githubRepo@@.full_name",
          },
          {
            key: "description",
            label: "Description",
            type: "String",
            code: "githubRepo@@.description",
          },
          {
            key: "owner_login",
            label: "Owner's username",
            type: "String",
            code: "githubRepo@@.owner?.login",
          },
          {
            key: "owner_avatar_url",
            label: "Owner's avatar picture link",
            type: "String",
            code: "githubRepo@@.owner?.avatar_url",
          },
          {
            key: "stargazers_count",
            label: "Stars",
            type: "Number",
            code: "githubRepo@@.stargazers_count",
          },
          { key: "forks_count", label: "Forks", type: "Number", code: "githubRepo@@.forks_count" },
          {
            key: "subscribers_count",
            label: "Watchers",
            type: "Number",
            code: "githubRepo@@.subscribers_count",
          },
          {
            key: "open_issues_count",
            label: "Open issues and pull requests",
            type: "Number",
            code: "githubRepo@@.open_issues_count",
          },
          {
            key: "language",
            label: "Main language",
            type: "String",
            code: "githubRepo@@.language",
          },
          { key: "topics", label: "Topics (list)", type: "Array", code: "githubRepo@@.topics" },
          {
            key: "license_name",
            label: "License",
            type: "String",
            code: "githubRepo@@.license?.name",
          },
          {
            key: "default_branch",
            label: "Default branch",
            type: "String",
            code: "githubRepo@@.default_branch",
          },
          { key: "homepage", label: "Website", type: "String", code: "githubRepo@@.homepage" },
          { key: "size", label: "Size (KB)", type: "Number", code: "githubRepo@@.size" },
          { key: "fork", label: "Is a fork?", type: "Boolean", code: "githubRepo@@.fork" },
          {
            key: "archived",
            label: "Is archived?",
            type: "Boolean",
            code: "githubRepo@@.archived",
          },
          {
            key: "is_template",
            label: "Is a template?",
            type: "Boolean",
            code: "githubRepo@@.is_template",
          },
          { key: "id", label: "Repository ID", type: "Number", code: "githubRepo@@.id" },
          {
            key: "created_at",
            label: "Date made",
            type: "String",
            code: "githubRepo@@.created_at",
          },
          {
            key: "updated_at",
            label: "Last updated",
            type: "String",
            code: "githubRepo@@.updated_at",
          },
          {
            key: "pushed_at",
            label: "Last pushed",
            type: "String",
            code: "githubRepo@@.pushed_at",
          },
          {
            key: "html_url",
            label: "Repository link",
            type: "String",
            code: "githubRepo@@.html_url",
          },
          { key: "clone_url", label: "Clone link", type: "String", code: "githubRepo@@.clone_url" },
        ],
        contexts: ["loop"],
      },
    ],
    setup: [GITHUB],
    code: (ctx) =>
      `for (const ${ctx.local("githubRepo")} of (await githubRequest(${userPath(ctx.input("username"))} + "/repos?per_page=100&sort=updated", null).catch((error) => console.error("GitHub: couldn't load the list.", error))) ?? []) {\n${ctx.branch("code")}}\n`,
  }),
  action({
    id: "github_search_repos",
    label: "Repeat with each GitHub repository found",
    description: "Searches GitHub and runs the steps inside for each repository found (up to 30).",
    category: "github",
    group: "Repeating",
    icon: "fa-solid fa-magnifying-glass",
    keywords: ["github", "search", "repositories", "loop"],
    block: {
      type: "github_searchRepos",
      text: [
        "for each GitHub repository matching search: {query}",
        "sorted by {sort}",
        "do {code}",
      ],
      parts: {
        sort: {
          options: [
            ["best match", "best"],
            ["stars", "stars"],
            ["forks", "forks"],
            ["recently updated", "updated"],
          ],
        },
        code: { check: "default" },
      },
      inline: false,
      tooltip:
        "Searches GitHub and runs the blocks inside for each repository found (up to 30). Use the repository info block inside",
    },
    inputs: [
      input.text("query", "Search for", { default: "" }),
      input.dropdown(
        "sort",
        "Sorted by",
        [
          ["Best match", "best"],
          ["Stars", "stars"],
          ["Forks", "forks"],
          ["Recently updated", "updated"],
        ],
        { default: "best" },
      ),
    ],
    branches: [
      {
        key: "code",
        label: "Do",
        inline: true,
        provides: [
          { key: "name", label: "Name", type: "String", code: "githubRepo@@.name" },
          {
            key: "full_name",
            label: "Full name (owner/name)",
            type: "String",
            code: "githubRepo@@.full_name",
          },
          {
            key: "description",
            label: "Description",
            type: "String",
            code: "githubRepo@@.description",
          },
          {
            key: "owner_login",
            label: "Owner's username",
            type: "String",
            code: "githubRepo@@.owner?.login",
          },
          {
            key: "owner_avatar_url",
            label: "Owner's avatar picture link",
            type: "String",
            code: "githubRepo@@.owner?.avatar_url",
          },
          {
            key: "stargazers_count",
            label: "Stars",
            type: "Number",
            code: "githubRepo@@.stargazers_count",
          },
          { key: "forks_count", label: "Forks", type: "Number", code: "githubRepo@@.forks_count" },
          {
            key: "subscribers_count",
            label: "Watchers",
            type: "Number",
            code: "githubRepo@@.subscribers_count",
          },
          {
            key: "open_issues_count",
            label: "Open issues and pull requests",
            type: "Number",
            code: "githubRepo@@.open_issues_count",
          },
          {
            key: "language",
            label: "Main language",
            type: "String",
            code: "githubRepo@@.language",
          },
          { key: "topics", label: "Topics (list)", type: "Array", code: "githubRepo@@.topics" },
          {
            key: "license_name",
            label: "License",
            type: "String",
            code: "githubRepo@@.license?.name",
          },
          {
            key: "default_branch",
            label: "Default branch",
            type: "String",
            code: "githubRepo@@.default_branch",
          },
          { key: "homepage", label: "Website", type: "String", code: "githubRepo@@.homepage" },
          { key: "size", label: "Size (KB)", type: "Number", code: "githubRepo@@.size" },
          { key: "fork", label: "Is a fork?", type: "Boolean", code: "githubRepo@@.fork" },
          {
            key: "archived",
            label: "Is archived?",
            type: "Boolean",
            code: "githubRepo@@.archived",
          },
          {
            key: "is_template",
            label: "Is a template?",
            type: "Boolean",
            code: "githubRepo@@.is_template",
          },
          { key: "id", label: "Repository ID", type: "Number", code: "githubRepo@@.id" },
          {
            key: "created_at",
            label: "Date made",
            type: "String",
            code: "githubRepo@@.created_at",
          },
          {
            key: "updated_at",
            label: "Last updated",
            type: "String",
            code: "githubRepo@@.updated_at",
          },
          {
            key: "pushed_at",
            label: "Last pushed",
            type: "String",
            code: "githubRepo@@.pushed_at",
          },
          {
            key: "html_url",
            label: "Repository link",
            type: "String",
            code: "githubRepo@@.html_url",
          },
          { key: "clone_url", label: "Clone link", type: "String", code: "githubRepo@@.clone_url" },
        ],
        contexts: ["loop"],
      },
    ],
    setup: [GITHUB],
    code: (ctx) =>
      `for (const ${ctx.local("githubRepo")} of (await githubRequest("/search/repositories?q=" + encodeURIComponent(${ctx.input("query")})${ctx.raw("sort") && ctx.raw("sort") !== "best" ? ` + "&sort=${String(ctx.raw("sort")).replace(/\\W/g, "")}"` : ""}, null).catch((error) => console.error("GitHub: couldn't load the list.", error)))?.items ?? []) {\n${ctx.branch("code")}}\n`,
  }),
  action({
    id: "github_issue",
    label: "Look up a GitHub issue",
    description: "Finds an issue (or pull request) by its number.",
    category: "github",
    group: "Looking up",
    icon: "fa-solid fa-circle-dot",
    keywords: ["github", "issue", "bug"],
    block: {
      type: "github_getIssue",
      text: ["get issue # {number}", "in GitHub repository: {repo}", "then {code}"],
      parts: { code: { check: "default" } },
      tooltip: "Looks up an issue (or pull request) by its number, then runs the blocks inside",
    },
    inputs: [
      input.number("number", "Issue number", { default: 1, min: 1, integer: true }),
      input.text("repo", "In repository", { default: "", placeholder: "owner/name" }),
    ],
    branches: [
      {
        key: "code",
        label: "If it's found",
        inline: true,
        provides: [
          { key: "title", label: "Title", type: "String", code: "githubIssue@@.title" },
          { key: "body", label: "Description", type: "String", code: "githubIssue@@.body" },
          { key: "number", label: "Number", type: "Number", code: "githubIssue@@.number" },
          {
            key: "state",
            label: "State (open or closed)",
            type: "String",
            code: "githubIssue@@.state",
          },
          {
            key: "state_reason",
            label: "Why it was closed",
            type: "String",
            code: "githubIssue@@.state_reason",
          },
          {
            key: "user_login",
            label: "Author's username",
            type: "String",
            code: "githubIssue@@.user?.login",
          },
          {
            key: "user_avatar_url",
            label: "Author's avatar picture link",
            type: "String",
            code: "githubIssue@@.user?.avatar_url",
          },
          {
            key: "labels_map_label_label_name",
            label: "Label names (list)",
            type: "Array",
            code: "(githubIssue@@.labels?.map((label) => label.name))",
          },
          {
            key: "assignees_map_assignee_assignee_login",
            label: "Assignee usernames (list)",
            type: "Array",
            code: "(githubIssue@@.assignees?.map((assignee) => assignee.login))",
          },
          {
            key: "milestone_title",
            label: "Milestone",
            type: "String",
            code: "githubIssue@@.milestone?.title",
          },
          {
            key: "comments",
            label: "Number of comments",
            type: "Number",
            code: "githubIssue@@.comments",
          },
          {
            key: "pull_request_null",
            label: "Is a pull request?",
            type: "Boolean",
            code: "(githubIssue@@.pull_request != null)",
          },
          { key: "locked", label: "Is locked?", type: "Boolean", code: "githubIssue@@.locked" },
          {
            key: "created_at",
            label: "Date opened",
            type: "String",
            code: "githubIssue@@.created_at",
          },
          {
            key: "updated_at",
            label: "Last updated",
            type: "String",
            code: "githubIssue@@.updated_at",
          },
          {
            key: "closed_at",
            label: "Date closed",
            type: "String",
            code: "githubIssue@@.closed_at",
          },
          { key: "html_url", label: "Issue link", type: "String", code: "githubIssue@@.html_url" },
        ],
        valuesBlock: {
          type: "github_issueInfo",
          text: "get {info} of GitHub issue",
          parts: {
            info: {
              part: "dropdown",
              options: [
                ["title", "title"],
                ["description", "body"],
                ["number", "number"],
                ["state (open or closed)", "state"],
                ["reason it was closed", "state_reason"],
                ["author username", "user?.login"],
                ["author avatar image URL", "user?.avatar_url"],
                ["label names", "labels?.map(label => label.name)"],
                ["assignee usernames", "assignees?.map(assignee => assignee.login)"],
                ["milestone", "milestone?.title"],
                ["comments count", "comments"],
                ["is a pull request", "pull_request != null"],
                ["is locked", "locked"],
                ["created date", "created_at"],
                ["last updated date", "updated_at"],
                ["closed date", "closed_at"],
                ["issue link", "html_url"],
              ],
            },
          },
          tooltip: "Information about the GitHub issue you got",
          pick: {
            field: "info",
            keys: {
              "user?.login": "user_login",
              "user?.avatar_url": "user_avatar_url",
              "labels?.map(label => label.name)": "labels_map_label_label_name",
              "assignees?.map(assignee => assignee.login)": "assignees_map_assignee_assignee_login",
              "milestone?.title": "milestone_title",
              "pull_request != null": "pull_request_null",
            },
          },
          restrictions: [
            {
              type: "hasParent",
              blockTypes: ["github_getIssue", "github_forEachIssue", "github_createIssue"],
              message: 'This block must be inside a "get issue" or "for each issue" block.',
            },
          ],
          also: ["github_each_issue", "github_create_issue"],
        },
      },
    ],
    setup: [GITHUB],
    code: (ctx) => {
      const found = ctx.local("githubIssue");
      return `{\nconst ${found} = await githubRequest(${repoUrl(ctx.input("repo"))} + "/issues/" + ${ctx.input("number")}, null).catch((error) => console.error("GitHub: couldn't find the issue.", error));\nif (${found}) {\n${ctx.branch("code")}}\n}\n`;
    },
  }),
  action({
    id: "github_each_issue",
    label: "Repeat with each GitHub issue",
    description:
      "Runs the steps inside once for each issue in a repository (up to 100, newest first, pull requests left out).",
    category: "github",
    group: "Repeating",
    icon: "fa-solid fa-circle-dot",
    keywords: ["github", "issues", "for each", "loop"],
    block: {
      type: "github_forEachIssue",
      text: ["for each {state} issue in GitHub repository: {repo}", "do {code}"],
      parts: {
        state: {
          options: [
            ["open", "open"],
            ["closed", "closed"],
            ["open or closed", "all"],
          ],
        },
        code: { check: "default" },
      },
      tooltip:
        "Runs the blocks inside once for each issue (up to 100, newest first, pull requests left out). Use the issue info block inside",
    },
    inputs: [
      input.dropdown(
        "state",
        "Which",
        [
          ["Open", "open"],
          ["Closed", "closed"],
          ["Open or closed", "all"],
        ],
        { default: "open" },
      ),
      input.text("repo", "In repository", { default: "", placeholder: "owner/name" }),
    ],
    branches: [
      {
        key: "code",
        label: "Do",
        inline: true,
        provides: [
          { key: "title", label: "Title", type: "String", code: "githubIssue@@.title" },
          { key: "body", label: "Description", type: "String", code: "githubIssue@@.body" },
          { key: "number", label: "Number", type: "Number", code: "githubIssue@@.number" },
          {
            key: "state",
            label: "State (open or closed)",
            type: "String",
            code: "githubIssue@@.state",
          },
          {
            key: "state_reason",
            label: "Why it was closed",
            type: "String",
            code: "githubIssue@@.state_reason",
          },
          {
            key: "user_login",
            label: "Author's username",
            type: "String",
            code: "githubIssue@@.user?.login",
          },
          {
            key: "user_avatar_url",
            label: "Author's avatar picture link",
            type: "String",
            code: "githubIssue@@.user?.avatar_url",
          },
          {
            key: "labels_map_label_label_name",
            label: "Label names (list)",
            type: "Array",
            code: "(githubIssue@@.labels?.map((label) => label.name))",
          },
          {
            key: "assignees_map_assignee_assignee_login",
            label: "Assignee usernames (list)",
            type: "Array",
            code: "(githubIssue@@.assignees?.map((assignee) => assignee.login))",
          },
          {
            key: "milestone_title",
            label: "Milestone",
            type: "String",
            code: "githubIssue@@.milestone?.title",
          },
          {
            key: "comments",
            label: "Number of comments",
            type: "Number",
            code: "githubIssue@@.comments",
          },
          {
            key: "pull_request_null",
            label: "Is a pull request?",
            type: "Boolean",
            code: "(githubIssue@@.pull_request != null)",
          },
          { key: "locked", label: "Is locked?", type: "Boolean", code: "githubIssue@@.locked" },
          {
            key: "created_at",
            label: "Date opened",
            type: "String",
            code: "githubIssue@@.created_at",
          },
          {
            key: "updated_at",
            label: "Last updated",
            type: "String",
            code: "githubIssue@@.updated_at",
          },
          {
            key: "closed_at",
            label: "Date closed",
            type: "String",
            code: "githubIssue@@.closed_at",
          },
          { key: "html_url", label: "Issue link", type: "String", code: "githubIssue@@.html_url" },
        ],
        contexts: ["loop"],
      },
    ],
    setup: [GITHUB],
    code: (ctx) =>
      `for (const ${ctx.local("githubIssue")} of (await githubRequest(${repoUrl(ctx.input("repo"))} + "/issues?per_page=100&state=" + ${ctx.input("state")}, null).catch((error) => console.error("GitHub: couldn't load the list.", error)))?.filter((issue) => !issue.pull_request) ?? []) {\n${ctx.branch("code")}}\n`,
  }),
  action({
    id: "github_pull_request",
    label: "Look up a GitHub pull request",
    description: "Finds a pull request by its number.",
    category: "github",
    group: "Looking up",
    icon: "fa-solid fa-code-pull-request",
    keywords: ["github", "pull request", "pr"],
    block: {
      type: "github_getPullRequest",
      text: ["get pull request # {number}", "in GitHub repository: {repo}", "then {code}"],
      parts: { code: { check: "default" } },
      tooltip: "Looks up a pull request by its number, then runs the blocks inside",
    },
    inputs: [
      input.number("number", "Pull request number", { default: 1, min: 1, integer: true }),
      input.text("repo", "In repository", { default: "", placeholder: "owner/name" }),
    ],
    branches: [
      {
        key: "code",
        label: "If it's found",
        inline: true,
        provides: [
          { key: "title", label: "Title", type: "String", code: "githubPullRequest@@.title" },
          { key: "body", label: "Description", type: "String", code: "githubPullRequest@@.body" },
          { key: "number", label: "Number", type: "Number", code: "githubPullRequest@@.number" },
          {
            key: "state",
            label: "State (open or closed)",
            type: "String",
            code: "githubPullRequest@@.state",
          },
          {
            key: "merged_at_null",
            label: "Is merged?",
            type: "Boolean",
            code: "(githubPullRequest@@.merged_at != null)",
          },
          {
            key: "draft",
            label: "Is a draft?",
            type: "Boolean",
            code: "githubPullRequest@@.draft",
          },
          {
            key: "user_login",
            label: "Author's username",
            type: "String",
            code: "githubPullRequest@@.user?.login",
          },
          {
            key: "user_avatar_url",
            label: "Author's avatar picture link",
            type: "String",
            code: "githubPullRequest@@.user?.avatar_url",
          },
          {
            key: "head_ref",
            label: "From branch",
            type: "String",
            code: "githubPullRequest@@.head?.ref",
          },
          {
            key: "base_ref",
            label: "Into branch",
            type: "String",
            code: "githubPullRequest@@.base?.ref",
          },
          {
            key: "labels_map_label_label_name",
            label: "Label names (list)",
            type: "Array",
            code: "(githubPullRequest@@.labels?.map((label) => label.name))",
          },
          {
            key: "requested_reviewers_map_reviewer_reviewe",
            label: "Requested reviewers (list)",
            type: "Array",
            code: "(githubPullRequest@@.requested_reviewers?.map((reviewer) => reviewer.login))",
          },
          {
            key: "commits",
            label: "Number of commits",
            type: "Number",
            code: "githubPullRequest@@.commits",
          },
          {
            key: "additions",
            label: "Lines added",
            type: "Number",
            code: "githubPullRequest@@.additions",
          },
          {
            key: "deletions",
            label: "Lines removed",
            type: "Number",
            code: "githubPullRequest@@.deletions",
          },
          {
            key: "changed_files",
            label: "Number of changed files",
            type: "Number",
            code: "githubPullRequest@@.changed_files",
          },
          {
            key: "created_at",
            label: "Date opened",
            type: "String",
            code: "githubPullRequest@@.created_at",
          },
          {
            key: "merged_at",
            label: "Date merged",
            type: "String",
            code: "githubPullRequest@@.merged_at",
          },
          {
            key: "closed_at",
            label: "Date closed",
            type: "String",
            code: "githubPullRequest@@.closed_at",
          },
          {
            key: "html_url",
            label: "Pull request link",
            type: "String",
            code: "githubPullRequest@@.html_url",
          },
        ],
        valuesBlock: {
          type: "github_pullRequestInfo",
          text: "get {info} of GitHub pull request",
          parts: {
            info: {
              part: "dropdown",
              options: [
                ["title", "title"],
                ["description", "body"],
                ["number", "number"],
                ["state (open or closed)", "state"],
                ["is merged", "merged_at != null"],
                ["is a draft", "draft"],
                ["author username", "user?.login"],
                ["author avatar image URL", "user?.avatar_url"],
                ["from branch", "head?.ref"],
                ["into branch", "base?.ref"],
                ["label names", "labels?.map(label => label.name)"],
                [
                  "requested reviewer usernames",
                  "requested_reviewers?.map(reviewer => reviewer.login)",
                ],
                ["commits count", "commits"],
                ["lines added", "additions"],
                ["lines removed", "deletions"],
                ["changed files count", "changed_files"],
                ["created date", "created_at"],
                ["merged date", "merged_at"],
                ["closed date", "closed_at"],
                ["pull request link", "html_url"],
              ],
            },
          },
          tooltip: "Information about the GitHub pull request you got",
          pick: {
            field: "info",
            keys: {
              "merged_at != null": "merged_at_null",
              "user?.login": "user_login",
              "user?.avatar_url": "user_avatar_url",
              "head?.ref": "head_ref",
              "base?.ref": "base_ref",
              "labels?.map(label => label.name)": "labels_map_label_label_name",
              "requested_reviewers?.map(reviewer => reviewer.login)":
                "requested_reviewers_map_reviewer_reviewe",
            },
          },
          restrictions: [
            {
              type: "hasParent",
              blockTypes: ["github_getPullRequest", "github_forEachPullRequest"],
              message:
                'This block must be inside a "get pull request" or "for each pull request" block.',
            },
          ],
          also: ["github_each_pull_request"],
        },
      },
    ],
    setup: [GITHUB],
    code: (ctx) => {
      const found = ctx.local("githubPullRequest");
      return `{\nconst ${found} = await githubRequest(${repoUrl(ctx.input("repo"))} + "/pulls/" + ${ctx.input("number")}, null).catch((error) => console.error("GitHub: couldn't find the pull request.", error));\nif (${found}) {\n${ctx.branch("code")}}\n}\n`;
    },
  }),
  action({
    id: "github_each_pull_request",
    label: "Repeat with each GitHub pull request",
    description:
      "Runs the steps inside once for each pull request in a repository (up to 100, newest first).",
    category: "github",
    group: "Repeating",
    icon: "fa-solid fa-code-pull-request",
    keywords: ["github", "pull requests", "for each", "loop"],
    block: {
      type: "github_forEachPullRequest",
      text: ["for each {state} pull request in GitHub repository: {repo}", "do {code}"],
      parts: {
        state: {
          options: [
            ["open", "open"],
            ["closed", "closed"],
            ["open or closed", "all"],
          ],
        },
        code: { check: "default" },
      },
      tooltip:
        "Runs the blocks inside once for each pull request (up to 100, newest first). Use the pull request info block inside",
    },
    inputs: [
      input.dropdown(
        "state",
        "Which",
        [
          ["Open", "open"],
          ["Closed", "closed"],
          ["Open or closed", "all"],
        ],
        { default: "open" },
      ),
      input.text("repo", "In repository", { default: "", placeholder: "owner/name" }),
    ],
    branches: [
      {
        key: "code",
        label: "Do",
        inline: true,
        provides: [
          { key: "title", label: "Title", type: "String", code: "githubPullRequest@@.title" },
          { key: "body", label: "Description", type: "String", code: "githubPullRequest@@.body" },
          { key: "number", label: "Number", type: "Number", code: "githubPullRequest@@.number" },
          {
            key: "state",
            label: "State (open or closed)",
            type: "String",
            code: "githubPullRequest@@.state",
          },
          {
            key: "merged_at_null",
            label: "Is merged?",
            type: "Boolean",
            code: "(githubPullRequest@@.merged_at != null)",
          },
          {
            key: "draft",
            label: "Is a draft?",
            type: "Boolean",
            code: "githubPullRequest@@.draft",
          },
          {
            key: "user_login",
            label: "Author's username",
            type: "String",
            code: "githubPullRequest@@.user?.login",
          },
          {
            key: "user_avatar_url",
            label: "Author's avatar picture link",
            type: "String",
            code: "githubPullRequest@@.user?.avatar_url",
          },
          {
            key: "head_ref",
            label: "From branch",
            type: "String",
            code: "githubPullRequest@@.head?.ref",
          },
          {
            key: "base_ref",
            label: "Into branch",
            type: "String",
            code: "githubPullRequest@@.base?.ref",
          },
          {
            key: "labels_map_label_label_name",
            label: "Label names (list)",
            type: "Array",
            code: "(githubPullRequest@@.labels?.map((label) => label.name))",
          },
          {
            key: "requested_reviewers_map_reviewer_reviewe",
            label: "Requested reviewers (list)",
            type: "Array",
            code: "(githubPullRequest@@.requested_reviewers?.map((reviewer) => reviewer.login))",
          },
          {
            key: "commits",
            label: "Number of commits",
            type: "Number",
            code: "githubPullRequest@@.commits",
          },
          {
            key: "additions",
            label: "Lines added",
            type: "Number",
            code: "githubPullRequest@@.additions",
          },
          {
            key: "deletions",
            label: "Lines removed",
            type: "Number",
            code: "githubPullRequest@@.deletions",
          },
          {
            key: "changed_files",
            label: "Number of changed files",
            type: "Number",
            code: "githubPullRequest@@.changed_files",
          },
          {
            key: "created_at",
            label: "Date opened",
            type: "String",
            code: "githubPullRequest@@.created_at",
          },
          {
            key: "merged_at",
            label: "Date merged",
            type: "String",
            code: "githubPullRequest@@.merged_at",
          },
          {
            key: "closed_at",
            label: "Date closed",
            type: "String",
            code: "githubPullRequest@@.closed_at",
          },
          {
            key: "html_url",
            label: "Pull request link",
            type: "String",
            code: "githubPullRequest@@.html_url",
          },
        ],
        contexts: ["loop"],
      },
    ],
    setup: [GITHUB],
    code: (ctx) =>
      `for (const ${ctx.local("githubPullRequest")} of (await githubRequest(${repoUrl(ctx.input("repo"))} + "/pulls?per_page=100&state=" + ${ctx.input("state")}, null).catch((error) => console.error("GitHub: couldn't load the list.", error))) ?? []) {\n${ctx.branch("code")}}\n`,
  }),
  action({
    id: "github_commit",
    label: "Look up a GitHub commit",
    description: "Finds the latest commit on a branch, or a commit by its SHA.",
    category: "github",
    group: "Looking up",
    icon: "fa-solid fa-code-commit",
    keywords: ["github", "commit", "latest commit"],
    block: {
      type: "github_getCommit",
      text: [
        "get latest commit in GitHub repository: {repo}",
        "on branch (or commit SHA): {branch}",
        "then {code}",
      ],
      parts: { code: { check: "default" } },
      tooltip:
        'Looks up the latest commit on a branch, or a specific commit by its SHA. Leave the branch as "HEAD" for the default branch',
    },
    inputs: [
      input.text("repo", "Repository", { default: "", placeholder: "owner/name" }),
      input.text("branch", "Branch or commit SHA", {
        default: "HEAD",
        help: "HEAD means the default branch.",
      }),
    ],
    branches: [
      {
        key: "code",
        label: "If it's found",
        inline: true,
        provides: [
          {
            key: "commit_message",
            label: "Message",
            type: "String",
            code: "githubCommit@@.commit?.message",
          },
          {
            key: "commit_message_split_n_0",
            label: "Title (first line of the message)",
            type: "String",
            code: '(githubCommit@@.commit?.message?.split("\\n")[0])',
          },
          { key: "sha", label: "SHA", type: "String", code: "githubCommit@@.sha" },
          {
            key: "sha_slice_0_7",
            label: "Short SHA",
            type: "String",
            code: "(githubCommit@@.sha?.slice(0, 7))",
          },
          {
            key: "commit_author_name",
            label: "Author's name",
            type: "String",
            code: "githubCommit@@.commit?.author?.name",
          },
          {
            key: "author_login",
            label: "Author's username",
            type: "String",
            code: "githubCommit@@.author?.login",
          },
          {
            key: "author_avatar_url",
            label: "Author's avatar picture link",
            type: "String",
            code: "githubCommit@@.author?.avatar_url",
          },
          {
            key: "commit_author_date",
            label: "Date",
            type: "String",
            code: "githubCommit@@.commit?.author?.date",
          },
          {
            key: "html_url",
            label: "Commit link",
            type: "String",
            code: "githubCommit@@.html_url",
          },
        ],
        valuesBlock: {
          type: "github_commitInfo",
          text: "get {info} of GitHub commit",
          parts: {
            info: {
              part: "dropdown",
              options: [
                ["message", "commit?.message"],
                ["title (first line of message)", "commit?.message?.split('\\n')[0]"],
                ["SHA", "sha"],
                ["short SHA", "sha?.slice(0, 7)"],
                ["author name", "commit?.author?.name"],
                ["author username", "author?.login"],
                ["author avatar image URL", "author?.avatar_url"],
                ["date", "commit?.author?.date"],
                ["commit link", "html_url"],
              ],
            },
          },
          tooltip: "Information about the GitHub commit you got",
          pick: {
            field: "info",
            keys: {
              "commit?.message": "commit_message",
              "commit?.message?.split('\\n')[0]": "commit_message_split_n_0",
              "sha?.slice(0, 7)": "sha_slice_0_7",
              "commit?.author?.name": "commit_author_name",
              "author?.login": "author_login",
              "author?.avatar_url": "author_avatar_url",
              "commit?.author?.date": "commit_author_date",
            },
          },
          restrictions: [
            {
              type: "hasParent",
              blockTypes: ["github_getCommit", "github_forEachCommit"],
              message:
                'This block must be inside a "get latest commit" or "for each commit" block.',
            },
          ],
          also: ["github_each_commit"],
        },
      },
    ],
    setup: [GITHUB],
    code: (ctx) => {
      const found = ctx.local("githubCommit");
      return `{\nconst ${found} = await githubRequest(${repoUrl(ctx.input("repo"))} + "/commits/" + encodeURIComponent(${ctx.input("branch")} || "HEAD"), null).catch((error) => console.error("GitHub: couldn't find the commit.", error));\nif (${found}) {\n${ctx.branch("code")}}\n}\n`;
    },
  }),
  action({
    id: "github_each_commit",
    label: "Repeat with each recent GitHub commit",
    description: "Runs the steps inside once for each recent commit on the default branch.",
    category: "github",
    group: "Repeating",
    icon: "fa-solid fa-code-commit",
    keywords: ["github", "commits", "for each", "loop"],
    block: {
      type: "github_forEachCommit",
      text: ["for each of the latest {count}", "commits in GitHub repository: {repo}", "do {code}"],
      parts: { code: { check: "default" } },
      tooltip:
        "Runs the blocks inside once for each recent commit on the default branch (up to 100). Use the commit info block inside",
    },
    inputs: [
      input.number("count", "How many", { default: 10, min: 1, max: 100, integer: true }),
      input.text("repo", "In repository", { default: "", placeholder: "owner/name" }),
    ],
    branches: [
      {
        key: "code",
        label: "Do",
        inline: true,
        provides: [
          {
            key: "commit_message",
            label: "Message",
            type: "String",
            code: "githubCommit@@.commit?.message",
          },
          {
            key: "commit_message_split_n_0",
            label: "Title (first line of the message)",
            type: "String",
            code: '(githubCommit@@.commit?.message?.split("\\n")[0])',
          },
          { key: "sha", label: "SHA", type: "String", code: "githubCommit@@.sha" },
          {
            key: "sha_slice_0_7",
            label: "Short SHA",
            type: "String",
            code: "(githubCommit@@.sha?.slice(0, 7))",
          },
          {
            key: "commit_author_name",
            label: "Author's name",
            type: "String",
            code: "githubCommit@@.commit?.author?.name",
          },
          {
            key: "author_login",
            label: "Author's username",
            type: "String",
            code: "githubCommit@@.author?.login",
          },
          {
            key: "author_avatar_url",
            label: "Author's avatar picture link",
            type: "String",
            code: "githubCommit@@.author?.avatar_url",
          },
          {
            key: "commit_author_date",
            label: "Date",
            type: "String",
            code: "githubCommit@@.commit?.author?.date",
          },
          {
            key: "html_url",
            label: "Commit link",
            type: "String",
            code: "githubCommit@@.html_url",
          },
        ],
        contexts: ["loop"],
      },
    ],
    setup: [GITHUB],
    code: (ctx) =>
      `for (const ${ctx.local("githubCommit")} of (await githubRequest(${repoUrl(ctx.input("repo"))} + "/commits?per_page=" + Math.min(Math.max(Number(${ctx.input("count")}) || 10, 1), 100), null).catch((error) => console.error("GitHub: couldn't load the list.", error))) ?? []) {\n${ctx.branch("code")}}\n`,
  }),
  action({
    id: "github_release",
    label: "Look up the latest GitHub release",
    description: "Finds the newest published release of a repository.",
    category: "github",
    group: "Looking up",
    icon: "fa-solid fa-tag",
    keywords: ["github", "release", "version", "latest"],
    block: {
      type: "github_getRelease",
      text: ["get latest release of GitHub repository: {repo}", "then {code}"],
      parts: { code: { check: "default" } },
      tooltip: "Looks up the newest published release of a repository, then runs the blocks inside",
    },
    inputs: [input.text("repo", "Repository", { default: "", placeholder: "owner/name" })],
    branches: [
      {
        key: "code",
        label: "If it's found",
        inline: true,
        provides: [
          { key: "name", label: "Name", type: "String", code: "githubRelease@@.name" },
          { key: "tag_name", label: "Tag", type: "String", code: "githubRelease@@.tag_name" },
          { key: "body", label: "Description", type: "String", code: "githubRelease@@.body" },
          {
            key: "author_login",
            label: "Author's username",
            type: "String",
            code: "githubRelease@@.author?.login",
          },
          {
            key: "prerelease",
            label: "Is a pre-release?",
            type: "Boolean",
            code: "githubRelease@@.prerelease",
          },
          { key: "draft", label: "Is a draft?", type: "Boolean", code: "githubRelease@@.draft" },
          {
            key: "published_at",
            label: "Date published",
            type: "String",
            code: "githubRelease@@.published_at",
          },
          {
            key: "assets_map_asset_asset_name",
            label: "Download file names (list)",
            type: "Array",
            code: "(githubRelease@@.assets?.map((asset) => asset.name))",
          },
          {
            key: "assets_map_asset_asset_browser_download_",
            label: "Download links (list)",
            type: "Array",
            code: "(githubRelease@@.assets?.map((asset) => asset.browser_download_url))",
          },
          {
            key: "assets_reduce_total_asset_total_asset_do",
            label: "Total downloads",
            type: "Number",
            code: "(githubRelease@@.assets?.reduce((total, asset) => total + asset.download_count, 0))",
          },
          {
            key: "zipball_url",
            label: "Source code .zip link",
            type: "String",
            code: "githubRelease@@.zipball_url",
          },
          {
            key: "html_url",
            label: "Release link",
            type: "String",
            code: "githubRelease@@.html_url",
          },
        ],
        valuesBlock: {
          type: "github_releaseInfo",
          text: "get {info} of GitHub release",
          parts: {
            info: {
              part: "dropdown",
              options: [
                ["name", "name"],
                ["tag", "tag_name"],
                ["description", "body"],
                ["author username", "author?.login"],
                ["is a pre-release", "prerelease"],
                ["is a draft", "draft"],
                ["published date", "published_at"],
                ["download file names", "assets?.map(asset => asset.name)"],
                ["download links", "assets?.map(asset => asset.browser_download_url)"],
                [
                  "total downloads",
                  "assets?.reduce((total, asset) => total + asset.download_count, 0)",
                ],
                ["source code .zip link", "zipball_url"],
                ["release link", "html_url"],
              ],
            },
          },
          tooltip: "Information about the GitHub release you got",
          pick: {
            field: "info",
            keys: {
              "author?.login": "author_login",
              "assets?.map(asset => asset.name)": "assets_map_asset_asset_name",
              "assets?.map(asset => asset.browser_download_url)":
                "assets_map_asset_asset_browser_download_",
              "assets?.reduce((total, asset) => total + asset.download_count, 0)":
                "assets_reduce_total_asset_total_asset_do",
            },
          },
          restrictions: [
            {
              type: "hasParent",
              blockTypes: ["github_getRelease", "github_forEachRelease", "github_createRelease"],
              message:
                'This block must be inside a "get latest release" or "for each release" block.',
            },
          ],
          also: ["github_each_release", "github_create_release"],
        },
      },
    ],
    setup: [GITHUB],
    code: (ctx) => {
      const found = ctx.local("githubRelease");
      return `{\nconst ${found} = await githubRequest(${repoUrl(ctx.input("repo"))} + "/releases/latest", null).catch((error) => console.error("GitHub: couldn't find the release.", error));\nif (${found}) {\n${ctx.branch("code")}}\n}\n`;
    },
  }),
  action({
    id: "github_each_release",
    label: "Repeat with each GitHub release",
    description:
      "Runs the steps inside once for each release of a repository (up to 100, newest first).",
    category: "github",
    group: "Repeating",
    icon: "fa-solid fa-tags",
    keywords: ["github", "releases", "for each", "loop"],
    block: {
      type: "github_forEachRelease",
      text: ["for each release of GitHub repository: {repo}", "do {code}"],
      parts: { code: { check: "default" } },
      tooltip:
        "Runs the blocks inside once for each release (up to 100, newest first). Use the release info block inside",
    },
    inputs: [input.text("repo", "Repository", { default: "", placeholder: "owner/name" })],
    branches: [
      {
        key: "code",
        label: "Do",
        inline: true,
        provides: [
          { key: "name", label: "Name", type: "String", code: "githubRelease@@.name" },
          { key: "tag_name", label: "Tag", type: "String", code: "githubRelease@@.tag_name" },
          { key: "body", label: "Description", type: "String", code: "githubRelease@@.body" },
          {
            key: "author_login",
            label: "Author's username",
            type: "String",
            code: "githubRelease@@.author?.login",
          },
          {
            key: "prerelease",
            label: "Is a pre-release?",
            type: "Boolean",
            code: "githubRelease@@.prerelease",
          },
          { key: "draft", label: "Is a draft?", type: "Boolean", code: "githubRelease@@.draft" },
          {
            key: "published_at",
            label: "Date published",
            type: "String",
            code: "githubRelease@@.published_at",
          },
          {
            key: "assets_map_asset_asset_name",
            label: "Download file names (list)",
            type: "Array",
            code: "(githubRelease@@.assets?.map((asset) => asset.name))",
          },
          {
            key: "assets_map_asset_asset_browser_download_",
            label: "Download links (list)",
            type: "Array",
            code: "(githubRelease@@.assets?.map((asset) => asset.browser_download_url))",
          },
          {
            key: "assets_reduce_total_asset_total_asset_do",
            label: "Total downloads",
            type: "Number",
            code: "(githubRelease@@.assets?.reduce((total, asset) => total + asset.download_count, 0))",
          },
          {
            key: "zipball_url",
            label: "Source code .zip link",
            type: "String",
            code: "githubRelease@@.zipball_url",
          },
          {
            key: "html_url",
            label: "Release link",
            type: "String",
            code: "githubRelease@@.html_url",
          },
        ],
        contexts: ["loop"],
      },
    ],
    setup: [GITHUB],
    code: (ctx) =>
      `for (const ${ctx.local("githubRelease")} of (await githubRequest(${repoUrl(ctx.input("repo"))} + "/releases?per_page=100", null).catch((error) => console.error("GitHub: couldn't load the list.", error))) ?? []) {\n${ctx.branch("code")}}\n`,
  }),
  action({
    id: "github_gist",
    label: "Look up a GitHub gist",
    description: "Finds a gist by the ID at the end of its link.",
    category: "github",
    group: "Looking up",
    icon: "fa-solid fa-note-sticky",
    keywords: ["github", "gist", "snippet"],
    block: {
      type: "github_getGist",
      text: ["get GitHub gist with ID: {id}", "then {code}"],
      parts: { code: { check: "default" } },
      tooltip: "Looks up a gist by the ID at the end of its link, then runs the blocks inside",
    },
    inputs: [input.text("id", "Gist ID or link", { default: "" })],
    branches: [
      {
        key: "code",
        label: "If it's found",
        inline: true,
        provides: [
          {
            key: "description",
            label: "Description",
            type: "String",
            code: "githubGist@@.description",
          },
          {
            key: "owner_login",
            label: "Owner's username",
            type: "String",
            code: "githubGist@@.owner?.login",
          },
          {
            key: "Object_keys_files",
            label: "File names (list)",
            type: "Array",
            code: "(Object.keys(githubGist@@.files ?? {}))",
          },
          {
            key: "Object_values_files_0_content",
            label: "Contents of the first file",
            type: "String",
            code: "(Object.values(githubGist@@.files ?? {})[0]?.content)",
          },
          { key: "public", label: "Is public?", type: "Boolean", code: "githubGist@@.public" },
          {
            key: "comments",
            label: "Number of comments",
            type: "Number",
            code: "githubGist@@.comments",
          },
          {
            key: "created_at",
            label: "Date made",
            type: "String",
            code: "githubGist@@.created_at",
          },
          {
            key: "updated_at",
            label: "Last updated",
            type: "String",
            code: "githubGist@@.updated_at",
          },
          { key: "html_url", label: "Gist link", type: "String", code: "githubGist@@.html_url" },
        ],
        valuesBlock: {
          type: "github_gistInfo",
          text: "get {info} of GitHub gist",
          parts: {
            info: {
              part: "dropdown",
              options: [
                ["description", "description"],
                ["owner username", "owner?.login"],
                ["file names", "Object.keys($.files ?? {})"],
                ["content of first file", "Object.values($.files ?? {})[0]?.content"],
                ["is public", "public"],
                ["comments count", "comments"],
                ["created date", "created_at"],
                ["last updated date", "updated_at"],
                ["gist link", "html_url"],
              ],
            },
          },
          tooltip: "Information about the GitHub gist you got",
          pick: {
            field: "info",
            keys: {
              "owner?.login": "owner_login",
              "Object.keys($.files ?? {})": "Object_keys_files",
              "Object.values($.files ?? {})[0]?.content": "Object_values_files_0_content",
            },
          },
          restrictions: [
            {
              type: "hasParent",
              blockTypes: ["github_getGist"],
              message: 'This block must be inside a "get GitHub gist" block.',
            },
          ],
        },
      },
    ],
    setup: [GITHUB],
    code: (ctx) => {
      const found = ctx.local("githubGist");
      return `{\nconst ${found} = await githubRequest("/gists/" + encodeURIComponent(String(${ctx.input("id")}).split("/").pop()), null).catch((error) => console.error("GitHub: couldn't find the gist.", error));\nif (${found}) {\n${ctx.branch("code")}}\n}\n`;
    },
  }),
  action({
    id: "github_token_account",
    label: "Look up the account of a GitHub token",
    description: "Finds the GitHub account a token belongs to.",
    category: "github",
    group: "Looking up",
    icon: "fa-solid fa-id-badge",
    keywords: ["github", "token", "account", "me"],
    block: {
      type: "github_getTokenUser",
      text: ["get GitHub account", "with token: {token}", "then {code}"],
      parts: { code: { check: "default" } },
      tooltip:
        "Looks up the GitHub account a token belongs to, then runs the blocks inside. Use the user info block inside",
    },
    inputs: [
      input.text("token", "GitHub token", {
        default: "",
        help: "A GitHub personal access token for the account that does this. Put it in a secret and use that here, so it isn't saved in your steps.",
      }),
    ],
    branches: [
      {
        key: "code",
        label: "If it's found",
        inline: true,
        provides: [
          { key: "login", label: "Username", type: "String", code: "githubUser@@.login" },
          { key: "name", label: "Display name", type: "String", code: "githubUser@@.name" },
          { key: "bio", label: "Bio", type: "String", code: "githubUser@@.bio" },
          { key: "id", label: "User ID", type: "Number", code: "githubUser@@.id" },
          {
            key: "type",
            label: "Account type (User or Organization)",
            type: "String",
            code: "githubUser@@.type",
          },
          { key: "company", label: "Company", type: "String", code: "githubUser@@.company" },
          { key: "location", label: "Location", type: "String", code: "githubUser@@.location" },
          { key: "blog", label: "Website", type: "String", code: "githubUser@@.blog" },
          { key: "email", label: "Public email", type: "String", code: "githubUser@@.email" },
          {
            key: "twitter_username",
            label: "X (Twitter) username",
            type: "String",
            code: "githubUser@@.twitter_username",
          },
          {
            key: "hireable",
            label: "Available for hire?",
            type: "Boolean",
            code: "githubUser@@.hireable",
          },
          {
            key: "public_repos",
            label: "Number of public repositories",
            type: "Number",
            code: "githubUser@@.public_repos",
          },
          {
            key: "public_gists",
            label: "Number of public gists",
            type: "Number",
            code: "githubUser@@.public_gists",
          },
          {
            key: "followers",
            label: "Number of followers",
            type: "Number",
            code: "githubUser@@.followers",
          },
          {
            key: "following",
            label: "Number following",
            type: "Number",
            code: "githubUser@@.following",
          },
          {
            key: "created_at",
            label: "Join date",
            type: "String",
            code: "githubUser@@.created_at",
          },
          {
            key: "updated_at",
            label: "Last updated",
            type: "String",
            code: "githubUser@@.updated_at",
          },
          {
            key: "avatar_url",
            label: "Avatar picture link",
            type: "String",
            code: "githubUser@@.avatar_url",
          },
          { key: "html_url", label: "Profile link", type: "String", code: "githubUser@@.html_url" },
        ],
      },
    ],
    setup: [GITHUB],
    code: (ctx) => {
      const found = ctx.local("githubUser");
      return `{\nconst ${found} = await githubRequest("/user", ${ctx.has("token") ? ctx.input("token") : "null"}).catch((error) => console.error("GitHub: couldn't find the account.", error));\nif (${found}) {\n${ctx.branch("code")}}\n}\n`;
    },
  }),
  action({
    id: "github_create_issue",
    label: "Open a GitHub issue",
    description: "Opens a new issue in a repository.",
    category: "github",
    group: "Changing",
    icon: "fa-solid fa-circle-plus",
    keywords: ["github", "issue", "create", "report", "bug"],
    block: {
      type: "github_createIssue",
      text: [
        "create issue in GitHub repository: {repo}",
        "title: {title}",
        "description: {body}",
        "labels (optional): {labels}",
        "with token: {token}",
        "then {code}",
      ],
      parts: { labels: { check: ["String", "Array"] }, code: { check: "default" } },
      tooltip:
        "Opens a new issue, then runs the blocks inside. Use the issue info block inside to get its number or link",
    },
    inputs: [
      input.text("repo", "In repository", { default: "", placeholder: "owner/name" }),
      input.text("title", "Title", { default: "" }),
      input.text("body", "Description", { default: "", multiline: true }),
      input.text("labels", "Labels (optional)", {
        default: "",
        accepts: ["String", "Array"],
        help: "Split them with commas, like bug, help wanted.",
      }),
      input.text("token", "GitHub token", {
        default: "",
        help: "A GitHub personal access token for the account that does this. Put it in a secret and use that here, so it isn't saved in your steps.",
      }),
    ],
    branches: [
      {
        key: "code",
        label: "After it's opened",
        inline: true,
        provides: [
          { key: "title", label: "Title", type: "String", code: "githubIssue@@.title" },
          { key: "body", label: "Description", type: "String", code: "githubIssue@@.body" },
          { key: "number", label: "Number", type: "Number", code: "githubIssue@@.number" },
          {
            key: "state",
            label: "State (open or closed)",
            type: "String",
            code: "githubIssue@@.state",
          },
          {
            key: "state_reason",
            label: "Why it was closed",
            type: "String",
            code: "githubIssue@@.state_reason",
          },
          {
            key: "user_login",
            label: "Author's username",
            type: "String",
            code: "githubIssue@@.user?.login",
          },
          {
            key: "user_avatar_url",
            label: "Author's avatar picture link",
            type: "String",
            code: "githubIssue@@.user?.avatar_url",
          },
          {
            key: "labels_map_label_label_name",
            label: "Label names (list)",
            type: "Array",
            code: "(githubIssue@@.labels?.map((label) => label.name))",
          },
          {
            key: "assignees_map_assignee_assignee_login",
            label: "Assignee usernames (list)",
            type: "Array",
            code: "(githubIssue@@.assignees?.map((assignee) => assignee.login))",
          },
          {
            key: "milestone_title",
            label: "Milestone",
            type: "String",
            code: "githubIssue@@.milestone?.title",
          },
          {
            key: "comments",
            label: "Number of comments",
            type: "Number",
            code: "githubIssue@@.comments",
          },
          {
            key: "pull_request_null",
            label: "Is a pull request?",
            type: "Boolean",
            code: "(githubIssue@@.pull_request != null)",
          },
          { key: "locked", label: "Is locked?", type: "Boolean", code: "githubIssue@@.locked" },
          {
            key: "created_at",
            label: "Date opened",
            type: "String",
            code: "githubIssue@@.created_at",
          },
          {
            key: "updated_at",
            label: "Last updated",
            type: "String",
            code: "githubIssue@@.updated_at",
          },
          {
            key: "closed_at",
            label: "Date closed",
            type: "String",
            code: "githubIssue@@.closed_at",
          },
          { key: "html_url", label: "Issue link", type: "String", code: "githubIssue@@.html_url" },
        ],
      },
    ],
    setup: [GITHUB],
    code: (ctx) => {
      const found = ctx.local("githubIssue");
      return `{\nconst ${found} = await githubRequest(${repoUrl(ctx.input("repo"))} + "/issues", ${ctx.has("token") ? ctx.input("token") : "null"}, { method: "POST", body: { title: String(${ctx.input("title")}), body: String(${ctx.input("body")}), labels: githubToList(${ctx.input("labels")}) } }).catch((error) => console.error("GitHub: couldn't open the issue.", error));\nif (${found}) {\n${ctx.branch("code")}}\n}\n`;
    },
  }),
  action({
    id: "github_comment",
    label: "Comment on a GitHub issue",
    description: "Posts a comment on an issue or pull request.",
    category: "github",
    group: "Changing",
    icon: "fa-solid fa-comment",
    keywords: ["github", "comment", "reply"],
    block: {
      type: "github_comment",
      text: [
        "comment {comment}",
        "on issue or pull request # {number}",
        "in GitHub repository: {repo}",
        "with token: {token}",
      ],
      tooltip: "Posts a comment on an issue or pull request",
    },
    inputs: [
      input.text("comment", "Comment", { default: "", multiline: true }),
      input.number("number", "On issue or pull request number", {
        default: 1,
        min: 1,
        integer: true,
      }),
      input.text("repo", "In repository", { default: "", placeholder: "owner/name" }),
      input.text("token", "GitHub token", {
        default: "",
        help: "A GitHub personal access token for the account that does this. Put it in a secret and use that here, so it isn't saved in your steps.",
      }),
    ],
    setup: [GITHUB],
    code: (ctx) =>
      `await githubRequest(${repoUrl(ctx.input("repo"))} + "/issues/" + ${ctx.input("number")} + "/comments", ${ctx.has("token") ? ctx.input("token") : "null"}, { method: "POST", body: { body: String(${ctx.input("comment")}) } }).catch((error) => console.error("GitHub: couldn't comment.", error));\n`,
  }),
  action({
    id: "github_issue_state",
    label: "Close or reopen a GitHub issue",
    description: "Closes or reopens an issue or pull request.",
    category: "github",
    group: "Changing",
    icon: "fa-solid fa-circle-check",
    keywords: ["github", "close issue", "reopen"],
    block: {
      type: "github_setIssueState",
      text: [
        "{state} issue or pull request # {number}",
        "in GitHub repository: {repo}",
        "with token: {token}",
      ],
      parts: {
        state: {
          options: [
            ["close", "closed"],
            ["reopen", "open"],
          ],
        },
      },
      tooltip: "Closes or reopens an issue or pull request",
    },
    inputs: [
      input.dropdown(
        "state",
        "Do",
        [
          ["Close", "closed"],
          ["Reopen", "open"],
        ],
        { default: "closed" },
      ),
      input.number("number", "Issue or pull request number", { default: 1, min: 1, integer: true }),
      input.text("repo", "In repository", { default: "", placeholder: "owner/name" }),
      input.text("token", "GitHub token", {
        default: "",
        help: "A GitHub personal access token for the account that does this. Put it in a secret and use that here, so it isn't saved in your steps.",
      }),
    ],
    setup: [GITHUB],
    code: (ctx) =>
      `await githubRequest(${repoUrl(ctx.input("repo"))} + "/issues/" + ${ctx.input("number")}, ${ctx.has("token") ? ctx.input("token") : "null"}, { method: "PATCH", body: { state: ${ctx.input("state")} } }).catch((error) => console.error("GitHub: couldn't change the issue.", error));\n`,
  }),
  action({
    id: "github_issue_edit",
    label: "Label or assign a GitHub issue",
    description: "Adds labels, removes a label, or assigns people to an issue or pull request.",
    category: "github",
    group: "Changing",
    icon: "fa-solid fa-tags",
    keywords: ["github", "labels", "assign", "issue"],
    block: {
      type: "github_editIssue",
      text: [
        "{action} {items}",
        "on issue or pull request # {number}",
        "in GitHub repository: {repo}",
        "with token: {token}",
      ],
      parts: {
        action: {
          options: [
            ["add labels", "labels"],
            ["remove label", "removeLabel"],
            ["assign users", "assignees"],
          ],
        },
        items: { check: ["String", "Array"] },
      },
      tooltip:
        'Adds labels, removes a label, or assigns people. Give a list, or text like "bug, help wanted"',
    },
    inputs: [
      input.dropdown(
        "action",
        "Do",
        [
          ["Add labels", "labels"],
          ["Remove labels", "removeLabel"],
          ["Assign people", "assignees"],
        ],
        { default: "labels" },
      ),
      input.text("items", "Labels or usernames", {
        default: "",
        accepts: ["String", "Array"],
        help: "Split them with commas, like bug, help wanted.",
      }),
      input.number("number", "On issue or pull request number", {
        default: 1,
        min: 1,
        integer: true,
      }),
      input.text("repo", "In repository", { default: "", placeholder: "owner/name" }),
      input.text("token", "GitHub token", {
        default: "",
        help: "A GitHub personal access token for the account that does this. Put it in a secret and use that here, so it isn't saved in your steps.",
      }),
    ],
    setup: [GITHUB],
    code: (ctx) => {
      const issue = `${repoUrl(ctx.input("repo"))} + "/issues/" + ${ctx.input("number")}`;
      const token = ctx.has("token") ? ctx.input("token") : "null";
      if (ctx.raw("action") === "removeLabel")
        return `await Promise.all(githubToList(${ctx.input("items")}).map((label) => githubRequest(${issue} + "/labels/" + encodeURIComponent(label), ${token}, { method: "DELETE" }))).catch((error) => console.error("GitHub: couldn't change the issue.", error));\n`;
      const field = ctx.raw("action") === "assignees" ? "assignees" : "labels";
      return `await githubRequest(${issue} + "/${field}", ${token}, { method: "POST", body: { ${field}: githubToList(${ctx.input("items")}) } }).catch((error) => console.error("GitHub: couldn't change the issue.", error));\n`;
    },
  }),
  action({
    id: "github_merge",
    label: "Merge a GitHub pull request",
    description: "Merges a pull request.",
    category: "github",
    group: "Changing",
    icon: "fa-solid fa-code-merge",
    keywords: ["github", "merge", "pull request"],
    block: {
      type: "github_mergePullRequest",
      text: [
        "merge pull request # {number}",
        "in GitHub repository: {repo}",
        "using {method}",
        "with token: {token}",
      ],
      parts: {
        method: {
          options: [
            ["merge commit", "merge"],
            ["squash", "squash"],
            ["rebase", "rebase"],
          ],
        },
      },
      inline: false,
      tooltip: "Merges a pull request",
    },
    inputs: [
      input.number("number", "Pull request number", { default: 1, min: 1, integer: true }),
      input.text("repo", "In repository", { default: "", placeholder: "owner/name" }),
      input.dropdown(
        "method",
        "How",
        [
          ["Merge commit", "merge"],
          ["Squash", "squash"],
          ["Rebase", "rebase"],
        ],
        { default: "merge" },
      ),
      input.text("token", "GitHub token", {
        default: "",
        help: "A GitHub personal access token for the account that does this. Put it in a secret and use that here, so it isn't saved in your steps.",
      }),
    ],
    setup: [GITHUB],
    code: (ctx) =>
      `await githubRequest(${repoUrl(ctx.input("repo"))} + "/pulls/" + ${ctx.input("number")} + "/merge", ${ctx.has("token") ? ctx.input("token") : "null"}, { method: "PUT", body: { merge_method: ${ctx.input("method")} } }).catch((error) => console.error("GitHub: couldn't merge.", error));\n`,
  }),
  action({
    id: "github_create_release",
    label: "Publish a GitHub release",
    description: "Publishes a release, making the tag from the default branch if needed.",
    category: "github",
    group: "Changing",
    icon: "fa-solid fa-rocket",
    keywords: ["github", "release", "publish", "version"],
    block: {
      type: "github_createRelease",
      text: [
        "create release with tag: {tag}",
        "in GitHub repository: {repo}",
        "name: {name}",
        "description: {body}",
        "with token: {token}",
        "then {code}",
      ],
      parts: { code: { check: "default" } },
      tooltip:
        "Publishes a release (creating the tag from the default branch if needed), then runs the blocks inside. Use the release info block inside",
    },
    inputs: [
      input.text("tag", "Tag", { default: "", placeholder: "v1.0.0" }),
      input.text("repo", "In repository", { default: "", placeholder: "owner/name" }),
      input.text("name", "Name", { default: "" }),
      input.text("body", "Description", { default: "", multiline: true }),
      input.text("token", "GitHub token", {
        default: "",
        help: "A GitHub personal access token for the account that does this. Put it in a secret and use that here, so it isn't saved in your steps.",
      }),
    ],
    branches: [
      {
        key: "code",
        label: "After it's published",
        inline: true,
        provides: [
          { key: "name", label: "Name", type: "String", code: "githubRelease@@.name" },
          { key: "tag_name", label: "Tag", type: "String", code: "githubRelease@@.tag_name" },
          { key: "body", label: "Description", type: "String", code: "githubRelease@@.body" },
          {
            key: "author_login",
            label: "Author's username",
            type: "String",
            code: "githubRelease@@.author?.login",
          },
          {
            key: "prerelease",
            label: "Is a pre-release?",
            type: "Boolean",
            code: "githubRelease@@.prerelease",
          },
          { key: "draft", label: "Is a draft?", type: "Boolean", code: "githubRelease@@.draft" },
          {
            key: "published_at",
            label: "Date published",
            type: "String",
            code: "githubRelease@@.published_at",
          },
          {
            key: "assets_map_asset_asset_name",
            label: "Download file names (list)",
            type: "Array",
            code: "(githubRelease@@.assets?.map((asset) => asset.name))",
          },
          {
            key: "assets_map_asset_asset_browser_download_",
            label: "Download links (list)",
            type: "Array",
            code: "(githubRelease@@.assets?.map((asset) => asset.browser_download_url))",
          },
          {
            key: "assets_reduce_total_asset_total_asset_do",
            label: "Total downloads",
            type: "Number",
            code: "(githubRelease@@.assets?.reduce((total, asset) => total + asset.download_count, 0))",
          },
          {
            key: "zipball_url",
            label: "Source code .zip link",
            type: "String",
            code: "githubRelease@@.zipball_url",
          },
          {
            key: "html_url",
            label: "Release link",
            type: "String",
            code: "githubRelease@@.html_url",
          },
        ],
      },
    ],
    setup: [GITHUB],
    code: (ctx) => {
      const found = ctx.local("githubRelease");
      return `{\nconst ${found} = await githubRequest(${repoUrl(ctx.input("repo"))} + "/releases", ${ctx.has("token") ? ctx.input("token") : "null"}, { method: "POST", body: { tag_name: String(${ctx.input("tag")}), name: String(${ctx.input("name")}), body: String(${ctx.input("body")}) } }).catch((error) => console.error("GitHub: couldn't publish the release.", error));\nif (${found}) {\n${ctx.branch("code")}}\n}\n`;
    },
  }),
  action({
    id: "github_run_workflow",
    label: "Run a GitHub Actions workflow",
    description:
      "Starts a workflow that can be run by hand (it has workflow_dispatch in its triggers), like deploy.yml.",
    category: "github",
    group: "Changing",
    icon: "fa-solid fa-play",
    keywords: ["github", "actions", "workflow", "deploy", "dispatch"],
    block: {
      type: "github_runWorkflow",
      text: [
        "run GitHub Actions workflow file: {workflow}",
        "in repository: {repo}",
        "on branch: {branch}",
        "with token: {token}",
      ],
      tooltip: 'Starts a workflow that has "workflow_dispatch" in its triggers, like "deploy.yml"',
    },
    inputs: [
      input.text("workflow", "Workflow file", { default: "", placeholder: "deploy.yml" }),
      input.text("repo", "In repository", { default: "", placeholder: "owner/name" }),
      input.text("branch", "On branch", { default: "main" }),
      input.text("token", "GitHub token", {
        default: "",
        help: "A GitHub personal access token for the account that does this. Put it in a secret and use that here, so it isn't saved in your steps.",
      }),
    ],
    setup: [GITHUB],
    code: (ctx) =>
      `await githubRequest(${repoUrl(ctx.input("repo"))} + "/actions/workflows/" + encodeURIComponent(String(${ctx.input("workflow")}).split("/").pop()) + "/dispatches", ${ctx.has("token") ? ctx.input("token") : "null"}, { method: "POST", body: { ref: String(${ctx.input("branch")}) } }).catch((error) => console.error("GitHub: couldn't run the workflow.", error));\n`,
  }),
  action({
    id: "github_write_file",
    label: "Save a file to a GitHub repository",
    description:
      "Creates a file, or replaces it if it's already there, as a commit on the default branch.",
    category: "github",
    group: "Changing",
    icon: "fa-solid fa-file-arrow-up",
    keywords: ["github", "write file", "commit", "upload"],
    block: {
      type: "github_writeFile",
      text: [
        "write file: {path}",
        "in GitHub repository: {repo}",
        "with contents: {content}",
        "commit message: {message}",
        "with token: {token}",
      ],
      tooltip:
        "Creates a file, or replaces it if it already exists, as a commit on the default branch",
    },
    inputs: [
      input.text("path", "File path", { default: "", placeholder: "data/notes.txt" }),
      input.text("repo", "In repository", { default: "", placeholder: "owner/name" }),
      input.text("content", "Contents", { default: "", multiline: true }),
      input.text("message", "Commit message", { default: "Update file" }),
      input.text("token", "GitHub token", {
        default: "",
        help: "A GitHub personal access token for the account that does this. Put it in a secret and use that here, so it isn't saved in your steps.",
      }),
    ],
    setup: [GITHUB],
    code: (ctx) => `await (async () => {
  const githubFileUrl = ${repoUrl(ctx.input("repo"))} + "/contents/" + ${filePath(ctx.input("path"))};
  const githubExistingFile = await githubRequest(githubFileUrl, ${ctx.has("token") ? ctx.input("token") : "null"});
  await githubRequest(githubFileUrl, ${ctx.has("token") ? ctx.input("token") : "null"}, { method: "PUT", body: {
    message: String(${ctx.input("message")}) || "Update file",
    content: Buffer.from(String(${ctx.input("content")})).toString("base64"),
    ...(githubExistingFile?.sha ? { sha: githubExistingFile.sha } : {}),
  } });
})().catch((error) => console.error("GitHub: couldn't save the file.", error));\n`,
  }),
  action({
    id: "github_create_repo",
    label: "Create a GitHub repository",
    description: "Makes a repository on the token's account.",
    category: "github",
    group: "Changing",
    icon: "fa-solid fa-folder-plus",
    keywords: ["github", "repository", "create", "new repo"],
    block: {
      type: "github_createRepo",
      text: [
        "create {private} GitHub repository named: {name}",
        "description: {description}",
        "with token: {token}",
        "then {code}",
      ],
      parts: {
        private: {
          options: [
            ["public", "false"],
            ["private", "true"],
          ],
        },
        code: { check: "default" },
      },
      tooltip:
        "Creates a repository on the token's account, then runs the blocks inside. Use the repository info block inside",
    },
    inputs: [
      input.text("name", "Name", { default: "" }),
      input.text("description", "Description", { default: "" }),
      input.dropdown(
        "private",
        "Who can see it",
        [
          ["Everyone (public)", "false"],
          ["Only you (private)", "true"],
        ],
        { default: "false" },
      ),
      input.text("token", "GitHub token", {
        default: "",
        help: "A GitHub personal access token for the account that does this. Put it in a secret and use that here, so it isn't saved in your steps.",
      }),
    ],
    branches: [
      {
        key: "code",
        label: "After it's made",
        inline: true,
        provides: [
          { key: "name", label: "Name", type: "String", code: "githubRepo@@.name" },
          {
            key: "full_name",
            label: "Full name (owner/name)",
            type: "String",
            code: "githubRepo@@.full_name",
          },
          {
            key: "description",
            label: "Description",
            type: "String",
            code: "githubRepo@@.description",
          },
          {
            key: "owner_login",
            label: "Owner's username",
            type: "String",
            code: "githubRepo@@.owner?.login",
          },
          {
            key: "owner_avatar_url",
            label: "Owner's avatar picture link",
            type: "String",
            code: "githubRepo@@.owner?.avatar_url",
          },
          {
            key: "stargazers_count",
            label: "Stars",
            type: "Number",
            code: "githubRepo@@.stargazers_count",
          },
          { key: "forks_count", label: "Forks", type: "Number", code: "githubRepo@@.forks_count" },
          {
            key: "subscribers_count",
            label: "Watchers",
            type: "Number",
            code: "githubRepo@@.subscribers_count",
          },
          {
            key: "open_issues_count",
            label: "Open issues and pull requests",
            type: "Number",
            code: "githubRepo@@.open_issues_count",
          },
          {
            key: "language",
            label: "Main language",
            type: "String",
            code: "githubRepo@@.language",
          },
          { key: "topics", label: "Topics (list)", type: "Array", code: "githubRepo@@.topics" },
          {
            key: "license_name",
            label: "License",
            type: "String",
            code: "githubRepo@@.license?.name",
          },
          {
            key: "default_branch",
            label: "Default branch",
            type: "String",
            code: "githubRepo@@.default_branch",
          },
          { key: "homepage", label: "Website", type: "String", code: "githubRepo@@.homepage" },
          { key: "size", label: "Size (KB)", type: "Number", code: "githubRepo@@.size" },
          { key: "fork", label: "Is a fork?", type: "Boolean", code: "githubRepo@@.fork" },
          {
            key: "archived",
            label: "Is archived?",
            type: "Boolean",
            code: "githubRepo@@.archived",
          },
          {
            key: "is_template",
            label: "Is a template?",
            type: "Boolean",
            code: "githubRepo@@.is_template",
          },
          { key: "id", label: "Repository ID", type: "Number", code: "githubRepo@@.id" },
          {
            key: "created_at",
            label: "Date made",
            type: "String",
            code: "githubRepo@@.created_at",
          },
          {
            key: "updated_at",
            label: "Last updated",
            type: "String",
            code: "githubRepo@@.updated_at",
          },
          {
            key: "pushed_at",
            label: "Last pushed",
            type: "String",
            code: "githubRepo@@.pushed_at",
          },
          {
            key: "html_url",
            label: "Repository link",
            type: "String",
            code: "githubRepo@@.html_url",
          },
          { key: "clone_url", label: "Clone link", type: "String", code: "githubRepo@@.clone_url" },
        ],
      },
    ],
    setup: [GITHUB],
    code: (ctx) => {
      const found = ctx.local("githubRepo");
      return `{\nconst ${found} = await githubRequest("/user/repos", ${ctx.has("token") ? ctx.input("token") : "null"}, { method: "POST", body: { name: String(${ctx.input("name")}), description: String(${ctx.input("description")}), private: ${ctx.raw("private") === "true"} } }).catch((error) => console.error("GitHub: couldn't create the repository.", error));\nif (${found}) {\n${ctx.branch("code")}}\n}\n`;
    },
  }),
  action({
    id: "github_star",
    label: "Star or unstar a GitHub repository",
    description: "Stars or unstars a repository as the token's account.",
    category: "github",
    group: "Changing",
    icon: "fa-solid fa-star",
    keywords: ["github", "star", "unstar"],
    block: {
      type: "github_starRepo",
      text: ["{method} GitHub repository: {repo}", "with token: {token}"],
      parts: {
        method: {
          options: [
            ["star", "PUT"],
            ["unstar", "DELETE"],
          ],
        },
      },
      tooltip: "Stars or unstars a repository as the token's account",
    },
    inputs: [
      input.dropdown(
        "method",
        "Do",
        [
          ["Star", "PUT"],
          ["Unstar", "DELETE"],
        ],
        { default: "PUT" },
      ),
      input.text("repo", "Repository", { default: "", placeholder: "owner/name" }),
      input.text("token", "GitHub token", {
        default: "",
        help: "A GitHub personal access token for the account that does this. Put it in a secret and use that here, so it isn't saved in your steps.",
      }),
    ],
    setup: [GITHUB],
    code: (ctx) =>
      `await githubRequest("/user/starred/" + githubRepoPath(${ctx.input("repo")}), ${ctx.has("token") ? ctx.input("token") : "null"}, { method: ${ctx.input("method")} }).catch((error) => console.error("GitHub: couldn't star.", error));\n`,
  }),
  action({
    id: "github_follow",
    label: "Follow or unfollow a GitHub user",
    description: "Follows or unfollows a user as the token's account.",
    category: "github",
    group: "Changing",
    icon: "fa-solid fa-user-plus",
    keywords: ["github", "follow", "unfollow"],
    block: {
      type: "github_followUser",
      text: ["{method} GitHub user: {username}", "with token: {token}"],
      parts: {
        method: {
          options: [
            ["follow", "PUT"],
            ["unfollow", "DELETE"],
          ],
        },
      },
      tooltip: "Follows or unfollows a user as the token's account",
    },
    inputs: [
      input.dropdown(
        "method",
        "Do",
        [
          ["Follow", "PUT"],
          ["Unfollow", "DELETE"],
        ],
        { default: "PUT" },
      ),
      input.text("username", "GitHub username", { default: "" }),
      input.text("token", "GitHub token", {
        default: "",
        help: "A GitHub personal access token for the account that does this. Put it in a secret and use that here, so it isn't saved in your steps.",
      }),
    ],
    setup: [GITHUB],
    code: (ctx) =>
      `await githubRequest("/user/following/" + encodeURIComponent(${ctx.input("username")}), ${ctx.has("token") ? ctx.input("token") : "null"}, { method: ${ctx.input("method")} }).catch((error) => console.error("GitHub: couldn't follow.", error));\n`,
  }),
];

const values = [
  value({
    id: "github_user_exists",
    label: "GitHub user exists?",
    description: "True if a GitHub username is taken.",
    category: "github",
    group: "Reading",
    icon: "fa-solid fa-circle-question",
    keywords: ["github", "exists", "username"],
    block: {
      type: "github_userExists",
      text: "GitHub user exists: {username}",
      tooltip: "Checks whether a GitHub username is taken",
    },
    output: "Boolean",
    inputs: [input.text("username", "GitHub username", { default: "" })],
    setup: [GITHUB],
    code: (ctx) =>
      `((await githubRequest(${userPath(ctx.input("username"))}, null, { status: true }).catch(() => 0)) === 200)`,
  }),
  value({
    id: "github_user_avatar",
    label: "GitHub avatar picture",
    description: "A link to a GitHub user's avatar.",
    category: "github",
    group: "Reading",
    icon: "fa-solid fa-image-portrait",
    keywords: ["github", "avatar", "picture"],
    block: {
      type: "github_userAvatar",
      text: "avatar image URL of GitHub user: {username}",
      tooltip: "A link to the user's avatar image, great inside embeds",
    },
    output: "String",
    inputs: [input.text("username", "GitHub username", { default: "" })],
    setup: [GITHUB],
    code: (ctx) =>
      `((await githubRequest(${userPath(ctx.input("username"))}, null).catch(() => null))?.avatar_url ?? null)`,
  }),
  value({
    id: "github_user_follows",
    label: "GitHub user follows someone?",
    description: "True if one GitHub user follows another.",
    category: "github",
    group: "Reading",
    icon: "fa-solid fa-user-check",
    keywords: ["github", "follows", "following"],
    block: {
      type: "github_userFollows",
      text: ["GitHub user: {username}", "follows user: {target}"],
      tooltip: "Checks whether one GitHub user follows another",
    },
    output: "Boolean",
    inputs: [
      input.text("username", "GitHub username", { default: "" }),
      input.text("target", "Follows", { default: "" }),
    ],
    setup: [GITHUB],
    code: (ctx) =>
      `((await githubRequest(${userPath(ctx.input("username"))} + "/following/" + encodeURIComponent(${ctx.input("target")}), null, { status: true }).catch(() => 0)) === 204)`,
  }),
  value({
    id: "github_user_list",
    label: "List about a GitHub user",
    description:
      "A list about a GitHub user, like their repositories or followers (up to 100, most recent first).",
    category: "github",
    group: "Reading",
    icon: "fa-solid fa-list",
    keywords: ["github", "repositories", "followers", "following", "starred", "orgs", "gists"],
    block: {
      type: "github_userList",
      text: "list of {list} of GitHub user: {username}",
      parts: {
        list: {
          options: [
            ["repository names", "repos"],
            ["followers", "followers"],
            ["following", "following"],
            ["starred repository names", "starred"],
            ["organizations", "orgs"],
            ["gist IDs", "gists"],
          ],
        },
      },
      tooltip: "A list about a GitHub user (up to 100 items, most recent first)",
    },
    output: "Array",
    inputs: [
      input.dropdown(
        "list",
        "List of",
        [
          ["Repository names", "repos"],
          ["Followers", "followers"],
          ["Following", "following"],
          ["Starred repositories", "starred"],
          ["Organizations", "orgs"],
          ["Gist IDs", "gists"],
        ],
        { default: "repos" },
      ),
      input.text("username", "GitHub username", { default: "" }),
    ],
    setup: [GITHUB],
    code: (ctx) => {
      const list = ["repos", "followers", "following", "starred", "orgs", "gists"].includes(
        ctx.raw("list"),
      )
        ? ctx.raw("list")
        : "repos";
      const pick = {
        repos: "item.name",
        followers: "item.login",
        following: "item.login",
        starred: "item.full_name",
        orgs: "item.login",
        gists: "item.id",
      }[list];
      return `((await githubRequest(${userPath(ctx.input("username"))} + "/${list}?per_page=100${list === "repos" ? "&sort=updated" : ""}", null).catch(() => null)) ?? []).map((item) => ${pick})`;
    },
  }),
  value({
    id: "github_search_users",
    label: "GitHub users found by a search",
    description: "Usernames of GitHub users matching a search (up to 30).",
    category: "github",
    group: "Reading",
    icon: "fa-solid fa-users-viewfinder",
    keywords: ["github", "search", "users"],
    block: {
      type: "github_searchUsers",
      text: "usernames of GitHub users matching search: {query}",
      tooltip: "Searches GitHub users (up to 30 usernames)",
    },
    output: "Array",
    inputs: [input.text("query", "Search for", { default: "" })],
    setup: [GITHUB],
    code: (ctx) =>
      `((await githubRequest("/search/users?q=" + encodeURIComponent(${ctx.input("query")}), null).catch(() => null))?.items ?? []).map((item) => item.login)`,
  }),
  value({
    id: "github_org_members",
    label: "Members of a GitHub organization",
    description: "The usernames of an organization's public members (up to 100).",
    category: "github",
    group: "Reading",
    icon: "fa-solid fa-users",
    keywords: ["github", "organization", "members"],
    block: {
      type: "github_orgMembers",
      text: "public members of GitHub organization: {org}",
      tooltip: "A list of usernames of the organization's public members (up to 100)",
    },
    output: "Array",
    inputs: [input.text("org", "Organization", { default: "" })],
    setup: [GITHUB],
    code: (ctx) =>
      `((await githubRequest("/orgs/" + encodeURIComponent(${ctx.input("org")}) + "/public_members?per_page=100", null).catch(() => null)) ?? []).map((item) => item.login)`,
  }),
  value({
    id: "github_repo_exists",
    label: "GitHub repository exists?",
    description: "True if a public repository exists, like octocat/Hello-World.",
    category: "github",
    group: "Reading",
    icon: "fa-solid fa-circle-question",
    keywords: ["github", "repository", "exists"],
    block: {
      type: "github_repoExists",
      text: "GitHub repository exists: {repo}",
      tooltip: 'Checks whether a public repository exists, like "octocat/Hello-World"',
    },
    output: "Boolean",
    inputs: [input.text("repo", "Repository", { default: "", placeholder: "owner/name" })],
    setup: [GITHUB],
    code: (ctx) =>
      `((await githubRequest(${repoUrl(ctx.input("repo"))}, null, { status: true }).catch(() => 0)) === 200)`,
  }),
  value({
    id: "github_repo_stars",
    label: "Stars of a GitHub repository",
    description: "How many stars a repository has.",
    category: "github",
    group: "Reading",
    icon: "fa-solid fa-star",
    keywords: ["github", "stars", "stargazers"],
    block: {
      type: "github_repoStars",
      text: "stars of GitHub repository: {repo}",
      tooltip: "How many stars a repository has",
    },
    output: "Number",
    inputs: [input.text("repo", "Repository", { default: "", placeholder: "owner/name" })],
    setup: [GITHUB],
    code: (ctx) =>
      `((await githubRequest(${repoUrl(ctx.input("repo"))}, null).catch(() => null))?.stargazers_count ?? 0)`,
  }),
  value({
    id: "github_repo_list",
    label: "List about a GitHub repository",
    description: "A list about a repository, like its contributors or branches (up to 100).",
    category: "github",
    group: "Reading",
    icon: "fa-solid fa-list",
    keywords: [
      "github",
      "contributors",
      "branches",
      "tags",
      "languages",
      "labels",
      "releases",
      "forks",
    ],
    block: {
      type: "github_repoList",
      text: "list of {list} of GitHub repository: {repo}",
      parts: {
        list: {
          options: [
            ["contributors", "contributors"],
            ["stargazers", "stargazers"],
            ["branches", "branches"],
            ["tags", "tags"],
            ["languages", "languages"],
            ["labels", "labels"],
            ["release tags", "releases"],
            ["forks (owner/name)", "forks"],
          ],
        },
      },
      tooltip: "A list about a repository (up to 100 items)",
    },
    output: "Array",
    inputs: [
      input.dropdown(
        "list",
        "List of",
        [
          ["Contributors", "contributors"],
          ["Stargazers", "stargazers"],
          ["Branches", "branches"],
          ["Tags", "tags"],
          ["Languages", "languages"],
          ["Labels", "labels"],
          ["Release tags", "releases"],
          ["Forks (owner/name)", "forks"],
        ],
        { default: "contributors" },
      ),
      input.text("repo", "Repository", { default: "", placeholder: "owner/name" }),
    ],
    setup: [GITHUB],
    code: (ctx) => {
      const pick = {
        contributors: "item.login",
        stargazers: "item.login",
        branches: "item.name",
        tags: "item.name",
        labels: "item.name",
        releases: "item.tag_name",
        forks: "item.full_name",
      };
      const list = ctx.raw("list");
      if (list === "languages")
        return `Object.keys((await githubRequest(${repoUrl(ctx.input("repo"))} + "/languages", null).catch(() => null)) ?? {})`;
      const key = pick[list] ? list : "contributors";
      return `((await githubRequest(${repoUrl(ctx.input("repo"))} + "/${key}?per_page=100", null).catch(() => null)) ?? []).map((item) => ${pick[key]})`;
    },
  }),
  value({
    id: "github_readme",
    label: "README of a GitHub repository",
    description: "The text of a repository's README file.",
    category: "github",
    group: "Reading",
    icon: "fa-solid fa-book-open",
    keywords: ["github", "readme"],
    block: {
      type: "github_repoReadme",
      text: "README of GitHub repository: {repo}",
      tooltip: "The text of a repository's README file",
    },
    output: "String",
    inputs: [input.text("repo", "Repository", { default: "", placeholder: "owner/name" })],
    setup: [GITHUB],
    code: (ctx) =>
      `(await githubRequest(${repoUrl(ctx.input("repo"))} + "/readme", null, { raw: true }).catch(() => null))`,
  }),
  value({
    id: "github_file",
    label: "File from a GitHub repository",
    description: "The text of a file in a repository, like src/index.js, from its default branch.",
    category: "github",
    group: "Reading",
    icon: "fa-solid fa-file-code",
    keywords: ["github", "file", "contents", "read file"],
    block: {
      type: "github_fileContent",
      text: ["contents of file: {path}", "in GitHub repository: {repo}"],
      tooltip: 'The text of a file in a repository, like "src/index.js" (from the default branch)',
    },
    output: "String",
    inputs: [
      input.text("path", "File path", { default: "", placeholder: "src/index.js" }),
      input.text("repo", "In repository", { default: "", placeholder: "owner/name" }),
    ],
    setup: [GITHUB],
    code: (ctx) =>
      `(await githubRequest(${repoUrl(ctx.input("repo"))} + "/contents/" + ${filePath(ctx.input("path"))}, null, { raw: true }).catch(() => null))`,
  }),
  value({
    id: "github_workflow_status",
    label: "Latest GitHub Actions result",
    description:
      "How the most recent GitHub Actions run went: success, failure, cancelled, in_progress or queued.",
    category: "github",
    group: "Reading",
    icon: "fa-solid fa-gears",
    keywords: ["github", "actions", "workflow", "ci", "build status"],
    block: {
      type: "github_workflowStatus",
      text: "status of latest GitHub Actions run in repository: {repo}",
      tooltip:
        'The result of the most recent workflow run: "success", "failure", "cancelled", "in_progress", "queued"…',
    },
    output: "String",
    inputs: [input.text("repo", "Repository", { default: "", placeholder: "owner/name" })],
    setup: [GITHUB],
    code: (ctx) =>
      `((run) => (run ? run.conclusion ?? run.status : null))((await githubRequest(${repoUrl(ctx.input("repo"))} + "/actions/runs?per_page=1", null).catch(() => null))?.workflow_runs?.[0])`,
  }),
  value({
    id: "github_search_count",
    label: "Number of GitHub search results",
    description:
      "How many results a GitHub search has, like repo:octocat/Hello-World is:issue is:open.",
    category: "github",
    group: "Reading",
    icon: "fa-solid fa-hashtag",
    keywords: ["github", "search", "count"],
    block: {
      type: "github_searchCount",
      text: ["number of GitHub {type}", "matching search: {query}"],
      parts: {
        type: {
          options: [
            ["issues & pull requests", "issues"],
            ["repositories", "repositories"],
            ["users", "users"],
          ],
        },
      },
      tooltip:
        'How many results a GitHub search has, e.g. "repo:octocat/Hello-World is:issue is:open"',
    },
    output: "Number",
    inputs: [
      input.dropdown(
        "type",
        "Search",
        [
          ["Issues and pull requests", "issues"],
          ["Repositories", "repositories"],
          ["Users", "users"],
        ],
        { default: "issues" },
      ),
      input.text("query", "For", { default: "" }),
    ],
    setup: [GITHUB],
    code: (ctx) =>
      `((await githubRequest("/search/" + ${ctx.input("type")} + "?per_page=1&q=" + encodeURIComponent(${ctx.input("query")}), null).catch(() => null))?.total_count ?? 0)`,
  }),
  value({
    id: "github_requests_left",
    label: "GitHub requests left this hour",
    description:
      "How many more requests the bot can send GitHub this hour. Checking doesn't use one up.",
    category: "github",
    group: "Reading",
    icon: "fa-solid fa-gauge",
    keywords: ["github", "rate limit", "requests"],
    block: {
      type: "github_rateLimit",
      text: "GitHub requests the bot has left this hour",
      tooltip:
        "Without a token GitHub allows 60 requests an hour. Checking this doesn't use one up",
    },
    output: "Number",
    setup: [GITHUB],
    code: (ctx) =>
      `((await githubRequest("/rate_limit", null).catch(() => null))?.resources?.core?.remaining ?? 0)`,
  }),
  value({
    id: "github_zen",
    label: "Random GitHub quote",
    description: "A random piece of design wisdom from GitHub.",
    category: "github",
    group: "Reading",
    icon: "fa-solid fa-quote-left",
    keywords: ["github", "zen", "quote"],
    block: {
      type: "github_zen",
      text: "random GitHub zen quote",
      tooltip: "A random piece of design wisdom from GitHub",
    },
    output: "String",
    setup: [GITHUB],
    code: (ctx) => `(await githubRequest("/zen", null, { raw: true }).catch(() => null))`,
  }),
  value({
    id: "github_create_gist",
    label: "Link to a new GitHub gist",
    description: "Makes a gist with one file and gives back its link. Handy for sharing long text.",
    category: "github",
    group: "Changing",
    icon: "fa-solid fa-note-sticky",
    keywords: ["github", "gist", "paste", "share"],
    block: {
      type: "github_createGist",
      text: [
        "link to new {public} GitHub gist with file name: {filename}",
        "contents: {content}",
        "with token: {token}",
      ],
      parts: {
        public: {
          options: [
            ["secret", "false"],
            ["public", "true"],
          ],
        },
      },
      tooltip:
        "Creates a gist with one file, and gives back its link — handy for sharing long text",
    },
    output: "String",
    inputs: [
      input.text("filename", "File name", { default: "file.txt" }),
      input.text("content", "Contents", { default: "", multiline: true }),
      input.dropdown(
        "public",
        "Who can find it",
        [
          ["Only people with the link", "false"],
          ["Everyone", "true"],
        ],
        { default: "false" },
      ),
      input.text("token", "GitHub token", {
        default: "",
        help: "A GitHub personal access token for the account that does this. Put it in a secret and use that here, so it isn't saved in your steps.",
      }),
    ],
    setup: [GITHUB],
    code: (ctx) =>
      `((await githubRequest("/gists", ${ctx.has("token") ? ctx.input("token") : "null"}, { method: "POST", body: { public: ${ctx.raw("public") === "true"}, files: { [String(${ctx.input("filename")}) || "file.txt"]: { content: String(${ctx.input("content")}) } } } }).catch(() => null))?.html_url ?? null)`,
  }),
];

const components = [];

export default {
  events,
  actions,
  values,
  components,
  contexts: [],
};
