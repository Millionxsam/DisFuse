import Blockly from "blockly/core";

class CustomConstantProvider extends Blockly.zelos.ConstantProvider {
  init() {
    super.init();
    this.OCTAGON = this.makeOctagon();
    this.CURVY = this.makeCurvy();
    this.BOWL = this.makeBowl();
  }

  makeOctagon() {
    const maxWidth = this.MAX_DYNAMIC_CONNECTION_SHAPE_WIDTH;
    const maxHeight = maxWidth * 2;

    function makeMainPath(blockHeight, up, right) {
      const remainingHeight = blockHeight > maxHeight ? blockHeight - maxHeight : 0;
      const height = blockHeight > maxHeight ? maxHeight : blockHeight;
      const radius = height / 4;

      const dirRight = right ? 1 : -1;
      const dirUp = up ? -1 : 1;

      return `h ${radius * dirRight} l ${radius * dirRight} ${radius * dirUp} v ${((remainingHeight + height) - radius * 2) * dirUp} l ${radius * -dirRight} ${radius * dirUp} h ${radius * -dirRight}`;
    }

    return {
      type: this.SHAPES.HEXAGONAL,
      isDynamic: true,
      width(height) {
        const halfHeight = height / 2;
        return halfHeight > maxWidth ? maxWidth : halfHeight;
      },
      height(height) {
        return height;
      },
      connectionOffsetY(connectionHeight) {
        return connectionHeight / 2;
      },
      connectionOffsetX(connectionWidth) {
        return -connectionWidth;
      },
      pathDown(height) {
        return makeMainPath(height, false, false);
      },
      pathUp(height) {
        return makeMainPath(height, true, false);
      },
      pathRightDown(height) {
        return makeMainPath(height, false, true);
      },
      pathRightUp(height) {
        return makeMainPath(height, false, true);
      },
    };
  }

  makeCurvy() {
    const maxWidth = this.MAX_DYNAMIC_CONNECTION_SHAPE_WIDTH;
    const maxHeight = maxWidth * 2;

    function makeMainPath(blockHeight, up, right) {
      const remainingHeight = blockHeight > maxHeight ? blockHeight - maxHeight : 0;
      const height = (blockHeight > maxHeight ? maxHeight : blockHeight) + remainingHeight;
      const radius = (height - remainingHeight);

      const dirRight = right ? 1 : -1;
      const dirUp = up ? -1 : 1;

      return `q ${radius * dirRight} ${(height / 2) * dirUp} 0 ${height * dirUp}`;
    }

    return {
      type: this.SHAPES.HEXAGONAL,
      isDynamic: true,
      width(height) {
        const halfHeight = height / 2;
        return halfHeight > maxWidth ? maxWidth : halfHeight;
      },
      height(height) {
        return height;
      },
      connectionOffsetY(connectionHeight) {
        return connectionHeight / 2;
      },
      connectionOffsetX(connectionWidth) {
        return -connectionWidth;
      },
      pathDown(height) {
        return makeMainPath(height, false, false);
      },
      pathUp(height) {
        return makeMainPath(height, true, false);
      },
      pathRightDown(height) {
        return makeMainPath(height, false, true);
      },
      pathRightUp(height) {
        return makeMainPath(height, false, true);
      },
    };
  }

  makeBowl() {
    const maxWidth = this.MAX_DYNAMIC_CONNECTION_SHAPE_WIDTH;
    const maxHeight = maxWidth * 2;
    const thisCopy = this

    function makeMainPath(blockHeight, up, right) {
      const remainingHeight = blockHeight > maxHeight ? blockHeight - maxHeight : 0;
      const height = (blockHeight > maxHeight ? maxHeight : blockHeight) + remainingHeight;
      const radius = height / 2;

      const dirRight = right ? 1 : -1;
      const dirUp = up ? -1 : 1;

      return `h ${radius * dirRight} q ${(radius / 2) * -dirRight} ${radius * dirUp} 0 ${height * dirUp} h ${radius * -dirRight}`;
    }

    return {
      type: this.SHAPES.ROUND,
      isDynamic: true,
      width(height) {
        const halfHeight = height / 2;
        return halfHeight > maxWidth ? maxWidth : halfHeight;
      },
      height(height) {
        return height;
      },
      connectionOffsetY(connectionHeight) {
        return connectionHeight / 2;
      },
      connectionOffsetX(connectionWidth) {
        return -connectionWidth;
      },
      pathDown(height) {
        return makeMainPath(height, false, false);
      },
      pathUp(height) {
        return makeMainPath(height, true, false);
      },
      pathRightDown(height) {
        return thisCopy.ROUNDED.pathRightDown(height);
      },
      pathRightUp(height) {
        return thisCopy.ROUNDED.pathRightUp(height);
      },
    };
  }

  /**
   * @param {Blockly.RenderedConnection} connection
   */
  shapeFor(connection) {
    let checks = connection.getCheck();
    if (!checks && connection.targetConnection) checks = connection.targetConnection.getCheck();

    if (connection.type === 1 || connection.type === 2) {
      if (checks) {
        if (checks.includes('date')) {
          return this.OCTAGON;
        } else if (checks.includes('object')) {
          return this.CURVY;
        } else if (checks.includes('message')) {
          return this.BOWL;
        }
      }
    }

    return super.shapeFor(connection);
  }
}

export default class Renderer extends Blockly.zelos.Renderer {
  // eslint-disable-next-line no-useless-constructor
  constructor() {
    super();
  }

  makeConstants_() {
    return new CustomConstantProvider();
  }
}
