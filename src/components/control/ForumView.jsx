import { useCallback, useEffect, useState } from "react";

import ControlModal from "./ControlModal";
import LoadingAnim from "../LoadingAnim";
import MessageContent from "./MessageContent";
import { avatarUrl, botCan, formatDayDivider, snowflakeDate } from "./discordUtils";

/* =====================================================================
   Forum and media channels
   ---------------------------------------------------------------------
   A forum isn't a channel with messages in it — it's a container of
   threads, and each thread is a post. Discord has no "list forum posts"
   endpoint either: live posts come from the guild's active threads and
   older ones from the channel's archive, which the backend stitches
   together (`forum.listPosts`).

   So this is a post list rather than a message list, with its own
   composer for starting a post. Opening a post switches to that thread,
   which from then on behaves like any other channel.
   ===================================================================== */

export default function ForumView({
  channel,
  guild,
  action,
  notify,
  onOpenPost,
  botId,
}) {
  const [state, setState] = useState({ loading: true, posts: [], error: null });
  const [composing, setComposing] = useState(false);
  const [tagFilter, setTagFilter] = useState(null);

  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true }));

    action("forum.listPosts", { channelId: channel.id, limit: 50 })
      .then((result) =>
        setState({ loading: false, posts: result.posts || [], error: null }),
      )
      .catch((err) =>
        setState({ loading: false, posts: [], error: err.message }),
      );
  }, [action, channel.id]);

  useEffect(() => {
    load();
  }, [load]);

  const tags = channel.availableTags || [];
  const canPost = botCan(
    channel,
    channel.type === 16 ? "SendMessages" : "CreatePublicThreads",
  );

  const shown = tagFilter
    ? state.posts.filter((post) => (post.appliedTags || []).includes(tagFilter))
    : state.posts;

  return (
    <div className="dc-forum">
      <div className="dc-forum-bar">
        {tags.length > 0 && (
          <div className="dc-forum-tags">
            <button
              className={tagFilter ? "" : "active"}
              onClick={() => setTagFilter(null)}
            >
              All posts
            </button>
            {tags.map((tag) => (
              <button
                key={tag.id}
                className={tagFilter === tag.id ? "active" : ""}
                onClick={() => setTagFilter(tag.id)}
              >
                {tag.emoji_name} {tag.name}
              </button>
            ))}
          </div>
        )}

        <div className="dc-forum-actions">
          <button onClick={load} title="Refresh">
            <i className="fa-solid fa-rotate-right"></i>
          </button>
          {canPost && (
            <button className="dc-primary" onClick={() => setComposing(true)}>
              <i className="fa-solid fa-plus"></i> New Post
            </button>
          )}
        </div>
      </div>

      {state.loading ? (
        <div className="dc-messages-loading">
          <LoadingAnim onlySpinner />
        </div>
      ) : state.error ? (
        <div className="dc-empty-channel">
          <i className="fa-solid fa-triangle-exclamation"></i>
          <p>{state.error}</p>
          <button onClick={load}>
            <i className="fa-solid fa-rotate-right"></i> Try again
          </button>
        </div>
      ) : shown.length ? (
        <div className="dc-forum-posts">
          {shown.map((post) => (
            <ForumPost
              key={post.id}
              post={post}
              tags={tags}
              onOpen={() => onOpenPost(post.id)}
            />
          ))}
        </div>
      ) : (
        <div className="dc-empty-channel">
          <i className="fa-solid fa-comments"></i>
          <p>
            {tagFilter
              ? "No posts with that tag."
              : canPost
                ? "No posts here yet. Start the first one."
                : "No posts here yet, and the bot can't create one."}
          </p>
        </div>
      )}

      {composing && (
        <NewPost
          channel={channel}
          guild={guild}
          action={action}
          notify={notify}
          onClose={() => setComposing(false)}
          onCreated={(thread) => {
            setComposing(false);
            load();
            onOpenPost(thread.id);
          }}
        />
      )}
    </div>
  );
}

function ForumPost({ post, tags, onOpen }) {
  const applied = (post.appliedTags || [])
    .map((id) => tags.find((tag) => tag.id === id))
    .filter(Boolean);

  const archived = post.threadMetadata?.archived;

  return (
    <button className={`dc-forum-post${archived ? " archived" : ""}`} onClick={onOpen}>
      <div className="dc-forum-post-head">
        <h3>{post.name}</h3>
        {archived && (
          <span className="dc-forum-flag">
            <i className="fa-solid fa-box-archive"></i> Archived
          </span>
        )}
        {post.threadMetadata?.locked && (
          <span className="dc-forum-flag">
            <i className="fa-solid fa-lock"></i> Locked
          </span>
        )}
      </div>

      {applied.length > 0 && (
        <div className="dc-forum-post-tags">
          {applied.map((tag) => (
            <span key={tag.id}>
              {tag.emoji_name} {tag.name}
            </span>
          ))}
        </div>
      )}

      <div className="dc-forum-post-meta">
        <span>
          <i className="fa-solid fa-message"></i> {post.messageCount ?? 0}
        </span>
        <span>
          <i className="fa-solid fa-users"></i> {post.memberCount ?? 0}
        </span>
        <span>
          <i className="fa-solid fa-clock"></i>{" "}
          {formatDayDivider(snowflakeDate(post.id))}
        </span>
      </div>
    </button>
  );
}

function NewPost({ channel, guild, action, notify, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);

  const tags = channel.availableTags || [];

  async function create() {
    setBusy(true);

    try {
      const result = await action("thread.create", {
        channelId: channel.id,
        name,
        content,
        appliedTags: selected.length ? selected : undefined,
      });

      notify.success("Post created.");
      onCreated(result.thread);
    } catch (err) {
      notify.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ControlModal
      title={`New post in ${channel.name}`}
      icon="fa-solid fa-pen-to-square"
      subtitle="Posted by the bot"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose}>Cancel</button>
          <button
            className="dc-primary"
            disabled={busy || !name.trim() || !content.trim()}
            onClick={create}
          >
            {busy ? "Posting…" : "Post"}
          </button>
        </>
      }
    >
      <label>
        Title
        <input
          type="text"
          maxLength={100}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="What's this post about?"
        />
      </label>

      <label>
        First message
        <textarea
          rows={6}
          maxLength={2000}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="A forum post needs an opening message."
        />
      </label>

      {tags.length > 0 && (
        <section className="dc-panel-section">
          <h4>Tags (up to 5)</h4>
          <div className="dc-forum-tags">
            {tags.map((tag) => (
              <button
                key={tag.id}
                className={selected.includes(tag.id) ? "active" : ""}
                onClick={() =>
                  setSelected((current) =>
                    current.includes(tag.id)
                      ? current.filter((id) => id !== tag.id)
                      : current.length >= 5
                        ? current
                        : [...current, tag.id],
                  )
                }
              >
                {tag.emoji_name} {tag.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {content && (
        <section className="dc-panel-section">
          <h4>Preview</h4>
          <div className="dc-forum-preview">
            <img src={avatarUrl(guild?.self?.user, 40)} alt="" />
            <div>
              <strong>{guild?.self?.nick || guild?.self?.user?.username}</strong>
              <MessageContent content={content} guild={guild} />
            </div>
          </div>
        </section>
      )}
    </ControlModal>
  );
}
