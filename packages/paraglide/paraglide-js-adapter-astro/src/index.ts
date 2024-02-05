import type { AstroIntegration } from "astro"
import { paraglide as paraglideVitePlugin } from "@inlang/paraglide-js-adapter-vite"
import path from "node:path"
import { alias } from "./alias.js"

const middlewarePath = path.resolve(import.meta.dirname, "middleware.js")

export function paraglide(integrationConfig: {
	project: string
	outdir: string
}): AstroIntegration {
	return {
		name: "paraglide",
		hooks: {
			"astro:config:setup": async ({ addMiddleware, updateConfig, injectScript }) => {
				//Register the middleware
				addMiddleware({
					order: "pre",
					entrypoint: middlewarePath,
				})

				//Register the vite plugin
				updateConfig({
					vite: {
						plugins: [
							paraglideVitePlugin({
								project: integrationConfig.project,
								outdir: integrationConfig.outdir,
							}),
							alias({
								"paraglide-js-adapter-astro:runtime": path.resolve(
									process.cwd(),
									integrationConfig.outdir,
									"runtime.js"
								),
							}),
						],
					},
				})

				injectScript(
					"before-hydration",
					`
                    import { isAvailableLanguageTag, setLanguageTag, sourceLanguageTag } from "paraglide-js-adapter-astro:runtime";
					const htmlLang = document.documentElement.lang;
					const language = isAvailableLanguageTag(htmlLang) ? htmlLang : sourceLanguageTag;
					setLanguageTag(language);
                    `
				)

				return undefined
			},
		},
	}
}

declare global {
	interface ImportMeta {
		dirname: string
		filename: string
	}
}
