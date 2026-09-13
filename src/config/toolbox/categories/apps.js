import { block, label, shadow } from "../helpers.js";

const githubText = (text) => shadow("text", { fields: { TEXT: text } });

/** A token input, pre-filled with "get secret GITHUB_TOKEN". */
const githubToken = () => ({
  block: block("main_env", {
    inputs: { value: { shadow: githubText("GITHUB_TOKEN") } },
  }),
});

/** Integrations with things that aren't Discord: Scratch, Roblox, GitHub, captchas, HTTP, canvas. */
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
