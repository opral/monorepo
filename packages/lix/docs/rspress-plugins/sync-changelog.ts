import path from "node:path";
import fs from "node:fs/promises";
import type { RspressPlugin } from "@rspress/core";

/**
 * Syncs the SDK changelog to the release notes page.
 */
export function syncChangelogPlugin(): RspressPlugin {
  return {
    name: "sync-changelog",
    async config(config) {
      const docsRoot = config.root!;
      const src = path.join(__dirname, "..", "..", "sdk", "CHANGELOG.md");
      const dest = path.join(docsRoot, "docs", "release-notes.mdx");

      let changelog = await fs.readFile(src, "utf8");

      // Replace the package name title with "Release Notes"
      changelog = changelog.replace(
        /^# @lix-js\/sdk\n\n/,
        "# Release Notes\n\n",
      );

      // Add a banner note
      const banner = `> [!NOTE]
> This page is automatically synced from [packages/lix/sdk/CHANGELOG.md](https://github.com/opral/monorepo/blob/main/packages/lix/sdk/CHANGELOG.md).

---

`;

      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.writeFile(dest, banner + changelog, "utf8");
      console.log(`✅ synced changelog to ${dest}`);

      return config;
    },
  };
}
