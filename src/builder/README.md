# DisFuse Builder

The no-code editor for DisFuse projects. A project is either a **block
editor** project (the Blockly workspace, unchanged) or a **DisFuse
Builder** project (everything in this folder). The type is chosen when
the project is created and never changes.

Nothing in this folder imports Blockly. The one exception is adding a
template made with the block editor, which loads the conversion
(`Pages/Workspace/editor/templateConversion.js`, Blockly included) only
when it's needed.

## Words we use (and don't)

User-facing text in the builder follows a few rules:

- Never say "Blockly". It's the **block editor**, and its canvas is the
  **workspace**.
- No em dashes (—) in anything a user reads. Use a comma, a period, or
  parentheses.
- Plain words over jargon. A modal is a **form**. A custom ID is a
  **button ID** / **menu ID** / **form ID**, with a line of help. An
  action is a **step** when it helps to say so. "Interaction" only when
  there's no simpler word, and explained when used.
- Short, direct, friendly. No marketing voice, no filler, nothing that
  reads like it was generated.

## Concepts

| Builder | Block editor equivalent |
| --- | --- |
| **Event** ("When a message is sent") | a hat block |
| **Action** ("Send a message to a channel") | a block that stacks inside a hat |
| **Value** ("The bot's ping") | a round block that goes in an input |
| **Branch** (the "then" of an If) | a statement input on a block |
| **Message / form builder** | the component blocks inside send/reply/show-modal blocks |
| **Command** (Commands page) | the "add slash command" blocks + "when a slash command is received" |

## Folder map

```
builder/
  catalog/            every event, action, value and message/form piece
    define.js         defineEvent/defineAction/defineValue/defineComponent + input.*()
    packs.js          Workshop packs (both kinds) as catalog definitions
    blockPacks.js     a block pack's blocks as events, steps and values
    types.js          value types and which fit where
    contexts.js       what a command or event makes available
    categories.js     how pickers are organised
    index.js          gathers ./modules/*
    modules/*.js      the definitions, one module per toolbox area
  codegen/            saved project → the bot's index.js
    context.js        the ctx every code(ctx) receives; value/action code
    message.js        message builder → send options
    modal.js          form builder → ModalBuilder
    generate.js       the whole file: header, commands, events, login
    export.js         the ZIP download
  model/              pure data logic, no React
    ops.js            every change a project can go through (SHARED with the API)
    rules.js          Discord's command rules (SHARED with the API)
    permissions.js    what each collaborator may do (SHARED with the API)
    ids.js            new ids
    scope.js          which values can be used at a given place
    replies.js        answering a command, button, menu or form only once
    handlers.js       which event handles a step's buttons, menus and forms
    validate.js       problems to warn about (wrong place, missing input...)
    templates.js      getting a template ready to import (new ids, names that clash)
  convert/            block editor ↔ builder ("Copy to DisFuse Builder", templates)
    fromBlocks.js     walks every workspace, maps blocks to steps by `legacy`
    toBlocks.js       the way back: builder content → blocks, for templates
    commands.js       the "create slash commands" blocks → commands
    dispatch.js       moves `if (name of the command = "ping")` sections into /ping
    rules.js          the blocks that don't line up with their step by name
    blockJson.js      reading Blockly's saved JSON
  state/              React state, API calls and autosave
    BuilderProvider.jsx          a project on screen
    TemplateBuilderProvider.jsx  a template on screen (same pages), and a read-only preview
  ui/                 buttons, fields, modals, pickers: the builder's kit
  pages/              the dashboard, commands, events and builder screens
  components/         pieces those pages share (action cards, value pills...)
```

The builder's styles live in `src/styles/builder/`.

`scripts/check-builder.mjs` checks the catalog: every definition is valid,
every generated snippet parses, and every block editor toolbox block is
covered. Run it after changing anything under `catalog/` or `codegen/`:

```
node scripts/check-builder.mjs [--module channels] [--verbose]
```

## Saved data

A builder project is a normal project document with `type: "builder"` and
a `builder` field. Projects with no `type` are block editor projects.

```js
builder = {
  commands: Command[],
  events: Event[],
  variables: Variable[],     // { id, name }
}

Command = {
  id, kind: "slash" | "user" | "message",   // user/message = right-click commands
  name,                                     // slash: lowercase, no spaces; right-click: anything up to 32 chars
  description,                              // slash only
  nsfw: false,
  defaultMemberPermissions: string[],       // discord.js flag names; [] = everyone
  contexts: ("Guild" | "BotDM" | "PrivateChannel")[],
  integrationTypes: ("GuildInstall" | "UserInstall")[],
  nameLocalizations: { [locale]: string },
  descriptionLocalizations: { [locale]: string },   // slash only
  options: Option[],                        // slash only
  actions: Action[],                        // runs when the command has no subcommands
  created,
}

Option = {
  id, type,              // 1 subcommand, 2 group, 3 text, 4 whole number, 5 true/false,
                         // 6 user, 7 channel, 8 role, 9 user or role, 10 number, 11 file
  name, description, nameLocalizations, descriptionLocalizations,
  // value options (3-11):
  required, choices: [{ id, name, value }], channelTypes: number[],
  minValue, maxValue, minLength, maxLength,
  autocomplete, suggestions: [{ id, name, value }],
  // subcommands (1): options (value options only) + actions
  // groups (2): options (subcommands only)
}

Event = { id, type, label, settings: { [key]: InputValue }, actions: Action[], enabled, created }
```

A command with any subcommand or group doesn't run its own `actions`;
each subcommand runs its own. They are kept, not deleted, so removing the
last subcommand brings them back.

### Actions and values

```js
Action = {
  id, type,                        // type = a catalog action id
  inputs: { [key]: InputValue },
  branches: {                      // only for actions with branches
    [key]: Action[]                // a normal branch
         | RepeatItem[],           // a repeat branch (else-ifs, switch cases)
  },
  disabled?: true,                 // kept but skipped when generating
}

RepeatItem = { id, inputs: { [key]: InputValue }, actions: Action[] }

InputValue = { literal: any }      // what was typed/ticked/picked in the box
           | { ref: ValueRef }     // a value placed in the input instead

ValueRef = { kind: "value", type, inputs? }            // a catalog value (which can have inputs)
         | { kind: "event", key }                      // provided by the event this runs in
         | { kind: "branch", action, branch, key }     // provided by an outer step's branch
         | { kind: "variable", id }
         | { kind: "option", id, as?: "member" }       // a command option ("member" for users)
         | { kind: "input", source, input, key }       // provided by an outer input (e.g. "current item"
                                                       // inside a "filter list" condition)
```

`input.variable()` inputs (which variable a "set variable" step changes)
store `{ ref: { kind: "variable", id } }` too.

An input with no entry uses its definition's `default`.

Special inputs keep structured literals:

```js
// input.group(): { literal: [{ id, inputs: { [fieldKey]: InputValue } }] }
// input.message(): { literal: MessageSpec }
MessageSpec = {
  components: Component[],
  files: [{ id, inputs: { source, name, spoiler } }],
}
Component = { id, type, inputs: { [key]: InputValue }, children?: Component[] }

// input.modal(): { literal: ModalSpec }
ModalSpec = { inputs: { title, customId }, components: Component[] }
```

## The catalog

See `catalog/define.js` for every field. In short:

```js
import { defineAction, defineEvent, defineValue, input, ANY } from "../define.js";

defineEvent({
  id: "message_create",
  label: "When a message is sent",
  description: "Runs every time someone sends a message the bot can see.",
  category: "messages",
  icon: "fa-solid fa-message",
  legacy: ["msg_received"],
  listen: "Discord.Events.MessageCreate",
  params: ["message"],
  provides: ["message"],
  values: [
    { key: "content", label: "Message text", type: "String", code: "message.content" },
  ],
  settings: [input.boolean("ignoreBots", "Ignore messages from bots", { default: true })],
  prelude: (ctx) => (ctx.raw("ignoreBots") ? "if (message.author.bot) return;\n" : ""),
});

defineAction({
  id: "set_presence",
  label: "Set the bot's status",
  description: "Changes the bot's online status and what it shows it's doing.",
  category: "bot",
  icon: "fa-solid fa-circle-dot",
  legacy: ["main_presence"],
  inputs: [
    input.dropdown("status", "Status", [["Online", "online"], ["Idle", "idle"], ["Do not disturb", "dnd"], ["Invisible", "invisible"]]),
    input.text("name", "Activity"),
  ],
  code: (ctx) => `client.user.setPresence({ status: ${ctx.input("status")}, activities: [{ name: ${ctx.input("name")} }] });`,
});

defineAction({
  id: "if",
  label: "If",
  category: "logic",
  legacy: ["controls_if"],
  inputs: [input.boolean("condition", "Condition")],
  branches: [
    { key: "then", label: "Then" },
    { key: "elseif", label: "Otherwise, if", repeat: true, itemLabel: "Otherwise, if", inputs: [input.boolean("condition", "Condition")] },
    { key: "else", label: "Otherwise", optional: true },
  ],
  code: (ctx) => `if (${ctx.input("condition")}) {\n${ctx.branch("then")}}` +
    ctx.items("elseif").map((i) => ` else if (${i.input("condition")}) {\n${i.code}}`).join("") +
    (ctx.hasBranch("else") ? ` else {\n${ctx.branch("else")}}` : "") + "\n",
});

defineValue({
  id: "bot_ping",
  label: "Bot's ping",
  description: "How long the bot takes to hear back from Discord, in milliseconds.",
  category: "bot",
  legacy: ["main_ping"],
  output: "Number",
  code: () => "client.ws.ping",
});
```

### Contexts and scope (the checks)

- An **action or value** with `requires: ["repliable"]` can only be used
  where every listed context is available. Commands provide contexts by
  kind (`FLOW_CONTEXTS` in `contexts.js`); events list theirs in
  `provides`; a branch can add more with `contexts`.
- A **value listed on an event** (`values`) is only offered inside that
  event.
- A **value a branch provides** (`provides`) is only offered to steps
  inside that branch, however deep.
- **Command options** are offered as values inside the command (or
  subcommand) they belong to.
- **A value an input provides** (`provides` on an input, e.g. "current
  item" inside a "filter list" condition) is only offered inside that
  input.
- **Variables** are offered everywhere.
- An input only offers values whose `output` fits what it `accepts`
  (`canConnect` in `types.js`). Text inputs also take numbers, members
  and anything else with a text form; the generated code converts them
  with `String(...)`.
- Dropdowns never take values.
- **Answering an interaction** happens once (`replies.js`). Steps mark
  themselves `answers: "message" | "update" | "form"` or
  `afterAnswer: true`; the step picker greys out a second answer, or an
  edit with nothing to edit, and validation flags one that got moved
  there.

## Code generation

`code(ctx)` returns JavaScript, exactly like a block generator. The
mapping is one-to-one:

| Blockly generator | Builder |
| --- | --- |
| `generator.valueToCode(block, "x", Order.ATOMIC)` | `ctx.input("x")` |
| `block.getFieldValue("x")` | `ctx.raw("x")` |
| `generator.statementToCode(block, "x")` | `ctx.branch("x")` |
| mutator "has this input?" | `ctx.has("x")` / `ctx.hasBranch("x")` |

`ctx.message(key, { ephemeral })` builds the options object for a message
built in the message builder, and `ctx.modal(key)` a form. See the top of
`codegen/context.js` for everything else.

The generated file has the same structure as a block editor export (see
`src/functions/updateCode.js`), uses the same helper functions
(`utilFunctions`), and the ZIP has the same files.

## API

Every change is a normal REST call; there is no socket. Routes live
under `/projects/:projectId/builder` in the API
(`api/Routes/builderRouter.js`). The owner can make every change; a
collaborator only the ones their permissions cover (see
[Collaborators](#collaborators)). Each route applies the matching
operation from `model/ops.js`:

| Method | Path | Operation |
| --- | --- | --- |
| GET | `/` | the whole builder + `rev` + the caller's `access` |
| GET | `/rev` | just `rev`, `access`, `versioned` and `found`, polled to notice other people's changes |
| POST | `/commands` | createCommand |
| PATCH | `/commands/:commandId` | updateCommand |
| DELETE | `/commands/:commandId` | deleteCommand |
| POST | `/commands/:commandId/options` | createOption |
| PATCH | `/commands/:commandId/options/:optionId` | updateOption |
| DELETE | `/commands/:commandId/options/:optionId` | deleteOption |
| PUT | `/commands/:commandId/options-order` | reorderOptions |
| POST | `/events` | createEvent |
| PATCH | `/events/:eventId` | updateEvent |
| DELETE | `/events/:eventId` | deleteEvent |
| PUT | `/events-order` | reorderEvents |
| POST | `/flows/:flowId/actions` | insertAction |
| PATCH | `/flows/:flowId/actions/:actionId` | updateAction |
| PUT | `/flows/:flowId/actions/:actionId/position` | moveAction |
| DELETE | `/flows/:flowId/actions/:actionId` | deleteAction |
| PUT | `/flows/:flowId/actions/:actionId/branches/:branch` | setBranchEnabled |
| POST | `/flows/:flowId/actions/:actionId/branches/:branch/items` | addBranchItem |
| PATCH | `/flows/:flowId/actions/:actionId/branches/:branch/items/:itemId` | updateBranchItem |
| PUT | `/flows/:flowId/actions/:actionId/branches/:branch/items/:itemId/position` | moveBranchItem |
| DELETE | `/flows/:flowId/actions/:actionId/branches/:branch/items/:itemId` | removeBranchItem |
| POST | `/variables` | createVariable |
| PATCH | `/variables/:variableId` | renameVariable |
| DELETE | `/variables/:variableId` | deleteVariable |
| POST | `/import` | importTemplate |

The request body is the operation's payload minus what the path already
says. Every write answers `{ result, rev }`; a refused change answers
`{ error }` with a message written for the user.

On a project with [Version Control](#version-control), every route takes
`?version=<id>`: the version the page is on.

## Templates

A template is made with one editor or the other, picked when the
template is made and never changed (`type` on the template, `"blocks"`
when missing). That only decides how it's built: every template goes
into every project, so nobody has to make the same template twice. A
template made with the other editor is converted on the way in, and the
template itself never changes
(`Pages/Workspace/editor/templateConversion.js`):

- **A block template in a DisFuse Builder project.** Its blocks go
  through the same conversion as "Copy to DisFuse Builder"
  (`convert/fromBlocks.js`, below), and the result is imported like a
  builder template. The import dialog says what was left out.
- **A DisFuse Builder template in a block editor project.**
  `convert/toBlocks.js` turns its commands into "add slash command"
  blocks (in the workspace's "create slash commands" block, if it has
  one, since two would replace each other's commands) and a section per
  command in "when a slash command is received", and its events into
  hats. Steps become the block in their `legacy`, inputs by name. Every
  command, subcommand and event is then converted back with
  `fromBlocks.js` and compared; any that don't come out the same become
  a code block with the JavaScript the builder writes for them, so they
  still work exactly the same. Command settings the block editor has no
  blocks for (translations, minimums and maximums, suggestions, user
  installs) are left out. The dialog lists both.

Either way, the Workshop packs the template uses are installed for the
person importing it, as they always were for block templates. A
builder template's packs are read from its steps when it's published
(`published.packs`, `builderTemplatePackIds` in the API).

`scripts/check-template-conversion.mjs` checks the way back and packs in
both editors:

```
node scripts/check-template-conversion.mjs [--verbose]
```

A DisFuse Builder template is a builder with no bot: the same
`{ commands, events, variables }` a project saves, as JSON in the
template's `draft` / `published.data`. Nothing about a bot goes in it:
no token, no secrets, no settings. A step can still read a secret by
name (the Secret value); whoever adds the template is told which ones
to save on their own bot.

- **Building one.** `/templates/:id/builder/*` opens `pages/TemplateApp.jsx`
  for builder templates: the builder's own Commands, Events and step
  pages, given a template by `TemplateBuilderProvider` instead of a
  project. Changes are applied with `applyOp` as usual, but the whole
  template is saved as its draft a moment after the last change (like
  the block template builder), and nobody else sees it until Publish.
- **Saving and publishing.** The API checks a draft or a publish by
  importing it into an empty builder with `importTemplate`
  (`functions/templateAccess.js`), and stores what comes out, so a
  template can only hold what a project could.
- **Importing.** "Add to a project" opens the project with
  `?template=<id>`, and `components/templates/TemplateImport.jsx` shows
  what it adds. `prepareTemplateImport` (`model/templates.js`) gives
  everything new ids and renames commands and variables whose names
  are taken (`ping` becomes `ping-2`), then one `importTemplate`
  operation adds it all through the same create operations people use
  by hand. A collaborator needs the permissions adding it by hand would
  (`permissions.js`).

## Copying a block editor project

The block editor's Utilities menu has **Copy to DisFuse Builder**
(`components/workspace/BuilderCopyModal.jsx`). It makes a NEW builder
project from every workspace of the open project (the version being
edited, on a Version Control project), and leaves the block editor
project exactly as it was. Only the owner can do it, and it needs room
under their project limit like any new project.

The conversion runs in the editor, where Blockly has every block
registered (`Pages/Workspace/editor/builderCopy.js`), and the result goes
to `POST /projects/:id/builder-copy`, which checks it with
`importTemplate` into an empty builder (as for templates) and creates the
project with the same bot, description, visibility, invite permissions
and secrets. A bot can only have one builder project, so the dialog asks
for another bot's token when this one already has one.

How blocks become steps (`convert/fromBlocks.js`):

- A block becomes the step, value, event or message piece whose `legacy`
  lists it, with its inputs matched by name. `convert/rules.js` covers
  the rest: if/else, functions (copied to every place they're called),
  messages from before Components V2 (embeds become containers), and
  inputs the block editor counted in other units (milliseconds, radians).
- A value that belongs to an event or a step's section becomes a
  reference to it, found by comparing the code the block generates with
  the provided value's `code`.
- The "create slash commands" blocks become commands, and the sections
  of "when a slash command is received" that only check the command name
  move into that command (and its subcommands). Buttons, menus and forms
  are split into one event per ID the same way. Whatever wasn't for one
  command stays in a "When a slash command is used" event, so it still
  runs, behind a check that it isn't for a command that moved out.
- Blocks from Workshop packs become that pack's own steps, values and
  events (see [Workshop packs](#workshop-packs)), so the copy still uses
  the pack. The editor passes its loaded packs in, and
  `catalog/packs.js` gives each pack block a definition whose `legacy`
  is the block's type. BlockBuddy blocks, and blocks from a pack that
  isn't loaded, are left out with anything inside them; the steps around
  them stay. The dialog lists what was left out and why, and anything
  copied with a setting it couldn't keep.

`scripts/check-conversion.mjs` converts every toolbox block and a few
hand-written projects, and checks the result would save and generates a
bot that parses. Run it after changing `catalog/` or `convert/`:

```
node scripts/check-conversion.mjs [--verbose] [--type <blockType>]
```

## Workshop packs

The Workshop's packs are built one of two ways, picked when a pack is
made and never changed (`type` on the pack, `"blocks"` when missing):
**block packs** (custom Blockly blocks, built in the Blockly workshop,
unchanged) and **builder packs** (custom events, steps and values written
as forms). Everything a user reads calls both "packs", and how a pack was
built is all its kind decides: once installed, every pack works in every
project.

- **A block pack in DisFuse Builder.** `catalog/blockPacks.js` turns each
  block into a definition: a round block is a value, a stacked block a
  step (its statement inputs become sections), a hat an event (its first
  section is the event's steps; without one, the blocks stacked under
  it). Fields and value inputs become inputs. Its code is the block's own
  generator, run against the builder's ctx with stand-ins for `block` and
  `generator` (`valueToCode` → `ctx.code`, `getFieldValue` → `ctx.raw`,
  `statementToCode` → `ctx.branch`), the trust model block packs have
  always had. Ids are `pk_<packId>_b<hash of the block's name>`, so they
  hold across versions, and `legacy` is the block's name.
- **A builder pack in the block editor.**
  `Pages/Workspace/editor/builderPackBlocks.js` registers a block per
  item, with the same id as the builder's (`pk_<packId>_<itemId>`): an
  event is a hat, a step a stacked block with a statement input per
  section, a value a round block. Each value an event or section
  provides is a round block of its own (`packValueBlockType`). Their
  generators fill in the same code templates the builder does, and the
  pack's `setup` goes in once through Blockly's `definitions_`.

Because each side's definition lists the other side's block in `legacy`
(and provided values say which block reads them, `block`), "Copy to
DisFuse Builder" and templates going either way keep pack steps as steps
of the same pack.

A builder pack is a list of definitions written as forms and code
templates. Nothing about a bot goes in it: no token, secrets or settings.

```js
PackItems = { setup, events: PackEvent[], actions: PackAction[], values: PackValue[] }
```

The full shape, the checks run before publishing (`packProblems`) and the
rule that a new version can't break projects using the last one
(`breakingChanges`, `restoreBreaking`) are in `model/packs.js`, which is
SHARED with the API (`functions/builder/packs.js`). Code templates use
`{{input}}`, `{{raw:input}}`, `{{steps:section}}`, `{{steps}}` (an
event's own listener) and `{{id}}`.

- **Building one.** `/workshop/:id/workspace` opens `pages/PackApp.jsx`
  for builder packs (`PackWorkspaceGate` picks the editor). The draft
  autosaves to the pack's `data` as JSON; publishing (`PATCH
  /workshop/:id/items`) stores `{ items, version, changelog }` in
  `versions`. The preview beside each item is made by the real generator
  (`components/packs/preview.js`).
- **Using one.** `catalog/packs.js` turns the latest version of a pack
  into ordinary `defineEvent` / `defineAction` / `defineValue`
  definitions, ids `pk_<packId>_<itemId>`, each pack its own category (in
  the pack's color) under a "Workshop" heading in the pickers.
  `state/packs.js` gives a project or template the built-in catalog plus
  the person's installed packs (both kinds) and any pack the builder
  already uses, so pages always read the catalog from `useBuilder()`,
  never the built-in one directly. The block editor loads both kinds too
  (`loadBlockPacks`, `registerBlockPacks`), and its toolbox lists a
  builder pack's blocks with a box in each input that has one.
- **Packages and shared code.** The pack's `dependencies` go in the bot's
  package.json; its `setup` code goes once at the top of the bot when
  anything from the pack is used.

## Collaborators

Collaborators are stored the way the block editor stores them, as
Discord user ids in `project.collaborators`. Unlike the block editor,
each one has their own permissions:

```js
project.collaboratorPermissions = { [userId]: PermissionId[] }   // select: false
```

`model/permissions.js` lists every permission (one per action: creating,
renaming and deleting commands are three permissions, and a command's
steps and an event's steps have separate ones), the presets the
collaborators page offers, and `permissionsForOp(builder, name, payload)`,
which says what each operation in `ops.js` needs. The page runs it in
`BuilderProvider.change()` so a refused change never leaves the browser;
the API runs it again in `builderRouter.js` against the saved builder.

Everyone on the project can open it and see all of it. Secrets and the
bot token are only sent to collaborators with `secrets.view` /
`token.view`. Project settings, secrets and Insights accept collaborators
with the matching permission (field by field for settings). Control and
deleting the project stay with the owner.

People are managed at `/workspace/collaborators`, through
`api/Routes/builderCollaboratorRouter.js`:

| Method | Path | |
| --- | --- | --- |
| GET | `/collaborators` | everyone on the project, with their permissions |
| POST | `/collaborators` | invite `{ userId, permissions }`; sends a `projectInvite` notification |
| PATCH | `/collaborators/:userId` | change `{ permissions }` |
| DELETE | `/collaborators/:userId` | remove someone, or yourself to leave |

A collaborator with `collaborators.invite` / `.permissions` / `.remove`
can do the same, but can only give or take away permissions they hold.
How an invite reaches someone (inbox, inbox and DM, or not at all)
follows their `projectInvites` notification setting.

There is still no socket. While anyone else can change the project, the
page polls `GET /rev` every few seconds and reloads the builder when the
revision moved and none of its own changes are waiting to be saved.

## Version Control

`/workspace/versions` (`pages/VersionsPage.jsx`). The block editor's
Version Control, for builder projects, on a page instead of a panel. It
uses the same API routes and the same `project.versions` array
(`api/Routes/versionRouter.js`, `functions/versions.js`); a builder
version holds `builder` + `builderRev` where a block editor one holds
`workspaces`:

```js
project.versions = [{
  _id, number, name, created, updated,
  createdFrom?: { version, name, number },
  builder: { commands, events, variables },   // same shape as project.builder
  builderRev: number,                         // this version's own revision
}]
```

| Method | Path | |
| --- | --- | --- |
| GET | `/projects/:id/versions` | every version (counts, no builders) and what the caller may do |
| GET | `/projects/:id/versions/:versionId` | one version with its `builder` and `rev` |
| POST | `/projects/:id/versions` | create `{ name?, source }`: a version id, `"blank"`, or `"current"` for the first |
| PATCH | `/projects/:id/versions/:versionId` | rename `{ name }` |
| DELETE | `/projects/:id/versions/:versionId` | delete; `reverted: true` when it was the last one |

- **The first version** is a copy of `project.builder`, and from then on
  the project saves into versions. The copy is only stored if the builder
  didn't change while it was being made. `project.builder` is left alone
  (nothing reads it any more), like `workspaces` in the block editor.
- **Saving.** Every builder route takes `?version=<id>` and reads from and
  writes into that version, compare-and-set on its own `builderRev`. A
  write without a version on a project that has them, or with one on a
  project that doesn't (or for a deleted version), is refused with
  `reload: true` instead of landing where nobody is looking. Reads fall
  back to the newest version and say which one they read (`version`).
- **Which version a page is on** is the page's choice, never stored on the
  project, so two people can be on two versions. `BuilderProvider` opens
  `?v=<id>`, else the one this browser was last on (`localStorage`, the
  same key as the block editor), else the newest. Every queued change
  carries the version it was made in, and switching saves what's waiting
  first. When the poll says the version is gone (`found: false`), the
  page loads again and the API picks another.
- **Deleting the last version** turns Version Control off and leaves the
  project with an empty builder (its `builderRev` moves, so open pages
  notice).
- **Who.** The owner creates, renames and deletes. Collaborators switch
  between versions and change the one they're on, as their permissions
  allow. The plan limit (3 free, 25 Premium) is the owner's and only
  stops new versions.
- **Export** can export any version (`ExportModal`'s `versionId`, or its
  version picker). Cloning a project copies its newest version.
