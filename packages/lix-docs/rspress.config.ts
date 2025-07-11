import * as path from "node:path";
import { defineConfig } from "rspress/config";
import mermaid from "rspress-plugin-mermaid";
import {
  customTypeDocPlugin,
  generateApiSidebar,
} from "./rspress-plugins/typedoc-plugin";

export default defineConfig({
  root: path.join(__dirname, "docs"),
  outDir: "docs_build",
  title: "Lix",
  logo: "/logo.svg",
  description:
    "Official documentation for the Lix SDK - a change control system that runs in the browser",
  icon: "/logo.svg",
  globalStyles: path.join(__dirname, "docs/styles/index.css"),
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
              type: "asset/source",
            },
          ],
        },
      },
    },
  },
  plugins: [
    mermaid(),
    customTypeDocPlugin({
      entryPoints: [path.join(__dirname, "../lix-sdk/src/index.ts")],
      tsconfig: path.join(__dirname, "../lix-sdk/tsconfig.json"),
    }),
  ],
  themeConfig: {
    darkMode: false,
    nav: [
      { text: "Guide", link: "/guide/" },
      { text: "Examples", link: "/examples/" },
      { text: "Plugins", link: "/plugins/" },
      { text: "Reference", link: "/api/" },
    ],
    sidebar: {
      "/guide/": [
        {
          text: "Introduction",
          items: [
            { text: "What is Lix?", link: "/guide/" },
            { text: "Getting Started", link: "/guide/getting-started" },
            {
              text: "Lix for AI Agents",
              link: "/guide/ai-agent-collaboration",
            },
            { text: "Architecture", link: "/guide/architecture" },
            { text: "How Lix Works", link: "/guide/how-lix-works" },
          ],
        },
        {
          text: "Ready-made Features",
          collapsed: false,
          items: [
            {
              text: "Attribution (Blame)",
              link: "/guide/features/attribution",
            },
            {
              text: "Change Proposals",
              link: "/guide/features/change-proposals",
            },
            { text: "Diffs", link: "/guide/features/diffs" },
            { text: "History", link: "/guide/features/history" },
            { text: "Restore", link: "/guide/features/restore" },
            { text: "Undo/Redo", link: "/guide/features/undo-redo" },
            {
              text: "Validation Rules",
              link: "/guide/features/validation-rules",
            },
            { text: "Versions (Branching)", link: "/guide/features/versions" },
          ],
        },
        {
          text: "Core Concepts",
          items: [
            { text: "Comments", link: "/guide/features/comments" },
            { text: "Files", link: "/guide/concepts/files" },
            { text: "Changes", link: "/guide/concepts/changes" },
            { text: "Snapshots", link: "/guide/concepts/snapshots" },
            { text: "Change Graph", link: "/guide/concepts/change-graph" },
            { text: "Labels", link: "/guide/concepts/labels" },
            { text: "Change Sets", link: "/guide/concepts/change-sets" },
            { text: "Merging", link: "/guide/concepts/merging" },
            {
              text: "Change Proposals",
              link: "/guide/concepts/change-proposals",
            },
            { text: "Versions", link: "/guide/concepts/versions" },
            { text: "Discussions", link: "/guide/concepts/discussions" },
          ],
        },
        {
          text: "Advanced",
          items: [
            { text: "SQL Queries", link: "/guide/advanced/sql-queries" },
            {
              text: "Browser Integration",
              link: "/guide/advanced/browser-integration",
            },
            { text: "Plugins", link: "/guide/advanced/plugins" },
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
