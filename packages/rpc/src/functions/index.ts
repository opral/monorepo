import { subscribeNewsletter } from "./subscribeNewsletter.js"
import { subscribeCategory } from "./subscribeCategory.js"
import { machineTranslateBundle } from "./machineTranslateBundle.js"

export const allRpcs = {
	machineTranslateBundle,
	/**
	 * @deprecated renamed to `machineTranslateBundle`
	 */
	machineTranslateMessage: machineTranslateBundle,
	subscribeNewsletter,
	subscribeCategory,
}

export type AllRpcs = typeof allRpcs
