import path from "node:path";
import fs from "node:fs/promises";
import * as fsSync from "node:fs";
import type { RspressPlugin } from "@rspress/shared";
import { Application, TypeDocOptions } from "typedoc";

export interface CustomTypeDocOptions {
  entryPoints: string[];
  tsconfig?: string;
  outDir?: string;
}

async function patchLinks(outputDir: string) {
  // Patch links in markdown files
  // Scan all the markdown files in the output directory
  // replace
  // 1. [foo](bar) -> [foo](./bar)
  // 2. [foo](./bar) -> [foo](./bar) no change
  // 3. [foo](http(s)://...) -> [foo](http(s)://...) no change
  const normalizeLinksInFile = async (filePath: string) => {
    const content = await fs.readFile(filePath, "utf-8");
    // 1. [foo](bar) -> [foo](./bar)
    const newContent = content.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (_match, p1, p2) => {
        if (
          // 2. [foo](./bar) -> [foo](./bar) no change
          ["/", "."].includes(p2[0]) ||
          // 3. [foo](http(s)://...) -> [foo](http(s)://...) no change
          p2.startsWith("http://") ||
          p2.startsWith("https://")
        ) {
          return `[${p1}](${p2})`;
        }
        return `[${p1}](./${p2})`;
      }
    );
    await fs.writeFile(filePath, newContent);
  };

  const traverse = async (dir: string) => {
    const files = await fs.readdir(dir);
    const filePaths = files.map((file) => path.join(dir, file));
    const stats = await Promise.all(filePaths.map((fp) => fs.stat(fp)));

    await Promise.all(
      stats.map((stat, index) => {
        const file = files[index];
        const filePath = filePaths[index];
        if (stat.isDirectory()) {
          return traverse(filePath);
        }
        if (stat.isFile() && /\.mdx?/.test(file)) {
          return normalizeLinksInFile(filePath);
        }
      })
    );
  };
  await traverse(outputDir);
}

async function generateMetaJson(absoluteApiDir: string) {
  const metaJsonPath = path.join(absoluteApiDir, "_meta.json");

  const files = await fs.readdir(absoluteApiDir);
  const filePaths = files.map((file) => path.join(absoluteApiDir, file));
  const stats = await Promise.all(filePaths.map((fp) => fs.stat(fp)));
  const dirs = stats
    .map((stat, index) => (stat.isDirectory() ? files[index] : null))
    .filter(Boolean) as string[];

  const meta = dirs.map((dir) => ({
    type: "dir",
    label: dir.slice(0, 1).toUpperCase() + dir.slice(1),
    name: dir,
  }));
  await fs.writeFile(metaJsonPath, JSON.stringify(["index", ...meta]));
}

async function renameHtmlToMd(outputDir: string) {
  // Recursively rename all .html files to .md files
  const traverse = async (dir: string) => {
    const files = await fs.readdir(dir);
    const filePaths = files.map((file) => path.join(dir, file));
    const stats = await Promise.all(filePaths.map((fp) => fs.stat(fp)));

    await Promise.all(
      stats.map(async (stat, index) => {
        const file = files[index];
        const filePath = filePaths[index];

        if (stat.isDirectory()) {
          return traverse(filePath);
        }

        if (stat.isFile() && file.endsWith(".html")) {
          const mdPath = filePath.replace(/\.html$/, ".md");
          await fs.rename(filePath, mdPath);
        }
      })
    );
  };
  await traverse(outputDir);
}

async function patchGeneratedApiDocs(absoluteApiDir: string) {
  // First rename .html files to .md files
  await renameHtmlToMd(absoluteApiDir);

  await patchLinks(absoluteApiDir);

  // Only rename README.md if it exists
  const readmePath = path.join(absoluteApiDir, "README.md");
  const indexPath = path.join(absoluteApiDir, "index.md");

  try {
    await fs.access(readmePath);
    await fs.rename(readmePath, indexPath);
  } catch (error) {
    // README.md doesn't exist, create a basic index.md
    await fs.writeFile(
      indexPath,
      `# API Reference\n\nBrowse the API documentation using the sidebar.`
    );
  }

  await generateMetaJson(absoluteApiDir);
}

export function generateApiSidebar(docsRoot: string) {
  const apiDir = path.join(docsRoot, "api");

  // Check if API directory exists
  if (!fsSync.existsSync(apiDir)) {
    return [];
  }

  const sidebar: any[] = [];

  // Define the categories we want to show
  const categories = [
    { dir: "classes", title: "Classes", collapsed: false },
    { dir: "interfaces", title: "Interfaces", collapsed: false },
    { dir: "functions", title: "Functions", collapsed: true },
    { dir: "types", title: "Type Aliases", collapsed: true },
    { dir: "variables", title: "Variables", collapsed: true },
  ];

  categories.forEach((category) => {
    const categoryDir = path.join(apiDir, category.dir);

    if (fsSync.existsSync(categoryDir)) {
      const files = fsSync
        .readdirSync(categoryDir)
        .filter((file) => file.endsWith(".md"))
        .map((file) => {
          const name = file.replace(".md", "");
          return {
            text: name,
            link: `/api/${category.dir}/${name}`,
          };
        })
        .sort((a, b) => a.text.localeCompare(b.text));

      if (files.length > 0) {
        sidebar.push({
          text: category.title,
          collapsed: category.collapsed,
          items: files,
        });
      }
    }
  });

  return sidebar;
}

export function customTypeDocPlugin(
  options: CustomTypeDocOptions
): RspressPlugin {
  const { entryPoints = [], tsconfig, outDir = "api" } = options;

  return {
    name: "custom-typedoc-plugin",
    async config(config) {
      const docRoot = config.root;

      const outdir = path.join(docRoot!, outDir);

      // Use Application.bootstrap static method for TypeDoc 0.28+
      const app = await Application.bootstrapWithPlugins({
        name: config.title,
        entryPoints,
        plugin: ["typedoc-plugin-markdown"],
        out: outdir,
        theme: "markdown",
        disableSources: true,
        // hidePageHeader: "true",
        hideBreadcrumbs: true,
        hidePageHeader: true,
        excludePrivate: true,
        excludeExternals: true,
        tsconfig,
        hideGenerator: true,
      } as Partial<TypeDocOptions>);
      const project = await app.convert();

      if (project) {
        // Generate docs (output directory is specified in bootstrap options)
        await app.generateDocs(project, outdir);
        await patchGeneratedApiDocs(outdir);
      }

      return config;
    },
  };
}
