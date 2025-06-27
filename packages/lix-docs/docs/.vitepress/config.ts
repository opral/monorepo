import { defineConfig } from "vitepress";
import typedocSidebar from "../api/reference/typedoc-sidebar.json";

// Fix typedoc sidebar links
const fixTypedocSidebar = (sidebar: any) => {
  return sidebar.map((section: any) => {
    return {
      ...section,
      items: section.items.map((item: any) => {
        return {
          ...item,
          link: item.link.replace("/docs", "").replace(".md", ""),
        };
      }),
    };
  });
};

export default defineConfig({
  title: "Lix SDK Documentation",
  description:
    "Official documentation for the Lix SDK - a change control system that runs in the browser",
  rewrites: {
    "guide/index.md": "index.md",
  },
  appearance: {
    // @ts-expect-error not fully supported yet
    initialValue: "light",
  },
  head: [
    ["link", { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" }],
    ["link", { rel: "alternate icon", href: "/favicon.ico" }], // Fallback for browsers that don't support SVG
    ["link", { rel: "mask-icon", href: "/favicon.svg", color: "#08B5D6" }],
    ["meta", { name: "theme-color", content: "#08B5D6" }],
  ],
  themeConfig: {
    siteTitle: "Lix SDK",

    nav: [
      { text: "Guide", link: "/" },
      { text: "API", link: "/api/" },
      { text: "Plugins", link: "/plugins/" },
      { text: "Examples", link: "/examples/" },
    ],

    sidebar: {
      "/": [
        {
          text: "Introduction",
          items: [
            { text: "What is Lix?", link: "/" },
            { text: "Getting Started", link: "/guide/getting-started" },
            { text: "How Lix Works", link: "/guide/how-lix-works" },
          ],
        },
        {
          text: "Core Concepts",
          items: [
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
      "/api/": [
        {
          text: "API Reference",
          items: [
            { text: "Overview", link: "/api/" },
            { text: "TypeDoc Reference", link: "/api/reference/" },
          ],
        },
      ],
      "/api/reference/": fixTypedocSidebar(typedocSidebar),
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
      { icon: "github", link: "https://github.com/opral/lix-sdk" },
      { icon: "discord", link: "https://discord.gg/xjQA897RyK" },
    ],

    footer: {
      message: "Released under the Apache-2.0 License",
      copyright: "Copyright © 2023-present Opral, Inc.",
    },

    search: {
      provider: "local",
    },
  },
});
