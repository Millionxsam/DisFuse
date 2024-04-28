import * as Blockly from "blockly";
import { javascriptGenerator } from "blockly/javascript";

Blockly.ContextMenuRegistry.registry.register({
  displayText: "Copy JavaScript Code",
  preconditionFn: (scope) => `${scope.block.disabled ? "disabled" : "enabled"}`,
  scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK,
  id: "copycode",
  callback: (scope) =>
    navigator.clipboard.writeText(javascriptGenerator.blockToCode(scope.block)),
});
