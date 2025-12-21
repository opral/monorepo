import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Plugin } from "vite";

type PluginRegistry = {
  plugins?: Array<{
    key: string;
    readme?: string;
  }>;
};

/**
 * Rewrites relative image links to absolute GitHub raw URLs.
 *
 * @example
 * rewriteRelativeImages("![Alt](./assets/img.png)", "https://raw.githubusercontent.com/opral/monorepo/main/packages/lix/plugin-md/README.md")
 */
function rewriteRelativeImages(markdown: string, readmeUrl: string) {
  const base = readmeUrl.replace(/\/README\.md$/, "/");
  return markdown.replace(
    /!\[([^\]]*)\]\((?!https?:\/\/)([^)]+)\)/g,
    (match, alt, url) => {
      const normalized = url.replace(/^\.?\//, "");
      return `![${alt}](${base}${normalized})`;
    },
  );
}

/**
 * Rewrites relative links to GitHub tree URLs.
 *
 * @example
 * rewriteRelativeLinks("[Example](./example)", "https://raw.githubusercontent.com/opral/monorepo/main/packages/lix/plugin-md/README.md")
 */
function rewriteRelativeLinks(markdown: string, readmeUrl: string) {
  const repoBase = readmeUrl
    .replace("https://raw.githubusercontent.com/", "https://github.com/")
    .replace(/\/README\.md$/, "");
  return markdown.replace(
    /\[([^\]]+)\]\((?!https?:\/\/)([^)]+)\)/g,
    (match, text, url) => {
      if (url.startsWith("#")) {
        return match;
      }
      const normalized = url.replace(/^\.?\//, "");
      return `[${text}](${repoBase}/${normalized})`;
    },
  );
}

/**
 * Loads the plugin registry from disk.
 *
 * @example
 * const registry = await loadRegistry("/path/to/plugin.registry.json");
 */
async function loadRegistry(registryPath: string): Promise<PluginRegistry> {
  const raw = await readFile(registryPath, "utf8");
  return JSON.parse(raw) as PluginRegistry;
}

/**
 * Downloads plugin readmes and writes them to the content directory.
 *
 * @example
 * await syncPluginReadmes(registry, "/content/plugins");
 */
async function syncPluginReadmes(
  registry: PluginRegistry,
  contentDir: string,
) {
  const plugins = Array.isArray(registry.plugins) ? registry.plugins : [];
  await mkdir(contentDir, { recursive: true });

  await Promise.all(
    plugins.map(async (plugin) => {
      if (!plugin?.key || !plugin?.readme) {
        throw new Error(`Missing readme entry for plugin ${plugin?.key ?? ""}`);
      }

      const response = await fetch(plugin.readme);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch ${plugin.readme} (${response.status} ${response.statusText})`,
        );
      }

      const markdown = rewriteRelativeLinks(
        rewriteRelativeImages(await response.text(), plugin.readme),
        plugin.readme,
      );
      const destination = path.join(contentDir, `${plugin.key}.md`);
      await writeFile(destination, markdown);
    }),
  );
}

/**
 * Vite plugin that syncs plugin READMEs into local content.
 *
 * @example
 * pluginReadmeSync()
 */
export function pluginReadmeSync(): Plugin {
  return {
    name: "plugin-readme-sync",
    async buildStart() {
      const root = process.cwd();
      const registryPath = path.join(
        root,
        "src/routes/plugins/plugin.registry.json",
      );
      const contentDir = path.join(root, "content/plugins");
      const registry = await loadRegistry(registryPath);
      await syncPluginReadmes(registry, contentDir);
      console.log("copied plugin readmes");
    },
  };
}
