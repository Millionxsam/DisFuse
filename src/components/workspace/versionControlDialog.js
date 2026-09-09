import { useEffect, useState } from "react";

/* =====================================================================
   Opening the Version Control panel
   ---------------------------------------------------------------------
   The navbar opens it, and the panel's own flows close and reopen it
   around a SweetAlert — a `<dialog>` in the top layer sits above
   SweetAlert whatever its z-index, so the panel has to step out of the
   way to ask a question.

   Both used to reach for the dialog element by class name. This is the
   same two functions, backed by state the panel subscribes to, and it
   lives in its own module for a second reason: a file that exports both
   a component and plain functions can't be Fast Refreshed in
   development.
   ===================================================================== */

const listeners = new Set();
let isOpen = false;

function setOpen(next) {
  isOpen = next;
  for (const listener of listeners) listener(next);
}

export function openVersionControl() {
  setOpen(true);
}

export function closeVersionControl() {
  setOpen(false);
}

export function useVersionControlOpen() {
  const [open, setOpenState] = useState(isOpen);

  useEffect(() => {
    listeners.add(setOpenState);
    setOpenState(isOpen);

    return () => listeners.delete(setOpenState);
  }, []);

  return open;
}
