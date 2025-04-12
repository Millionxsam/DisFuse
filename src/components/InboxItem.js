import axios from "axios";
import { useState } from "react";
import UserTag from "./UserTag";
import ms from "ms";
import { useNavigate } from "react-router-dom";

const { apiUrl } = require("../config/config.json");

export default function InboxItem({ item, user, index }) {
  let link, title, body;

  const token = localStorage.getItem("disfuse-token");

  const [alertUser, setUser] = useState({});
  const [alertProject, setProject] = useState({});
  const [alertComment, setComment] = useState({});
  const [alertReply, setReply] = useState({});

  const navigate = useNavigate();

  (async () => {
    if (item.notification.userId) {
      axios
        .get(apiUrl + `/users/${item.notification.userId}`, {
          headers: { Authorization: token },
        })
        .then(({ data: user }) => {
          setUser(user);
        });
    }

    if (item.notification.projectId) {
      axios
        .get(apiUrl + `/projects/${item.notification.projectId}`, {
          headers: { Authorization: token },
        })
        .then(({ data: project }) => {
          setProject(project);
        });
    }

    if (item.notification.commentId) {
      axios
        .get(
          apiUrl +
            `/comments/${item.notification.projectId}/${item.notification.commentId}`
        )
        .then(({ data: comment }) => {
          setComment(comment);

          if (item.notification.replyId) {
            setReply(
              comment.replies.find(
                (reply) => reply._id.toString() === item.notification.replyId
              )
            );
          }
        });
    }
  })();

  // eslint-disable-next-line default-case
  switch (item.notification.alertType) {
    case "likesOnProjects":
      link = `/@${user.username}/${item.notification.projectId}`;
      title = alertUser.username
        ? `${alertUser.username} liked your project!`
        : "Loading...";
      body = alertProject.name ? (
        <>
          <UserTag user={alertUser} /> liked your project: "{alertProject.name}"
        </>
      ) : (
        "Loading..."
      );
      break;

    case "commentsOnProjects":
      link = `/@${user.username}/${item.notification.projectId}#${item.notification.commentId}`;
      title = alertProject.name
        ? `New comment on project: "${alertProject.name}"`
        : "Loading...";
      body = alertComment.content ? (
        <>
          <UserTag user={alertUser} />: {alertComment.content}
        </>
      ) : (
        "Loading..."
      );
      break;

    case "clonesOnProjects":
      link = `/@${user.username}/${item.notification.projectId}`;
      title = alertUser.username
        ? `${alertUser.username} cloned your project!`
        : "Loading...";
      body = alertProject.name ? (
        <>
          <UserTag user={alertUser} /> cloned your project: "{alertProject.name}
          "
        </>
      ) : (
        "Loading..."
      );
      break;

    case "repliesOnComments":
      link = `/@${alertProject.owner?.username}/${item.notification.projectId}#${item.notification.replyId}`;
      title = alertUser.username
        ? `${alertUser.username} replied to your comment`
        : "Loading...";
      body = alertReply.content ? (
        <>
          <UserTag user={alertUser} />: {alertReply.content}
        </>
      ) : (
        "Loading..."
      );
      break;

    case "tosChanged":
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
      <div className="clearBtn" onClick={clearItem}>
        <i className="fa-solid fa-xmark"></i>
      </div>
      <div className="info">
        <h2>{title}</h2>
        <p>{body}</p>
        <i>
          {ms(Date.now() - new Date(item.created).getTime(), { long: true })}{" "}
          ago
        </i>
      </div>
    </div>
  );
}
