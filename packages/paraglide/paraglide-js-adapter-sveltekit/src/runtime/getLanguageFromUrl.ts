import getLanguage from "$paraglide-adapter-sveltekit:get-language"

/**
 * Takes in a url and returns the language present in the url.
 *
 * @param url The url to parse.
 * @returns The language present in the url, or undefined if no language is present.
 */
export function getLanguageFromURL(url: URL): string | undefined {
	return getLanguage(url)
}
