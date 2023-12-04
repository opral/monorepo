/// <reference types="@sveltejs/kit" />

/**
 * This module contains public functions that are available to the user.
 */
declare module "$paraglide-adapter-sveltekit" {
	/**
	 * Takes in a path with no language information and returns a path with the language information.
	 * This uses the routing strategy specified in `vite.config.js`.
	 *
	 * @param path 			A path to translate
	 * @param languageTag 	The language tag to translate to
	 */
	export function translatePath(path: string, languageTag: string): string

	/**
	 * Attempts to get the language from the url using the routing strategy specified in `vite.config.js`.
	 * If the language cannot be determined, it will return the default language.
	 *
	 * @param url The url to guess the language from
	 * @returns {any}
	 */
	export function getLanguage(url: URL): string

	/**
	 * A wrapper around SvelteKit's goto function that translates the url before navigating.
	 *
	 * By default, this function will use the current language. You can override this by passing a language option.
	 *
	 * @example
	 * ```ts
	 * import { goto } from "$paraglide-adapter-sveltekit"
	 * goto("/about", { language: "en" })
	 * ```
	 *
	 * @param url 		The url to navigate to
	 * @param options 	The usual goto options, plus an optional language option
	 */
	export function goto(
		url: Parameters<typeof import("$app/navigation").goto>[0],
		options?:
			| (Parameters<typeof import("$app/navigation").goto>[1] & {
					/**
					 * The language which the url should be translated to.
					 * Defaults to the current language.
					 */
					language: string
			  })
			| undefined
	): ReturnType<typeof import("$app/navigation").goto>
}
