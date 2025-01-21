import { getLocaleFromPath } from "./get-locale-from-path.js";
import { localizedPath } from "./localized-path.js";
import { isLocale } from "./is-locale.js";
import { delocalizedPath } from "./delocalized-path.js";
import type { Runtime } from "./type.js";

export function mockRuntime({ baseLocale = "en", locales = ["en", "de"] }) {
	let locale = baseLocale;

	const runtime: Runtime = {
		baseLocale,
		locales,
		isLocale,
		getLocaleFromPath,
		localizedPath,
		delocalizedPath,
		defineGetLocale: (fn) => (runtime.getLocale = fn),
		defineSetLocale: (fn) => (runtime.setLocale = fn),
		setLocale: (newLocale) => (locale = newLocale),
		getLocale: () => locale,
	};
	for (const [key, value] of Object.entries(runtime)) {
		// @ts-expect-error - global variable definition
		globalThis[key] = value;
	}
	return runtime;
}
