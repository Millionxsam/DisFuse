import Swal from "sweetalert2";
import modalThemeColor from "./modalThemeColor";
import { userCache } from "../cache";
import { useNavigate } from "react-router-dom";

export default function joinServer(retryFunction) {
  Swal.fire({
    ...modalThemeColor(userCache.user),
    title: "Join our Discord to continue",
    html: `Join our Discord server using the link below to start building with DisFuse. Plus, be a part of the community and get early updates straight from the team.<br /><br /><a href="https://dsc.gg/disfuse" target="_blank" rel="noopener noreferrer">Join Discord</a>`,
    confirmButtonText: "Retry",
    showCancelButton: true,
    cancelButtonText: "Cancel",
    icon: "warning",
  }).then((r) => {
    if (r.isConfirmed) retryFunction();
    else window.location = "/projects";
  });
}
