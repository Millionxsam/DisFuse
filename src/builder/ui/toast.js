/* =====================================================================
   DisFuse Builder: toasts
   ---------------------------------------------------------------------
   The little notices in the corner ("Couldn't save that change"). Any
   module can raise one without importing React; the <Toaster /> in the
   builder's layout listens and draws them.

     toast.success("Command created")
     toast.error("Couldn't save that change", { detail: "..." })
     toast.info("Copied")
   ===================================================================== */

const listeners = new Set();
let counter = 0;

function emit(kind, message, options = {}) {
  counter += 1;
  const notice = {
    id: counter,
    kind,
    message: String(message ?? ""),
    detail: options.detail ? String(options.detail) : "",
    duration: options.duration ?? (kind === "error" ? 6000 : 3200),
    action: options.action ?? null,
  };
  for (const listener of listeners) listener(notice);
  return notice.id;
}

export const toast = {
  success: (message, options) => emit("success", message, options),
  error: (message, options) => emit("error", message, options),
  info: (message, options) => emit("info", message, options),
};

/** @returns {() => void} unsubscribe */
export function subscribeToasts(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
