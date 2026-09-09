/* =====================================================================
   Premium API
   ---------------------------------------------------------------------
   The signed-in user's DisFuse Premium subscription, plus Stripe Checkout
   and the Billing Portal.

   Stripe is handled entirely by the backend: the frontend asks it for a
   hosted URL and redirects there. No Stripe key of any kind reaches this
   app.

   Routes:
     GET  /users/:id/premium            → status
     POST /users/:id/premium/refresh    → re-read from Stripe
     POST /users/:id/premium/checkout   { planId } → { url }
     POST /users/:id/premium/portal     → { url }
     POST /users/:id/premium/cancel     { resume? } → status
   ===================================================================== */

import api, { data as body } from "./client.js";
import { userCache } from "../cache.ts";

function currentUserId(userId) {
  return userId || userCache.user?.id;
}

export async function getPremiumStatus(userId = currentUserId()) {
  if (!userId) return { premium: false, plan: null };

  const { data } = await api.get(`/users/${userId}/premium`);

  return { ...data, premium: Boolean(data?.premium) };
}

/**
 * Pulls the latest subscription straight from Stripe.
 *
 * Used when returning from Checkout so the UI updates immediately rather
 * than waiting for webhook delivery.
 */
export async function refreshPremiumStatus(userId = currentUserId()) {
  const { data } = await api.post(`/users/${userId}/premium/refresh`);

  return { ...data, premium: Boolean(data?.premium) };
}

/**
 * Asks the backend for a Stripe Checkout session and returns its URL.
 * Only the plan ID is sent — the backend resolves the actual price.
 */
export async function startCheckout(planId, userId = currentUserId()) {
  const { data } = await api.post(`/users/${userId}/premium/checkout`, {
    planId,
  });

  return data?.url;
}

/** Opens the Stripe Billing Portal for payment methods, invoices, plans. */
export async function openBillingPortal(userId = currentUserId()) {
  const { data } = await api.post(`/users/${userId}/premium/portal`);

  return data?.url;
}

/** Schedules cancellation at period end, or undoes a scheduled one. */
export async function setCancellation(resume, userId = currentUserId()) {
  const { data } = await api.post(`/users/${userId}/premium/cancel`, {
    resume,
  });

  return { ...data, premium: Boolean(data?.premium) };
}
