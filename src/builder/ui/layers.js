/* =====================================================================
   Layers
   ---------------------------------------------------------------------
   Popovers and modals can open on top of each other (a value picker
   inside a message builder inside a step). Only the one on top should
   answer Escape or a click outside it; this is the stack that says
   which one that is.
   ===================================================================== */

const stack = [];
let counter = 0;

/** Registers a layer; returns its id and a function to remove it. */
export function pushLayer() {
  counter += 1;
  const id = counter;
  stack.push(id);
  return {
    id,
    remove: () => {
      const index = stack.indexOf(id);
      if (index !== -1) stack.splice(index, 1);
    },
  };
}

export function isTopLayer(id) {
  return stack[stack.length - 1] === id;
}
