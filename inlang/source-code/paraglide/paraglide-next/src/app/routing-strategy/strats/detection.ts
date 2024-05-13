import { RoutingStrategy } from "../interface"

export function DetectionStrategy<T extends string>(): RoutingStrategy<T> {
	return {
		getCanonicalPath: (localisedPath) => localisedPath,
		getLocalisedUrl: (canonicalPath) => {
			return { pathname: canonicalPath }
		},

		resolveLocale: () => undefined, //always defer to default detection
	}
}
