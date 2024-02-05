import { sourceLanguageTag, availableLanguageTags } from "./src/paraglide/runtime.js";
import paraglide from "@inlang/paraglide-js-adapter-astro";
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import svelte, { vitePreprocess } from "@astrojs/svelte";
import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  site: "https://example.com",
  integrations: [mdx(), sitemap({
    i18n: {
      defaultLocale: "en",
      // All urls that don't contain `es` or `fr` after `https://stargazers.club/` will be treated as default locale, i.e. `en`
      locales: {
        en: "en-US",
        // The `defaultLocale` value must present in `locales` keys
        es: "es-ES",
        fr: "fr-CA"
      }
    }
  }), svelte({
    preprocess: [vitePreprocess()]
  }), paraglide({
    project: "./project.inlang",
    outdir: "./src/paraglide"
  })],
  output: "server",
  i18n: {
    defaultLocale: sourceLanguageTag,
    locales: [...availableLanguageTags],
    routing: {
      prefixDefaultLocale: false,
      strategy: "pathname"
    }
  },
  adapter: node({
    mode: "standalone"
  })
});