import { subscribeNewsletter } from "./subscribeNewsletter.js"
import { subscribeCategory } from "./subscribeCategory.js"
import { machineTranslateMessage } from "./machineTranslateMessage.js"
import { search } from "./search.js"

export const allRpcs = {
	machineTranslateMessage,
	/**
	 * @deprecated use machineTranslateMessage instead
	 */
	machineTranslate: () => undefined,
	subscribeNewsletter,
	subscribeCategory,
	search,
}

export type AllRpcs = typeof allRpcs
