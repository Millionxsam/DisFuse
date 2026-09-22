import * as Blockly from "blockly";
import { Order, javascriptGenerator } from "blockly/javascript";

Blockly.Blocks["time_date_now"] = {
  init: function () {
    this.appendDummyInput().appendField("current timestamp (milliseconds)");
    this.setOutput(true, "Number");
    this.setColour("#db4b9c");
    this.setTooltip("Returns milliseconds since January 1, 1970 (Unix Epoch)");
  },
};

javascriptGenerator.forBlock["time_date_now"] = function (block, generator) {
  var code = "Date.now()";
  return [code, Order.FUNCTION_CALL];
};

Blockly.Blocks["time_date"] = {
  init: function () {
    this.appendDummyInput().appendField("current date");
    this.setOutput(true, "date");
    this.setColour("#db4b9c");
  },
};

javascriptGenerator.forBlock["time_date"] = function (block, generator) {
  var code = "new Date()";
  return [code, Order.NEW];
};

Blockly.Blocks["time_between"] = {
  init: function () {
    this.appendValueInput("DATE1")
      .setCheck("date")
      .appendField(
        new Blockly.FieldDropdown([
          ["milliseconds", "* 1"],
          ["seconds", "/ 1000"],
          ["minutes", "/ 60000"],
          ["hours", "/ 3600000"],
        ]),
        "TIME",
      )
      .appendField("between date");
    this.appendValueInput("DATE2").setCheck("date").appendField("and date");
    this.setInputsInline(true);
    this.setOutput(true, "Number");
    this.setColour("#db4b9c");
    this.setTooltip("Gets a specific amount between two dates.");
    this.setHelpUrl("");
  },
};

javascriptGenerator.forBlock["time_between"] = function (block, generator) {
  var time = block.getFieldValue("TIME");
  var date1 = generator.valueToCode(block, "DATE1", Order.ATOMIC);
  var date2 = generator.valueToCode(block, "DATE2", Order.ATOMIC);

  var code = `(${date1} - ${date2}) ${time}`;

  return [code, Order.NONE];
};

Blockly.Blocks["time_createdate"] = {
  init: function () {
    this.appendValueInput("TIME")
      .setCheck(["String", "Number"])
      .appendField("create date from timestamp or date text");
    this.setOutput(true, "date");
    this.setColour("#db4b9c");
    this.setTooltip(
      "Accepts a timestamp in milliseconds as a number (like the current timestamp block gives), " +
        'or a full date as text, like "2026-09-22T15:00" or "September 22, 2026 3:00 PM". ' +
        'A time on its own, like "3:00", is not a valid date.',
    );
  },
};

javascriptGenerator.forBlock["time_createdate"] = function (block, generator) {
  var time = generator.valueToCode(block, "TIME", Order.ATOMIC);

  return [`new Date(${time})`, Order.NEW];
};

Blockly.Blocks["time_timestampFromDate"] = {
  init: function () {
    this.appendValueInput("DATE")
      .setCheck("date")
      .appendField("create timestamp from date");
    this.appendDummyInput().appendField(
      new Blockly.FieldDropdown([
        ["short time", "t"],
        ["long time", "T"],
        ["short date", "d"],
        ["long date", "D"],
        ["short datetime", "f"],
        ["long datetime", "F"],
        ["relative time", "R"],
      ]),
      "STYLE",
    );
    this.setOutput(true, "String");
    this.setColour("#db4b9c");
  },
};

javascriptGenerator.forBlock["time_timestampFromDate"] = function (
  block,
  generator,
) {
  var date = generator.valueToCode(block, "DATE", Order.ATOMIC);
  var style = block.getFieldValue("STYLE");

  return [
    `'<t:' + Math.floor(${date}.getTime() / 1000) + ':${style}>'`,
    Order.NONE,
  ];
};

Blockly.Blocks["time_convert"] = {
  init: function () {
    this.appendValueInput("NUMBER").setCheck("Number").appendField("convert");
    this.appendDummyInput()
      .appendField(
        new Blockly.FieldDropdown([
          ["milliseconds", "milliseconds"],
          ["seconds", "seconds"],
          ["minutes", "minutes"],
          ["hours", "hours"],
          ["days", "days"],
          ["months", "months"],
          ["years", "years"],
        ]),
        "FROM",
      )
      .appendField("to")
      .appendField(
        new Blockly.FieldDropdown([
          ["milliseconds", "milliseconds"],
          ["seconds", "seconds"],
          ["minutes", "minutes"],
          ["hours", "hours"],
          ["days", "days"],
          ["months", "months"],
          ["years", "years"],
        ]),
        "TO",
      );
    this.setOutput(true, "Number");
    this.setColour("#db4b9c");
    this.setTooltip("Converts a number from one time unit to another.");
  },
};

javascriptGenerator.forBlock["time_convert"] = function (block, generator) {
  var number = generator.valueToCode(block, "NUMBER", Order.ATOMIC);
  var fromUnit = block.getFieldValue("FROM");
  var toUnit = block.getFieldValue("TO");

  var timeRates = {
    milliseconds: 1,
    seconds: 1000,
    minutes: 60000,
    hours: 3600000,
    days: 86400000,
    months: 2628000000,
    years: 31536000000,
  };

  var code = `Math.round(${number} * ${timeRates[fromUnit] / timeRates[toUnit]})`;
  return [code, Order.NONE];
};

Blockly.Blocks["time_operation"] = {
  init: function () {
    this.appendValueInput("NUMBER")
      .setCheck("Number")
      .appendField(
        new Blockly.FieldDropdown([
          ["add", "ADD"],
          ["subtract", "SUBTRACT"],
        ]),
        "OPERATION",
      );
    this.appendDummyInput()
      .appendField(
        new Blockly.FieldDropdown([
          ["milliseconds", "milliseconds"],
          ["seconds", "seconds"],
          ["minutes", "minutes"],
          ["hours", "hours"],
          ["days", "days"],
          ["months", "months"],
          ["years", "years"],
        ]),
        "UNIT",
      )
      .appendField("to/from date");
    this.appendValueInput("DATE").setCheck("date");
    this.setOutput(true, "date");
    this.setColour("#db4b9c");
    this.setTooltip(
      "Adds or subtracts a specific time amount to/from the date.",
    );
  },
};

javascriptGenerator.forBlock["time_operation"] = function (block, generator) {
  var date = generator.valueToCode(block, "DATE", Order.ATOMIC);
  var number = generator.valueToCode(block, "NUMBER", Order.ATOMIC);
  var operation = block.getFieldValue("OPERATION");
  var unit = block.getFieldValue("UNIT");

  var timeRates = {
    milliseconds: 1,
    seconds: 1000,
    minutes: 60000,
    hours: 3600000,
    days: 86400000,
    months: 2628000000,
    years: 31536000000,
  };

  var sign = operation === "ADD" ? "+" : "-";
  var code = `new Date(${date}.getTime() ${sign} (${number} * ${timeRates[unit]}))`;

  return [code, Order.NONE];
};

Blockly.Blocks["time_stringToMS"] = {
  init: function () {
    this.appendValueInput("TIME")
      .setCheck("String")
      .appendField("turn time string");
    this.appendDummyInput().appendField("to milliseconds");
    this.setOutput(true, "Number");
    this.setColour("#db4b9c");
  },
};

javascriptGenerator.forBlock["time_stringToMS"] = function (block, generator) {
  var time = generator.valueToCode(block, "TIME", Order.ATOMIC);
  return [`ms(${time})`, Order.NONE];
};

Blockly.Blocks["time_msToString"] = {
  init: function () {
    this.appendValueInput("TIME")
      .setCheck("Number")
      .appendField("turn milliseconds:");
    this.appendDummyInput().appendField("to time string");
    this.appendValueInput("LONG")
      .setCheck("Boolean")
      .appendField("long display:");
    this.setInputsInline(false);
    this.setOutput(true, "String");
    this.setColour("#db4b9c");
  },
};

javascriptGenerator.forBlock["time_msToString"] = function (block, generator) {
  var time = generator.valueToCode(block, "TIME", Order.ATOMIC);
  var long = generator.valueToCode(block, "LONG", Order.ATOMIC);

  return [`ms(${time}, { long: ${long ?? true} })`, Order.NONE];
};

/* =====================================================================
   Time of day
   ---------------------------------------------------------------------
   Everything above works on timestamps, which name one instant: today's
   3pm and tomorrow's 3pm are different numbers. These two blocks ask
   about the clock instead — "is it 3pm in London?" — so they match every
   day. Each of hour, minute and second can be "any", which makes the
   hat work like a cron line: any hour, minute 00, second 00 is "every
   hour on the hour".
   ===================================================================== */

const pad = (n) => String(n).padStart(2, "0");

function clockOptions(count) {
  return [
    ["any", "*"],
    ...Array.from({ length: count }, (_, n) => [pad(n), String(n)]),
  ];
}

/* A fixed list rather than Intl.supportedValuesOf: a saved project has
   to load with the same options on every browser, and the full IANA list
   is 400-odd entries long. "LOCAL" is the clock of the machine the bot
   runs on. */
const TIME_ZONES = [
  ["local time (where the bot runs)", "LOCAL"],
  ["UTC", "UTC"],
  ["Honolulu (Hawaii)", "Pacific/Honolulu"],
  ["Anchorage (Alaska)", "America/Anchorage"],
  ["Los Angeles (US Pacific)", "America/Los_Angeles"],
  ["Denver (US Mountain)", "America/Denver"],
  ["Phoenix (Arizona)", "America/Phoenix"],
  ["Chicago (US Central)", "America/Chicago"],
  ["New York (US Eastern)", "America/New_York"],
  ["Halifax (Atlantic)", "America/Halifax"],
  ["St. John's (Newfoundland)", "America/St_Johns"],
  ["Mexico City", "America/Mexico_City"],
  ["Bogotá", "America/Bogota"],
  ["Lima", "America/Lima"],
  ["Caracas", "America/Caracas"],
  ["Santiago", "America/Santiago"],
  ["São Paulo", "America/Sao_Paulo"],
  ["Buenos Aires", "America/Argentina/Buenos_Aires"],
  ["Reykjavík", "Atlantic/Reykjavik"],
  ["London", "Europe/London"],
  ["Dublin", "Europe/Dublin"],
  ["Lisbon", "Europe/Lisbon"],
  ["Paris", "Europe/Paris"],
  ["Berlin", "Europe/Berlin"],
  ["Madrid", "Europe/Madrid"],
  ["Rome", "Europe/Rome"],
  ["Amsterdam", "Europe/Amsterdam"],
  ["Stockholm", "Europe/Stockholm"],
  ["Warsaw", "Europe/Warsaw"],
  ["Athens", "Europe/Athens"],
  ["Helsinki", "Europe/Helsinki"],
  ["Kyiv", "Europe/Kiev"],
  ["Istanbul", "Europe/Istanbul"],
  ["Moscow", "Europe/Moscow"],
  ["Lagos", "Africa/Lagos"],
  ["Cairo", "Africa/Cairo"],
  ["Johannesburg", "Africa/Johannesburg"],
  ["Nairobi", "Africa/Nairobi"],
  ["Dubai", "Asia/Dubai"],
  ["Tehran", "Asia/Tehran"],
  ["Karachi", "Asia/Karachi"],
  ["India", "Asia/Kolkata"],
  ["Kathmandu", "Asia/Kathmandu"],
  ["Dhaka", "Asia/Dhaka"],
  ["Bangkok", "Asia/Bangkok"],
  ["Jakarta", "Asia/Jakarta"],
  ["Singapore", "Asia/Singapore"],
  ["Manila", "Asia/Manila"],
  ["Hong Kong", "Asia/Hong_Kong"],
  ["Shanghai (China)", "Asia/Shanghai"],
  ["Taipei", "Asia/Taipei"],
  ["Seoul", "Asia/Seoul"],
  ["Tokyo", "Asia/Tokyo"],
  ["Perth", "Australia/Perth"],
  ["Adelaide", "Australia/Adelaide"],
  ["Brisbane", "Australia/Brisbane"],
  ["Sydney", "Australia/Sydney"],
  ["Auckland", "Pacific/Auckland"],
];

/** Hour, minute and second dropdowns, then the time zone on a row of its
    own so the block isn't too wide. */
function appendClockFields(block, text, { hour, minute, second }) {
  const field = (count, value) => {
    const dropdown = new Blockly.FieldDropdown(clockOptions(count));
    dropdown.setValue(value);
    return dropdown;
  };

  block
    .appendDummyInput()
    .appendField(text)
    .appendField(field(24, hour), "HOUR")
    .appendField(":")
    .appendField(field(60, minute), "MINUTE")
    .appendField(":")
    .appendField(field(60, second), "SECOND");
  block
    .appendDummyInput()
    .appendField("in")
    .appendField(new Blockly.FieldDropdown(TIME_ZONES), "TIMEZONE");
  block.setInputsInline(false);
}

/** The `{ hour, minute, second }, timeZone` arguments the helpers take. */
function clockArguments(block) {
  const unit = (name) => {
    const value = block.getFieldValue(name);
    return value === "*" ? "null" : String(Number(value));
  };

  const zone = block.getFieldValue("TIMEZONE");

  return `{ hour: ${unit("HOUR")}, minute: ${unit("MINUTE")}, second: ${unit("SECOND")} }, ${
    zone === "LOCAL" ? "undefined" : JSON.stringify(zone)
  }`;
}

Blockly.Blocks["time_isTime"] = {
  init: function () {
    appendClockFields(this, "is the time", {
      hour: "15",
      minute: "0",
      second: "*",
    });
    this.setOutput(true, "Boolean");
    this.setColour("#db4b9c");
    this.setTooltip(
      "True when the clock in the chosen time zone matches, on any day. " +
        '"any" matches every value, so 15 : 00 : any is true for the whole minute of 3:00pm.',
    );
  },
};

javascriptGenerator.forBlock["time_isTime"] = function (block) {
  return [`disfuseTimeMatches(${clockArguments(block)})`, Order.FUNCTION_CALL];
};

Blockly.Blocks["time_whenTime"] = {
  init: function () {
    appendClockFields(this, "when the time is", {
      hour: "15",
      minute: "0",
      second: "0",
    });
    this.appendStatementInput("code").setCheck(null);
    this.setColour("#db4b9c");
    this.setTooltip(
      "Runs the blocks inside every day when the clock in the chosen time zone reaches this time. " +
        '"any" matches every value: any : 00 : 00 runs every hour on the hour, ' +
        "and a second of \"any\" runs once a second for the whole minute.",
    );
  },
};

javascriptGenerator.forBlock["time_whenTime"] = function (block, generator) {
  const statements = generator.statementToCode(block, "code");

  return `client.once("clientReady", () => {
  disfuseOnTime(${clockArguments(block)}, async () => {
${statements}  });
});
`;
};

/** The block types that need `timeOfDayHelpers` in the exported bot. */
export const timeOfDayBlocks = ["time_isTime", "time_whenTime"];

/* Emitted only when a project uses one of the blocks above, the same way
   the dashboard helper is, so every other project's code is unchanged. */
export const timeOfDayHelpers = `
/* Time of day */
const disfuseTimeFormats = new Map();
function disfuseTimeParts(date, timeZone) {
  const key = timeZone ?? "local";
  if (!disfuseTimeFormats.has(key))
    disfuseTimeFormats.set(key, new Intl.DateTimeFormat("en-US", {
      timeZone, hourCycle: "h23", hour: "numeric", minute: "numeric", second: "numeric"
    }));
  const parts = {};
  for (const { type, value } of disfuseTimeFormats.get(key).formatToParts(date))
    if (type === "hour" || type === "minute" || type === "second") parts[type] = Number(value);
  /* Some older ICU builds print midnight as 24 even with h23. */
  parts.hour %= 24;
  return parts;
}
function disfuseTimeMatches(target, timeZone, date = new Date()) {
  const now = disfuseTimeParts(date, timeZone);
  return ["hour", "minute", "second"].every(unit => target[unit] === null || target[unit] === now[unit]);
}
function disfuseOnTime(target, timeZone, callback) {
  let last = Math.floor(Date.now() / 1000);
  const schedule = () => setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
  /* Every second since the last tick is checked, so a busy event loop
     can't step over the moment; capped so waking from a long pause
     doesn't replay hours of matches at once. */
  function tick() {
    const current = Math.floor(Date.now() / 1000);
    for (let s = Math.max(last + 1, current - 59); s <= current; s++)
      if (disfuseTimeMatches(target, timeZone, new Date(s * 1000)))
        Promise.resolve().then(callback).catch(console.error);
    last = current;
    schedule();
  }
  schedule();
}
/* ------------------------- */`.trim();
