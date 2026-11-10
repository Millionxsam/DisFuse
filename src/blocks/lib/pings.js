import * as Blockly from "blockly";
import { ALLOWED_MENTIONS, NO_MENTIONS } from "./generatorUtils";

/* =====================================================================
   Allowed pings
   ---------------------------------------------------------------------
   A message a bot sends can ping users, roles and @everyone/@here. If a
   simple bot repeats what someone typed, anyone could use it to ping a
   role they couldn't ping themselves. So every block that sends a
   message allows only user pings unless the user changes it. The
   "include allowed pings" option in the block's mutator shows or hides
   the row where they do; hiding it keeps whatever was picked.

   The picked pings are saved in the mutation, so they apply whether the
   row is shown or not. Projects saved before the option existed allowed
   every ping, so a block loaded without them in its saved state allows
   all three, with the row hidden.
   ===================================================================== */

export const PINGS_INPUT = "pings";

export const PING_TYPES = [
  { field: "ping_users", label: "users:", parse: "users", default: true },
  { field: "ping_roles", label: "roles:", parse: "roles", default: false },
  {
    field: "ping_everyone",
    label: "@everyone & @here:",
    parse: "everyone",
    default: false,
  },
];

/** Values for a block that was just created. */
export const NEW_PING_VALUES = Object.fromEntries(
  PING_TYPES.map(p => [p.field, p.default]),
);

/** Values for a block saved before the option existed: every ping on. */
export const LEGACY_PING_VALUES = Object.fromEntries(
  PING_TYPES.map(p => [p.field, true]),
);

/** The mutator option that shows the pings row. */
export const PINGS_MUTATOR_FIELD = {
  name: PINGS_INPUT,
  label: "include allowed pings",
  default: false,
  inputType: "pings",
  inputLabel: "allowed pings:",
};

/** The ticked/unticked state of the pings row, or null if it isn't shown. */
export function readPingValues(block) {
  if (!block.getInput(PINGS_INPUT)) return null;

  return Object.fromEntries(
    PING_TYPES.map(p => [p.field, block.getFieldValue(p.field) === "TRUE"]),
  );
}

/** The pings a block allows, whether or not its row is shown. */
export function currentPingValues(block) {
  return readPingValues(block) ?? block.pingValues_ ?? null;
}

/** Adds the "allowed pings: users: [ ] roles: [ ] @everyone & @here: [ ]" row. */
export function appendPingsInput(block, values = NEW_PING_VALUES) {
  const input = block
    .appendDummyInput(PINGS_INPUT)
    .appendField(PINGS_MUTATOR_FIELD.inputLabel);

  PING_TYPES.forEach(p => {
    input
      .appendField(p.label)
      .appendField(new Blockly.FieldCheckbox(values[p.field] ? "TRUE" : "FALSE"), p.field);
  });

  return input;
}

/**
 * The `allowedMentions` option for a message a block sends.
 *
 * @param legacyCode what to generate when every ping is allowed — the code
 *   the block generated before the option existed, so old projects export
 *   the same bot. `null` leaves the option out.
 */
export function allowedMentions(block, legacyCode = ALLOWED_MENTIONS) {
  const values = currentPingValues(block);
  if (!values) return NO_MENTIONS;

  const parse = PING_TYPES.filter(p => values[p.field]).map(p => `"${p.parse}"`);
  if (parse.length === PING_TYPES.length) return legacyCode;

  return `allowedMentions: { parse: [${parse.join(", ")}] }`;
}

/** Whether a saved mutation predates the pings option. */
export function isLegacyPingsMutation(xml) {
  if (xml instanceof Element) return !xml.hasAttribute(PINGS_INPUT);
  return !xml || !(PINGS_INPUT in xml);
}

/** Writes whether the row is shown and the picked pings into a mutation. */
export function writePingsMutation(block, mutation, visible) {
  const values = currentPingValues(block) ?? NEW_PING_VALUES;
  mutation.setAttribute(PINGS_INPUT, String(!!visible));
  PING_TYPES.forEach(p => mutation.setAttribute(p.field, String(!!values[p.field])));
}

/**
 * Reads what writePingsMutation wrote. A mutation from before the option
 * existed gives every ping, with the row hidden.
 */
export function readPingsMutation(xml) {
  if (isLegacyPingsMutation(xml)) return { visible: false, values: { ...LEGACY_PING_VALUES } };

  const get = name => (xml instanceof Element ? xml.getAttribute(name) : xml[name]);
  const values = Object.fromEntries(
    PING_TYPES.map(p => {
      const saved = get(p.field);
      return [p.field, saved == null ? p.default : saved === "true"];
    }),
  );

  return { visible: get(PINGS_INPUT) === "true", values };
}

/* ---------------------------------------------------------------------
   Blocks that had no mutator of their own
   --------------------------------------------------------------------- */

const WRAPPED_TYPES = new Set();
const WRAPPED_TYPE_NAMES = new Set();

/**
 * Gives already defined blocks a mutator with the pings option. For
 * blocks built with createMutatorBlock, pass `pings: true` instead.
 */
export function addPingsMutator(types) {
  types.forEach(type => {
    const definition = Blockly.Blocks[type];
    if (!definition || WRAPPED_TYPES.has(definition)) return;
    WRAPPED_TYPES.add(definition);
    WRAPPED_TYPE_NAMES.add(type);

    const optionsBlockId = `${type}_pings_options`;
    const originalInit = definition.init;

    Blockly.Blocks[optionsBlockId] = {
      init() {
        this.setColour("#7a7a7a");
        this.contextMenu = false;
        this.appendDummyInput()
          .appendField(PINGS_MUTATOR_FIELD.label)
          .appendField(new Blockly.FieldCheckbox("FALSE"), PINGS_INPUT);
      },
    };

    Object.assign(definition, {
      init() {
        originalInit.call(this);
        this.pings_ = false;
        this.pingValues_ = { ...NEW_PING_VALUES };
        this.setMutator(new Blockly.icons.MutatorIcon([], this));
      },
      mutationToDom() {
        const m = Blockly.utils.xml.createElement("mutation");
        writePingsMutation(this, m, this.pings_);
        return m;
      },
      domToMutation(xml) {
        const { visible, values } = readPingsMutation(xml);
        this.pings_ = visible;
        this.pingValues_ = values;
        if (this.getInput(PINGS_INPUT)) this.removeInput(PINGS_INPUT);
        this.updatePings_();
      },
      decompose(workspace) {
        const container = workspace.newBlock(optionsBlockId);
        container.setColour(this.getColour());
        container.initSvg();
        container.setFieldValue(this.pings_ ? "TRUE" : "FALSE", PINGS_INPUT);
        return container;
      },
      compose(optionsBlock) {
        this.pings_ = optionsBlock.getFieldValue(PINGS_INPUT) === "TRUE";
        this.updatePings_();
      },
      updatePings_() {
        const current = readPingValues(this);
        if (current) this.pingValues_ = current;

        if (this.pings_ && !current) {
          appendPingsInput(this, this.pingValues_);
          if (this.getInput("then")) this.moveInputBefore(PINGS_INPUT, "then");
        } else if (!this.pings_ && current) {
          this.removeInput(PINGS_INPUT);
        }
      },
    });
  });
}

/* ---------------------------------------------------------------------
   Loading projects saved before the option existed
   ---------------------------------------------------------------------
   A block from createMutatorBlock always saved a mutation, so a missing
   `pings` attribute is enough to tell it is old. The blocks given a
   mutator by addPingsMutator saved nothing at all, and Blockly doesn't
   call domToMutation for a state without one, so workspaces are loaded
   through a serializer that gives those blocks an empty mutation first.
   Blocks dragged out of the toolbox don't go through it, so they start
   with pings off.
   --------------------------------------------------------------------- */

function markLegacyBlocks(state) {
  if (!state || typeof state !== "object") return;

  if (WRAPPED_TYPE_NAMES.has(state.type) && state.extraState === undefined)
    state.extraState = "<mutation></mutation>";

  Object.values(state.inputs ?? {}).forEach(input => {
    markLegacyBlocks(input?.block);
    markLegacyBlocks(input?.shadow);
  });
  markLegacyBlocks(state.next?.block);
  markLegacyBlocks(state.next?.shadow);
}

class PingsBlockSerializer extends Blockly.serialization.blocks.BlockSerializer {
  load(state, workspace) {
    (state?.blocks ?? []).forEach(markLegacyBlocks);
    super.load(state, workspace);
  }
}

Blockly.serialization.registry.unregister("blocks");
Blockly.serialization.registry.register("blocks", new PingsBlockSerializer());
