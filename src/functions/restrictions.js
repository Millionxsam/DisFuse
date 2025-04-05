import { javascriptGenerator, Order } from "blockly/javascript";

export const restrictions = {};

export function createRestrictions(blockNames, newRestrictions) {
  blockNames.forEach((blockName) => {
    if (!restrictions[blockName]) {
      restrictions[blockName] = newRestrictions;
    } else {
      restrictions[blockName] = restrictions[blockName].concat(newRestrictions);
    }
  });
}

export function executeRestrictions(workspace) {
  const blocks = workspace.getAllBlocks(false);

  blocks.forEach((block) => {
    if (!restrictions[block.type]) return;

    const errors = [];

    restrictions[block.type].forEach((restriction) => {
      // eslint-disable-next-line default-case
      switch (restriction.type) {
        case "hasParent":
          if (!hasParentOfType(block, restriction.blockTypes))
            errors.push(restriction.message);
          break;
        case "hasNoBlockInParent":
          if (hasBlockInParentOfType(block, restriction.blockTypes))
            errors.push(restriction.message);
          break;
        case "hasBlockInParent":
          if (!hasBlockInParentOfType(block, restriction.blockTypes))
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
          let passSP = false;
          restriction.blockTypes.forEach((type) => {
            if (block.getSurroundParent()?.type === type) passSP = true;
          });
          if (!passSP) errors.push(restriction.message);
          break;
        case "hasHat":
          if (!restriction.blockTypes.includes(block.getRootBlock().type))
            errors.push(restriction.message);
          break;
        case "blockExists":
          let passBE = false;
          blocks.forEach((b) => {
            if (restriction.blockTypes.includes(b.type)) passBE = true;
          });
          if (!passBE) errors.push(restriction.message);
          break;
        case "validator":
          let passValidator = true;
          restriction.blockTypes.forEach((input) => {
            let val = javascriptGenerator.valueToCode(block, input, Order.NONE);
            if (
              !(val.startsWith("'") && val.endsWith("'")) &&
              isNaN(val) &&
              isNaN(parseFloat(val))
            )
              return;

            passValidator = restriction.check(
              val.replaceAll("'", ""),
              workspace
            );
          });

          if (!passValidator) errors.push(restriction.message);
      }
    });

    if (errors.length > 0) block.setWarningText(errors.join("\n"));
    else block.setWarningText(null);

    block.data = errors;
  });
}

function hasParentOfType(block, types) {
  let hasParent = false;
  while (block.getSurroundParent()) {
    if (types.includes(block.getSurroundParent()?.type)) {
      hasParent = true;
    }

    block = block.getSurroundParent();
  }
  return hasParent;
}

function hasBlockInParentOfType(block, types) {
  let hasParent = false;

  while (block.getParent()) {
    if (types.includes(block.getParent().type)) {
      hasParent = true;
    }

    block = block.getParent();
  }

  return hasParent;
}
