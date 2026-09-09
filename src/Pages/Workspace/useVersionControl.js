import { useCallback, useRef, useState } from "react";
import Swal from "sweetalert2";

import {
  createVersion,
  deleteVersion,
  getVersion,
  getVersions,
  rememberActiveVersion,
  renameVersion,
  resolveActiveVersion,
} from "../../api/versions.js";

/* =====================================================================
   Version Control, from the editor's side
   ---------------------------------------------------------------------
   A project either saves through `project.workspaces` (the old system,
   and what every project starts on) or through one version inside
   `project.versions`. Which one is decided once, on load, by whether the
   project has any versions at all.

   `activeVersion` is the version being edited. It is a frontend idea
   only — nothing on the project records it, because two people can be
   editing two different versions of the same project at once — and it is
   a ref as well as state because autosave reads it at the moment of
   sending, where a stale closure would mean saving one version's blocks
   into another.
   ===================================================================== */

export default function useVersionControl({
  projectId,
  activeVersion,
  flushAutosave,
  openWorkspace,
  setProject,
  setSearchParams,
  modalColors,
}) {
  const [versions, setVersions] = useState([]);
  const [activeVersionId, setActiveVersionId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState({
    canManage: false,
    premium: false,
    maxVersions: 25,
  });

  /* The same list, for the parts of the editor that run outside React
     and can't read state. */
  const versionsRef = useRef([]);

  const applyVersions = useCallback((list) => {
    versionsRef.current = list || [];
    setVersions(list || []);
  }, []);

  const showError = useCallback(
    (error, title) => {
      console.error(error);

      Swal.fire({
        ...modalColors,
        title,
        icon: "error",
        text:
          error?.response?.data?.error ||
          "Something went wrong. Please reload the page and try again.",
      });
    },
    [modalColors],
  );

  /** Points the page at a version that has just been loaded or created. */
  const adopt = useCallback(
    (version) => {
      activeVersion.current = version;

      setProject((current) => ({
        ...current,
        workspaces: version.workspaces || [],
      }));

      setActiveVersionId(String(version._id));
      rememberActiveVersion(projectId, version._id);

      setSearchParams(
        (params) => {
          params.set("v", String(version._id));
          return params;
        },
        { replace: true },
      );

      return version.workspaces || [];
    },
    [projectId, setProject, setSearchParams],
  );

  /**
   * Decides which system this project is on and opens the right version.
   *
   * @returns {Promise<object|null>} the version being edited, or null for
   *   a project still on the old system
   */
  const initialise = useCallback(
    async (project, { requestedVersionId, remembered, canManage }) => {
      const summaries = project.versions || [];

      applyVersions(summaries);
      setState({ canManage, premium: false, maxVersions: 25 });

      /* Who may create and rename versions, from the API that enforces
         it. Asked for after the editor is up, so a slow or failed answer
         never delays opening a project — the panel simply offers less
         until it arrives, and the API refuses anything it shouldn't
         allow regardless of what the panel offers. */
      getVersions(projectId)
        .then((answer) => {
          applyVersions(answer.versions || []);
          setState({
            canManage: Boolean(answer.canManage),
            premium: Boolean(answer.premium),
            maxVersions: answer.maxVersions ?? 25,
          });
        })
        .catch((error) =>
          console.warn("Could not read this project's version state:", error),
        );

      if (!summaries.length) return null;

      const opening = resolveActiveVersion(
        summaries,
        requestedVersionId,
        remembered,
      );

      const loaded = await getVersion(projectId, opening._id);

      adopt(loaded);

      return loaded;
    },
    [adopt, applyVersions, projectId],
  );

  /** Points the editor at another version. */
  const switchTo = useCallback(
    async (versionId) => {
      if (String(versionId) === String(activeVersion.current?._id ?? "")) return;

      setBusy(true);

      try {
        /* Order matters: the pending edits still belong to the version
           on screen, so they go first. */
        await flushAutosave();

        const workspaces = adopt(await getVersion(projectId, versionId));

        await openWorkspace(workspaces);
      } catch (error) {
        showError(error, "Couldn't switch version");
      } finally {
        setBusy(false);
      }
    },
    [adopt, flushAutosave, openWorkspace, projectId, showError],
  );

  /** Creates a version, then opens it. */
  const create = useCallback(
    async ({ name, source }) => {
      setBusy(true);

      try {
        /* The first version is a copy of the project as it is now, so
           what is on screen has to be saved before it is copied. */
        await flushAutosave();

        const result = await createVersion(projectId, { name, source });

        applyVersions(result.versions || []);
        setState((current) => ({
          ...current,
          canManage: result.canManage,
          premium: result.premium,
          maxVersions: result.maxVersions ?? current.maxVersions,
        }));

        const workspaces = adopt(result.version);
        await openWorkspace(workspaces);

        Swal.fire({
          toast: true,
          position: "top-right",
          timer: 5000,
          timerProgressBar: true,
          icon: "success",
          title: `Now editing ${result.version.name}`,
          showConfirmButton: false,
          ...modalColors,
        });
      } catch (error) {
        showError(error, "Couldn't create that version");
      } finally {
        setBusy(false);
      }
    },
    [
      adopt,
      applyVersions,
      flushAutosave,
      modalColors,
      openWorkspace,
      projectId,
      showError,
    ],
  );

  const rename = useCallback(
    async (versionId, name) => {
      setBusy(true);

      try {
        const result = await renameVersion(projectId, versionId, name);

        applyVersions(result.versions || []);

        if (String(versionId) === String(activeVersion.current?._id))
          activeVersion.current = { ...activeVersion.current, name };
      } catch (error) {
        showError(error, "Couldn't rename that version");
      } finally {
        setBusy(false);
      }
    },
    [applyVersions, projectId, showError],
  );

  const remove = useCallback(
    async (versionId) => {
      setBusy(true);

      try {
        const wasActive =
          String(versionId) === String(activeVersion.current?._id);

        /* Only worth saving if the editor is on a version that will
           still exist afterwards. */
        if (!wasActive) await flushAutosave();

        const result = await deleteVersion(projectId, versionId);

        applyVersions(result.versions || []);

        /* That was the last one: the project is back on the old system
           with nothing in it, and a reload is the honest way to show
           that. */
        if (result.reverted) {
          activeVersion.current = null;
          rememberActiveVersion(projectId, null);

          setSearchParams(
            (params) => {
              params.delete("v");
              return params;
            },
            { replace: true },
          );

          window.location.reload();
          return;
        }

        if (!wasActive) return;

        /* The version being edited went away, so move to a valid one
           rather than leaving the editor pointing at something that no
           longer exists. */
        const next = resolveActiveVersion(result.versions);
        const workspaces = adopt(await getVersion(projectId, next._id));

        await openWorkspace(workspaces);
      } catch (error) {
        showError(error, "Couldn't delete that version");
      } finally {
        setBusy(false);
      }
    },
    [
      adopt,
      applyVersions,
      flushAutosave,
      openWorkspace,
      projectId,
      setSearchParams,
      showError,
    ],
  );

  /**
   * Applies whatever a version-workspace route answered with — the tab
   * bar adding, renaming or deleting a workspace inside the active
   * version.
   */
  const applyVersionResult = useCallback(
    (result) => {
      if (result?.versions) applyVersions(result.versions);

      const updated = result?.version;

      if (
        !updated ||
        String(updated._id) !== String(activeVersion.current?._id ?? "")
      )
        return;

      activeVersion.current = updated;

      const workspaces = updated.workspaces || [];
      setProject((current) => ({ ...current, workspaces }));

      openWorkspace(workspaces, { keepCurrent: true });
    },
    [applyVersions, openWorkspace, setProject],
  );

  return {
    versions,
    versionsRef,
    activeVersion,
    activeVersionId,
    busy,
    state,
    initialise,
    actions: { switchTo, create, rename, remove, applyVersionResult },
  };
}
