import { useCallback, useEffect, useRef, useState } from "react";

import { getPremiumStatus, refreshPremiumStatus } from "../api/premium";

/**
 * Premium state for the signed-in DisFuse user.
 *
 * `status` holds the full response from the API (plan, billing period,
 * cancellation state) so the Settings page can render it without a second
 * request. Frontend checks are for UX only — the backend enforces access.
 */
export default function usePremium() {
  const [state, setState] = useState({
    loading: true,
    premium: false,
    status: null,
    error: null,
  });

  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;
    return () => {
      cancelled.current = true;
    };
  }, []);

  const load = useCallback(async (fromStripe = false) => {
    setState((s) => ({ ...s, loading: true }));

    try {
      const status = fromStripe
        ? await refreshPremiumStatus()
        : await getPremiumStatus();

      if (cancelled.current) return status;

      setState({
        loading: false,
        premium: Boolean(status.premium),
        status,
        error: null,
      });

      return status;
    } catch (error) {
      console.error("Failed to read premium status:", error);

      if (!cancelled.current) {
        setState({ loading: false, premium: false, status: null, error });
      }

      return null;
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    ...state,
    /** Re-reads from the database. */
    refresh: () => load(false),
    /** Re-reads from Stripe first — use after returning from Checkout. */
    refreshFromStripe: () => load(true),
  };
}
