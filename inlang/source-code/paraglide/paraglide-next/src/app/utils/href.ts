/**
 * Check if a string-href points to an external page
 */
export function isExternal(href: string): boolean {
	return (
		// If the href starts with a url scheme
		// see: https://datatracker.ietf.org/doc/html/rfc3986#section-3.1
		/^[a-z][a-z0-9+\-.]*:/i.test(href) ||
		//If the href starts with // it's a protocol relative url -> must include the host -> external
		/^\/\//.test(href)
	)
}
