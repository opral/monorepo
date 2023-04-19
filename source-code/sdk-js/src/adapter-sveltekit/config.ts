import { stat } from "node:fs/promises"

export const doesPathExist = async (path: string) => !!(await stat(path).catch(() => undefined))

export const getConfig = async () => {
	// TODO: read information from files
	const isSPA = false
	const isStatic = false

	const srcFolder = process.cwd() + '/src'
	const rootRoutesFolder = srcFolder + '/routes/(app)' + (isSPA ? '' : '/[lang]')

	const hasAlreadyBeenInitialized = await doesPathExist(rootRoutesFolder)

	return {
		isSPA,
		isStatic,
		srcFolder,
		rootRoutesFolder,
		hasAlreadyBeenInitialized,
	}
}