// @ts-nocheck
// forked from https://github.com/isomorphic-git/cors-proxy.git / /middleware.js to add multi domain support
import { Stream, Readable } from "node:stream"
import url from "node:url"
import fetch from "node-fetch"

const DEFAULT_ALLOW_METHODS = ["POST", "GET", "PUT", "PATCH", "DELETE", "OPTIONS"]

const DEFAULT_ALLOW_HEADERS = [
	"X-Requested-With",
	"Access-Control-Allow-Origin",
	"X-HTTP-Method-Override",
	"Content-Type",
	"Authorization",
	"Accept",
]

const DEFAULT_MAX_AGE_SECONDS = 60 * 60 * 24 // 24 hours

function isStream(stream) {
	return (
		stream !== null &&
		typeof stream === "object" &&
		stream instanceof Stream &&
		typeof stream.pipe === "function"
	)
}
function readable(stream) {
	return (
		isStream(stream) && // TODO: maybe this isn't needed because we could use only the checks below
		stream instanceof Readable &&
		stream.readable
	)
}
const send = (res, code, obj) => {
	res.statusCode = code

	if (obj === null) {
		res.end()
		return
	}

	if (Buffer.isBuffer(obj)) {
		if (!res.getHeader("Content-Type")) {
			res.setHeader("Content-Type", "application/octet-stream")
		}

		res.setHeader("Content-Length", obj.length)
		res.end(obj)
		return
	}

	if (obj instanceof Stream || readable(obj)) {
		//TODO: Wouldn't (obj instanceof Stream) be the only check here? Do we specifically need a Readable stream or a Stream object that's not of NodeJS Stream?
		if (!res.getHeader("Content-Type")) {
			res.setHeader("Content-Type", "application/octet-stream")
		}

		obj.pipe(res)
		return
	}

	let str = obj

	if (typeof obj === "object" || typeof obj === "number") {
		// We stringify before setting the header
		// in case `JSON.stringify` throws and a
		// 500 has to be sent instead
		str = JSON.stringify(obj)

		if (!res.getHeader("Content-Type")) {
			res.setHeader("Content-Type", "application/json; charset=utf-8")
		}
	}

	if (typeof str === "string") {
		res.setHeader("Content-Length", Buffer.byteLength(str))
	}

	res.end(str)
}

// forked from https://github.com/possibilities/micro-cors/blob/master/src/index.js for multi origin support
const microCors =
	(options = {}) =>
	(handler) =>
	(req, res, ...restArgs) => {
		const {
			origins,
			maxAge = DEFAULT_MAX_AGE_SECONDS,
			allowMethods = DEFAULT_ALLOW_METHODS,
			allowHeaders = DEFAULT_ALLOW_HEADERS,
			allowCredentials = true,
			exposeHeaders = [],
		} = options
		const origin = req.headers.origin

		if (res && res.finished) {
			return
		}

		if (origins.includes(origin)) {
			res.setHeader("Access-Control-Allow-Origin", origin)
		} else {
			res.set("Access-Control-Allow-Origin", "")
		}

		if (allowCredentials) {
			res.setHeader("Access-Control-Allow-Credentials", "true")
		}
		if (exposeHeaders.length) {
			res.setHeader("Access-Control-Expose-Headers", exposeHeaders.join(","))
		}

		const preFlight = req.method === "OPTIONS"
		if (preFlight) {
			res.setHeader("Access-Control-Allow-Methods", allowMethods.join(","))
			res.setHeader("Access-Control-Allow-Headers", allowHeaders.join(","))
			res.setHeader("Access-Control-Max-Age", String(maxAge))
		}

		return handler(req, res, ...restArgs)
	}

function isPreflightInfoRefs(req, u) {
	return (
		req.method === "OPTIONS" &&
		u.pathname.endsWith("/info/refs") &&
		(u.query.service === "git-upload-pack" || u.query.service === "git-receive-pack")
	)
}

function isInfoRefs(req, u) {
	return (
		req.method === "GET" &&
		u.pathname.endsWith("/info/refs") &&
		(u.query.service === "git-upload-pack" || u.query.service === "git-receive-pack")
	)
}

function isPreflightPull(req, u) {
	return (
		req.method === "OPTIONS" &&
		req.headers["access-control-request-headers"].includes("content-type") &&
		u.pathname.endsWith("git-upload-pack")
	)
}

function isPull(req, u) {
	return (
		req.method === "POST" &&
		req.headers["content-type"] === "application/x-git-upload-pack-request" &&
		u.pathname.endsWith("git-upload-pack")
	)
}

function isPreflightPush(req, u) {
	return (
		req.method === "OPTIONS" &&
		req.headers["access-control-request-headers"].includes("content-type") &&
		u.pathname.endsWith("git-receive-pack")
	)
}

function isPush(req, u) {
	return (
		req.method === "POST" &&
		req.headers["content-type"] === "application/x-git-receive-pack-request" &&
		u.pathname.endsWith("git-receive-pack")
	)
}

function allow(req, u) {
	return (
		isPreflightInfoRefs(req, u) ||
		isInfoRefs(req, u) ||
		isPreflightPull(req, u) ||
		isPull(req, u) ||
		isPreflightPush(req, u) ||
		isPush(req, u)
	)
}

const allowHeaders = [
	"accept-encoding",
	"accept-language",
	"accept",
	"access-control-allow-origin",
	"authorization",
	"cache-control",
	"connection",
	"content-length",
	"content-type",
	"dnt",
	"git-protocol",
	"pragma",
	"range",
	"referer",
	"user-agent",
	"x-authorization",
	"x-http-method-override",
	"x-requested-with",
]
const exposeHeaders = [
	"accept-ranges",
	"age",
	"cache-control",
	"content-length",
	"content-language",
	"content-type",
	"date",
	"etag",
	"expires",
	"last-modified",
	"location",
	"pragma",
	"server",
	"transfer-encoding",
	"vary",
	"x-github-request-id",
	"x-redirected-url",
]
const allowMethods = ["POST", "GET", "OPTIONS"]

const filter = (predicate, middleware) => {
	function corsProxyMiddleware(req, res, next) {
		if (predicate(req, res)) {
			middleware(req, res, next)
		} else {
			next()
		}
	}
	return corsProxyMiddleware
}

const compose = (...handlers) => {
	const composeTwo = (handler1, handler2) => {
		function composed(req, res, next) {
			handler1(req, res, (err) => {
				if (err) {
					return next(err)
				} else {
					return handler2(req, res, next)
				}
			})
		}
		return composed
	}
	let result = handlers.pop()
	while (handlers.length) {
		result = composeTwo(handlers.pop(), result)
	}
	return result
}

function noop(_req, _res, next) {
	next()
}
export default ({ origins, insecure_origins = [], authorization = noop } = {}) => {
	function predicate(req) {
		let u = url.parse(req.url, true)
		// Not a git request, skip
		return allow(req, u)
	}
	function sendCorsOK(req, res, next) {
		// Handle CORS preflight request
		if (req.method === "OPTIONS") {
			return send(res, 200, "")
		} else {
			next()
		}
	}
	function middleware(req, res) {
		let u = url.parse(req.url, true)

		let headers = {}
		for (let h of allowHeaders) {
			if (req.headers[h]) {
				headers[h] = req.headers[h]
			}
		}

		// GitHub uses user-agent sniffing for git/* and changes its behavior which is frustrating
		if (!headers["user-agent"] || !headers["user-agent"].startsWith("git/")) {
			headers["user-agent"] = "git/@isomorphic-git/cors-proxy"
		}

		let p = u.path // 'github.com/opral/example/git-upload-pack'
		let parts = p.split("/").filter((elem) => !!elem)
		let pathdomain = parts.shift()
		let remainingpath = parts.join("/")
		let protocol = insecure_origins.includes(pathdomain) ? "http" : "https"

		fetch(`${protocol}://${pathdomain}/${remainingpath}`, {
			method: req.method,
			redirect: "manual",
			headers,
			body: req.method !== "GET" && req.method !== "HEAD" ? req : undefined,
		})
			.then((f) => {
				if (f.headers.has("location")) {
					// Modify the location so the client continues to use the proxy
					let newUrl = f.headers.get("location").replace(/^https?:\//, "")
					f.headers.set("location", newUrl)
				}
				res.statusCode = f.status
				for (let h of exposeHeaders) {
					if (h === "content-length") continue
					if (f.headers.has(h)) {
						res.setHeader(h, f.headers.get(h))
					}
				}
				if (f.redirected) {
					res.setHeader("x-redirected-url", f.url)
				}
				f.body.pipe(res)
			})
			.catch(() => {
				// console.error(err)
				res.statusCode = 500
				res.end()
			})
	}

	const cors = microCors({
		allowHeaders,
		exposeHeaders,
		allowMethods,
		allowCredentials: false,
		origins,
	})
	return filter(predicate, cors(compose(sendCorsOK, authorization, middleware)))
}
