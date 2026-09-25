import { useCallback, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import Comment from "../../../components/Comment";
import DocsLink from "../../../components/DocsLink.jsx";
import LoadingAnim from "../../../components/LoadingAnim";
import TemplateDetail from "../../../components/templates/TemplateDetail.jsx";
import {
  askForTemplateDetails,
  confirmDeleteTemplate,
  confirmUnpublishTemplate,
  pickProjectForTemplate,
  projectUrlWithTemplate,
} from "../../../components/templates/templateDialogs.js";
import api, { data, errorMessage } from "../../../api/client.js";
import {
  deleteTemplate,
  getTemplate,
  templateCommentsPath,
  unpublishTemplate,
  updateTemplate,
} from "../../../api/templates.js";
import { userCache } from "../../../cache.ts";
import modalThemeColor from "../../../functions/modalThemeColor.js";
import { DOCS } from "../../../config/docs.js";

const modalColors = modalThemeColor(null, true);

/* `GET /users` takes at most 100 ids at a time. */
const ID_BATCH = 100;

/** The people who wrote the comments and replies on this page. */
async function fetchCommentAuthors(comments) {
  const ids = [
    ...new Set(
      comments.flatMap((comment) => [
        comment.authorId,
        ...(comment.replies?.map((reply) => reply.authorId) ?? []),
      ]),
    ),
  ].filter(Boolean);

  const batches = [];
  for (let i = 0; i < ids.length; i += ID_BATCH)
    batches.push(ids.slice(i, i + ID_BATCH));

  const found = await Promise.all(
    batches.map((batch) =>
      api.get("/users", { params: { ids: batch.join(",") } }).then(data),
    ),
  );

  return found.flat();
}

function toast(title, icon = "success") {
  Swal.fire({
    toast: true,
    position: "top-right",
    timer: 4000,
    timerProgressBar: true,
    showConfirmButton: false,
    icon,
    title,
    ...modalColors,
  });
}

/* =====================================================================
   A template's page
   ---------------------------------------------------------------------
   The "post": everything TemplateDetail shows, plus the owner's tools
   and the comments. "Use in a project" picks one of your projects and
   opens it with the template waiting to be imported.
   ===================================================================== */

export default function TemplatePage() {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const viewer = userCache.user;

  const [template, setTemplate] = useState(null);
  const [status, setStatus] = useState("loading");
  const [loadError, setLoadError] = useState(null);
  const [comments, setComments] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);

  const commentsPath = templateCommentsPath(templateId);

  const loadComments = useCallback(async () => {
    const found = await api.get(commentsPath).then(data);
    setAuthors(await fetchCommentAuthors(found));
    setComments(found);
  }, [commentsPath]);

  useEffect(() => {
    const controller = new AbortController();

    setStatus("loading");

    getTemplate(templateId, { signal: controller.signal })
      .then((found) => {
        setTemplate(found);
        setStatus("ready");

        /* Comments failing to load shouldn't take the template with them. */
        loadComments().catch((error) =>
          console.error("Couldn't load comments:", error),
        );
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setLoadError(
          error?.response?.status === 404
            ? "This template doesn't exist, or you don't have access to it."
            : errorMessage(error, "Couldn't load this template."),
        );
        setStatus("error");
      });

    return () => controller.abort();
  }, [loadComments, templateId]);

  if (status === "loading") return <LoadingAnim />;

  if (status === "error")
    return (
      <div className="df-page">
        <div className="df-empty">
          <i className="fa-solid fa-shapes" />
          <h3>{loadError}</h3>
          <Link to="/templates">
            <button>
              <i className="fa-solid fa-arrow-left" /> All templates
            </button>
          </Link>
        </div>
      </div>
    );

  const merge = (changes) =>
    setTemplate((current) => ({ ...current, ...changes }));

  async function use() {
    const project = await pickProjectForTemplate(template, modalColors);
    if (project) navigate(projectUrlWithTemplate(project, template._id));
  }

  async function editDetails() {
    const answer = await askForTemplateDetails({
      title: "Template details",
      confirmButtonText: "Save",
      initial: template,
      modalColors,
      showDelete: true,
    });

    if (!answer) return;
    if (answer.action === "delete") return remove();

    try {
      const updated = await updateTemplate(template._id, {
        name: answer.name,
        description: answer.description,
        private: answer.private,
      });
      setTemplate(updated);
      toast("Details saved");
    } catch (error) {
      toast(errorMessage(error, "Couldn't save those details"), "error");
    }
  }

  async function unpublish() {
    if (!(await confirmUnpublishTemplate(template, modalColors))) return;

    try {
      setTemplate(await unpublishTemplate(template._id));
      toast("Unpublished");
    } catch (error) {
      toast(errorMessage(error, "Couldn't unpublish it"), "error");
    }
  }

  async function remove() {
    if (!(await confirmDeleteTemplate(template, modalColors))) return;

    try {
      await deleteTemplate(template._id);
      toast("Template deleted");
      navigate(
        template.owner?.id === viewer?.id
          ? "/templates?tab=mine"
          : "/templates",
      );
    } catch (error) {
      toast(errorMessage(error, "Couldn't delete it"), "error");
    }
  }

  async function postComment() {
    const content = draft.trim();
    if (!content || posting) return;

    setPosting(true);

    try {
      const created = await api.post(commentsPath, { content }).then(data);
      setDraft("");
      window.location.hash = created._id;
      await loadComments();
    } catch (error) {
      toast(errorMessage(error, "Couldn't post that comment"), "error");
    } finally {
      setPosting(false);
    }
  }

  const ownerActions = [
    {
      label: "Edit blocks",
      icon: "fa-solid fa-pen-ruler",
      href: `/templates/${template._id}/builder`,
    },
    {
      label: "Edit details",
      icon: "fa-solid fa-sliders",
      onClick: editDetails,
    },
    ...(template.published
      ? [
          {
            label: "Unpublish",
            icon: "fa-solid fa-eye-slash",
            onClick: unpublish,
          },
        ]
      : []),
    {
      label: "Delete",
      icon: "fa-solid fa-trash",
      onClick: remove,
      danger: true,
    },
  ];

  /* Moderation, on somebody else's template. */
  const staffActions = userCache.isStaff
    ? [
        ...(template.published
          ? [
              {
                label: "Unpublish (staff)",
                icon: "fa-solid fa-eye-slash",
                onClick: unpublish,
              },
            ]
          : []),
        {
          label: "Delete (staff)",
          icon: "fa-solid fa-trash",
          onClick: remove,
          danger: true,
        },
      ]
    : [];

  return (
    <div className="df-project-detail df-template-page">
      <Helmet>
        <title>{`${template.name} | DisFuse Templates`}</title>
      </Helmet>

      <Link to="/templates" className="df-template-back">
        <i className="fa-solid fa-arrow-left" /> All templates
      </Link>

      <TemplateDetail
        template={template}
        viewer={viewer}
        onChange={merge}
        onUse={use}
        useLabel="Add to a project"
        ownerActions={ownerActions}
        staffActions={staffActions}
      />

      <h2>
        Comments{" "}
        <DocsLink
          page={`${DOCS.explore}#comments`}
          variant="icon"
          label="About comments"
        />
      </h2>

      <div className="addComment">
        <textarea
          placeholder="Add a comment..."
          className="commentInput"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <button onClick={postComment} className="postBtn" disabled={posting}>
          Post
        </button>
      </div>

      <div className="body">
        {comments.map((comment, i) => (
          <Comment
            comment={comment}
            project={template}
            basePath={commentsPath}
            user={viewer}
            allUsers={authors}
            index={i}
            key={comment._id}
          />
        ))}
      </div>
    </div>
  );
}
