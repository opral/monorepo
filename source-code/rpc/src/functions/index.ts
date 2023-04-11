import { machineTranslate } from "./machineTranslate.js"
import { generateConfigFileServer } from "./generateConfigFile.js"

export const allRpcs = {
	machineTranslate,
	generateConfigFileServer,
}

export type AllRpcs = typeof allRpcs
