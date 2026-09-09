import Swal from "sweetalert2";
import * as Blockly from "blockly";

import api, { data, errorMessage } from "../api/client.js";
import {
  createVersionWorkspace,
  deleteVersionWorkspace,
  renameVersionWorkspace,
} from "../api/versions";

/**
 * The tab bar.
 *
 * `project.workspaces` is whatever the project is currently showing —
 * its own workspaces on the old system, or the active version's on a
 * Version Control project. The tabs themselves are identical either way;
 * only where an edit is sent differs, which is what `activeVersionId`
 * decides. When it is set, changes go to that version through
 * `onVersionUpdate`; when it isn't, they go to the project exactly as
 * they always have.
 */
export default function WorkspaceTabs({
  currentTab,
  onClick,
  project,
  setProject,
  workspace,
  modalColors,
  editable = true,
  activeVersionId = null,
  onVersionUpdate,
  onWorkspaceRemoved,
}) {
  /**
   * Sends one of the tab operations to the active version.
   *
   * Anything that can go wrong here — the version deleted from another
   * tab, a lapsed session — leaves the tab bar showing something that no
   * longer exists, so it is worth saying so rather than doing nothing.
   */
  function versionRequest(request) {
    return request.then(onVersionUpdate).catch(reportFailure);
  }

  /**
   * Says when a tab operation failed.
   *
   * Anything that can go wrong here — the version deleted from another
   * tab, a lapsed session — leaves the tab bar showing something that no
   * longer exists, so it is worth saying so rather than doing nothing.
   *
   * The version branches always reported failures; the legacy ones never
   * did, so a rename or a delete that the server refused simply appeared
   * not to happen.
   */
  function reportFailure(error) {
    console.error(error);

    Swal.fire({
      title: "Couldn't change that workspace",
      text: errorMessage(error, "Please reload the page and try again."),
      icon: "error",
      ...modalColors,
    });
  }

  function closeTabs(workspace) {
    document.querySelector(".workspace-tabs").style.height = "0vh";
    document.querySelector("#workspace").style.height = "92.5vh";

    document.getElementById("workspace-tabs-open-container").style.width =
      "2.5rem";

    Blockly.svgResize(workspace);

    setTimeout(() => {
      document.querySelector(
        ".workspace-navbar .workspace-tabs-open",
      ).style.opacity = "1";

      Blockly.svgResize(workspace);

      setTimeout(() => {
        Blockly.svgResize(workspace);
      }, 310);
    }, 310);
  }

  function editWorkspaceName(e, workspace, project, modalColors) {
    e.stopPropagation();

    Swal.fire({
      title: "Edit workspace name",
      text: "Change the name of this workspace",
      input: "text",
      inputValue: workspace.name,
      confirmButtonText: "Change",
      showCancelButton: true,
      ...modalColors,
    }).then((response) => {
      if (!response.isConfirmed) return;

      if (activeVersionId)
        return versionRequest(
          renameVersionWorkspace(
            project._id,
            activeVersionId,
            workspace._id,
            response.value,
          ),
        );

      api
        .patch(`/projects/${project._id}/workspaces/${workspace._id}/name`, {
          name: response.value,
        })
        .then(data)
        .then(setProject)
        .catch(reportFailure);
    });
  }

  function deleteWorkspace(e, workspace, project, modalColors) {
    e.stopPropagation();

    Swal.fire({
      title: "Delete workspace",
      text: `Are you sure you want to delete ${workspace.name}?`,
      footer: "This is not reversible!",
      confirmButtonText: "Delete",
      showCancelButton: true,
      ...modalColors,
    }).then((response) => {
      if (!response.isConfirmed) return;

      if (activeVersionId)
        return versionRequest(
          deleteVersionWorkspace(project._id, activeVersionId, workspace._id),
        );

      api
        .delete(`/projects/${project._id}/workspaces/${workspace._id}`)
        .then(data)
        .then((updated) => {
          setProject(updated);
          /* The tab that was open may have been the one just deleted;
             the page decides which to open next. */
          onWorkspaceRemoved?.(workspace._id, updated);
        })
        .catch(reportFailure);
    });
  }

  function duplicateWorkspace(e, workspace, project, modalColors) {
    e.stopPropagation();

    /* A workspace that has never been saved has no blocks to copy. It
       used to return here in silence, so the button simply appeared not
       to work. */
    if (!workspace.data || workspace.data === "")
      return void Swal.fire({
        title: "Nothing to duplicate yet",
        text: "This workspace hasn't been saved yet. Add a block to it first.",
        icon: "info",
        ...modalColors,
      });

    Swal.fire({
      title: "Duplicate workspace",
      text: "Choose a name for the duplicate workspace",
      input: "text",
      inputValue: workspace.name,
      confirmButtonText: "Duplicate",
      showCancelButton: true,
      ...modalColors,
    }).then((response) => {
      if (!response.isConfirmed) return;

      if (activeVersionId)
        return versionRequest(
          createVersionWorkspace(project._id, activeVersionId, {
            name: response.value ?? workspace.name,
            data: workspace.data,
          }),
        );

      api
        .post(`/projects/${project._id}/workspaces`, {
          name: response.value ?? workspace.name,
          data: workspace.data,
        })
        .then(data)
        .then(setProject)
        .catch(reportFailure);
    });
  }

  function newWorkspace() {
    Swal.fire({
      title: "Create New Workspace",
      input: "text",
      text: "Enter a name for your workspace",
      inputPlaceholder: "Workspace Name",
      inputValidator: (value) => {
        if (value.length >= 3) return false;
        else return "Name must be at least 3 characters";
      },
      showCancelButton: true,
      confirmButtonText: "Create",
      ...modalColors,
    }).then((result) => {
      if (!result.isConfirmed) return;

      if (activeVersionId)
        return versionRequest(
          createVersionWorkspace(project._id, activeVersionId, {
            name: result.value,
          }),
        );

      api
        .post(`/projects/${project._id}/workspaces`, { name: result.value })
        .then(data)
        .then(setProject)
        .catch(reportFailure);
    });
  }

  return (
    <div className="workspace-tabs">
      {editable ? (
        <div key={"unknown1"} onClick={() => closeTabs(workspace)}>
          <i className="fa-solid fa-xmark"></i>
        </div>
      ) : (
        ""
      )}

      {project.workspaces?.map((workspace, index) => (
        <div
          style={!editable && index === 0 ? { marginLeft: "1rem" } : undefined}
          onClick={() => onClick(index)}
          className={`tab${currentTab._id === workspace._id ? " active" : ""}`}
          key={index}
        >
          <div>{workspace.name}</div>
          {editable ? (
            <div className="buttons">
              <i
                onClick={(e) =>
                  editWorkspaceName(e, workspace, project, modalColors)
                }
                className="fa-solid fa-pen"
              />
              <i
                onClick={(e) =>
                  duplicateWorkspace(e, workspace, project, modalColors)
                }
                className="fa-solid fa-clone"
              />
              <i
                onClick={(e) =>
                  deleteWorkspace(e, workspace, project, modalColors)
                }
                className="fa-solid fa-trash"
              />
            </div>
          ) : (
            ""
          )}
        </div>
      ))}
      {editable ? (
        <div onClick={newWorkspace} key={"unknown2"} className="newTab">
          <i className="fa-solid fa-plus"></i>
        </div>
      ) : (
        ""
      )}
    </div>
  );
}
