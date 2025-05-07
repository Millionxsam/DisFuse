import axios from "axios";
import Swal from "sweetalert2";
import * as Blockly from "blockly";

const { apiUrl } = require("../config/config.js");

export default function WorkspaceTabs({
  currentTab,
  onClick,
  project,
  workspace,
  modalColors,
  editable = true,
}) {
  function closeTabs(workspace) {
    document.querySelector(".workspace-tabs").style.height = "0vh";
    document.querySelector("#workspace").style.height = "92.5vh";

    document.getElementById("workspace-tabs-open-container").style.width =
      "1.8rem";

    Blockly.svgResize(workspace);

    setTimeout(() => {
      document.querySelector(
        ".workspace-navbar .workspace-tabs-open"
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

      axios
        .patch(
          apiUrl + `/projects/${project._id}/workspaces/${workspace._id}/name`,
          {
            name: response.value,
          },
          {
            headers: {
              Authorization: localStorage.getItem("disfuse-token"),
            },
          }
        )
        .then(() => window.location.reload());
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

      axios
        .delete(
          apiUrl + `/projects/${project._id}/workspaces/${workspace._id}`,
          {
            headers: {
              Authorization: localStorage.getItem("disfuse-token"),
            },
          }
        )
        .then(() => window.location.reload());
    });
  }

  function duplicateWorkspace(e, workspace, project, modalColors) {
    e.stopPropagation();

    if (!workspace.data || workspace.data === "") return;

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

      axios
        .post(
          apiUrl + `/projects/${project._id}/workspaces`,
          {
            name: response.value ?? workspace.name,
            data: workspace.data,
          },
          {
            headers: {
              Authorization: localStorage.getItem("disfuse-token"),
            },
          }
        )
        .then(() => window.location.reload());
    });
  }

  return (
    <div className="workspace-tabs">
      {editable ? (
        <div
          key={"unknown1"}
          onClick={() => closeTabs(workspace)}
          style={{ height: "2rem", width: "2rem" }}
        >
          <i className="fa-solid fa-xmark"></i>
        </div>
      ) : (
        ""
      )}

      {project.workspaces?.map((workspace, index) => (
        <div
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
                  deleteWorkspace(e, workspace, project, modalColors)
                }
                className="fa-solid fa-trash"
              />
              <i
                onClick={(e) =>
                  duplicateWorkspace(e, workspace, project, modalColors)
                }
                className="fa-solid fa-clone"
              />
            </div>
          ) : (
            ""
          )}
        </div>
      ))}
      {editable ? (
        <div key={"unknown2"} className="newTab">
          <i className="fa-solid fa-plus"></i>
        </div>
      ) : (
        ""
      )}
    </div>
  );
}
