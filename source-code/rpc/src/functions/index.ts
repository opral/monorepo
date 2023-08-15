import { machineTranslateMessage } from "./machineTranslateMessage.js"
import { subscribeNewsletter } from "./subscribeNewsletter.js"

export const allRpcs = {
	machineTranslateMessage,
	subscribeNewsletter,
}

export type AllRpcs = typeof allRpcs
