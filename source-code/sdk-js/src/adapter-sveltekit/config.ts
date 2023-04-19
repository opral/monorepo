import { stat } from "node:fs/promises"

export const doesPathExist = async (path: string) => !!(await stat(path).catch(() => undefined))

export const getConfig = async () => {
	const srcFolder = process.cwd() + '/src'

	const hasAlreadyBeenInitialized = await doesPathExist(srcFolder + '/routes/(app)')

	// TODO: read information from files
	const isReactive = true

	return {
		srcFolder,
		hasAlreadyBeenInitialized,
		isReactive,
	}
}