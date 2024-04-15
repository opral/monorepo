import { RoutingStragey } from "./interface"

export function DomainStrategy<T extends string>({
	domains,
}: {
	domains: Record<T, string>
}): RoutingStragey<T> {
	return {
		getCanonicalPath(localisedPath) {
			return localisedPath
		},
		getLocalisedUrl(canonicalPath, targetLocale, isLanugageSwitch) {
			if (!isLanugageSwitch) return { pathname: canonicalPath }

			const domain = domains[targetLocale]
			return {
				protocol: "https:",
				hostname: domain,
				pathname: canonicalPath,
			}
		},
	}
}
