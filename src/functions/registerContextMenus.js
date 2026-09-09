import * as Blockly from "blockly";
import { javascriptGenerator } from "blockly/javascript";
import Swal from "sweetalert2";
import modalThemeColor from "./modalThemeColor";
import { userCache } from "../cache.ts";
import api from "../api/client.js";
import { saveVersionWorkspaceData } from "../api/versions";

/**
 * A workspace's saved blocks, whatever state it is in.
 *
 * A workspace that has never been saved holds `""`, and `JSON.parse("")`
 * throws — which is what happened when anyone tried to merge into a tab
 * they had just created.
 */
function parseWorkspaceData(workspace) {
  if (!workspace?.data?.length) return { blocks: { blocks: [] } };

  try {
    const parsed = JSON.parse(workspace.data);
    if (!parsed.blocks?.blocks) parsed.blocks = { blocks: [] };
    return parsed;
  } catch (error) {
    console.error(`Could not read workspace "${workspace.name}":`, error);
    return { blocks: { blocks: [] } };
  }
}

/** Reports a failed context-menu action instead of losing it silently. */
function reportFailure(error, title) {
  console.error(error);

  Swal.fire({
    ...modalThemeColor(userCache.user),
    title,
    icon: "error",
    text:
      error?.response?.data?.error ||
      "Please reload the page and try again.",
  });
}

/**
 * The workspace and block context menus.
 *
 * "Move to workspace" and "Merge workspace" write into another workspace
 * of the same project. On a Version Control project that means another
 * workspace of the *active version*, which is what `versionId` selects —
 * without it the write would go to the project's own workspaces, which a
 * versioned project no longer reads.
 */
export default function registerContextMenus(
  project,
  currentWorkspace,
  versionId = null,
) {
  /** Writes blocks into a sibling workspace, wherever this project saves. */
  function saveWorkspaceData(workspaceId, data) {
    if (versionId)
      return saveVersionWorkspaceData(project._id, versionId, workspaceId, data);

    return api.patch(
      `/projects/${project._id}/workspaces/${workspaceId}/data`,
      { data },
    );
  }

  Blockly.ContextMenuRegistry.registry.register({
    displayText: "Copy JavaScript Code",
    preconditionFn: (scope) =>
      `${scope.block.disabled ? "disabled" : "enabled"}`,
    scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK,
    id: "copyCode",
    callback: (scope) => {
      navigator.clipboard.writeText(
        javascriptGenerator.blockToCode(scope.block),
      );

      Swal.fire({
        toast: true,
        title: "JavaScript Code Copied!",
        icon: "success",
        showConfirmButton: false,
        position: "top-right",
        timer: 2500,
        timerProgressBar: true,
        ...modalThemeColor(userCache.user),
      });
    },
  });

  const wsOptions = {};
  project.workspaces
    .filter((ws) => ws._id !== currentWorkspace._id)
    .forEach((ws) => {
      wsOptions[ws._id] = ws.name;
    });

  Blockly.ContextMenuRegistry.registry.register({
    displayText: "Move to workspace",
    preconditionFn: () =>
      Object.keys(wsOptions).length ? "enabled" : "disabled",
    scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK,
    id: "moveBlock",
    callback: (scope) => {
      if (!Object.keys(wsOptions).length) return;

      Swal.fire({
        title: "Move block",
        text: `Which workspace do you want to move "${scope.block.type}" to?`,
        input: "select",
        inputOptions: wsOptions,
        showCancelButton: true,
        confirmButtonText: "Move",
      }).then((response) => {
        if (!response.isConfirmed) return;

        const toWorkspace = project.workspaces.find(
          (ws) => ws._id === response.value,
        );
        const newData = parseWorkspaceData(toWorkspace);

        newData.blocks.blocks.push(
          Blockly.serialization.blocks.save(scope.block),
        );

        saveWorkspaceData(response.value, JSON.stringify(newData))
          .then(() => {
            /* The block is removed from *this* workspace only once the
               other one has it. It used to be disposed of immediately,
               outside the promise — so a move that the server refused
               deleted the block and wrote it nowhere. */
            scope.block.dispose();

            Swal.fire({
              toast: true,
              title: `Block moved to ${toWorkspace.name}`,
              icon: "success",
              timer: 5000,
              timerProgressBar: true,
              showConfirmButton: false,
              position: "top-right",
              ...modalThemeColor(userCache.user),
            });
          })
          .catch((error) => reportFailure(error, "Couldn't move that block"));
      });
    },
  });

  Blockly.ContextMenuRegistry.registry.register({
    id: "mergeWorkspace",
    displayText: "Merge Workspace",
    scopeType: Blockly.ContextMenuRegistry.ScopeType.WORKSPACE,
    preconditionFn: (scope) =>
      scope.workspace.getAllBlocks(false).length &&
      Object.keys(wsOptions).length
        ? "enabled"
        : "disabled",
    callback: (scope) => {
      if (!Object.keys(wsOptions).length) return;

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

        const target = project.workspaces.find(
          (ws) => ws._id === response.value,
        );
        const newData = parseWorkspaceData(target);

        newData.blocks.blocks.push(
          ...(Blockly.serialization.workspaces.save(scope.workspace).blocks
            ?.blocks ?? []),
        );

        saveWorkspaceData(response.value, JSON.stringify(newData))
          .then(() =>
            Swal.fire({
              toast: true,
              title: `Merged into ${target.name}`,
              icon: "success",
              timer: 5000,
              timerProgressBar: true,
              showConfirmButton: false,
              position: "top-right",
              ...modalThemeColor(userCache.user),
            }),
          )
          .catch((error) =>
            reportFailure(error, "Couldn't merge those workspaces"),
          );
      });
    },
  });
}
