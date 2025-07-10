import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

// https://vitepress.dev/reference/site-config
export default withMermaid(
  defineConfig({
    title: "Lix HTML Diff",
    description: "Build a diff view in your app with this HTML differ",
    rewrites: {
      "README.md": "index.md",
    },
    themeConfig: {
      // https://vitepress.dev/reference/default-theme-config
      nav: [{ text: "Home", link: "/" }],

      sidebar: [
        {
          text: "Documentation",
          items: [{ text: "Getting Started", link: "/" }],
        },
      ],

      socialLinks: [
        {
          icon: "github",
          link: "https://github.com/opral/monorepo/tree/main/packages/lix/lix-html-diff",
        },
      ],
    },
  })
);
