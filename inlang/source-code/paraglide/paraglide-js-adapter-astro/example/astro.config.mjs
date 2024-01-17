import { sourceLanguageTag, availableLanguageTags } from "./src/paraglide/runtime.js"
import { paraglide } from "@inlang/paraglide-js-adapter-vite"
import { defineConfig } from "astro/config"
import mdx from "@astrojs/mdx"
import sitemap from "@astrojs/sitemap"

// https://astro.build/config
export default defineConfig({
	site: "https://example.com",
	integrations: [mdx(), sitemap()],
	i18n: {
		defaultLocale: sourceLanguageTag,
		locales: [...availableLanguageTags],
		routing: {
			prefixDefaultLocale: false,
			strategy: "pathname",
		},
	},
	vite: {
		plugins: [
			paraglide({
				project: "./project.inlang",
				outdir: "./src/paraglide",
			}),
		],
	},
})
