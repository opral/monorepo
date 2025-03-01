import { serverAsyncLocalStorage, TREE_SHAKE_IS_SERVER } from "./variables.js";

/**
 * @param {string} safeModuleId
 * @param {Locale} locale
 */
export function trackMessageCall(safeModuleId, locale) {
	if (TREE_SHAKE_IS_SERVER === false) return;

	const store = serverAsyncLocalStorage?.getStore();

	if (store) {
		store.messageCalls?.add(`${safeModuleId}:${locale}`);
	}
}
