export const workshopToolbox = {
  kind: "categoryToolbox",
  contents: [
    {
      kind: "category",
      name: "Main",
      colour: "#00a5ce",
      contents: [
        {
          kind: "block",
          type: "main_blockcreator",
          inputs: {
            COLOR: {
              shadow: {
                type: "color_picker",
              },
            },
            OUTPUTCODE: {
              shadow: {
                type: "text",
                fields: {
                  TEXT: 'console.log("Hello");',
                },
              },
            },
          },
        },
      ],
    },
    {
      kind: "category",
      name: "Inputs",
      colour: "#5b80a5",
      contents: [
        { kind: "block", type: "input_value" },
        { kind: "block", type: "input_statement" },
        { kind: "block", type: "input_dummy" },
        { kind: "block", type: "input_endrow" },
      ],
    },
    {
      kind: "category",
      name: "Fields",
      colour: "#5b9ca5",
      contents: [
        { kind: "block", type: "field_label" },
        { kind: "block", type: "field_textInput" },
        { kind: "block", type: "field_numericInput" },
        { kind: "block", type: "field_checkbox" },
        { kind: "block", type: "field_variable" },
        { kind: "block", type: "field_dropdown" },
        { kind: "block", type: "field_dropdownChoice" },
      ],
    },
    {
      kind: "category",
      name: "Types",
      colour: "#5ba55b",
      contents: [
        { kind: "block", type: "lists_create_with" },
        { kind: "block", type: "type_dropdown" },
        {
          kind: "block",
          type: "type_dropdown",
          fields: {
            DROPDOWN: "String",
          },
        },
        {
          kind: "block",
          type: "type_dropdown",
          fields: {
            DROPDOWN: "Number",
          },
        },
        {
          kind: "block",
          type: "type_dropdown",
          fields: {
            DROPDOWN: "Boolean",
          },
        },
        {
          kind: "block",
          type: "type_dropdown",
          fields: {
            DROPDOWN: "Array",
          },
        },
        { kind: "block", type: "type_custom" },
      ],
    },
    {
      kind: "category",
      name: "Colors",
      colour: "#a5745b",
      contents: [
        { kind: "block", type: "color_picker" },
        { kind: "block", type: "color_custom" },
      ],
    },
    {
      kind: "category",
      name: "Output",
      colour: "#a55b8d",
      contents: [
        { kind: "block", type: "text" },
        { kind: "block", type: "text_multiline" },
        { kind: "block", type: "text_join" },
        { kind: "block", type: "output_valueInput" },
        { kind: "block", type: "output_statementInput" },
        { kind: "block", type: "output_fieldValue" },
      ],
    },
  ],
};
