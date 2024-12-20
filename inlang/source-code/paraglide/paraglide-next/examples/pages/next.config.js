const { paraglide } = require("@inlang/paraglide-next/plugin");

/** @type {import('next').NextConfig} */
module.exports = paraglide({
  paraglide: {
    project: "./project.inlang",
    outdir: "./src/paraglide",
  },
  i18n: {
    locales: ["en", "de"],
    defaultLocale: "en",
  },
});
