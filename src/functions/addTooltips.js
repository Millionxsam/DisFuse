export default function addTooltips(workspace) {
  workspace.getAllBlocks(false).forEach((block) => {
    let outputs = block?.outputConnection?.getCheck();
    let inputs = block?.inputList?.filter((i) => i.type === 1);

    if (
      block?.getTooltip()?.includes("Input 1") ||
      block?.getTooltip()?.includes("Output(s):") ||
      block?.getTooltip()?.includes("ID:")
    )
      return;

    if (inputs?.length) {
      let beforeInputTooltip = block?.getTooltip()?.split("Input")[0] || "";
      block.setTooltip(
        beforeInputTooltip +
        "\n" +
        inputs
          ?.map(
            (input, i) =>
              `Input ${i + 1}: ${input?.connection?.check?.join(", ") || "Any"
              }`
          )
          .join("\n")
      );
    }

    if (outputs?.length) {
      let beforeOutputTooltip =
        block?.getTooltip().split("Output(s):")[0] || "";
      block.setTooltip(
        beforeOutputTooltip +
        "\nOutput(s): " +
        outputs.map((output) => output ?? "Any").join(", ")
      );
    }

    let beforeOutputTooltip =
      block?.getTooltip().split("ID:")[0] || "";
    block.setTooltip(
      beforeOutputTooltip +
      "\nID: " + block.type
    );
  });
}
