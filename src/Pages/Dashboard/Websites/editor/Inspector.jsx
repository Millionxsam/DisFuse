import { useState } from "react";

import {
  elementScope,
  fontOptions,
  getElementDef,
  styleGroups,
  themeTokens,
} from "../../../../config/websiteElements";
import { themePresets } from "../../../../config/websiteDefaults";
import {
  collectDashboardSettings,
  pageUsesDashboard,
  websiteUsesScope,
} from "../../../../functions/websiteTree";
import { ColorInput, Field, PropField } from "./PropertyControls";
import { DashboardAccess, LinkedProject, PublicAddress } from "./SiteSettings";

/** Right-hand panel: the selected element's settings, or site-wide settings. */
export default function Inspector({ editor }) {
  const [tab, setTab] = useState("element");
  const { website, pages, selectedNode } = editor;

  return (
    <div className="df-ws-panel-inner">
      <div className="df-ws-tabs">
        <button
          className={tab === "element" ? "active" : ""}
          onClick={() => setTab("element")}
        >
          <i className="fa-solid fa-sliders"></i> Element
        </button>
        <button
          className={tab === "site" ? "active" : ""}
          onClick={() => setTab("site")}
        >
          <i className="fa-solid fa-palette"></i> Site
        </button>
      </div>

      <div className="df-ws-panel-scroll">
        {tab === "element" ? (
          selectedNode ? (
            <ElementInspector
              editor={editor}
              node={selectedNode}
              pages={pages}
            />
          ) : (
            <div className="df-ws-hint">
              <i className="fa-solid fa-arrow-pointer"></i>
              <p>Select an element on the page to edit it.</p>
            </div>
          )
        ) : (
          <SiteInspector editor={editor} website={website} />
        )}
      </div>
    </div>
  );
}

/* ---- Element tab ------------------------------------------------------ */

function ElementInspector({ editor, node, pages }) {
  const def = getElementDef(node.type);
  if (!def) return null;

  const setProp = (key, value) =>
    editor.updateElement(
      node.id,
      { props: { [key]: value } },
      `prop:${node.id}:${key}`,
    );

  return (
    <>
      <div className="df-ws-inspector-head">
        <span className="df-ws-el-icon">
          <i className={def.icon}></i>
        </span>
        <div>
          <strong>{def.label}</strong>
          {def.dashboard && (
            <span className="df-ws-chip dashboard">Dashboard</span>
          )}
        </div>
        <button title="Select parent" onClick={editor.selectParent}>
          <i className="fa-solid fa-turn-up"></i>
        </button>
      </div>

      {def.hint && <p className="df-ws-inspector-hint">{def.hint}</p>}

      {def.props.length > 0 && (
        <section className="df-ws-section">
          <h4>Content</h4>
          {def.props.map((field) => (
            <PropField
              key={`${node.id}:${field.key}`}
              field={field}
              pages={pages}
              value={node.props?.[field.key]}
              onChange={(value) => setProp(field.key, value)}
            />
          ))}
        </section>
      )}

      {def.styles.map((groupKey) => {
        const group = styleGroups[groupKey];
        if (!group) return null;

        return (
          <details className="df-ws-style-group" key={groupKey}>
            <summary>
              <i className={group.icon}></i> {group.label}
            </summary>
            {group.fields.map((field) => (
              <PropField
                key={`${node.id}:${field.key}`}
                field={field}
                pages={pages}
                value={node.style?.[field.key] ?? ""}
                onChange={(value) =>
                  editor.setElementStyle(
                    node.id,
                    field.key,
                    value,
                    `style:${node.id}:${field.key}`,
                  )
                }
              />
            ))}
          </details>
        );
      })}

      <div className="df-ws-inspector-actions">
        <button onClick={() => editor.duplicateElement(node.id)}>
          <i className="fa-solid fa-clone"></i> Duplicate
        </button>
        <button className="red" onClick={() => editor.deleteElement(node.id)}>
          <i className="fa-solid fa-trash"></i> Delete
        </button>
      </div>
    </>
  );
}

/* ---- Site tab --------------------------------------------------------- */

function SiteInspector({ editor, website }) {
  const theme = website.config?.theme || {};
  const dashboardPages = (website.config?.pages || []).filter(
    pageUsesDashboard,
  );
  const usesServerSettings = websiteUsesScope(website, "guild");
  const usesUserSettings = websiteUsesScope(website, "user");

  return (
    <>
      <section className="df-ws-section">
        <h4>Website</h4>

        <Field label="Name">
          <input
            type="text"
            value={website.name || ""}
            onChange={(e) => editor.updateMeta({ name: e.target.value })}
          />
        </Field>

        <Field
          label="Published"
          inline
          help={
            website.published
              ? "Anyone with the link can see this website."
              : "Only you can see this website until you publish it."
          }
        >
          <label className="switch">
            <input
              type="checkbox"
              checked={Boolean(website.published)}
              onChange={(e) =>
                editor.updateMeta({ published: e.target.checked })
              }
            />
            <span className="slider"></span>
          </label>
        </Field>
      </section>

      <PublicAddress editor={editor} />

      <LinkedProject editor={editor} />

      <section className="df-ws-section">
        <h4>Search engine preview</h4>

        <Field label="Title">
          <input
            type="text"
            value={website.config?.seo?.title || ""}
            onChange={(e) =>
              editor.updateSeo({ title: e.target.value }, "seo:title")
            }
          />
        </Field>

        <Field label="Description">
          <textarea
            rows={3}
            value={website.config?.seo?.description || ""}
            onChange={(e) =>
              editor.updateSeo(
                { description: e.target.value },
                "seo:description",
              )
            }
          />
        </Field>
      </section>

      <section className="df-ws-section">
        <h4>Theme</h4>

        <div className="df-ws-presets">
          {themePresets.map((preset) => (
            <button
              type="button"
              key={preset.id}
              title={preset.label}
              onClick={() => editor.updateTheme({ colors: preset.colors })}
            >
              <span style={{ background: preset.colors.background }}>
                <em style={{ background: preset.colors.primary }} />
                <em style={{ background: preset.colors.surface }} />
              </span>
              {preset.label}
            </button>
          ))}
        </div>

        {themeTokens.map((token) => (
          <Field label={token.label} key={token.key}>
            <ColorInput
              value={theme.colors?.[token.key] || ""}
              onChange={(value) =>
                editor.updateTheme(
                  { colors: { [token.key]: value } },
                  `theme:${token.key}`,
                )
              }
            />
          </Field>
        ))}
      </section>

      <section className="df-ws-section">
        <h4>Typography & shape</h4>

        <Field label="Body font">
          <select
            value={theme.fonts?.body || ""}
            onChange={(e) =>
              editor.updateTheme({ fonts: { body: e.target.value } })
            }
          >
            {fontOptions.map((font) => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Heading font">
          <select
            value={theme.fonts?.heading || ""}
            onChange={(e) =>
              editor.updateTheme({ fonts: { heading: e.target.value } })
            }
          >
            {fontOptions.map((font) => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Corner radius">
          <input
            type="text"
            value={theme.radius || ""}
            placeholder="16px"
            onChange={(e) =>
              editor.updateTheme({ radius: e.target.value }, "theme:radius")
            }
          />
        </Field>

        <Field
          label="Content width"
          help="How wide contained sections can grow."
        >
          <input
            type="text"
            value={theme.contentWidth || ""}
            placeholder="1100px"
            onChange={(e) =>
              editor.updateTheme(
                { contentWidth: e.target.value },
                "theme:width",
              )
            }
          />
        </Field>
      </section>

      <section className="df-ws-section">
        <h4>Dashboard</h4>

        {dashboardPages.length === 0 ? (
          <p className="df-ws-note">
            This website has no dashboard controls, so visitors never have to
            log in. Add controls from the <strong>Dashboard controls</strong>{" "}
            category to let people configure your bot.
          </p>
        ) : (
          <>
            <p className="df-ws-note">
              Visitors log in with Discord on these pages. Read and write these
              keys from your bot using the <strong>Dashboard</strong> blocks in
              your project's workspace.
            </p>

            {usesServerSettings && <DashboardAccess editor={editor} />}

            {usesUserSettings && (
              <p className="df-ws-note">
                <i className="fa-solid fa-user"></i> Per-user settings belong to
                the Discord user and apply everywhere, so visitors reach them
                straight after logging in. No server is involved and the access
                rule above doesn't apply to them.
              </p>
            )}

            {dashboardPages.map((page) => (
              <div className="df-ws-data-page" key={page.id}>
                <strong>
                  <i className="fa-solid fa-lock"></i> {page.name}
                </strong>
                <ul>
                  {collectDashboardSettings(page).map((node) => (
                    <li key={node.id}>
                      <code>{node.props.settingKey}</code>
                      <span>
                        {node.props.label}
                        <em className={`df-ws-scope ${elementScope(node)}`}>
                          {elementScope(node) === "user"
                            ? "per user"
                            : "per server"}
                        </em>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </>
        )}
      </section>
    </>
  );
}
