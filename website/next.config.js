const withNextra = require("nextra")({
  theme: "nextra-theme-docs",
  themeConfig: "./theme.config.js",
  unstable_stork: false,
  unstable_contentDump: true,
  unstable_staticImage: true,
});

module.exports = withNextra({
  i18n: {
    locales: ["en-US"],
    defaultLocale: "en-US",
  },
  redirects: () => {
    return [
      // nextra does not have index files for docs and blog yet.
      // thus redirect to first article
      {
        source: "/docs",
        destination: "/docs/getting-started",
        statusCode: 302,
      },
      {
        source: "/blog",
        destination: "/blog/inlang-v0-2",
        statusCode: 302,
      },
    ];
  },
});
