export const restrictions = {};

export function createRestrictions(blockNames, newRestrictions) {
  blockNames.forEach((blockName) => {
    restrictions[blockName] = newRestrictions;
  });
}

export function executeRestrictions(workspace) {
  const blocks = workspace.getAllBlocks(false);

  blocks.forEach((block) => {
    if (!restrictions[block.type]) return;

    const errors = [];

    restrictions[block.type].forEach((restriction) => {
      switch (restriction.type) {
        case "hasParent":
          if (!hasParentOfType(block, restriction.blockTypes))
            errors.push(restriction.message);
          break;
        case "notEmpty":
          let empty = true;
          restriction.blockTypes.forEach((type) => {
            if (block.getInput(type)?.connection.targetBlock()) empty = false;
          });
          if (empty) errors.push(restriction.message);
          break;
        case "surroundParent":
          let pass = false;
          restriction.blockTypes.forEach((type) => {
            if (block.getSurroundParent()?.type == type) pass = true;
          });
          if (!pass) errors.push(restriction.message);
          break;
        case "hasHat":
          if (!restriction.blockTypes.includes(block.getRootBlock().type))
            errors.push(restriction.message);
      }
    });

    if (errors.length > 0) block.setWarningText(errors.join("\n"));
    else block.setWarningText(null);
  });
}

function hasParentOfType(block, types) {
  let hasParent = false;
  while (block.getParent()) {
    if (types.includes(block.getParent().type)) {
      hasParent = true;
    }
    block = block.getParent();
  }
  return hasParent;
}
