import { machineTranslate } from "./machineTranslate.js"
import { generateConfigFileServer } from "./generateConfigFile.js"
import { subscribeNewsletter } from "./subscribeNewsletter.js"
import { getLangResources } from "./getLangResources.js"

export const allRpcs = {
	machineTranslate,
	generateConfigFileServer,
	subscribeNewsletter,
	getLangResources,
}

export type AllRpcs = typeof allRpcs
