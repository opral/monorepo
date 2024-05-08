import type { UrlObject } from "node:url"
import querystring from "qs"

// polyfill for node:url's format as it is not available in Next-production mode

const slashedProtocols = ["http:", "https:", "ftp:", "gopher:", "file:"] as const

export function format(url: UrlObject) {
	const auth = url.auth ? encodeURIComponent(url.auth).replace(/%3A/i, ":") + "@" : ""

	let pathname = url.pathname || ""
	let host: string | false = false

	if (url.host) {
		host = auth + url.host
	} else if (url.hostname) {
		host = auth + (!url.hostname.includes(":") ? url.hostname : "[" + url.hostname + "]")
		if (url.port) {
			host += ":" + url.port
		}
	}

	let query = ""
	if (url.query && typeof url.query === "object" && Object.keys(url.query).length) {
		query = querystring.stringify(url.query, {
			arrayFormat: "repeat",
			addQueryPrefix: false,
		})
	}

	let protocol = url.protocol || ""
	if (protocol && protocol.slice(-1) !== ":") {
		protocol += ":"
	}

	const isSlashedProtocol =
		slashedProtocols.includes(protocol as (typeof slashedProtocols)[number]) ||
		slashedProtocols.includes((protocol + ":") as (typeof slashedProtocols)[number])

	/*
	 * only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
	 * unless they had them to begin with.
	 */
	if (url.slashes || ((!protocol || isSlashedProtocol) && host !== false)) {
		host = "//" + (host || "")
		if (pathname && pathname.charAt(0) !== "/") {
			pathname = "/" + pathname
		}
	} else if (!host) {
		host = ""
	}
	pathname = pathname.replace(/[?#]/g, encodeURIComponent)

	let hash: string = url.hash || ""
	if (hash && !hash.startsWith("#")) {
		hash = "#" + hash
	}

	let search = url.search || query ? `?${query}` : ""
	if (search && !search.startsWith("?")) {
		search = "?" + search
	}
	search = search.replace("#", "%23")

	return protocol + host + pathname + search + hash
}
