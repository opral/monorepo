import { machineTranslate } from "./machineTranslateMessage.js"
import { subscribeNewsletter } from "./subscribeNewsletter.js"

export const allRpcs = {
	machineTranslate,
	subscribeNewsletter,
}

export type AllRpcs = typeof allRpcs
