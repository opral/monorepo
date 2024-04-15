/**
 * Check if a string-href points to an external page
 */
export function isExternal(href: string): boolean {
	const [, ...rest] = href.split(":")
	if (rest.length === 0) return false

	const schemeRegex = /^[a-z][a-z0-9+\-.]*:/i
	return (
		// href must not start with a url scheme
		// see: https://datatracker.ietf.org/doc/html/rfc3986#section-3.1
		schemeRegex.test(href) ||
		//If the href starts with // it's a protocol relative url -> must include the host -> external
		href.startsWith("//")
	)
}
