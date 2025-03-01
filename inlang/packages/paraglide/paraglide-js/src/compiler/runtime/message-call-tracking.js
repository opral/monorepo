import { serverAsyncLocalStorage, TREE_SHAKE_IS_SERVER } from "./variables.js";

/**
 * @param {(...args: any[]) => any} fn
 */
export function withMessageCallTracking(fn) {
	const calls = new Set();
	const result = serverAsyncLocalStorage?.run({ messageCalls: calls }, fn);
	return [result, calls];
}

/**
 * @param {string} safeModuleId
 * @param {Locale} locale
 */
export function trackMessageCall(safeModuleId, locale) {
	if (!TREE_SHAKE_IS_SERVER) return;

	const store = serverAsyncLocalStorage?.getStore();

	if (store) {
		store.messageCalls?.add(`${safeModuleId}:${locale}`);
	}
}
