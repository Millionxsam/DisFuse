import axios from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Reply from "./Reply";
import Swal from "sweetalert2";

const { apiUrl } = require("../config/config.json");

export default function Comment({ project, comment: c, user, allUsers, index }) {
  const [author, setAuthor] = useState({});
  const [newLike, setNewLike] = useState(false);
  const [comment, setComment] = useState(c);

  useEffect(() => {
    setAuthor(allUsers.find((u) => u.id === comment.authorId));

    if (window.location.hash) {
      const commentEle = document.getElementById(
        window.location.hash.replace("#", "")
      );

      commentEle?.scrollIntoView({ behavior: "smooth" });
      commentEle?.classList.add("highlighted");
    }
  }, []);

  var likeButtonEnabled = true;
  function toggleLike() {
    if (!likeButtonEnabled) return;

    likeButtonEnabled = false;
    setTimeout(() => likeButtonEnabled = true, 700);

    axios
      .patch(apiUrl + `/comments/${project._id}/${comment._id}/likes`, null, {
        headers: {
          Authorization: localStorage.getItem("disfuse-token"),
        },
      })
      .then(({ data }) => {
        if (data.likes.includes(user.id)) setNewLike(true);
        setComment(data);
      });
  }

  function showReply() {
    document.querySelectorAll(".reply-container")[index].style.display =
      "block";
  }

  function postReply() {
    const content = document.querySelectorAll("textarea.replyInput")[index].value.trim();

    if (content == '') return;

    axios
      .post(
        apiUrl + `/comments/${project._id}/${comment._id}/replies`,
        {
          content,
        },
        {
          headers: { Authorization: localStorage.getItem("disfuse-token") },
        }
      )
      .then(({ data }) => {
        setComment(data);

        window.location.hash = data.replies[data.replies.length - 1]._id;
        window.location.reload();
      });
  }

  function editComment() {
    Swal.fire({
      input: "textarea",
      confirmButtonText: "Edit",
    }).then((r) => {
      if (!r.isConfirmed) return;

      axios
        .patch(
          apiUrl + `/comments/${project._id}/${comment._id}`,
          { content: r.value },
          { headers: { Authorization: localStorage.getItem("disfuse-token") } }
        )
        .then(() => window.location.reload());
    });
  }

  function delComment() {
    Swal.fire({
      icon: "warning",
      title: "Are you sure?",
      text: "Are you sure you want to delete this comment?",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    }).then((r) => {
      if (!r.isConfirmed) return;

      axios
        .delete(apiUrl + `/comments/${project._id}/${comment._id}`, {
          headers: { Authorization: localStorage.getItem("disfuse-token") },
        })
        .then(() => window.location.reload());
    });
  }

  return (
    <div id={`${comment?._id}`} className="comment">
      <div className="top">
        <Link to={`/@${author.username}`}>
          <img src={author.avatar} alt="" />
          <h3>{author.username}</h3>
        </Link>
        <i>
          {new Date(comment.created).toLocaleString([], {
            dateStyle: "long",
            timeStyle: "short",
          })}
          {comment.oldContent?.length ? " (edited)" : ""}
        </i>
      </div>
      <div className="middle">{comment?.content}</div>
      <div className="bottom">
        <div
          onClick={toggleLike}
          className={`like${comment?.likes?.includes(user.id) ? " active" : ""
            }${newLike ? " newLike" : ""}`}
        >
          <i class="fa-solid fa-heart"></i>
          <div>{comment?.likes?.length}</div>
        </div>
        <div onClick={showReply} className="reply">
          <i class="fa-solid fa-reply"></i>
        </div>
        {user.id === author.id ? (
          <>
            <div onClick={editComment} className="edit">
              <i class="fa-regular fa-pen-to-square"></i>
            </div>
            <div onClick={delComment} className="delete">
              <i class="fa-solid fa-trash-can"></i>
            </div>
          </>
        ) : (
          ""
        )}
      </div>
      <div style={{ display: "none" }} className="reply-container">
        <textarea placeholder="Reply" className="replyInput"></textarea>
        <button onClick={postReply} className="replyBtn">
          Reply
        </button>
      </div>
      <div className="replies">
        {comment?.replies?.map((reply) => (
          <Reply
            reply={reply}
            user={user}
            allUsers={allUsers}
            project={project}
            comment={comment}
          />
        ))}
      </div>
    </div>
  );
}
