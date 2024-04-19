import { LanguageDetector } from "./interface"

export const createDomainDetection = <T extends string>(cfg: {
	domains: Record<T, string>
}): LanguageDetector<T> => {
	return (request) => {
		return Object.entries(cfg.domains)
			.find(([, value]) => value === request.nextUrl.host)
			?.at(0) as T | undefined
	}
}
