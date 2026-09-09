import { Link } from "react-router-dom";

import LegalDoc, { Callout, DefTable, Ref } from "../components/legal/LegalDoc";

/* =====================================================================
   Privacy Policy
   ---------------------------------------------------------------------
   Same shell as the Terms — see components/legal/LegalDoc.jsx. Only the
   words are here.

   This policy describes what the Platform actually does, so it has to
   be kept in step with the code. The sections most likely to drift are
   `collect-*` (what the API stores), `insights` (what generated bot code
   reports), `sharing` (our processors) and `retention` (the windows in
   the API's config.js).
   ===================================================================== */

const LAST_UPDATED = "August 21, 2026";

const DISCORD_INVITE = "https://discord.gg/Xwx4zkQcmJ";
const SUPPORT_EMAIL = "support@disfuse.xyz";

const summary = [
  {
    icon: "fa-brands fa-discord",
    title: "Discord is your login",
    text: "We ask Discord for your ID, username, display name and avatar. We never see your Discord password.",
  },
  {
    icon: "fa-solid fa-credit-card",
    title: "We never see your card",
    text: "Stripe handles every payment. We store your plan, its status and Stripe's identifiers — never card numbers.",
  },
  {
    icon: "fa-solid fa-ban",
    title: "We don't sell your data",
    text: "No advertising, no data brokers, no selling or sharing for cross-context behavioral ads. Ever.",
  },
  {
    icon: "fa-solid fa-eye",
    title: "Staff can see private work",
    text: "To moderate the Platform, staff can view any project or pack — public or private. Assume nothing here is private from us.",
  },
];

const parts = [
  {
    title: "Part I — Scope",
    sections: [
      {
        id: "about",
        title: "About this policy",
        body: (
          <>
            <p>
              This Privacy Policy explains what information DisFuse (
              <strong>“we”</strong>, <strong>“us”</strong>,{" "}
              <strong>“our”</strong>) collects, why we collect it, who we share
              it with, how long we keep it and what control you have over it.
            </p>
            <p>It applies to:</p>
            <ul>
              <li>
                the DisFuse website and editor at{" "}
                <a href="https://disfuse.xyz">disfuse.xyz</a>;
              </li>
              <li>
                the DisFuse API at <code>api.disfuse.xyz</code>, including its
                real-time collaboration, Control and analytics endpoints;
              </li>
              <li>
                published DisFuse Websites and bot dashboards at{" "}
                <code>sites.disfuse.xyz</code>;
              </li>
              <li>the DisFuse Discord bot and our Discord server; and</li>
              <li>DisFuse Premium and its billing.</li>
            </ul>
            <p>
              Using DisFuse means this policy applies to you. It works alongside
              our <Link to="/tos">Terms of Service</Link>.
            </p>
            <Callout tone="warning" title="What this policy does not cover">
              It does not cover <strong>bots that other people build</strong>{" "}
              with DisFuse. A bot runs on its owner's own host, under its
              owner's control, and its owner decides what it collects. If a bot
              in your Discord server is collecting data about you, ask its
              owner. This policy also does not cover Discord itself, Stripe's
              own handling of your payment details, or any other website we link
              to.
            </Callout>
          </>
        ),
      },
      {
        id: "who-we-are",
        title: "Who we are",
        body: (
          <>
            <p>
              DisFuse is an independent project operated by a small team based
              in the United States. For the purposes of data protection law, we
              are the <strong>controller</strong> of the information described
              in this policy, except where we say otherwise — most importantly
              for Insights events and dashboard data, where the bot's owner is
              the controller and we act as their <strong>processor</strong>. See{" "}
              <Ref to="your-bots-data" />.
            </p>
            <p>
              You can reach us through the channels in{" "}
              <Ref to="contact-privacy" />.
            </p>
          </>
        ),
      },
    ],
  },
  {
    title: "Part II — What we collect",
    sections: [
      {
        id: "collect-discord",
        title: "Information from Discord",
        body: (
          <>
            <p>
              DisFuse has no sign-up form and no password of its own. You sign
              in through Discord's OAuth flow, which asks your permission before
              anything is shared.
            </p>
            <p>
              <strong>Signing in to DisFuse</strong> uses the{" "}
              <code>identify</code> scope. From it we store:
            </p>
            <ul>
              <li>your Discord user ID;</li>
              <li>your username and display name;</li>
              <li>your avatar image URL; and</li>
              <li>your email address, only where Discord provides it to us.</li>
            </ul>
            <p>
              <strong>Your access token</strong> is held in your browser's local
              storage and sent to our API with each request so we know who you
              are. Our API caches the identity behind a token in memory for up
              to five minutes to avoid asking Discord repeatedly. We do not
              store your access token in our database, and we never receive your
              Discord password.
            </p>
            <p>
              <strong>Visiting a published bot dashboard</strong> that needs to
              know which servers you are in additionally uses the{" "}
              <code>guilds</code> scope. We read your server list from Discord
              to work out which servers you may configure. That list is used for
              the check and cached briefly; it is not stored in our database.
            </p>
            <p>
              <strong>
                Your username and avatar are copied onto your projects
              </strong>{" "}
              so they can be displayed, and refreshed when you sign in.
            </p>
          </>
        ),
      },
      {
        id: "collect-you",
        title: "Information you give us",
        body: (
          <>
            <p>Everything you create on DisFuse is stored so it can work:</p>
            <DefTable
              headings={["What", "Includes"]}
              rows={[
                [
                  <strong>Projects</strong>,
                  "Name, description, visibility, block workspace data for each tab, creation and edit times, likes, clones, collaborator list and suspension state.",
                ],
                [
                  <strong>Bot credentials</strong>,
                  "The bot token you attach to a project, plus the Discord bot profile it resolves to. Tokens are replaced with “[HIDDEN]” before a project is sent to anyone who is not its owner.",
                ],
                [
                  <strong>Secrets</strong>,
                  "The names and values of the environment variables you define for a project, so they can be written into your export.",
                ],
                [
                  <strong>Versions</strong>,
                  "Saved snapshots of a project — every workspace, its blocks, the name you gave the version and when it was created.",
                ],
                [
                  <strong>Block packs</strong>,
                  "Pack details, block definitions and generators, versions, changelogs, dependencies, visibility and who has installed them.",
                ],
                [
                  <strong>Custom blocks</strong>,
                  "Blocks generated for you by BlockBuddy and saved to your account.",
                ],
                [
                  <strong>Websites</strong>,
                  "Site name, pages and element trees, theme, SEO title and description, favicon, custom path, publish state and the access rule for its dashboard.",
                ],
                [
                  <strong>Community activity</strong>,
                  "Comments and replies (including their edit history), likes, favorites, and the users you have blocked.",
                ],
                [
                  <strong>Settings</strong>,
                  "Workspace theme, renderer, grid, sounds and toolbox preferences; notification preferences; optimization preferences; and your Insights retention choice.",
                ],
                [
                  <strong>Support messages</strong>,
                  "Whatever you tell us in a ticket or a DM, including anything you attach.",
                ],
              ]}
            />
            <Callout
              tone="danger"
              title="Secrets and tokens are stored, not encrypted end-to-end"
            >
              Bot tokens and secret values are stored in our database so we can
              return them to you and include them in your export. They are
              withheld from users who are not the project owner, but DisFuse
              staff and our infrastructure can technically access them. Treat
              them as you would any credential you give to a third-party
              service: use a token you can rotate, and rotate it if you have any
              doubt.
            </Callout>
          </>
        ),
      },
      {
        id: "collect-automatic",
        title: "Information collected automatically",
        body: (
          <>
            <p>
              <strong>Local storage.</strong> Your Discord access token, your UI
              preferences and short-lived caches are kept in your browser. This
              is what keeps you signed in. DisFuse does not use advertising
              cookies or third-party tracking cookies; Stripe sets its own
              cookies on its checkout and billing pages, which are governed by
              Stripe's privacy policy.
            </p>
            <p>
              <strong>Technical request data.</strong> Like any web service, our
              API and our infrastructure providers process the IP address, user
              agent, timestamps and request paths involved in serving you. This
              is used for delivering the service, rate limiting, debugging and
              abuse prevention.
            </p>
            <p>
              <strong>Moderation and activity logs.</strong> Project creation,
              edits and deletion, new account registrations, and the start and
              end of Premium subscriptions are logged to an internal staff
              channel with your username and avatar. Automated moderation
              results are logged with the project involved.
            </p>
            <p>
              <strong>Real-time sessions.</strong> While a project is open, our
              socket layer knows which project you have joined and which block
              you have selected, so collaborators can see each other. This is
              held in memory for the session only.
            </p>
            <p>
              <strong>Aggregate counts.</strong> We publish total user and
              project counts on the homepage. These are counts only and identify
              nobody.
            </p>
          </>
        ),
      },
      {
        id: "collect-payments",
        title: "Payment and subscription information",
        body: (
          <>
            <p>
              DisFuse Premium is billed through{" "}
              <a
                href="https://stripe.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
              >
                Stripe
              </a>
              . Checkout and the billing portal are hosted by Stripe, on
              Stripe's own pages.
            </p>
            <p>
              <strong>We never receive your card number</strong>, CVC, bank
              details or similar payment credentials. No Stripe key of any kind
              reaches your browser through DisFuse.
            </p>
            <p>What we do store on your account is:</p>
            <ul>
              <li>
                your Stripe customer ID and, for recurring plans, your
                subscription ID;
              </li>
              <li>the plan you bought and its Stripe price ID;</li>
              <li>
                your subscription status (active, trialing, past due, canceled,
                lifetime, and so on);
              </li>
              <li>
                when you subscribed, the current billing period's start and end,
                whether cancellation is scheduled, and when you canceled;
              </li>
              <li>
                the ID of the last Stripe event applied to your account, and the
                IDs of processed events, so the same event is never applied
                twice; and
              </li>
              <li>
                which Premium notifications you have already been sent, so you
                are not messaged twice about the same change.
              </li>
            </ul>
            <p>
              We may pass your email address, display name and Discord ID to
              Stripe when creating your customer record, so receipts reach you
              and so we can match a payment back to your account. Stripe holds
              your full billing information and processes it as an independent
              controller under its own privacy policy.
            </p>
          </>
        ),
      },
      {
        id: "insights",
        title: "Bot Insights — data your bot reports",
        body: (
          <>
            <p>
              DisFuse writes analytics instrumentation into the code it
              generates. When you run your bot, that code batches events and
              sends them to our API roughly every ten seconds, authenticating
              with your bot's own Discord token.
            </p>
            <p>
              <strong>What each event can contain:</strong> when it happened;
              the event type (slash command, button or menu, modal, context
              menu, autocomplete, bot ready, added to a server, removed from a
              server, error); the command or component name; the interaction
              kind; the Discord user ID and the username they had at the time;
              the Discord server ID and the name it had at the time; the channel
              ID; a number such as handling time in milliseconds or a member
              count; whether it succeeded; and a short detail string such as an
              error message.
            </p>
            <p>
              <strong>Periodic snapshots</strong> also record the bot's server
              count, total member reach, channel count and a truncated list of
              its largest servers.
            </p>
            <p>
              <strong>Bot-supplied text is sanitized and truncated</strong>{" "}
              before it is stored, and timestamps that are implausibly far from
              the present are clamped.
            </p>
            <ul>
              <li>
                <strong>This happens for every project</strong>, free or
                Premium. Premium is what unlocks <em>viewing</em> the data.
              </li>
              <li>
                <strong>Only the project owner can read it.</strong>{" "}
                Collaborators cannot.
              </li>
              <li>
                <strong>Retention is capped at 90 days</strong> and can be set
                lower (7, 14, 30, 60 or 90 days) by the owner. Older events are
                deleted automatically, including for bots that have been
                switched off. A project also keeps at most 20,000 raw events.
              </li>
              <li>
                <strong>You can turn it off.</strong> Set{" "}
                <code>DISFUSE_INSIGHTS=off</code> in the bot's environment, or
                delete the instrumentation from the exported code. The bot stays
                fully functional either way.
              </li>
              <li>
                <strong>The owner can clear it</strong> from the Insights page
                at any time.
              </li>
            </ul>
            <Callout tone="warning" title="If you use a bot built on DisFuse">
              When you run a slash command on such a bot, its owner may be
              storing your Discord ID, your username, and which server and
              channel you used it in, for up to 90 days. We hold that data on
              the owner's behalf. Ask the bot's owner to delete it, or contact
              us and we will pass the request on.
            </Callout>
          </>
        ),
      },
      {
        id: "control-privacy",
        title: "Control sessions",
        body: (
          <>
            <p>
              Control connects to Discord as your bot and mirrors what the bot
              can see so you can use it like a Discord client. While a session
              is open, our server holds in memory: the bot's servers, channels
              and roles; a bounded cache of members, messages and users; and
              presence, typing and voice state for the server you have open.
            </p>
            <ul>
              <li>
                <strong>None of it is written to our database.</strong> When the
                last controller disconnects the session lingers briefly so a
                page refresh is free, then the gateway connection is closed and
                the cache is dropped entirely.
              </li>
              <li>
                <strong>The bot token is not kept on the session object</strong>{" "}
                — it is handed to the Discord connection and to the REST client
                and is not reachable from the socket handlers.
              </li>
              <li>
                <strong>Actions you take are visible in Discord.</strong>{" "}
                Messages, moderation actions and settings changes are attributed
                to your bot and appear in the server's Discord audit log. That
                record belongs to Discord, not to us.
              </li>
              <li>
                <strong>Subscription is re-checked while you work</strong>, so a
                session ends if Premium lapses.
              </li>
            </ul>
          </>
        ),
      },
      {
        id: "websites-privacy",
        title: "Websites and dashboard visitors",
        body: (
          <>
            <p>
              A published DisFuse Website is a public page. Anything its owner
              puts on it — text, images, links, SEO fields — is visible to
              anyone with the address.
            </p>
            <p>
              <strong>If a website includes a dashboard</strong>, visitors sign
              in with Discord to configure settings. In that case we process:
            </p>
            <ul>
              <li>
                the visitor's Discord identity, to know whose settings are
                whose;
              </li>
              <li>
                the visitor's server list, checked against the access rule the
                website's owner configured, to decide whether they may configure
                a given server — read from Discord, cached briefly, not stored;
                and
              </li>
              <li>
                the settings themselves, stored against either a Discord server
                ID or the visitor's own Discord user ID.
              </li>
            </ul>
            <p>
              Settings are also readable and writable by the bot the website
              belongs to, authenticating with its own token, and by the
              website's owner in the builder. Values are bounded in size and
              number.
            </p>
            <Callout tone="info" title="Whose data is it?">
              Dashboard settings are collected for the bot owner's purposes, so{" "}
              <strong>the bot owner is the controller</strong> and we host the
              data for them. If you are a dashboard visitor and want your
              settings removed, ask the bot's owner first; you can also contact
              us and we will help.
            </Callout>
          </>
        ),
      },
      {
        id: "your-bots-data",
        title: "Data your bot collects about other people",
        body: (
          <>
            <p>
              Two kinds of data on DisFuse are about <em>your bot's users</em>{" "}
              rather than about you: Insight events, and dashboard settings. For
              both of them:
            </p>
            <ul>
              <li>
                <strong>You are the controller.</strong> You decide that the bot
                runs, where it runs, and what it does. We store the resulting
                data on your behalf as a processor.
              </li>
              <li>
                <strong>Your legal duties are yours.</strong> If the law where
                your users live requires notice, a privacy policy, a lawful
                basis or consent, providing it is your responsibility. Our
                policy covers DisFuse, not your bot.
              </li>
              <li>
                <strong>Handle requests you receive.</strong> If one of your
                bot's users asks you to delete their data, you can clear a
                project's Insight logs, delete dashboard settings, or ask us for
                help.
              </li>
              <li>
                <strong>Collect less.</strong> Turn Insights off if you do not
                need it, choose the shortest retention window that works, and do
                not put sensitive personal data into dashboard settings.
              </li>
            </ul>
          </>
        ),
      },
    ],
  },
  {
    title: "Part III — How we use and share it",
    sections: [
      {
        id: "use",
        title: "How we use your information",
        body: (
          <>
            <p>We use the information described above to:</p>
            <ul>
              <li>
                run the Platform — sign you in, load and save your projects,
                generate your bot's code, and build your exports;
              </li>
              <li>
                power the features you use: collaboration, comments, the
                Workshop, BlockBuddy, Insights, Control, Websites and Version
                Control;
              </li>
              <li>
                display your public profile, projects and packs to other users;
              </li>
              <li>
                send you notifications — inbox items for comments, replies,
                likes and clones, according to your notification settings, and
                DMs about your Premium subscription;
              </li>
              <li>
                take payment, manage your subscription, issue receipts, and
                apply the Premium role in our Discord server;
              </li>
              <li>
                keep the Platform safe: rate limiting, abuse detection,
                automated and staff moderation, enforcing bans and suspensions,
                and investigating reports;
              </li>
              <li>
                maintain and improve DisFuse — debugging, measuring aggregate
                usage, and understanding which features get used;
              </li>
              <li>respond to your support requests; and</li>
              <li>comply with law and enforce our Terms.</li>
            </ul>
            <p>
              <strong>Lawful bases (EEA/UK).</strong> Where GDPR applies, we
              rely on: <em>contract</em> for running your account, your projects
              and your subscription; <em>legitimate interests</em> for security,
              moderation, abuse prevention, service improvement and
              service-related communications; <em>legal obligation</em> for tax,
              accounting and lawful requests; and <em>consent</em> where we ask
              for it, which you may withdraw at any time.
            </p>
          </>
        ),
      },
      {
        id: "ai",
        title: "AI, BlockBuddy and automated moderation",
        body: (
          <>
            <p>
              DisFuse uses third-party AI models in two places, and both involve
              sending data outside our systems.
            </p>
            <p>
              <strong>BlockBuddy</strong>, when you use it, sends your prompt
              plus the relevant material — the workspace you asked about, the
              JavaScript you asked to convert, or a description of the block you
              want — to our AI provider, and returns the result to you. Prompts
              and results may be logged so we can debug problems, measure
              quality and detect abuse. Blocks BlockBuddy generates for you are
              saved to your account.
            </p>
            <p>
              <strong>Automated moderation</strong> scans project workspaces
              when they change, to detect content that breaks our{" "}
              <Link to="/tos#acceptable-use">Terms of Service</Link>. The
              workspace is sent to our AI provider and comes back with a
              recommendation to take no action, to alert staff, or to suspend
              the project.{" "}
              <strong>
                Bot tokens are pattern-matched and replaced before the workspace
                is sent.
              </strong>{" "}
              Results are logged for staff review.
            </p>
            <ul>
              <li>
                <strong>Automated decisions are reviewable.</strong> A project
                can be suspended automatically for serious cases. If that
                happens to you, open a ticket and a human will look at it. You
                have the right to ask for human review of an automated decision
                that significantly affects you.
              </li>
              <li>
                <strong>Do not put secrets in prompts.</strong> Anything you
                type into BlockBuddy is sent to a third party.
              </li>
              <li>
                <strong>We do not train our own models</strong> on your data.
                What our AI provider does with data sent to it is governed by
                its own terms; we request that our requests be handled
                privately.
              </li>
            </ul>
          </>
        ),
      },
      {
        id: "sharing",
        title: "How we share information",
        body: (
          <>
            <Callout tone="success" title="We do not sell your data">
              We do not sell personal information, and we do not share it for
              cross-context behavioral advertising. There is no advertising on
              DisFuse and no data broker receives anything from us.
            </Callout>
            <p>We share information only in these situations:</p>
            <ul>
              <li>
                <strong>With other users, because you chose to.</strong> Public
                projects, public block packs, comments, likes, your profile and
                published websites are visible to others. Collaborators you
                invite can see the project you invited them to, including its
                blocks.
              </li>
              <li>
                <strong>With DisFuse staff.</strong> Staff can view any project,
                block pack or website — public or private — for moderation,
                support and abuse investigation.
              </li>
              <li>
                <strong>With service providers</strong> who run parts of the
                Platform for us, listed below. They may only process data to
                provide their service to us.
              </li>
              <li>
                <strong>With Discord</strong>, when we act on your behalf —
                verifying your identity, assigning the Premium role, sending you
                a DM, or making an API call your bot's session requested.
              </li>
              <li>
                <strong>For legal reasons</strong>, where we reasonably believe
                disclosure is required by law or necessary to investigate fraud,
                prevent harm, protect someone's safety, or enforce our Terms.
              </li>
              <li>
                <strong>In a business transfer</strong>, if DisFuse is merged,
                acquired or its assets are transferred. We will tell you before
                your information becomes subject to a different policy.
              </li>
              <li>
                <strong>With your consent</strong>, for anything else.
              </li>
            </ul>
            <DefTable
              headings={["Provider", "What it handles"]}
              rows={[
                [
                  <strong>Discord</strong>,
                  "Authentication, your identity, your bot's API, permission checks, staff logs, and DMs from the DisFuse bot.",
                ],
                [
                  <strong>Stripe</strong>,
                  "Payments, checkout, invoices, the billing portal and subscription state.",
                ],
                [
                  <strong>MongoDB Atlas</strong>,
                  "The database that stores accounts, projects, packs, websites and Insight logs.",
                ],
                [
                  <strong>AI provider</strong>,
                  "BlockBuddy requests and automated moderation scans.",
                ],
                [
                  <strong>Hosting &amp; CDN providers</strong>,
                  "Serving the website, the API and published DisFuse Websites.",
                ],
              ]}
            />
          </>
        ),
      },
      {
        id: "public-private",
        title: "Public and private creations",
        body: (
          <>
            <p>
              You choose whether each project and block pack is public or
              private, and whether a website is published.
            </p>
            <ul>
              <li>
                <strong>Private</strong> projects and packs are visible to you,
                your collaborators and DisFuse staff. They do not appear in
                Explore and cannot be cloned by other users.
              </li>
              <li>
                <strong>Public</strong> projects and packs are visible to every
                signed-in DisFuse user, appear in Explore and the Workshop, may
                be featured by us, and may be cloned, modified and reused within
                the Platform.
              </li>
              <li>
                <strong>Published websites</strong> are visible to anyone on the
                internet, with no sign-in, and may be indexed by search engines.
              </li>
              <li>
                <strong>Publishing is hard to undo.</strong> Once a project has
                been cloned or a pack installed, making the original private
                does not remove other people's copies. We cannot guarantee that
                shared content can be fully withdrawn.
              </li>
              <li>
                <strong>Bot tokens are never public.</strong> A project's token
                is withheld from everyone except its owner, whatever its
                visibility. Secrets are similarly not exposed to people who do
                not have access to the project.
              </li>
            </ul>
          </>
        ),
      },
    ],
  },
  {
    title: "Part IV — Your data and your rights",
    sections: [
      {
        id: "retention",
        title: "How long we keep things",
        body: (
          <>
            <p>
              We keep information for as long as it is needed for the purpose it
              was collected, and then delete it. In practice:
            </p>
            <DefTable
              headings={["Data", "Kept for"]}
              rows={[
                [
                  <strong>Account data</strong>,
                  "As long as your account exists. Deleted when you ask us to delete your account.",
                ],
                [
                  <strong>Projects, versions, packs, websites</strong>,
                  "Until you delete them, or until your account is deleted.",
                ],
                [
                  <strong>Bot tokens and secrets</strong>,
                  "Until you change or remove them, or the project is deleted.",
                ],
                [
                  <strong>Insight events</strong>,
                  "The retention window the project owner chose — at most 90 days — and no more than 20,000 events per project. Pruned automatically even for bots that have stopped running.",
                ],
                [
                  <strong>Control session data</strong>,
                  "Memory only, for the duration of the session, plus a short idle window. Never written to disk.",
                ],
                [
                  <strong>Dashboard settings</strong>,
                  "Until deleted by the bot, the visitor or the website's owner, or until the website is deleted.",
                ],
                [
                  <strong>Comments</strong>,
                  "Until deleted. Edit history is retained with the comment.",
                ],
                [
                  <strong>Subscription records</strong>,
                  "For as long as your account exists, and for as long afterward as tax and accounting law requires. Stripe keeps its own records under its own schedule.",
                ],
                [
                  <strong>Processed payment events</strong>,
                  "30 days, purely so the same event is never applied twice.",
                ],
                [
                  <strong>Moderation and staff logs</strong>,
                  "As long as needed for safety, abuse prevention and enforcement.",
                ],
                [
                  <strong>Backups</strong>,
                  "Deleted data may persist in backups for a limited period before being overwritten.",
                ],
              ]}
            />
          </>
        ),
      },
      {
        id: "rights",
        title: "Your rights and choices",
        body: (
          <>
            <p>
              Whatever the law where you live says, DisFuse gives every user
              these controls:
            </p>
            <ul>
              <li>
                <strong>Export your work</strong> — download a <code>.df</code>{" "}
                file of any project or workspace, plus its generated code, at
                any time from the editor.
              </li>
              <li>
                <strong>Edit or delete</strong> your projects, versions, packs,
                websites, comments and settings yourself.
              </li>
              <li>
                <strong>Change visibility</strong> of a project or pack, or
                unpublish a website.
              </li>
              <li>
                <strong>Turn off Insights</strong> with{" "}
                <code>DISFUSE_INSIGHTS=off</code>, shorten its retention window,
                or clear a project's logs.
              </li>
              <li>
                <strong>Manage notifications</strong> in{" "}
                <Link to="/settings/notifications">
                  Settings → Notifications
                </Link>
                .
              </li>
              <li>
                <strong>Manage billing</strong> — view invoices, change your
                payment method or cancel — in{" "}
                <Link to="/settings/premium">Settings → Premium</Link>.
              </li>
              <li>
                <strong>Delete your account</strong> and its data by opening a
                ticket.
              </li>
              <li>
                <strong>Revoke DisFuse's access</strong> to your Discord account
                at any time from Discord's <em>Authorized Apps</em> settings.
              </li>
            </ul>
            <p>
              <strong>If you are in the EEA, UK or Switzerland</strong>, you
              also have the rights to access, rectification, erasure,
              restriction, portability and objection, the right to withdraw
              consent, and the right to complain to your local supervisory
              authority.
            </p>
            <p>
              <strong>If you are in California</strong>, you have the rights to
              know, delete, correct and to limit the use of sensitive personal
              information, and the right not to be discriminated against for
              exercising them. We do not sell or share personal information as
              those terms are defined by the CCPA/CPRA.
            </p>
            <p>
              <strong>Other jurisdictions</strong> — including other US states
              with privacy laws, Canada, Brazil and Australia — may give you
              comparable rights. Ask and we will honor them where they apply.
            </p>
            <p>
              To exercise any of these, see <Ref to="contact-privacy" />. We
              will verify that the request comes from you, usually through the
              Discord account involved, and respond within the time the
              applicable law requires — normally within 30 days. We may keep
              information we are required to keep, or that is necessary to
              prevent fraud or abuse.
            </p>
          </>
        ),
      },
      {
        id: "security",
        title: "Security",
        body: (
          <>
            <p>
              We take reasonable steps to protect the Platform: traffic is
              served over HTTPS; the API authorizes every request against
              Discord rather than trusting the browser; ownership is re-checked
              on the server for every sensitive action; bot tokens are stripped
              from responses to anyone who is not the project owner and redacted
              before moderation scans; payment credentials never touch our
              servers; Control tokens are never exposed to socket handlers; and
              rate limits and size caps apply across the API, sockets, Insights
              ingestion and dashboards.
            </p>
            <p>
              <strong>No system is perfectly secure.</strong> We cannot
              guarantee that your information will never be accessed, disclosed,
              altered or destroyed. You can help by protecting your Discord
              account with a strong password and two-factor authentication,
              keeping your session token to yourself, keeping credentials in
              Secrets rather than in blocks, being careful about who you add as
              a collaborator, and rotating a bot token you think may have
              leaked.
            </p>
            <p>
              If you discover a security vulnerability in DisFuse, please report
              it privately through our{" "}
              <a href={DISCORD_INVITE}>Discord server</a> rather than disclosing
              it publicly, and give us a reasonable chance to fix it.
            </p>
            <p>
              If a breach occurs that affects your personal data, we will notify
              affected users and any regulator as required by applicable law.
            </p>
          </>
        ),
      },
      {
        id: "children",
        title: "Children's privacy",
        body: (
          <>
            <p>
              DisFuse is not intended for children under <strong>13</strong>, or
              under the higher minimum age Discord sets for some countries. We
              do not knowingly collect personal information from children below
              that age.
            </p>
            <p>
              If we learn that an account belongs to someone below the minimum
              age, we will terminate it and delete its data. If you are a parent
              or guardian and believe your child has created an account, contact
              us and we will remove it.
            </p>
          </>
        ),
      },
      {
        id: "international",
        title: "International users and transfers",
        body: (
          <>
            <p>
              DisFuse is operated from the United States, and our providers
              operate globally. If you use the Platform from outside the United
              States, your information will be transferred to and processed in
              the United States and in other countries whose data protection
              laws may differ from those where you live.
            </p>
            <p>
              Where we transfer personal data out of the EEA, UK or Switzerland,
              we rely on appropriate safeguards — such as the European
              Commission's Standard Contractual Clauses — as offered by the
              providers involved.
            </p>
          </>
        ),
      },
      {
        id: "changes-privacy",
        title: "Changes to this policy",
        body: (
          <>
            <p>
              We update this policy as DisFuse changes. When we do, we revise
              the “Last updated” date at the top of the page. If a change is
              material — for example a new category of data, a new purpose, or a
              new recipient — we will also notify you through your DisFuse
              inbox, a DM from the DisFuse bot, or an announcement in our
              Discord server, before or when the change takes effect.
            </p>
            <p>
              Continuing to use DisFuse after a change means you accept the
              updated policy.
            </p>
          </>
        ),
      },
      {
        id: "contact-privacy",
        title: "Contact us",
        body: (
          <>
            <p>
              For anything about your data — a question, an access request, a
              deletion request, or a complaint — reach us here. Use a ticket
              where possible so there is a record and we can verify who you are.
            </p>
            <ul>
              <li>
                <strong>Privacy requests &amp; account deletion:</strong> open a
                ticket in the <code>#tickets</code> channel of our{" "}
                <a href={DISCORD_INVITE}>Discord server</a>.
              </li>
              <li>
                <strong>Email:</strong>{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>, if you
                would rather not raise it on Discord, or if you are asking about
                data held about you by someone else's bot.
              </li>
              <li>
                <strong>Data about a bot you use:</strong> contact that bot's
                owner first — see <Ref to="your-bots-data" /> — and us if they
                cannot help.
              </li>
              <li>
                <strong>The rules for using DisFuse:</strong> see our{" "}
                <Link to="/tos">Terms of Service</Link>.
              </li>
            </ul>
          </>
        ),
      },
    ],
  },
];

export default function PrivacyPolicy() {
  return (
    <LegalDoc
      tag="PRIVACY"
      icon="fa-solid fa-user-shield"
      title="Privacy Policy"
      lead="What DisFuse collects, why, who else ever sees it, how long we keep it, and how to get it back or get rid of it."
      lastUpdated={LAST_UPDATED}
      effective={LAST_UPDATED}
      summary={summary}
      parts={parts}
      related={{
        to: "/tos",
        icon: "fa-solid fa-scale-balanced",
        label: "Read the Terms of Service",
      }}
    />
  );
}
