import { dedent } from "ts-dedent"
import type { ViteDevServer, Plugin } from "vite"
import { assertAppTemplateIsCorrect } from "./checks/appTemplate.js"
import { assertRoutesFolderPathExists, assertNecessaryFilesArePresent } from "./checks/routes.js"
import { getTransformConfig, resetConfig } from "./config.js"
import { filePathForOutput, getFileInformation } from "./fileInformation.js"
import { transformCode } from "../ast-transforms/index.js"
import { InlangSdkException } from "./exceptions.js"

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

			const filePath = filePathForOutput(config, id)

			let transformedCode: string = code
			try {
				transformedCode = transformCode(id, config, code, fileInformation)
			} catch (error) {
				throw new InlangTransformException(filePath, error as Error)
			}

			if (config.debug || includesDebugImport(code)) {
				console.info(dedent`
					-- INLANG DEBUG START ----------------------------------------------------------

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

const REGEX_DEBUG_IMPORT = /import\s+["']@inlang\/sdk-js\/debug["']/

const includesDebugImport = (code: string) => REGEX_DEBUG_IMPORT.test(code)

export class InlangTransformException extends InlangSdkException {
	constructor(path: string, override readonly cause: Error) {
		super(dedent`
			An error occurred while transforming the code in file (${path})

			Please open an issue on GitHub so we can investigate and improve the SDK: https://github.com/inlang/inlang/issues/new/

			Don't worry, we can probably already unblock you so you can continue working on your project.
			You can find more information about it here: https://inlang.com/documentation/sdk/sveltekit/advanced
		`)
	}
}
