import { machineTranslate } from "./machineTranslate.js"
import { subscribeNewsletter } from "./subscribeNewsletter.js"

export const allRpcs = {
	machineTranslate,
	subscribeNewsletter,
}

export type AllRpcs = typeof allRpcs
