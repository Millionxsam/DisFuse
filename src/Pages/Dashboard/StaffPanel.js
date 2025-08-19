import axios from "axios";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { userCache } from "../../cache.ts";
const { apiUrl, discordUrl } = require("../../config/config.js");

export default function StaffPanel() {
  const [activeTab, setActiveTab] = useState("users");

  const [localUser, setLocalUser] = useState();
  const [users, setUsers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [projects, setProjects] = useState([]);

  const [suspendProjectId, setSuspendProjectId] = useState("");
  const [suspendToggle, setSuspendToggle] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");

  useEffect(() => {
    if (!localUser && !userCache.localUser) {
      const token = localStorage.getItem("disfuse-token");

      axios
        .get(discordUrl + "/users/@me", { headers: { Authorization: token } })
        .then(({ data: user }) => {
          setLocalUser(user);
          userCache.localUser = user;

          return axios.get(apiUrl + "/users/staff", {
            headers: { Authorization: token },
          });
        })
        .then(({ data: newStaff }) => {
          setStaff(newStaff);
          userCache.allStaff = newStaff;

          const staffUser = newStaff.users.find(
            (u) => u.id === userCache.localUser?.id
          );
          if (
            !staffUser ||
            !(staffUser.moderator || staffUser.admin || staffUser.owner)
          ) {
            return;
          }
        });

      if (!userCache.allUsers) {
        axios
          .get(apiUrl + "/users", { headers: { Authorization: token } })
          .then(({ data: allUsers }) => {
            userCache.allUsers = allUsers;

            const seen = new Map();
            for (const i of allUsers) {
              if (!seen.has(i.id)) seen.set(i.id, i);
            }
            setUsers(Array.from(seen.values()));
          });
      } else {
        const seen = new Map();
        for (const i of userCache.allUsers) {
          if (!seen.has(i.id)) seen.set(i.id, i);
        }
        setUsers(Array.from(seen.values()));
      }

      if (!userCache.allProjects) {
        axios
          .get(apiUrl + "/projects", { headers: { Authorization: token } })
          .then(({ data }) => {
            userCache.allProjects = data;
            setProjects(data);
            console.log(userCache.allProjects);
          });
      } else {
        setProjects(userCache.allProjects);
        console.log(userCache.allProjects);
      }
    }
  }, [localUser]);

  async function getIdByName(username) {
    return (users.find((u) => u.username === username) ?? { id: null }).id;
  }

  async function banUser() {
    const user = document.getElementById("usernameBan").value;
    const dateText = document.getElementById("dateBan").value;
    if (!user || !dateText) return;
    const id = await getIdByName(user);
    if (!id) {
      return Swal.fire("User Error", "This user doesn't exist", "error");
    }
    const date = new Date(dateText);
    if (new Date() >= date) {
      return Swal.fire("Date Error", "This date has already passed", "error");
    }
    Swal.fire({
      title: `Ban @${user}?`,
      text: `They won't be able to access DisFuse until ${dateText}!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ban",
    }).then((response) => {
      if (response.isConfirmed) {
        axios
          .put(
            `${apiUrl}/users/${id}/ban`,
            { banUntil: date },
            {
              headers: { Authorization: localStorage.getItem("disfuse-token") },
            }
          )
          .then(() =>
            Swal.fire("Ban Successful", `@${user} has been banned!`, "success")
          );
      }
    });
  }

  async function unbanUser() {
    const user = document.getElementById("usernameBan").value;
    if (!user) return;
    const id = await getIdByName(user);
    if (!id) {
      return Swal.fire("User Error", "This user doesn't exist", "error");
    }
    Swal.fire({
      title: `Unban @${user}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Unban",
    }).then((response) => {
      if (response.isConfirmed) {
        axios
          .put(
            `${apiUrl}/users/${id}/ban`,
            { banUntil: new Date(0) },
            {
              headers: { Authorization: localStorage.getItem("disfuse-token") },
            }
          )
          .then(() =>
            Swal.fire(
              "Unban Successful",
              `@${user} has been unbanned!`,
              "success"
            )
          );
      }
    });
  }

  function suspendProject() {
    if (!suspendProjectId) {
      return Swal.fire("Error", "Please enter a project ID", "error");
    }
    const token = localStorage.getItem("disfuse-token");
    axios
      .patch(
        `${apiUrl}/projects/${suspendProjectId}/suspend`,
        { suspend: suspendToggle, reason: suspendReason || "No reason set." },
        { headers: { Authorization: token } }
      )
      .then(() => {
        Swal.fire(
          "Success",
          `Project ${
            projects.find((i) => i._id === suspendProjectId)?.name ??
            suspendProjectId
          } has been ${suspendToggle ? "suspended" : "unsuspended"}`,
          "success"
        );
      })
      .catch((err) =>
        Swal.fire(
          "Error",
          err?.response?.data?.message || "Failed to update project.",
          "error"
        )
      );
  }

  function sendTOSchange() {
    const staffUser = staff.users.find((u) => u.id === localUser.id);
    if (!staffUser.admin && !staffUser.owner) {
      return Swal.fire(
        "Access Denied",
        "You must be an admin to use this.",
        "error"
      );
    }
    Swal.fire({
      title: "Send TOS change alert?",
      text: "This will be sent to ALL DisFuse users",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Confirm",
    }).then((response) => {
      if (response.isConfirmed) {
        axios
          .post(
            `${apiUrl}/users/tosChangeWarning`,
            {},
            {
              headers: { Authorization: localStorage.getItem("disfuse-token") },
            }
          )
          .then(() =>
            Swal.fire(
              "Alert Successful",
              "The alert was successfully sent!",
              "success"
            )
          );
      }
    });
  }

  return (
    <div className="adminDashboard-container">
      <div className="head">
        <i className="fa-solid fa-user-tie"></i> Staff Panel
      </div>

      <div className="tabs">
        <button
          className={activeTab === "users" ? "active" : ""}
          onClick={() => setActiveTab("users")}
        >
          Users
        </button>
        <button
          className={activeTab === "projects" ? "active" : ""}
          onClick={() => setActiveTab("projects")}
        >
          Projects
        </button>
        <button
          className={activeTab === "admin" ? "active" : ""}
          onClick={() => setActiveTab("admin")}
        >
          Admin
        </button>
      </div>

      {activeTab === "users" && (
        <>
          <div className="inline">
            <label htmlFor="usernameBan">Username to ban/unban:</label>
            <input type="text" id="usernameBan" list="usernames" />
            <datalist id="usernames">
              {users.map((i) => (
                <option value={i.username} key={i.id} />
              ))}
            </datalist>
          </div>
          <div className="inline">
            <label htmlFor="dateBan">Ban until date:</label>
            <input type="date" id="dateBan" />
          </div>
          <div className="inline">
            <button onClick={banUser} className="red">
              <i className="fa-solid fa-ban"></i> Ban User
            </button>
            <button onClick={unbanUser}>
              <i className="fa-solid fa-thumbs-up"></i> Unban User
            </button>
          </div>
        </>
      )}

      {activeTab === "projects" && (
        <>
          {suspendProjectId && (
            <h2>
              Project:{" "}
              {projects.find((i) => i._id === suspendProjectId)?.name ?? "none"}
            </h2>
          )}
          <div className="inline">
            <label htmlFor="projectSuspendId">Project ID:</label>
            <input
              type="text"
              id="projectSuspendId"
              value={suspendProjectId}
              onChange={(e) => setSuspendProjectId(e.target.value)}
            />
          </div>
          <div className="inline">
            <label htmlFor="projectSuspendToggle">Suspend:</label>
            <input
              type="checkbox"
              id="projectSuspendToggle"
              checked={suspendToggle}
              onChange={() => setSuspendToggle(!suspendToggle)}
            />
          </div>
          <div className="inline">
            <label htmlFor="suspendReason">Reason:</label>
            <input
              type="text"
              id="suspendReason"
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
            />
          </div>
          <div className="inline">
            <button onClick={suspendProject}>
              <i className="fa-solid fa-pencil" /> Apply
            </button>
          </div>
        </>
      )}

      {activeTab === "admin" && (
        <div className="inline">
          <button onClick={sendTOSchange}>
            <i className="fa-solid fa-scroll"></i> Send TOS Change Alert
          </button>
        </div>
      )}
    </div>
  );
}
