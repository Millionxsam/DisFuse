import { useCallback, useEffect, useRef, useState } from "react";

import { getPlanLimits } from "../api/limits";

/**
 * The signed-in user's plan limits and how much of them is in use.
 *
 * `data` is the API's answer, or null until it arrives or if it fails.
 * Pages treat a missing answer as "don't know" and carry on: the API
 * refuses anything past a limit either way, so nothing here is security.
 */
export default function usePlanLimits() {
  const [state, setState] = useState({ loading: true, data: null, error: null });
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;
    return () => {
      cancelled.current = true;
    };
  }, []);

  const load = useCallback(async () => {
    try {
      const data = await getPlanLimits();
      if (!cancelled.current) setState({ loading: false, data, error: null });
      return data;
    } catch (error) {
      console.error("Failed to read plan limits:", error);
      if (!cancelled.current) setState({ loading: false, data: null, error });
      return null;
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refresh: load };
}

/**
 * Is there room for one more `resource` ("projects" or "websites")?
 * Unknown counts as room, for the reason above.
 */
export function hasRoom(data, resource) {
  if (!data?.limits || !data?.usage) return true;
  return data.usage[resource] < data.limits[resource];
}
