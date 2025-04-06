import axios from "axios";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import LoadingAnim from "./components/LoadingAnim";

import { apiUrl, authUrl, devAuthUrl, discordUrl } from "./config/config.json";

let lastAuthTime = null;

export default function Auth({ children }) {
  const [params] = useSearchParams(window.location.hash.slice(1));
  const [loading, setLoading] = useState(true);

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
      Date.now() + params.get("expires_in") * 1000
    );
  }

  const token = localStorage.getItem("disfuse-token");
  const exp = parseInt(localStorage.getItem("disfuse-token-exp"));

  if (!token || Date.now() > exp) {
    if (window.location.hostname === "localhost") window.location = devAuthUrl;
    else window.location = authUrl;
  }

  if (window.location.href.includes("access_token="))
    window.location = window.location.pathname;

  useEffect(() => {
    if (lastAuthTime - Date.now() < 20000) {
      setLoading(false);
      return;
    }

    axios
      .post(apiUrl + "/users", null, {
        headers: { Authorization: token },
      })
      .then(() => {
        setLoading(false);
        lastAuthTime = Date.now();
      })
      .catch((error) => {
        console.error(error);
      });
  }, [token]);

  if (loading)
    return (
      <div key={"loadingAnim"} className="load-container">
        <LoadingAnim />
      </div>
    );

  return children;
}
