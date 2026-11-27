import { useLayoutEffect, useMemo, useRef } from "react";

import MessageComponents from "../../../components/control/MessageComponents";
import { avatarUrl, formatMessageDate } from "../../../components/control/discordUtils";
import { useBuilder } from "../../state/BuilderProvider.jsx";
import useBotInfo from "../../state/useBotInfo.js";
import { useFlowContext } from "../flow/FlowContext.js";
import { buildMessagePreview } from "./preview.js";

import "../../../styles/workspace/message-preview.css";

/* =====================================================================
   A built message, drawn like Discord draws it
   ---------------------------------------------------------------------
   Uses the Control client's real message renderer, wearing the bot's
   name and picture, exactly like the block editor's message preview.
   ===================================================================== */

export default function MessagePreviewCard({ spec, location, ephemeral = false, compact = false, notes: showNotes = true }) {
  const { catalog, builder, project } = useBuilder();
  const flow = useFlowContext();
  const bot = useBotInfo(project);

  const preview = useMemo(
    () => buildMessagePreview(spec, { catalog, builder, info: flow?.info, location: location ?? {} }),
    [builder, catalog, flow?.info, location, spec],
  );

  const author = bot.user?.id ? { id: bot.user.id, avatar: bot.user.avatar, bot: true } : null;

  /* The renderer is Control's, and its buttons explain themselves in
     Control's terms. Here they're a preview of what the bot will send. */
  const frame = useRef(null);
  useLayoutEffect(() => {
    for (const element of frame.current?.querySelectorAll(".dc-component-button, .dc-component-select") ?? [])
      element.title = "A preview. People can click it once your bot is running.";
  });

  return (
    <div ref={frame} className={`dfb-discord df-discord-surface ${compact ? "dfb-discord--compact" : ""}`}>
      <div className="dc-message">
        <div className="dc-message-body">
          <div className="dc-message-gutter">
            <img className="dc-avatar" src={author ? avatarUrl(author, 80) : bot.avatarUrl} alt="" loading="lazy" />
          </div>
          <div className="dc-message-main">
            <div className="dc-message-head">
              <span className="dc-author">{bot.user?.username || project?.name || "Your bot"}</span>
              <span className="dc-bot-tag">APP</span>
              <time>{formatMessageDate(Date.now())}</time>
            </div>
            {preview.message.components.length ? (
              <MessageComponents components={preview.message.components} message={preview.message} />
            ) : (
              <div className="dfb-discord__empty">This message is empty. Add a piece to it.</div>
            )}
            {ephemeral && (
              <div className="df-msg-preview-ephemeral">
                <i className="fa-solid fa-eye" aria-hidden /> Only you can see this
              </div>
            )}
          </div>
        </div>
      </div>
      {showNotes && preview.notes.length > 0 && (
        <ul className="dfb-discord__notes">
          {preview.notes.map((note) => (
            <li key={note}>
              <i className="fa-solid fa-triangle-exclamation" aria-hidden /> {note}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
