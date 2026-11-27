import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  publishTemplate,
  saveTemplateDraft,
  saveTemplateDraftOnExit,
  unpublishTemplate,
} from "../../api/templates.js";
import { userCache } from "../../cache.ts";
import { applyOp } from "../model/ops.js";
import { ALL_PERMISSIONS } from "../model/permissions.js";
import { parseTemplateContent, serializeTemplateContent } from "../model/templates.js";
import { BuilderContext, builderActions } from "./BuilderProvider.jsx";
import { useProjectCatalog } from "./packs.js";

/* =====================================================================
   DisFuse Builder: a template on screen, and saving it
   ---------------------------------------------------------------------
   The template builder for DisFuse Builder templates uses the builder's
   own pages (Commands, Events, the step builder...), so this gives them
   the same context BuilderProvider does, with a template behind it
   instead of a project:

     - every change is applied here with the same operations (ops.js),
       so a template can only hold what a project could;
     - nothing is sent change by change. The whole template is saved as
       its draft a moment after the last change, the way the block
       template builder saves its workspace. Nobody else sees the draft
       until the owner publishes it;
     - there's no bot: no token, no secrets, no collaborators. The pages
       get a stand-in project with the template's name and no secrets.

   Saving: one save in flight at a time, the latest template always
   wins, and a failed save stays pending so the next change (or leaving
   the page) tries again. Hiding the tab saves at once; closing it sends
   whatever is left with a `keepalive` request the browser lets finish.
   ===================================================================== */

/** Quiet time after the last change before the draft is saved. */
const SAVE_DELAY_MS = 1200;

/**
 * @param {object} props
 * @param {object} props.template  GET /templates/:id, for its owner (so with `draft`)
 */
export function TemplateBuilderProvider({ template: initialTemplate, children }) {
  const templateId = initialTemplate._id;
  const user = userCache.user;

  const [template, setTemplate] = useState(initialTemplate);
  const [builder, setBuilder] = useState(() => parseTemplateContent(initialTemplate.draft));
  const [saveState, setSaveState] = useState("idle");
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const builderRef = useRef(builder);

  /* The person's builder packs, and any the template already uses. */
  const { catalog, loadInstalled, ensureUsed } = useProjectCatalog();
  const catalogRef = useRef(catalog);
  catalogRef.current = catalog;
  useEffect(() => {
    loadInstalled().catch(() => {});
    ensureUsed(builderRef.current).catch(() => {});
  }, [ensureUsed, loadInstalled]);

  /* What importers get, as this page serialises it: what "changes not
     published" compares against. When the API says the draft and the
     published version match, the draft as loaded stands in for it. */
  const loaded = useMemo(() => serializeTemplateContent(builder), []); // eslint-disable-line react-hooks/exhaustive-deps
  const publishedRef = useRef(
    initialTemplate.published ? (initialTemplate.unpublishedChanges ? initialTemplate.data : loaded) : null,
  );

  const timer = useRef(null);
  const dirty = useRef(false);
  const inFlight = useRef(null);
  const lastSaved = useRef(loaded);

  /* ---- Saving the draft ---------------------------------------------- */

  const save = useCallback(async () => {
    clearTimeout(timer.current);
    timer.current = null;

    /* Let the save on its way land first; this one carries whatever
       changed since. */
    if (inFlight.current) await inFlight.current.catch(() => {});
    if (!dirty.current) return;

    const data = serializeTemplateContent(builderRef.current);
    dirty.current = false;
    if (data === lastSaved.current) {
      setSaveState("saved");
      return;
    }

    setSaveState("saving");
    inFlight.current = saveTemplateDraft(templateId, data)
      .then(() => {
        lastSaved.current = data;
        setSaveState("saved");
        setLastSavedAt(new Date());
      })
      .catch((error) => {
        console.error("Couldn't save the template draft:", error);
        dirty.current = true;
        setSaveState("error");
      })
      .finally(() => {
        inFlight.current = null;
      });

    await inFlight.current;
  }, [templateId]);

  const flush = useCallback(async () => {
    await save();
    if (inFlight.current) await inFlight.current.catch(() => {});
  }, [save]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") save();
    };
    const onBeforeUnload = (event) => {
      if (!dirty.current && !inFlight.current) return;
      const data = serializeTemplateContent(builderRef.current);
      if (data !== lastSaved.current && saveTemplateDraftOnExit(templateId, data)) {
        dirty.current = false;
        return;
      }
      /* Too big to send on the way out: ask the browser to warn. */
      if (dirty.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("beforeunload", onBeforeUnload);
      /* Leaving for another page of the app. */
      if (dirty.current) save();
      clearTimeout(timer.current);
    };
  }, [save, templateId]);

  /* ---- Changing it ---------------------------------------------------- */

  const change = useCallback(
    (name, payload) => {
      const { builder: next, result } = applyOp(builderRef.current, name, payload);
      builderRef.current = next;
      setBuilder(next);
      dirty.current = true;
      setSaveState("saving");
      clearTimeout(timer.current);
      timer.current = setTimeout(save, SAVE_DELAY_MS);
      return result;
    },
    [save],
  );

  const actions = useMemo(() => {
    const all = builderActions(change, builderRef, catalogRef);
    /* A template can't import a template. */
    delete all.importTemplate;
    return all;
  }, [change]);

  /* ---- Publishing ----------------------------------------------------- */

  const [revision, setRevision] = useState(0);
  const changedSincePublish = useMemo(
    () => Boolean(template.published) && publishedRef.current !== null && serializeTemplateContent(builder) !== publishedRef.current,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [builder, template.published, revision],
  );

  /** Makes the template as it is now what importers get. */
  const publish = useCallback(async () => {
    clearTimeout(timer.current);
    if (inFlight.current) await inFlight.current.catch(() => {});
    const data = serializeTemplateContent(builderRef.current);
    const updated = await publishTemplate(templateId, { data });
    /* Publishing saves the draft too. Anything changed while it was on
       its way still needs saving. */
    lastSaved.current = data;
    if (data !== serializeTemplateContent(builderRef.current)) {
      dirty.current = true;
      timer.current = setTimeout(save, SAVE_DELAY_MS);
    } else dirty.current = false;
    publishedRef.current = data;
    setTemplate(updated);
    setRevision((n) => n + 1);
    setSaveState("saved");
    setLastSavedAt(new Date());
    return updated;
  }, [save, templateId]);

  const unpublish = useCallback(async () => {
    const updated = await unpublishTemplate(templateId);
    publishedRef.current = null;
    setTemplate(updated);
    setRevision((n) => n + 1);
    return updated;
  }, [templateId]);

  /** Forgets unsaved changes: the template is being deleted. */
  const discardChanges = useCallback(() => {
    clearTimeout(timer.current);
    dirty.current = false;
  }, []);

  /** Name, description and visibility, after they were saved. */
  const mergeTemplate = useCallback((fields) => setTemplate((current) => ({ ...current, ...fields })), []);

  /* ---- What the pages see --------------------------------------------- */

  const project = useMemo(
    () => ({
      _id: template._id,
      name: template.name,
      description: template.description,
      private: template.private,
      owner: user,
      secrets: [],
      collaborators: [],
    }),
    [template._id, template.name, template.description, template.private, user],
  );

  const value = useMemo(
    () => ({
      mode: "template",
      projectId: null,
      project,
      builder,
      loading: false,
      error: null,
      saveState,
      lastSavedAt,
      catalog,
      isOwner: true,
      isCollaborator: false,
      permissions: ALL_PERMISSIONS,
      can: () => true,
      stepPermissions: () => ({ add: true, edit: true, move: true, toggle: true, delete: true }),
      readOnly: false,
      viewOnly: false,
      setAccess: () => {},
      setMemberCount: () => {},
      flush,
      getBuilder: () => builderRef.current,
      reload: async () => {},
      patchProject: () => {},
      paths: {
        home: "/templates?tab=mine",
        project: `/templates/${template._id}`,
        workspace: `/templates/${template._id}/builder`,
        edit: null,
        collaborators: null,
      },

      /* Only in the template builder. */
      template,
      mergeTemplate,
      changedSincePublish,
      publish,
      unpublish,
      discardChanges,
      ...actions,
    }),
    [actions, builder, catalog, changedSincePublish, discardChanges, flush, lastSavedAt, mergeTemplate, project, publish, saveState, template, unpublish],
  );

  return <BuilderContext.Provider value={value}>{children}</BuilderContext.Provider>;
}

/**
 * A builder to look at and nothing else: a template's commands and
 * events, drawn by the builder's read-only pieces (a template's page
 * uses this to show what's in it). Every change is refused.
 *
 * @param {object} props
 * @param {object} props.builder  { commands, events, variables }
 * @param {string} props.name     shown where a bot's name would be
 * @param {string} [props.templateId]
 */
export function StaticBuilderProvider({ builder, name, templateId, children }) {
  const { catalog, ensureUsed } = useProjectCatalog();
  useEffect(() => {
    ensureUsed(builder).catch(() => {});
  }, [builder, ensureUsed]);

  const value = useMemo(() => {
    const refuse = () => {
      throw new Error("This is a preview, so it can't be changed.");
    };
    return {
      mode: "preview",
      projectId: null,
      project: { _id: templateId, name, secrets: [], collaborators: [] },
      builder,
      loading: false,
      error: null,
      saveState: "idle",
      lastSavedAt: null,
      catalog,
      isOwner: false,
      isCollaborator: false,
      permissions: [],
      can: () => false,
      stepPermissions: () => ({ add: false, edit: false, move: false, toggle: false, delete: false }),
      readOnly: true,
      viewOnly: true,
      setAccess: () => {},
      setMemberCount: () => {},
      flush: async () => {},
      reload: async () => {},
      patchProject: () => {},
      paths: { home: "/templates", project: `/templates/${templateId}`, workspace: `/templates/${templateId}`, edit: null, collaborators: null },
      ...builderActions(refuse, { current: builder }, { current: catalog }),
    };
  }, [builder, catalog, name, templateId]);

  return <BuilderContext.Provider value={value}>{children}</BuilderContext.Provider>;
}
