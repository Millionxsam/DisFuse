import { PERMISSION_GROUPS, PRESETS, cleanPermissionList, presetFor, togglePermission } from "../../model/permissions.js";
import { Badge, Checkbox } from "../../ui/index.js";

/* =====================================================================
   Choosing someone's permissions
   ---------------------------------------------------------------------
   <PermissionEditor value={[...ids]} onChange={(ids) => ...} />

   A row of quick presets ("Can view", "Can build", "Full access"), then
   every permission as a checkbox, grouped the way the builder is laid
   out (Commands, Steps in commands, Events...). Each group can be ticked
   all at once.

   `allowed` limits what can be ticked or unticked: a collaborator who
   manages other people can only hand out what they have themselves (the
   API checks the same thing). Leave it out for the owner.

   Without `onChange` it just shows what someone can do.
   ===================================================================== */

export function permissionSummary(list) {
  const preset = presetFor(list);
  if (preset) return preset.label;
  const count = cleanPermissionList(list).length;
  return `${count} permission${count === 1 ? "" : "s"}`;
}

export default function PermissionEditor({ value = [], onChange, allowed = null }) {
  const editable = typeof onChange === "function";
  const held = new Set(value);
  const may = (id) => editable && (!allowed || allowed.includes(id));
  const current = presetFor(value);

  /* A preset only changes what the editor is allowed to change. */
  const applyPreset = (preset) => {
    const keep = value.filter((id) => !may(id));
    const add = preset.permissions.filter(may);
    onChange(cleanPermissionList([...keep, ...add]));
  };

  const setGroup = (group, on) => {
    let next = value;
    for (const permission of group.permissions) if (may(permission.id) && held.has(permission.id) !== on) next = togglePermission(next, permission.id, on);
    onChange(next);
  };

  return (
    <div className="dfb-perms">
      {editable && (
        <div className="dfb-perms__presets" role="group" aria-label="Quick choices">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`dfb-perms__preset ${current?.id === preset.id ? "dfb-perms__preset--on" : ""}`}
              aria-pressed={current?.id === preset.id}
              onClick={() => applyPreset(preset)}
            >
              <i className={preset.icon} aria-hidden />
              <span>
                <b>{preset.label}</b>
                <small>{preset.description}</small>
              </span>
            </button>
          ))}
        </div>
      )}

      {allowed && editable && (
        <p className="dfb-perms__limit">
          <i className="fa-solid fa-circle-info" aria-hidden /> You can only give or take away permissions you have yourself. The others are grayed out.
        </p>
      )}

      <div className="dfb-perms__groups">
        {PERMISSION_GROUPS.map((group) => {
          const count = group.permissions.filter((p) => held.has(p.id)).length;
          const changeable = group.permissions.filter((p) => may(p.id));
          const allOn = changeable.length > 0 && changeable.every((p) => held.has(p.id));
          return (
            <fieldset key={group.id} className="dfb-perms__group" style={{ "--tint": group.color }}>
              <legend className="dfb-perms__head">
                <span className="dfb-perms__icon">
                  <i className={group.icon} aria-hidden />
                </span>
                <span className="dfb-perms__title">{group.label}</span>
                <span className="dfb-perms__count">
                  {count}/{group.permissions.length}
                </span>
                {changeable.length > 0 && (
                  <button type="button" className="dfb-perms__all" onClick={() => setGroup(group, !allOn)}>
                    {allOn ? "None" : "All"}
                  </button>
                )}
              </legend>
              <div className="dfb-perms__list">
                {group.permissions.map((permission) =>
                  editable ? (
                    <div key={permission.id} className="dfb-perms__item">
                      <Checkbox
                        checked={held.has(permission.id)}
                        disabled={!may(permission.id)}
                        onChange={(on) => onChange(togglePermission(value, permission.id, on))}
                        label={
                          <span className="dfb-perms__label">
                            {permission.label}
                            {permission.danger && (
                              <Badge tone="danger" icon="fa-solid fa-triangle-exclamation">
                                Careful
                              </Badge>
                            )}
                          </span>
                        }
                        description={permission.description}
                      />
                    </div>
                  ) : (
                    <div key={permission.id} className={`dfb-perms__item dfb-perms__item--view ${held.has(permission.id) ? "" : "dfb-perms__item--off"}`}>
                      <i className={held.has(permission.id) ? "fa-solid fa-circle-check" : "fa-regular fa-circle"} aria-hidden />
                      <span>
                        {permission.label}
                        <span className="dfb-visually-hidden">{held.has(permission.id) ? " (allowed)" : " (not allowed)"}</span>
                      </span>
                    </div>
                  ),
                )}
              </div>
            </fieldset>
          );
        })}
      </div>
    </div>
  );
}
