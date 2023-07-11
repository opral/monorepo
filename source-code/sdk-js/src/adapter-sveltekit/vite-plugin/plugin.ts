import { dedent } from "ts-dedent"
import type { ViteDevServer, Plugin } from "vite"
import { assertAppTemplateIsCorrect } from "./checks/appTemplate.js"
import { assertRoutesFolderPathExists, assertNecessaryFilesArePresent } from "./checks/routes.js"
import { getTransformConfig, resetConfig } from "./config.js"
import { getFileInformation } from "./fileInformation.js"
import { transformCode } from "./transforms/index.js"

let viteServer: ViteDevServer | undefined

const virtualModuleId = "virtual:inlang-static"
const resolvedVirtualModuleId = "\0" + virtualModuleId

export const plugin = () => {
	return {
		name: "vite-plugin-inlang-sdk-js-sveltekit",
		// makes sure we run before vite-plugin-svelte
		enforce: "pre",

		configureServer(server) {
			viteServer = server as unknown as ViteDevServer
		},

		config() {
			return {
				ssr: {
					// makes sure that `@inlang/sdk-js` get's transformed by vite in order
					// to be able to use `SvelteKit`'s `$app` aliases
					noExternal: ["@inlang/sdk-js"],
				},
			}
		},

		resolveId(id) {
			if (id === virtualModuleId) {
				return resolvedVirtualModuleId
			}

			return
		},

		async load(id) {
			const config = await getTransformConfig()
			if (id === resolvedVirtualModuleId) {
				return dedent`
					export const referenceLanguage = ${JSON.stringify(config.inlang.referenceLanguage)}
					export const languages = ${JSON.stringify(config.inlang.languages)}
					export const resources = ${JSON.stringify(
						await config.inlang.readResources({ config: config.inlang }),
					)}
				`
			}

			return
		},

		async buildStart() {
			const config = await getTransformConfig()

			await assertAppTemplateIsCorrect(config)
			await assertRoutesFolderPathExists(config)
			const hasCreatedANewFile = await assertNecessaryFilesArePresent(config)

			if (hasCreatedANewFile) {
				setTimeout(() => {
					resetConfig()
					viteServer && viteServer.restart()
				}, 1000) // if the server immediately get's restarted, then you would not be able to kill the process with CTRL + C; It seems that delaying the restart fixes this issue
			}
		},

		async transform(code, id) {
			const config = await getTransformConfig()

			const fileInformation = getFileInformation(config, id)
			// eslint-disable-next-line unicorn/no-null
			if (!fileInformation) return null

			const transformedCode = transformCode(id, config, code, fileInformation)
			if (config.debug) {
				const filePath = id.replace(config.cwdFolderPath, "")
				console.info(dedent`
					-- INLANG DEBUG START-----------------------------------------------------------

					transformed file '${filePath}' (${fileInformation.type})

					-- INPUT -----------------------------------------------------------------------

					${code}

					-- OUTPUT ----------------------------------------------------------------------

					${code === transformedCode ? "NO TRANSFORMATIONS MADE" : transformedCode}

					-- INLANG DEBUG END ------------------------------------------------------------
				`)
			}

			return transformedCode
		},
	} satisfies Plugin
}
