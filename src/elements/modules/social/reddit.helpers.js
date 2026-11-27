/* Generated from the block editor's reddit blocks: the helper functions
   their code uses, each emitted once at the top of the bot. */

export const HELPERS = {
  /* Everything above the "log in" line in the toolbox works without an
   account: it reads Reddit's public JSON (reddit.com/r/memes.json and so
   on). Reddit sometimes refuses that JSON to servers, so post lists fall
   back to Reddit's public RSS feeds, which always work but don't include
   scores or comment counts.

   The "log in to Reddit" block is optional for reading: once it has run,
   every Reddit block goes through Reddit's official API with the app's
   credentials instead, which is more reliable. Posting, replying and
   messaging act as an account, so those need it (with a username and
   password). 

const USER_AGENT = "DisFuse-Bot/1.0 (Discord bot made with disfuse.xyz)";

/** Gets (and caches) an OAuth token when "log in to Reddit" has run. */
  redditToken: {
    key: "redditToken",
    code: `async function redditToken() {
  const login = globalThis.redditLogin;
  if (!login) return null;
  if (login.token && login.expires > Date.now()) return login.token;

  const body = login.username
    ? new URLSearchParams({ grant_type: "password", username: login.username, password: login.password })
    : new URLSearchParams({ grant_type: "client_credentials" });

  const json = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(login.clientId + ":" + login.clientSecret).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "DisFuse-Bot/1.0 (Discord bot made with disfuse.xyz)"
    },
    body
  }).then(async (res) => res.json()).catch(async () => null);

  if (!json?.access_token) {
    console.error("Couldn't log in to Reddit:", json?.error || json?.message || "no response");
    return null;
  }

  login.token = json.access_token;
  login.expires = Date.now() + (json.expires_in - 60) * 1000;
  return login.token;
}`,
  },
  /* Sends a request to Reddit: with the login if there is one, otherwise to the public JSON. */
  redditRequest: {
    key: "redditRequest",
    code: `async function redditRequest(path, params = {}, options = {}) {
  const accessToken = await redditToken();
  const query = new URLSearchParams({ raw_json: "1", ...params });

  /* After Reddit refuses the public JSON once, blocks that can fall back
     to RSS skip it for a while, so they don't use up the rate limit. */
  if (!accessToken && options.quiet && globalThis.redditJsonBlockedUntil > Date.now()) return null;

  const url = accessToken
    ? "https://oauth.reddit.com" + path + "?" + query
    : "https://www.reddit.com" + path + ".json?" + query;

  const res = await fetch(url, {
    method: options.method || "GET",
    headers: {
      "User-Agent": "DisFuse-Bot/1.0 (Discord bot made with disfuse.xyz)",
      ...(accessToken ? { Authorization: "Bearer " + accessToken } : {}),
      ...(options.form ? { "Content-Type": "application/x-www-form-urlencoded" } : {})
    },
    body: options.form ? new URLSearchParams({ api_type: "json", ...options.form }) : undefined
  }).catch(async () => null);

  if (!res) return null;
  if (res.status === 403 && !accessToken) globalThis.redditJsonBlockedUntil = Date.now() + 10 * 60 * 1000;
  if (!res.ok) {
    if (res.status !== 404 && !options.quiet) console.error("Reddit error (" + res.status + ") for " + path + (res.status === 403 && !accessToken ? ". Reddit may be blocking requests without a login: try the \\"log in to Reddit\\" block." : ""));
    return null;
  }

  return res.json().catch(async () => null);
}`,
  },
  /* Turns a Reddit post (from the JSON API) into a flat object. */
  redditPost: {
    key: "redditPost",
    code: `function redditPost(post) {
  const preview = post.preview?.images?.[0]?.source?.url;
  const gallery = post.media_metadata ? Object.values(post.media_metadata).map(item => item.s?.u || item.s?.gif).filter(Boolean) : [];
  const isImage = /\\.(png|jpe?g|gif|webp)(\\?.*)?$/i.test(post.url || "") || post.post_hint === "image";

  return {
    id: post.id,
    title: post.title,
    text: post.selftext || "",
    url: "https://www.reddit.com" + post.permalink,
    link: post.url_overridden_by_dest || post.url || null,
    imageUrl: isImage ? post.url : (gallery[0] || preview || null),
    author: post.author,
    subreddit: post.subreddit,
    score: post.score,
    upvoteRatio: post.upvote_ratio,
    comments: post.num_comments,
    createdAt: new Date(post.created_utc * 1000),
    nsfw: !!post.over_18,
    spoiler: !!post.spoiler,
    pinned: !!post.stickied,
    isVideo: !!post.is_video,
    isText: !!post.is_self,
    flair: post.link_flair_text || null,
    awards: post.total_awards_received ?? 0,
    thumbnailUrl: /^https?:/.test(post.thumbnail || "") ? post.thumbnail : (preview || null)
  };
}`,
  },
  /* Downloads an RSS feed, waiting and trying once more if Reddit says "too many requests". */
  redditRssText: {
    key: "redditRssText",
    code: `async function redditRssText(url) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": "DisFuse-Bot/1.0 (Discord bot made with disfuse.xyz)" } }).catch(async () => null);
    if (res?.ok) return res.text();
    if (res?.status !== 429) break;
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  return "";
}`,
  },
  /* Reads a public RSS feed of posts, for when Reddit refuses the JSON. */
  redditRss: {
    key: "redditRss",
    code: `async function redditRss(path, params = {}) {
  const xml = await redditRssText("https://www.reddit.com" + path + ".rss?" + new URLSearchParams(params));

  const decode = (value) => String(value ?? "")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&#32;/g, " ").replace(/&amp;/g, "&");
  const tag = (source, name) => decode((source.match(new RegExp("<" + name + "(?:\\\\s[^>]*)?>([\\\\s\\\\S]*?)</" + name + ">")) || [])[1]);

  return (xml.match(/<entry>[\\s\\S]*?<\\/entry>/g) || []).map(entry => {
    const content = decode(tag(entry, "content"));
    const url = decode((entry.match(/<link href="([^"]+)"/) || [])[1]);
    const link = (content.match(/<a href="([^"]+)">\\[link\\]<\\/a>/) || [])[1] || url;
    const thumbnail = decode((entry.match(/<media:thumbnail url="([^"]+)"/) || [])[1]) || null;
    const isImage = /\\.(png|jpe?g|gif|webp)(\\?.*)?$/i.test(link);
    const text = (content.match(/<div class="md">([\\s\\S]*?)<\\/div>/) || [])[1] || "";

    return {
      id: tag(entry, "id").replace(/^t3_/, ""),
      title: tag(entry, "title"),
      text: decode(text.replace(/<br\\s*\\/?>/g, "\\n").replace(/<\\/p>\\s*<p>/g, "\\n\\n").replace(/<[^>]+>/g, "")).trim(),
      url,
      link,
      imageUrl: isImage ? link : thumbnail,
      author: tag(tag(entry, "author"), "name").replace(/^\\/u\\//, ""),
      subreddit: (entry.match(/<category term="([^"]+)"/) || [])[1] || null,
      score: null,
      upvoteRatio: null,
      comments: null,
      createdAt: new Date(tag(entry, "published") || tag(entry, "updated")),
      nsfw: null,
      spoiler: null,
      pinned: null,
      isVideo: /v\\.redd\\.it/.test(link),
      isText: link === url,
      flair: null,
      awards: null,
      thumbnailUrl: thumbnail
    };
  }).filter(post => post.id);
}`,
  },
  /* A list of posts: the JSON if Reddit allows it, the RSS feed if not. */
  redditPosts: {
    key: "redditPosts",
    code: `async function redditPosts(path, params = {}) {
  const json = await redditRequest(path, params, { quiet: true });
  if (json?.data?.children) return json.data.children.filter(child => child.kind === "t3").map(child => redditPost(child.data));
  if (globalThis.redditLogin) return [];
  return redditRss(path, params);
}`,
  },
  /* "r/memes", "memes", or a reddit.com link → "memes". 
const subredditName = (subreddit) =>
  `String(${subreddit}).trim().replace(/^(https?:\\/\\/)?(www\\.|old\\.|new\\.)?reddit\\.com\\//i, "").replace(/^\\/?r\\//i, "").split(/[/?#]/)[0]`;

/** "u/spez", "spez", or a reddit.com link → "spez". 
const userName = (user) =>
  `String(${user}).trim().replace(/^(https?:\\/\\/)?(www\\.|old\\.|new\\.)?reddit\\.com\\//i, "").replace(/^\\/?(u|user)\\//i, "").split(/[/?#]/)[0]`;

/** A post or comment link (or ID) → its "fullname" like t3_abc123 / t1_def456. */
  redditThingId: {
    key: "redditThingId",
    code: `function redditThingId(thing) {
  const text = String(thing ?? "").trim();
  if (/^t[13]_[a-z0-9]+$/i.test(text)) return text;
  const match = text.match(/\\/comments\\/([a-z0-9]+)(?:\\/[^/]*\\/([a-z0-9]+))?/i);
  if (match) return match[2] ? "t1_" + match[2] : "t3_" + match[1];
  const short = text.match(/redd\\.it\\/([a-z0-9]+)/i);
  if (short) return "t3_" + short[1];
  return "t3_" + text;
}`,
  },
  /* "top:week" → a path ending and query parameters. 
function sortOf(sort) {
  const [name, time] = sort.split(":");
  return { name, params: time ? `, t: "${time}"` : "" };
}

const value = (block, generator, name, fallback = "''") =>
  generator.valueToCode(block, name, Order.NONE) || fallback;

const limitOf = (block, generator, name, fallback = "10") =>
  `String(Math.min(100, Math.max(1, Number(${value(block, generator, name, fallback)}) || ${fallback})))`;

/** Common shape for a statement block with a "then"/"do" section. 
function wrapperBlock(block, tooltip, word = "then") {
  block.setInputsInline(false);
  block.appendStatementInput("code").appendField(word).setCheck("default");
  block.setPreviousStatement(true, "default");
  block.setNextStatement(true, "default");
  block.setColour(colour);
  block.setTooltip(tooltip);
}

/** Common shape for a plain statement block. 
function statementBlock(block, tooltip) {
  block.setInputsInline(false);
  block.setPreviousStatement(true, "default");
  block.setNextStatement(true, "default");
  block.setColour(colour);
  block.setTooltip(tooltip);
}

/** Common shape for a reporter block. 
function outputBlock(block, output, tooltip) {
  block.setOutput(true, output);
  block.setColour(colour);
  block.setTooltip(tooltip);
}

/** A "get [property] of X" block, reading the variable a getter defined. 
function infoBlock(type, variable, noun, options, tooltip) {
  Blockly.Blocks[type] = {
    init: function () {
      this.appendDummyInput()
        .appendField("get")
        .appendField(new Blockly.FieldDropdown(options), "info")
        .appendField(`of Reddit ${noun}`);
      outputBlock(this, null, tooltip || `Information about the Reddit ${noun} you got`);
    },
  };

  javascriptGenerator.forBlock[type] = function (block) {
    const info = block.getFieldValue("info");
    return [`${variable}.${info}`, Order.MEMBER];
  };
}

/** A loop over a list of posts. 
function postLoop(listCode, code) {
  return `for (const redditPostInformation of await ${listCode}.catch(async (error) => { console.error("Error fetching Reddit posts:", error); return []; })) {
  ${code}}\n`;
}

/* ------------------------------------------------------------------ 
/* Subreddits                                                           
/* ------------------------------------------------------------------ */
  redditSubreddit: {
    key: "redditSubreddit",
    code: `async function redditSubreddit(name) {
  const json = await redditRequest("/r/" + encodeURIComponent(name) + "/about");
  const sub = json?.data;
  if (!sub || json.kind !== "t5") return null;

  const clean = (url) => url ? String(url).split("?")[0] || null : null;

  return {
    name: sub.display_name,
    title: sub.title,
    description: sub.public_description || "",
    sidebar: sub.description || "",
    members: sub.subscribers ?? 0,
    online: sub.active_user_count ?? sub.accounts_active ?? null,
    createdAt: new Date(sub.created_utc * 1000),
    nsfw: !!sub.over18,
    type: sub.subreddit_type,
    iconUrl: clean(sub.community_icon) || clean(sub.icon_img),
    bannerUrl: clean(sub.banner_background_image) || clean(sub.banner_img),
    colour: sub.primary_color || sub.key_color || null,
    url: "https://www.reddit.com" + sub.url,
    id: sub.id
  };
}`,
  },
  /* ------------------------------------------------------------------ 
/* Posts                                                                
/* ------------------------------------------------------------------ 

Blockly.Blocks["reddit_forEachPost"] = {
  init: function () {
    this.appendValueInput("subreddit")
      .setCheck("String")
      .appendField("for each")
      .appendField(new Blockly.FieldDropdown(SORTS), "sort")
      .appendField("post in subreddit:");
    this.appendValueInput("limit")
      .setCheck("Number")
      .appendField("max posts (1-100):");
    wrapperBlock(
      this,
      'Runs the blocks inside once for each post. Use "get ... of Reddit post" inside it.',
      "do",
    );
  },
};

javascriptGenerator.forBlock["reddit_forEachPost"] = function (block, generator) {
  const subreddit = value(block, generator, "subreddit");
  const { name, params } = sortOf(block.getFieldValue("sort"));
  const limit = limitOf(block, generator, "limit");
  const code = generator.statementToCode(block, "code");

  return postLoop(
    `${postsOf()}("/r/" + encodeURIComponent(${subredditName(subreddit)}) + "/${name}", { limit: ${limit}${params} })`,
    code,
  );
};

Blockly.Blocks["reddit_getRandomPost"] = {
  init: function () {
    this.appendValueInput("subreddit")
      .setCheck("String")
      .appendField("get random")
      .appendField(
        new Blockly.FieldDropdown([
          ["post", "any"],
          ["image post", "image"],
          ["text post", "text"],
        ]),
        "kind",
      )
      .appendField("from subreddit:");
    this.appendDummyInput()
      .appendField("allow NSFW")
      .appendField(new Blockly.FieldCheckbox("FALSE"), "nsfw");
    wrapperBlock(
      this,
      "Picks a random post from the subreddit's hot posts, then runs the blocks inside. Great for meme commands. Pinned posts are skipped.",
    );
  },
};

javascriptGenerator.forBlock["reddit_getRandomPost"] = function (
  block,
  generator,
) {
  const subreddit = value(block, generator, "subreddit");
  const kind = block.getFieldValue("kind");
  const nsfw = block.getFieldValue("nsfw") === "TRUE";
  const code = generator.statementToCode(block, "code");

  const filters = [
    "!post.pinned",
    ...(nsfw ? [] : ["post.nsfw !== true"]),
    ...(kind === "image" ? ["!!post.imageUrl", "!post.isVideo", "!post.isText"] : []),
    ...(kind === "text" ? ["post.isText"] : []),
  ].join(" && ");

  return `await ${postsOf()}("/r/" + encodeURIComponent(${subredditName(subreddit)}) + "/hot", { limit: "100" })
  .then(async (posts) => {
    const choices = posts.filter(post => ${filters});
    const redditPostInformation = choices[Math.floor(Math.random() * choices.length)];
    if (!redditPostInformation) return;

    ${code}})
  .catch(async (error) => console.error("Error fetching Reddit posts:", error));\n`;
};

Blockly.Blocks["reddit_getPost"] = {
  init: function () {
    this.appendValueInput("post")
      .setCheck("String")
      .appendField("get Reddit post (link or ID):");
    wrapperBlock(this, "Looks up a Reddit post, then runs the blocks inside");
  },
};

javascriptGenerator.forBlock["reddit_getPost"] = function (block, generator) {
  const post = value(block, generator, "post");
  const code = generator.statementToCode(block, "code");

  return `await (async () => {
    const id = ${thingId()}(${post}).replace(/^t[13]_/, "");
    const json = await ${request()}("/comments/" + id, { limit: "1" }, { quiet: true });
    const post = Array.isArray(json) ? json[0]?.data?.children?.[0]?.data : null;
    if (post) return ${postOf()}(post);
    if (globalThis.redditLogin) return null;
    return (await ${rssOf()}("/comments/" + id))[0] ?? null;
  })()
  .then(async (redditPostInformation) => {
    if (!redditPostInformation) return;

    ${code}})
  .catch(async (error) => console.error("Error fetching Reddit post:", error));\n`;
};

Blockly.Blocks["reddit_searchPosts"] = {
  init: function () {
    this.appendValueInput("query")
      .setCheck("String")
      .appendField("for each Reddit post found searching:");
    this.appendValueInput("subreddit")
      .setCheck("String")
      .appendField("in subreddit (empty for all of Reddit):");
    this.appendDummyInput()
      .appendField("sorted by")
      .appendField(
        new Blockly.FieldDropdown([
          ["relevance", "relevance"],
          ["new", "new"],
          ["top", "top"],
          ["most comments", "comments"],
        ]),
        "sort",
      );
    this.appendValueInput("limit")
      .setCheck("Number")
      .appendField("max posts (1-100):");
    wrapperBlock(
      this,
      'Searches Reddit and runs the blocks inside once for each post found. Use "get ... of Reddit post" inside it.',
      "do",
    );
  },
};

javascriptGenerator.forBlock["reddit_searchPosts"] = function (
  block,
  generator,
) {
  const query = value(block, generator, "query");
  const subreddit = value(block, generator, "subreddit");
  const sort = block.getFieldValue("sort");
  const limit = limitOf(block, generator, "limit");
  const code = generator.statementToCode(block, "code");

  return postLoop(
    `(async () => {
    const subreddit = ${subredditName(subreddit)};
    return ${postsOf()}((subreddit ? "/r/" + encodeURIComponent(subreddit) : "") + "/search", { q: String(${query}), sort: "${sort}", limit: ${limit}, ...(subreddit ? { restrict_sr: "1" } : {}) });
  })()`,
    code,
  );
};

Blockly.Blocks["reddit_onNewPost"] = {
  init: function () {
    this.appendValueInput("subreddit")
      .setCheck("String")
      .appendField("when a new post is made in subreddit:");
    this.appendValueInput("minutes")
      .setCheck("Number")
      .appendField("check every (minutes):");
    this.appendStatementInput("code").setCheck("default");
    this.setInputsInline(false);
    this.setColour(colour);
    this.setTooltip(
      'Runs for every new post in a subreddit — great for feeds in a Discord channel. Use "get ... of Reddit post" inside it. The subreddit is checked every few minutes (at least 1).',
    );
  },
};

javascriptGenerator.forBlock["reddit_onNewPost"] = function (block, generator) {
  const subreddit = value(block, generator, "subreddit");
  const minutes = value(block, generator, "minutes", "5");
  const code = generator.statementToCode(block, "code");

  return `(() => {
  let seenPosts = null;
  const check = async () => {
    try {
      const posts = await ${postsOf()}("/r/" + encodeURIComponent(${subredditName(subreddit)}) + "/new", { limit: "25" });
      if (!posts.length) return;

      if (!seenPosts) {
        seenPosts = new Set(posts.map(post => post.id));
        return;
      }

      for (const redditPostInformation of posts.filter(post => !seenPosts.has(post.id)).reverse()) {
        seenPosts.add(redditPostInformation.id);
        ${code}}
    } catch (error) {
      console.error("Error checking Reddit:", error);
    }
  };
  setTimeout(check, 5000);
  setInterval(check, Math.max(1, Number(${minutes}) || 5) * 60 * 1000);
})();\n`;
};

infoBlock(
  "reddit_postInfo",
  "redditPostInformation",
  "post",
  [
    ["title", "title"],
    ["text", "text"],
    ["link to post", "url"],
    ["linked URL", "link"],
    ["image URL", "imageUrl"],
    ["thumbnail URL", "thumbnailUrl"],
    ["author", "author"],
    ["subreddit", "subreddit"],
    ["score (upvotes)", "score"],
    ["upvote ratio", "upvoteRatio"],
    ["comment count", "comments"],
    ["post date", "createdAt"],
    ["flair", "flair"],
    ["is NSFW", "nsfw"],
    ["is spoiler", "spoiler"],
    ["is pinned", "pinned"],
    ["is a video", "isVideo"],
    ["is a text post", "isText"],
    ["ID", "id"],
  ],
  "Information about the Reddit post you got. If Reddit only allowed its RSS feed, score, comment count, NSFW and flair are null.",
);

/* ------------------------------------------------------------------ 
/* Comments                                                             
/* ------------------------------------------------------------------ 

Blockly.Blocks["reddit_forEachComment"] = {
  init: function () {
    this.appendValueInput("post")
      .setCheck("String")
      .appendField("for each")
      .appendField(
        new Blockly.FieldDropdown([
          ["best", "confidence"],
          ["top", "top"],
          ["new", "new"],
          ["controversial", "controversial"],
        ]),
        "sort",
      )
      .appendField("comment on Reddit post (link or ID):");
    this.appendValueInput("limit")
      .setCheck("Number")
      .appendField("max comments (1-100):");
    wrapperBlock(
      this,
      'Runs the blocks inside once for each top-level comment on a post. Use "get ... of Reddit comment" inside it.',
      "do",
    );
  },
};

/** The top-level comments on a post: the JSON if Reddit allows it, the RSS feed if not. */
  redditComments: {
    key: "redditComments",
    code: `async function redditComments(post, sort, limit) {
  const id = redditThingId(post).replace(/^t[13]_/, "");
  const json = await redditRequest("/comments/" + id, { sort, limit: String(limit), depth: "1" }, { quiet: true });

  if (Array.isArray(json)) {
    return (json[1]?.data?.children ?? [])
      .filter(child => child.kind === "t1")
      .slice(0, limit)
      .map(({ data }) => ({
        id: data.id,
        text: data.body,
        author: data.author,
        score: data.score,
        replies: data.replies?.data?.children?.filter(child => child.kind === "t1").length ?? 0,
        createdAt: new Date(data.created_utc * 1000),
        url: "https://www.reddit.com" + data.permalink,
        isOp: !!data.is_submitter,
        pinned: !!data.stickied
      }));
  }

  if (globalThis.redditLogin) return [];

  /* The RSS feed lists the post first, then its comments (replies too). */
  const xml = await redditRssText("https://www.reddit.com/comments/" + id + ".rss?" + new URLSearchParams({ sort, limit: String(limit), depth: "1" }));

  const decode = (value) => String(value ?? "")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&#32;/g, " ").replace(/&amp;/g, "&");
  const tag = (source, name) => decode((source.match(new RegExp("<" + name + "(?:\\\\s[^>]*)?>([\\\\s\\\\S]*?)</" + name + ">")) || [])[1]);

  return (xml.match(/<entry>[\\s\\S]*?<\\/entry>/g) || [])
    .filter(entry => /<id>t1_/.test(entry))
    .slice(0, limit)
    .map(entry => {
      const content = decode(tag(entry, "content"));
      const text = (content.match(/<div class="md">([\\s\\S]*?)<\\/div>/) || [])[1] || content;

      return {
        id: tag(entry, "id").replace(/^t1_/, ""),
        text: decode(text.replace(/<br\\s*\\/?>/g, "\\n").replace(/<\\/p>\\s*<p>/g, "\\n\\n").replace(/<[^>]+>/g, "")).trim(),
        author: tag(tag(entry, "author"), "name").replace(/^\\/u\\//, ""),
        score: null,
        replies: null,
        createdAt: new Date(tag(entry, "updated")),
        url: decode((entry.match(/<link href="([^"]+)"/) || [])[1]),
        isOp: null,
        pinned: null
      };
    });
}`,
  },
  /* ------------------------------------------------------------------ 
/* Users                                                                
/* ------------------------------------------------------------------ */
  redditUser: {
    key: "redditUser",
    code: `async function redditUser(name) {
  const json = await redditRequest("/user/" + encodeURIComponent(name) + "/about");
  const user = json?.data;
  if (!user || json.kind !== "t2") return null;

  return {
    name: user.name,
    id: user.id,
    karma: user.total_karma ?? ((user.link_karma ?? 0) + (user.comment_karma ?? 0)),
    postKarma: user.link_karma ?? 0,
    commentKarma: user.comment_karma ?? 0,
    createdAt: new Date(user.created_utc * 1000),
    avatarUrl: user.icon_img ? String(user.icon_img).split("?")[0] : (user.snoovatar_img || null),
    bio: user.subreddit?.public_description || "",
    verified: !!user.has_verified_email,
    premium: !!user.is_gold,
    moderator: !!user.is_mod,
    employee: !!user.is_employee,
    url: "https://www.reddit.com/user/" + user.name
  };
}`,
  },
  /* ------------------------------------------------------------------ 
/* Quick info                                                           
/* ------------------------------------------------------------------ 

Blockly.Blocks["reddit_subredditExists"] = {
  init: function () {
    this.appendValueInput("subreddit")
      .setCheck("String")
      .appendField("subreddit:");
    this.appendDummyInput().appendField("exists?");
    this.setInputsInline(true);
    outputBlock(this, "Boolean", "Checks whether a subreddit exists and is public");
  },
};

javascriptGenerator.forBlock["reddit_subredditExists"] = function (
  block,
  generator,
) {
  const subreddit = value(block, generator, "subreddit");
  return [
    `await ${subredditAbout()}(${subredditName(subreddit)}).then(async (sub) => !!sub).catch(async () => false)`,
    Order.AWAIT,
  ];
};

Blockly.Blocks["reddit_memberCount"] = {
  init: function () {
    this.appendValueInput("subreddit")
      .setCheck("String")
      .appendField("member count of subreddit:");
    outputBlock(this, "Number", "How many members a subreddit has");
  },
};

javascriptGenerator.forBlock["reddit_memberCount"] = function (
  block,
  generator,
) {
  const subreddit = value(block, generator, "subreddit");
  return [
    `await ${subredditAbout()}(${subredditName(subreddit)}).then(async (sub) => sub?.members ?? null).catch(async () => null)`,
    Order.AWAIT,
  ];
};

Blockly.Blocks["reddit_userExists"] = {
  init: function () {
    this.appendValueInput("user")
      .setCheck("String")
      .appendField("Reddit user:");
    this.appendDummyInput().appendField("exists?");
    this.setInputsInline(true);
    outputBlock(this, "Boolean", "Checks whether a Reddit account exists (and isn't suspended)");
  },
};

javascriptGenerator.forBlock["reddit_userExists"] = function (block, generator) {
  const user = value(block, generator, "user");
  return [
    `await ${userAbout()}(${userName(user)}).then(async (user) => !!user).catch(async () => false)`,
    Order.AWAIT,
  ];
};

Blockly.Blocks["reddit_userKarma"] = {
  init: function () {
    this.appendValueInput("user")
      .setCheck("String")
      .appendField("karma of Reddit user:");
    outputBlock(this, "Number", "A Reddit user's total karma");
  },
};

javascriptGenerator.forBlock["reddit_userKarma"] = function (block, generator) {
  const user = value(block, generator, "user");
  return [
    `await ${userAbout()}(${userName(user)}).then(async (user) => user?.karma ?? null).catch(async () => null)`,
    Order.AWAIT,
  ];
};

Blockly.Blocks["reddit_postList"] = {
  init: function () {
    this.appendValueInput("subreddit")
      .setCheck("String")
      .appendField("list of")
      .appendField(
        new Blockly.FieldDropdown([
          ["titles", "title"],
          ["links", "url"],
          ["image URLs", "imageUrl"],
        ]),
        "pick",
      )
      .appendField("of")
      .appendField(new Blockly.FieldDropdown(SORTS), "sort")
      .appendField("posts in subreddit:");
    this.appendValueInput("limit")
      .setCheck("Number")
      .appendField("max posts (1-100):");
    outputBlock(this, "Array", "A list made from a subreddit's posts");
  },
};

javascriptGenerator.forBlock["reddit_postList"] = function (block, generator) {
  const subreddit = value(block, generator, "subreddit");
  const pick = block.getFieldValue("pick");
  const { name, params } = sortOf(block.getFieldValue("sort"));
  const limit = limitOf(block, generator, "limit");

  return [
    `await ${postsOf()}("/r/" + encodeURIComponent(${subredditName(subreddit)}) + "/${name}", { limit: ${limit}${params} }).then(async (posts) => posts.map(post => post.${pick}).filter(item => item != null)).catch(async () => [])`,
    Order.AWAIT,
  ];
};

/* ------------------------------------------------------------------ 
/* Logged in                                                            
/* ------------------------------------------------------------------ 

Blockly.Blocks["reddit_login"] = {
  init: function () {
    this.appendDummyInput().appendField("log in to Reddit");
    this.appendValueInput("clientId").setCheck(null).appendField("app client ID:");
    this.appendValueInput("clientSecret")
      .setCheck(null)
      .appendField("app secret:");
    this.appendValueInput("username")
      .setCheck(null)
      .appendField("username (only for posting):");
    this.appendValueInput("password")
      .setCheck(null)
      .appendField("password (only for posting):");
    statementBlock(
      this,
      'Makes every Reddit block use Reddit\'s official API, which is more reliable. Create a "script" app at reddit.com/prefs/apps for the client ID and secret. Add a username and password to post, reply and send messages as that account. Put this in "when the bot is logged in".',
    );
  },
};

javascriptGenerator.forBlock["reddit_login"] = function (block, generator) {
  const clientId = value(block, generator, "clientId");
  const clientSecret = value(block, generator, "clientSecret");
  const username = value(block, generator, "username");
  const password = value(block, generator, "password");

  return `globalThis.redditLogin = { clientId: String(${clientId} ?? ""), clientSecret: String(${clientSecret} ?? ""), username: ${username} ? String(${username}) : null, password: String(${password} ?? "") };
await ${token()}();\n`;
};

/** Reports why an account action failed, if it did. */
  redditAction: {
    key: "redditAction",
    code: `async function redditAction(path, form) {
  if (!globalThis.redditLogin?.username) {
    console.error('Reddit: use "log in to Reddit" with a username and password before posting.');
    return null;
  }
  const json = await redditRequest(path, {}, { method: "POST", form });
  const errors = json?.json?.errors;
  if (errors?.length) {
    console.error("Reddit error:", errors.map(error => error.join(" ")).join(", "));
    return null;
  }
  return json?.json?.data ?? json;
}`,
  },
};

/** Every helper, for a step's `setup` (unused ones are harmless but are left out by the caller). */
export const ALL_HELPERS = Object.values(HELPERS);
