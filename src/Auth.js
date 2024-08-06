import axios from "axios";
import { useSearchParams } from "react-router-dom";

const { discordUrl, apiUrl } = require("./config/config.json");

const { authUrl, devAuthUrl } = require("./config/config.json");

export default function Auth() {
  const [params, setParams] = useSearchParams(window.location.hash.slice(1));

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
    if (window.location.hostname === 'localhost') window.location = devAuthUrl;
    else window.location = authUrl;
  }

  if (window.location.href.includes("#")) window.location = window.location.pathname;

  axios.post(apiUrl + "/users", null, {
    headers: {
      Authorization: token,
    },
  });
}
