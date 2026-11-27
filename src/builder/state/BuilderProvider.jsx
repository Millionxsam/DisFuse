import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import api, { data, errorMessage } from "../../api/client.js";
import {
  createVersion as createVersionCall,
  deleteVersion as deleteVersionCall,
  getVersion,
  getVersions,
  recallActiveVersion,
  rememberActiveVersion,
  renameVersion as renameVersionCall,
} from "../../api/versions.js";
import { planLimits } from "../../config/premiumPlans.js";
import { userCache } from "../../cache.ts";
import { newId } from "../model/ids.js";
import { OpError, applyOp, findAction, isRepeatItem } from "../model/ops.js";
import { ALL_PERMISSIONS, opRefusal, stepGroupFor } from "../model/permissions.js";
import { flowInfo, locationOf } from "../model/scope.js";
import { validateFlow } from "../model/validate.js";
import { toast } from "../ui/toast.js";
import { builderApi } from "./api.js";
import { useProjectCatalog } from "./packs.js";

/* =====================================================================
   DisFuse Builder: the project on screen, and saving it
   ---------------------------------------------------------------------
   Holds the open project and its builder data, and is the only way the
   pages change them.

   Every change goes through the same two steps:

     1. it's applied right here with applyOp (model/ops.js), so the page
        updates at once, and anything invalid throws an OpError straight
        back to the form that asked (it can show the message inline);
     2. the same change is queued for the API, which applies it again to
        the saved copy.

   The queue sends one request at a time, in order, so the server sees
   changes in the order they were made. Typing is debounced: rapid edits
   to the same thing are merged and sent once the person pauses (or
   leaves the page). If the server refuses a change, everything queued
   after it is dropped, a toast says why, and the saved copy is loaded
   again so the screen can't drift from what's stored.

   There is no socket: this is autosave with plain GET/POST/PATCH/PUT/
   DELETE calls, as the builder was specified.

   Collaborators
   -------------
   The owner can make any change. A collaborator can make the ones their
   permissions cover (model/permissions.js, which the API runs as well),
   and `change` refuses the rest with an OpError before anything is sent,
   so pages that forget to hide a button still can't get past it.

   While anyone else can change the project, the page asks the API for
   the builder's revision every few seconds (and every write answers with
   it too). When it moved and nothing of ours is waiting to be saved, the
   builder is loaded again, so other people's changes show up without a
   reload. The same call brings back this person's permissions, so a
   change the owner makes to them applies straight away.

   Version Control
   ---------------------------------------------------------------------
   A project with versions (pages/VersionsPage.jsx) keeps its builder
   inside them, and this page is always on one: `version` below. Which
   one is a choice this page makes, not something stored on the project,
   so two people can be on two versions at once. It opens on the version
   in `?v=` or the one this browser was last on, and the API falls back
   to the newest when that one is gone.

   Every queued change carries the version it was made in, so a change
   can never be sent into a different version than the one it was made
   on, and switching sends everything waiting first. When the version
   this page is on disappears (deleted, or Version Control turned off,
   somewhere else), the next poll or refused save loads the builder
   again, and the API's answer says which version that is now.
   ===================================================================== */

/* Exported for TemplateBuilderProvider, which gives the same pages a
   template to build instead of a project. */
export const BuilderContext = createContext(null);

const DEBOUNCE_MS = 450;

/** How often to look for other people's changes. */
const POLL_MS = 5000;

/** What the Versions page knows before the API has answered. */
const UNKNOWN_VERSIONS = {
  loaded: false,
  versioned: false,
  versions: [],
  canManage: false,
  canEdit: false,
  premium: false,
  maxVersions: planLimits.free.versionsPerProject,
  premiumMaxVersions: planLimits.premium.versionsPerProject,
};

/** The parts of a /versions answer the Versions page reads. */
function versionsFrom(answer, previous) {
  return {
    loaded: true,
    versioned: Boolean(answer.versioned ?? answer.versions?.length),
    versions: answer.versions ?? previous.versions,
    canManage: Boolean(answer.canManage ?? previous.canManage),
    canEdit: Boolean(answer.canEdit ?? previous.canEdit),
    premium: Boolean(answer.premium ?? previous.premium),
    maxVersions: answer.maxVersions ?? previous.maxVersions,
    premiumMaxVersions: answer.premiumMaxVersions ?? previous.premiumMaxVersions,
  };
}

/** The version a link asked for (`?v=<id>`), if any. */
function versionInAddress() {
  try {
    return new URLSearchParams(window.location.search).get("v");
  } catch {
    return null;
  }
}

/** Permissions that change commands, events and their steps. */
const BUILDING = /^(commands|options|commandSteps|events|eventSteps|variables)\./;

/* Merges two patches for the same thing: later keys win, but input maps
   are merged key by key so typing in two inputs keeps both. */
function mergePayload(name, older, newer) {
  if (name === "updateAction")
    return {
      ...newer,
      patch: {
        ...older.patch,
        ...newer.patch,
        ...(older.patch?.inputs || newer.patch?.inputs
          ? { inputs: { ...older.patch?.inputs, ...newer.patch?.inputs } }
          : {}),
      },
    };
  if (name === "updateBranchItem")
    return { ...newer, inputs: { ...older.inputs, ...newer.inputs } };
  if (name === "updateEvent")
    return {
      ...newer,
      patch: {
        ...older.patch,
        ...newer.patch,
        ...(older.patch?.settings || newer.patch?.settings
          ? { settings: { ...older.patch?.settings, ...newer.patch?.settings } }
          : {}),
      },
    };
  if (name === "updateCommand" || name === "updateOption")
    return { ...newer, patch: { ...older.patch, ...newer.patch } };
  return newer;
}

/**
 * Every way the pages change the builder, as named helpers around
 * `change(name, payload, options)`. Shared with TemplateBuilderProvider,
 * so both make changes exactly the same way.
 *
 * @param {(name: string, payload: object, options?: object) => any} change
 * @param {{ current: object }} builderRef  the builder as of now
 * @param {{ current: object }} catalogRef  the catalog as of now (it grows
 *   as Workshop packs load)
 */
export function builderActions(change, builderRef, catalogRef) {
  const newAction = (type) => {
    const def = catalogRef.current.actions.get(type);
    const branches = {};
    for (const branch of def?.branches ?? []) if (!branch.optional) branches[branch.key] = [];
    return { id: newId(), type, inputs: {}, branches };
  };

  return {
    /* Commands and options */
    createCommand: ({ kind = "slash", name, description }) =>
      change("createCommand", {
        command: { id: newId(), kind, name, description, created: new Date().toISOString() },
      }),
    updateCommand: (commandId, patch, options) =>
      change("updateCommand", { commandId, patch }, { ...options, key: `command:${commandId}` }),
    deleteCommand: (commandId) => change("deleteCommand", { commandId }),
    createOption: (commandId, parentId, { type, name, description }) =>
      change("createOption", { commandId, parentId: parentId ?? null, option: { id: newId(), type, name, description } }),
    updateOption: (commandId, optionId, patch, options) =>
      change("updateOption", { commandId, optionId, patch }, { ...options, key: `option:${optionId}` }),
    deleteOption: (commandId, optionId) => change("deleteOption", { commandId, optionId }),
    reorderOptions: (commandId, parentId, order) =>
      change("reorderOptions", { commandId, parentId: parentId ?? null, order }),

    /* Events */
    createEvent: ({ type, label = "", settings }) =>
      change("createEvent", { event: { id: newId(), type, label, ...(settings ? { settings } : {}), created: new Date().toISOString() } }),
    updateEvent: (eventId, patch, options) =>
      change("updateEvent", { eventId, patch }, { ...options, key: `event:${eventId}` }),
    deleteEvent: (eventId) => change("deleteEvent", { eventId }),
    reorderEvents: (order) => change("reorderEvents", { order }),

    /* Steps */
    newAction,
    insertAction: (flowId, action, location = {}) => change("insertAction", { flowId, action, location }),
    addStep: (flowId, type, location = {}) =>
      change("insertAction", { flowId, action: newAction(type), location }),
    updateActionInputs: (flowId, actionId, inputs, options) =>
      change("updateAction", { flowId, actionId, patch: { inputs } }, { ...options, key: `action:${flowId}:${actionId}` }),
    setActionDisabled: (flowId, actionId, disabled) =>
      change("updateAction", { flowId, actionId, patch: { disabled } }),
    moveAction: (flowId, actionId, location) => change("moveAction", { flowId, actionId, location }),
    deleteAction: (flowId, actionId) => change("deleteAction", { flowId, actionId }),
    duplicateAction: (flowId, actionId) => {
      const info = flowInfo(builderRef.current, flowId, catalogRef.current);
      const found = info && findAction(info.actions, actionId);
      if (!found) throw new OpError("That step no longer exists.");
      const copy = copyWithNewIds(found.action);
      return change("insertAction", {
        flowId,
        action: copy,
        location: { ...locationOf(info.actions, actionId), index: found.index + 1 },
      });
    },
    setBranchEnabled: (flowId, actionId, branch, enabled) =>
      change("setBranchEnabled", { flowId, actionId, branch, enabled }),
    addBranchItem: (flowId, actionId, branch, index) =>
      change("addBranchItem", { flowId, actionId, branch, item: { id: newId(), inputs: {} }, index }),
    updateBranchItem: (flowId, actionId, branch, itemId, inputs, options) =>
      change("updateBranchItem", { flowId, actionId, branch, itemId, inputs }, { ...options, key: `item:${flowId}:${itemId}` }),
    removeBranchItem: (flowId, actionId, branch, itemId) =>
      change("removeBranchItem", { flowId, actionId, branch, itemId }),
    moveBranchItem: (flowId, actionId, branch, itemId, index) =>
      change("moveBranchItem", { flowId, actionId, branch, itemId, index }),

    /* Variables */
    createVariable: (name) => change("createVariable", { variable: { id: newId(), name } }),
    renameVariable: (variableId, name) => change("renameVariable", { variableId, name }),
    deleteVariable: (variableId) => change("deleteVariable", { variableId }),

    /* Templates: content already prepared by model/templates.js. */
    importTemplate: (content) => change("importTemplate", { content }),
  };
}

/** A copy of a step with new ids everywhere, and references inside it moved along. */
function copyWithNewIds(action) {
  const ids = new Map();
  const collect = (entry) => {
    ids.set(entry.id, newId());
    for (const entries of Object.values(entry.branches ?? {}))
      for (const inner of entries ?? []) {
        if (isRepeatItem(inner)) {
          ids.set(inner.id, newId());
          inner.actions.forEach(collect);
        } else collect(inner);
      }
  };
  collect(action);

  const json = JSON.stringify(action, (key, value) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      if (value.kind === "branch" && ids.has(value.action)) return { ...value, action: ids.get(value.action) };
      if (typeof value.id === "string" && ids.has(value.id) && ("type" in value || "actions" in value))
        return { ...value, id: ids.get(value.id) };
    }
    return value;
  });
  return JSON.parse(json);
}

/**
 * @param {object} props
 * @param {string} props.projectId
 * @param {boolean} [props.readOnly] force read-only (the public view page),
 *   even for the owner
 */
export function BuilderProvider({ projectId, children, readOnly: forceReadOnly = false }) {
  const [project, setProject] = useState(null);
  const [builder, setBuilder] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [saveState, setSaveState] = useState("idle");
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const [serverAccess, setServerAccess] = useState(null);
  /* How many collaborators the API last said there are. */
  const [memberCount, setMemberCount] = useState(null);

  /* Version Control: every version (no builders), what this person may
     do with them, and the one this page is on ({ _id, name, number }, or
     null without Version Control). The ref is what sending reads, so a
     change always goes to the version it was made in. */
  const [versionInfo, setVersionInfo] = useState(UNKNOWN_VERSIONS);
  const [version, setVersion] = useState(null);
  const [versionBusy, setVersionBusy] = useState(false);
  const versionRef = useRef(null);

  const builderRef = useRef(null);
  const { catalog, loadInstalled, ensureUsed } = useProjectCatalog();
  const catalogRef = useRef(catalog);
  catalogRef.current = catalog;
  const queue = useRef([]);
  const sending = useRef(false);
  const debounced = useRef(new Map());
  const waiters = useRef([]);
  const alive = useRef(true);
  /* The revision the builder on screen was loaded at (or last saved as),
     whether someone else has saved since, and a count of our own changes
     so a reload that started before one can be thrown away. */
  const revRef = useRef(0);
  const stale = useRef(false);
  const changes = useRef(0);
  const refreshing = useRef(false);

  const user = userCache.user;
  /* The API says who we are to the project; until it has, the owner is
     still recognisable from the project itself. */
  const isOwner = serverAccess ? serverAccess.isOwner : Boolean(project && user && project.owner?.id === user.id);
  const isCollaborator = Boolean(serverAccess?.isCollaborator);
  const permissions = useMemo(
    () => (isOwner ? ALL_PERMISSIONS : isCollaborator ? serverAccess.permissions ?? [] : []),
    [isCollaborator, isOwner, serverAccess],
  );
  const access = useMemo(() => {
    const held = new Set(permissions);
    return { isOwner, isCollaborator, permissions, can: (id) => isOwner || held.has(id) };
  }, [isCollaborator, isOwner, permissions]);
  const accessRef = useRef(access);
  accessRef.current = access;

  const readOnly = forceReadOnly || (!isOwner && !isCollaborator) || Boolean(project?.suspension?.status);
  /* Nothing at all to change: the "View only" badge instead of saving. */
  const viewOnly = readOnly || (!isOwner && !permissions.some((id) => BUILDING.test(id)));

  const commit = useCallback((next) => {
    builderRef.current = next;
    setBuilder(next);
  }, []);

  /* ---- Loading ---------------------------------------------------- */

  /** Points the page at the version the API just answered with. */
  const adoptVersion = useCallback(
    (next) => {
      const label = next ? { _id: String(next._id), name: next.name, number: next.number } : null;
      versionRef.current = label?._id ?? null;
      setVersion(label);
      /* The public view page doesn't move where the editor opens. */
      if (!forceReadOnly) rememberActiveVersion(projectId, label?._id ?? null);
    },
    [forceReadOnly, projectId],
  );

  /** Reads every version again (names, numbers, counts; no builders). */
  const refreshVersions = useCallback(async () => {
    const answer = await getVersions(projectId);
    if (alive.current) setVersionInfo((current) => versionsFrom(answer, current));
    return answer;
  }, [projectId]);

  const load = useCallback(async () => {
    const installed = loadInstalled().catch(() => {});
    /* The version this page is on, else the one a link asked for, else
       the one this browser was last on. The API answers with the newest
       when that one is gone, and says which it read. */
    const wanted = forceReadOnly ? null : versionRef.current ?? versionInAddress() ?? recallActiveVersion(projectId);
    const [loadedProject, loaded] = await Promise.all([
      api.get(`/projects/${projectId}`).then(data),
      builderApi.load(projectId, { version: wanted }),
    ]);
    if (!forceReadOnly) refreshVersions().catch(() => {});
    /* Its Workshop packs first, so their steps never flash as unknown. */
    await Promise.all([installed, ensureUsed(loaded.builder).catch(() => {})]);
    if (!alive.current) return;
    setProject(loadedProject);
    if (loaded.access) setServerAccess(loaded.access);
    adoptVersion(loaded.version);
    revRef.current = loaded.rev ?? 0;
    stale.current = false;
    commit(loaded.builder);
  }, [adoptVersion, commit, ensureUsed, forceReadOnly, loadInstalled, projectId, refreshVersions]);

  /** Merges saved project fields (secrets, say) into what pages see. */
  const patchProject = useCallback((fields) => setProject((current) => (current ? { ...current, ...fields } : current)), []);

  useEffect(() => {
    alive.current = true;
    load().catch((error) => {
      if (alive.current) setLoadError(errorMessage(error, "We couldn't open this project."));
    });
    return () => {
      alive.current = false;
    };
  }, [load]);

  /* ---- Sending ---------------------------------------------------- */

  const settle = useCallback(() => {
    if (queue.current.length || debounced.current.size || sending.current) return;
    const done = waiters.current;
    waiters.current = [];
    done.forEach((resolve) => resolve());
  }, []);

  const pump = useCallback(async () => {
    if (sending.current) return;
    sending.current = true;
    setSaveState("saving");

    while (queue.current.length) {
      const { name, payload, version: target } = queue.current[0];
      try {
        const saved = await builderApi[name](projectId, payload, { version: target });
        queue.current.shift();
        /* Anything but the next revision means someone else saved in
           between; their change is on the server but not on screen. */
        if (typeof saved?.rev === "number") {
          if (saved.rev !== revRef.current + 1) stale.current = true;
          revRef.current = saved.rev;
        }
      } catch (error) {
        /* Everything after the refused change was built on top of it. */
        queue.current = [];
        for (const pending of debounced.current.values()) clearTimeout(pending.timer);
        debounced.current.clear();
        sending.current = false;
        setSaveState("error");
        toast.error("Couldn't save that change", {
          detail: errorMessage(error, "Check your connection and try again."),
        });
        try {
          await load();
        } catch {
          /* Still offline; the page keeps what it has. */
        }
        settle();
        return;
      }
    }

    sending.current = false;
    if (!alive.current) return;
    setSaveState("saved");
    setLastSavedAt(new Date());
    settle();
    if (stale.current) refreshRef.current?.();
  }, [load, projectId, settle]);

  /* ---- Other people's changes ------------------------------------- */

  const idle = () => !queue.current.length && !debounced.current.size && !sending.current;

  /** Loads the builder again if someone else changed it and we're not mid-save. */
  const refresh = useCallback(async () => {
    if (!stale.current || refreshing.current || !idle()) return;
    refreshing.current = true;
    const before = changes.current;
    try {
      const was = versionRef.current;
      const loaded = await builderApi.load(projectId, { version: was });
      /* Someone may have added a step from a pack this page hasn't loaded. */
      await ensureUsed(loaded.builder).catch(() => {});
      /* Something of ours started while this was loading: keep what's on
         screen, and try again once that has been saved. */
      if (!alive.current || changes.current !== before || !idle() || versionRef.current !== was) return;
      revRef.current = loaded.rev ?? revRef.current;
      stale.current = false;
      if (loaded.access) setServerAccess(loaded.access);
      /* The version this page was on went away somewhere else (or
         Version Control was turned on or off): the API read another one. */
      const now = loaded.version ? String(loaded.version._id) : null;
      if (now !== was) {
        adoptVersion(loaded.version);
        refreshVersions().catch(() => {});
        if (loaded.version) toast.info(`Now editing ${loaded.version.name}`, { detail: was ? "The version you were on was deleted." : "This project uses Version Control now." });
        else toast.info("This project doesn't use Version Control anymore");
      }
      commit(loaded.builder);
    } catch {
      /* Offline for a moment; the next poll tries again. */
    } finally {
      refreshing.current = false;
    }
  }, [adoptVersion, commit, ensureUsed, projectId, refreshVersions]);

  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  const collaboratorCount = memberCount ?? project?.collaborators?.length ?? 0;
  const shared = !forceReadOnly && Boolean(project) && (isCollaborator || collaboratorCount > 0);

  useEffect(() => {
    if (!shared) return undefined;
    let busy = false;

    const tick = async () => {
      if (busy || document.hidden) return;
      busy = true;
      try {
        const latest = await builderApi.rev(projectId, { version: versionRef.current });
        if (!alive.current) return;
        if (latest.access) setServerAccess((current) => (JSON.stringify(current) === JSON.stringify(latest.access) ? current : latest.access));
        if (typeof latest.collaborators === "number") setMemberCount(latest.collaborators);
        /* `found` false: this page's version (or the project's own
           builder) isn't what the project saves into anymore. */
        if (latest.rev !== revRef.current || latest.found === false) stale.current = true;
        refreshRef.current();
      } catch (error) {
        /* Taken off the project, or it was deleted, while it was open. */
        const status = error?.response?.status;
        if (alive.current && (status === 403 || status === 404))
          setLoadError(status === 404 ? "This project was deleted." : "You don't have access to this project anymore.");
      } finally {
        busy = false;
      }
    };

    const timer = setInterval(tick, POLL_MS);
    const onVisible = () => !document.hidden && tick();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [projectId, shared]);

  const enqueue = useCallback(
    (name, payload, target) => {
      queue.current.push({ name, payload, version: target });
      pump();
    },
    [pump],
  );

  /** Sends every debounced change now, in the order they started. */
  const releaseDebounced = useCallback(() => {
    const pending = [...debounced.current.values()];
    debounced.current.clear();
    for (const entry of pending) {
      clearTimeout(entry.timer);
      queue.current.push({ name: entry.name, payload: entry.payload, version: entry.version });
    }
    if (pending.length) pump();
  }, [pump]);

  const schedule = useCallback(
    (key, name, payload) => {
      const existing = debounced.current.get(key);
      if (existing) clearTimeout(existing.timer);
      const merged = existing ? mergePayload(name, existing.payload, payload) : payload;
      /* The version is fixed when the change is made. Switching version
         sends everything waiting first, so a merge never spans two. */
      const entry = { name, payload: merged, version: versionRef.current, timer: null };
      entry.timer = setTimeout(() => {
        debounced.current.delete(key);
        queue.current.push({ name, payload: entry.payload, version: entry.version });
        pump();
      }, DEBOUNCE_MS);
      /* Re-inserting keeps the map in the order changes were last made. */
      debounced.current.delete(key);
      debounced.current.set(key, entry);
      setSaveState("saving");
    },
    [pump],
  );

  const flush = useCallback(() => {
    releaseDebounced();
    if (!queue.current.length && !sending.current) return Promise.resolve();
    return new Promise((resolve) => waiters.current.push(resolve));
  }, [releaseDebounced]);

  /* Leaving with changes still on their way. */
  useEffect(() => {
    const onBeforeUnload = (event) => {
      if (!queue.current.length && !debounced.current.size && !sending.current) return;
      releaseDebounced();
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      releaseDebounced();
    };
  }, [releaseDebounced]);

  /* ---- Applying changes ------------------------------------------- */

  /**
   * Applies a change here and queues it for the API.
   * @throws {OpError} when the change isn't valid
   */
  const change = useCallback(
    (name, payload, { debounce = false, key } = {}) => {
      if (readOnly) throw new OpError("You can't change this project.");
      const refusal = opRefusal(accessRef.current, builderRef.current, name, payload);
      if (refusal) throw new OpError(refusal, 403);
      const { builder: next, result } = applyOp(builderRef.current, name, payload);
      changes.current += 1;
      commit(next);
      if (debounce) schedule(key ?? `${name}:${JSON.stringify(Object.values(payload).filter((v) => typeof v === "string"))}`, name, payload);
      else {
        releaseDebounced();
        enqueue(name, payload, versionRef.current);
      }
      return result;
    },
    [commit, enqueue, readOnly, releaseDebounced, schedule],
  );

  const actions = useMemo(() => {
    const made = builderActions(change, builderRef, catalogRef);
    return {
      ...made,
      /* A template can bring steps from packs this page hasn't loaded. */
      importTemplate: (content) => {
        const result = made.importTemplate(content);
        ensureUsed(content).catch(() => {});
        return result;
      },
    };
  }, [change, ensureUsed]);

  /* ---- Version Control -------------------------------------------- */

  const failed = useCallback((error, title) => {
    console.error(error);
    toast.error(title, { detail: errorMessage(error, "Please reload the page and try again.") });
  }, []);

  /** Puts a version's builder on screen, as GET /versions/:id or POST answered it. */
  const openVersion = useCallback(
    async (loaded) => {
      await ensureUsed(loaded.builder).catch(() => {});
      if (!alive.current) return;
      /* Anything loading for the version we're leaving is out of date. */
      changes.current += 1;
      adoptVersion(loaded);
      revRef.current = loaded.rev ?? 0;
      stale.current = false;
      commit(loaded.builder ?? { commands: [], events: [], variables: [] });
    },
    [adoptVersion, commit, ensureUsed],
  );

  /** Moves this page onto another version. */
  const switchVersion = useCallback(
    async (versionId) => {
      if (String(versionId) === String(versionRef.current ?? "")) return true;
      setVersionBusy(true);
      try {
        /* What's waiting still belongs to the version on screen. */
        await flush();
        const loaded = await getVersion(projectId, versionId);
        await openVersion(loaded);
        toast.success(`Now editing ${loaded.name}`);
        return true;
      } catch (error) {
        failed(error, "Couldn't switch version");
        return false;
      } finally {
        setVersionBusy(false);
      }
    },
    [failed, flush, openVersion, projectId],
  );

  /** Creates a version (the owner only), then opens it. */
  const createVersion = useCallback(
    async ({ name, source }) => {
      setVersionBusy(true);
      try {
        /* The new version is a copy of what's saved, so save first. */
        await flush();
        const result = await createVersionCall(projectId, { name, source });
        setVersionInfo((current) => versionsFrom(result, current));
        await openVersion(result.version);
        toast.success(`Now editing ${result.version.name}`, {
          detail: result.migrated ? "This project saves into versions from now on." : undefined,
        });
        return result.version;
      } catch (error) {
        failed(error, "Couldn't create that version");
        return null;
      } finally {
        setVersionBusy(false);
      }
    },
    [failed, flush, openVersion, projectId],
  );

  const renameVersion = useCallback(
    async (versionId, name) => {
      setVersionBusy(true);
      try {
        const result = await renameVersionCall(projectId, versionId, name);
        setVersionInfo((current) => versionsFrom(result, current));
        if (String(versionId) === String(versionRef.current)) setVersion((current) => (current ? { ...current, name } : current));
        return true;
      } catch (error) {
        failed(error, "Couldn't rename that version");
        return false;
      } finally {
        setVersionBusy(false);
      }
    },
    [failed, projectId],
  );

  const deleteVersion = useCallback(
    async (versionId) => {
      setVersionBusy(true);
      try {
        const wasActive = String(versionId) === String(versionRef.current);
        /* Only worth saving into a version that will still exist. Changes
           waiting for the one being deleted go with it. */
        if (!wasActive) await flush();
        else {
          queue.current = [];
          for (const pending of debounced.current.values()) clearTimeout(pending.timer);
          debounced.current.clear();
          if (sending.current) await flush();
        }
        const result = await deleteVersionCall(projectId, versionId);
        setVersionInfo((current) => versionsFrom(result, current));

        if (result.reverted) {
          /* That was the last one: the project is back on its own builder,
             which starts again empty. */
          versionRef.current = null;
          await load();
          toast.info("Version Control is off", { detail: "This project starts again empty." });
          return true;
        }

        if (wasActive) {
          /* Onto the newest one left, rather than a version that's gone. */
          const newest = [...(result.versions ?? [])].sort((a, b) => (b.number ?? 0) - (a.number ?? 0))[0];
          if (newest) {
            const loaded = await getVersion(projectId, newest._id);
            await openVersion(loaded);
            toast.info(`Now editing ${loaded.name}`);
          }
        }
        return true;
      } catch (error) {
        failed(error, "Couldn't delete that version");
        return false;
      } finally {
        setVersionBusy(false);
      }
    },
    [failed, flush, load, openVersion, projectId],
  );

  /**
   * Any version's builder, for exporting one that isn't open. The one on
   * screen is what's on screen, once everything waiting is saved.
   */
  const builderOf = useCallback(
    async (versionId) => {
      if (!versionId || String(versionId) === String(versionRef.current ?? "")) {
        await flush();
        return builderRef.current;
      }
      const loaded = await getVersion(projectId, versionId);
      await ensureUsed(loaded.builder).catch(() => {});
      return loaded.builder;
    },
    [ensureUsed, flush, projectId],
  );

  const versionControl = useMemo(
    () => ({
      ...versionInfo,
      /** The version on screen: { _id, name, number }, or null. */
      active: version,
      busy: versionBusy,
      refresh: refreshVersions,
      switchTo: switchVersion,
      create: createVersion,
      rename: renameVersion,
      remove: deleteVersion,
      builderOf,
    }),
    [builderOf, createVersion, deleteVersion, refreshVersions, renameVersion, switchVersion, version, versionBusy, versionInfo],
  );

  const value = useMemo(
    () => ({
      /** "project" here; "template" in the template builder (TemplateBuilderProvider). */
      mode: "project",
      projectId,
      project,
      builder,
      loading: !project || !builder,
      error: loadError,
      saveState,
      lastSavedAt,
      catalog,
      isOwner,
      isCollaborator,
      /** Every permission this person has (all of them for the owner). */
      permissions,
      /** can("commands.create"): may this person do that? */
      can: access.can,
      /** The step permissions of a command or event: { add, edit, move, toggle, delete }. */
      stepPermissions: (flowId) => {
        const group = stepGroupFor(builder, flowId);
        const may = (what) => !readOnly && access.can(`${group}.${what}`);
        return { add: may("add"), edit: may("edit"), move: may("move"), toggle: may("toggle"), delete: may("delete") };
      },
      readOnly,
      viewOnly,
      setAccess: setServerAccess,
      /** Tells the page how many collaborators there are now (starts or stops looking for changes). */
      setMemberCount,
      flush,
      /** The builder as of this moment, even before the page re-renders. */
      getBuilder: () => builderRef.current,
      reload: load,
      patchProject,
      /** Version Control: the versions, the one on screen, and every way to change them. */
      versions: versionControl,
      paths: project
        ? {
            /** Where the DisFuse mark in the top bar goes. */
            home: "/projects",
            project: `/@${project.owner?.username}/${project._id}`,
            workspace: `/@${project.owner?.username}/${project._id}/workspace`,
            edit: `/@${project.owner?.username}/${project._id}/edit`,
            collaborators: `/@${project.owner?.username}/${project._id}/workspace/collaborators`,
            versions: `/@${project.owner?.username}/${project._id}/workspace/versions`,
          }
        : null,
      ...actions,
    }),
    [access, actions, builder, catalog, flush, isCollaborator, isOwner, lastSavedAt, load, loadError, patchProject, permissions, project, projectId, readOnly, saveState, versionControl, viewOnly],
  );

  return <BuilderContext.Provider value={value}>{children}</BuilderContext.Provider>;
}

/** The open project and every way to change it. */
export function useBuilder() {
  const context = useContext(BuilderContext);
  if (!context) throw new Error("useBuilder must be used inside <BuilderProvider>");
  return context;
}

/** One command, subcommand or event, with its problems worked out. */
export function useFlow(flowId) {
  const { builder, catalog: cat } = useBuilder();
  return useMemo(() => {
    if (!builder || !flowId) return { info: null, issues: new Map() };
    const info = flowInfo(builder, flowId, cat);
    return { info, issues: info ? validateFlow(builder, flowId, cat, info) : new Map() };
  }, [builder, cat, flowId]);
}
