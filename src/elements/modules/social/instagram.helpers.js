/* Generated from the block editor's instagram blocks: the helper functions
   their code uses, each emitted once at the top of the bot. */

export const HELPERS = {
  /* Instagram has no public API for reading profiles or posts without an
   account, so every Instagram block uses the official Instagram API
   (graph.instagram.com) with an access token for a professional
   (Business or Creator) account. Get one by making an app at
   developers.facebook.com, adding "Instagram API with Instagram Login",
   and generating a token for your account. Tokens last 60 days; the bot
   refreshes its copy every day while it is running.

   The API works on the logged-in account: its profile, its posts, the
   comments on them, and publishing new photos, reels and stories. 

/** Calls the Instagram API with the token from "log in to Instagram". */
  instagramApi: {
    key: "instagramApi",
    code: `async function instagramApi(method, path, params = {}) {
  const login = globalThis.instagramLogin;
  if (!login?.token) {
    console.error('Instagram: use "log in to Instagram" (in "when the bot is logged in") before using Instagram blocks.');
    return null;
  }

  const query = new URLSearchParams({ access_token: login.token });
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    query.append(key, String(value));
  }

  const res = await fetch("https://graph.instagram.com/" + path + "?" + query, { method });
  const json = await res.json().catch(async () => null);
  if (!res.ok || json?.error) {
    console.error("Instagram API error (" + res.status + "):", json?.error?.message || json);
    return null;
  }
  return json;
}`,
  },
  /* Turns a post ID or link into the media ID (links only work for the logged-in account's posts). */
  instagramMediaId: {
    key: "instagramMediaId",
    code: `async function instagramMediaId(post) {
  const text = String(post ?? "").trim();
  if (/^\\d+$/.test(text)) return text;
  const shortcode = (text.match(/instagram\\.com\\/(?:[^/]+\\/)?(?:p|reel|reels|tv)\\/([A-Za-z0-9_-]+)/) || [])[1];
  if (!shortcode) return null;

  let path = "me/media";
  let params = { fields: "id,shortcode,permalink", limit: 100 };
  for (let page = 0; page < 5 && path; page++) {
    const json = await instagramApi("GET", path, params);
    const found = (json?.data || []).find(item => item.shortcode === shortcode || String(item.permalink).includes("/" + shortcode));
    if (found) return found.id;
    const next = json?.paging?.cursors?.after;
    params = next && json?.paging?.next ? { ...params, after: next } : null;
    if (!params) path = null;
  }
  console.error("Instagram: couldn't find that post on your account. Use the post's ID instead.");
  return null;
}`,
  },
  /* Turns an Instagram media object into the shape the post info block reads. */
  instagramPostShape: {
    key: "instagramPostShape",
    code: `function instagramPostShape(post) {
  const type = post.media_product_type === "REELS" ? "reel"
    : post.media_product_type === "STORY" ? "story"
    : ({ IMAGE: "photo", VIDEO: "video", CAROUSEL_ALBUM: "carousel" })[post.media_type] || String(post.media_type || "").toLowerCase();

  return {
    id: post.id,
    caption: post.caption ?? "",
    type,
    url: post.permalink ?? null,
    shortcode: post.shortcode ?? null,
    mediaUrl: post.media_url ?? null,
    thumbnailUrl: post.thumbnail_url || post.media_url || null,
    createdAt: post.timestamp ? new Date(post.timestamp) : null,
    likes: post.like_count ?? null,
    comments: post.comments_count ?? null,
    username: post.username ?? null
  };
}`,
  },
  /* The logged-in account's latest posts, newest first. */
  instagramPosts: {
    key: "instagramPosts",
    code: `async function instagramPosts(count = 25) {
  const json = await instagramApi("GET", "me/media", { fields: "id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,shortcode,timestamp,like_count,comments_count,username", limit: Math.min(100, Math.max(1, Number(count) || 25)) });
  return (json?.data || []).map(instagramPostShape);
}`,
  },
  instagramPost: {
    key: "instagramPost",
    code: `async function instagramPost(post) {
  const id = await instagramMediaId(post);
  if (!id) return null;
  const json = await instagramApi("GET", id, { fields: "id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,shortcode,timestamp,like_count,comments_count,username" });
  return json ? instagramPostShape(json) : null;
}`,
  },
  instagramAccount: {
    key: "instagramAccount",
    code: `async function instagramAccount() {
  const json = await instagramApi("GET", "me", { fields: "id,user_id,username,name,account_type,profile_picture_url,followers_count,follows_count,media_count,biography,website" });
  if (!json) return null;
  return {
    id: json.user_id ?? json.id,
    username: json.username,
    name: json.name ?? null,
    bio: json.biography ?? "",
    website: json.website || null,
    url: "https://www.instagram.com/" + json.username + "/",
    avatarUrl: json.profile_picture_url ?? null,
    followers: json.followers_count ?? null,
    following: json.follows_count ?? null,
    posts: json.media_count ?? null,
    accountType: json.account_type ?? null
  };
}`,
  },
};

/** Every helper, for a step's `setup` (unused ones are harmless but are left out by the caller). */
export const ALL_HELPERS = Object.values(HELPERS);
