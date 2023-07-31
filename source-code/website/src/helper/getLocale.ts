/**
 * A helper function that returns the locale path based on the current locale.
 */
export function getLocale(defaultLanguage: string, locale: () => string | undefined) {
	const language = locale() || defaultLanguage
	return language !== defaultLanguage ? "/" + language : ""
}
