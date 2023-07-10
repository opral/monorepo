import { machineTranslate } from "./machineTranslate.js"
import { generateConfigFileServer } from "./generateConfigFile.js"
import { subscribeNewsletter } from "./subscribeNewsletter.js"

export const allRpcs = {
	machineTranslate,
	generateConfigFileServer,
	subscribeNewsletter,
}

export type AllRpcs = typeof allRpcs
