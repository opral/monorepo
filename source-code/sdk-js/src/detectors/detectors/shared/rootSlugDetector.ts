import type { Detector, DetectorInitializer } from "../../types.js"

type DetectorParameters = [url: URL]

/**
 * Detects a language (string) based on the users requested url root slug (Eg. "en" in https://your-domain.com/en/page).
 * Only detects languages that can be found in availableLanguages.
 * @param url The url passed as URL object (https://developer.mozilla.org/en-US/docs/Web/API/URL/URL)
 * @returns A string representing the users requested language or undefined for no detection.
 */
export const rootSlugDetector = ((url) =>
	[url.pathname.split("/").at(1)].filter(
		Boolean,
	) as string[]) satisfies Detector<DetectorParameters>

/**
 * Initializes the detector by passing the necessary parameters and returns a detection function without parameters in return
 * @param parameters The function parameters
 * @param parameters.url The url passed as URL object (https://developer.mozilla.org/en-US/docs/Web/API/URL/URL)
 * @param parameters.availableLanguages A set of available languages (strings) available for detection
 * @returns A detection function that takes no parameters and returns a string representing the users requested language.
 */
export const initRootSlugDetector = ((url) => () =>
	rootSlugDetector(url)) satisfies DetectorInitializer<DetectorParameters>
