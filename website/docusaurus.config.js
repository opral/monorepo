// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "inlang",
  tagline: "Open Source Localization Solution for Software",
  url: "https://inlang.dev",
  baseUrl: "/",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  favicon: "img/favicon.ico",
  organizationName: "inlang", // Usually your GitHub org/user name.
  projectName: "inlang", // Usually your repo name.
  scripts: [
    {
      defer: true,
      "data-theme": "light",
      src: "https://cdn.jsdelivr.net/gh/samuelstroschein/bromb/packages/web/dist/widget.js",
    },
  ],
  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
          // Please change this to your repo.
          editUrl: "https://github.com/inlang/inlang/tree/main/website/docs/",
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          editUrl: "https://github.com/inlang/inlang/tree/main/website/blog/",
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: {
        disableSwitch: true,
      },
      metadata: [
        {
          name: "keywords",
          content:
            "i18n, localization, internationalization, translations, software, javascript, svelte, fluent, mozilla",
        },
      ],
      navbar: {
        title: "Inlang",
        logo: {
          alt: "Inlang Logo",
          src: "img/logo.svg",
        },
        items: [
          {
            type: "doc",
            docId: "intro",
            position: "left",
            label: "Documentation",
          },
          { to: "/blog", label: "Blog", position: "left" },
          {
            href: "https://github.com/inlang/inlang/discussions",
            label: "Forum",
            position: "left",
          },
          {
            href: "https://github.com/inlang/inlang",
            label: "GitHub",
            position: "left",
          },
          {
            href: "https://projectfluent.org/fluent/guide/hello.html",
            label: "Fluent Syntax Guide",
            position: "left",
          },
          {
            href: "https://submission.bromb.co/inlang/docs",
            label: "Ideas on how to improve this site?",
            position: "right",
          },
          {
            href: "https://app.inlang.dev",
            label: "Open Dashboard",
            position: "right",
          },
        ],
      },
      footer: {
        style: "light",
        links: [
          {
            title: "Docs",
            items: [
              {
                label: "Documentation",
                to: "/docs/intro",
              },
            ],
          },
          {
            title: "Community",
            items: [
              {
                label: "Forum",
                href: "https://github.com/inlang/inlang/discussions",
              },
              {
                label: "Discord",
                href: "https://discord.gg/gdMPPWy57R",
              },
              {
                label: "Twitter",
                href: "https://twitter.com/SamuelStros",
              },
            ],
          },
          {
            title: "More",
            items: [
              {
                label: "Blog",
                to: "/blog",
              },
              {
                label: "GitHub",
                href: "https://github.com/inlang/inlang",
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Inlang.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
