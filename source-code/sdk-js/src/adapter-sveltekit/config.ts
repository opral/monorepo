import { stat, readFile } from "node:fs/promises"
import { initConfig } from "../config/index.js"

export const doesPathExist = async (path: string) => !!(await stat(path).catch(() => undefined))

export const getConfig = async () => {
	const inlangConfig = await initConfig()
	const svelteConfig = await readFile("svelte.config.js", "utf-8")

	const languageInUrl = inlangConfig?.sdk?.languageNegotiation?.strategies?.some(({ type }) => type === 'url')
	const isStatic = svelteConfig.includes('@sveltejs/adapter-static')

	const srcFolder = process.cwd() + "/src"
	const rootRoutesFolder = srcFolder + "/routes/(app)" + (languageInUrl ? "" : "/[lang]")

	const hasAlreadyBeenInitialized = await doesPathExist(rootRoutesFolder)

	return {
		languageInUrl,
		isStatic,
		srcFolder,
		rootRoutesFolder,
		hasAlreadyBeenInitialized,
	}
}
