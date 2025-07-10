import path from "node:path";
import fs from "node:fs/promises";
import * as fsSync from "node:fs";
import type { RspressPlugin } from "@rspress/shared";
import { Application, TSConfigReader } from "typedoc";
import { load } from "typedoc-plugin-markdown";

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

async function patchGeneratedApiDocs(absoluteApiDir: string) {
  await patchLinks(absoluteApiDir);
  await fs.rename(
    path.join(absoluteApiDir, "README.md"),
    path.join(absoluteApiDir, "index.md")
  );
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
  
  categories.forEach(category => {
    const categoryDir = path.join(apiDir, category.dir);
    
    if (fsSync.existsSync(categoryDir)) {
      const files = fsSync.readdirSync(categoryDir)
        .filter(file => file.endsWith('.md'))
        .map(file => {
          const name = file.replace('.md', '');
          return {
            text: name,
            link: `/api/${category.dir}/${name}`
          };
        })
        .sort((a, b) => a.text.localeCompare(b.text));
      
      if (files.length > 0) {
        sidebar.push({
          text: category.title,
          collapsed: category.collapsed,
          items: files
        });
      }
    }
  });
  
  return sidebar;
}

export function customTypeDocPlugin(
  options: CustomTypeDocOptions
): RspressPlugin {
  let docRoot: string | undefined;
  const { entryPoints = [], tsconfig, outDir = "api" } = options;

  return {
    name: "custom-typedoc-plugin",
    async config(config) {
      const app = new Application();
      docRoot = config.root;

      app.options.addReader(new TSConfigReader());
      load(app);

      // Bootstrap options - working with current TypeDoc version
      const bootstrapOptions: any = {
        name: config.title,
        entryPoints,
        theme: "markdown",
        disableSources: true,
        readme: "none",
        githubPages: false,
        requiredToBeDocumented: ["Class", "Function", "Interface"],
        plugin: ["typedoc-plugin-markdown"],
        hideBreadcrumbs: true,
        hideMembersSymbol: true,
        allReflectionsHaveOwnDocument: true,
        publicPath: "/api/",
        navigationLinks: {
          Home: "/api/README",
        },
      };

      // Add tsconfig if provided
      if (tsconfig) {
        bootstrapOptions.tsconfig = tsconfig;
      }

      app.bootstrap(bootstrapOptions);
      const project = app.convert();

      if (project) {
        // 1. Generate doc/api, doc/api/_meta.json by typedoc
        const absoluteApiDir = path.join(docRoot!, outDir);
        await app.generateDocs(project, absoluteApiDir);
        await patchGeneratedApiDocs(absoluteApiDir);
      }

      return config;
    },
  };
}
