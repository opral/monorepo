import { subscribeNewsletter } from "./subscribeNewsletter.js"
import { subscribeCategory } from "./subscribeCategory.js"
import { machineTranslateBundle } from "./machineTranslateBundle.js"

export const allRpcs = {
	machineTranslateBundle,
	subscribeNewsletter,
	subscribeCategory,
}

export type AllRpcs = typeof allRpcs
