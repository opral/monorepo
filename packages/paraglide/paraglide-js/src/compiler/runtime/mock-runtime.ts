import type { Runtime } from "./type.js";
import { getLocaleFromPath } from "./get-locale-from-path.js";
import { localizedPath } from "./localized-path.js";
import { isLocale } from "./is-locale.js";
import { deLocalizedPath } from "./de-localized-path.js";
import { assertLocale } from "./assert-locale.js";

export function mockRuntime({ baseLocale = "en", locales = ["en", "de"] }) {
	let locale = baseLocale;

	const runtime: Runtime = {
		baseLocale,
		locales,
		isLocale,
		assertLocale,
		getLocaleFromPath,
		localizedPath,
		deLocalizedPath,
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
