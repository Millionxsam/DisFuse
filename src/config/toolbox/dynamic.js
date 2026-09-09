import { block, label } from "./helpers.js";

/* =====================================================================
   Categories that depend on who is looking
   ---------------------------------------------------------------------
   Everything else in the toolbox is the same for everybody, so it is a
   plain object in categories/. These three are not: the search box is
   provided by a plugin, and the last two are built from the block packs
   this user has installed and the custom blocks they have made.

   They are the only reason getToolbox() takes arguments at all.
   ===================================================================== */

/**
 * The search box at the top of the toolbox.
 *
 * A toolbox item kind contributed by `@blockly/toolbox-search`. A page
 * that injects Blockly without importing that plugin will render nothing
 * here rather than failing, which is what the preview pages used to do.
 */
export const search = { kind: "search", name: "Search" };

/** The user's installed Workshop packs, one sub-category each. */
export function workshopCategory(blockPacks = []) {
  return {
    kind: "category",
    name: "Workshop",
    colour: "#014f98",
    contents: [
      label(
        `You have ${blockPacks.length} installed block pack${
          blockPacks.length === 0
            ? "s. Go to the workshop page to discover and install new block packs."
            : blockPacks.length === 1
              ? ":"
              : "s:"
        }`
      ),
      ...blockPacks.map(pack =>
        label(
          `- ${pack.name} v${pack.versions[pack.versions.length - 1]?.version || "0.0.0"}`
        )
      ),
      ...blockPacks.map(pack => ({
        kind: "category",
        name: pack.name,
        colour: pack.color || "#014f98",
        contents: pack.versions[pack.versions.length - 1]?.blocks?.length
          ? pack.versions[pack.versions.length - 1]?.blocks?.map(b => block(b.name))
          : []
      }))
    ]
  };
}

/** Blocks this user built with BlockBuddy. */
export function blockBuddyCategory(user) {
  return {
    kind: "category",
    name: "BlockBuddy",
    colour: "#014f98",
    contents: [
      label("Click BlockBuddy > Create to make new custom blocks"),
      ...(user?.customBlocks || []).map(b => block(b.definition.type))
    ]
  };
}
