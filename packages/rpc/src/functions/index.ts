import { subscribeNewsletter } from "./subscribeNewsletter.js";
import { subscribeCategory } from "./subscribeCategory.js";
import { machineTranslateBundle } from "./machineTranslateBundle.js";
import { machineTranslateMessage } from "./machineTranslateMessage.js";

export const allRpcs = {
	machineTranslateBundle,
	machineTranslateMessage,
	subscribeNewsletter,
	subscribeCategory,
};

export type AllRpcs = typeof allRpcs;
