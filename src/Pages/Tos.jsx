import { Link } from "react-router-dom";

import LegalDoc, { Callout, DefTable, Ref } from "../components/legal/LegalDoc";

/* =====================================================================
   Terms of Service
   ---------------------------------------------------------------------
   Only the words live here. Everything around them — the contents rail,
   the numbering, the anchors, the progress bar — comes from
   components/legal/LegalDoc.jsx, which the Privacy Policy uses too.

   Section ids are permanent: people link to them and staff quote them
   in tickets, so rename a heading freely but never an `id`.
   ===================================================================== */

const LAST_UPDATED = "August 21, 2026";

const DISCORD_INVITE = "https://discord.gg/Xwx4zkQcmJ";
const SUPPORT_EMAIL = "support@disfuse.xyz";

const summary = [
  {
    icon: "fa-solid fa-cubes",
    title: "You own what you build",
    text: "Your projects, blocks and generated code stay yours. We only need permission to store and display them so the Platform works.",
  },
  {
    icon: "fa-solid fa-server",
    title: "We don't host your bot",
    text: "DisFuse builds and exports your bot's code. Running it 24/7 is up to you, on whatever host you choose.",
  },
  {
    icon: "fa-solid fa-crown",
    title: "Premium is optional",
    text: "Everything core to building a bot is free. Premium adds Control, Insights, Websites and Version Control for a fee.",
  },
  {
    icon: "fa-solid fa-shield-halved",
    title: "There are rules",
    text: "No NSFW, spam, malware, harassment or anything that breaks Discord's rules. Projects are reviewed automatically and by staff.",
  },
];

const parts = [
  {
    title: "Part I — The agreement",
    sections: [
      {
        id: "agreement",
        title: "Agreement to these Terms",
        body: (
          <>
            <p>
              These Terms of Service (the <strong>“Terms”</strong>) are a
              binding agreement between you and the DisFuse team (
              <strong>“DisFuse”</strong>, <strong>“we”</strong>,{" "}
              <strong>“us”</strong>, <strong>“our”</strong>). They govern your
              access to and use of everything we operate, which we call the{" "}
              <strong>“Platform”</strong>:
            </p>
            <ul>
              <li>
                the DisFuse website and block editor at{" "}
                <a href="https://disfuse.xyz">disfuse.xyz</a>, including the
                dashboard, Explore, the Block Workshop, Insights, Control and
                the website builder;
              </li>
              <li>
                the DisFuse API at <code>api.disfuse.xyz</code>, including its
                real-time collaboration, Control and analytics endpoints;
              </li>
              <li>
                published DisFuse Websites and bot dashboards served from{" "}
                <code>sites.disfuse.xyz</code>;
              </li>
              <li>
                the DisFuse Discord bot, the official DisFuse Discord server,
                and any support we provide through them;
              </li>
              <li>DisFuse Premium and anything you buy from us; and</li>
              <li>
                the code, files and analytics instrumentation DisFuse generates
                for your bot.
              </li>
            </ul>
            <p>
              By creating an account, signing in with Discord, buying Premium,
              or using any part of the Platform, you agree to these Terms and to
              our <Link to="/pp">Privacy Policy</Link>, which is incorporated
              into them by reference. If you do not agree, do not use the
              Platform.
            </p>
            <Callout tone="info" title="If you are using DisFuse for a company">
              If you accept these Terms on behalf of an organization, you
              confirm you have authority to bind it, and “you” means both you
              and that organization.
            </Callout>
          </>
        ),
      },
      {
        id: "eligibility",
        title: "Who may use DisFuse",
        body: (
          <>
            <p>
              DisFuse is built on top of Discord and you sign in with a Discord
              account, so Discord's own eligibility rules apply to you here as
              well. To use the Platform you must:
            </p>
            <ul>
              <li>
                be at least <strong>13 years old</strong>, or older if the
                minimum age for Discord in your country is higher;
              </li>
              <li>
                have permission from a parent or legal guardian if you are under
                the age of majority where you live;
              </li>
              <li>
                hold a Discord account in good standing that complies with{" "}
                <a
                  href="https://discord.com/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Discord's Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="https://discord.com/guidelines"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Community Guidelines
                </a>
                ; and
              </li>
              <li>
                not be currently banned or suspended from DisFuse, and not be
                creating an account to get around a ban.
              </li>
            </ul>
            <p>
              We may refuse, suspend or remove any account at our discretion
              where we reasonably believe these conditions are not met.
            </p>
          </>
        ),
      },
      {
        id: "accounts",
        title: "Your DisFuse account",
        body: (
          <>
            <p>
              DisFuse has no password of its own. You sign in through Discord's
              OAuth flow, and your Discord access token is what identifies you
              to our API for the rest of your session. That has some practical
              consequences:
            </p>
            <ul>
              <li>
                <strong>Your Discord account is your DisFuse account.</strong>{" "}
                Anyone who can sign in as you on Discord can act as you on
                DisFuse. Keep your Discord credentials and two-factor
                authentication secure.
              </li>
              <li>
                <strong>Never share your DisFuse session token.</strong> It is
                stored in your browser and grants full access to your projects,
                bot tokens and secrets.
              </li>
              <li>
                <strong>
                  You are responsible for everything done under your account
                </strong>
                , including by collaborators you invite and by anyone you let
                use your device.
              </li>
              <li>
                <strong>One person, one account.</strong> Do not impersonate
                anyone, create an account for someone else without their
                permission, or operate multiple accounts to evade limits or
                enforcement.
              </li>
            </ul>
            <p>
              Tell us immediately, through our{" "}
              <a href={DISCORD_INVITE}>Discord server</a>, if you believe your
              account has been compromised.
            </p>
          </>
        ),
      },
      {
        id: "changes",
        title: "Changes to DisFuse and to these Terms",
        body: (
          <>
            <p>
              DisFuse is actively developed. We may add, change, limit or remove
              features, blocks, limits and plans at any time, and we may do so
              without notice where the change is minor or where it is needed for
              security, legal or operational reasons.
            </p>
            <p>
              We may also update these Terms. When we make a material change we
              will update the “Last updated” date at the top of this page and
              notify you through your DisFuse inbox, a DM from the DisFuse bot,
              or an announcement in our Discord server. Changes take effect when
              posted unless we say otherwise.
            </p>
            <p>
              Continuing to use the Platform after a change takes effect means
              you accept the updated Terms. If you do not accept them, stop
              using the Platform and, if you subscribe to Premium, cancel your
              subscription (see <Ref to="premium-cancellation" />
              ).
            </p>
          </>
        ),
      },
    ],
  },
  {
    title: "Part II — Building on DisFuse",
    sections: [
      {
        id: "what-disfuse-is",
        title: "What DisFuse provides",
        body: (
          <>
            <p>
              DisFuse is a block-based visual editor for building Discord bots
              without writing code. You snap blocks together in a workspace,
              DisFuse turns them into JavaScript, and you take that code and run
              it. The Platform currently includes:
            </p>
            <DefTable
              headings={["Feature", "What it does"]}
              rows={[
                [
                  <strong>Projects &amp; workspaces</strong>,
                  "Block workspaces, tabs, autosave, project descriptions, likes, clones and comments.",
                ],
                [
                  <strong>Code generation &amp; export</strong>,
                  "Live JavaScript output, plus a downloadable bundle containing index.js, package.json, a .df backup of your blocks and hosting instructions.",
                ],
                [
                  <strong>Secrets</strong>,
                  "Named values stored with your project and written into a .env file on export, so tokens and API keys need not be typed into blocks.",
                ],
                [
                  <strong>Block Workshop</strong>,
                  "Create custom blocks, publish them as versioned block packs, and install packs other builders have shared.",
                ],
                [
                  <strong>Collaboration</strong>,
                  "Invite collaborators into a project and edit the same workspace in real time.",
                ],
                [
                  <strong>Community</strong>,
                  "Explore public projects, favorite them, clone them and leave comments and replies.",
                ],
                [
                  <strong>BlockBuddy</strong>,
                  "AI assistance for suggestions, generating blocks and converting JavaScript into blocks.",
                ],
                [
                  <>
                    <strong>Bot Insights</strong> <em>(Premium to view)</em>
                  </>,
                  "Usage analytics reported by your running bot: commands, components, servers, errors and trends.",
                ],
                [
                  <>
                    <strong>Control</strong> <em>(Premium)</em>
                  </>,
                  "A Discord-style client that connects as your own bot so you can read, send, react and moderate as it.",
                ],
                [
                  <>
                    <strong>Websites &amp; dashboards</strong>{" "}
                    <em>(Premium)</em>
                  </>,
                  "A visual builder for a public site per bot, optionally with settings your bot's server admins can configure.",
                ],
                [
                  <>
                    <strong>Version Control</strong> <em>(Premium)</em>
                  </>,
                  "Save a whole project as a named version and switch between versions.",
                ],
              ]}
            />
            <Callout
              tone="warning"
              title="DisFuse does not host or run your bot"
            >
              DisFuse builds your bot and gives you its code. Keeping the bot
              online is your responsibility: you export the project and run it
              on your own computer or a hosting provider of your choice. We are
              not responsible for that host, its uptime, its pricing or its
              handling of your data. Any references to DisFuse hosting in older
              versions of these Terms no longer apply.
            </Callout>
          </>
        ),
      },
      {
        id: "your-content",
        title: "Your projects and content",
        body: (
          <>
            <p>
              <strong>You own your content.</strong> Projects, workspaces,
              blocks, custom blocks, block packs, website designs, descriptions,
              comments and everything else you create or upload (your{" "}
              <strong>“Content”</strong>) remain yours. These Terms do not
              transfer ownership of your Content to us.
            </p>
            <p>
              <strong>The license you give us.</strong> To operate the Platform
              we need permission to handle your Content. You grant DisFuse a
              worldwide, non-exclusive, royalty-free license to host, store,
              copy, back up, transmit, process, adapt (for example, to generate
              code or convert formats) and display your Content, solely for the
              purposes of running, securing, moderating, supporting and
              improving the Platform. This license ends when you delete the
              Content, except for copies that are already in backups, in other
              users' clones, or that we must keep for legal reasons.
            </p>
            <p>
              <strong>Generated code is yours.</strong> The JavaScript DisFuse
              generates from your blocks, and the export bundle it produces, are
              yours to use, modify, publish and run for any lawful purpose,
              including commercially. We claim no ownership over the bots you
              build.
            </p>
            <p>
              <strong>Public projects.</strong> Making a project public lets any
              signed-in DisFuse user view, clone, modify and reuse its blocks
              within the Platform, and lets it appear in Explore or be featured
              by us. Publishing is not reversible in practice: once someone has
              cloned your project, making it private again does not take back
              their copy.
            </p>
            <p>
              <strong>Back up your own work.</strong> You can download a{" "}
              <code>.df</code> file of a project or workspace at any time, and
              you should. We take reasonable care of your data, but we do not
              guarantee that it will always be available or recoverable.
            </p>
            <p>
              <strong>You warrant that</strong> you have all rights necessary to
              your Content, that it does not infringe anyone else's rights, and
              that it complies with <Ref to="acceptable-use" />.
            </p>
          </>
        ),
      },
      {
        id: "collaboration",
        title: "Collaboration and community features",
        body: (
          <>
            <p>
              DisFuse lets several people work on one project at the same time,
              and lets everyone comment on public work. That comes with some
              limits you should understand before you use it.
            </p>
            <ul>
              <li>
                <strong>Collaborators are trusted.</strong> Anyone you add to a
                project can view and edit its blocks and workspaces, and their
                edits are saved automatically. Only add people you trust, and
                remove them when they no longer need access.
              </li>
              <li>
                <strong>Concurrent edits can overwrite each other.</strong>{" "}
                Real-time editing means a collaborator's change can replace
                yours. Keep your own backups.
              </li>
              <li>
                <strong>You remain responsible</strong> for what collaborators
                do inside your project, and for any Content they add to it.
              </li>
              <li>
                <strong>Some things stay with the owner.</strong> Insights,
                Control, Version Control management and a project's Premium
                features belong to the project owner, not to collaborators.
              </li>
              <li>
                <strong>Comments, replies, likes and favorites</strong> are
                community features. Be civil. Comment content is subject to{" "}
                <Ref to="acceptable-use" />, and we may edit or remove comments
                that break these Terms.
              </li>
              <li>
                <strong>Blocking.</strong> You can block other users. Blocking
                affects what you see on DisFuse; it does not affect Discord.
              </li>
            </ul>
          </>
        ),
      },
      {
        id: "workshop",
        title: "The Block Workshop",
        body: (
          <>
            <p>
              The Block Workshop lets you define your own Blockly blocks,
              including the JavaScript each block generates, and bundle them
              into a <strong>block pack</strong> that can be released in
              versions, given a changelog, and installed by other people.
            </p>
            <p>
              <strong>When you publish a pack publicly</strong>, you grant every
              DisFuse user a non-exclusive, royalty-free license to install it,
              use its blocks in their own projects, and run and distribute the
              code those blocks generate, including in commercial bots. You also
              allow us to host, display, feature, categorize and distribute the
              pack on the Platform.
            </p>
            <p>
              <strong>When you install someone else's pack</strong>, you are
              running code written by another user. Packs may declare npm
              dependencies that are installed into your exported project. We do
              not audit, endorse or guarantee third-party packs or their
              dependencies. Review a pack's blocks and generated code before you
              ship a bot that depends on it.
            </p>
            <p>
              <strong>Pack rules.</strong> Packs may not contain or generate
              malicious code, obfuscated payloads, credential harvesting, code
              that contacts unexpected remote services, or anything otherwise
              prohibited by <Ref to="acceptable-use" />.
            </p>
            <p>
              <strong>We may flag, restrict or remove any pack</strong> at our
              discretion — for example, marking it with an informational,
              warning or critical flag, hiding it from listings, or deleting it.
              Removing a pack does not automatically remove it from projects
              that already installed it, and versions already published may
              remain in other users' exports.
            </p>
          </>
        ),
      },
      {
        id: "blockbuddy",
        title: "BlockBuddy and AI features",
        body: (
          <>
            <p>
              BlockBuddy is an AI assistant that can suggest improvements to a
              project, generate custom blocks from a description, and convert
              JavaScript into blocks. It is powered by third-party AI models.
            </p>
            <ul>
              <li>
                <strong>Output is not guaranteed.</strong> AI suggestions,
                generated blocks and generated code may be inaccurate, insecure,
                inefficient or simply wrong. Review everything before you use
                it.
              </li>
              <li>
                <strong>You are responsible for what you keep.</strong> Anything
                you accept into your project becomes your Content, and{" "}
                <Ref to="your-content" /> and <Ref to="acceptable-use" /> apply
                to it as normal.
              </li>
              <li>
                <strong>What we send.</strong> To answer a request we send your
                prompt and, depending on the feature, the relevant workspace
                data or code to our AI provider. See the{" "}
                <Link to="/pp#ai">Privacy Policy</Link> for details.
              </li>
              <li>
                <strong>Do not misuse it.</strong> BlockBuddy may not be used to
                generate content that breaks <Ref to="acceptable-use" />, to
                attempt to extract other users' data, or to script automated
                bulk requests.
              </li>
              <li>
                <strong>Availability.</strong> AI features depend on third-party
                services and may be rate limited, changed, degraded or withdrawn
                at any time. They are not part of what Premium guarantees.
              </li>
            </ul>
          </>
        ),
      },
      {
        id: "bot-responsibility",
        title: "Your bot is your responsibility",
        body: (
          <>
            <p>
              DisFuse is a tool. The bot you build with it is yours: you decide
              what it does, where it runs, which servers it joins and how it
              treats the people who use it. You are solely responsible for it.
            </p>
            <p>In particular, you are responsible for:</p>
            <ul>
              <li>
                complying with the{" "}
                <a
                  href="https://discord.com/developers/docs/policies-and-agreements/developer-terms-of-service"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Discord Developer Terms of Service
                </a>
                ,{" "}
                <a
                  href="https://discord.com/developers/docs/policies-and-agreements/developer-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Developer Policy
                </a>{" "}
                and Discord's API rate limits;
              </li>
              <li>
                anything your bot does in a server, including moderation
                actions, messages it sends, and data it collects or stores;
              </li>
              <li>
                giving your bot's users any notices, privacy policy or consent
                that the law where they live requires — DisFuse's{" "}
                <Link to="/pp">Privacy Policy</Link> covers DisFuse, not your
                bot;
              </li>
              <li>
                the security of the bot token and any API keys you use, and for
                rotating them if they leak; and
              </li>
              <li>
                the host you run the bot on, its costs, its uptime and its
                terms.
              </li>
            </ul>
            <Callout
              tone="danger"
              title="Never put a token or key directly into a block"
            >
              Blocks are part of your project, and a public project's blocks can
              be read and cloned by anyone. Put credentials in{" "}
              <strong>Secrets</strong>, which are kept out of the shared
              workspace and written into your export's environment file instead.
              DisFuse is not responsible for a bot compromised through a
              credential you exposed.
            </Callout>
          </>
        ),
      },
      {
        id: "acceptable-use",
        title: "Acceptable use",
        body: (
          <>
            <p>
              DisFuse users have wide latitude in what they build. Spam, sexual
              content, illegal activity and abuse are where that stops. You may
              not use the Platform — or build, host, publish or distribute
              anything through it — to do any of the following.
            </p>
            <p>
              <strong>Prohibited content.</strong> Content that is:
            </p>
            <ul>
              <li>
                sexually explicit, or sexualizes minors in any way whatsoever;
              </li>
              <li>
                illegal where you or your users are, or that facilitates illegal
                activity;
              </li>
              <li>
                hateful, harassing, threatening, or that targets a person or
                group with abuse;
              </li>
              <li>
                infringing on someone's copyright, trademark, privacy or other
                rights; or
              </li>
              <li>
                deceptive — impersonation, phishing, scams, fake giveaways or
                fraudulent “nitro” offers.
              </li>
            </ul>
            <p>
              <strong>Prohibited bots and behavior.</strong> You may not build
              or run bots that:
            </p>
            <ul>
              <li>
                break Discord's Terms of Service, Community Guidelines or
                Developer Policy;
              </li>
              <li>
                self-bot, automate user accounts, raid, mass-DM, mass-mention,
                spam, or coordinate harassment;
              </li>
              <li>
                scrape Discord at scale, harvest member data, or build profiles
                of users without a lawful basis;
              </li>
              <li>
                deliver malware, ransomware, cryptominers, remote-access
                payloads or credential stealers; or
              </li>
              <li>
                deliberately abuse Discord's API or another service's API to the
                point of disruption.
              </li>
            </ul>
            <p>
              <strong>Prohibited use of the Platform itself.</strong> You may
              not:
            </p>
            <ul>
              <li>
                access the Platform with automated systems in a way that exceeds
                what a person could reasonably do by hand, or circumvent rate
                limits;
              </li>
              <li>
                probe, scan, overload, disrupt or attempt to gain unauthorized
                access to our website, API, sockets, database or infrastructure;
              </li>
              <li>
                reverse engineer, decompile or tamper with the Platform except
                to the extent the law or our license expressly permits;
              </li>
              <li>
                attempt to read, modify or delete another user's projects,
                secrets, tokens, subscription or data;
              </li>
              <li>
                bypass Premium checks, payment flows or account restrictions, or
                resell Premium access; or
              </li>
              <li>
                use the Platform to build a competing service by bulk-extracting
                its blocks, packs or content.
              </li>
            </ul>
            <p>
              <strong>Resource use.</strong> Real-time collaboration, Control
              sessions, Insights ingestion, the dashboard data API and the
              website builder all have rate limits and size limits. Do not try
              to defeat them. Excessive or abusive load may be throttled,
              suspended or terminated.
            </p>
            <Callout tone="info" title="Freedom of expression, within limits">
              We do not moderate opinions, and we do not want to referee
              disagreements between builders. What we act on is content and
              conduct that falls into the categories above.
            </Callout>
          </>
        ),
      },
      {
        id: "moderation",
        title: "Moderation, review and enforcement",
        body: (
          <>
            <p>
              To keep the Platform usable and to meet our obligations to
              Discord, we review activity on DisFuse. You should assume that
              nothing you store on the Platform is private from us.
            </p>
            <p>
              <strong>Automated review.</strong> Project workspaces are scanned
              automatically by an AI moderation system when they change. It
              flags suspected violations for staff and, for serious cases such
              as clearly illegal activity, can suspend a project immediately.
              Bot tokens are redacted before a workspace is sent for review.
              Automated review can be wrong in both directions; it does not
              replace your own responsibility for your Content.
            </p>
            <p>
              <strong>Staff review.</strong> DisFuse staff can view any project,
              block pack or website — public or private — in order to
              investigate reports, flags and abuse. Project creation, edits and
              deletions are logged.
            </p>
            <p>
              <strong>What we may do.</strong> Depending on severity and
              history, we may:
            </p>
            <ul>
              <li>remove, edit, hide or unpublish Content;</li>
              <li>
                suspend a project, which makes it unavailable until the issue is
                resolved;
              </li>
              <li>flag, restrict or delete a block pack;</li>
              <li>unpublish a website or release a custom site path;</li>
              <li>
                temporarily ban an account, which blocks access to the Platform
                until the ban expires;
              </li>
              <li>terminate an account permanently; and</li>
              <li>
                report unlawful activity to Discord or to the authorities.
              </li>
            </ul>
            <p>
              <strong>Appeals.</strong> If you think we got it wrong, open a
              ticket in the <code>#tickets</code> channel of our{" "}
              <a href={DISCORD_INVITE}>Discord server</a>. Tell us your username
              and what was actioned. We review appeals in good faith but are not
              obliged to reverse a decision.
            </p>
            <p>
              <strong>Enforcement is discretionary.</strong> We are not required
              to act on every report, to act consistently across cases, or to
              give notice before acting where the risk is serious. Not enforcing
              a term is not a waiver of it.
            </p>
          </>
        ),
      },
    ],
  },
  {
    title: "Part III — DisFuse Premium",
    sections: [
      {
        id: "premium",
        title: "What Premium is",
        body: (
          <>
            <p>
              <strong>DisFuse Premium</strong> is a paid upgrade to your DisFuse
              account. Everything needed to build, export and share a bot is
              free; Premium unlocks a set of additional features and applies to{" "}
              <strong>your account</strong> — not to a single project, bot or
              server.
            </p>
            <p>Premium currently unlocks:</p>
            <ul>
              <li>
                <strong>Control</strong> — a Discord-style client that connects
                as any bot you own, so you can read servers, send and edit
                messages, react, manage members, roles and channels, and
                moderate, live;
              </li>
              <li>
                <strong>Bot Insights</strong> — the analytics dashboard and log
                viewer for bots you own, with a retention window you choose, up
                to 90 days;
              </li>
              <li>
                <strong>Websites &amp; dashboards</strong> — the visual website
                builder, unlimited published sites (one per bot you own),
                optional custom site paths, and dashboards your bot's server
                admins can configure;
              </li>
              <li>
                <strong>Version Control</strong> — creating and renaming saved
                versions of a project;
              </li>
              <li>
                <strong>Early access</strong> to new builder elements and
                Premium features, <strong>priority support</strong>, and a
                Premium role in the DisFuse Discord server.
              </li>
            </ul>
            <p>
              <strong>Premium is one product.</strong> The plans below are only
              different ways of paying for it; they are not tiers, and every
              plan unlocks exactly the same features.
            </p>
            <Callout tone="info" title="Features can change">
              We may add, change or remove Premium features. If we remove a
              material Premium feature we will give notice through your inbox or
              a DM from the DisFuse bot. Your remedy for a change you do not
              accept is to cancel; see <Ref to="premium-cancellation" />.
            </Callout>
          </>
        ),
      },
      {
        id: "premium-plans",
        title: "Plans, prices and taxes",
        body: (
          <>
            <p>
              Premium is sold on the plans below. All prices are in{" "}
              <strong>United States dollars (USD)</strong> and are the prices
              shown at checkout at the time you buy.
            </p>
            <DefTable
              headings={["Plan", "Price", "Billing"]}
              rows={[
                [
                  <strong>Premium (Monthly)</strong>,
                  "$4.99",
                  "Recurring, charged every month until canceled.",
                ],
                [
                  <strong>Premium Yearly</strong>,
                  "$44.99",
                  "Recurring, charged once every year until canceled.",
                ],
                [
                  <strong>Lifetime</strong>,
                  "$99",
                  <>
                    One-time payment, no renewal. See{" "}
                    <Ref to="premium-lifetime" />.
                  </>,
                ],
              ]}
            />
            <ul>
              <li>
                <strong>The price you see is the price we charge.</strong> The
                plan you pick determines the price on our side; nothing your
                browser sends can change it.
              </li>
              <li>
                <strong>Taxes.</strong> Prices exclude any VAT, GST, sales tax
                or similar charge unless stated at checkout. Where such a tax
                applies it may be added to your total and shown before you
                confirm.
              </li>
              <li>
                <strong>Promotion codes.</strong> We sometimes issue discount
                codes. They may be limited in time, quantity, plan or per
                account, and may apply only to the first billing period. We may
                withdraw or invalidate a code that is misused.
              </li>
              <li>
                <strong>Price changes.</strong> We may change prices. A change
                never affects a payment already taken. For recurring plans, we
                will give you at least <strong>30 days' notice</strong> before a
                new price applies to your renewals, and you may cancel before
                then if you do not accept it.
              </li>
              <li>
                <strong>Fees you owe others.</strong> Your bank or card issuer
                may charge foreign transaction or currency conversion fees.
                Those are between you and them.
              </li>
            </ul>
          </>
        ),
      },
      {
        id: "premium-payments",
        title: "Payments and Stripe",
        body: (
          <>
            <p>
              All payments are processed by{" "}
              <a
                href="https://stripe.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Stripe
              </a>
              , our payment processor. Checkout and billing management both run
              on Stripe-hosted pages.
            </p>
            <ul>
              <li>
                <strong>We never see your card.</strong> Card numbers, bank
                details and similar payment credentials go to Stripe and are
                never sent to, stored by or accessible to DisFuse. What we store
                is your Stripe customer and subscription identifiers, the plan
                you are on, its status and its billing dates.
              </li>
              <li>
                <strong>You authorize the charge.</strong> By buying a plan you
                authorize us, through Stripe, to charge your chosen payment
                method for that plan's price plus any applicable taxes, and —
                for recurring plans — to do so automatically each period until
                you cancel.
              </li>
              <li>
                <strong>Stripe's own terms apply</strong> to your use of its
                checkout and billing portal, alongside these Terms.
              </li>
              <li>
                <strong>Accurate details.</strong> You must use a payment method
                you are authorized to use and keep your billing details current.
              </li>
              <li>
                <strong>Receipts and invoices</strong> are issued by Stripe.
                Recurring plans generate an invoice each period; the Lifetime
                plan generates a one-time invoice.
              </li>
            </ul>
            <Callout tone="info" title="Where your subscription state lives">
              Stripe is the authority on whether you have paid. DisFuse mirrors
              that state onto your account through Stripe's webhooks, so a
              change made in Stripe — including a refund or a manual adjustment
              — reaches DisFuse on its own.
            </Callout>
          </>
        ),
      },
      {
        id: "premium-cancellation",
        title: "Renewal and cancellation",
        body: (
          <>
            <p>
              <strong>Recurring plans renew automatically.</strong> The Monthly
              and Yearly plans continue, and are charged again at the start of
              each new period, until you cancel them. The Lifetime plan does not
              renew and cannot be canceled, because there is nothing recurring
              to cancel.
            </p>
            <p>
              <strong>How to cancel.</strong> Go to{" "}
              <Link to="/settings/premium">Settings → Premium</Link> and cancel
              there, or open the Stripe billing portal from the same page. You
              can also change your payment method, view invoices and resume a
              cancellation you have scheduled.
            </p>
            <p>
              <strong>What canceling does.</strong> Canceling schedules your
              subscription to stop at the end of the period you have already
              paid for. You keep Premium until that date; you are not charged
              again; nothing is deleted at the moment you cancel. You can undo a
              scheduled cancellation any time before it takes effect.
            </p>
            <p>
              <strong>We may cancel too.</strong> We may cancel or suspend a
              subscription if payment fails, if your account is banned or
              terminated for breaking these Terms, if we reasonably suspect
              fraud or chargeback abuse, or if we discontinue Premium. Where we
              cancel for reasons other than your breach, we will refund the
              unused portion of the period you have paid for.
            </p>
          </>
        ),
      },
      {
        id: "premium-lapse",
        title: "Failed payments and what happens when Premium ends",
        body: (
          <>
            <p>
              <strong>Failed payments.</strong> If a charge fails, Stripe
              retries it over several days and we notify you by DM. Your
              subscription may enter a past-due or unpaid state during that
              time. Premium access ends when Stripe reports that it has stopped,
              or when the period you paid for runs out — whichever applies.
            </p>
            <p>
              <strong>
                Nothing you made is deleted because Premium ended.
              </strong>{" "}
              Premium controls access to features, not ownership of data. When
              Premium ends:
            </p>
            <DefTable
              headings={["Feature", "What happens"]}
              rows={[
                [
                  <strong>Websites</strong>,
                  "Your websites are kept, but published sites stop being served and the builder is unavailable until Premium is active again. The dashboard data API stops answering your bot.",
                ],
                [
                  <strong>Version Control</strong>,
                  "Every version you saved stays exactly where it is. You can still open, edit, switch between and delete versions; only creating and renaming them needs Premium.",
                ],
                [
                  <strong>Bot Insights</strong>,
                  "Your bot keeps reporting events and they keep being stored under your retention setting, but the Insights and Logs pages are unavailable until Premium is active again.",
                ],
                [
                  <strong>Control</strong>,
                  "Live sessions end, including sessions already open, and new ones cannot be started.",
                ],
                [
                  <strong>Discord role</strong>,
                  "The Premium role in the DisFuse server is removed automatically.",
                ],
                [
                  <strong>Projects, blocks, packs</strong>,
                  "Unaffected. Building, exporting, collaborating and publishing all keep working as they do for any free account.",
                ],
              ]}
            />
            <p>
              Resubscribing restores access to these features. We do not
              guarantee that data whose retention window expired while you were
              unsubscribed can be recovered.
            </p>
          </>
        ),
      },
      {
        id: "premium-refunds",
        title: "Refunds",
        body: (
          <>
            <p>
              Premium is a digital service you get access to immediately, so
              payments are generally non-refundable except as set out here or as
              required by law.
            </p>
            <ul>
              <li>
                <strong>14-day goodwill window.</strong> If you are unhappy with
                Premium, contact us within <strong>14 days</strong> of your
                first purchase and we will normally refund it in full. This
                applies to your first purchase on an account, not to every
                renewal.
              </li>
              <li>
                <strong>Renewals.</strong> A renewal charge you did not intend
                to pay may be refunded if you contact us within{" "}
                <strong>7 days</strong> of the charge and have not made
                substantial use of Premium features since it. Otherwise, cancel
                to prevent the next one.
              </li>
              <li>
                <strong>Our failures.</strong> If a Premium feature is
                unavailable for a prolonged period because of a fault on our
                side, tell us and we will consider a credit or a pro-rated
                refund.
              </li>
              <li>
                <strong>No refund</strong> where an account is terminated for
                breaking these Terms, where a promotional or free period was
                used, or where we reasonably determine a refund request is
                abusive.
              </li>
              <li>
                <strong>Statutory rights.</strong> If the law where you live
                gives you a right to cancel or a right to a refund — for
                example, the EU/UK right of withdrawal for distance contracts —
                that right applies regardless of anything in this section.
              </li>
            </ul>
            <p>
              To request a refund, open a ticket in the <code>#tickets</code>{" "}
              channel of our <a href={DISCORD_INVITE}>Discord server</a>.
              Refunds are issued to the original payment method through Stripe
              and end Premium access when processed.
            </p>
          </>
        ),
      },
      {
        id: "premium-lifetime",
        title: "The Lifetime plan",
        body: (
          <>
            <p>
              The Lifetime plan is a single payment that grants Premium without
              a recurring charge. Some specifics matter:
            </p>
            <ul>
              <li>
                <strong>“Lifetime” means the lifetime of the service</strong>,
                not your own lifetime. It lasts as long as DisFuse continues to
                offer Premium. It is not a promise that DisFuse will operate
                forever.
              </li>
              <li>
                <strong>It covers Premium as it evolves.</strong> Lifetime
                holders get Premium features as they exist from time to time,
                including new ones added to Premium. It does not entitle you to
                a separate product we may launch and price separately.
              </li>
              <li>
                <strong>It is tied to your account</strong> and is not
                transferable, assignable or resellable.
              </li>
              <li>
                <strong>It outranks a subscription.</strong> If you buy Lifetime
                while a recurring subscription is running, Lifetime takes
                precedence; cancel the subscription so it stops billing.
              </li>
              <li>
                <strong>It can still be revoked</strong> if your account is
                terminated for breaking these Terms, or reversed if the payment
                is refunded or charged back.
              </li>
              <li>
                <strong>If we discontinue Premium entirely</strong>, we will
                give reasonable notice and, if a Lifetime purchase was recent,
                consider a pro-rated refund in good faith.
              </li>
            </ul>
          </>
        ),
      },
      {
        id: "premium-abuse",
        title: "Chargebacks and billing abuse",
        body: (
          <>
            <p>
              If you believe a charge is wrong, contact us first — most problems
              are resolved in a few minutes. Opening a chargeback or payment
              dispute without contacting us may result in immediate suspension
              of Premium and, at our discretion, of your account, until the
              dispute is resolved.
            </p>
            <p>
              We may refuse service, cancel plans and terminate accounts that
              engage in payment fraud, stolen-card use, repeated chargebacks,
              refund abuse, or attempts to obtain Premium without paying for it.
            </p>
          </>
        ),
      },
    ],
  },
  {
    title: "Part IV — Feature-specific terms",
    sections: [
      {
        id: "insights-terms",
        title: "Bot Insights",
        body: (
          <>
            <p>
              DisFuse adds analytics instrumentation to the code it generates.
              When your bot runs, it batches and reports events to our API —
              commands and components used, who used them and in which server,
              how long they took, errors, servers joined and left, and periodic
              snapshots of the bot's server and member counts.
            </p>
            <ul>
              <li>
                <strong>Collection happens for every project</strong>, free or
                Premium, so the history already exists if you subscribe later.
                Premium is what lets you <em>view</em> it.
              </li>
              <li>
                <strong>It is your bot doing the reporting.</strong> The code is
                in your export, it authenticates with your bot's own token, and
                you can switch it off by setting{" "}
                <code>DISFUSE_INSIGHTS=off</code> in your bot's environment, or
                by removing the code.
              </li>
              <li>
                <strong>Insights belong to the project owner.</strong>{" "}
                Collaborators do not get access.
              </li>
              <li>
                <strong>Retention and limits.</strong> You choose a retention
                window up to <strong>90 days</strong>; older events are deleted.
                A project also keeps at most 20,000 raw events, and submissions
                are rate limited.
              </li>
              <li>
                <strong>
                  You are responsible for the data your bot sends.
                </strong>{" "}
                Insight events include Discord user and server identifiers and
                names. If the law where your users live requires you to tell
                them about this or obtain consent, that duty is yours, not ours.
                Do not send special-category or unnecessary personal data
                through Insights.
              </li>
            </ul>
            <p>
              See the <Link to="/pp#insights">Privacy Policy</Link> for exactly
              what is stored.
            </p>
          </>
        ),
      },
      {
        id: "control-terms",
        title: "Control",
        body: (
          <>
            <p>
              Control opens a live connection to Discord using your bot's token
              and gives you a client for it. Anything Control does, Discord sees
              as your bot doing it.
            </p>
            <ul>
              <li>
                <strong>Owner only.</strong> You may only control a bot attached
                to a project you own. Collaborators cannot start a Control
                session, and every action is checked against that bot's own
                Discord environment.
              </li>
              <li>
                <strong>You are accountable for every action.</strong> Messages
                sent, edits, deletions, reactions, kicks, bans, timeouts, role
                changes and server settings changed through Control are your
                actions. Discord's audit log will attribute them to your bot.
              </li>
              <li>
                <strong>Do not use it to abuse people.</strong> Control may not
                be used for harassment, mass-DMing, raid coordination,
                impersonation, evading a Discord ban, or anything else
                prohibited by <Ref to="acceptable-use" /> or by Discord.
              </li>
              <li>
                <strong>Respect the server.</strong> Having the technical
                ability to act in a server does not mean you have permission
                from that server's staff.
              </li>
              <li>
                <strong>Limits.</strong> Sessions are rate limited, capped per
                account, and closed automatically when idle or when Premium
                lapses. Attachment counts and sizes follow Discord's own limits.
              </li>
              <li>
                <strong>Nothing is stored.</strong> Control's view of your bot's
                servers, channels, members and messages lives in memory for the
                duration of the session and is discarded when it ends.
              </li>
            </ul>
          </>
        ),
      },
      {
        id: "websites-terms",
        title: "Websites and bot dashboards",
        body: (
          <>
            <p>
              Premium lets you build a public website for each bot you own,
              published at <code>sites.disfuse.xyz</code> under your chosen path
              or your bot's ID. A website can be informational, a landing page,
              documentation, a settings dashboard, or any mix.
            </p>
            <ul>
              <li>
                <strong>Published sites are public.</strong> Everything you put
                on one — text, images, links, theme, SEO fields — is visible to
                anyone with the address and may be indexed by search engines.
              </li>
              <li>
                <strong>Site content follows the same rules</strong> as
                everything else on DisFuse; see <Ref to="acceptable-use" />. We
                may unpublish or delete a site that breaks them.
              </li>
              <li>
                <strong>Custom paths.</strong> Paths are first come, first
                served, must meet our formatting rules, and may not impersonate
                DisFuse, another service or another user. We may reclaim or
                rename a path that is squatted, misleading, offensive or needed
                for the Platform.
              </li>
              <li>
                <strong>Dashboards store other people's settings.</strong> A
                dashboard can save settings scoped to a Discord server or to an
                individual visitor. Who may edit a server's settings is decided
                by the access rule you configure (server owner, or a Discord
                permission), and is enforced by our API against Discord.
              </li>
              <li>
                <strong>Limits.</strong> Dashboard data is capped per scope and
                per value, and both your bot's writes and visitors' requests are
                rate limited.
              </li>
              <li>
                <strong>You are the controller of dashboard data.</strong> Data
                your bot or your visitors store through your dashboard is yours
                to be responsible for; we host it on your behalf. Do not use it
                to collect passwords, payment details or sensitive personal
                data.
              </li>
              <li>
                <strong>Availability follows your subscription.</strong> If
                Premium lapses, sites stop being served and the dashboard API
                stops answering; the site itself is kept.
              </li>
            </ul>
          </>
        ),
      },
      {
        id: "versions-terms",
        title: "Version Control",
        body: (
          <>
            <p>
              A version is a complete snapshot of a project — every workspace it
              had at the moment you saved it. Versions are independent: editing
              one never touches another.
            </p>
            <ul>
              <li>
                Creating and renaming versions requires Premium and project
                ownership. Reading, switching, editing and deleting them do not.
              </li>
              <li>
                A project may keep up to <strong>25</strong> versions, and
                version names are limited in length. These limits exist because
                every version lives inside the project document and that
                document has a hard size ceiling.
              </li>
              <li>
                Deleting a version is permanent. Download a <code>.df</code>{" "}
                file first if you might want it back.
              </li>
              <li>
                Once a project has its first version, it loads and saves through
                versions. This is not reversible from the interface.
              </li>
            </ul>
          </>
        ),
      },
      {
        id: "third-parties",
        title: "Third-party services",
        body: (
          <>
            <p>
              DisFuse depends on services we do not control, and your bot will
              too. We are not responsible for them, for their availability, or
              for what they do with data you send them.
            </p>
            <DefTable
              headings={["Service", "Used for"]}
              rows={[
                [
                  <strong>Discord</strong>,
                  "Sign-in, identity, your bot's API, Control, dashboard permission checks, support and notifications.",
                ],
                [
                  <strong>Stripe</strong>,
                  "Payments, checkout, invoices, the billing portal and subscription state.",
                ],
                [
                  <strong>AI providers</strong>,
                  "BlockBuddy's suggestions and generation, and automated content moderation.",
                ],
                [
                  <strong>Infrastructure providers</strong>,
                  "Hosting, databases and content delivery for the website, API and published sites.",
                ],
                [
                  <strong>npm packages</strong>,
                  "Dependencies listed in your exported project's package.json, including any added by block packs you install.",
                ],
                [
                  <strong>Your bot's host</strong>,
                  "Wherever you choose to run the code DisFuse generates.",
                ],
              ]}
            />
            <Callout
              tone="warning"
              title="DisFuse is not affiliated with Discord"
            >
              DisFuse is an independent project. It is not endorsed by,
              sponsored by, or affiliated with Discord Inc. “Discord” is a
              trademark of Discord Inc.
            </Callout>
          </>
        ),
      },
    ],
  },
  {
    title: "Part V — Legal terms",
    sections: [
      {
        id: "ip",
        title: "Our intellectual property",
        body: (
          <>
            <p>
              The Platform itself — the DisFuse name, logo, branding, interface,
              built-in block set, generators, documentation and site design —
              belongs to DisFuse and its licensors and is protected by
              intellectual property law. These Terms give you no right to it
              beyond using the Platform as intended.
            </p>
            <p>
              The DisFuse source code is published under the{" "}
              <a
                href="https://github.com/Millionxsam/DisFuse/blob/main/LICENSE.md"
                target="_blank"
                rel="noopener noreferrer"
              >
                Creative Commons Attribution-NonCommercial-ShareAlike 4.0
                International license
              </a>
              . Whatever you do with that source code is governed by that
              license — notably its attribution, non-commercial and share-alike
              conditions — and nothing in these Terms grants you rights beyond
              it. The license covers the source code; it does not grant you the
              DisFuse name or logo, and it does not entitle you to use our
              hosted Platform in ways these Terms prohibit.
            </p>
            <p>
              You may not use our branding in a way that suggests DisFuse
              endorses, sponsors or operates something it does not — including
              in a bot's name, a website you publish through us, or a service
              you run.
            </p>
          </>
        ),
      },
      {
        id: "feedback",
        title: "Feedback",
        body: (
          <>
            <p>
              We welcome suggestions, bug reports and feature ideas. If you send
              us feedback, you grant us an unrestricted, irrevocable,
              royalty-free right to use, implement and share it without
              obligation, attribution or compensation. Do not send us anything
              you consider confidential or that you are not free to give.
            </p>
          </>
        ),
      },
      {
        id: "copyright",
        title: "Copyright complaints",
        body: (
          <>
            <p>
              If you believe content on DisFuse infringes your copyright, open a
              ticket in the <code>#tickets</code> channel of our{" "}
              <a href={DISCORD_INVITE}>Discord server</a> or contact us at the
              details in <Ref to="contact" /> with:
            </p>
            <ul>
              <li>identification of the work you say is infringed;</li>
              <li>
                a link to the project, block pack, comment or website in
                question;
              </li>
              <li>your contact details;</li>
              <li>
                a statement that you believe in good faith that the use is not
                authorized; and
              </li>
              <li>
                a statement, under penalty of perjury, that your notice is
                accurate and that you are the rights holder or authorized to act
                for them.
              </li>
            </ul>
            <p>
              We remove infringing content and may terminate the accounts of
              repeat infringers. If your content was removed and you believe
              that was a mistake, tell us and we will review it.
            </p>
          </>
        ),
      },
      {
        id: "termination",
        title: "Suspension and termination",
        body: (
          <>
            <p>
              <strong>By you.</strong> You may stop using DisFuse at any time.
              To have your account and its data deleted, open a ticket in the{" "}
              <code>#tickets</code> channel of our{" "}
              <a href={DISCORD_INVITE}>Discord server</a>. Cancel any active
              subscription first — deleting an account does not automatically
              refund or cancel billing.
            </p>
            <p>
              <strong>By us.</strong> We may suspend or terminate your access,
              with or without notice, if you break these Terms, if your account
              is used unlawfully, if we are required to by law or by Discord, if
              keeping the account creates a risk to the Platform or to other
              users, or if your account has been inactive for an extended
              period.
            </p>
            <p>
              <strong>What termination does.</strong> Your projects, block
              packs, websites and versions may be deleted or made inaccessible.
              Public content already cloned by others, and content we must keep
              for legal or safety reasons, may remain. Paid Premium is not
              refunded where termination is for breach.
            </p>
            <p>
              <strong>What survives.</strong> Sections on your content license
              to us, feedback, intellectual property, disclaimers, limitation of
              liability, indemnification, governing law and dispute resolution
              survive termination, along with anything else that by its nature
              should.
            </p>
          </>
        ),
      },
      {
        id: "warranties",
        title: "Disclaimer of warranties",
        body: (
          <>
            <p>
              The Platform is provided <strong>“as is”</strong> and{" "}
              <strong>“as available”</strong>, without warranty of any kind,
              express or implied. To the fullest extent permitted by law we
              disclaim all warranties, including merchantability, fitness for a
              particular purpose, title and non-infringement.
            </p>
            <p>We specifically do not warrant that:</p>
            <ul>
              <li>
                the Platform will be uninterrupted, timely, secure or
                error-free;
              </li>
              <li>
                your Content, projects, versions, Insight logs or websites will
                be preserved, or recoverable if lost;
              </li>
              <li>
                generated code, AI output, community block packs or templates
                will be accurate, secure, efficient or fit for your purpose;
              </li>
              <li>
                bots built with DisFuse will function correctly, stay within
                Discord's rules, or remain compatible with future Discord
                changes; or
              </li>
              <li>
                defects will be corrected, or that third-party services we
                depend on will remain available.
              </li>
            </ul>
            <p>
              DisFuse is a hobby-scale project run by a small team. Treat it
              accordingly: keep backups, review generated code, and do not build
              anything safety-critical on it.
            </p>
            <p>
              Some jurisdictions do not allow the exclusion of certain
              warranties, so parts of this section may not apply to you.
            </p>
          </>
        ),
      },
      {
        id: "liability",
        title: "Limitation of liability",
        body: (
          <>
            <p>
              To the maximum extent permitted by law, DisFuse and the people who
              work on it will not be liable for any indirect, incidental,
              special, consequential, exemplary or punitive damages, or for loss
              of profits, revenue, goodwill, opportunity or data, arising out of
              or relating to the Platform — even if we were told such damages
              were possible.
            </p>
            <p>Without limiting that, we are not liable for:</p>
            <ul>
              <li>
                loss, corruption or deletion of projects, versions, block packs,
                websites or logs;
              </li>
              <li>downtime, degraded performance or maintenance;</li>
              <li>
                errors, security flaws or unintended behavior in generated code
                or in your bot;
              </li>
              <li>
                the acts of collaborators, block-pack authors or dashboard
                visitors;
              </li>
              <li>
                compromise of a bot token, secret or API key, however it
                happened;
              </li>
              <li>action taken against you or your bot by Discord; or</li>
              <li>
                outages or changes at Discord, Stripe, our AI providers, our
                infrastructure providers, or your bot's host.
              </li>
            </ul>
            <p>
              <strong>Cap.</strong> Our total aggregate liability for all claims
              relating to the Platform is limited to the greater of{" "}
              <strong>the amount you paid us in the 12 months</strong> before
              the event giving rise to the claim, or <strong>US$50</strong>.
            </p>
            <p>
              Nothing in these Terms excludes liability that cannot lawfully be
              excluded, including for fraud, or for death or personal injury
              caused by negligence. Some jurisdictions do not allow certain
              limitations, so parts of this section may not apply to you.
            </p>
          </>
        ),
      },
      {
        id: "indemnity",
        title: "Indemnification",
        body: (
          <>
            <p>
              You agree to defend, indemnify and hold harmless DisFuse, its
              team, staff and contributors from any claim, demand, loss,
              liability, damage, cost or expense (including reasonable legal
              fees) arising out of or related to: your Content; your bot and
              what it does; your use of Control, Websites, dashboards or
              Insights; your breach of these Terms or of any law; or your
              violation of anyone else's rights.
            </p>
            <p>
              We may take over the defense of any matter subject to this
              section, at your expense, and you will cooperate with us if we do.
            </p>
          </>
        ),
      },
      {
        id: "disputes",
        title: "Governing law and disputes",
        body: (
          <>
            <p>
              These Terms are governed by the laws of the{" "}
              <strong>State of Maryland, United States</strong>, without regard
              to its conflict of law rules. The courts located in Maryland have
              exclusive jurisdiction over any dispute arising from these Terms
              or the Platform, and you consent to their jurisdiction and venue.
            </p>
            <p>
              <strong>Talk to us first.</strong> Before filing anything, contact
              us and give us <strong>30 days</strong> to resolve the problem
              informally. Most disputes are misunderstandings and are fixed in a
              ticket.
            </p>
            <p>
              <strong>Consumer rights.</strong> If you are a consumer resident
              in a country whose law gives you the right to bring proceedings
              locally or to rely on mandatory local consumer protections, this
              section does not take those rights away.
            </p>
          </>
        ),
      },
      {
        id: "general",
        title: "General terms",
        body: (
          <>
            <ul>
              <li>
                <strong>Entire agreement.</strong> These Terms and the{" "}
                <Link to="/pp">Privacy Policy</Link> are the whole agreement
                between you and DisFuse about the Platform, and replace any
                earlier version, including all previous Terms of Service.
              </li>
              <li>
                <strong>Severability.</strong> If a provision is held
                unenforceable, it is limited or removed to the minimum extent
                necessary and the rest stays in force.
              </li>
              <li>
                <strong>No waiver.</strong> If we do not enforce a provision,
                that is not a waiver of it or of any other provision.
              </li>
              <li>
                <strong>Assignment.</strong> You may not assign or transfer
                these Terms, your account or your Premium plan without our
                written consent. We may assign them in connection with a merger,
                acquisition or transfer of the Platform.
              </li>
              <li>
                <strong>No third-party beneficiaries.</strong> These Terms give
                rights to you and to us, and to no one else.
              </li>
              <li>
                <strong>Force majeure.</strong> Neither party is liable for
                failure to perform caused by events beyond its reasonable
                control, including outages at Discord, Stripe or our
                infrastructure providers.
              </li>
              <li>
                <strong>Language and headings.</strong> Headings are for
                convenience only. If we publish a translation and it conflicts
                with this English version, this version controls.
              </li>
            </ul>
          </>
        ),
      },
      {
        id: "contact",
        title: "Contact us",
        body: (
          <>
            <p>
              The fastest way to reach us is Discord. For anything involving
              your account, billing, an appeal or a legal notice, use a ticket
              so there is a record.
            </p>
            <ul>
              <li>
                <strong>Support &amp; tickets:</strong> open a ticket in the{" "}
                <code>#tickets</code> channel of our{" "}
                <a href={DISCORD_INVITE}>Discord server</a>.
              </li>
              <li>
                <strong>Email:</strong>{" "}
                <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>, for
                legal notices and anything you would rather not raise on
                Discord.
              </li>
              <li>
                <strong>Billing:</strong>{" "}
                <Link to="/settings/premium">Settings → Premium</Link>, which
                also opens the Stripe billing portal.
              </li>
              <li>
                <strong>Privacy requests:</strong> see the{" "}
                <Link to="/pp#contact-privacy">Privacy Policy</Link>.
              </li>
            </ul>
          </>
        ),
      },
    ],
  },
];

export default function Tos() {
  return (
    <LegalDoc
      tag="LEGAL"
      icon="fa-solid fa-scale-balanced"
      title="Terms of Service"
      lead="The rules for using DisFuse — what you can build, what we owe each other, and how DisFuse Premium is billed."
      lastUpdated={LAST_UPDATED}
      effective={LAST_UPDATED}
      summary={summary}
      parts={parts}
      related={{
        to: "/pp",
        icon: "fa-solid fa-user-shield",
        label: "Read the Privacy Policy",
      }}
    />
  );
}
