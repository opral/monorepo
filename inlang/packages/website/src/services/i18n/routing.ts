import {
	availableLanguageTags,
	sourceLanguageTag,
} from "#src/paraglide/runtime.js";

/**
 * Returns the language tag and the url without the language tag to render the correct page.
 *
 * @example
 *   i18nRouting("/de/marketplace") // { languageTag: "de", url: "/marketplace" }
 *   i18nRouting("/de/about") // { languageTag: "de", url: "/about" }
 *   i18nRouting("/about") // { languageTag: "en", url: "/about" }
 *   i18nRouting("/") // { languageTag: "en", url: "/" }
 */
export function i18nRouting(url: string) {
	const urlPaths = url.split("/");

	// first path of route is either / or a language tag
	const maybeLanguageTag =
		urlPaths[1] as (typeof availableLanguageTags)[number];

	// route is /de, /fr, etc. (a language tag is used)
	if (
		availableLanguageTags
			.filter((tag: string) => tag !== sourceLanguageTag)
			.includes(maybeLanguageTag)
	) {
		return {
			languageTag: maybeLanguageTag,
			// remove the language tag from the url to provide vike with the page to be rendered
			url: "/" + urlPaths.slice(2).join("/"),
		};
	} else {
		return {
			languageTag: sourceLanguageTag,
			url: url,
		};
	}
}
