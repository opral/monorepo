import type { Language, InitDetector, DetectorTemplate } from "@inlang/core/ast"

type DetectorParameters = [
	{
		url: URL
		availableLanguages: Set<Language>
	},
]

/**
 * Detects a language (string) based on the users requested url root slug (Eg. "en" in https://your-domain.com/en/page).
 * Only detects languages that can be found in availableLanguages.
 * @param parameters The function parameters
 * @param parameters.url The url passed as URL object (https://developer.mozilla.org/en-US/docs/Web/API/URL/URL)
 * @param parameters.availableLanguages A set of available languages (strings) available for detection
 * @returns A string representing the users requested language or undefined for no detection.
 */

export const rootSlugDetectorTemplate = (({ url, availableLanguages }) =>
	[...availableLanguages].find((l) =>
		url.pathname.startsWith("/" + l + "/"),
	)) satisfies DetectorTemplate<DetectorParameters>

/**
 * Initializes the detector by passing the necessary parameters and returns a detection function without parameters in return
 * @param parameters The function parameters
 * @param parameters.url The url passed as URL object (https://developer.mozilla.org/en-US/docs/Web/API/URL/URL)
 * @param parameters.availableLanguages A set of available languages (strings) available for detection
 * @returns A detection function that takes no parameters and returns a string representing the users requested language.
 */

export const initRootSlugDetector = (({ url, availableLanguages }) =>
	() =>
		rootSlugDetectorTemplate({
			url,
			availableLanguages,
		})) satisfies InitDetector<DetectorParameters>
