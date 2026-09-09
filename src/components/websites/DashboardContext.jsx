import { createContext, useContext } from "react";

/**
 * Runtime state for a website's *optional* dashboard functionality.
 *
 * Only pages that contain dashboard elements are wrapped in this provider.
 * A plain informational website never creates one, and every dashboard
 * element renders read-only when the context is missing.
 *
 * Values are split by scope, matching how the API stores them:
 *
 *   values.guild — website.data.guilds[guild.id], shared by everyone who
 *                  manages that Discord server
 *   values.user  — website.data.users[visitor.id], private to this visitor
 *
 * Shape:
 *   {
 *     guild:     { id, name, icon } | null   the server being configured
 *     values:    { guild: {…}, user: {…} }
 *     setValue:  (scope, key, value) => void  scope is "guild" | "user"
 *     save:      () => Promise<void>
 *     saving:    boolean
 *     dirty:     boolean
 *     resources: { channels: [], roles: [] } for the channel/role pickers
 *     switchGuild: () => void
 *     readOnly:  boolean                     true in the builder's preview
 *   }
 */
export const DashboardContext = createContext(null);

export function useDashboard() {
  return useContext(DashboardContext);
}
