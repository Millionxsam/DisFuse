import prettier from "prettier/standalone";
import babel from "prettier/plugins/babel";
import estree from "prettier/plugins/estree";

export async function format(js = "") {
  try {
    return (
      (await prettier.format(js, {
        plugins: [babel, estree],
        parser: "babel",
        printWidth: 80,
        tabWidth: 2,
        singleQuote: false,
        semi: true,
        trailingComma: "none",
        arrowParens: "avoid",
      })) || js
    );
  } catch (err) {
    console.error(err);
    return js;
  }
}
