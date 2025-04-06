import axios from "axios";
import * as Blockly from "blockly";
import { javascriptGenerator } from "blockly/javascript";
import Swal from "sweetalert2";

const { apiUrl } = require("../config/config.json");

export default function registerContextMenus(project, currentWorkspace) {
  Blockly.ContextMenuRegistry.registry.register({
    displayText: "Copy JavaScript Code",
    preconditionFn: (scope) =>
      `${scope.block.disabled ? "disabled" : "enabled"}`,
    scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK,
    id: "copyCode",
    callback: (scope) => {
      navigator.clipboard.writeText(
        javascriptGenerator.blockToCode(scope.block)
      );

      Swal.fire({
        toast: true,
        title: "JavaScript Code Copied!",
        icon: "success",
        showConfirmButton: false,
        position: "top-right",
        timer: 2500,
        timerProgressBar: true,
      });
    }
  });

  const wsOptions = {};
  project.workspaces
    .filter((ws) => ws._id !== currentWorkspace._id)
    .forEach((ws) => {
      wsOptions[ws._id] = ws.name;
    });

  Blockly.ContextMenuRegistry.registry.register({
    displayText: "Move to workspace",
    preconditionFn: () => Object.keys(wsOptions).length ? "enabled" : "disabled",
    scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK,
    id: "moveBlock",
    callback: (scope) => {
      if (!Object.keys(wsOptions).length) return

      Swal.fire({
        title: "Move block",
        text: `Which workspace do you want to move "${scope.block.type}" to?`,
        input: "select",
        inputOptions: wsOptions,
        showCancelButton: true,
        confirmButtonText: "Move",
      }).then((response) => {
        if (!response.isConfirmed) return;

        const newData = JSON.parse(
          project.workspaces.find((ws) => ws._id === response.value).data
        );

        if (newData.blocks) {
          newData.blocks.blocks.push(
            Blockly.serialization.blocks.save(scope.block)
          );
        } else {
          newData.blocks = {
            blocks: [Blockly.serialization.blocks.save(scope.block)],
          };
        }

        axios
          .patch(
            apiUrl +
            `/projects/${project._id}/workspaces/${response.value}/data`,
            { data: JSON.stringify(newData) },
            {
              headers: { Authorization: localStorage.getItem("disfuse-token") },
            }
          )
          .then(() =>
            Swal.fire({
              toast: true,
              title: `Block moved to ${project.workspaces.find((ws) => ws._id === response.value).name
                }`,
              icon: "success",
              timer: 5000,
              timerProgressBar: true,
              showConfirmButton: false,
              position: "top-right",
            })
          );

        scope.block.dispose();
      });
    },
  });

  Blockly.ContextMenuRegistry.registry.register({
    id: "mergeWorkspace",
    displayText: "Merge Workspace",
    scopeType: Blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
    preconditionFn: (scope) =>
      (scope.workspace.getAllBlocks(false).length && Object.keys(wsOptions).length) ? "enabled" : "disabled",
    callback: (scope) => {
      if (!Object.keys(wsOptions).length) return

      Swal.fire({
        title: "Merge Workspace",
        text: `Which workspace do you want to merge with?`,
        input: "select",
        footer:
          "The selected workspace will have the blocks of the current workspace and its own blocks",
        inputOptions: wsOptions,
        showCancelButton: true,
        confirmButtonText: "Merge",
      }).then((response) => {
        if (!response.isConfirmed) return;

        let newData = JSON.parse(
          project.workspaces.find((ws) => ws._id === response.value).data
        );

        if (newData.blocks) {
          newData.blocks.blocks.push(
            ...Blockly.serialization.workspaces.save(scope.workspace).blocks
              .blocks
          );
        } else {
          newData = Blockly.serialization.workspaces.save(scope.workspace);
        }

        axios.patch(
          apiUrl + `/projects/${project._id}/workspaces/${response.value}/data`,
          { data: JSON.stringify(newData) },
          { headers: { Authorization: localStorage.getItem("disfuse-token") } }
        );
      });
    },
  });
}
