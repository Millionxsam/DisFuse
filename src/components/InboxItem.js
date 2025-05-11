import axios from "axios";
import { useState, useEffect } from "react";
import UserTag from "./UserTag";
import ms from "ms";
import { useNavigate } from "react-router-dom";
import { userCache } from "../cache.ts";

const { apiUrl } = require("../config/config.js");

export default function InboxItem({ item, user, index }) {
  let link, title, body;
  
  const { allUsers, allProjects } = userCache;
  const token = localStorage.getItem("disfuse-token");
  const navigate = useNavigate();

  const [alertUser, setUser] = useState(null);
  const [alertProject, setProject] = useState(null);
  const [alertComment, setComment] = useState(null);
  const [alertReply, setReply] = useState(null);

  // user 
  useEffect(() => {
    const uid = item.notification.userId;
    if (!uid) return;

    const inCache = allUsers?.find((u) => u.id === uid);
    if (inCache) {
      setUser(inCache);
    } else {
      axios
        .get(`${apiUrl}/users/${uid}`, { headers: { Authorization: token } })
        .then(({ data }) => setUser(data))
        .catch(() => setUser(null));
    }
  }, [item.notification.userId, allUsers, token]);

  // project
  useEffect(() => {
    const pid = item.notification.projectId;
    if (!pid) return;

    const inCache = allProjects?.find((p) => p._id === pid);
    if (inCache) {
      setProject(inCache);
    } else {
      axios
        .get(`${apiUrl}/projects`, { headers: { Authorization: token } })
        .then(({ data: projects }) =>
          setProject(projects.find((p) => p._id === pid) || null)
        )
        .catch(() => setProject(null));
    }
  }, [item.notification.projectId, allProjects, token]);

  // comment & reply
  useEffect(() => {
    const { projectId: pid, commentId: cid, replyId: rid } = item.notification;
    if (!cid) return;

    axios
      .get(`${apiUrl}/comments/${pid}/${cid}`)
      .then(({ data: comment }) => {
        setComment(comment);
        if (rid) {
          setReply(
            comment.replies.find((r) => r._id.toString() === rid) || null
          );
        }
      })
      .catch(() => {
        setComment(null);
        setReply(null);
      });
  }, [
    item.notification,
    item.notification.projectId,
    item.notification.commentId,
    item.notification.replyId,
  ]);

  // eslint-disable-next-line default-case
  switch (item.notification.alertType) {
    case "likesOnProjects":
      link = `/@${user.username}/${item.notification.projectId}`;
      title = alertUser?.username
        ? `${alertUser?.username || "Someone"} liked your project!`
        : "Loading...";
      body = alertProject?.name ? (
        <>
          <UserTag user={alertUser} userId={alertUser?.id} />
          <p> liked your project: "{alertProject?.name}"</p>
        </>
      ) : (
        <>
          <p>Loading...</p>
        </>
      );
      break;

    case "commentsOnProjects":
      link = `/@${user?.username}/${item.notification.projectId}#${item.notification.commentId}`;
      title = alertProject.name
        ? `New comment on project: "${alertProject.name}"`
        : "Loading...";
      body = alertComment?.content ? (
        <>
          <UserTag user={alertUser} userId={alertUser?.id} />
          <p>: {alertComment?.content}</p>
        </>
      ) : (
        <>
          <p>Loading...</p>
        </>
      );
      break;

    case "clonesOnProjects":
      link = `/@${user?.username}/${item.notification.projectId}`;
      title = alertUser?.username
        ? `${alertUser?.username || "Someone"} cloned your project!`
        : "Loading...";
      body = alertProject?.name ? (
        <>
          <UserTag user={alertUser} userId={alertUser?.id} />
          <p> cloned your project: "{alertProject.name}"</p>
        </>
      ) : (
        <>
          <p>Loading...</p>
        </>
      );
      break;

    case "repliesOnComments":
      link = `/@${alertProject?.owner?.username}/${item?.notification?.projectId}#${item?.notification?.replyId}`;
      title = alertUser?.username
        ? `${alertUser?.username || "Someone"} replied to your comment`
        : "Loading...";
      body = alertReply?.content ? (
        <>
          <UserTag user={alertUser} userId={alertUser?.id} />
          <p>: {alertReply?.content}</p>
        </>
      ) : (
        <>
          <p>Loading...</p>
        </>
      );
      break;

    case "tosChange":
      link = `/tos`;
      title = "DisFuse's Terms of Service were updated";
      body = (
        <>
          <p>
            We've made some changes to our Terms of Service. Please make sure to
            review the updates to stay up to date with our rules.
          </p>
        </>
      );
      break;

    case "projectInvite":
      link = `/@${alertProject?.owner?.username}/${item.notification.projectId}/workspace`;
      title = `${alertUser?.username || "Someone"} invited you to a project`;
      body = (
        <>
          <UserTag user={alertUser} userId={alertUser?.id} />
          <p> invited you to work on their project: "{alertProject?.name}"</p>
        </>
      );
      break;
  }

  function clearItem(e) {
    e.stopPropagation();

    user.inbox.splice(index, 1);

    axios.put(apiUrl + `/users/${user.id}/inbox`, user.inbox, {
      headers: { Authorization: token },
    });

    const element = document.querySelectorAll(".inbox-item");
    element[index].style.display = "none";
  }

  return (
    <div
      onClick={() => navigate(link)}
      className={`inbox-item${item.read ? "" : " unread"}`}
    >
      <div className="info">
        <div className="title">
          <div className="clearBtn" onClick={clearItem}>
            <i className="fa-solid fa-xmark"></i>
          </div>
          {title}
        </div>
        <div className="body">{body}</div>
        <i className="date">
          {ms(Date.now() - new Date(item.created).getTime(), { long: true })}{" "}
          ago
        </i>
      </div>
    </div>
  );
}
