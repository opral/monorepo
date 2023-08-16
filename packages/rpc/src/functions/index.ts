import { subscribeNewsletter } from "./subscribeNewsletter.js"
import { machineTranslateMessage } from "./machineTranslateMessage.js"

export const allRpcs = {
	machineTranslateMessage,
	/**
	 * @deprecated use machineTranslateMessage instead
	 */
	machineTranslate: () => undefined,
	subscribeNewsletter,
}

export type AllRpcs = typeof allRpcs
