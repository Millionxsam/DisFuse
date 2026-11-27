import { useEffect, useState } from "react";
import axios from "axios";

/* v10, like the editor's token check (Pages/Workspace/editor/
   projectGuards.js): the site-wide discordUrl is v6, which doesn't
   report server counts. */
const discordUrl = "https://discord.com/api/v10";

/* =====================================================================
   DisFuse Builder: the bot, as Discord sees it
   ---------------------------------------------------------------------
   The dashboard's header: name, picture, banner, server count and so
   on, read with the project's own bot token straight from the browser,
   the same way the new-project and edit pages already check a token.

   Plain axios, never the DisFuse API client: a DisFuse header has no
   business on a request to Discord.

   Answers are kept for the session per token, so moving around the
   dashboard doesn't ask Discord again every time.
   ===================================================================== */

const cache = new Map();

async function fetchBot(token) {
  const headers = { Authorization: `Bot ${token}` };
  const [user, application] = await Promise.all([
    axios.get(`${discordUrl}/users/@me`, { headers, timeout: 10_000 }).then((r) => r.data),
    axios
      .get(`${discordUrl}/applications/@me`, { headers, timeout: 10_000 })
      .then((r) => r.data)
      .catch(() => null),
  ]);
  return { user, application };
}

/**
 * @param {object|null} project
 * @returns {{ user, application, guildCount, userInstallCount, loading, error, tokenInvalid, inviteUrl, avatarUrl, bannerUrl }}
 */
export default function useBotInfo(project) {
  const token = project?.botToken && project.botToken !== "[HIDDEN]" ? project.botToken : null;
  const [state, setState] = useState(() => (token && cache.get(token)) || { loading: Boolean(token) });

  useEffect(() => {
    if (!token) {
      setState({ loading: false });
      return undefined;
    }
    if (cache.has(token)) {
      setState(cache.get(token));
      return undefined;
    }

    let current = true;
    setState({ loading: true });
    fetchBot(token)
      .then((info) => {
        const next = { ...info, loading: false };
        cache.set(token, next);
        if (current) setState(next);
      })
      .catch((error) => {
        const next = { loading: false, error: true, tokenInvalid: error.response?.status === 401 };
        if (current) setState(next);
      });
    return () => {
      current = false;
    };
  }, [token]);

  /* Falls back to what DisFuse saved about the bot when Discord can't be
     asked (someone else's project, or a network problem). */
  const user = state.user ?? project?.bot ?? null;
  const id = user?.id ?? project?.bot?.id;
  const permissions = Number(project?.permissions) || 0;

  return {
    ...state,
    user,
    guildCount: state.application?.approximate_guild_count ?? null,
    userInstallCount: state.application?.approximate_user_install_count ?? null,
    inviteUrl: id
      ? `https://discord.com/oauth2/authorize?client_id=${id}&permissions=${permissions}&scope=bot%20applications.commands&integration_type=0`
      : null,
    avatarUrl: user?.avatar
      ? `https://cdn.discordapp.com/avatars/${id}/${user.avatar}.${user.avatar.startsWith("a_") ? "gif" : "png"}?size=256`
      : `https://cdn.discordapp.com/embed/avatars/${Number(BigInt(id ?? 0) >> 22n) % 6}.png`,
    bannerUrl: user?.banner
      ? `https://cdn.discordapp.com/banners/${id}/${user.banner}.${user.banner.startsWith("a_") ? "gif" : "png"}?size=1024`
      : null,
  };
}
