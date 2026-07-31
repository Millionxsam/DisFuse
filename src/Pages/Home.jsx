import axios from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { userCache } from "../cache.ts";
import { apiUrl } from "../config/config.js";

const features = [
  {
    icon: "fa-solid fa-eye-slash",
    title: "Private or public projects",
    text: "Keep a bot to yourself while you build it, or publish it for the community to see and clone.",
  },
  {
    icon: "fa-solid fa-shapes",
    title: "Custom & community blocks",
    text: "Extend the default block set with your own, or drop in blocks other builders have shared.",
  },
  {
    icon: "fa-solid fa-user-group",
    title: "Multi-user collaboration",
    text: "Invite collaborators into a project and build the same bot together in real time.",
  },
  {
    icon: "fa-solid fa-comments",
    title: "Comment on other projects",
    text: "Browse public bots, leave feedback, and reply to threads right on the project page.",
  },
  {
    icon: "fa-solid fa-lock",
    title: "Built-in secrets",
    text: "Store API keys and tokens as encrypted environment variables your blocks can reference safely.",
  },
  {
    icon: "fa-solid fa-cubes",
    title: "Templates, built-in or shared",
    text: "Start from a template instead of a blank workspace, or publish your own for others to use.",
  },
  {
    icon: "fa-brands fa-square-js",
    title: "Advanced Discord features",
    text: "Slash commands, modals, buttons, and Components V2 are all available as blocks.",
  },
  {
    icon: "fa-solid fa-desktop",
    title: "Organized workspace",
    text: "Tabs, search, and a clean canvas keep even large projects easy to navigate.",
  },
  {
    icon: "fa-solid fa-gears",
    title: "Workspace settings",
    text: "Tune autosave, optimization, and notifications per project so it fits how you work.",
  },
];

const reviews = [
  {
    name: "izorc",
    stars: 5,
    text: "Disfuse is a very good platform to code your discord bots. I'm getting good customer support and it has a great userface. The management team actually listens to their customers's suggestion.",
  },
  {
    name: "WhisPro",
    stars: 5,
    text: "Very epic! They listen to the community and update Disfuse very often :D",
  },
  {
    name: "Aggareth",
    stars: 5,
    text: "Great service, best support, friendly community, love it.",
  },
  {
    name: "bubbel",
    stars: 5,
    text: "I wouldn't have been able to make this bot without it. I know it might be a bit unstable but it's a new project so it makes sense for bugs! I haven't encountered any myself yet so that's good.",
  },
  { name: "reem", stars: 5, text: "It's much better than S4D." },
  { name: "schvarts11", stars: 5, text: "You are the best!!!!!!!!!!!!!" },
  { name: "flipflop99", stars: 5, text: "Very good." },
  { name: "ItzCherokee", stars: 5, text: "Just great." },
  { name: "Alejo.14", stars: 5, text: "Cuz is cool." },
  {
    name: "Arci",
    stars: 5,
    text: "Disfuse is an amazing community! The members are incredibly helpful and friendly, and I've received a lot of valuable support here. If you're into coding and looking for a welcoming place to learn and collaborate, I highly recommend joining Disfuse!",
  },
];

export default function Home() {
  const [users, setUsers] = useState(null);
  const [projects, setProjects] = useState(null);

  useEffect(() => {
    if (users !== null && projects !== null) return;

    if (userCache.stats) {
      setUsers(userCache.stats.users);
      setProjects(userCache.stats.projects);
    } else {
      axios
        .get(apiUrl + "/stats")
        .then(({ data }) => {
          setUsers(data.users);
          setProjects(data.projects);
        })
        .catch(() => {
          setUsers(1000);
          setProjects(1100);
        });
    }
  }, [users, projects]);

  useEffect(() => {
    if (users === null || projects === null) return;

    let animationFrameId;

    const usersEle = document.querySelector(".df-count-users");
    const projectsEle = document.querySelector(".df-count-projects");
    if (!usersEle || !projectsEle) return;

    const animationMs = 2000;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / animationMs, 1);

      const currentUsers = Math.floor(users * progress);
      const currentProjects = Math.floor(projects * progress);

      usersEle.textContent = currentUsers.toLocaleString();
      projectsEle.textContent = currentProjects.toLocaleString();

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [users, projects]);

  return (
    <div className="df-home">
      <section className="df-hero">
        <div className="df-hero-copy">
          <h1>
            Build your Discord bot with <span>simple blocks</span>
          </h1>

          <p className="lead">
            DisFuse lets you snap together advanced Discord bot logic with
            easy-to-use blocks, no coding experience required. Build slash
            commands, moderation tools, and more without writing a single line
            of code.
          </p>

          <div className="buttons hidden">
            <Link to="/projects">
              <button>
                <i className="fa-solid fa-table-list"></i> Open Dashboard
              </button>
            </Link>
            <Link to="/explore">
              <button>
                <i className="fa-solid fa-magnifying-glass"></i> Explore Bots
              </button>
            </Link>
          </div>

          <div className="df-stats-row hidden">
            <div className="df-stat-pill">
              <span className="dot blue"></span>
              <strong className="df-count-users">
                {users ? users.toLocaleString() : "0"}
              </strong>
              users
            </div>
            <div className="df-stat-pill">
              <span className="dot amber"></span>
              <strong className="df-count-projects">
                {projects ? projects.toLocaleString() : "0"}
              </strong>
              projects
            </div>
          </div>
        </div>

        <div className="df-hero-blocks" aria-hidden="true">
          <div
            className="df-hb"
            style={{ "--hb-color": "var(--df-amber)", "--hb-delay": "0s" }}
          >
            <i className="fa-solid fa-bolt"></i>
            <span>
              When <b>/welcome</b> is used
            </span>
            <span className="tab"></span>
          </div>
          <div className="df-hb-wire"></div>
          <div
            className="df-hb"
            style={{ "--hb-color": "#4aa8f5", "--hb-delay": "0.4s" }}
          >
            <i className="fa-solid fa-code-branch"></i>
            <span>
              If member has <b>no role</b>
            </span>
            <span className="tab"></span>
          </div>
          <div className="df-hb-wire"></div>
          <div
            className="df-hb"
            style={{ "--hb-color": "var(--df-mint)", "--hb-delay": "0.8s" }}
          >
            <i className="fa-brands fa-discord"></i>
            <span>Send welcome message</span>
          </div>
        </div>
      </section>

      <section className="df-section">
        <div className="df-section-head hidden">
          <span className="df-tag">Why DisFuse?</span>
          <h2>Everything a bot needs, none of the code</h2>
          <p>
            Nine reasons builders pick DisFuse over writing a bot from scratch.
          </p>
        </div>

        <div className="df-feature-grid">
          {features.map((f) => (
            <div className="df-feature-card" key={f.title}>
              <div className="icon">
                <i className={f.icon}></i>
              </div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="df-section">
        <div className="df-section-head hidden">
          <span className="df-tag">Reviews</span>
          <h2>What builders are saying</h2>
        </div>

        <div className="df-review-grid">
          {reviews.map((r) => (
            <div className="df-review-card" key={r.name}>
              <h4>
                <span className="avatar">{r.name[0].toUpperCase()}</span>
                {r.name}
              </h4>
              <div className="stars">{"★".repeat(r.stars)}</div>
              <p>{r.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="df-cta">
        <div className="df-cta-inner">
          <h2>Ready to build your first bot?</h2>
          <p>
            Create a project, drop in your bot token, and start snapping blocks
            together in minutes.
          </p>
          <div className="buttons">
            <Link to="/projects/new">
              <button className="df-primary-btn">
                <i className="fa-solid fa-plus"></i> New Project
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
