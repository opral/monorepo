import path from "node:path";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import type { RspressPlugin } from "@rspress/core";

// Map from package name to package directory name
const packageToDir: Record<string, string> = {
  "@lix-js/plugin-json": "plugin-json",
  "@lix-js/plugin-md": "plugin-md",
  "@lix-js/plugin-csv": "plugin-csv",
  "@lix-js/plugin-prosemirror": "plugin-prosemirror",
};

type RegistryPlugin = {
  key: string;
  name: string;
  package: string;
  description: string;
  file_types: string[];
  links: {
    npm: string;
    github: string;
    docs: string;
    example?: string;
  };
};

// Extract display name from plugin name (remove "Plugin" suffix)
export function getDisplayName(pluginName: string): string {
  return pluginName.replace(/\s+Plugin$/, "");
}

export function syncPluginReadmesPlugin(): RspressPlugin {
  return {
    name: "sync-plugin-readmes",
    async config(config) {
      const docsRoot = config.root!;
      const pluginsDir = path.join(docsRoot, "plugins");
      const registryPath = path.join(pluginsDir, "plugin.registry.json");

      // Read the plugin registry
      const registryContent = await fs.readFile(registryPath, "utf8");
      const registry = JSON.parse(registryContent) as {
        plugins: RegistryPlugin[];
      };

      // Generate sidebar metadata
      const metaItems: Array<{
        type: "file";
        name: string;
        label: string;
        tag?: string;
      }> = [
        {
          type: "file",
          name: "index",
          label: "Overview",
        },
      ];

      // Sync READMEs and build sidebar entries
      for (const plugin of registry.plugins) {
        const slug = plugin.key;
        const packageDir = packageToDir[plugin.package];

        if (!slug || !packageDir) {
          console.warn(
            `⚠️  Unknown plugin package: ${plugin.package}, skipping`,
          );
          continue;
        }

        // Sync README
        const src = path.join(
          __dirname,
          "..",
          "..",
          packageDir,
          "README.md",
        );
        const dest = path.join(pluginsDir, `${slug}.mdx`);

        let readme = await fs.readFile(src, "utf8");

        // Replace relative image paths with GitHub raw URLs
        readme = readme.replace(
          /\]\(\.\/assets\/([^)]+)\)/g,
          `](https://github.com/opral/monorepo/raw/main/packages/lix/${packageDir}/assets/$1)`,
        );

        // Replace relative example directory links with GitHub path to avoid dead links in docs
        readme = readme.replace(
          /\]\(\.\/example\)/g,
          `](https://github.com/opral/monorepo/tree/main/packages/lix/${packageDir}/example)`,
        );

        // Generate metadata card component import and usage
        const metadataCard = `<PluginMetadataCard
  packageName="${plugin.package}"
  npmUrl="${plugin.links.npm}"
  githubUrl="${plugin.links.github}"
  ${plugin.links.example ? `exampleUrl="${plugin.links.example}"` : ""}
/>

`;

        await fs.mkdir(path.dirname(dest), { recursive: true });
        await fs.writeFile(dest, metadataCard + readme, "utf8");
        console.log(`✅ copied ${packageDir} README.md to ${dest}`);

        // Add to sidebar
        const displayName = getDisplayName(plugin.name);
        metaItems.push({
          type: "file",
          name: slug,
          label: displayName,
        });
      }

      // Write _meta.json
      const metaJsonPath = path.join(pluginsDir, "_meta.json");
      await fs.writeFile(metaJsonPath, JSON.stringify(metaItems, null, 2));
      console.log(`✅ generated _meta.json for plugins directory`);

      return config;
    },
  };
}

export function generatePluginsSidebar(docsRoot: string) {
  const pluginsDir = path.join(docsRoot, "plugins");
  const registryPath = path.join(pluginsDir, "plugin.registry.json");

  // Check if registry exists
  if (!fsSync.existsSync(registryPath)) {
    console.warn(`⚠️  plugin.registry.json not found at ${registryPath}`);
    return [{ text: "Overview", link: "/plugins/" }];
  }

  // Read and parse registry
  const registryContent = fsSync.readFileSync(registryPath, "utf8");
  const registry = JSON.parse(registryContent) as {
    plugins: Array<{
      key: string;
      name: string;
      package: string;
    }>;
  };

  // Generate sidebar from registry
  const sidebar = [{ text: "Overview", link: "/plugins/" }];

  for (const plugin of registry.plugins) {
    const slug = plugin.key;
    if (!slug) continue;

    const displayName = getDisplayName(plugin.name);
    sidebar.push({
      text: displayName,
      link: `/plugins/${slug}`,
    });
  }

  return sidebar;
}
