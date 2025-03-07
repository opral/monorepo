import { serverAsyncLocalStorage, isServer } from "./variables.js";

/**
 * @param {string} safeModuleId
 * @param {Locale} locale
 */
export function trackMessageCall(safeModuleId, locale) {
	if (isServer === false) return;

	const store = serverAsyncLocalStorage?.getStore();

	if (store) {
		store.messageCalls?.add(`${safeModuleId}:${locale}`);
	}
}
