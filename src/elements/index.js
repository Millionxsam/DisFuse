/* =====================================================================
   Every element, and which block is which
   ---------------------------------------------------------------------
   Gathers the modules under ./modules. Each one default-exports

     { events, actions, values, components, blocks, contexts }

   made with the create* functions in ./define.js (`blocks` are the
   blocks with no builder element). The builder's catalog
   (builder/catalog/index.js) reads the elements from here, and the block
   editor registers every block from here (blocks/index.js).

   `blockOf(type)` answers "what is this block in the builder?", which is
   what converting between the two editors runs on:

     { element, role: "main" | "variant", spec }   the element's own block
     { element, role: "value", spec, value }        reads a value the element
                                                    provides; value.where says
                                                    which part provides it
     { element, role: "item", spec, group }         one item of a group input
     { element: null, role: "block", spec }         a block with no element
   ===================================================================== */

import apps from "./modules/apps.js";
import botBasics from "./modules/bot_basics.js";
import canvas from "./modules/canvas.js";
import channels from "./modules/channels.js";
import codeFilesMusic from "./modules/code_files_music.js";
import components from "./modules/components.js";
import dataDashboard from "./modules/data_dashboard.js";
import eventsMessagesMisc from "./modules/events_messages_misc.js";
import eventsServersMembers from "./modules/events_servers_members.js";
import forms from "./modules/forms.js";
import github from "./modules/github.js";
import interactions from "./modules/interactions.js";
import invites from "./modules/invites.js";
import legacy from "./modules/legacy.js";
import listsObjectsVariables from "./modules/lists_objects_variables.js";
import logicLoops from "./modules/logic_loops.js";
import mathTime from "./modules/math_time.js";
import members from "./modules/members.js";
import messages from "./modules/messages.js";
import rolesEmojisStickers from "./modules/roles_emojis_stickers.js";
import serversWebhooks from "./modules/servers_webhooks.js";
import textColours from "./modules/text_colours.js";
import threads from "./modules/threads.js";
import wsClients from "./modules/ws_clients.js";
import wsServerSio from "./modules/ws_server_sio.js";
import wsServerWs from "./modules/ws_server_ws.js";
import kick from "./modules/social/kick.js";
import roblox_minecraft from "./modules/social/roblox_minecraft.js";
import bluesky from "./modules/social/bluesky.js";
import tiktok from "./modules/social/tiktok.js";
import instagram from "./modules/social/instagram.js";
import x from "./modules/social/x.js";
import reddit from "./modules/social/reddit.js";
import youtube from "./modules/social/youtube.js";
import twitch from "./modules/social/twitch.js";

export const MODULES = {
  bot_basics: botBasics,
  logic_loops: logicLoops,
  text_colours: textColours,
  math_time: mathTime,
  lists_objects_variables: listsObjectsVariables,
  code_files_music: codeFilesMusic,
  data_dashboard: dataDashboard,
  events_servers_members: eventsServersMembers,
  events_messages_misc: eventsMessagesMisc,
  messages,
  threads,
  components,
  interactions,
  forms,
  servers_webhooks: serversWebhooks,
  channels,
  members,
  roles_emojis_stickers: rolesEmojisStickers,
  invites,
  apps,
  github,
  kick,
  roblox_minecraft,
  bluesky,
  tiktok,
  instagram,
  x,
  reddit,
  youtube,
  twitch,
  canvas,
  ws_clients: wsClients,
  ws_server_ws: wsServerWs,
  ws_server_sio: wsServerSio,
  legacy,
};

/** Every element and block-only block, module by module. */
export const ELEMENTS = Object.values(MODULES).flatMap((mod) => [
  ...(mod.events ?? []),
  ...(mod.actions ?? []),
  ...(mod.values ?? []),
  ...(mod.components ?? []),
  ...(mod.blocks ?? []),
]);

const byBlock = new Map();
for (const element of ELEMENTS) {
  for (const spec of element.blockly ?? []) {
    if (byBlock.has(spec.type)) throw new Error(`[elements] block "${spec.type}" is defined twice`);
    const builder = element.builder === false ? null : element;
    const target = !builder && element.element ? { pointer: element.element } : null;
    byBlock.set(spec.type, {
      element: builder,
      role: builder || target ? spec.role : "block",
      spec,
      ...(spec.value ? { value: spec.value } : {}),
      ...(spec.group ? { group: spec.group } : {}),
      ...(target ?? {}),
    });
  }
  /* Blockly's own blocks an element converts from and to. Several
     elements can share one; their `fields` tell them apart. */
  if (element.builder !== false)
    for (const spec of element.builtins ?? []) {
      const entry = {
        element,
        role: spec.type === element.block ? "main" : "variant",
        spec,
        ...(spec.fields ? { fields: spec.fields } : {}),
      };
      const found = byBlock.get(spec.type);
      if (!found) byBlock.set(spec.type, { ...entry, choices: [entry] });
      else if (found.choices) found.choices.push(entry);
    }
}

/**
 * What a block type is in the builder (see the top of this file), or
 * null. `field(name)` reads the block's fields, to pick between elements
 * that share one of Blockly's own blocks.
 */
export function blockOf(type, field) {
  const found = byBlock.get(type);
  if (!found?.choices || found.choices.length < 2 || !field) return found ?? null;
  const match = found.choices.find((choice) =>
    Object.entries(choice.fields ?? {}).every(
      ([name, value]) => String(field(name)) === String(value),
    ),
  );
  return match ?? found.choices.find((choice) => !choice.fields) ?? found.choices[0];
}

/** Every block type that converts to or from an element (its own, its values', its items'). */
const byElement = new Map();
for (const [type, info] of byBlock) {
  const ids = new Set([info.element?.id ?? info.pointer, ...(info.spec.also ?? [])]);
  for (const choice of info.choices ?? []) ids.add(choice.element.id);
  for (const id of ids) if (id) byElement.set(id, [...(byElement.get(id) ?? []), type]);
}

export function blocksOfElement(id) {
  return byElement.get(id) ?? [];
}

/** Every block made from an element, by type. */
export const BLOCK_TYPES = [...byBlock.keys()];
