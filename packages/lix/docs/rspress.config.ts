import * as path from "node:path";
import { defineConfig } from "@rspress/core";
import { syncReactUtilsReadmePlugin } from "./rspress-plugins/sync-react-utils-readme";
import {
  generateApiDocs,
  generateApiSidebar,
} from "./rspress-plugins/typedoc-plugin";
import {
  mermaidComponentPath,
  remarkMermaid,
} from "./rspress-plugins/remark-mermaid";

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
  plugins: [syncReactUtilsReadmePlugin()],
  themeConfig: {
    darkMode: false,
    nav: [
      { text: "Docs", link: "/docs/what-is-lix" },
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
          ],
        },
        {
          text: "Essentials",
          items: [
            { text: "How Lix Works", link: "/docs/how-lix-works" },
            { text: "Querying Changes", link: "/docs/querying-changes" },
            { text: "Data Model", link: "/docs/data-model" },
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
        content: "https://discord.gg/xjQA897RyK",
      },
    ],
    footer: {
      message: "Released under the Apache-2.0 License",
    },
  },
});
