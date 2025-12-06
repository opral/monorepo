import * as path from "node:path";
import { defineConfig } from "@rspress/core";
import { pluginLlms } from "@rspress/plugin-llms";
import { syncReactUtilsReadmePlugin } from "./rspress-plugins/sync-react-utils-readme";
import {
  syncPluginReadmesPlugin,
  generatePluginsSidebar,
} from "./rspress-plugins/sync-plugin-readmes";
import { syncChangelogPlugin } from "./rspress-plugins/sync-changelog";
import {
  generateApiDocs,
  generateApiSidebar,
} from "./rspress-plugins/typedoc-plugin";
import {
  mermaidComponentPath,
  remarkMermaid,
} from "./rspress-plugins/remark-mermaid";
import { pluginSitemap } from "@rspress/plugin-sitemap";

// Generate API docs before creating the config
// We need to generate the API docs at the top level (before defineConfig) because
// the sidebar generation function (generateApiSidebar) runs synchronously during
// config evaluation. If we used a plugin instead, the API docs would be generated
// asynchronously after the sidebar tries to read them, resulting in an empty sidebar.
console.log("Generating API Reference documentation...");
await generateApiDocs({
  entryPoints: [path.join(__dirname, "../sdk/src/index.ts")],
  tsconfig: path.join(__dirname, "../sdk/tsconfig.json"),
  docRoot: path.join(__dirname, "src/docs"),
  title: "Lix",
});
console.log("✅ API Reference documentation generated successfully.");

export default defineConfig({
  root: path.join(__dirname, "src"),
  outDir: "docs_build",
  title: "Lix",
  logo: "/logo.svg",
  description:
    "Official documentation for the Lix SDK - a change control system that runs in the browser",
  icon: "/logo.svg",
  globalStyles: path.join(__dirname, "src/styles/index.css"),
  // Use the shared theme directory (not inside src) so custom MDX components load, including the LLM copy button.
  themeDir: path.join(__dirname, "theme"),
  route: {
    cleanUrls: true,
    exclude: [
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/*.spec.ts",
      "**/*.spec.tsx",
      "**/examples/**/*.ts",
      "**/components/**/*.{ts,tsx}",
    ],
  },
  markdown: {
    // Disable Rust MDX compiler to support global components
    mdxRs: false,
    globalComponents: [
      path.join(__dirname, "src/docs/components/InteractiveExampleCard.tsx"),
      path.join(__dirname, "src/docs/components/PluginMetadataCard.tsx"),
      mermaidComponentPath,
    ],
    remarkPlugins: [remarkMermaid],
  },
  builderConfig: {
    dev: {
      // Disable lazy compilation to avoid giant dev proxy requests from Shiki/highlighter
      lazyCompilation: false,
    },
    tools: {
      rspack: {
        optimization: {
          // Avoid scope-hoisting collisions between the TypeBox Promise helper and the global Promise.
          concatenateModules: false,
        },
        module: {
          rules: [
            {
              resourceQuery: /raw/,
              use: [
                {
                  loader: path.join(
                    __dirname,
                    "./rspress-plugins/preserve-raw-loader.mjs",
                  ),
                },
              ],
            },
          ],
        },
      },
    },
  },
  plugins: [
    pluginLlms(),
    pluginSitemap({
      siteUrl: "https://lix.dev",
    }),
    syncReactUtilsReadmePlugin(),
    syncPluginReadmesPlugin(),
    syncChangelogPlugin(),
  ],
  themeConfig: {
    darkMode: false,
    nav: [
      { text: "Docs", link: "/docs/what-is-lix" },
      { text: "Plugins", link: "/plugins/" },
      { text: "API Reference", link: "/docs/api/" },
    ],
    sidebar: {
      "/docs/": [
        {
          text: "Introduction",
          items: [
            { text: "What is Lix?", link: "/docs/what-is-lix" },
            { text: "Getting Started", link: "/docs/getting-started" },
            { text: "Comparison to Git", link: "/docs/comparison-to-git" },
            { text: "Lix for AI Agents", link: "/docs/lix-for-ai-agents" },
            { text: "Release Notes", link: "/docs/release-notes" },
          ],
        },
        {
          text: "Essentials",
          items: [
            { text: "Filesystem", link: "/docs/filesystem" },
            { text: "SQL Interface", link: "/docs/sql-interface" },
            { text: "Schemas", link: "/docs/schemas" },
            { text: "Plugins", link: "/docs/plugins" },
            { text: "Persistence", link: "/docs/persistence" },
          ],
        },
        {
          text: "Guides",
          items: [
            { text: "Versions (Branching)", link: "/docs/versions" },
            { text: "History", link: "/docs/history" },
            { text: "Diffs", link: "/docs/diffs" },
            { text: "Attribution (Blame)", link: "/docs/attribution" },
            { text: "Change Proposals", link: "/docs/change-proposals" },
            { text: "Validation Rules", link: "/docs/validation-rules" },
            { text: "Undo/Redo", link: "/docs/undo-redo" },
            { text: "Restore", link: "/docs/restore" },
            { text: "Conversations", link: "/docs/conversations" },
            { text: "Labels", link: "/docs/labels" },
            { text: "Key-Value Store", link: "/docs/key-value" },
            { text: "Environment API", link: "/docs/environment-api" },
            { text: "Testing", link: "/docs/testing" },
            { text: "React Integration", link: "/docs/react-integration" },
            { text: "Logging & Debugging", link: "/docs/logging" },
            { text: "Deterministic Mode", link: "/docs/deterministic-mode" },
            { text: "Metadata", link: "/docs/metadata" },
            { text: "Writer Key", link: "/docs/writer-key" },
            { text: "Architecture", link: "/docs/architecture" },
            { text: "Lix as File Format", link: "/docs/lix-as-file-format" },
          ],
        },
      ],
      "/plugins/": generatePluginsSidebar(path.join(__dirname, "src")),
      "/docs/api/": generateApiSidebar(path.join(__dirname, "src/docs")),
    },
    socialLinks: [
      {
        icon: "github",
        mode: "link",
        content: "https://github.com/opral/lix-sdk",
      },
      {
        icon: "discord",
        mode: "link",
        content: "https://discord.gg/gdMPPWy57R",
      },
    ],
    footer: {
      message: "Released under the Apache-2.0 License",
    },
  },
});
