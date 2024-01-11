import dedent from "dedent"
import type { ViteDevServer, Plugin as VitePlugin } from "vite"
import { assertAppTemplateIsCorrect } from "./checks/appTemplate.js"
import { assertRoutesFolderPathExists, assertNecessaryFilesArePresent } from "./checks/routes.js"
import { initVirtualModule, resetTransformConfig, type VirtualModule } from "./config/index.js"
import { filePathForOutput, getFileInformation } from "./fileInformation.js"
import { transformCode } from "../ast-transforms/index.js"
import { InlangSdkException } from "./exceptions.js"
import { inspect } from "node:util"
import path from "node:path"
import { rm } from "node:fs/promises"
import { doesPathExist } from "./config/utils/utils.js"
import { getNodeishFs } from "./config/utils/getNodeishFs.js"
// TODO: expose those functions somewhere
import {
	createEffect as _createEffect,
	// @ts-ignore
} from "solid-js/dist/solid.js"

const createEffect = _createEffect as typeof import("solid-js")["createEffect"]

let viteServer: ViteDevServer | undefined

const virtualModuleId = "virtual:inlang-static"
const resolvedVirtualModuleId = "\0" + virtualModuleId

export const plugin = async () => {
	const fs = await getNodeishFs()

	return {
		name: "vite-plugin-inlang-paraglide-js-sveltekit",
		// makes sure we run before vite-plugin-svelte
		enforce: "pre",

		configureServer(server) {
			viteServer = server as unknown as ViteDevServer
		},

		config() {
			return {
				ssr: {
					// makes sure that `@inlang/paraglide-js-sveltekit` get's transformed by vite in order
					// to be able to use `SvelteKit`'s `$app` aliases
					noExternal: ["@inlang/paraglide-js-sveltekit"],
				},
				optimizeDeps: {
					include: ["@inlang/paraglide-js-sveltekit/**/*"],
					exclude: ["vitefu"],
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
			if (id === resolvedVirtualModuleId) {
				const config = await initVirtualModule()
				return dedent`
					export const sourceLanguageTag = ${JSON.stringify(config.sourceLanguageTag)}
					export const languageTags = ${JSON.stringify(config.languageTags)}
					export const messages = ${JSON.stringify(config.messages)}
				`
			}

			return
		},

		async buildStart() {
			const config = await initVirtualModule().catch((error) => {
				throw new Error(error)
			})

			await assertAppTemplateIsCorrect(config)
			await assertRoutesFolderPathExists(fs, config)
			const hasCreatedANewFile = await assertNecessaryFilesArePresent(fs, config)

			// remove old files // TODO: remove this in version 1
			let deletedFolder = false
			const pathToOldLanguagesFolder = path.resolve(
				config.svelteKit.files.routes,
				"inlang",
				"[language].json",
			)
			if (await doesPathExist(fs, pathToOldLanguagesFolder)) {
				await rm(pathToOldLanguagesFolder, { recursive: true })
				deletedFolder = true
			}

			if (hasCreatedANewFile || deletedFolder) {
				setTimeout(() => {
					resetTransformConfig()
					viteServer && viteServer.restart()
				}, 1000) // if the server immediately get's restarted, then you would not be able to kill the process with CTRL + C; It seems that delaying the restart fixes this issue
			}

			createEffect(() => {
				config.messages
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				viteServer?.ws.send({
					type: "custom",
					event: "inlang-messages-changed",
					// TODO: only HMR if the currently visible language changes
				})
			})
		},

		async transform(code, id) {
			const config = await initVirtualModule()
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
				logConfig(config)

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
	} satisfies VitePlugin
}

let configLogged = false
const logConfig = (config: VirtualModule) => {
	if (configLogged) return

	const { messages: _, ...configToLog } = config
	console.info(dedent`
		-- INLANG RESOLVED CONFIG ------------------------------------------------------

		${inspect(configToLog, false, 99)}

	`)

	configLogged = true
}

const REGEX_DEBUG_IMPORT = /import\s+["']@inlang\/sdk-js\/debug["']/

const includesDebugImport = (code: string) => REGEX_DEBUG_IMPORT.test(code)

export class InlangTransformException extends InlangSdkException {
	constructor(path: string, override readonly cause: Error) {
		super(dedent`
			An error occurred while transforming the code in file (${path})

			Please open an issue on GitHub so we can investigate and improve the SDK: https://github.com/opral/monorepo/issues/new/

			Don't worry, we can probably already unblock you so you can continue working on your project.
			You can find more information about it here: https://inlang.com/documentation/sdk/sveltekit/advanced
		`)
	}
}
