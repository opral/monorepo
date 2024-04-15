import type { UrlObject } from "node:url"
import querystring from "qs"

const slashedProtocols = ["http:", "https:", "ftp:", "gopher:", "file:"] as const

export function format(url: UrlObject) {
	let auth = url.auth || ""
	if (auth) {
		auth = encodeURIComponent(auth)
		auth = auth.replace(/%3A/i, ":")
		auth += "@"
	}

	let protocol = url.protocol || "",
		pathname = url.pathname || "",
		hash = url.hash || "",
		host: string | false = false,
		query = ""

	if (url.host) {
		host = auth + url.host
	} else if (url.hostname) {
		host = auth + (!url.hostname.includes(":") ? url.hostname : "[" + url.hostname + "]")
		if (url.port) {
			host += ":" + url.port
		}
	}

	if (url.query && typeof url.query === "object" && Object.keys(url.query).length) {
		query = querystring.stringify(url.query, {
			arrayFormat: "repeat",
			addQueryPrefix: false,
		})
	}

	let search = url.search || (query && "?" + query) || ""

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

	if (hash && hash.charAt(0) !== "#") {
		hash = "#" + hash
	}
	if (search && search.charAt(0) !== "?") {
		search = "?" + search
	}

	pathname = pathname.replace(/[?#]/g, function (match) {
		return encodeURIComponent(match)
	})
	search = search.replace("#", "%23")

	return protocol + host + pathname + search + hash
}
