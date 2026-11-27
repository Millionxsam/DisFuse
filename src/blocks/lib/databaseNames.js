import * as Blockly from "blockly";

/* =====================================================================
   The databases a project has created
   ---------------------------------------------------------------------
   The database blocks pick the database they work on from a dropdown of
   every "create database" block in the project, in any of its
   workspaces. A block only sees its own workspace, so the editor page
   tells this module how to reach the blocks of the project's other
   workspaces (`setOtherWorkspaceBlocks`).
   ===================================================================== */

const DEFAULT_NAME = "database";

let getOtherWorkspaceBlocks = () => [];

/**
 * @param {() => object[]} getter  the serialised top blocks of every
 *   workspace in the project except the one on screen
 */
export function setOtherWorkspaceBlocks(getter) {
  getOtherWorkspaceBlocks = typeof getter === "function" ? getter : () => [];
}

/** Collects `db_create` names from serialised blocks, nested ones included. */
function collectSerialised(blocks, names) {
  const visit = (data) => {
    if (!data || typeof data !== "object") return;

    if (data.type === "db_create" && data.fields?.name != null)
      names.add(String(data.fields.name));

    Object.values(data.inputs ?? {}).forEach((input) => {
      visit(input?.block);
      visit(input?.shadow);
    });
    visit(data.next?.block);
    visit(data.next?.shadow);
  };

  (blocks ?? []).forEach(visit);
}

/** The main workspace a block's workspace belongs to (a flyout's target). */
function mainWorkspaceOf(workspace) {
  const ws = workspace ?? Blockly.getMainWorkspace();
  return ws?.targetWorkspace ?? ws ?? null;
}

/**
 * Every database name created anywhere in the project, in the order
 * they appear — the workspace on screen first.
 */
export function getDatabaseNames(workspace) {
  const names = new Set();
  const main = mainWorkspaceOf(workspace);

  main
    ?.getAllBlocks(false)
    .filter((b) => b.type === "db_create")
    .forEach((b) => names.add(String(b.getFieldValue("name"))));

  try {
    collectSerialised(getOtherWorkspaceBlocks(), names);
  } catch {
    /* A broken sibling workspace must not stop the dropdown opening. */
  }

  names.delete("");
  return [...names];
}

/**
 * A dropdown of the project's databases. It keeps whatever value it was
 * given even when no database by that name exists (yet) — a saved project
 * can be opened before its other workspaces are known, and a renamed or
 * deleted database should show up as a warning on the block, not quietly
 * change which database the block uses.
 */
export class FieldDatabaseDropdown extends Blockly.FieldDropdown {
  constructor() {
    super(function () {
      return this.databaseOptions_();
    });
  }

  databaseOptions_() {
    const names = getDatabaseNames(this.getSourceBlock()?.workspace);

    [this.value_, this.pendingValue_].forEach((value) => {
      if (typeof value === "string" && value && !names.includes(value))
        names.push(value);
    });

    if (!names.length) names.push(DEFAULT_NAME);

    return names.map((name) => [name, name]);
  }

  static fromJson() {
    return new FieldDatabaseDropdown();
  }

  /** Whether the picked database is made by a "create database" block. */
  databaseExists() {
    return getDatabaseNames(this.getSourceBlock()?.workspace).includes(this.getValue());
  }

  doClassValidation_(newValue) {
    if (typeof newValue !== "string" || !newValue) return null;

    /* Regenerating with the new value pending puts it in the cached
       options, which is where the dropdown looks up the text to show. */
    this.pendingValue_ = newValue;
    this.getOptions(false);
    this.pendingValue_ = null;

    return newValue;
  }
}

/* Registered so element blocks (src/elements) can make one without
   importing this module: `Blockly.fieldRegistry.fromJson({ type })`. */
export const DATABASE_FIELD = "field_database_dropdown";
if (!Blockly.registry.hasItem(Blockly.registry.Type.FIELD, DATABASE_FIELD))
  Blockly.fieldRegistry.register(DATABASE_FIELD, FieldDatabaseDropdown);
