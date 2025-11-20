import * as path from "node:path";
import { defineConfig } from "rspress/config";
import mermaid from "rspress-plugin-mermaid";

export default defineConfig({
  root: path.join(__dirname, "docs"),
  outDir: "docs_build",
  title: "HTML Diff",
  description: "Build a diff view in your app with this HTML differ",
  icon: "/rspress-icon.png",
  globalStyles: path.join(__dirname, "docs/styles/index.css"),
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
  plugins: [mermaid()],
  themeConfig: {
    darkMode: false,
    nav: [
      {
        text: "Guide",
        link: "/guide/",
      },
      {
        text: "Examples",
        link: "/examples/simple-rich-text-document/",
      },
      {
        text: "Playground",
        link: "/playground",
      },
      {
        text: "Test Cases",
        link: "/test-cases",
      },
    ],
    sidebar: {
      "/guide/": [
        {
          text: "Introduction",
          items: [
            {
              text: "Getting Started",
              link: "/guide/",
            },
            {
              text: "How it Works",
              link: "/guide/how-it-works",
            },
            {
              text: "Limitations",
              link: "/guide/limitations",
            },
          ],
        },
        {
          text: "Guide",
          items: [
            {
              text: "Attributes",
              link: "/guide/attributes",
            },
            {
              text: "Styling",
              link: "/guide/styling",
            },
            {
              text: "Interactivity",
              link: "/guide/interactivity",
            },
            {
              text: "Contributing",
              link: "/guide/contributing",
            },
          ],
        },
      ],
      "/examples/": [
        {
          text: "Rich Text Document",
          items: [
            {
              text: "Simple",
              link: "/examples/simple-rich-text-document/",
            },
            {
              text: "Complex",
              link: "/examples/rich-text-document/",
            },
          ],
        },
        {
          text: "Table",
          link: "/examples/table-diff/",
        },
      ],
      "/test-cases": [
        {
          text: "data-diff-key",
          link: "/test-cases#data-diff-key",
        },
        {
          text: "data-diff-mode",
          items: [
            {
              text: "element",
              link: "/test-cases#data-diff-mode='element'",
            },
            {
              text: "words",
              link: "/test-cases#data-diff-mode='words'",
            },
          ],
        },
        {
          text: "data-diff-show-when-deleted",
          link: "/test-cases#data-diff-show-when-removed",
        },
      ],
    },
    socialLinks: [
      {
        icon: "github",
        mode: "link",
        content:
          "https://github.com/opral/monorepo/tree/main/packages/lix/html-diff",
      },
    ],
  },
});
