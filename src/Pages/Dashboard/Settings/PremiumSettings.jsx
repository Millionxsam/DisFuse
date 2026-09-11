import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Swal from "sweetalert2";

import LoadingAnim from "../../../components/LoadingAnim";
import {
  openBillingPortal,
  setCancellation,
  startCheckout,
} from "../../../api/premium";
import { premiumLogo, premiumPlans } from "../../../config/premiumPlans";
import { PremiumPerks } from "../../../components/premium/PremiumUpgrade";
import usePremium from "../../../functions/usePremium";
import modalThemeColor from "../../../functions/modalThemeColor";
import {
  premiumModalBrand,
  premiumModalHero,
} from "../../../functions/premiumModal";
import { userCache } from "../../../cache.ts";

import DocsLink from "../../../components/DocsLink.jsx";
import { DOCS } from "../../../config/docs.js";

const modalColors = modalThemeColor(null, true);

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Unknown";

/** How Stripe's subscription statuses read to a person. */
const STATUS_LABELS = {
  active: { label: "Active", tone: "active", icon: "fa-circle-check" },
  trialing: { label: "Trial", tone: "active", icon: "fa-hourglass-half" },
  lifetime: { label: "Lifetime", tone: "active", icon: "fa-infinity" },
  past_due: {
    label: "Payment overdue",
    tone: "warning",
    icon: "fa-triangle-exclamation",
  },
  unpaid: { label: "Unpaid", tone: "danger", icon: "fa-circle-exclamation" },
  incomplete: {
    label: "Incomplete",
    tone: "warning",
    icon: "fa-hourglass-half",
  },
  incomplete_expired: {
    label: "Expired",
    tone: "danger",
    icon: "fa-circle-xmark",
  },
  canceled: { label: "Cancelled", tone: "danger", icon: "fa-circle-xmark" },
  paused: { label: "Paused", tone: "warning", icon: "fa-circle-pause" },
};

export default function PremiumSettings() {
  const { loading, premium, status, refresh, refreshFromStripe } = usePremium();
  const [params, setParams] = useSearchParams();
  const [busy, setBusy] = useState(null);

  /* Coming back from Stripe Checkout: pull the subscription straight from
     Stripe so the page is correct even before the webhook lands. */
  useEffect(() => {
    if (params.get("checkout") !== "success") return;

    refreshFromStripe().then(() => {
      Swal.fire({
        title: "Welcome to Premium!",
        text: "Your subscription is active. Control, Insights, Websites, Version Control and every other Premium feature are unlocked.",
        ...premiumModalHero,
        ...modalColors,
      });
    });

    params.delete("checkout");
    params.delete("session_id");
    setParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function run(action, fn) {
    setBusy(action);

    try {
      await fn();
    } catch (err) {
      console.error(err);

      Swal.fire({
        icon: "error",
        title: "Something went wrong",
        text: err.response?.data?.error || "Please try again in a moment.",
        ...premiumModalBrand,
        ...modalThemeColor(userCache.user),
      });
    } finally {
      setBusy(null);
    }
  }

  const upgrade = (planId) =>
    run(`checkout:${planId}`, async () => {
      const url = await startCheckout(planId);
      if (!url) throw new Error("No checkout URL returned");
      window.location = url;
    });

  const manage = () =>
    run("portal", async () => {
      const url = await openBillingPortal();
      if (!url) throw new Error("No portal URL returned");
      window.location = url;
    });

  const cancel = () =>
    Swal.fire({
      title: "Cancel Premium?",
      html: `You'll keep Premium until <strong>${formatDate(
        status?.currentPeriodEnd,
      )}</strong>. After that your published websites go offline, the builder locks and Insights stops being readable. Your bots keep recording, so it's all there if you come back. Project versions you already saved stay editable; you just won't be able to create or rename any.`,
      icon: "warning",
      showCancelButton: true,
      focusCancel: true,
      confirmButtonColor: "red",
      confirmButtonText: "Cancel at period end",
      cancelButtonText: "Keep Premium",
      ...premiumModalBrand,
      ...modalColors,
    }).then((result) => {
      if (!result.isConfirmed) return;
      return run("cancel", async () => {
        await setCancellation(false);
        await refresh();
      });
    });

  const resume = () =>
    run("resume", async () => {
      await setCancellation(true);
      await refresh();
    });

  if (loading)
    return (
      <div className="settings">
        <Helmet>
          <title>Premium | DisFuse</title>
        </Helmet>
        <h1>Premium</h1>
        <LoadingAnim />
      </div>
    );

  const statusKey = status?.status || (premium ? "active" : null);
  const statusInfo = STATUS_LABELS[statusKey] || {
    label: "Not subscribed",
    tone: "",
    icon: "fa-circle-minus",
  };

  const isLifetime = status?.status === "lifetime";
  const currentPlan = premiumPlans.find((plan) => plan.id === status?.plan);

  return (
    <div className="settings">
      <Helmet>
        <title>Premium | DisFuse</title>
      </Helmet>
      <h1>Premium</h1>
      <p>
        Manage your DisFuse Premium subscription, billing and payment method.{" "}
        <DocsLink
          page={`${DOCS.premium}#managing-your-subscription`}
          variant="inline"
          label="About Premium"
        />
      </p>

      <div className="df-billing">
        <div className={`df-billing-card${premium ? " active" : ""}`}>
          <div className="df-billing-head">
            <div className={`icon${premium ? " brand" : ""}`}>
              {premium ? (
                <img src={premiumLogo} alt="" />
              ) : (
                <i className="fa-solid fa-user"></i>
              )}
            </div>
            <div className="title">
              <h2>
                {premium ? currentPlan?.name || "DisFuse Premium" : "Free"}
              </h2>
              <p>
                {premium
                  ? "Control, Insights, Websites, Version Control, bot dashboards and every other Premium feature are unlocked."
                  : "Upgrade to unlock Insights, Websites, Version Control and bot dashboards."}
              </p>
            </div>
            <span className={`df-billing-status ${statusInfo.tone}`}>
              <i className={`fa-solid ${statusInfo.icon}`}></i>{" "}
              {statusInfo.label}
            </span>
          </div>

          {premium && (
            <div className="df-billing-details">
              <div>
                <span className="label">Started</span>
                <strong>{formatDate(status?.subscribedAt)}</strong>
              </div>
              {!isLifetime && (
                <>
                  <div>
                    <span className="label">Current period</span>
                    <strong>
                      {formatDate(status?.currentPeriodStart)} –{" "}
                      {formatDate(status?.currentPeriodEnd)}
                    </strong>
                  </div>
                  <div>
                    <span className="label">
                      {status?.cancelAtPeriodEnd ? "Access ends" : "Renews"}
                    </span>
                    <strong>{formatDate(status?.currentPeriodEnd)}</strong>
                  </div>
                </>
              )}
              {isLifetime && (
                <div>
                  <span className="label">Renews</span>
                  <strong>Never</strong>
                </div>
              )}
            </div>
          )}

          {status?.cancelAtPeriodEnd && (
            <div className="df-billing-note">
              <i className="fa-solid fa-triangle-exclamation"></i>
              <span>
                Your subscription is scheduled to end on{" "}
                <strong>{formatDate(status?.currentPeriodEnd)}</strong>.
                Published websites will go offline after that date.
              </span>
            </div>
          )}

          {(statusKey === "past_due" || statusKey === "unpaid") && (
            <div className="df-billing-note">
              <i className="fa-solid fa-credit-card"></i>
              <span>
                We couldn't take your last payment. Update your payment method
                to keep your websites online.
              </span>
            </div>
          )}

          <div className="df-billing-actions">
            {status?.manageable && (
              <button onClick={manage} disabled={busy === "portal"}>
                <i className="fa-solid fa-credit-card"></i>
                {busy === "portal" ? "Opening…" : "Manage billing"}
              </button>
            )}

            {premium && !isLifetime && !status?.cancelAtPeriodEnd && (
              <button
                className="red"
                onClick={cancel}
                disabled={busy === "cancel"}
              >
                <i className="fa-solid fa-ban"></i>
                {busy === "cancel" ? "Cancelling…" : "Cancel subscription"}
              </button>
            )}

            {status?.cancelAtPeriodEnd && (
              <button
                className="df-primary-btn"
                onClick={resume}
                disabled={busy === "resume"}
              >
                <i className="fa-solid fa-rotate-left"></i>
                {busy === "resume" ? "Resuming…" : "Resume subscription"}
              </button>
            )}

            {premium && (
              <>
                <Link to="/insights">
                  <button>
                    <i className="fa-solid fa-chart-line"></i> Go to Insights
                  </button>
                </Link>
                <Link to="/websites">
                  <button>
                    <i className="fa-solid fa-globe"></i> Go to Websites
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* One product, one list of perks — shown above the plans,
            because the plans are only ways of paying for it. */}
        <PremiumPerks
          heading={
            premium ? "What your subscription includes" : "Everything in DisFuse Premium"
          }
        />

        {!premium && (
          <>
            <h2 style={{ fontSize: "16px", color: "white" }}>
              Choose how to pay
            </h2>
            <div className="df-billing-plans">
              {premiumPlans.map((plan) => (
                <div
                  className={`df-billing-plan${plan.highlight ? " highlight" : ""}`}
                  key={plan.id}
                >
                  <h3>{plan.name}</h3>
                  <div className="price">
                    <strong>{plan.price}</strong>
                    <span>{plan.interval}</span>
                  </div>
                  <button
                    className={plan.highlight ? "df-primary-btn" : ""}
                    onClick={() => upgrade(plan.id)}
                    disabled={busy === `checkout:${plan.id}`}
                  >
                    {busy === `checkout:${plan.id}`
                      ? "Redirecting…"
                      : "Subscribe"}
                  </button>
                </div>
              ))}
            </div>
            <p style={{ fontSize: "13px", opacity: 0.6 }}>
              <i className="fa-brands fa-cc-stripe"></i> Payments are processed
              securely by Stripe. Cancel any time.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
