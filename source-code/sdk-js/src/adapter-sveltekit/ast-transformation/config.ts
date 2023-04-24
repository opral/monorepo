import { readFile } from "node:fs/promises"
import { initConfig } from "../../config/index.js"
import { doesPathExist } from './utils.js'

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

	const inlangConfig = await initConfig()
	const svelteConfig = await readFile("svelte.config.js", "utf-8")

	const languageInUrl = inlangConfig?.sdk?.languageNegotiation?.strategies?.some(({ type }) => type === 'url') || false
	const isStatic = svelteConfig.includes('@sveltejs/adapter-static') // TODO: static means if `prerender` is set to true at the root

	const srcFolder = cwd + "/src"
	const rootRoutesFolder = srcFolder + "/routes/(app)" + (languageInUrl ? "/[lang]" : "")

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
