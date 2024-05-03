import { createDomainDetection } from "../../middleware/detection/domainDetection"
import { RoutingStrategy } from "../interface"

/**
 * Use different domains for different languages
 */
export function DomainStrategy<T extends string>({
	domains,
}: {
	/**
	 * The domains for each language. Must be unique
	 *
	 * @example
	 * ```ts
	 * {
	 *   en: "https://example.com",
	 *   de: "https://de.example.com",
	 * }
	 * ```
	 */
	domains: Record<T, `${"http://" | "https://"}${string}`>
}): RoutingStrategy<T> {
	return {
		getCanonicalPath(localisedPath) {
			return localisedPath
		},
		getLocalisedUrl(canonicalPath, targetLocale, isLanugageSwitch) {
			if (!isLanugageSwitch) return { pathname: canonicalPath }

			const [protocol, rest] = domains[targetLocale].split("://")
			const [hostname] = rest.split("/")
			return {
				protocol: protocol,
				hostname: hostname,
				pathname: canonicalPath,
			}
		},
		resolveLocale(request) {
			const detect = createDomainDetection({ domains })
			return detect(request)
		},
	}
}
