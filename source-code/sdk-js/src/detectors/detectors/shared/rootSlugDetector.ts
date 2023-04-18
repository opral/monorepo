import type { Detector, DetectorInitializer } from "../../types.js"

type DetectorParameters = [url: URL]

const rootSlugDetector = ((url) =>
	[url.pathname.split("/").at(1)].filter(
		Boolean,
	) as string[]) satisfies Detector<DetectorParameters>

/**
 * Initializes the detector by passing the necessary parameters and returns a detection function without parameters in return
 * @param url The url passed as URL object (https://developer.mozilla.org/en-US/docs/Web/API/URL/URL)
 * @returns A detection function that takes no parameters and returns a string representing the users requested language.
 */
export const initRootSlugDetector = ((url) => () =>
	rootSlugDetector(url)) satisfies DetectorInitializer<DetectorParameters>
