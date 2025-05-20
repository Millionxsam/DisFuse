import axios from "axios";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { userCache } from "../cache.ts";

const { apiUrl } = require("../config/config.js");

export default function InviteModal({ project, onSave }) {
  const [collaborators, setCollaborators] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    setCollaborators(
      (project.collaborators || []).map((u) =>
        allUsers.find((user) => user.id === u)
      )
    );

    document.querySelector("button.invite").addEventListener("click", () => {
      if (project.owner?.id !== userCache.user.id) return;

      document.querySelector(".inviteModal").showModal();
      setCollaborators(
        (project.collaborators || []).map((u) =>
          allUsers.find((user) => user.id === u)
        )
      );
    });
  }, [allUsers, project.collaborators, project.owner?.id]);

  useEffect(() => {
    axios.get(apiUrl + "/users").then(({ data }) => setAllUsers(data));
  }, [project.collaborators]);

  return (
    <dialog className="inviteModal">
      <div className="inviteContainer">
        <h1>Add Collaborators</h1>
        <div>
          <input
            type="text"
            id="collaboratorsInput"
            placeholder="Type a username"
            list="usernames"
          />
          <datalist id="usernames">
            {allUsers.map((i) => (
              <option value={i.username} />
            ))}
          </datalist>
          <button onClick={addUser}>Add</button>
        </div>

        <ul>
          {collaborators.length ? (
            collaborators.map((u, index) => (
              <div>
                <img src={u?.avatar} alt="" />
                <div>
                  <h2>{u?.displayName}</h2>
                  <p>@{u?.username}</p>
                </div>
                <i
                  onClick={() => removeUser(index)}
                  className="fa-solid fa-xmark removeCollaborator"
                ></i>
              </div>
            ))
          ) : (
            <p style={{ marginTop: "1rem" }}>No collaborators added</p>
          )}
        </ul>

        <div className="buttons">
          <button onClick={saveUsers}>Save</button>
          <button
            onClick={() => document.querySelector(".inviteModal").close()}
          >
            Cancel
          </button>
        </div>
      </div>
    </dialog>
  );

  function addUser() {
    const username = document.querySelector("#collaboratorsInput").value;
    if (!allUsers.find((u) => u.username === username)) return;
    document.querySelector("#collaboratorsInput").value = "";

    const c = [...collaborators];

    c.push(allUsers.find((u) => u.username === username));
    setCollaborators(c);
  }

  function removeUser(index) {
    const c = [...collaborators];
    c.splice(index, 1);
    setCollaborators(c);
  }

  function saveUsers() {
    axios
      .patch(
        apiUrl + `/projects/${project._id}/collaborators`,
        {
          collaborators: collaborators.map((u) => u.id),
        },
        {
          headers: {
            Authorization: localStorage.getItem("disfuse-token"),
          },
        }
      )
      .then(({ data }) => {
        Swal.fire({
          toast: true,
          text: "Changes saved",
          icon: "success",
          timer: 5000,
          position: "top-right",
          timerProgressBar: true,
          showConfirmButton: false,
        });

        document.querySelector(".inviteModal").close();
        onSave(data);
      });
  }
}
