import * as path from "node:path";
import { defineConfig } from "rspress/config";
import mermaid from "rspress-plugin-mermaid";
import { syncReactUtilsReadmePlugin } from "./rspress-plugins/sync-react-utils-readme";
import {
  generateApiDocs,
  generateApiSidebar,
} from "./rspress-plugins/typedoc-plugin";

// Generate API docs before creating the config
// We need to generate the API docs at the top level (before defineConfig) because
// the sidebar generation function (generateApiSidebar) runs synchronously during
// config evaluation. If we used a plugin instead, the API docs would be generated
// asynchronously after the sidebar tries to read them, resulting in an empty sidebar.
console.log("Generating API Reference documentation...");
await generateApiDocs({
  entryPoints: [path.join(__dirname, "../sdk/src/index.ts")],
  tsconfig: path.join(__dirname, "../sdk/tsconfig.json"),
  docRoot: path.join(__dirname, "docs"),
  title: "Lix",
});
console.log("✅ API Reference documentation generated successfully.");

export default defineConfig({
  root: path.join(__dirname, "docs"),
  outDir: "docs_build",
  title: "Lix",
  logo: "/logo.svg",
  description:
    "Official documentation for the Lix SDK - a change control system that runs in the browser",
  icon: "/logo.svg",
  globalStyles: path.join(__dirname, "docs/styles/index.css"),
  route: {
    cleanUrls: true,
    exclude: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
  },
  markdown: {
    // Disable Rust MDX compiler to support global components
    mdxRs: false,
    globalComponents: [
      path.join(__dirname, "docs/components/InteractiveExampleCard.tsx"),
    ],
  },
  builderConfig: {
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
  plugins: [mermaid(), syncReactUtilsReadmePlugin()],
  themeConfig: {
    darkMode: false,
    nav: [
      { text: "Docs", link: "/guide/getting-started" },
      { text: "API Reference", link: "/api/" },
    ],
    sidebar: {
      "/guide/": [
        {
          text: "Introduction",
          items: [
            { text: "Getting Started", link: "/guide/getting-started" },
            {
              text: "Lix for AI Agents",
              link: "/guide/ai-agent-collaboration",
            },
            { text: "Architecture", link: "/guide/architecture" },
          ],
        },
        {
          text: "Most Used Features",
          collapsed: false,
          items: [
            {
              text: "Change Proposals",
              link: "/guide/change-proposals",
            },
            { text: "Entity-level diffs", link: "/guide/diffs" },
            { text: "History", link: "/guide/history" },
            {
              text: "Validation Rules",
              link: "/guide/validation-rules",
            },
            { text: "Versions (Branching)", link: "/guide/versions" },
          ],
        },
        {
          text: "More Features",
          collapsed: true,
          items: [
            {
              text: "Attribution (Blame)",
              link: "/guide/attribution",
            },
            { text: "Restore", link: "/guide/restore" },
            { text: "Undo/Redo", link: "/guide/undo-redo" },
            { text: "Conversations", link: "/guide/conversations" },
            { text: "Labels", link: "/guide/concepts/labels" },
            { text: "Key Value Store", link: "/guide/concepts/key-value" },
          ],
        },
        {
          text: "Concepts",
          collapsed: true,
          items: [
            { text: "What is an Entity?", link: "/guide/entity" },
            { text: "Lix Schema", link: "/guide/schema" },
            { text: "Metadata", link: "/guide/metadata" },
            { text: "Writer Key", link: "/guide/writer-key" },
            { text: "Persistence", link: "/guide/persistence" },
            { text: "Environment API", link: "/guide/environment-api" },
          ],
        },
        {
          text: "Development & Debugging",
          collapsed: true,
          items: [
            { text: "Testing", link: "/guide/testing" },
            { text: "Logging", link: "/guide/logging" },
            { text: "Deterministic Mode", link: "/guide/deterministic-mode" },
            { text: "React Utils", link: "/guide/react-utils" },
          ],
        },
      ],
      "/api/": generateApiSidebar(path.join(__dirname, "docs")),
      "/plugins/": [
        {
          text: "Plugins",
          items: [
            { text: "Overview", link: "/plugins/" },
            { text: "Creating Plugins", link: "/plugins/creating-plugins" },
            { text: "JSON Plugin", link: "/plugins/json" },
            { text: "CSV Plugin", link: "/plugins/csv" },
            { text: "Markdown Plugin", link: "/plugins/markdown" },
          ],
        },
      ],
      "/examples/": [
        {
          text: "Examples",
          items: [
            { text: "Overview", link: "/examples/" },
            { text: "Basic Usage", link: "/examples/basic-usage" },
            {
              text: "Version Management",
              link: "/examples/version-management",
            },
            { text: "Collaboration", link: "/examples/collaboration" },
            { text: "Building an App", link: "/examples/building-an-app" },
          ],
        },
      ],
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
