import { useEffect } from "react";

/* =====================================================================
   Reveal-on-scroll
   ---------------------------------------------------------------------
   Elements marked `.hidden` gain `.shown` when they scroll into view;
   `index.css` does the rest.

   This used to live in App's render body as a bare `setInterval` that
   queried `document.querySelectorAll(".hidden")` every 500 ms forever —
   one new interval and one new IntersectionObserver per render, none of
   them ever cleared. It also never actually stopped re-observing,
   because it marked elements with `dataset.observed = true` and then
   tested `!== true`; `dataset` values are strings, so the test was
   always true.

   Watching the DOM for additions does the same job without polling, and
   stops when the page unmounts.
   ===================================================================== */

export default function useRevealOnScroll() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries)
        entry.target.classList.toggle("shown", entry.isIntersecting);
    });

    /* A Set rather than a data attribute: observing twice is harmless
       but pointless, and this can't be fooled by string coercion. */
    const observed = new WeakSet();

    function observeAll(root = document) {
      for (const element of root.querySelectorAll?.(".hidden") ?? []) {
        if (observed.has(element)) continue;

        observed.add(element);
        observer.observe(element);
      }
    }

    observeAll();

    const mutations = new MutationObserver((records) => {
      for (const record of records)
        for (const node of record.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;

          if (node.classList?.contains("hidden") && !observed.has(node)) {
            observed.add(node);
            observer.observe(node);
          }

          observeAll(node);
        }
    });

    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutations.disconnect();
      observer.disconnect();
    };
  }, []);
}
