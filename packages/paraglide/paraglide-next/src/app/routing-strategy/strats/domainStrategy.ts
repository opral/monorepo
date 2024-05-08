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
	const domainConfig = Object.fromEntries(
		Object.entries(domains).map(([lang, domain]) => {
			const [protocol, rest] = (domain as string).split("://")
			const [hostname] = rest.split("/")

			return [lang, { protocol, hostname }]
		})
	) as Record<T, { protocol: string; hostname: string }>

	return {
		getCanonicalPath(localisedPath) {
			return localisedPath
		},
		getLocalisedUrl(canonicalPath, targetLocale, isLanugageSwitch) {
			if (!isLanugageSwitch) return { pathname: canonicalPath }

			const { protocol, hostname } = domainConfig[targetLocale]
			return {
				protocol: protocol,
				hostname: hostname,
				pathname: canonicalPath,
			}
		},
		resolveLocale(request) {
			for (const [lang, { hostname }] of Object.entries(domainConfig) as [
				T,
				{ protocol: string; hostname: string }
			][]) {
				if (request.nextUrl.hostname === hostname) {
					return lang as T
				}
			}
		},
	}
}
