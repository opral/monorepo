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
	 * A wrapper around SvelteKit's goto function that translates the path before navigating.
	 */
	export function goto(
		url: Parameters<typeof import("$app/navigation").goto>[0],
		options?:
			| (Parameters<typeof import("$app/navigation").goto>[1] & { language: string })
			| undefined
	): ReturnType<typeof import("$app/navigation").goto>
}
