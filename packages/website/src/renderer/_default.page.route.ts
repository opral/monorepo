import type { PageContextRenderer } from "./types.js"

export { onBeforeRoute }

export const defaultLanguage = "en"
export const languages = ["en", "de", "zh"]

function onBeforeRoute(pageContext: PageContextRenderer) {
	const { urlWithoutLocale, locale } = extractLocale(pageContext.urlOriginal)
	return {
		pageContext: {
			// We make `locale` available as `pageContext.locale`. We can then use https://vite-plugin-ssr.com/pageContext-anywhere to access pageContext.locale in any React/Vue component.
			locale,
			// We overwrite the original URL
			urlOriginal: urlWithoutLocale,
		},
	}
}

export function extractLocale(url: string) {
	const urlPaths = url.split("/")

	let locale
	let urlWithoutLocale
	// We remove the URL locale, for example `/de-DE/about` => `/about`
	const firstPath = urlPaths[1]!
	if (languages.filter((locale) => locale !== defaultLanguage).includes(firstPath)) {
		locale = firstPath
		urlWithoutLocale = "/" + urlPaths.slice(2).join("/")
	} else {
		locale = defaultLanguage
		urlWithoutLocale = url
	}

	return { locale, urlWithoutLocale }
}
