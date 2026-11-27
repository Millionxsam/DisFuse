import { createContext, useContext } from "react";

/* =====================================================================
   The flow being edited
   ---------------------------------------------------------------------
   Everything deep inside a step card (inputs, value pills, the message
   builder) needs to know which command or event it's in, so it can
   offer the right values. Rather than passing that through every
   component, the step builder provides it once:

     { flowId, info, issues }   info from flowInfo(), issues from validateFlow()

   Components that also work outside a flow (the event settings form)
   use an info-only version.
   ===================================================================== */

export const FlowContext = createContext(null);

export function useFlowContext() {
  return useContext(FlowContext);
}
