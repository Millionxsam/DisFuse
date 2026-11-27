/* =====================================================================
   DisFuse Builder: the API calls
   ---------------------------------------------------------------------
   One function per route in Routes/builderRouter.js (see the table in
   ../README.md). Every change is a plain REST call; the API applies the
   same operation from model/ops.js to the saved copy and answers
   { result, rev }.

   These go through the shared client (src/api/client.js), which adds the
   sign-in token and never retries a write on its own.

   On a project with Version Control, every builder call takes
   `{ version }` as its last argument: the version the page is on. The
   API reads from that version and saves into it, and refuses a write
   without one (see "Version Control" in Routes/builderRouter.js). The
   versions themselves are made, renamed and deleted through
   src/api/versions.js, the same routes the block editor uses.
   ===================================================================== */

import api, { data } from "../../api/client.js";

const base = (projectId) => `/projects/${projectId}/builder`;
/** `?version=<id>` when the page is on a version, nothing otherwise. */
const at = (target) => (target?.version ? { params: { version: target.version } } : undefined);
const flow = (projectId, flowId, actionId) =>
  `${base(projectId)}/flows/${flowId}/actions${actionId ? `/${actionId}` : ""}`;

export const builderApi = {
  /** { builder, rev, access, version }: `version` is the one that was read, or null. */
  load: (projectId, target) => api.get(base(projectId), at(target)).then(data),
  /** { rev, versioned, found, access, collaborators }: polled to notice other people's changes. */
  rev: (projectId, target) => api.get(`${base(projectId)}/rev`, at(target)).then(data),

  /* Collaborators (Routes/builderCollaboratorRouter.js in the API). Each
     answers the whole list again, as GET does. */
  collaborators: (projectId) => api.get(`${base(projectId)}/collaborators`).then(data),
  inviteCollaborator: (projectId, { userId, permissions }) =>
    api.post(`${base(projectId)}/collaborators`, { userId, permissions }).then(data),
  updateCollaborator: (projectId, { userId, permissions }) =>
    api.patch(`${base(projectId)}/collaborators/${userId}`, { permissions }).then(data),
  removeCollaborator: (projectId, { userId }) =>
    api.delete(`${base(projectId)}/collaborators/${userId}`).then(data),

  createCommand: (projectId, { command }, target) =>
    api.post(`${base(projectId)}/commands`, { command }, at(target)).then(data),
  updateCommand: (projectId, { commandId, patch }, target) =>
    api.patch(`${base(projectId)}/commands/${commandId}`, { patch }, at(target)).then(data),
  deleteCommand: (projectId, { commandId }, target) =>
    api.delete(`${base(projectId)}/commands/${commandId}`, at(target)).then(data),

  createOption: (projectId, { commandId, parentId, option }, target) =>
    api.post(`${base(projectId)}/commands/${commandId}/options`, { parentId, option }, at(target)).then(data),
  updateOption: (projectId, { commandId, optionId, patch }, target) =>
    api.patch(`${base(projectId)}/commands/${commandId}/options/${optionId}`, { patch }, at(target)).then(data),
  deleteOption: (projectId, { commandId, optionId }, target) =>
    api.delete(`${base(projectId)}/commands/${commandId}/options/${optionId}`, at(target)).then(data),
  reorderOptions: (projectId, { commandId, parentId, order }, target) =>
    api.put(`${base(projectId)}/commands/${commandId}/options-order`, { parentId, order }, at(target)).then(data),

  createEvent: (projectId, { event }, target) =>
    api.post(`${base(projectId)}/events`, { event }, at(target)).then(data),
  updateEvent: (projectId, { eventId, patch }, target) =>
    api.patch(`${base(projectId)}/events/${eventId}`, { patch }, at(target)).then(data),
  deleteEvent: (projectId, { eventId }, target) =>
    api.delete(`${base(projectId)}/events/${eventId}`, at(target)).then(data),
  reorderEvents: (projectId, { order }, target) =>
    api.put(`${base(projectId)}/events-order`, { order }, at(target)).then(data),

  insertAction: (projectId, { flowId, action, location }, target) =>
    api.post(flow(projectId, flowId), { action, location }, at(target)).then(data),
  updateAction: (projectId, { flowId, actionId, patch }, target) =>
    api.patch(flow(projectId, flowId, actionId), { patch }, at(target)).then(data),
  moveAction: (projectId, { flowId, actionId, location }, target) =>
    api.put(`${flow(projectId, flowId, actionId)}/position`, { location }, at(target)).then(data),
  deleteAction: (projectId, { flowId, actionId }, target) =>
    api.delete(flow(projectId, flowId, actionId), at(target)).then(data),

  setBranchEnabled: (projectId, { flowId, actionId, branch, enabled }, target) =>
    api.put(`${flow(projectId, flowId, actionId)}/branches/${branch}`, { enabled }, at(target)).then(data),
  addBranchItem: (projectId, { flowId, actionId, branch, item, index }, target) =>
    api.post(`${flow(projectId, flowId, actionId)}/branches/${branch}/items`, { item, index }, at(target)).then(data),
  updateBranchItem: (projectId, { flowId, actionId, branch, itemId, inputs }, target) =>
    api.patch(`${flow(projectId, flowId, actionId)}/branches/${branch}/items/${itemId}`, { inputs }, at(target)).then(data),
  moveBranchItem: (projectId, { flowId, actionId, branch, itemId, index }, target) =>
    api.put(`${flow(projectId, flowId, actionId)}/branches/${branch}/items/${itemId}/position`, { index }, at(target)).then(data),
  removeBranchItem: (projectId, { flowId, actionId, branch, itemId }, target) =>
    api.delete(`${flow(projectId, flowId, actionId)}/branches/${branch}/items/${itemId}`, at(target)).then(data),

  createVariable: (projectId, { variable }, target) =>
    api.post(`${base(projectId)}/variables`, { variable }, at(target)).then(data),
  renameVariable: (projectId, { variableId, name }, target) =>
    api.patch(`${base(projectId)}/variables/${variableId}`, { name }, at(target)).then(data),
  deleteVariable: (projectId, { variableId }, target) =>
    api.delete(`${base(projectId)}/variables/${variableId}`, at(target)).then(data),

  /** Adds a template's commands, events and variables in one change. */
  importTemplate: (projectId, { content }, target) =>
    api.post(`${base(projectId)}/import`, { content }, at(target)).then(data),
};
