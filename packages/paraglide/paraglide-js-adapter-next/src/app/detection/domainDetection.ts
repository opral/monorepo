import { LanguageDetector } from "./interface"

export const createDomainDetection = <T extends string>(cfg: {
	domains: Record<T, string>
	defaultLanguage: T
}): LanguageDetector<T> => {
	return {
		resolveLanguage(request) {
			const language = Object.entries(cfg.domains)
				.find(([, value]) => value === request.nextUrl.host)
				?.at(0) as T | undefined

			return language ?? cfg.defaultLanguage
		},
	}
}
