import { serverAsyncLocalStorage } from "./variables.js";

/**
 * The origin of the current URL.
 *
 * Defaults to "http://y.com" in non-browser environments. If this
 * behavior is not desired, the implementation can be overwritten
 * by `overwriteGetUrlOrigin()`.
 *
 * @type {() => string}
 */
export let getUrlOrigin = () => {
	if (serverAsyncLocalStorage) {
		return serverAsyncLocalStorage.getStore()?.origin ?? "http://fallback.com";
	} else if (typeof window !== "undefined") {
		return window.location.origin;
	}
	return "http://fallback.com";
};

/**
 * Overwrite the getUrlOrigin function.
 *
 * Use this function in server environments to
 * define how the URL origin is resolved.
 *
 * @type {(fn: () => string) => void}
 */
export let overwriteGetUrlOrigin = (fn) => {
	getUrlOrigin = fn;
};
