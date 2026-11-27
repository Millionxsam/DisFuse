/** Emitted once per project by functions/updateCode.js. */
export const dashboardHelpers = `
/* DisFuse dashboard data */
const DISFUSE_DASHBOARD_API = "https://api.disfuse.xyz/dashboard";
async function disfuseDashboard(method, scope, id, key, value) {
  if (!id) return null;
  try {
    const response = await axios({
      method,
      url: \`\${DISFUSE_DASHBOARD_API}/\${scope}/\${encodeURIComponent(String(id))}\` +
        (key ? \`/\${encodeURIComponent(String(key))}\` : ""),
      headers: { Authorization: \`Bot \${process.env.DISFUSE_SECURE_BOT_TOKEN}\` },
      ...(value === undefined ? {} : { data: { value } }),
    });
    return method === "get" ? (response.data?.value ?? null) : response.data;
  } catch (error) {
    console.error(
      "DisFuse dashboard request failed:",
      error.response?.data?.error || error.message
    );
    return null;
  }
}`.trim();
