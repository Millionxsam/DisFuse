import { useEffect, useState } from "react";

import WorkspaceModal, { ModalError, ModalLoading } from "./WorkspaceModal.jsx";
import TemplateGallery from "../templates/TemplateGallery.jsx";
import TemplateDetail from "../templates/TemplateDetail.jsx";
import { errorMessage } from "../../api/client.js";
import { getTemplate } from "../../api/templates.js";

import { DOCS } from "../../config/docs.js";

/* =====================================================================
   Utilities › Templates
   ---------------------------------------------------------------------
   The template gallery, inside the editor. It used to be a dropdown of
   five templates built into the app; it is now the same gallery as the
   dashboard's Templates page — everyone's templates, liked, searched and
   sorted — with one difference: "Import" adds a template to the project
   that is open, right now.

   Importing and creating both ask SweetAlert questions, and SweetAlert
   renders beneath a `<dialog>` in the top layer. So neither happens in
   here: the page closes this dialog and takes it from there.

   The gallery stays mounted while a template is open, so going back
   lands on the same tab, search and page rather than starting over.
   ===================================================================== */

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {object} props.viewer
 * @param {(templateId: string) => void} props.onImport
 * @param {() => void} props.onCreate
 */
export default function TemplatesModal({
  open,
  onClose,
  viewer,
  onImport,
  onCreate,
}) {
  const [openId, setOpenId] = useState(null);
  const [template, setTemplate] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [retry, setRetry] = useState(0);
  /* Refetch the gallery each time the dialog opens — a template made or
     published in another tab should be there. */
  const [reloadKey, setReloadKey] = useState(0);
  /* The dialog is in the page from the start; the gallery only joins it
     the first time it opens, so opening a project costs no request. */
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    if (open) {
      setOpened(true);
      setReloadKey((key) => key + 1);
    } else setOpenId(null);
  }, [open]);

  useEffect(() => {
    if (!openId) {
      setTemplate(null);
      return undefined;
    }

    const controller = new AbortController();

    setStatus("loading");
    setError(null);

    getTemplate(openId, { signal: controller.signal })
      .then((found) => {
        setTemplate(found);
        setStatus("ready");
      })
      .catch((failure) => {
        if (controller.signal.aborted) return;
        setError(errorMessage(failure, "Couldn't open that template"));
        setStatus("error");
      });

    return () => controller.abort();
  }, [openId, retry]);

  const builderUrl = (id) => `/templates/${id}/builder`;

  return (
    <WorkspaceModal
      open={open}
      onClose={onClose}
      title="Templates"
      subtitle="Ready-made blocks from the community and the DisFuse team. Importing copies them into this project."
      icon="fa-solid fa-shapes"
      docsPage={DOCS.templates}
      className="df-templates-modal"
    >
      <div hidden={Boolean(openId)}>
        {opened ? (
          <TemplateGallery
            context="editor"
            viewer={viewer}
            reloadKey={reloadKey}
            onOpen={(found) => setOpenId(found._id)}
            onUse={(found) => onImport(found._id)}
            useLabel="Import"
            useIcon="fa-solid fa-file-import"
            onEdit={(found) => {
              /* A new tab, so the project stays open — or this one, where
               the browser won't allow a new tab. */
              if (!window.open(builderUrl(found._id), "_blank"))
                window.location.href = builderUrl(found._id);
            }}
            onCreate={onCreate}
          />
        ) : null}
      </div>

      {openId ? (
        <div className="df-templates-modal-detail">
          <div className="df-templates-modal-nav">
            <button type="button" onClick={() => setOpenId(null)}>
              <i className="fa-solid fa-arrow-left" /> All templates
            </button>
            <a
              href={`/templates/${openId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Comments &amp; full page{" "}
              <i className="fa-solid fa-arrow-up-right-from-square" />
            </a>
          </div>

          {status === "loading" ? (
            <ModalLoading label="Opening template…" />
          ) : status === "error" ? (
            <ModalError onRetry={() => setRetry((count) => count + 1)}>
              {error}
            </ModalError>
          ) : template ? (
            <TemplateDetail
              context="editor"
              template={template}
              viewer={viewer}
              onChange={(changes) =>
                setTemplate((current) => ({ ...current, ...changes }))
              }
              onUse={() => onImport(template._id)}
              useLabel="Import into this project"
              ownerActions={[
                {
                  label: "Edit blocks",
                  icon: "fa-solid fa-pen-ruler",
                  href: builderUrl(template._id),
                  newTab: true,
                },
              ]}
            />
          ) : null}
        </div>
      ) : null}
    </WorkspaceModal>
  );
}
