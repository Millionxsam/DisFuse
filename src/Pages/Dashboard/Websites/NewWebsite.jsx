import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import { Helmet } from "react-helmet-async";

import LoadingAnim from "../../../components/LoadingAnim";
import { createWebsite } from "../../../api/websites";
import { apiUrl } from "../../../config/config";
import {
  buildWebsiteConfig,
  websiteTemplates,
} from "../../../config/websiteDefaults";
import modalThemeColor from "../../../functions/modalThemeColor";
import { userCache } from "../../../cache.ts";

import DocsLink from "../../../components/DocsLink.jsx";
import { DOCS } from "../../../config/docs.js";

/**
 * Creating a website starts from one of the user's existing DisFuse
 * projects, because a website always belongs to a bot (botID is required).
 * What the website *is* — a landing page, an info site or a dashboard — is
 * decided by the template, and can be changed freely afterwards.
 */
export default function NewWebsite() {
  const navigate = useNavigate();
  /* Set when this page was opened from a project — "Add a website" on the
     project page — so the bot it belongs to is already chosen. */
  const [params] = useSearchParams();
  const fromProject = params.get("project");

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [selected, setSelected] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [templateId, setTemplateId] = useState("botinfo");

  useEffect(() => {
    const userId = userCache.user?.id;
    if (!userId) return setLoading(false);

    axios
      .get(`${apiUrl}/users/${userId}/projects`, {
        headers: { Authorization: localStorage.getItem("disfuse-token") },
      })
      .then(({ data }) => {
        /* Only bots this user actually owns. /users/:id/projects also
           returns projects they were invited to collaborate on, and a
           collaborator must not be able to publish a website for someone
           else's bot — the API rejects it too. */
        const owned = (data || []).filter(
          (project) =>
            project?.bot?.id &&
            project?.owner?.id === userId &&
            project?.suspension?.status !== true,
        );

        setProjects(owned);
        setLoading(false);

        /* Opened from a project page: pick that bot, and go straight to
           the builder if it turns out to have a website already. */
        const opened = fromProject
          ? owned.find((project) => project._id === fromProject)
          : null;

        if (opened?.website?._id)
          return navigate(`/websites/${opened.website._id}/editor`, {
            replace: true,
          });

        if (opened) pickProject(opened);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  function pickProject(project) {
    setSelected(project);
    if (!name) setName(`${project.bot?.username || project.name} Website`);
  }

  /* Bots still free to build for, and the picker order: those first, the
     ones that already have a website after them. */
  const available = projects.filter((project) => !project.website);
  const picker = [
    ...available,
    ...projects.filter((project) => project.website),
  ];

  function create() {
    if (!selected || !name.trim()) return;
    setCreating(true);

    createWebsite({
      botID: selected.bot.id,
      projectId: selected._id,
      name: name.trim(),
      published: false,
      bot: {
        id: selected.bot.id,
        username: selected.bot.username,
        avatar: selected.bot.avatar,
      },
      config: buildWebsiteConfig({
        templateId,
        name: name.trim(),
        description: description.trim(),
        brand: selected.bot?.username || name.trim(),
      }),
    })
      .then((website) => {
        userCache.websites = null;
        /* My Projects and Explore both render a link to a project's
           website, and both read from a cached listing. */
        userCache.projects = null;
        userCache.explore = null;
        navigate(`/websites/${website._id}/editor`);
      })
      .catch((err) => {
        console.error(err);
        setCreating(false);

        /* One website per bot. When that's what went wrong the API names
           the website already using this bot, so offer to open it rather
           than leaving the owner at a dead end. */
        const existingId = err.response?.data?.websiteId;

        Swal.fire({
          icon: "error",
          title: "Error Creating Website",
          text:
            err.response?.data?.error ||
            "An error occurred while creating the website. Please try again.",
          showCancelButton: Boolean(existingId),
          confirmButtonText: existingId ? "Open that website" : "OK",
          ...modalThemeColor(userCache.user),
        }).then((result) => {
          if (existingId && result.isConfirmed)
            navigate(`/websites/${existingId}/editor`);
        });
      });
  }

  return (
    <div className="newProject-page-container df-new-website">
      <Helmet>
        <title>New Website | DisFuse</title>
      </Helmet>
      <div className="df-page-head">
        <h1>
          <i className="fa-solid fa-globe"></i> New Website
        </h1>
        <div className="df-toolbar">
          <div className="df-btn-group">
            <DocsLink page={`${DOCS.websites}#creating-one`} />
          </div>
        </div>
      </div>

      <div className="body">
        {loading ? (
          <LoadingAnim />
        ) : !projects.length ? (
          <div className="df-empty">
            <i className="fa-solid fa-robot"></i>
            <h3>No bots to build for</h3>
            <p>
              A website belongs to a bot you own. Projects you've only been
              invited to collaborate on don't count. Create your own project
              with a bot token first, then come back here.
            </p>
            <Link to="/projects/new">
              <button className="df-primary-btn">
                <i className="fa-solid fa-plus"></i> New Project
              </button>
            </Link>
          </div>
        ) : !available.length ? (
          <div className="df-empty">
            <i className="fa-solid fa-globe"></i>
            <h3>Every bot already has a website</h3>
            <p>
              A bot can only have one website. Open the one you already built,
              or start a new project to build a website for another bot.
            </p>
            <Link to="/websites">
              <button className="df-primary-btn">
                <i className="fa-solid fa-globe"></i> My Websites
              </button>
            </Link>
          </div>
        ) : (
          <div className="projectInfo">
            <div style={{ gap: "2px" }}>
              <h2>Bot</h2>
              <p style={{ opacity: ".5" }}>
                The website is published at a URL based on this bot, and
                dashboard controls (if you add any) configure this bot.
              </p>
            </div>

            <div className="df-bot-picker">
              {picker.map((project) => {
                /* One website per bot, so a bot that already has one can't
                   be picked. It stays in the list as a way into the
                   builder rather than disappearing without explanation. */
                const existing = project.website;

                return (
                  <button
                    type="button"
                    key={project._id}
                    className={`df-bot-option${
                      selected?._id === project._id ? " selected" : ""
                    }${existing ? " taken" : ""}`}
                    title={
                      existing
                        ? `${existing.name} — open the builder`
                        : undefined
                    }
                    onClick={() =>
                      existing
                        ? navigate(`/websites/${existing._id}/editor`)
                        : pickProject(project)
                    }
                  >
                    <img
                      src={`https://cdn.discordapp.com/avatars/${project.bot.id}/${project.bot.avatar}.png`}
                      alt=""
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src =
                          "https://cdn.discordapp.com/embed/avatars/0.png";
                      }}
                    />
                    <span>
                      <strong>{project.bot.username}</strong>
                      <small>{existing ? existing.name : project.bot.id}</small>
                    </span>
                    {existing ? (
                      <i className="fa-solid fa-globe"></i>
                    ) : (
                      selected?._id === project._id && (
                        <i className="fa-solid fa-circle-check"></i>
                      )
                    )}
                  </button>
                );
              })}
            </div>

            <h2>Website name</h2>
            <input
              type="text"
              placeholder="My bot's website"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <div style={{ gap: "2px" }}>
              <h2>Description</h2>
              <i style={{ opacity: ".5" }}>
                Optional. Used for search engine previews
              </i>
            </div>
            <textarea
              placeholder="What is this website about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div style={{ gap: "2px" }}>
              <h2>Starting point</h2>
              <p style={{ opacity: ".5" }}>
                Just a starting layout. You can add, remove and rearrange
                anything afterwards, including dashboard controls.
              </p>
            </div>

            <div className="df-template-picker">
              {websiteTemplates.map((template) => (
                <button
                  type="button"
                  key={template.id}
                  className={`df-template-option${
                    templateId === template.id ? " selected" : ""
                  }`}
                  onClick={() => setTemplateId(template.id)}
                >
                  <i className={template.icon}></i>
                  <strong>{template.name}</strong>
                  <p>{template.description}</p>
                  {template.dashboard && (
                    <span className="badge dashboard">
                      <i className="fa-solid fa-sliders"></i>{" "}
                      {template.scopes || "Dashboard"}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {creating ? (
              <LoadingAnim onlySpinner />
            ) : (
              <button
                className="df-primary-btn"
                onClick={create}
                disabled={!selected || !name.trim()}
              >
                <i className="fa-solid fa-plus"></i> Create Website
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
