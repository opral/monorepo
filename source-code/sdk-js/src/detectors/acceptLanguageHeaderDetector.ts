import type { Language, InitDetector, DetectorTemplate } from "@inlang/core/ast"

type ObjectWithHeaders = { headers: { get: (key: string) => string | null } }
type DetectorParameters = [ObjectWithHeaders, string | undefined]

const REGEX_ACCEPT_LANGUAGE_SPLIT = /;|,/

/**
 * Detects an array of languages based on the accept-language header passed to it.
 * @param objectWithHeaders An object containing the headers used in detection
 * @param objectWithHeaders.headers The HTTP Request Headers used in detection (https://developer.mozilla.org/en-US/docs/Glossary/Request_header)
 * @param objectWithHeaders.headers.get A function with which a certain header can be retrieved, returning either a string or null.
 * @param headerKey The key for the exact header which should be retrieved from the passed HTTP Request Headers. Defaults to "accept-language"
 * @returns An array of detected languages (strings)
 */

export const acceptLanguageHeaderDetector = (({ headers }, headerKey = "accept-language") =>
	(headers.get(headerKey) as Language)
		?.split(REGEX_ACCEPT_LANGUAGE_SPLIT)
		.filter((part) => !part.startsWith("q"))
		.map((part) => part.trim())
		.filter((part) => part !== "*")
		.filter((part) => part !== "") || []) satisfies DetectorTemplate<DetectorParameters>

/**
 * Initializes the detector by passing the necessary parameters and returns a detection function without parameters in return
 * @param objectWithHeaders An object containing the headers used in detection
 * @param objectWithHeaders.headers The HTTP Request Headers used in detection (https://developer.mozilla.org/en-US/docs/Glossary/Request_header)
 * @param objectWithHeaders.headers.get A function with which a certain header can be retrieved, returning either a string or null.
 * @param headerKey The key for the exact header which should be retrieved from the passed HTTP Request Headers. Defaults to "accept-language"
 * @returns A detection function that takes no parameters and returns an array of detected languages (strings) upon invocation
 */

export const initAcceptLanguageHeaderDetector = (({ headers }, headerKey = "accept-language") =>
	() =>
		acceptLanguageHeaderDetector({ headers }, headerKey)) satisfies InitDetector<DetectorParameters>
