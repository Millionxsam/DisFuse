import { block, label, shadow } from "../helpers.js";
import websockets from "./websockets.js";

const githubText = (text) => shadow("text", { fields: { TEXT: text } });

/** A token input, pre-filled with "get secret GITHUB_TOKEN". */
const githubToken = () => ({
  block: block("main_env", {
    inputs: { value: { shadow: githubText("GITHUB_TOKEN") } },
  }),
});

/** A secret input, pre-filled with "get secret NAME". */
const secret = (name) => ({
  block: block("main_env", {
    inputs: { value: { shadow: githubText(name) } },
  }),
});

const num = (value) => ({
  shadow: shadow("math_number", { fields: { NUM: value } }),
});

/** Integrations with things that aren't Discord: Scratch, Roblox, Minecraft, YouTube, Reddit, GitHub, captchas, HTTP, WebSockets, canvas. */
export default {
  kind: "category",
  name: "Apps / Utils",
  colour: "#0fbd8c",
  contents: [
    {
      kind: "category",
      name: "Scratch",
      colour: "#e6a53e",
      contents: [
        block("scratch_getprofile", {
          inputs: {
            username: { shadow: shadow("text") },
          },
        }),
        block("scratch_getprofileinfo"),
        block("scratch_getmessages", {
          inputs: {
            username: { shadow: shadow("text") },
          },
        }),
      ],
    },
    {
      kind: "category",
      name: "Roblox",
      colour: "#e2231a",
      contents: [
        label("No API key needed, all of this is public info ↓"),
        label("----------------------------------------------"),
        label("Get a user first, then use the info block ↓"),
        block("roblox_getUser", {
          inputs: {
            username: {
              shadow: shadow("text", { fields: { TEXT: "Roblox" } }),
            },
          },
        }),
        block("roblox_userInfo"),
        label("----------------------------------------------"),
        label("Quick user info (no need to get the user first) ↓"),
        block("roblox_userId", {
          inputs: {
            username: { shadow: shadow("text") },
          },
        }),
        block("roblox_userAvatar", {
          inputs: {
            username: { shadow: shadow("text") },
          },
        }),
        block("roblox_profileLink", {
          inputs: {
            username: { shadow: shadow("text") },
          },
        }),
        block("roblox_userThumbnail", {
          inputs: {
            username: { shadow: shadow("text") },
          },
        }),
        block("roblox_userList", {
          inputs: {
            username: { shadow: shadow("text") },
          },
        }),
        block("roblox_searchUsers", {
          inputs: {
            keyword: { shadow: shadow("text") },
          },
        }),
        label("Already have a user ID? ↓"),
        block("roblox_getUserById", {
          inputs: { id: num(156) },
        }),
        block("roblox_usernameFromId", {
          inputs: { id: num(156) },
        }),
        label("----------------------------------------------"),
        label("Groups ↓"),
        block("roblox_getGroup", {
          inputs: {
            id: { shadow: shadow("math_number", { fields: { NUM: 7 } }) },
          },
        }),
        block("roblox_groupInfo"),
        block("roblox_userInGroup", {
          inputs: {
            username: { shadow: shadow("text") },
            id: { shadow: shadow("math_number", { fields: { NUM: 7 } }) },
          },
        }),
        block("roblox_userGroupRank", {
          inputs: {
            username: { shadow: shadow("text") },
            id: { shadow: shadow("math_number", { fields: { NUM: 7 } }) },
          },
        }),
        block("roblox_groupRoles", {
          inputs: { id: num(7) },
        }),
        label("----------------------------------------------"),
        label("Games (the place ID is the number in the game's link) ↓"),
        block("roblox_getGame", {
          inputs: {
            id: {
              shadow: shadow("math_number", { fields: { NUM: 1818 } }),
            },
          },
        }),
        block("roblox_gameInfo"),
        block("roblox_gamePlayers", {
          inputs: { id: num(1818) },
        }),
        block("roblox_forEachServer", {
          inputs: { id: num(1818) },
        }),
        block("roblox_serverInfo"),
        label("----------------------------------------------"),
        label("Gamepasses & badges ↓"),
        block("roblox_ownsGamepass", {
          inputs: {
            username: { shadow: shadow("text") },
            id: { shadow: shadow("math_number", { fields: { NUM: 0 } }) },
          },
        }),
        block("roblox_ownsBadge", {
          inputs: {
            username: { shadow: shadow("text") },
            id: { shadow: shadow("math_number", { fields: { NUM: 0 } }) },
          },
        }),
        block("roblox_getBadge", {
          inputs: { id: num(0) },
        }),
        block("roblox_badgeInfo"),
        block("roblox_getGamepass", {
          inputs: { id: num(0) },
        }),
        block("roblox_gamepassInfo"),
        label("Avatar shop items (the ID is the number in the item's link) ↓"),
        block("roblox_getItem", {
          inputs: { id: num(1365767) },
        }),
        block("roblox_itemInfo"),
        label("----------------------------------------------"),
        label("Your own game: these need an Open Cloud API key ↓"),
        label(
          'Make one at create.roblox.com/dashboard/credentials and save it as a secret named "ROBLOX_API_KEY"',
        ),
        block("roblox_publishMessage", {
          inputs: {
            message: { shadow: githubText("Hello from Discord!") },
            topic: { shadow: githubText("discord") },
            place: num(0),
            key: secret("ROBLOX_API_KEY"),
          },
        }),
        block("roblox_getDataStore", {
          inputs: {
            entry: { shadow: githubText("Player_1") },
            datastore: { shadow: githubText("PlayerData") },
            place: num(0),
            key: secret("ROBLOX_API_KEY"),
          },
        }),
        block("roblox_setDataStore", {
          inputs: {
            entry: { shadow: githubText("Player_1") },
            value: { shadow: githubText("") },
            datastore: { shadow: githubText("PlayerData") },
            place: num(0),
            key: secret("ROBLOX_API_KEY"),
          },
        }),
        block("roblox_banUser", {
          inputs: {
            username: { shadow: shadow("text") },
            place: num(0),
            duration: num(0),
            reason: { shadow: githubText("Banned from Discord") },
            key: secret("ROBLOX_API_KEY"),
          },
        }),
      ],
    },
    {
      kind: "category",
      name: "Minecraft",
      colour: "#5A8F3C",
      contents: [
        label("No API key needed, all of this is public info ↓"),
        label("----------------------------------------------"),
        label("Get a user first, then use the info block ↓"),
        block("minecraft_getUser", {
          inputs: {
            username: { shadow: shadow("text", { fields: { TEXT: "Notch" } }) },
          },
        }),
        block("minecraft_userInfo"),
        label("----------------------------------------------"),
        label("Quick user info (no need to get the user first) ↓"),
        block("minecraft_userExists", {
          inputs: {
            username: { shadow: shadow("text") },
          },
        }),
        block("minecraft_userUUID", {
          inputs: {
            username: { shadow: shadow("text") },
          },
        }),
        block("minecraft_userAvatar", {
          inputs: {
            username: { shadow: shadow("text") },
          },
        }),
        block("minecraft_usernameFromUUID", {
          inputs: {
            uuid: { shadow: shadow("text") },
          },
        }),
        label("----------------------------------------------"),
        label("Servers ↓"),
        label("Get a server first, then use the info block ↓"),
        block("minecraft_getServer", {
          inputs: {
            address: {
              shadow: shadow("text", { fields: { TEXT: "play.hypixel.net" } }),
            },
          },
        }),
        block("minecraft_serverInfo"),
        label("----------------------------------------------"),
        label("Quick server info (no need to get the server first) ↓"),
        block("minecraft_serverOnline", {
          inputs: {
            address: {
              shadow: shadow("text", { fields: { TEXT: "play.hypixel.net" } }),
            },
          },
        }),
        block("minecraft_isPlayerOnServer", {
          inputs: {
            address: {
              shadow: shadow("text", { fields: { TEXT: "play.hypixel.net" } }),
            },
            username: { shadow: shadow("text") },
          },
        }),
        block("minecraft_serverQuickInfo", {
          inputs: {
            address: {
              shadow: shadow("text", { fields: { TEXT: "play.hypixel.net" } }),
            },
          },
        }),
        block("minecraft_serverImage", {
          inputs: {
            address: {
              shadow: shadow("text", { fields: { TEXT: "play.hypixel.net" } }),
            },
          },
        }),
        label("----------------------------------------------"),
        label("Server status alerts (these go on their own, not inside an event) ↓"),
        block("minecraft_onServerStatus", {
          inputs: {
            address: {
              shadow: shadow("text", { fields: { TEXT: "play.hypixel.net" } }),
            },
            minutes: num(5),
          },
        }),
        label("----------------------------------------------"),
        label("Game versions ↓"),
        block("minecraft_latestVersion"),
      ],
    },
    {
      kind: "category",
      name: "YouTube",
      colour: "#FF0000",
      contents: [
        label("No API key needed, all of this is public info ↓"),
        label('Channels can be an @handle, a channel link or a channel ID'),
        label("----------------------------------------------"),
        label("Videos: get a video first, then use the info block ↓"),
        block("youtube_getVideo", {
          inputs: {
            video: { shadow: githubText("https://youtu.be/dQw4w9WgXcQ") },
          },
        }),
        block("youtube_getLatestVideo", {
          inputs: { channel: { shadow: githubText("@YouTube") } },
        }),
        block("youtube_forEachVideo", {
          inputs: { channel: { shadow: githubText("@YouTube") } },
        }),
        block("youtube_forEachPlaylistVideo", {
          inputs: { playlist: { shadow: githubText("") } },
        }),
        block("youtube_videoInfo"),
        label("----------------------------------------------"),
        label("Notifications (these go on their own, not inside an event) ↓"),
        block("youtube_onNewVideo", {
          inputs: {
            channel: { shadow: githubText("@YouTube") },
            minutes: num(5),
          },
        }),
        block("youtube_onLive", {
          inputs: {
            channel: { shadow: githubText("@YouTube") },
            minutes: num(5),
          },
        }),
        label("----------------------------------------------"),
        label("Channels: get a channel first, then use the info block ↓"),
        block("youtube_getChannel", {
          inputs: { channel: { shadow: githubText("@YouTube") } },
        }),
        block("youtube_channelInfo"),
        label("----------------------------------------------"),
        label("Quick info (no need to get anything first) ↓"),
        block("youtube_latestVideoLink", {
          inputs: { channel: { shadow: githubText("@YouTube") } },
        }),
        block("youtube_subscribers", {
          inputs: { channel: { shadow: githubText("@YouTube") } },
        }),
        block("youtube_isLive", {
          inputs: { channel: { shadow: githubText("@YouTube") } },
        }),
        block("youtube_channelId", {
          inputs: { channel: { shadow: githubText("@YouTube") } },
        }),
        block("youtube_videoExists", {
          inputs: { video: { shadow: githubText("") } },
        }),
        block("youtube_videoId", {
          inputs: { video: { shadow: githubText("") } },
        }),
        block("youtube_thumbnail", {
          inputs: { video: { shadow: githubText("") } },
        }),
        label("----------------------------------------------"),
        label("Search, comments and exact stats: these need a YouTube API key ↓"),
        label(
          'Make a free one at console.cloud.google.com (YouTube Data API v3) and save it as a secret named "YOUTUBE_API_KEY"',
        ),
        block("youtube_apiSearch", {
          inputs: {
            query: { shadow: githubText("discord bots") },
            count: num(5),
            key: secret("YOUTUBE_API_KEY"),
          },
        }),
        block("youtube_apiVideoStat", {
          inputs: {
            video: { shadow: githubText("") },
            key: secret("YOUTUBE_API_KEY"),
          },
        }),
        block("youtube_apiChannelStat", {
          inputs: {
            channel: { shadow: githubText("@YouTube") },
            key: secret("YOUTUBE_API_KEY"),
          },
        }),
        block("youtube_apiForEachComment", {
          inputs: {
            video: { shadow: githubText("") },
            count: num(10),
            key: secret("YOUTUBE_API_KEY"),
          },
        }),
        block("youtube_commentInfo"),
      ],
    },
    {
      kind: "category",
      name: "Reddit",
      colour: "#FF4500",
      contents: [
        label("No login needed, all of this is public info ↓"),
        label('Subreddits can be written like "memes" or "r/memes", users like "spez" or "u/spez"'),
        label("----------------------------------------------"),
        label("Posts: these run the blocks inside with a post ↓"),
        block("reddit_getRandomPost", {
          inputs: { subreddit: { shadow: githubText("memes") } },
        }),
        block("reddit_forEachPost", {
          inputs: {
            subreddit: { shadow: githubText("memes") },
            limit: num(5),
          },
        }),
        block("reddit_getPost", {
          inputs: { post: { shadow: githubText("") } },
        }),
        block("reddit_searchPosts", {
          inputs: {
            query: { shadow: githubText("discord bot") },
            subreddit: { shadow: githubText("") },
            limit: num(5),
          },
        }),
        block("reddit_forEachUserPost", {
          inputs: {
            user: { shadow: githubText("spez") },
            limit: num(5),
          },
        }),
        block("reddit_postInfo"),
        label("New posts feed (this goes on its own, not inside an event) ↓"),
        block("reddit_onNewPost", {
          inputs: {
            subreddit: { shadow: githubText("memes") },
            minutes: num(5),
          },
        }),
        label("----------------------------------------------"),
        label("Comments ↓"),
        block("reddit_forEachComment", {
          inputs: {
            post: { shadow: githubText("") },
            limit: num(5),
          },
        }),
        block("reddit_commentInfo"),
        label("----------------------------------------------"),
        label("Subreddits and users: get one first, then use the info block ↓"),
        block("reddit_getSubreddit", {
          inputs: { subreddit: { shadow: githubText("memes") } },
        }),
        block("reddit_subredditInfo"),
        block("reddit_getUser", {
          inputs: { user: { shadow: githubText("spez") } },
        }),
        block("reddit_userInfo"),
        label("----------------------------------------------"),
        label("Quick info (no need to get anything first) ↓"),
        block("reddit_postList", {
          inputs: {
            subreddit: { shadow: githubText("memes") },
            limit: num(5),
          },
        }),
        block("reddit_memberCount", {
          inputs: { subreddit: { shadow: githubText("memes") } },
        }),
        block("reddit_subredditExists", {
          inputs: { subreddit: { shadow: githubText("memes") } },
        }),
        block("reddit_userKarma", {
          inputs: { user: { shadow: githubText("spez") } },
        }),
        block("reddit_userExists", {
          inputs: { user: { shadow: githubText("spez") } },
        }),
        label("----------------------------------------------"),
        label("Logging in: needs a Reddit app ↓"),
        label(
          'Create a "script" app at reddit.com/prefs/apps, then save its ID and secret as secrets',
        ),
        label(
          "Optional for everything above (it makes Reddit more reliable), required for the blocks below",
        ),
        block("reddit_login", {
          inputs: {
            clientId: secret("REDDIT_CLIENT_ID"),
            clientSecret: secret("REDDIT_CLIENT_SECRET"),
            username: { shadow: githubText("") },
            password: secret("REDDIT_PASSWORD"),
          },
        }),
        label("Acting as your account (needs a username and password above) ↓"),
        block("reddit_submitPost", {
          inputs: {
            subreddit: { shadow: githubText("test") },
            title: { shadow: githubText("Hello from Discord!") },
            content: { shadow: githubText("") },
          },
        }),
        block("reddit_reply", {
          inputs: {
            text: { shadow: githubText("Thanks!") },
            thing: { shadow: githubText("") },
          },
        }),
        block("reddit_sendMessage", {
          inputs: {
            user: { shadow: githubText("") },
            subject: { shadow: githubText("Hello") },
            text: { shadow: githubText("") },
          },
        }),
      ],
    },
    {
      kind: "category",
      name: "GitHub",
      colour: "#6e5494",
      contents: [
        label("No token needed for public info (60 requests an hour) ↓"),
        label("----------------------------------------------"),
        label("Users: get a user first, then use the info block ↓"),
        block("github_getUser", {
          inputs: { username: { shadow: githubText("octocat") } },
        }),
        block("github_userInfo"),
        label("Quick user info (no need to get the user first) ↓"),
        block("github_userExists", {
          inputs: { username: { shadow: githubText("octocat") } },
        }),
        block("github_userAvatar", {
          inputs: { username: { shadow: githubText("octocat") } },
        }),
        block("github_userFollows", {
          inputs: {
            username: { shadow: githubText("octocat") },
            target: { shadow: githubText("defunkt") },
          },
        }),
        block("github_userList", {
          inputs: { username: { shadow: githubText("octocat") } },
        }),
        block("github_searchUsers", {
          inputs: { query: { shadow: githubText("location:Los Angeles") } },
        }),
        label("----------------------------------------------"),
        label("Organizations ↓"),
        block("github_getOrg", {
          inputs: { org: { shadow: githubText("github") } },
        }),
        block("github_orgInfo"),
        block("github_orgMembers", {
          inputs: { org: { shadow: githubText("github") } },
        }),
        label("----------------------------------------------"),
        label('Repositories (like "owner/name" or a github.com link) ↓'),
        block("github_getRepo", {
          inputs: { repo: { shadow: githubText("octocat/Hello-World") } },
        }),
        block("github_forEachRepo", {
          inputs: { username: { shadow: githubText("octocat") } },
        }),
        block("github_searchRepos", {
          inputs: { query: { shadow: githubText("discord bot") } },
        }),
        block("github_repoInfo"),
        label("Quick repository info ↓"),
        block("github_repoExists", {
          inputs: { repo: { shadow: githubText("octocat/Hello-World") } },
        }),
        block("github_repoStars", {
          inputs: { repo: { shadow: githubText("octocat/Hello-World") } },
        }),
        block("github_repoList", {
          inputs: { repo: { shadow: githubText("octocat/Hello-World") } },
        }),
        block("github_repoReadme", {
          inputs: { repo: { shadow: githubText("octocat/Hello-World") } },
        }),
        block("github_fileContent", {
          inputs: {
            path: { shadow: githubText("README.md") },
            repo: { shadow: githubText("octocat/Hello-World") },
          },
        }),
        block("github_workflowStatus", {
          inputs: { repo: { shadow: githubText("octocat/Hello-World") } },
        }),
        label("----------------------------------------------"),
        label("Issues ↓"),
        block("github_getIssue", {
          inputs: {
            number: { shadow: shadow("math_number", { fields: { NUM: 1 } }) },
            repo: { shadow: githubText("octocat/Hello-World") },
          },
        }),
        block("github_forEachIssue", {
          inputs: { repo: { shadow: githubText("octocat/Hello-World") } },
        }),
        block("github_issueInfo"),
        label("Pull requests ↓"),
        block("github_getPullRequest", {
          inputs: {
            number: { shadow: shadow("math_number", { fields: { NUM: 1 } }) },
            repo: { shadow: githubText("octocat/Hello-World") },
          },
        }),
        block("github_forEachPullRequest", {
          inputs: { repo: { shadow: githubText("octocat/Hello-World") } },
        }),
        block("github_pullRequestInfo"),
        block("github_searchCount", {
          inputs: {
            query: {
              shadow: githubText("repo:octocat/Hello-World is:open"),
            },
          },
        }),
        label("----------------------------------------------"),
        label("Commits ↓"),
        block("github_getCommit", {
          inputs: {
            repo: { shadow: githubText("octocat/Hello-World") },
            branch: { shadow: githubText("HEAD") },
          },
        }),
        block("github_forEachCommit", {
          inputs: {
            count: { shadow: shadow("math_number", { fields: { NUM: 5 } }) },
            repo: { shadow: githubText("octocat/Hello-World") },
          },
        }),
        block("github_commitInfo"),
        label("Releases ↓"),
        block("github_getRelease", {
          inputs: { repo: { shadow: githubText("octocat/Hello-World") } },
        }),
        block("github_forEachRelease", {
          inputs: { repo: { shadow: githubText("octocat/Hello-World") } },
        }),
        block("github_releaseInfo"),
        label("Gists ↓"),
        block("github_getGist", {
          inputs: { id: { shadow: githubText("") } },
        }),
        block("github_gistInfo"),
        label("Other ↓"),
        block("github_rateLimit"),
        block("github_zen"),
        label("----------------------------------------------"),
        label("Actions as your account: these need a GitHub token ↓"),
        label(
          'Make one at github.com/settings/tokens and save it as a secret named "GITHUB_TOKEN"',
        ),
        block("github_getTokenUser", {
          inputs: { token: githubToken() },
        }),
        block("github_createIssue", {
          inputs: {
            repo: { shadow: githubText("owner/name") },
            title: { shadow: githubText("Bug report") },
            body: { shadow: githubText("") },
            labels: { shadow: githubText("bug") },
            token: githubToken(),
          },
        }),
        block("github_comment", {
          inputs: {
            comment: { shadow: githubText("Thanks!") },
            number: { shadow: shadow("math_number", { fields: { NUM: 1 } }) },
            repo: { shadow: githubText("owner/name") },
            token: githubToken(),
          },
        }),
        block("github_setIssueState", {
          inputs: {
            number: { shadow: shadow("math_number", { fields: { NUM: 1 } }) },
            repo: { shadow: githubText("owner/name") },
            token: githubToken(),
          },
        }),
        block("github_editIssue", {
          inputs: {
            items: { shadow: githubText("bug") },
            number: { shadow: shadow("math_number", { fields: { NUM: 1 } }) },
            repo: { shadow: githubText("owner/name") },
            token: githubToken(),
          },
        }),
        block("github_mergePullRequest", {
          inputs: {
            number: { shadow: shadow("math_number", { fields: { NUM: 1 } }) },
            repo: { shadow: githubText("owner/name") },
            token: githubToken(),
          },
        }),
        block("github_createRelease", {
          inputs: {
            tag: { shadow: githubText("v1.0.0") },
            repo: { shadow: githubText("owner/name") },
            name: { shadow: githubText("v1.0.0") },
            body: { shadow: githubText("") },
            token: githubToken(),
          },
        }),
        block("github_runWorkflow", {
          inputs: {
            workflow: { shadow: githubText("deploy.yml") },
            repo: { shadow: githubText("owner/name") },
            branch: { shadow: githubText("main") },
            token: githubToken(),
          },
        }),
        block("github_writeFile", {
          inputs: {
            path: { shadow: githubText("data.json") },
            repo: { shadow: githubText("owner/name") },
            content: { shadow: githubText("") },
            message: { shadow: githubText("Update data.json") },
            token: githubToken(),
          },
        }),
        block("github_createRepo", {
          inputs: {
            name: { shadow: githubText("my-new-repo") },
            description: { shadow: githubText("") },
            token: githubToken(),
          },
        }),
        block("github_createGist", {
          inputs: {
            filename: { shadow: githubText("message.txt") },
            content: { shadow: githubText("") },
            token: githubToken(),
          },
        }),
        block("github_starRepo", {
          inputs: {
            repo: { shadow: githubText("octocat/Hello-World") },
            token: githubToken(),
          },
        }),
        block("github_followUser", {
          inputs: {
            username: { shadow: githubText("octocat") },
            token: githubToken(),
          },
        }),
      ],
    },
    {
      kind: "category",
      name: "Captcha",
      colour: "#0fbd8c",
      contents: [
        label("Create a captcha first ↓"),
        block("captcha_create_mutator"),
        block("captcha_value"),
        label("Send captcha image ↓"),
        block("cv2_sendMessage", {
          inputs: {
            files: {
              block: block("captcha_addFile"),
            },
          },
        }),
      ],
    },
    {
      kind: "category",
      name: "Fetch",
      colour: "#0fbd8c",
      contents: [
        label("Send a request to a url ↓"),
        block("fetch_send", {
          inputs: {
            url: { shadow: shadow("text") },
          },
        }),
        label("----------------------------------------------"),
        label("Advanced request ↓"),
        block("fetch_sendAdvanced", {
          inputs: {
            url: { shadow: shadow("text") },
            config: {
              block: block("fetch_configSection", {
                inputs: {
                  key: {
                    shadow: shadow("text", {
                      fields: {
                        TEXT: "data",
                      },
                    }),
                  },
                  value: {
                    block: block("object_new", {
                      inputs: {
                        keys: {
                          block: block("object_addkey", {
                            inputs: {
                              value: {
                                shadow: shadow("text", {
                                  fields: {
                                    TEXT: "value",
                                  },
                                }),
                              },
                            },
                          }),
                        },
                      },
                    }),
                  },
                },
              }),
            },
          },
        }),
        block("fetch_configSection", {
          inputs: {
            key: { shadow: shadow("text") },
            value: { shadow: shadow("text") },
          },
        }),
        label("----------------------------------------------"),
        label("Information about the response ↓"),
        block("fetch_responseData"),
        block("fetch_responseStatus"),
        block("fetch_responseHeaders"),
        label("Get a key from the response data (from the objects category) ↓"),
        block("object_getkey", {
          inputs: {
            key: {
              shadow: shadow("text", {
                fields: {
                  TEXT: "",
                },
              }),
            },
            object: {
              shadow: shadow("fetch_responseData"),
            },
          },
        }),
      ],
    },
    websockets,
    {
      kind: "category",
      name: "Canvas",
      colour: "#4C9F70",
      contents: [
        label("Create a Canvas ↓"),
        block("canvas_createCanvas", {
          inputs: {
            WIDTH: {
              shadow: shadow("math_number", {
                fields: {
                  NUM: 512,
                },
              }),
            },
            HEIGHT: {
              shadow: shadow("math_number", {
                fields: {
                  NUM: 512,
                },
              }),
            },
          },
        }),
        label("Export the Canvas ↓"),
        block("cv2_sendMessage", {
          inputs: {
            files: {
              block: block("canvas_addFile"),
            },
          },
        }),
        block("canvas_asData"),
        label("Properties ↓"),
        block("canvas_width"),
        block("canvas_height"),
        label("Actions ↓"),
        block("canvas_setFillColor", {
          inputs: {
            COLOR: {
              shadow: shadow("colour_picker"),
            },
          },
        }),
        block("canvas_setStrokeColor", {
          inputs: {
            COLOR: {
              shadow: shadow("colour_picker"),
            },
          },
        }),
        block("canvas_setLineWidth", {
          inputs: {
            WIDTH: {
              shadow: shadow("math_number", {
                fields: {
                  NUM: 5,
                },
              }),
            },
          },
        }),
        block("canvas_setFont", {
          inputs: {
            FONT: {
              shadow: shadow("text", {
                fields: {
                  TEXT: "20px Arial",
                },
              }),
            },
          },
        }),
        block("canvas_fillText", {
          inputs: {
            TEXT: {
              shadow: shadow("text", {
                fields: {
                  TEXT: "Hello!",
                },
              }),
            },
            X: {
              shadow: shadow("math_number", {
                fields: {
                  NUM: 10,
                },
              }),
            },
            Y: {
              shadow: shadow("math_number", {
                fields: {
                  NUM: 50,
                },
              }),
            },
          },
        }),
        block("canvas_strokeText", {
          inputs: {
            TEXT: {
              shadow: shadow("text", {
                fields: {
                  TEXT: "Outlined!",
                },
              }),
            },
            X: {
              shadow: shadow("math_number", {
                fields: {
                  NUM: 10,
                },
              }),
            },
            Y: {
              shadow: shadow("math_number", {
                fields: {
                  NUM: 90,
                },
              }),
            },
          },
        }),
        block("canvas_drawRectangle", {
          inputs: {
            X: {
              shadow: shadow("math_number", {
                fields: {
                  NUM: 0,
                },
              }),
            },
            Y: {
              shadow: shadow("math_number", {
                fields: {
                  NUM: 0,
                },
              }),
            },
            W: {
              shadow: shadow("math_number", {
                fields: {
                  NUM: 512,
                },
              }),
            },
            H: {
              shadow: shadow("math_number", {
                fields: {
                  NUM: 512,
                },
              }),
            },
          },
        }),
        block("canvas_drawCircle", {
          inputs: {
            X: {
              shadow: shadow("math_number", {
                fields: {
                  NUM: 0,
                },
              }),
            },
            Y: {
              shadow: shadow("math_number", {
                fields: {
                  NUM: 0,
                },
              }),
            },
            R: {
              shadow: shadow("math_number", {
                fields: {
                  NUM: 256,
                },
              }),
            },
          },
        }),
        block("canvas_drawLine", {
          inputs: {
            X1: {
              shadow: shadow("math_number", {
                fields: {
                  NUM: 0,
                },
              }),
            },
            Y1: {
              shadow: shadow("math_number", {
                fields: {
                  NUM: 0,
                },
              }),
            },
            X2: {
              shadow: shadow("math_number", {
                fields: {
                  NUM: 512,
                },
              }),
            },
            Y2: {
              shadow: shadow("math_number", {
                fields: {
                  NUM: 512,
                },
              }),
            },
          },
        }),
        block("canvas_drawImage", {
          inputs: {
            SRC: {
              shadow: shadow("text", {
                fields: {
                  TEXT: "https://www.disfuse.xyz/media/disfuse.png",
                },
              }),
            },
            X: {
              shadow: shadow("math_number", {
                fields: {
                  NUM: 0,
                },
              }),
            },
            Y: {
              shadow: shadow("math_number", {
                fields: {
                  NUM: 0,
                },
              }),
            },
            W: {
              shadow: shadow("math_number", {
                fields: {
                  NUM: 128,
                },
              }),
            },
            H: {
              shadow: shadow("math_number", {
                fields: {
                  NUM: 128,
                },
              }),
            },
          },
        }),
        block("canvas_clearCanvas"),
        label("Transforms ↓"),
        block("canvas_save"),
        block("canvas_restore"),
        block("canvas_translate", {
          inputs: {
            DX: {
              shadow: shadow("math_number", {
                fields: {
                  NUM: 0,
                },
              }),
            },
            DY: {
              shadow: shadow("math_number", {
                fields: {
                  NUM: 0,
                },
              }),
            },
          },
        }),
        block("canvas_rotate", {
          inputs: {
            ANGLE: {
              shadow: shadow("math_number", {
                fields: {
                  NUM: 0.5,
                },
              }),
            },
          },
        }),
      ],
    },
  ],
};
