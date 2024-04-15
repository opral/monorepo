import { LanguageDetector } from "./interface"

export const createDomainDetection = <T extends string>(cfg: {
	domains: Record<T, string>

	/** The language to use if no domain matches - Eg. on localhost */
	defaultLanguage: T
}): LanguageDetector<T> => {
	return (request) => {
		const language = Object.entries(cfg.domains)
			.find(([, value]) => value === request.nextUrl.host)
			?.at(0) as T | undefined

		return language ?? cfg.defaultLanguage
	}
}
