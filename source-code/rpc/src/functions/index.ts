import { machineTranslate } from "./machineTranslate.js"
import { generateConfigFile } from "./generateConfigFile.js"

export const allRpcs = {
	machineTranslate,
	generateConfigFile,
}

export type AllRpcs = typeof allRpcs
