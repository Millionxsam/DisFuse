import axios from "axios";
import { userCache } from "../cache.ts";
import { apiUrl } from "../config/config";
import getExportFiles from "../config/getExportFiles";
import { useEffect, useState } from "react";
import LoadingAnim from "./LoadingAnim.js";

export default function HostModal({ socket, workspace, project }) {
  const [loading, setLoading] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState([
    "Click the run button to start your bot",
  ]);
  const [status, setStatus] = useState("offline");

  useEffect(() => {
    if (!socket) return;

    socket.emit("botJoin", { projectId: project._id }, (status) =>
      setStatus(status)
    );

    const handleLog = ({ log }) => {
      setConsoleLogs((prev) => [...prev, log]);
    };

    const handleError = ({ log }) => {
      setConsoleLogs((prev) => [...prev, log]);
    };

    const handleStatus = (data) => {
      console.log(data);

      setConsoleLogs((prev) => [
        ...prev,
        data.status === "offline"
          ? `Exited with code ${data.exitCode}`
          : "Server marked as online",
      ]);
      setStatus(data.status);
      if (data.status === "online") setLoading(false);
    };

    socket.on("botLog", handleLog);
    socket.on("botError", handleError);
    socket.on("botStatus", handleStatus);

    // Cleanup to prevent stacking
    return () => {
      socket.off("botLog", handleLog);
      socket.off("botError", handleError);
      socket.off("botStatus", handleStatus);
    };
  }, [project._id, socket]);

  return (
    <dialog className="hostModal">
      <div className="hostContainer">
        <i
          onClick={() => document.querySelector(".hostModal").close()}
          className="fa-solid fa-xmark closeModal"
        ></i>
        <h1 className="hostingTitle">Hosting</h1>
        <div className="infoBox">
          <div className="info">
            <h2>{project.name}</h2>
            <p>
              Status: <span className={status}>{status}</span>
            </p>
          </div>
          <div className="buttons">
            <button
              className={
                status === "online" ||
                project?.owner?.id !== userCache?.user?.id ||
                loading
                  ? "disabled"
                  : ""
              }
              onClick={runBot}
            >
              {loading ? (
                <LoadingAnim onlySpinner />
              ) : (
                <i className="fa-solid fa-play"></i>
              )}
              Run
            </button>
            <button
              className={
                status === "offline" ||
                project?.owner?.id !== userCache?.user?.id
                  ? "disabled"
                  : ""
              }
              onClick={stopBot}
            >
              <i className="fa-solid fa-stop"></i>
              Stop
            </button>
          </div>
        </div>
        <h2 className="consoleLabel">Console</h2>
        <div className="console">
          {consoleLogs.map((log) => (
            <div>{log}</div>
          ))}
        </div>
      </div>
    </dialog>
  );

  async function runBot() {
    setLoading(true);

    setConsoleLogs((prev) => [
      ...prev,
      "Getting started... This may take a few minutes if you're running your bot for the first time.",
      " ",
    ]);

    let installedBlockPacks = [];
    let deps = [];

    const responses = await Promise.all(
      userCache.user.installedBlockPacks?.map((packId) =>
        axios.get(apiUrl + `/workshop/${packId}`, {
          headers: {
            Authorization: localStorage.getItem("disfuse-token"),
          },
        })
      )
    );

    installedBlockPacks = responses.map((response) => response.data);

    installedBlockPacks.forEach((bp) => deps.push(...(bp.dependencies || [])));

    const code = document.querySelector(".project.code code").innerText;
    const packageJson = getExportFiles(deps, workspace.getAllBlocks(false))[1]
      .content;
    const envFile = `${project.secrets
      .map((s) => `${s.name}=${s.value}`)
      .join("\n")}`;

    socket.emit("botStart", {
      code,
      packageJson,
      envFile,
    });
  }

  async function stopBot() {
    socket.emit("botStop");
  }
}
