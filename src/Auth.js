import axios from "axios";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import LoadingAnim from "./components/LoadingAnim";

const { apiUrl } = require("./config/config.json");

const { authUrl, devAuthUrl } = require("./config/config.json");

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

  axios
    .post(apiUrl + "/users", null, {
      headers: {
        Authorization: token,
      },
    })
    .then(() => setLoading(false));

  if (loading)
    return (
      <div className="load-container">
        <LoadingAnim />
      </div>
    );

  return children;
}
