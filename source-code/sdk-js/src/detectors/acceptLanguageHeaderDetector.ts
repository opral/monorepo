import type { Language } from "./sharedTypes.js"

type ObjectWithHeaders = { headers: { get: (key: string) => string | null } }
export type AcceptLanguageHeaderDetector = (
	{ headers }: ObjectWithHeaders,
	headerKey?: string,
) => Language[]

const REGEX_ACCEPT_LANGUAGE_SPLIT = /;|,/

export const acceptLanguageHeaderDetector = (({ headers }, headerKey = "accept-language") =>
	(headers.get(headerKey) as Language)
		?.split(REGEX_ACCEPT_LANGUAGE_SPLIT)
		.filter((part) => !part.startsWith("q"))
		.map((part) => part.trim())
		.filter((part) => part !== "*")
		.filter((part) => part !== "") || []) satisfies AcceptLanguageHeaderDetector
