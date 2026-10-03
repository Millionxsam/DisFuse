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
          /* `through` lists block types that don't count as the parent,
             so the check looks past them — a button in a loop in a row
             is still in the row. */
          let surroundParent = block.getSurroundParent();
          while (
            surroundParent &&
            restriction.through?.includes(surroundParent.type) &&
            !restriction.blockTypes.includes(surroundParent.type)
          )
            surroundParent = surroundParent.getSurroundParent();

          if (!restriction.blockTypes.includes(surroundParent?.type))
            errors.push(restriction.message);
          break;
        case "custom":
          if (!restriction.check(block, workspace))
            errors.push(restriction.message);
          break;
        case "hasHat":
          if (!restriction.blockTypes.includes(block.getRootBlock().type))
            errors.push(restriction.message);
          break;
        case "blockAlreadyExists":
          if (
            blocks.some(
              (b) =>
                b.id !== block.id && restriction.blockTypes.includes(b.type),
            )
          )
            errors.push(restriction.message);
          break;
        case "blockNotFound":
          if (
            !blocks.some(
              (b) =>
                b.id !== block.id && restriction.blockTypes.includes(b.type),
            )
          )
            errors.push(restriction.message);
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
              workspace,
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
