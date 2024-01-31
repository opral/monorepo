import { sourceLanguageTag, availableLanguageTags } from "./src/paraglide/runtime.js"
import { paraglide as paraglideVitePlugin } from "@inlang/paraglide-js-adapter-vite"
import { defineConfig } from "astro/config"
import mdx from "@astrojs/mdx"
import sitemap from "@astrojs/sitemap"
import svelte, { vitePreprocess } from "@astrojs/svelte"

import path from "node:path"

export default defineConfig({
	site: "https://example.com",
	integrations: [
		mdx(),
		sitemap(),
		svelte({ preprocess: [vitePreprocess()] }),
		paraglide({
			project: "./project.inlang",
			outdir: "./src/paraglide",
		}),
	],
	i18n: {
		defaultLocale: sourceLanguageTag,
		locales: [...availableLanguageTags],
		routing: {
			prefixDefaultLocale: false,
			strategy: "pathname",
		},
	},
})

/**
 *
 * @param {{ project: string, outdir: string  }} integrationConfig
 * @returns {import("astro").AstroIntegration}
 */
function paraglide(integrationConfig) {
	return {
		name: "paraglide",
		hooks: {
			"astro:config:setup": async ({ addMiddleware, updateConfig, injectScript }) => {
				addMiddleware({
					order: "pre",
					entrypoint: path.resolve(import.meta.dirname, "./middleware.js"),
				})

				updateConfig({
					vite: {
						plugins: [
							paraglideVitePlugin({
								project: integrationConfig.project,
								outdir: integrationConfig.outdir,
							}),
						],
					},
				})

				injectScript(
					"before-hydration",
					`import { isAvailableLanguageTag, setLanguageTag, sourceLanguageTag } from "$paraglide/runtime";
					const htmlLang = document.documentElement.lang;
					const language = isAvailableLanguageTag(htmlLang) ? htmlLang : sourceLanguageTag;
					setLanguageTag(language);`
				)

				return undefined
			},
		},
	}
}
