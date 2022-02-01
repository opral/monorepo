/**
 * Transpiles ESM to commonjs.
 *
 * Otherwise typical "unexpected token error"
 */
const withTranspilation = require("next-transpile-modules")([
  "@headlessui/react",
]);

// the nextra theme
const withNextra = require("nextra")({
  // importing local modified copy of nextra-theme-docs
  theme: "./nextra-theme-docs/src",
  themeConfig: "./theme.config.js",
  unstable_staticImage: true,
  unstable_contentDump: true,
});

module.exports = withTranspilation(
  withNextra({
    // the actual next.js config
    reactStrictMode: true,
    i18n: {
      locales: ["en"],
      defaultLocale: "en",
    },
    async redirects() {
      return [
        {
          source: "/docs",
          destination: "/docs/getting-started",
          permanent: true,
        },
      ];
    },
  })
);
