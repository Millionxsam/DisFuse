import { sep } from "./helpers.js";
import {
  blockBuddyCategory,
  search,
  workshopCategory,
} from "./dynamic.js";

import apps from "./categories/apps.js";
import colour from "./categories/colour.js";
import comments from "./categories/comments.js";
import components from "./categories/components.js";
import cooldowns from "./categories/cooldowns.js";
import dashboard from "./categories/dashboard.js";
import databases from "./categories/databases.js";
import events from "./categories/events.js";
import files from "./categories/files.js";
import functions from "./categories/functions.js";
import interactions from "./categories/interactions.js";
import javascript from "./categories/javascript.js";
import lists from "./categories/lists.js";
import logic from "./categories/logic.js";
import loops from "./categories/loops.js";
import main from "./categories/main.js";
import math from "./categories/math.js";
import messages from "./categories/messages.js";
import music from "./categories/music.js";
import objects from "./categories/objects.js";
import servers from "./categories/servers.js";
import text from "./categories/text.js";
import time from "./categories/time.js";
import variables from "./categories/variables.js";

/* =====================================================================
   The toolbox
   ---------------------------------------------------------------------
   The categories down the left of the editor, in the order they appear.

   This file is the order and nothing else. Each category lives in its
   own file under categories/, so changing what is in "Servers" means
   opening categories/servers.js — not scrolling to line 1,761 of a
   3,638-line file, which is where it used to be.

   Adding a category is two lines: an import, and a line in the list
   below. The `sep()` calls are the gaps between the four groups —
   language basics, Discord, storage and integrations, everything else.
   ===================================================================== */

/**
 * @param {Array}  [blockPacks] the Workshop packs this user has installed
 * @param {object} [user]       for their BlockBuddy blocks
 */
export default function getToolbox(blockPacks = [], user) {
  return {
    kind: "categoryToolbox",
    contents: [
      search,
      sep(),
      logic,
      loops,
      text,
      math,
      lists,
      objects,
      time,
      colour,
      sep(),
      variables,
      functions,
      javascript,
      sep(),
      main,
      components,
      messages,
      servers,
      interactions,
      events,
      cooldowns,
      sep(),
      databases,
      dashboard,
      apps,
      sep(),
      comments,
      music,
      files,
      sep(),
      workshopCategory(blockPacks),
      blockBuddyCategory(user),
    ],
  };
}
