import type { Runtime } from "./type.js";
import { localeInPath } from "./locale-in-path.js";
import { localizePath } from "./localize-path.js";
import { isLocale } from "./is-locale.js";
import { deLocalizePath } from "./de-localize-path.js";
import { assertIsLocale } from "./assert-is-locale.js";
import { detectLocaleFromRequest } from "./detect-locale-from-request.js";

export function mockRuntime({ baseLocale = "en", locales = ["en", "de"] }) {
	let locale = baseLocale;

	const runtime: Runtime = {
		baseLocale,
		locales,
		isLocale,
		assertIsLocale,
		localeInPath,
		localizePath,
		deLocalizePath,
		detectLocaleFromRequest,
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
