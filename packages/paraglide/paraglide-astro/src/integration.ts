import type { AstroIntegration } from "astro"
import { paraglide } from "@inlang/paraglide-vite"
import path from "node:path"
import { alias } from "./alias.js"
import { fileURLToPath } from "node:url"
import { nodeNormalizePath } from "./utilts.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const middlewarePath = path.join(__dirname, "middleware.js")

export function integration(integrationConfig: {
	project: string
	outdir: string
}): AstroIntegration {
	return {
		name: "paraglide",
		hooks: {
			"astro:config:setup": async ({ addMiddleware, updateConfig, injectScript }) => {
				//Register the middleware
				addMiddleware({
					order: "pre", //Run before user-defined middleware (why not?)
					entrypoint: middlewarePath,
				})

				const runtimePath = path.resolve(process.cwd(), integrationConfig.outdir, "runtime.js")

				//Register the vite plugin
				updateConfig({
					vite: {
						plugins: [
							paraglide({
								project: integrationConfig.project,
								outdir: integrationConfig.outdir,
							}),
							alias({
								//normalizing the path is very important!
								//otherwise you get duplicate modules on windows
								//learned that one the hard way (parjs-47)
								"virtual:paraglide-astro:runtime": nodeNormalizePath(runtimePath),
							}),
						],
					},
				})

				injectScript(
					"before-hydration",
					`
                    import { isAvailableLanguageTag, setLanguageTag, sourceLanguageTag } from "virtual:paraglide-astro:runtime";
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
