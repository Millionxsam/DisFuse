import Swal from "sweetalert2";

import { premiumModalBrand } from "./premiumModal";

/**
 * Explains an API refusal that names a plan limit, and offers Premium to
 * anyone who isn't on it.
 *
 * The API marks these with `limitReached` (see functions/planLimits.js
 * there), and its `error` is already worded for the account's plan.
 *
 * @param {unknown} error the failed request
 * @param {object} modalColors
 * @param {{title: string, navigate?: (to: string) => void}} options
 * @returns {boolean} true when it was a limit refusal and a dialog opened
 */
export default function showLimitReached(error, modalColors, { title, navigate }) {
  const body = error?.response?.data;
  if (!body?.limitReached) return false;

  Swal.fire({
    icon: "info",
    title,
    text: body.error,
    showCancelButton: !body.premium,
    confirmButtonText: body.premium ? "OK" : "See Premium",
    cancelButtonText: "Not now",
    ...premiumModalBrand,
    ...modalColors,
  }).then((result) => {
    if (body.premium || !result.isConfirmed) return;

    if (navigate) navigate("/settings/premium");
    else window.location = "/settings/premium";
  });

  return true;
}
