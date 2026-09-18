import Swal from "sweetalert2";

import { planLimits } from "../../../config/premiumPlans";

/* =====================================================================
   "Now free" tour
   ---------------------------------------------------------------------
   Shown once on My Projects to tell people that Websites, Insights, Bot
   Control and Version Control no longer need Premium.

   It can't be skipped: there is no close button, Escape and clicking
   outside do nothing, and the only way out is Done on the last slide.
   Back and Next move between slides. It is only remembered as seen once
   Done is pressed, so someone who leaves halfway sees it again.
   ===================================================================== */

const SEEN_KEY = "freeFeaturesTourSeen";

/** A YouTube walkthrough, opened in a new tab. */
function video(url) {
  return `<a href="${url.replaceAll("&", "&amp;")}" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-youtube"></i> Watch the video</a>`;
}

const SLIDES = [
  {
    icon: "fa-solid fa-gift",
    title: "New DisFuse Features",
    html: "Websites, Bot Insights, Bot Control and Version Control are now permanently free for everyone. Here's a quick look at what each one does.",
  },
  {
    icon: "fa-solid fa-globe",
    title: "Websites",
    html: `Build a website for any of your bots with a drag and drop builder, no code needed. Make a landing page, a docs site, or a dashboard where server owners set up your bot.<br /><br />${video(
      "https://www.youtube.com/watch?v=9f9i2DQnOB0&list=PLN11O9cDNsl8",
    )}`,
  },
  {
    icon: "fa-solid fa-chart-line",
    title: "Bot Insights",
    html: `See how your bot is really used: its most popular commands, most active users, busiest servers and errors, plus live logs. Free accounts keep ${planLimits.free.insightsRetentionDays} days of history.<br /><br />${video(
      "https://www.youtube.com/watch?v=KRCGe0E1QOU&list=PLN11O9cDNsl8",
    )}`,
  },
  {
    icon: "fa-solid fa-satellite-dish",
    title: "Bot Control",
    html: `Use Discord as your bot. Read its servers and channels, send and edit messages, react, and moderate members, all live from DisFuse.<br /><br />${video(
      "https://www.youtube.com/watch?v=hntyeH39FAQ&list=PLN11O9cDNsl8",
    )}`,
  },
  {
    icon: "fa-solid fa-code-branch",
    title: "Version Control",
    html: `Save your whole project as a version, start your next update from a copy, and switch back any time. Turn it on only for the projects you want, and keep up to ${planLimits.free.versionsPerProject} versions per project for free.<br /><br />${video(
      "https://www.youtube.com/watch?v=uDTigGwTCmc&list=PLN11O9cDNsl8",
    )}`,
  },
];

/** The tour, unless this browser has already been through all of it. */
export default async function showFreeFeaturesTour(modalColors) {
  if (localStorage.getItem(SEEN_KEY) === "true") return;

  const slide = Swal.mixin({
    progressSteps: SLIDES.map((_, index) => String(index + 1)),
    icon: "info",
    allowOutsideClick: false,
    allowEscapeKey: false,
    showCloseButton: false,
    reverseButtons: true,
    cancelButtonText: "Back",
    ...modalColors,
    customClass: { ...modalColors?.customClass, icon: "free-tour-icon" },
  });

  let current = 0;
  let started = false;

  while (current < SLIDES.length) {
    const { icon, ...content } = SLIDES[current];
    const last = current === SLIDES.length - 1;

    const result = await slide.fire({
      ...content,
      iconHtml: `<i class="${icon}"></i>`,
      currentProgressStep: current,
      showCancelButton: current > 0,
      confirmButtonText: last ? "Done" : "Next",
      /* Only the first slide animates in, so stepping through the rest
         reads as one dialog changing rather than a new one each time. */
      animation: !started,
    });

    started = true;

    if (result.isConfirmed) {
      if (last) {
        localStorage.setItem(SEEN_KEY, "true");
        return;
      }

      current++;
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      current = Math.max(0, current - 1);
    } else {
      /* Nothing on the slides can dismiss them any other way, so this is
         another dialog taking over the screen. Step aside without
         marking the tour as seen; it comes back next visit. */
      return;
    }
  }
}
