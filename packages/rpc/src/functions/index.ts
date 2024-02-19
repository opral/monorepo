import { subscribeNewsletter } from "./subscribeNewsletter.js"
import { subscribeCategory } from "./subscribeCategory.js"
import { machineTranslateMessage } from "./machineTranslateMessage.js"
import { getNumberOfProjects } from "./getNumberOfProjects.js"

export const allRpcs = {
	machineTranslateMessage,
	/**
	 * @deprecated use machineTranslateMessage instead
	 */
	machineTranslate: () => undefined,
	subscribeNewsletter,
	subscribeCategory,
	getNumberOfProjects,
}

export type AllRpcs = typeof allRpcs
