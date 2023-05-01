import { readFile, writeFile } from "node:fs/promises"
import { initConfig } from '../../config/index.js'
import { stat } from "node:fs/promises"

export const doesPathExist = async (path: string) => !!(await stat(path).catch(() => undefined))

export type TransformConfig = {
	languageInUrl: boolean
	isStatic: boolean
	srcFolder: string
	rootRoutesFolder: string
	hasAlreadyBeenInitialized: boolean
}

const cwd = process.cwd()

let configPromise: Promise<TransformConfig> | undefined = undefined

export const getTransformConfig = async (): Promise<TransformConfig> => {
	if (configPromise) return configPromise

	// eslint-disable-next-line no-async-promise-executor
	return configPromise = new Promise<TransformConfig>(async (resolve) => {
		const srcFolder = cwd + "/src"
		const routesFolder = srcFolder + "/routes"

		await createInlangConfigIfNotPresentYet()

		const inlangConfig = await initConfig()

		const languageInUrl = inlangConfig?.sdk?.languageNegotiation?.strategies?.some(({ type }) => type === 'url') || false
		const isStatic = await shouldContentBePrerendered(routesFolder)

		const rootRoutesFolder = routesFolder + "/(app)" + (languageInUrl ? "/[lang]" : "")

		const hasAlreadyBeenInitialized = await doesPathExist(rootRoutesFolder)

		resolve({
			languageInUrl,
			isStatic,
			srcFolder,
			rootRoutesFolder,
			hasAlreadyBeenInitialized,
		})
	})
}

export const resetConfig = () => configPromise = undefined

// ------------------------------------------------------------------------------------------------

const createInlangConfigIfNotPresentYet = async () => {
	const inlangConfigPath = cwd + "/inlang.config.js"
	const inlangConfigExists = await doesPathExist(inlangConfigPath)
	if (inlangConfigExists) return

	return writeFile(inlangConfigPath, `
/**
 * @type {import("@inlang/core/config").DefineConfig}
 */
export async function defineConfig(env) {
	const plugin = await env.$import(
	 	"https://cdn.jsdelivr.net/gh/samuelstroschein/inlang-plugin-json@1/dist/index.js",
	)

	const pluginConfig = {
		pathPattern: "./languages/{language}.json",
	}

	return {
		referenceLanguage: "en",
		languages: await plugin.getLanguages({ ...env, pluginConfig }),
		readResources: (args) => plugin.readResources({ ...args, ...env, pluginConfig }),
		writeResources: (args) => plugin.writeResources({ ...args, ...env, pluginConfig }),
		sdk: {
			languageNegotiation: {
				strategies: [{ type: "navigator" }, { type: "localStorage" }],
			},
		},
	}
}
`)
}

// ------------------------------------------------------------------------------------------------

const shouldContentBePrerendered = async (routesFolder: string) => {
	const filesToLookFor = [
		'+layout.server.js',
		'+layout.server.ts',
		'+layout.js',
		'+layout.ts',
	]

	for (const file of filesToLookFor) {
		const fileContents = await readFile(routesFolder + `/${file}`, "utf-8").catch(() => undefined)
		if (!fileContents) continue

		// TODO: check using AST
		if (fileContents.match(/export const prerender\s*=\s*(true|['"]auto['"])/)) return true
	}

	return false
}