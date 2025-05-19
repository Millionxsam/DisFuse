import axios from "axios";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import LoadingAnim from "./components/LoadingAnim";
import { userCache } from "./cache.ts";

import { apiUrl, authUrl } from "./config/config.js";

let lastFetchTime = 0;

export default function Auth({ children }) {
  const [params] = useSearchParams(window.location.hash.slice(1));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (
      params.get("token_type") &&
      params.get("access_token") &&
      params.get("expires_in")
    ) {
      localStorage.setItem(
        "disfuse-token",
        `${params.get("token_type")} ${params.get("access_token")}`
      );
      localStorage.setItem(
        "disfuse-token-exp",
        `${Date.now() + Number(params.get("expires_in")) * 1000}`
      );
    }

    const token = localStorage.getItem("disfuse-token");
    const exp = parseInt(localStorage.getItem("disfuse-token-exp"), 10);

    if (!token || Date.now() > exp) {
      window.location = authUrl;
      return;
    }

    if (window.location.href.includes("access_token=")) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    async function fetchData() {
      const now = Date.now();
      if (now - lastFetchTime < 20000) return setLoading(false);

      lastFetchTime = now;

      try {
        const [userRes, staffRes] = await Promise.all([
          axios.post(`${apiUrl}/users`, null, {
            headers: { Authorization: token },
          }),
          axios.get(`${apiUrl}/users/staff`, {
            headers: { Authorization: token },
          }),
        ]);

        const user = userRes.data;
        const staff = staffRes.data;

        userCache.user = user;
        userCache.isStaff = staff.users.some((s) => s.id === user.id);

        setLoading(false);
      } catch (err) {
        console.error("Auth fetch error:", err);
      }
    }

    fetchData();
  }, [params]);

  if (loading)
    return (
      <div className="load-container">
        <LoadingAnim />
      </div>
    );

  return children;
}
