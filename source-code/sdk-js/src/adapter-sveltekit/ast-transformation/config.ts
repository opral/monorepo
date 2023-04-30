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

let cachedConfig: TransformConfig | undefined

const cwd = process.cwd()

export const getConfig = async (): Promise<TransformConfig> => {
	if (cachedConfig) return cachedConfig

	const srcFolder = cwd + "/src"
	const routesFolder = srcFolder + "/routes"

	const inlangConfig = await initConfig()

	const languageInUrl = inlangConfig?.sdk?.languageNegotiation?.strategies?.some(({ type }) => type === 'url') || false
	const isStatic = await shouldContentBePrerendered(routesFolder)

	const rootRoutesFolder = routesFolder + "/(app)" + (languageInUrl ? "/[lang]" : "")

	const hasAlreadyBeenInitialized = await doesPathExist(rootRoutesFolder)

	return cachedConfig = {
		languageInUrl,
		isStatic,
		srcFolder,
		rootRoutesFolder,
		hasAlreadyBeenInitialized,
	}
}

export const resetConfig = () => cachedConfig = undefined

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