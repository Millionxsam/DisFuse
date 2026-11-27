import { useMemo } from "react";

import { answerStateAt, answerStates, checkAnswer } from "../../model/replies.js";
import { canUse, contextsAt } from "../../model/scope.js";
import { useBuilder } from "../../state/BuilderProvider.jsx";
import { CatalogPicker, Modal } from "../../ui/index.js";
import { useFlowContext } from "./FlowContext.js";

/* =====================================================================
   Adding a step
   ---------------------------------------------------------------------
   Every step the builder has, by category, with search. Steps that
   can't work where this one would go stay in the list but are greyed
   out with the reason ("Only works in a slash command"), so people can
   still find out they exist. The same goes for a second answer to a
   command ("Reply to the interaction" after "Show a form"), which Discord refuses.
   ===================================================================== */

const RECENT_KEY = "dfb-recent-steps";

export function readRecentSteps() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]").slice(0, 8);
  } catch {
    return [];
  }
}

export function rememberStep(type) {
  try {
    const next = [type, ...readRecentSteps().filter((t) => t !== type)].slice(0, 8);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* Private mode: recents just aren't remembered. */
  }
}

export default function ActionPicker({ open, location, onClose, onPick }) {
  const { catalog } = useBuilder();
  const flow = useFlowContext();

  const items = useMemo(() => {
    if (!open || !flow?.info) return [];
    const contexts = contextsAt(flow.info, catalog, location ?? {});
    const answered = answerStateAt(answerStates(flow.info.actions, catalog), location ?? {});
    return [...catalog.actions.values()].filter((def) => !def.hidden).map((def) => {
      const fits = canUse(def, contexts, catalog.contexts);
      const usable = fits.ok ? checkAnswer(def, answered) : fits;
      return {
        id: def.id,
        label: def.label,
        description: def.description,
        icon: def.icon,
        category: def.category,
        group: def.group,
        keywords: [...(def.keywords ?? []), ...(def.special ? ["builder"] : [])],
        disabled: !usable.ok,
        reason: usable.reason,
        badge: def.special === "message" ? { label: "Message builder", tone: "violet" } : def.special === "modal" ? { label: "Form builder", tone: "violet" } : def.branches?.length ? { label: "Has sections", tone: "mint" } : null,
      };
    });
  }, [catalog, flow?.info, location, open]);

  const recent = open ? readRecentSteps().filter((id) => items.some((i) => i.id === id && !i.disabled)) : [];

  return (
    <Modal open={open} onClose={onClose} title="Add a step" subtitle="What should the bot do next?" icon="fa-solid fa-plus" size="xl" flush>
      <CatalogPicker
        items={items}
        categories={catalog.categories}
        recent={recent}
        placeholder="Search steps, like “send message” or “ban”"
        onPick={(item) => {
          rememberStep(item.id);
          onPick(item.id);
        }}
      />
    </Modal>
  );
}
