import * as Blockly from "blockly/core";
import { Order, javascriptGenerator } from "blockly/javascript";
import { createRestrictions } from "../lib/restrictions";

const colour = "#6e5494";

/* Everything that only *reads* public information (users, repositories,
   issues, releases, commits, gists, organizations, search) uses GitHub's
   REST API without a token, so users never have to provide one. GitHub
   allows 60 of those requests an hour per bot.

   Blocks that act *as* somebody — opening an issue, starring a repo,
   writing a file — can't work without an account, so those take a token
   input. The toolbox fills it with a "get secret" block, so the token
   lives in the project's secrets rather than in the workspace. */

/** The runtime function every GitHub block sends its request through. */
const request = () =>
  javascriptGenerator.provideFunction_(
    "githubRequest",
    `async function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(path, token, options = {}) {
  const res = await fetch("https://api.github.com" + path, {
    method: options.method || "GET",
    headers: {
      Accept: options.raw ? "application/vnd.github.raw+json" : "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "DisFuse-Bot",
      ...(token ? { Authorization: "Bearer " + token } : {}),
      ...(options.body ? { "Content-Type": "application/json" } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (options.status) return res.status;

  if (!res.ok) {
    if (res.status !== 404) console.error("GitHub API error (" + res.status + "):", await res.text().catch(() => ""));
    return null;
  }

  if (res.status === 204) return true;
  return options.raw ? res.text() : res.json();
}`,
  );

/** Turns "owner/repo", a github.com link, or a clone URL into "owner/repo". */
const repoPath = () =>
  javascriptGenerator.provideFunction_(
    "githubRepoPath",
    `function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(repo) {
  return String(repo)
    .trim()
    .replace(/^(https?:\\/\\/)?(www\\.)?github\\.com\\//i, "")
    .replace(/\\.git$/i, "")
    .split("/")
    .slice(0, 2)
    .map(encodeURIComponent)
    .join("/");
}`,
  );

/** Accepts a list, or text like "bug, help wanted". */
const toList = () =>
  javascriptGenerator.provideFunction_(
    "githubToList",
    `function ${javascriptGenerator.FUNCTION_NAME_PLACEHOLDER_}(value) {
  if (Array.isArray(value)) return value.map(String);
  return String(value ?? "").split(",").map(item => item.trim()).filter(Boolean);
}`,
  );

const value = (block, generator, name, fallback = "''") =>
  generator.valueToCode(block, name, Order.ATOMIC) || fallback;

const userPath = (username) => `"/users/" + encodeURIComponent(${username})`;
const repoUrl = (repo) => `"/repos/" + ${repoPath()}(${repo})`;

/** Adds a "GitHub token:" input to a block. */
function appendToken(block) {
  block.appendValueInput("token").setCheck("String").appendField("with token:");
}

/**
 * A "get X then" block: runs the request, and if something came back,
 * runs the blocks inside with the result stored in `variable`.
 */
function getterGenerator(variable, noun, pathOf) {
  return function (block, generator) {
    const code = generator.statementToCode(block, "code");

    return `await ${request()}(${pathOf(block, generator)}, null)
  .then(async (${variable}) => {
    if (!${variable}) return;

    ${code}})
  .catch(error => console.error("Error fetching GitHub ${noun}:", error));\n`;
  };
}

/** A "for each X" block: runs the blocks inside once per item in a list. */
function loopGenerator(variable, noun, pathOf, pick = "") {
  return function (block, generator) {
    const code = generator.statementToCode(block, "code");

    return `for (const ${variable} of (await ${request()}(${pathOf(block, generator)}, null).catch(error => console.error("Error fetching GitHub ${noun}:", error)))${pick} ?? []) {
  ${code}}\n`;
  };
}

/** A "get [property] of X" block, reading the variable a getter defined. */
function infoBlock(type, variable, noun, options) {
  Blockly.Blocks[type] = {
    init: function () {
      this.appendDummyInput()
        .appendField("get")
        .appendField(new Blockly.FieldDropdown(options), "info")
        .appendField(`of GitHub ${noun}`);
      this.setOutput(true, null);
      this.setColour(colour);
      this.setTooltip(`Information about the GitHub ${noun} you got`);
    },
  };

  javascriptGenerator.forBlock[type] = function (block) {
    const info = block.getFieldValue("info");

    /* Most options are a property path; the few that aren't say where
       the variable goes with "$". */
    const code = info.includes("$")
      ? info.replaceAll("$", variable)
      : `${variable}.${info}`;

    return [`(${code})`, Order.ATOMIC];
  };
}

/** Common shape for a statement block with a "then" section. */
function thenBlock(block, tooltip) {
  block.appendStatementInput("code").appendField("then").setCheck("default");
  block.setPreviousStatement(true, "default");
  block.setNextStatement(true, "default");
  block.setColour(colour);
  block.setTooltip(tooltip);
}

/** Common shape for a plain statement block. */
function statementBlock(block, tooltip) {
  block.setPreviousStatement(true, "default");
  block.setNextStatement(true, "default");
  block.setColour(colour);
  block.setTooltip(tooltip);
}

/** Common shape for a reporter block. */
function outputBlock(block, output, tooltip) {
  block.setOutput(true, output);
  block.setColour(colour);
  block.setTooltip(tooltip);
}

/* ------------------------------------------------------------------ */
/* Users                                                                */
/* ------------------------------------------------------------------ */

Blockly.Blocks["github_getUser"] = {
  init: function () {
    this.appendValueInput("username")
      .setCheck("String")
      .appendField("get GitHub user:");
    thenBlock(
      this,
      "Looks up a GitHub user (or organization) by username, then runs the blocks inside",
    );
  },
};

javascriptGenerator.forBlock["github_getUser"] = getterGenerator(
  "githubUserInformation",
  "user",
  (block, generator) => userPath(value(block, generator, "username")),
);

infoBlock("github_userInfo", "githubUserInformation", "user", [
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
]);

Blockly.Blocks["github_userExists"] = {
  init: function () {
    this.appendValueInput("username")
      .setCheck("String")
      .appendField("GitHub user exists:");
    outputBlock(this, "Boolean", "Checks whether a GitHub username is taken");
  },
};

javascriptGenerator.forBlock["github_userExists"] = function (block, generator) {
  const username = value(block, generator, "username");

  return [
    `await ${request()}(${userPath(username)}, null, { status: true }).then(status => status === 200).catch(() => false)`,
    Order.AWAIT,
  ];
};

Blockly.Blocks["github_userAvatar"] = {
  init: function () {
    this.appendValueInput("username")
      .setCheck("String")
      .appendField("avatar image URL of GitHub user:");
    outputBlock(
      this,
      "String",
      "A link to the user's avatar image, great inside embeds",
    );
  },
};

javascriptGenerator.forBlock["github_userAvatar"] = function (block, generator) {
  const username = value(block, generator, "username");

  return [
    `await ${request()}(${userPath(username)}, null).then(user => user?.avatar_url ?? null).catch(() => null)`,
    Order.AWAIT,
  ];
};

Blockly.Blocks["github_userFollows"] = {
  init: function () {
    this.appendValueInput("username")
      .setCheck("String")
      .appendField("GitHub user:");
    this.appendValueInput("target")
      .setCheck("String")
      .appendField("follows user:");
    outputBlock(this, "Boolean", "Checks whether one GitHub user follows another");
  },
};

javascriptGenerator.forBlock["github_userFollows"] = function (block, generator) {
  const username = value(block, generator, "username");
  const target = value(block, generator, "target");

  return [
    `await ${request()}(${userPath(username)} + "/following/" + encodeURIComponent(${target}), null, { status: true }).then(status => status === 204).catch(() => false)`,
    Order.AWAIT,
  ];
};

Blockly.Blocks["github_userList"] = {
  init: function () {
    this.appendValueInput("username")
      .setCheck("String")
      .appendField("list of")
      .appendField(
        new Blockly.FieldDropdown([
          ["repository names", "repos"],
          ["followers", "followers"],
          ["following", "following"],
          ["starred repository names", "starred"],
          ["organizations", "orgs"],
          ["gist IDs", "gists"],
        ]),
        "list",
      )
      .appendField("of GitHub user:");
    outputBlock(
      this,
      "Array",
      "A list about a GitHub user (up to 100 items, most recent first)",
    );
  },
};

javascriptGenerator.forBlock["github_userList"] = function (block, generator) {
  const username = value(block, generator, "username");
  const list = block.getFieldValue("list");

  const pick = {
    repos: "item.name",
    followers: "item.login",
    following: "item.login",
    starred: "item.full_name",
    orgs: "item.login",
    gists: "item.id",
  }[list];

  const sort = list === "repos" ? "&sort=updated" : "";

  return [
    `await ${request()}(${userPath(username)} + "/${list}?per_page=100${sort}", null).then(items => (items ?? []).map(item => ${pick})).catch(() => [])`,
    Order.AWAIT,
  ];
};

/* ------------------------------------------------------------------ */
/* Organizations                                                        */
/* ------------------------------------------------------------------ */

Blockly.Blocks["github_getOrg"] = {
  init: function () {
    this.appendValueInput("org")
      .setCheck("String")
      .appendField("get GitHub organization:");
    thenBlock(
      this,
      "Looks up a GitHub organization by its name, then runs the blocks inside",
    );
  },
};

javascriptGenerator.forBlock["github_getOrg"] = getterGenerator(
  "githubOrgInformation",
  "organization",
  (block, generator) =>
    `"/orgs/" + encodeURIComponent(${value(block, generator, "org")})`,
);

infoBlock("github_orgInfo", "githubOrgInformation", "organization", [
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
]);

Blockly.Blocks["github_orgMembers"] = {
  init: function () {
    this.appendValueInput("org")
      .setCheck("String")
      .appendField("public members of GitHub organization:");
    outputBlock(
      this,
      "Array",
      "A list of usernames of the organization's public members (up to 100)",
    );
  },
};

javascriptGenerator.forBlock["github_orgMembers"] = function (block, generator) {
  const org = value(block, generator, "org");

  return [
    `await ${request()}("/orgs/" + encodeURIComponent(${org}) + "/public_members?per_page=100", null).then(items => (items ?? []).map(item => item.login)).catch(() => [])`,
    Order.AWAIT,
  ];
};

/* ------------------------------------------------------------------ */
/* Repositories                                                         */
/* ------------------------------------------------------------------ */

Blockly.Blocks["github_getRepo"] = {
  init: function () {
    this.appendValueInput("repo")
      .setCheck("String")
      .appendField("get GitHub repository (owner/name):");
    thenBlock(
      this,
      'Looks up a repository, like "octocat/Hello-World" or its github.com link, then runs the blocks inside',
    );
  },
};

javascriptGenerator.forBlock["github_getRepo"] = getterGenerator(
  "githubRepoInformation",
  "repository",
  (block, generator) => repoUrl(value(block, generator, "repo")),
);

Blockly.Blocks["github_forEachRepo"] = {
  init: function () {
    this.appendValueInput("username")
      .setCheck("String")
      .appendField("for each repository of GitHub user or organization:");
    this.appendStatementInput("code").appendField("do").setCheck("default");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour(colour);
    this.setTooltip(
      "Runs the blocks inside once for each public repository (up to 100, recently updated first). Use the repository info block inside",
    );
  },
};

javascriptGenerator.forBlock["github_forEachRepo"] = loopGenerator(
  "githubRepoInformation",
  "repositories",
  (block, generator) =>
    `${userPath(value(block, generator, "username"))} + "/repos?per_page=100&sort=updated"`,
);

Blockly.Blocks["github_searchRepos"] = {
  init: function () {
    this.appendValueInput("query")
      .setCheck("String")
      .appendField("for each GitHub repository matching search:");
    this.appendDummyInput()
      .appendField("sorted by")
      .appendField(
        new Blockly.FieldDropdown([
          ["best match", "best"],
          ["stars", "stars"],
          ["forks", "forks"],
          ["recently updated", "updated"],
        ]),
        "sort",
      );
    this.setInputsInline(false);
    this.appendStatementInput("code").appendField("do").setCheck("default");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour(colour);
    this.setTooltip(
      "Searches GitHub and runs the blocks inside for each repository found (up to 30). Use the repository info block inside",
    );
  },
};

javascriptGenerator.forBlock["github_searchRepos"] = loopGenerator(
  "githubRepoInformation",
  "search results",
  (block, generator) => {
    const sort = block.getFieldValue("sort");
    return `"/search/repositories?q=" + encodeURIComponent(${value(block, generator, "query")})${sort === "best" ? "" : ` + "&sort=${sort}"`}`;
  },
  "?.items",
);

infoBlock("github_repoInfo", "githubRepoInformation", "repository", [
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
]);

Blockly.Blocks["github_repoExists"] = {
  init: function () {
    this.appendValueInput("repo")
      .setCheck("String")
      .appendField("GitHub repository exists:");
    outputBlock(
      this,
      "Boolean",
      "Checks whether a public repository exists, like \"octocat/Hello-World\"",
    );
  },
};

javascriptGenerator.forBlock["github_repoExists"] = function (block, generator) {
  const repo = value(block, generator, "repo");

  return [
    `await ${request()}(${repoUrl(repo)}, null, { status: true }).then(status => status === 200).catch(() => false)`,
    Order.AWAIT,
  ];
};

Blockly.Blocks["github_repoStars"] = {
  init: function () {
    this.appendValueInput("repo")
      .setCheck("String")
      .appendField("stars of GitHub repository:");
    outputBlock(this, "Number", "How many stars a repository has");
  },
};

javascriptGenerator.forBlock["github_repoStars"] = function (block, generator) {
  const repo = value(block, generator, "repo");

  return [
    `await ${request()}(${repoUrl(repo)}, null).then(repo => repo?.stargazers_count ?? 0).catch(() => 0)`,
    Order.AWAIT,
  ];
};

Blockly.Blocks["github_repoList"] = {
  init: function () {
    this.appendValueInput("repo")
      .setCheck("String")
      .appendField("list of")
      .appendField(
        new Blockly.FieldDropdown([
          ["contributors", "contributors"],
          ["stargazers", "stargazers"],
          ["branches", "branches"],
          ["tags", "tags"],
          ["languages", "languages"],
          ["labels", "labels"],
          ["release tags", "releases"],
          ["forks (owner/name)", "forks"],
        ]),
        "list",
      )
      .appendField("of GitHub repository:");
    outputBlock(this, "Array", "A list about a repository (up to 100 items)");
  },
};

javascriptGenerator.forBlock["github_repoList"] = function (block, generator) {
  const repo = value(block, generator, "repo");
  const list = block.getFieldValue("list");

  if (list === "languages")
    return [
      `await ${request()}(${repoUrl(repo)} + "/languages", null).then(languages => Object.keys(languages ?? {})).catch(() => [])`,
      Order.AWAIT,
    ];

  const pick = {
    contributors: "item.login",
    stargazers: "item.login",
    branches: "item.name",
    tags: "item.name",
    labels: "item.name",
    releases: "item.tag_name",
    forks: "item.full_name",
  }[list];

  return [
    `await ${request()}(${repoUrl(repo)} + "/${list}?per_page=100", null).then(items => (items ?? []).map(item => ${pick})).catch(() => [])`,
    Order.AWAIT,
  ];
};

Blockly.Blocks["github_repoReadme"] = {
  init: function () {
    this.appendValueInput("repo")
      .setCheck("String")
      .appendField("README of GitHub repository:");
    outputBlock(this, "String", "The text of a repository's README file");
  },
};

javascriptGenerator.forBlock["github_repoReadme"] = function (block, generator) {
  const repo = value(block, generator, "repo");

  return [
    `await ${request()}(${repoUrl(repo)} + "/readme", null, { raw: true }).catch(() => null)`,
    Order.AWAIT,
  ];
};

Blockly.Blocks["github_fileContent"] = {
  init: function () {
    this.appendValueInput("path")
      .setCheck("String")
      .appendField("contents of file:");
    this.appendValueInput("repo")
      .setCheck("String")
      .appendField("in GitHub repository:");
    outputBlock(
      this,
      "String",
      'The text of a file in a repository, like "src/index.js" (from the default branch)',
    );
  },
};

javascriptGenerator.forBlock["github_fileContent"] = function (block, generator) {
  const repo = value(block, generator, "repo");
  const path = value(block, generator, "path");

  return [
    `await ${request()}(${repoUrl(repo)} + "/contents/" + String(${path}).replace(/^\\/+/, "").split("/").map(encodeURIComponent).join("/"), null, { raw: true }).catch(() => null)`,
    Order.AWAIT,
  ];
};

Blockly.Blocks["github_workflowStatus"] = {
  init: function () {
    this.appendValueInput("repo")
      .setCheck("String")
      .appendField("status of latest GitHub Actions run in repository:");
    outputBlock(
      this,
      "String",
      'The result of the most recent workflow run: "success", "failure", "cancelled", "in_progress", "queued"…',
    );
  },
};

javascriptGenerator.forBlock["github_workflowStatus"] = function (
  block,
  generator,
) {
  const repo = value(block, generator, "repo");

  return [
    `await ${request()}(${repoUrl(repo)} + "/actions/runs?per_page=1", null).then(json => json?.workflow_runs?.[0] ? (json.workflow_runs[0].conclusion ?? json.workflow_runs[0].status) : null).catch(() => null)`,
    Order.AWAIT,
  ];
};

/* ------------------------------------------------------------------ */
/* Issues & pull requests                                               */
/* ------------------------------------------------------------------ */

Blockly.Blocks["github_getIssue"] = {
  init: function () {
    this.appendValueInput("number")
      .setCheck("Number")
      .appendField("get issue #");
    this.appendValueInput("repo")
      .setCheck("String")
      .appendField("in GitHub repository:");
    thenBlock(
      this,
      "Looks up an issue (or pull request) by its number, then runs the blocks inside",
    );
  },
};

javascriptGenerator.forBlock["github_getIssue"] = getterGenerator(
  "githubIssueInformation",
  "issue",
  (block, generator) =>
    `${repoUrl(value(block, generator, "repo"))} + "/issues/" + ${value(block, generator, "number", "0")}`,
);

Blockly.Blocks["github_forEachIssue"] = {
  init: function () {
    this.appendValueInput("repo")
      .setCheck("String")
      .appendField("for each")
      .appendField(
        new Blockly.FieldDropdown([
          ["open", "open"],
          ["closed", "closed"],
          ["open or closed", "all"],
        ]),
        "state",
      )
      .appendField("issue in GitHub repository:");
    this.appendStatementInput("code").appendField("do").setCheck("default");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour(colour);
    this.setTooltip(
      "Runs the blocks inside once for each issue (up to 100, newest first, pull requests left out). Use the issue info block inside",
    );
  },
};

javascriptGenerator.forBlock["github_forEachIssue"] = loopGenerator(
  "githubIssueInformation",
  "issues",
  (block, generator) =>
    `${repoUrl(value(block, generator, "repo"))} + "/issues?per_page=100&state=${block.getFieldValue("state")}"`,
  "?.filter(issue => !issue.pull_request)",
);

infoBlock("github_issueInfo", "githubIssueInformation", "issue", [
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
]);

Blockly.Blocks["github_getPullRequest"] = {
  init: function () {
    this.appendValueInput("number")
      .setCheck("Number")
      .appendField("get pull request #");
    this.appendValueInput("repo")
      .setCheck("String")
      .appendField("in GitHub repository:");
    thenBlock(
      this,
      "Looks up a pull request by its number, then runs the blocks inside",
    );
  },
};

javascriptGenerator.forBlock["github_getPullRequest"] = getterGenerator(
  "githubPullRequestInformation",
  "pull request",
  (block, generator) =>
    `${repoUrl(value(block, generator, "repo"))} + "/pulls/" + ${value(block, generator, "number", "0")}`,
);

Blockly.Blocks["github_forEachPullRequest"] = {
  init: function () {
    this.appendValueInput("repo")
      .setCheck("String")
      .appendField("for each")
      .appendField(
        new Blockly.FieldDropdown([
          ["open", "open"],
          ["closed", "closed"],
          ["open or closed", "all"],
        ]),
        "state",
      )
      .appendField("pull request in GitHub repository:");
    this.appendStatementInput("code").appendField("do").setCheck("default");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour(colour);
    this.setTooltip(
      "Runs the blocks inside once for each pull request (up to 100, newest first). Use the pull request info block inside",
    );
  },
};

javascriptGenerator.forBlock["github_forEachPullRequest"] = loopGenerator(
  "githubPullRequestInformation",
  "pull requests",
  (block, generator) =>
    `${repoUrl(value(block, generator, "repo"))} + "/pulls?per_page=100&state=${block.getFieldValue("state")}"`,
);

infoBlock(
  "github_pullRequestInfo",
  "githubPullRequestInformation",
  "pull request",
  [
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
    ["requested reviewer usernames", "requested_reviewers?.map(reviewer => reviewer.login)"],
    ["commits count", "commits"],
    ["lines added", "additions"],
    ["lines removed", "deletions"],
    ["changed files count", "changed_files"],
    ["created date", "created_at"],
    ["merged date", "merged_at"],
    ["closed date", "closed_at"],
    ["pull request link", "html_url"],
  ],
);

Blockly.Blocks["github_searchCount"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("number of GitHub")
      .appendField(
        new Blockly.FieldDropdown([
          ["issues & pull requests", "issues"],
          ["repositories", "repositories"],
          ["users", "users"],
        ]),
        "type",
      );
    this.appendValueInput("query")
      .setCheck("String")
      .appendField("matching search:");
    outputBlock(
      this,
      "Number",
      'How many results a GitHub search has, e.g. "repo:octocat/Hello-World is:issue is:open"',
    );
  },
};

javascriptGenerator.forBlock["github_searchCount"] = function (block, generator) {
  const query = value(block, generator, "query");
  const type = block.getFieldValue("type");

  return [
    `await ${request()}("/search/${type}?per_page=1&q=" + encodeURIComponent(${query}), null).then(json => json?.total_count ?? 0).catch(() => 0)`,
    Order.AWAIT,
  ];
};

Blockly.Blocks["github_searchUsers"] = {
  init: function () {
    this.appendValueInput("query")
      .setCheck("String")
      .appendField("usernames of GitHub users matching search:");
    outputBlock(this, "Array", "Searches GitHub users (up to 30 usernames)");
  },
};

javascriptGenerator.forBlock["github_searchUsers"] = function (block, generator) {
  const query = value(block, generator, "query");

  return [
    `await ${request()}("/search/users?q=" + encodeURIComponent(${query}), null).then(json => (json?.items ?? []).map(item => item.login)).catch(() => [])`,
    Order.AWAIT,
  ];
};

/* ------------------------------------------------------------------ */
/* Commits                                                              */
/* ------------------------------------------------------------------ */

Blockly.Blocks["github_getCommit"] = {
  init: function () {
    this.appendValueInput("repo")
      .setCheck("String")
      .appendField("get latest commit in GitHub repository:");
    this.appendValueInput("branch")
      .setCheck("String")
      .appendField("on branch (or commit SHA):");
    thenBlock(
      this,
      'Looks up the latest commit on a branch, or a specific commit by its SHA. Leave the branch as "HEAD" for the default branch',
    );
  },
};

javascriptGenerator.forBlock["github_getCommit"] = getterGenerator(
  "githubCommitInformation",
  "commit",
  (block, generator) =>
    `${repoUrl(value(block, generator, "repo"))} + "/commits/" + encodeURIComponent(${value(block, generator, "branch", "'HEAD'")} || "HEAD")`,
);

Blockly.Blocks["github_forEachCommit"] = {
  init: function () {
    this.appendValueInput("count")
      .setCheck("Number")
      .appendField("for each of the latest");
    this.appendValueInput("repo")
      .setCheck("String")
      .appendField("commits in GitHub repository:");
    this.appendStatementInput("code").appendField("do").setCheck("default");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour(colour);
    this.setTooltip(
      "Runs the blocks inside once for each recent commit on the default branch (up to 100). Use the commit info block inside",
    );
  },
};

javascriptGenerator.forBlock["github_forEachCommit"] = loopGenerator(
  "githubCommitInformation",
  "commits",
  (block, generator) =>
    `${repoUrl(value(block, generator, "repo"))} + "/commits?per_page=" + Math.min(Math.max(Number(${value(block, generator, "count", "10")}) || 10, 1), 100)`,
);

infoBlock("github_commitInfo", "githubCommitInformation", "commit", [
  ["message", "commit?.message"],
  ["title (first line of message)", "commit?.message?.split('\\n')[0]"],
  ["SHA", "sha"],
  ["short SHA", "sha?.slice(0, 7)"],
  ["author name", "commit?.author?.name"],
  ["author username", "author?.login"],
  ["author avatar image URL", "author?.avatar_url"],
  ["date", "commit?.author?.date"],
  ["commit link", "html_url"],
]);

/* ------------------------------------------------------------------ */
/* Releases                                                             */
/* ------------------------------------------------------------------ */

Blockly.Blocks["github_getRelease"] = {
  init: function () {
    this.appendValueInput("repo")
      .setCheck("String")
      .appendField("get latest release of GitHub repository:");
    thenBlock(
      this,
      "Looks up the newest published release of a repository, then runs the blocks inside",
    );
  },
};

javascriptGenerator.forBlock["github_getRelease"] = getterGenerator(
  "githubReleaseInformation",
  "release",
  (block, generator) =>
    `${repoUrl(value(block, generator, "repo"))} + "/releases/latest"`,
);

Blockly.Blocks["github_forEachRelease"] = {
  init: function () {
    this.appendValueInput("repo")
      .setCheck("String")
      .appendField("for each release of GitHub repository:");
    this.appendStatementInput("code").appendField("do").setCheck("default");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour(colour);
    this.setTooltip(
      "Runs the blocks inside once for each release (up to 100, newest first). Use the release info block inside",
    );
  },
};

javascriptGenerator.forBlock["github_forEachRelease"] = loopGenerator(
  "githubReleaseInformation",
  "releases",
  (block, generator) =>
    `${repoUrl(value(block, generator, "repo"))} + "/releases?per_page=100"`,
);

infoBlock("github_releaseInfo", "githubReleaseInformation", "release", [
  ["name", "name"],
  ["tag", "tag_name"],
  ["description", "body"],
  ["author username", "author?.login"],
  ["is a pre-release", "prerelease"],
  ["is a draft", "draft"],
  ["published date", "published_at"],
  ["download file names", "assets?.map(asset => asset.name)"],
  ["download links", "assets?.map(asset => asset.browser_download_url)"],
  ["total downloads", "assets?.reduce((total, asset) => total + asset.download_count, 0)"],
  ["source code .zip link", "zipball_url"],
  ["release link", "html_url"],
]);

/* ------------------------------------------------------------------ */
/* Gists                                                                */
/* ------------------------------------------------------------------ */

Blockly.Blocks["github_getGist"] = {
  init: function () {
    this.appendValueInput("id")
      .setCheck("String")
      .appendField("get GitHub gist with ID:");
    thenBlock(
      this,
      "Looks up a gist by the ID at the end of its link, then runs the blocks inside",
    );
  },
};

javascriptGenerator.forBlock["github_getGist"] = getterGenerator(
  "githubGistInformation",
  "gist",
  (block, generator) =>
    `"/gists/" + encodeURIComponent(String(${value(block, generator, "id")}).split("/").pop())`,
);

infoBlock("github_gistInfo", "githubGistInformation", "gist", [
  ["description", "description"],
  ["owner username", "owner?.login"],
  ["file names", "Object.keys($.files ?? {})"],
  ["content of first file", "Object.values($.files ?? {})[0]?.content"],
  ["is public", "public"],
  ["comments count", "comments"],
  ["created date", "created_at"],
  ["last updated date", "updated_at"],
  ["gist link", "html_url"],
]);

/* ------------------------------------------------------------------ */
/* Misc                                                                 */
/* ------------------------------------------------------------------ */

Blockly.Blocks["github_rateLimit"] = {
  init: function () {
    this.appendDummyInput().appendField(
      "GitHub requests the bot has left this hour",
    );
    outputBlock(
      this,
      "Number",
      "Without a token GitHub allows 60 requests an hour. Checking this doesn't use one up",
    );
  },
};

javascriptGenerator.forBlock["github_rateLimit"] = function () {
  return [
    `await ${request()}("/rate_limit", null).then(json => json?.resources?.core?.remaining ?? 0).catch(() => 0)`,
    Order.AWAIT,
  ];
};

Blockly.Blocks["github_zen"] = {
  init: function () {
    this.appendDummyInput().appendField("random GitHub zen quote");
    outputBlock(this, "String", "A random piece of design wisdom from GitHub");
  },
};

javascriptGenerator.forBlock["github_zen"] = function () {
  return [
    `await ${request()}("/zen", null, { raw: true }).catch(() => null)`,
    Order.AWAIT,
  ];
};

/* ------------------------------------------------------------------ */
/* Actions that need a token                                            */
/* ------------------------------------------------------------------ */

const token = (block, generator) => value(block, generator, "token", "null");

Blockly.Blocks["github_getTokenUser"] = {
  init: function () {
    this.appendDummyInput().appendField("get GitHub account");
    appendToken(this);
    thenBlock(
      this,
      "Looks up the GitHub account a token belongs to, then runs the blocks inside. Use the user info block inside",
    );
  },
};

javascriptGenerator.forBlock["github_getTokenUser"] = function (block, generator) {
  const code = generator.statementToCode(block, "code");

  return `await ${request()}("/user", ${token(block, generator)})
  .then(async (githubUserInformation) => {
    if (!githubUserInformation) return;

    ${code}})
  .catch(error => console.error("Error fetching GitHub account:", error));\n`;
};

Blockly.Blocks["github_createIssue"] = {
  init: function () {
    this.appendValueInput("repo")
      .setCheck("String")
      .appendField("create issue in GitHub repository:");
    this.appendValueInput("title").setCheck("String").appendField("title:");
    this.appendValueInput("body").setCheck("String").appendField("description:");
    this.appendValueInput("labels")
      .setCheck(["String", "Array"])
      .appendField("labels (optional):");
    appendToken(this);
    thenBlock(
      this,
      "Opens a new issue, then runs the blocks inside. Use the issue info block inside to get its number or link",
    );
  },
};

javascriptGenerator.forBlock["github_createIssue"] = function (block, generator) {
  const repo = value(block, generator, "repo");
  const title = value(block, generator, "title");
  const body = value(block, generator, "body");
  const labels = value(block, generator, "labels", "[]");
  const code = generator.statementToCode(block, "code");

  return `await ${request()}(${repoUrl(repo)} + "/issues", ${token(block, generator)}, { method: "POST", body: { title: String(${title}), body: String(${body}), labels: ${toList()}(${labels}) } })
  .then(async (githubIssueInformation) => {
    if (!githubIssueInformation) return;

    ${code}})
  .catch(error => console.error("Error creating GitHub issue:", error));\n`;
};

Blockly.Blocks["github_comment"] = {
  init: function () {
    this.appendValueInput("comment")
      .setCheck("String")
      .appendField("comment");
    this.appendValueInput("number")
      .setCheck("Number")
      .appendField("on issue or pull request #");
    this.appendValueInput("repo")
      .setCheck("String")
      .appendField("in GitHub repository:");
    appendToken(this);
    statementBlock(this, "Posts a comment on an issue or pull request");
  },
};

javascriptGenerator.forBlock["github_comment"] = function (block, generator) {
  const repo = value(block, generator, "repo");
  const number = value(block, generator, "number", "0");
  const comment = value(block, generator, "comment");

  return `await ${request()}(${repoUrl(repo)} + "/issues/" + ${number} + "/comments", ${token(block, generator)}, { method: "POST", body: { body: String(${comment}) } })
  .catch(error => console.error("Error commenting on GitHub:", error));\n`;
};

Blockly.Blocks["github_setIssueState"] = {
  init: function () {
    this.appendValueInput("number")
      .setCheck("Number")
      .appendField(
        new Blockly.FieldDropdown([
          ["close", "closed"],
          ["reopen", "open"],
        ]),
        "state",
      )
      .appendField("issue or pull request #");
    this.appendValueInput("repo")
      .setCheck("String")
      .appendField("in GitHub repository:");
    appendToken(this);
    statementBlock(this, "Closes or reopens an issue or pull request");
  },
};

javascriptGenerator.forBlock["github_setIssueState"] = function (
  block,
  generator,
) {
  const repo = value(block, generator, "repo");
  const number = value(block, generator, "number", "0");
  const state = block.getFieldValue("state");

  return `await ${request()}(${repoUrl(repo)} + "/issues/" + ${number}, ${token(block, generator)}, { method: "PATCH", body: { state: "${state}" } })
  .catch(error => console.error("Error updating GitHub issue:", error));\n`;
};

Blockly.Blocks["github_editIssue"] = {
  init: function () {
    this.appendValueInput("items")
      .setCheck(["String", "Array"])
      .appendField(
        new Blockly.FieldDropdown([
          ["add labels", "labels"],
          ["remove label", "removeLabel"],
          ["assign users", "assignees"],
        ]),
        "action",
      );
    this.appendValueInput("number")
      .setCheck("Number")
      .appendField("on issue or pull request #");
    this.appendValueInput("repo")
      .setCheck("String")
      .appendField("in GitHub repository:");
    appendToken(this);
    statementBlock(
      this,
      'Adds labels, removes a label, or assigns people. Give a list, or text like "bug, help wanted"',
    );
  },
};

javascriptGenerator.forBlock["github_editIssue"] = function (block, generator) {
  const repo = value(block, generator, "repo");
  const number = value(block, generator, "number", "0");
  const items = value(block, generator, "items", "[]");
  const action = block.getFieldValue("action");
  const issue = `${repoUrl(repo)} + "/issues/" + ${number}`;

  if (action === "removeLabel")
    return `await Promise.all(${toList()}(${items}).map(label => ${request()}(${issue} + "/labels/" + encodeURIComponent(label), ${token(block, generator)}, { method: "DELETE" })))
  .catch(error => console.error("Error updating GitHub issue:", error));\n`;

  return `await ${request()}(${issue} + "/${action}", ${token(block, generator)}, { method: "POST", body: { ${action}: ${toList()}(${items}) } })
  .catch(error => console.error("Error updating GitHub issue:", error));\n`;
};

Blockly.Blocks["github_mergePullRequest"] = {
  init: function () {
    this.appendValueInput("number")
      .setCheck("Number")
      .appendField("merge pull request #");
    this.appendValueInput("repo")
      .setCheck("String")
      .appendField("in GitHub repository:");
    this.appendDummyInput()
      .appendField("using")
      .appendField(
        new Blockly.FieldDropdown([
          ["merge commit", "merge"],
          ["squash", "squash"],
          ["rebase", "rebase"],
        ]),
        "method",
      );
    appendToken(this);
    this.setInputsInline(false);
    statementBlock(this, "Merges a pull request");
  },
};

javascriptGenerator.forBlock["github_mergePullRequest"] = function (
  block,
  generator,
) {
  const repo = value(block, generator, "repo");
  const number = value(block, generator, "number", "0");
  const method = block.getFieldValue("method");

  return `await ${request()}(${repoUrl(repo)} + "/pulls/" + ${number} + "/merge", ${token(block, generator)}, { method: "PUT", body: { merge_method: "${method}" } })
  .catch(error => console.error("Error merging GitHub pull request:", error));\n`;
};

Blockly.Blocks["github_starRepo"] = {
  init: function () {
    this.appendValueInput("repo")
      .setCheck("String")
      .appendField(
        new Blockly.FieldDropdown([
          ["star", "PUT"],
          ["unstar", "DELETE"],
        ]),
        "method",
      )
      .appendField("GitHub repository:");
    appendToken(this);
    statementBlock(this, "Stars or unstars a repository as the token's account");
  },
};

javascriptGenerator.forBlock["github_starRepo"] = function (block, generator) {
  const repo = value(block, generator, "repo");
  const method = block.getFieldValue("method");

  return `await ${request()}("/user/starred/" + ${repoPath()}(${repo}), ${token(block, generator)}, { method: "${method}" })
  .catch(error => console.error("Error starring GitHub repository:", error));\n`;
};

Blockly.Blocks["github_followUser"] = {
  init: function () {
    this.appendValueInput("username")
      .setCheck("String")
      .appendField(
        new Blockly.FieldDropdown([
          ["follow", "PUT"],
          ["unfollow", "DELETE"],
        ]),
        "method",
      )
      .appendField("GitHub user:");
    appendToken(this);
    statementBlock(this, "Follows or unfollows a user as the token's account");
  },
};

javascriptGenerator.forBlock["github_followUser"] = function (block, generator) {
  const username = value(block, generator, "username");
  const method = block.getFieldValue("method");

  return `await ${request()}("/user/following/" + encodeURIComponent(${username}), ${token(block, generator)}, { method: "${method}" })
  .catch(error => console.error("Error following GitHub user:", error));\n`;
};

Blockly.Blocks["github_createRepo"] = {
  init: function () {
    this.appendValueInput("name")
      .setCheck("String")
      .appendField("create")
      .appendField(
        new Blockly.FieldDropdown([
          ["public", "false"],
          ["private", "true"],
        ]),
        "private",
      )
      .appendField("GitHub repository named:");
    this.appendValueInput("description")
      .setCheck("String")
      .appendField("description:");
    appendToken(this);
    thenBlock(
      this,
      "Creates a repository on the token's account, then runs the blocks inside. Use the repository info block inside",
    );
  },
};

javascriptGenerator.forBlock["github_createRepo"] = function (block, generator) {
  const name = value(block, generator, "name");
  const description = value(block, generator, "description");
  const isPrivate = block.getFieldValue("private");
  const code = generator.statementToCode(block, "code");

  return `await ${request()}("/user/repos", ${token(block, generator)}, { method: "POST", body: { name: String(${name}), description: String(${description}), private: ${isPrivate} } })
  .then(async (githubRepoInformation) => {
    if (!githubRepoInformation) return;

    ${code}})
  .catch(error => console.error("Error creating GitHub repository:", error));\n`;
};

Blockly.Blocks["github_writeFile"] = {
  init: function () {
    this.appendValueInput("path")
      .setCheck("String")
      .appendField("write file:");
    this.appendValueInput("repo")
      .setCheck("String")
      .appendField("in GitHub repository:");
    this.appendValueInput("content")
      .setCheck("String")
      .appendField("with contents:");
    this.appendValueInput("message")
      .setCheck("String")
      .appendField("commit message:");
    appendToken(this);
    statementBlock(
      this,
      "Creates a file, or replaces it if it already exists, as a commit on the default branch",
    );
  },
};

javascriptGenerator.forBlock["github_writeFile"] = function (block, generator) {
  const repo = value(block, generator, "repo");
  const path = value(block, generator, "path");
  const content = value(block, generator, "content");
  const message = value(block, generator, "message", "'Update file'");
  const githubToken = token(block, generator);

  return `await (async () => {
  const githubFileUrl = ${repoUrl(repo)} + "/contents/" + String(${path}).replace(/^\\/+/, "").split("/").map(encodeURIComponent).join("/");
  const githubExistingFile = await ${request()}(githubFileUrl, ${githubToken});

  await ${request()}(githubFileUrl, ${githubToken}, { method: "PUT", body: {
    message: String(${message}) || "Update file",
    content: Buffer.from(String(${content})).toString("base64"),
    ...(githubExistingFile?.sha ? { sha: githubExistingFile.sha } : {})
  } });
})().catch(error => console.error("Error writing GitHub file:", error));\n`;
};

Blockly.Blocks["github_createRelease"] = {
  init: function () {
    this.appendValueInput("tag")
      .setCheck("String")
      .appendField("create release with tag:");
    this.appendValueInput("repo")
      .setCheck("String")
      .appendField("in GitHub repository:");
    this.appendValueInput("name").setCheck("String").appendField("name:");
    this.appendValueInput("body")
      .setCheck("String")
      .appendField("description:");
    appendToken(this);
    thenBlock(
      this,
      "Publishes a release (creating the tag from the default branch if needed), then runs the blocks inside. Use the release info block inside",
    );
  },
};

javascriptGenerator.forBlock["github_createRelease"] = function (
  block,
  generator,
) {
  const repo = value(block, generator, "repo");
  const tag = value(block, generator, "tag");
  const name = value(block, generator, "name");
  const body = value(block, generator, "body");
  const code = generator.statementToCode(block, "code");

  return `await ${request()}(${repoUrl(repo)} + "/releases", ${token(block, generator)}, { method: "POST", body: { tag_name: String(${tag}), name: String(${name}), body: String(${body}) } })
  .then(async (githubReleaseInformation) => {
    if (!githubReleaseInformation) return;

    ${code}})
  .catch(error => console.error("Error creating GitHub release:", error));\n`;
};

Blockly.Blocks["github_runWorkflow"] = {
  init: function () {
    this.appendValueInput("workflow")
      .setCheck("String")
      .appendField("run GitHub Actions workflow file:");
    this.appendValueInput("repo")
      .setCheck("String")
      .appendField("in repository:");
    this.appendValueInput("branch")
      .setCheck("String")
      .appendField("on branch:");
    appendToken(this);
    statementBlock(
      this,
      'Starts a workflow that has "workflow_dispatch" in its triggers, like "deploy.yml"',
    );
  },
};

javascriptGenerator.forBlock["github_runWorkflow"] = function (block, generator) {
  const repo = value(block, generator, "repo");
  const workflow = value(block, generator, "workflow");
  const branch = value(block, generator, "branch", "'main'");

  return `await ${request()}(${repoUrl(repo)} + "/actions/workflows/" + encodeURIComponent(String(${workflow}).split("/").pop()) + "/dispatches", ${token(block, generator)}, { method: "POST", body: { ref: String(${branch}) } })
  .catch(error => console.error("Error running GitHub workflow:", error));\n`;
};

Blockly.Blocks["github_createGist"] = {
  init: function () {
    this.appendValueInput("filename")
      .setCheck("String")
      .appendField("link to new")
      .appendField(
        new Blockly.FieldDropdown([
          ["secret", "false"],
          ["public", "true"],
        ]),
        "public",
      )
      .appendField("GitHub gist with file name:");
    this.appendValueInput("content")
      .setCheck("String")
      .appendField("contents:");
    appendToken(this);
    outputBlock(
      this,
      "String",
      "Creates a gist with one file, and gives back its link — handy for sharing long text",
    );
  },
};

javascriptGenerator.forBlock["github_createGist"] = function (block, generator) {
  const filename = value(block, generator, "filename", "'file.txt'");
  const content = value(block, generator, "content");
  const isPublic = block.getFieldValue("public");

  return [
    `await ${request()}("/gists", ${token(block, generator)}, { method: "POST", body: { public: ${isPublic}, files: { [String(${filename}) || "file.txt"]: { content: String(${content}) } } } }).then(gist => gist?.html_url ?? null).catch(() => null)`,
    Order.AWAIT,
  ];
};

/* ------------------------------------------------------------------ */
/* Where the info blocks can go                                         */
/* ------------------------------------------------------------------ */

createRestrictions(
  ["github_userInfo"],
  [
    {
      type: "hasParent",
      blockTypes: ["github_getUser", "github_getTokenUser"],
      message:
        'This block must be inside a "get GitHub user" or "get GitHub account" block.',
    },
  ],
);

createRestrictions(
  ["github_orgInfo"],
  [
    {
      type: "hasParent",
      blockTypes: ["github_getOrg"],
      message: 'This block must be inside a "get GitHub organization" block.',
    },
  ],
);

createRestrictions(
  ["github_repoInfo"],
  [
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
);

createRestrictions(
  ["github_issueInfo"],
  [
    {
      type: "hasParent",
      blockTypes: [
        "github_getIssue",
        "github_forEachIssue",
        "github_createIssue",
      ],
      message:
        'This block must be inside a "get issue" or "for each issue" block.',
    },
  ],
);

createRestrictions(
  ["github_pullRequestInfo"],
  [
    {
      type: "hasParent",
      blockTypes: ["github_getPullRequest", "github_forEachPullRequest"],
      message:
        'This block must be inside a "get pull request" or "for each pull request" block.',
    },
  ],
);

createRestrictions(
  ["github_commitInfo"],
  [
    {
      type: "hasParent",
      blockTypes: ["github_getCommit", "github_forEachCommit"],
      message:
        'This block must be inside a "get latest commit" or "for each commit" block.',
    },
  ],
);

createRestrictions(
  ["github_releaseInfo"],
  [
    {
      type: "hasParent",
      blockTypes: [
        "github_getRelease",
        "github_forEachRelease",
        "github_createRelease",
      ],
      message:
        'This block must be inside a "get latest release" or "for each release" block.',
    },
  ],
);

createRestrictions(
  ["github_gistInfo"],
  [
    {
      type: "hasParent",
      blockTypes: ["github_getGist"],
      message: 'This block must be inside a "get GitHub gist" block.',
    },
  ],
);
