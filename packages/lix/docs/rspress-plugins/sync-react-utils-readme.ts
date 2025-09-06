import path from "node:path";
import fs from "node:fs/promises";
import type { RspressPlugin } from "@rspress/shared";

export function syncReactUtilsReadmePlugin(): RspressPlugin {
  return {
    name: "sync-react-utils-readme",
    async config(config) {
      const docsRoot = config.root!;
      const src = path.join(
        __dirname,
        "..",
        "..",
        "react-utils",
        "README.md",
      );
      const dest = path.join(docsRoot, "guide", "react-utils.mdx");

      const readme = await fs.readFile(src, "utf8");
      const banner =
        "{/* NOTE: This page is generated from @lix-js/react-utils/README.md. Do not edit directly. */}\n\n";
      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.writeFile(dest, banner + readme, "utf8");
      console.log(
        "✅ copied react utils README.md to docs/guide/react-utils.mdx",
      );

      return config;
    },
  };
}
