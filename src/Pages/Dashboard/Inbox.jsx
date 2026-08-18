import axios from "axios";
import { useEffect, useState } from "react";
import InboxItem from "../../components/InboxItem";
import LoadingAnim from "../../components/LoadingAnim";
import Swal from "sweetalert2";
import { userCache } from "../../cache.ts";

import { apiUrl } from "../../config/config.js";

export default function Inbox() {
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [shown, setShown] = useState([]);

  useEffect(() => {
    if (userCache.user?.inbox) {
      setUser(userCache.user);
      setShown(userCache.user.inbox);
      setLoading(false);

      setTimeout(() => {
        userCache.user.inbox = userCache.user.inbox.map((i) => {
          i.read = true;
          return i;
        });

        axios.put(
          apiUrl + `/users/${userCache.user.id}/inbox`,
          userCache.user.inbox,
          { headers: { Authorization: localStorage.getItem("disfuse-token") } },
        );
      }, 700);
      return;
    }

    const token = localStorage.getItem("disfuse-token");
    axios
      .post(`${apiUrl}/users`, null, { headers: { Authorization: token } })
      .then(({ data: userData }) => {
        userCache.user = userData;
        setUser(userData);
        setShown(userData.inbox);
        setLoading(false);

        setTimeout(() => {
          userData.inbox = userData.inbox.map((i) => {
            i.read = true;
            return i;
          });

          axios.put(apiUrl + `/users/${userData.id}/inbox`, userData.inbox, {
            headers: { Authorization: token },
          });
        }, 700);
      });
  }, []);

  function clearAll() {
    Swal.fire({
      title: "Clear inbox?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, clear all"
    }).then(response => {
      if (response.isConfirmed) {
        axios
          .put(apiUrl + `/users/${user.id}/inbox`, [], {
            headers: {
              Authorization: localStorage.getItem("disfuse-token")
            }
          })
          .then(({ data }) => setUser(data))
          .then(() => window.location.reload());
      }
    });
  }

  return (
    <div className="df-page">
      <div className="df-page-head">
        <h1>
          <i className="fa-solid fa-inbox"></i> Inbox
        </h1>
        <div className="df-toolbar">
          <div className="df-btn-group">
            <button onClick={clearAll} className="red" disabled={!shown?.length}>
              <i className="fa-solid fa-trash"></i> Clear All
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingAnim />
      ) : shown?.length ? (
        <div className="df-inbox-list">
          {shown
            .slice()
            .reverse()
            .map((item, index) => (
              <InboxItem item={item} user={user} index={index} key={index} />
            ))}
        </div>
      ) : (
        <div className="df-empty">
          <img src="/media/noInboxGraphics.svg" style={{ maxHeight: "8rem" }}></img>
          <h3>Nothing here yet</h3>
          <p>Likes, comments, and invites on your projects will show up here.</p>
        </div>
      )}
    </div>
  );
}
