import fs from "node:fs";
import { createHighlighter } from "shiki";
import { codeToKeyedTokens, createMagicMoveMachine } from "@shikijs/magic-move/core";
import { lightTheme, darkTheme } from "../docs/.vitepress/theme/syntax-themes.mjs";
import { walkthroughs } from "../docs/.vitepress/theme/ui-walkthroughs.mjs";

const highlighter = await createHighlighter({
  themes: [lightTheme, darkTheme],
  langs: ["tsx"],
});
const result = {};
for (const [kind, steps] of Object.entries(walkthroughs)) {
  result[kind] = {};
  for (const theme of [lightTheme.name, darkTheme.name]) {
    const machine = createMagicMoveMachine((code) =>
      codeToKeyedTokens(highlighter, code, { lang: "tsx", theme }),
    );
    result[kind][theme] = steps.map((step) => machine.commit(step.code).current);
  }
}
highlighter.dispose();
fs.writeFileSync(
  new URL("../docs/.vitepress/theme/ui-walkthrough-tokens.json", import.meta.url),
  JSON.stringify(result),
);
console.log("UI Magic Move tokens generated");
