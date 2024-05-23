import type { UrlObject } from "node:url"
import querystring from "qs"

// polyfill for node:url's format as it is not available in Next-production mode
const slashedProtocols: readonly string[] = ["http:", "https:", "ftp:", "gopher:", "file:"]

export function format(url: UrlObject) {
	const auth = url.auth ? `${encodeURIComponent(url.auth).replace(/%3A/i, ":")}@` : ""

	let query = ""
	if (url.query && typeof url.query === "object" && Object.keys(url.query).length) {
		query = querystring.stringify(url.query, {
			arrayFormat: "repeat",
			addQueryPrefix: false,
		})
	}

	const protocol = url.protocol
		? ((url.protocol.endsWith(":") ? url.protocol : url.protocol + ":") as `${string}:`)
		: ""

	const isSlashedProtocol = slashedProtocols.includes(protocol)

	let host: string | false = false
	let pathname = url.pathname || ""

	if (url.host) {
		host = auth + url.host
	} else if (url.hostname) {
		host =
			auth +
			//escape ipv6 addresses with brackets
			(!url.hostname.includes(":") ? url.hostname : `[${url.hostname}]`) +
			(url.host ? `:${url.port}` : "")
	}

	/*
	 * only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
	 * unless they had them to begin with.
	 */
	if (url.slashes || ((!protocol || isSlashedProtocol) && host !== false)) {
		host = `//${host}`
		if (pathname && !pathname.startsWith("/")) pathname = `/${pathname}`
	}

	const resolvedHost = host || ""

	const escapedPathname = pathname.replace(/[?#]/g, encodeURIComponent)
	const hash = url.hash ? (url.hash.startsWith("#") ? url.hash : `#${url.hash}`) : ""
	const search =
		// if there is a search, use it
		url.search
			? url.search.startsWith("?")
				? url.search
				: `?${url.search}`
			: // if there is instead a query string, use it
			query
			? `?${query}`
			: // otherwise fall back to nothing
			  ""
	const escapedSearch = search.replace("#", "%23")
	return protocol + resolvedHost + escapedPathname + escapedSearch + hash
}
