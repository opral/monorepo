import { createHandle, type HandleOptions } from "./hooks/handle.js"
import { createReroute } from "./hooks/reroute.js"
import type { PathTranslations } from "./path-translations/types.js"
import type { Paraglide } from "./runtime.js"

export type I18nOptions<T extends string> = {
	pathnames: PathTranslations<T>
}

export function createI18n<T extends string>(
	runtime: Paraglide<T>,
	translations: PathTranslations<T>
) {
	// We don't want the translations to be mutable
	Object.freeze(translations)

	return {
		...runtime,
		translations,

		/**
		 * Returns a `reroute` hook that applies the path translations to the paths
		 */
		/* @__SIDE_EFFECT_FREE__ */
		reroute: () => createReroute(runtime, translations),

		/**
		 * Returns a `handle` hook that set's the correct `lang` attribute
		 * on the `html` element
		 */
		/* @__SIDE_EFFECT_FREE__ */
		handle: (options: HandleOptions) => createHandle(options),
	}
}

export type I18n<T extends string> = ReturnType<typeof createI18n<T>>
