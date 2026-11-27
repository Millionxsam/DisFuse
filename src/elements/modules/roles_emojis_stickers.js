/* =====================================================================
   Builder catalog: roles, emojis and stickers
   ---------------------------------------------------------------------
   Roles (making them, giving them out, checking who has them) and a
   server's custom emojis and stickers.
   ===================================================================== */

import { group, input } from "../define.js";
import { PERMISSIONS } from "../../builder/model/rules.js";

const { action, value } = group({ colour: "#B76489" });

/* True if a member has a role. The role can be a role or its ID. */
const HAS_ROLE = {
  key: "disfuseHasRole",
  code: `/* Role check */
function disfuseHasRole(member, role) {
  const roleId = typeof role === "string" ? role : role?.id;
  return Boolean(roleId && member?.roles?.cache?.has(roleId));
}`,
};

const events = [];

const actions = [
  action({
    id: "role_each",
    label: "Repeat with each role in a server",
    description: "Runs the steps inside once for every role in a server.",
    category: "roles",
    group: "Finding",
    icon: "fa-solid fa-shield-halved",
    keywords: ["for each", "loop", "all roles"],
    block: {
      type: "roles_foreach",
      text: ["for each role on the server: {server}", "{code}"],
      parts: { code: { check: "default" } },
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["server"],
          message: "You must specify the server to iterate roles from.",
        },
      ],
    },
    inputs: [input.slot("server", "Server", "server")],
    branches: [
      {
        key: "code",
        label: "Do",
        provides: [
          {
            key: "role",
            label: "Current role",
            type: "role",
            code: "role",
            block: {
              type: "roles_foreach_role",
              text: "current role in loop",
              tooltip: "The current role on the server of the loop.",
              output: null,
              restrictions: [
                {
                  type: "hasParent",
                  blockTypes: ["roles_foreach"],
                  message: 'This block must be under the "For each role on the server" block',
                },
              ],
            },
          },
        ],
      },
    ],
    code: (ctx) =>
      `await forEachCollection(${ctx.input("server")}, "roles", async (role) => {\n${ctx.branch("code")}});\n`,
  }),
  action({
    id: "role_each_member",
    label: "Repeat with each member who has a role",
    description: "Runs the steps inside once for every member with a role.",
    category: "roles",
    group: "Finding",
    icon: "fa-solid fa-users",
    keywords: ["for each", "loop", "members with role"],
    block: {
      type: "roles_foreachMember",
      text: ["for each member with the role: {role}", "{code}"],
      parts: { code: { check: "default" } },
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["role"],
          message: "You must specify the role to iterate members from.",
        },
      ],
    },
    inputs: [input.slot("role", "Role", "role")],
    branches: [
      {
        key: "code",
        label: "Do",
        inline: true,
        provides: [
          {
            key: "member",
            label: "Current member",
            type: "member",
            code: "member",
            block: {
              type: "roles_currentLoopMember",
              text: "current member in loop",
              output: null,
              restrictions: [
                {
                  type: "hasParent",
                  blockTypes: ["roles_foreachMember"],
                  message: 'This block must be under the "For each member with the role" block',
                },
              ],
            },
          },
        ],
        contexts: ["loop"],
      },
    ],
    code: (ctx) =>
      `for (const member of ${ctx.input("role")}.members.values()) {\n${ctx.branch("code")}}\n`,
  }),
  action({
    id: "role_create",
    label: "Create a role",
    description: "Makes a new role in a server.",
    category: "roles",
    group: "Changing",
    icon: "fa-solid fa-plus",
    keywords: ["new role", "make role", "add role"],
    block: {
      type: "roles_create",
      text: [
        "create new role named: {name}",
        "in server: {server}",
        "color: {color}",
        "position: {position}",
        "can be mentioned? {mentionable}",
        "permissions: {permissions}",
      ],
      parts: { permissions: { check: ["Array", "permission"] } },
      previous: null,
      next: null,
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["server"],
          message: "You must specify the server to create the role in",
        },
        {
          type: "notEmpty",
          blockTypes: ["name"],
          message: "You must specify the name of the role",
        },
        {
          type: "validator",
          blockTypes: ["name"],
          check: (val) => val.length <= 100,
          message: "Name cannot be greater than 100 characters",
        },
      ],
    },
    inputs: [
      input.text("name", "Name", { default: "new role", maxLength: 100 }),
      input.slot("server", "Server", "server"),
      input.colour("color", "Color", { default: "#99aab5" }),
      input.number("position", "Position (optional)", {
        optional: true,
        help: "Higher numbers show higher in the role list.",
        min: 1,
        integer: true,
      }),
      input.boolean("mentionable", "Anyone can @mention it", { default: false }),
      input.boolean("hoist", "Show members separately", {
        default: false,
        help: "Lists members with this role in their own group on the member list.",
      }),
      input.multi(
        "permissions",
        "Permissions",
        PERMISSIONS.map((p) => [p.label, p.value]),
        { help: "Leave them all unticked to keep Discord's defaults." },
      ),
    ],
    branches: [
      {
        key: "then",
        label: "After it's made",
        optional: true,
        provides: [{ key: "role", label: "New role", type: "role", code: "createdRole" }],
      },
    ],
    code: (ctx) => {
      const parts = [
        `name: ${ctx.input("name")}`,
        `color: ${ctx.input("color")}`,
        `mentionable: ${ctx.input("mentionable")}`,
        `hoist: ${ctx.input("hoist")}`,
      ];
      if (ctx.has("position")) parts.push(`position: ${ctx.input("position")}`);
      if (ctx.has("permissions")) parts.push(`permissions: ${ctx.input("permissions")}`);
      const call = `await ${ctx.input("server")}.roles.create({ ${parts.join(", ")} })`;
      return ctx.hasBranch("then")
        ? `{\nconst createdRole = ${call};\n${ctx.branch("then")}}\n`
        : `${call};\n`;
    },
  }),
  action({
    id: "role_delete",
    label: "Delete a role",
    description: "Deletes a role. Everyone who had it loses it.",
    category: "roles",
    group: "Changing",
    icon: "fa-solid fa-trash-can",
    keywords: ["remove role", "delete role"],
    block: {
      type: "roles_delete",
      text: ["delete the role: {role}", "reason: {reason}"],
      previous: null,
      next: null,
      restrictions: [
        { type: "notEmpty", blockTypes: ["role"], message: "You must specify the role to delete." },
        {
          type: "validator",
          blockTypes: ["reason"],
          check: (val) => val.length <= 512,
          message: "Reason cannot be greater than 512 characters",
        },
      ],
    },
    inputs: [
      input.slot("role", "Role", "role"),
      input.text("reason", "Reason (optional)", {
        default: "",
        help: "Shown in the server's audit log.",
      }),
    ],
    code: (ctx) =>
      `await ${ctx.input("role")}.delete(${ctx.has("reason") ? ctx.input("reason") : ""});\n`,
  }),
  action({
    id: "role_rename",
    label: "Rename a role",
    description: "Changes a role's name.",
    category: "roles",
    group: "Changing",
    icon: "fa-solid fa-signature",
    keywords: ["rename", "role name"],
    block: {
      type: "roles_rename",
      text: ["rename role: {role}", "new name: {name}"],
      previous: null,
      next: null,
      restrictions: [
        { type: "notEmpty", blockTypes: ["role"], message: "You must specify the role to rename." },
        {
          type: "notEmpty",
          blockTypes: ["name"],
          message: "You must specify the new name for the role.",
        },
        {
          type: "validator",
          blockTypes: ["name"],
          check: (val) => val.length <= 100,
          message: "Name cannot be greater than 100 characters",
        },
      ],
    },
    inputs: [
      input.slot("role", "Role", "role"),
      input.text("name", "New name", { default: "", maxLength: 100 }),
    ],
    code: (ctx) => `await ${ctx.input("role")}.setName(${ctx.input("name")});\n`,
  }),
  action({
    id: "role_give",
    label: "Give a role to a member",
    description: "Adds a role to a member.",
    category: "roles",
    group: "Members",
    icon: "fa-solid fa-user-plus",
    keywords: ["add role", "give role", "assign"],
    block: {
      type: "roles_addToMember",
      text: ["add role: {role}", "to member: {member}"],
      parts: { role: { check: ["role", "Array"] } },
      previous: null,
      next: null,
      restrictions: [
        { type: "notEmpty", blockTypes: ["role"], message: "You must specify the role." },
        { type: "notEmpty", blockTypes: ["member"], message: "You must specify the member." },
      ],
    },
    inputs: [input.slot("role", "Role", "role"), input.slot("member", "To", "member")],
    code: (ctx) => `await ${ctx.input("member")}.roles.add(${ctx.input("role")});\n`,
  }),
  action({
    id: "role_take",
    label: "Remove a role from a member",
    description: "Removes a role from a member.",
    category: "roles",
    group: "Members",
    icon: "fa-solid fa-user-minus",
    keywords: ["remove role", "take role", "unassign"],
    block: {
      type: "roles_removeFromMember",
      text: ["remove role: {role}", "from member: {member}"],
      parts: { role: { check: ["role", "Array"] } },
      previous: null,
      next: null,
      restrictions: [
        { type: "notEmpty", blockTypes: ["role"], message: "You must specify the role." },
        { type: "notEmpty", blockTypes: ["member"], message: "You must specify the member." },
      ],
    },
    inputs: [input.slot("role", "Role", "role"), input.slot("member", "From", "member")],
    code: (ctx) => `await ${ctx.input("member")}.roles.remove(${ctx.input("role")});\n`,
  }),
  action({
    id: "role_set_permissions",
    label: "Set a role's permissions",
    description: "Replaces what a role is allowed to do with the permissions you check.",
    category: "roles",
    group: "Changing",
    icon: "fa-solid fa-key",
    keywords: ["permissions", "perms", "allow"],
    block: {
      type: "roles_setPermissions",
      text: ["set permissions: {permissions}", "to role: {role}"],
      parts: { permissions: { check: ["permission", "Array"] } },
      previous: null,
      next: null,
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["permissions"],
          message: "You must specify the permissions.",
        },
        {
          type: "notEmpty",
          blockTypes: ["role"],
          message: "You must specify the role to set the permissions to.",
        },
      ],
    },
    inputs: [
      input.slot("role", "Role", "role"),
      input.multi(
        "permissions",
        "Permissions",
        PERMISSIONS.map((p) => [p.label, p.value]),
        { help: "Any permission left unticked is taken away." },
      ),
    ],
    code: (ctx) => `await ${ctx.input("role")}.setPermissions(${ctx.input("permissions")});\n`,
  }),
  action({
    id: "emoji_each",
    label: "Repeat with each emoji in a server",
    description: "Runs the steps inside once for every custom emoji in a server.",
    category: "emojis",
    group: "Emojis",
    icon: "fa-solid fa-face-smile",
    keywords: ["for each", "loop", "all emojis"],
    block: {
      type: "emoji_getallinserver",
      text: ["for each emoji on the server:", "{server}", "{code}"],
      parts: { code: { check: "default" } },
      colour: "DEB144",
      inline: true,
      tooltip: "Runs a code for each emoji on a server.",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["server"],
          message: "You must specify the server to iterate emojis from.",
        },
      ],
    },
    inputs: [input.slot("server", "Server", "server")],
    branches: [
      {
        key: "code",
        label: "Do",
        provides: [
          {
            key: "emoji",
            label: "Current emoji",
            type: "emoji",
            code: "emoji",
            block: {
              type: "emoji_getallinserver_value",
              text: "current emoji in loop",
              colour: "DEB144",
              tooltip: "The current emoji on the server of the loop.",
              output: null,
              restrictions: [
                {
                  type: "hasParent",
                  blockTypes: ["emoji_getallinserver"],
                  message: 'This block must be in a "for each emoji in the server" block',
                },
              ],
            },
          },
        ],
      },
    ],
    code: (ctx) =>
      `await forEachCollection(${ctx.input("server")}, "emojis", async (emoji) => {\n${ctx.branch("code")}});\n`,
  }),
  action({
    id: "emoji_create",
    label: "Create an emoji",
    description: "Adds a custom emoji to a server from a picture or GIF link.",
    category: "emojis",
    group: "Emojis",
    icon: "fa-solid fa-plus",
    keywords: ["new emoji", "add emoji", "upload emoji"],
    block: {
      type: "emoji_create",
      text: [
        "create an emoji named: {name}",
        "with image/gif url set to: {url}",
        "in the server: {server}",
      ],
      colour: "DEB144",
      tooltip: "Creates an emoji in the specified server.",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["url"],
          message: "You must specify the URL for the emoji image/GIF",
        },
        {
          type: "notEmpty",
          blockTypes: ["server"],
          message: "You must specify the server to create the emoji in",
        },
        {
          type: "validator",
          blockTypes: ["name"],
          check: (val) => 0 < val.length && val.length <= 32,
          message: "Name must be between 1 and 32 characters",
        },
      ],
    },
    inputs: [
      input.text("name", "Name", {
        default: "",
        help: "Letters, numbers and underscores only, at least 2 characters.",
      }),
      input.text("url", "Picture link", { default: "", placeholder: "https://..." }),
      input.slot("server", "Server", "server"),
    ],
    branches: [
      {
        key: "then",
        label: "After it's made",
        optional: true,
        provides: [{ key: "emoji", label: "New emoji", type: "emoji", code: "createdEmoji" }],
      },
    ],
    code: (ctx) => {
      const call = `await ${ctx.input("server")}.emojis.create({ attachment: ${ctx.input("url")}, name: ${ctx.input("name")} })`;
      return ctx.hasBranch("then")
        ? `{\nconst createdEmoji = ${call};\n${ctx.branch("then")}}\n`
        : `${call};\n`;
    },
  }),
  action({
    id: "emoji_delete",
    label: "Delete an emoji",
    description: "Removes a custom emoji from its server.",
    category: "emojis",
    group: "Emojis",
    icon: "fa-solid fa-trash-can",
    keywords: ["remove emoji", "delete emoji"],
    block: {
      type: "emoji_delete",
      text: "delete emoji: {emoji}",
      colour: "DEB144",
      tooltip: "Deletes an emoji.",
      restrictions: [
        { type: "notEmpty", blockTypes: ["emoji"], message: "You must specify the emoji" },
      ],
    },
    inputs: [input.slot("emoji", "Emoji", "emoji")],
    code: (ctx) => `await ${ctx.input("emoji")}.delete();\n`,
  }),
  action({
    id: "emoji_rename",
    label: "Rename an emoji",
    description: "Changes a custom emoji's name.",
    category: "emojis",
    group: "Emojis",
    icon: "fa-solid fa-signature",
    keywords: ["rename emoji"],
    block: {
      type: "emoji_setname",
      text: ["rename the emoji: {emoji}", "to: {name}"],
      colour: "DEB144",
      tooltip: "Renames an emoji.",
      restrictions: [
        {
          type: "validator",
          blockTypes: ["name"],
          check: (val) => 0 < val.length && val.length <= 32,
          message: "Name must be between 1 and 32 characters",
        },
        { type: "notEmpty", blockTypes: ["emoji"], message: "You must specify the emoji" },
      ],
    },
    inputs: [
      input.slot("emoji", "Emoji", "emoji"),
      input.text("name", "New name", { default: "" }),
    ],
    code: (ctx) => `await ${ctx.input("emoji")}.setName(${ctx.input("name")});\n`,
  }),
  action({
    id: "sticker_each",
    label: "Repeat with each sticker in a server",
    description: "Runs the steps inside once for every sticker in a server.",
    category: "emojis",
    group: "Stickers",
    icon: "fa-solid fa-note-sticky",
    keywords: ["for each", "loop", "all stickers"],
    block: {
      type: "sticker_getallinserver",
      text: ["for each sticker on the server:", "{server}", "{code}"],
      parts: { code: { check: "default" } },
      colour: "#7a9e37",
      inline: true,
      tooltip: "Runs code for each sticker on a server.",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["server"],
          message: "You must specify the server to iterate stickers from.",
        },
      ],
    },
    inputs: [input.slot("server", "Server", "server")],
    branches: [
      {
        key: "code",
        label: "Do",
        provides: [
          {
            key: "sticker",
            label: "Current sticker",
            type: "sticker",
            code: "sticker",
            block: {
              type: "sticker_getallinserver_value",
              text: "current sticker in loop",
              colour: "#7a9e37",
              output: null,
              restrictions: [
                {
                  type: "hasParent",
                  blockTypes: ["sticker_getallinserver"],
                  message: 'This block must be in a "for each sticker in the server" block',
                },
              ],
            },
          },
        ],
      },
    ],
    code: (ctx) =>
      `await forEachCollection(${ctx.input("server")}, "stickers", async (sticker) => {\n${ctx.branch("code")}});\n`,
  }),
  action({
    id: "sticker_create",
    label: "Create a sticker",
    description:
      "Adds a sticker to a server from a picture link (PNG, APNG, GIF or Lottie JSON, up to 512 KB).",
    category: "emojis",
    group: "Stickers",
    icon: "fa-solid fa-plus",
    keywords: ["new sticker", "add sticker", "upload sticker"],
    block: {
      type: "sticker_create",
      text: ["create a sticker", "server: {server}", "name: {name}", "file URL: {file}"],
      colour: "#7a9e37",
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["file"],
          message: "You must specify the file URL for the sticker",
        },
        {
          type: "notEmpty",
          blockTypes: ["server"],
          message: "You must specify the server to create the sticker in",
        },
        {
          type: "validator",
          blockTypes: ["name"],
          check: (val) => 0 < val.length && val.length <= 30,
          message: "Name must be between 1 and 30 characters",
        },
      ],
      mutator: {
        options: "sticker_create_options",
        fields: [
          {
            name: "description",
            inputLabel: "description:",
            inputType: "value",
            label: "include description",
            default: false,
            valueCheck: "String",
          },
          {
            name: "tags",
            inputLabel: "tags:",
            inputType: "value",
            label: "include tags",
            default: false,
            valueCheck: "String",
          },
        ],
      },
    },
    inputs: [
      input.slot("server", "Server", "server"),
      input.text("name", "Name", { default: "", maxLength: 30 }),
      input.text("file", "Picture link", { default: "", placeholder: "https://..." }),
      input.text("description", "Description (optional)", { default: "", maxLength: 100 }),
      input.text("tags", "Related emoji", {
        default: "",
        help: "The name of an emoji that matches the sticker, like smile. Discord needs one.",
      }),
    ],
    code: (ctx) => {
      const parts = [
        `name: ${ctx.input("name")}`,
        `file: ${ctx.input("file")}`,
        `tags: ${ctx.has("tags") ? ctx.input("tags") : '"slight_smile"'}`,
      ];
      if (ctx.has("description")) parts.push(`description: ${ctx.input("description")}`);
      return `await ${ctx.input("server")}.stickers.create({ ${parts.join(", ")} });\n`;
    },
  }),
  action({
    id: "sticker_delete",
    label: "Delete a sticker",
    description: "Removes a sticker from its server.",
    category: "emojis",
    group: "Stickers",
    icon: "fa-solid fa-trash-can",
    keywords: ["remove sticker", "delete sticker"],
    block: {
      type: "sticker_delete",
      text: "delete sticker: {sticker}",
      colour: "#7a9e37",
      tooltip: "Deletes a sticker.",
      restrictions: [
        { type: "notEmpty", blockTypes: ["sticker"], message: "You must specify the sticker" },
      ],
    },
    inputs: [input.slot("sticker", "Sticker", "sticker")],
    code: (ctx) => `await ${ctx.input("sticker")}.delete();\n`,
  }),
  action({
    id: "sticker_rename",
    label: "Rename a sticker",
    description: "Changes a sticker's name.",
    category: "emojis",
    group: "Stickers",
    icon: "fa-solid fa-signature",
    keywords: ["rename sticker"],
    block: {
      type: "sticker_setname",
      text: ["rename the sticker: {sticker}", "to: {name}"],
      colour: "#7a9e37",
      tooltip: "Renames a sticker.",
      restrictions: [
        { type: "notEmpty", blockTypes: ["sticker"], message: "You must specify the sticker" },
      ],
    },
    inputs: [
      input.slot("sticker", "Sticker", "sticker"),
      input.text("name", "New name", { default: "", maxLength: 30 }),
    ],
    code: (ctx) => `await ${ctx.input("sticker")}.edit({ name: ${ctx.input("name")} });\n`,
  }),
];

const values = [
  value({
    id: "role_find",
    label: "Role by name or ID",
    description: "Finds a role in a server by its name or ID.",
    category: "roles",
    group: "Finding",
    icon: "fa-solid fa-magnifying-glass",
    keywords: ["get role", "find role", "role id"],
    block: {
      type: "roles_getone",
      text: ["get the role with the {type} equal to {value}", "on the server {server}"],
      parts: {
        type: {
          options: [
            ["name", "name"],
            ["id", "id"],
          ],
        },
      },
    },
    output: "role",
    inputs: [
      input.dropdown(
        "type",
        "Find by",
        [
          ["Name", "name"],
          ["ID", "id"],
        ],
        { default: "name" },
      ),
      input.text("value", "Name or ID", { default: "" }),
      input.slot("server", "In server", "server"),
    ],
    code: (ctx) =>
      `(await getFromCollection(${ctx.input("server")}, "roles", ${ctx.input("value")}, ${ctx.input("type")}))`,
  }),
  value({
    id: "role_highest",
    label: "Member's highest role",
    description: "The role at the top of a server's role list.",
    category: "roles",
    group: "Finding",
    icon: "fa-solid fa-arrow-up-wide-short",
    keywords: ["top role", "highest"],
    block: {
      type: "roles_highest",
      text: "role with highest position on the server: {server}",
      tooltip: "The role with the highest position on the server.",
      output: null,
    },
    output: "role",
    inputs: [input.slot("server", "Server", "server")],
    code: (ctx) => `${ctx.input("server")}.roles.highest`,
  }),
  value({
    id: "role_member_has",
    label: "Member has a role?",
    description: "True if a member has a role.",
    category: "roles",
    group: "Members",
    icon: "fa-solid fa-user-check",
    keywords: ["has role", "check role", "role check"],
    block: {
      type: "roles_hasRole",
      text: ["does member {member}", "have the role {role}", "?"],
      parts: { role: { check: "role" } },
    },
    output: "Boolean",
    inputs: [
      input.slot("member", "Member", "member"),
      input.slot("role", "Role", ["role", "String"]),
    ],
    setup: [HAS_ROLE],
    code: (ctx) => `disfuseHasRole(${ctx.input("member")}, ${ctx.input("role")})`,
  }),
  value({
    id: "role_name",
    label: "Role name",
    description: "A role's name.",
    category: "roles",
    group: "About a role",
    icon: "fa-solid fa-signature",
    keywords: ["name"],
    block: { type: "roles_name", text: "name of role: {role}" },
    output: "String",
    inputs: [input.slot("role", "Role", "role")],
    code: (ctx) => `${ctx.input("role")}.name`,
  }),
  value({
    id: "role_id",
    label: "Role ID",
    description: "A role's ID.",
    category: "roles",
    group: "About a role",
    icon: "fa-solid fa-fingerprint",
    keywords: ["id"],
    block: { type: "roles_id", text: "ID of role: {role}" },
    output: "String",
    inputs: [input.slot("role", "Role", "role")],
    code: (ctx) => `${ctx.input("role")}.id`,
  }),
  value({
    id: "role_position",
    label: "Role position",
    description: "Where a role sits in the role list. Higher numbers are higher up.",
    category: "roles",
    group: "About a role",
    icon: "fa-solid fa-sort",
    keywords: ["position", "order"],
    block: { type: "roles_position", text: "position of role: {role}" },
    output: "Number",
    inputs: [input.slot("role", "Role", "role")],
    code: (ctx) => `${ctx.input("role")}.position`,
  }),
  value({
    id: "role_color",
    label: "Role color",
    description: "A role's color, like #ff0000.",
    category: "roles",
    group: "About a role",
    icon: "fa-solid fa-palette",
    keywords: ["color", "colour", "hex"],
    block: { type: "roles_hexColor", text: "hex color of role: {role}" },
    output: "String",
    inputs: [input.slot("role", "Role", "role")],
    code: (ctx) => `${ctx.input("role")}.hexColor`,
  }),
  value({
    id: "role_created",
    label: "When the role was made",
    description: "The date a role was created.",
    category: "roles",
    group: "About a role",
    icon: "fa-solid fa-calendar-plus",
    keywords: ["created", "creation date"],
    block: { type: "roles_createdAt", text: "creation date of role: {role}" },
    output: "date",
    inputs: [input.slot("role", "Role", "role")],
    code: (ctx) => `${ctx.input("role")}.createdAt`,
  }),
  value({
    id: "role_has_permission",
    label: "Role has a permission?",
    description: "True if a role has a permission, like Ban Members.",
    category: "roles",
    group: "About a role",
    icon: "fa-solid fa-key",
    keywords: ["permission", "is admin", "can"],
    block: {
      type: "roles_hasPermission",
      text: ["does role {role}", "have the {permission}", "?"],
      parts: { permission: { part: "value", check: "permission" } },
      restrictions: [
        {
          type: "notEmpty",
          blockTypes: ["role"],
          message: "You must specify the role to check the permissions from.",
        },
        {
          type: "notEmpty",
          blockTypes: ["permission"],
          message: "You must specify the permission to check.",
        },
      ],
    },
    output: "Boolean",
    inputs: [
      input.slot("role", "Role", "role"),
      input.dropdown(
        "permission",
        "Permission",
        PERMISSIONS.map((p) => [p.label, p.value]),
        { default: "Administrator" },
      ),
    ],
    code: (ctx) => `${ctx.input("role")}.permissions.has(${ctx.input("permission")})`,
  }),
  value({
    id: "emoji_find",
    label: "Emoji by name or ID",
    description: "Finds a custom emoji in a server by its name or ID.",
    category: "emojis",
    group: "Emojis",
    icon: "fa-solid fa-magnifying-glass",
    keywords: ["get emoji", "find emoji"],
    block: {
      type: "emoji_getemojiwith",
      text: ["get emoji with {with} equal to {equal}", "on the server {server}"],
      parts: {
        with: {
          options: [
            ["name", "name"],
            ["id", "id"],
          ],
        },
      },
      colour: "DEB144",
      tooltip: "Gets an emoji with a specific name/id on a server.",
      restrictions: [
        { type: "notEmpty", blockTypes: ["equal"], message: "You must specify the name/id" },
        {
          type: "notEmpty",
          blockTypes: ["server"],
          message: "You must specify the server to get the emoji from",
        },
      ],
    },
    output: "emoji",
    inputs: [
      input.dropdown(
        "with",
        "Find by",
        [
          ["Name", "name"],
          ["ID", "id"],
        ],
        { default: "name" },
      ),
      input.text("equal", "Name or ID", { default: "" }),
      input.slot("server", "In server", "server"),
    ],
    code: (ctx) =>
      `(await getFromCollection(${ctx.input("server")}, "emojis", ${ctx.input("equal")}, ${ctx.input("with")}))`,
  }),
  value({
    id: "emoji_name",
    label: "Emoji name",
    description: "A custom emoji's name.",
    category: "emojis",
    group: "About an emoji",
    icon: "fa-solid fa-signature",
    keywords: ["name"],
    block: {
      type: "emoji_getname",
      text: "get name of emoji: {emoji}",
      colour: "DEB144",
      tooltip: "Gets the name of an emoji.",
      output: "string",
      restrictions: [
        { type: "notEmpty", blockTypes: ["emoji"], message: "You must specify the emoji" },
      ],
    },
    output: "String",
    inputs: [input.slot("emoji", "Emoji", "emoji")],
    code: (ctx) => `${ctx.input("emoji")}.name`,
  }),
  value({
    id: "emoji_server",
    label: "Server of an emoji",
    description: "The server a custom emoji belongs to.",
    category: "emojis",
    group: "About an emoji",
    icon: "fa-solid fa-server",
    keywords: ["server", "guild"],
    block: {
      type: "emoji_getguild",
      text: "server of emoji: {emoji}",
      colour: "DEB144",
      tooltip: "Gets the server of an emoji.",
      output: "string",
    },
    output: "server",
    inputs: [input.slot("emoji", "Emoji", "emoji")],
    code: (ctx) => `${ctx.input("emoji")}.guild`,
  }),
  value({
    id: "emoji_id",
    label: "Emoji ID",
    description: "A custom emoji's ID.",
    category: "emojis",
    group: "About an emoji",
    icon: "fa-solid fa-fingerprint",
    keywords: ["id"],
    block: {
      type: "emoji_getid",
      text: "get ID of the emoji: {emoji}",
      colour: "DEB144",
      tooltip: "Gets the ID of an emoji.",
      output: "string",
      restrictions: [
        { type: "notEmpty", blockTypes: ["emoji"], message: "You must specify the emoji" },
      ],
    },
    output: "String",
    inputs: [input.slot("emoji", "Emoji", "emoji")],
    code: (ctx) => `${ctx.input("emoji")}.id`,
  }),
  value({
    id: "emoji_image",
    label: "Emoji picture link",
    description: "A link to a custom emoji's picture or GIF.",
    category: "emojis",
    group: "About an emoji",
    icon: "fa-solid fa-image",
    keywords: ["url", "image", "picture"],
    block: {
      type: "emoji_getimageurl",
      text: "get image/gif URL of the emoji: {emoji}",
      colour: "DEB144",
      tooltip: "Gets the image/gif URL of an emoji.",
      output: "string",
      restrictions: [
        { type: "notEmpty", blockTypes: ["emoji"], message: "You must specify the emoji" },
      ],
    },
    output: "String",
    inputs: [input.slot("emoji", "Emoji", "emoji")],
    code: (ctx) => `${ctx.input("emoji")}.imageURL()`,
  }),
  value({
    id: "emoji_is_animated",
    label: "Emoji is animated?",
    description: "True if a custom emoji is a GIF.",
    category: "emojis",
    group: "About an emoji",
    icon: "fa-solid fa-film",
    keywords: ["animated", "gif"],
    block: {
      type: "emoji_isanimated",
      text: ["is emoji {emoji}", "animated?"],
      colour: "DEB144",
      tooltip: "Checks if an emoji is animated.",
      restrictions: [
        { type: "notEmpty", blockTypes: ["emoji"], message: "You must specify the emoji" },
      ],
    },
    output: "Boolean",
    inputs: [input.slot("emoji", "Emoji", "emoji")],
    code: (ctx) => `${ctx.input("emoji")}.animated`,
  }),
  value({
    id: "emoji_created",
    label: "When the emoji was made",
    description: "When a custom emoji was added, as a date or a timestamp.",
    category: "emojis",
    group: "About an emoji",
    icon: "fa-solid fa-calendar-plus",
    keywords: ["created"],
    block: {
      type: "emoji_created",
      text: "creation {type} of emoji: {emoji}",
      parts: {
        type: {
          options: [
            ["date", "createdAt"],
            ["timestamp", "createdTimestamp"],
          ],
        },
      },
      colour: "DEB144",
      inline: true,
      output: "String",
      restrictions: [
        { type: "notEmpty", blockTypes: ["emoji"], message: "You must specify the emoji" },
      ],
    },
    output: ["date", "Number"],
    inputs: [
      input.dropdown(
        "type",
        "As a",
        [
          ["Date", "createdAt"],
          ["Timestamp", "createdTimestamp"],
        ],
        { default: "createdAt" },
      ),
      input.slot("emoji", "Emoji", "emoji"),
    ],
    code: (ctx) =>
      `${ctx.input("emoji")}.${ctx.raw("type") === "createdTimestamp" ? "createdTimestamp" : "createdAt"}`,
  }),
  value({
    id: "emoji_author",
    label: "Who added the emoji",
    description:
      "The user who added a custom emoji. The emoji may need to be loaded from Discord first.",
    category: "emojis",
    group: "About an emoji",
    icon: "fa-solid fa-user",
    keywords: ["author", "creator", "uploader"],
    block: {
      type: "emoji_author",
      text: "get author of the emoji: {emoji}",
      colour: "DEB144",
      tooltip: "Gets the user that created the emoji.",
      restrictions: [
        { type: "notEmpty", blockTypes: ["emoji"], message: "You must specify the emoji" },
      ],
    },
    output: "user",
    inputs: [input.slot("emoji", "Emoji", "emoji")],
    code: (ctx) => `${ctx.input("emoji")}.author`,
  }),
  value({
    id: "sticker_find",
    label: "Sticker by name or ID",
    description: "Finds a sticker in a server by its name or ID.",
    category: "emojis",
    group: "Stickers",
    icon: "fa-solid fa-magnifying-glass",
    keywords: ["get sticker", "find sticker"],
    block: {
      type: "sticker_getwith",
      text: ["get sticker with {with} equal to {equal}", "on the server {server}"],
      parts: {
        with: {
          options: [
            ["name", "name"],
            ["id", "id"],
          ],
        },
      },
      colour: "#7a9e37",
      restrictions: [
        { type: "notEmpty", blockTypes: ["equal"], message: "You must specify the name/id" },
        {
          type: "notEmpty",
          blockTypes: ["server"],
          message: "You must specify the server to get the sticker from",
        },
      ],
    },
    output: "sticker",
    inputs: [
      input.dropdown(
        "with",
        "Find by",
        [
          ["Name", "name"],
          ["ID", "id"],
        ],
        { default: "name" },
      ),
      input.text("equal", "Name or ID", { default: "" }),
      input.slot("server", "In server", "server"),
    ],
    code: (ctx) =>
      `(await getFromCollection(${ctx.input("server")}, "stickers", ${ctx.input("equal")}, ${ctx.input("with")}))`,
  }),
  value({
    id: "sticker_name",
    label: "Sticker name",
    description: "A sticker's name.",
    category: "emojis",
    group: "About a sticker",
    icon: "fa-solid fa-signature",
    keywords: ["name"],
    block: {
      type: "sticker_getname",
      text: "get name of sticker: {sticker}",
      colour: "#7a9e37",
      output: "string",
      restrictions: [
        { type: "notEmpty", blockTypes: ["sticker"], message: "You must specify the sticker" },
      ],
    },
    output: "String",
    inputs: [input.slot("sticker", "Sticker", "sticker")],
    code: (ctx) => `${ctx.input("sticker")}.name`,
  }),
  value({
    id: "sticker_server",
    label: "Server of a sticker",
    description: "The server a sticker belongs to.",
    category: "emojis",
    group: "About a sticker",
    icon: "fa-solid fa-server",
    keywords: ["server", "guild"],
    block: {
      type: "sticker_getguild",
      text: "server of sticker: {sticker}",
      colour: "#7a9e37",
      output: "string",
    },
    output: "server",
    inputs: [input.slot("sticker", "Sticker", "sticker")],
    code: (ctx) => `${ctx.input("sticker")}.guild`,
  }),
  value({
    id: "sticker_id",
    label: "Sticker ID",
    description: "A sticker's ID.",
    category: "emojis",
    group: "About a sticker",
    icon: "fa-solid fa-fingerprint",
    keywords: ["id"],
    block: {
      type: "sticker_getid",
      text: "get ID of the sticker: {sticker}",
      colour: "#7a9e37",
      output: "string",
      restrictions: [
        { type: "notEmpty", blockTypes: ["sticker"], message: "You must specify the sticker" },
      ],
    },
    output: "String",
    inputs: [input.slot("sticker", "Sticker", "sticker")],
    code: (ctx) => `${ctx.input("sticker")}.id`,
  }),
  value({
    id: "sticker_image",
    label: "Sticker picture link",
    description: "A link to a sticker's picture.",
    category: "emojis",
    group: "About a sticker",
    icon: "fa-solid fa-image",
    keywords: ["url", "image", "picture"],
    block: {
      type: "sticker_geturl",
      text: "get image URL of the sticker: {sticker}",
      colour: "#7a9e37",
      output: "string",
      restrictions: [
        { type: "notEmpty", blockTypes: ["sticker"], message: "You must specify the sticker" },
      ],
    },
    output: "String",
    inputs: [input.slot("sticker", "Sticker", "sticker")],
    code: (ctx) => `${ctx.input("sticker")}.url`,
  }),
  value({
    id: "sticker_created",
    label: "When the sticker was made",
    description: "When a sticker was added, as a date or a timestamp.",
    category: "emojis",
    group: "About a sticker",
    icon: "fa-solid fa-calendar-plus",
    keywords: ["created"],
    block: {
      type: "sticker_created",
      text: "creation {type} of sticker: {sticker}",
      parts: {
        type: {
          options: [
            ["date", "createdAt"],
            ["timestamp", "createdTimestamp"],
          ],
        },
      },
      colour: "#7a9e37",
      output: "String",
      restrictions: [
        { type: "notEmpty", blockTypes: ["sticker"], message: "You must specify the sticker" },
      ],
    },
    output: ["date", "Number"],
    inputs: [
      input.dropdown(
        "type",
        "As a",
        [
          ["Date", "createdAt"],
          ["Timestamp", "createdTimestamp"],
        ],
        { default: "createdAt" },
      ),
      input.slot("sticker", "Sticker", "sticker"),
    ],
    code: (ctx) =>
      `${ctx.input("sticker")}.${ctx.raw("type") === "createdTimestamp" ? "createdTimestamp" : "createdAt"}`,
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
