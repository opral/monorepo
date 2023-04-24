import { readFile } from "node:fs/promises"
import { initConfig } from "../../config/index.js"
import { doesPathExist } from './utils.js'

export type Config = {
	languageInUrl: boolean
	isStatic: boolean
	srcFolder: string
	rootRoutesFolder: string
	hasAlreadyBeenInitialized: boolean
}

let cachedConfig: Config | undefined

const cwd = process.cwd()

export const getConfig = async (): Promise<Config> => {
	if (cachedConfig) return cachedConfig

	const inlangConfig = await initConfig()
	const svelteConfig = await readFile("svelte.config.js", "utf-8")

	const languageInUrl = inlangConfig?.sdk?.languageNegotiation?.strategies?.some(({ type }) => type === 'url') || false
	const isStatic = svelteConfig.includes('@sveltejs/adapter-static')

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
