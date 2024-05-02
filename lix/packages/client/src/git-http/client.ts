/**
 * Forked from https://github.com/isomorphic-git/isomorphic-git/blob/main/src/http/web/index.js
 * for credentials: "include" support, configurable payload overrides, configurable logging etc.
 * @typedef {Object} GitProgressEvent
 * @property {string} phase
 * @property {number} loaded
 * @property {number} total
 * @callback ProgressCallback
 * @param {GitProgressEvent} progress
 * @returns {void | Promise<void>}
 */

interface GitHttpRequest {
	url: string
	method?: string
	headers?: Record<string, string>
	agent?: object
	body?: AsyncIterableIterator<Uint8Array>
	onProgress?: any // Replace 'any' with the actual type  ProgressCallback if available
	signal?: object
}

interface GitHttpResponse {
	url: string
	method?: string
	headers?: Record<string, string>
	body?: AsyncIterableIterator<Uint8Array>
	statusCode: number
	statusMessage: string
}

type HttpFetch = (request: GitHttpRequest) => Promise<GitHttpResponse>

interface HttpClient {
	request: HttpFetch
}

// Convert a value to an Async Iterator
// This will be easier with async generator functions.
function fromValue(value: any) {
	let queue = [value]
	return {
		next() {
			return Promise.resolve({ done: queue.length === 0, value: queue.pop() })
		},
		return() {
			queue = []
			return {}
		},
		[Symbol.asyncIterator]() {
			return this
		},
	}
}

function getIterator(iterable: any) {
	if (iterable[Symbol.asyncIterator]) {
		return iterable[Symbol.asyncIterator]()
	}
	if (iterable[Symbol.iterator]) {
		return iterable[Symbol.iterator]()
	}
	if (iterable.next) {
		return iterable
	}
	return fromValue(iterable)
}

// Currently 'for await' upsets my linters.
async function forAwait(iterable: any, cb: (arg: any) => void) {
	const iter = getIterator(iterable)
	// eslint-disable-next-line no-constant-condition
	while (true) {
		const { value, done } = await iter.next()
		if (value) await cb(value)
		if (done) break
	}
	if (iter.return) iter.return()
}

async function collect(iterable: any) {
	let size = 0
	const buffers: any[] = []
	// This will be easier once `for await ... of` loops are available.
	await forAwait(iterable, (value: any) => {
		buffers.push(value)
		size += value.byteLength
	})
	const result = new Uint8Array(size)
	let nextIndex = 0
	for (const buffer of buffers) {
		result.set(buffer, nextIndex)
		nextIndex += buffer.byteLength
	}
	return result
}

// Convert a web ReadableStream (not Node stream!) to an Async Iterator
// adapted from https://jakearchibald.com/2017/async-iterators-and-generators/
function fromStream(stream: any) {
	// Use native async iteration if it's available.
	if (stream[Symbol.asyncIterator]) return stream
	const reader = stream.getReader()
	return {
		next() {
			return reader.read()
		},
		return() {
			reader.releaseLock()
			return {}
		},
		[Symbol.asyncIterator]() {
			return this
		},
	}
}
type MakeHttpClientArgs = {
	debug?: boolean
	description?: string
	onRes?: ({
		usedUrl,
		origUrl,
		resBody,
		statusCode,
		resHeaders,
	}: {
		usedUrl: string
		origUrl: string
		resBody: Uint8Array
		statusCode: number
		resHeaders: Record<string, string>
	}) => any
	onReq?: ({ body, url, method }: { body: any; url: string; method: string }) => any
}

const cache = new Map()
export function makeHttpClient({
	debug,
	description,
	onReq,
	onRes,
}: MakeHttpClientArgs): HttpClient {
	async function request({
		url,
		method = "GET",
		headers = {},
		body: rawBody,
	}: GitHttpRequest): Promise<GitHttpResponse> {
		// onProgress param not used
		// streaming uploads aren't possible yet in the browser
		let body = rawBody ? await collect(rawBody) : undefined

		const origUrl = url
		const origMethod = method

		// FIXME: how to do this caching?
		// if (origMethod === "GET" && cache.has(origUrl)) {
		// 	const { resHeaders, resBody } = cache.get(origUrl)
		// 	return {
		// 		url: origUrl,
		// 		method: origMethod,
		// 		statusCode: 200,
		// 		statusMessage: "OK",
		// 		body: resBody,
		// 		headers: resHeaders,
		// 	}
		// }

		if (onReq) {
			const rewritten = await onReq({ body, url, method })

			method = rewritten?.method || method
			headers = rewritten?.headers || headers
			body = rewritten?.body || body
			url = rewritten?.url || url
		}

		const res = await fetch(url, { method, headers, body, credentials: "include" })

		// convert Header object to ordinary JSON
		let resHeaders: Record<string, string> = {}
		// @ts-ignore -- headers has entries but ts complains
		for (const [key, value] of res.headers.entries()) {
			resHeaders[key] = value
		}

		if (debug) {
			console.warn(`${description} git req:`, origUrl)
		}

		const statusCode = res.status

		let resBody
		if (onRes) {
			const uint8Array = new Uint8Array(await res.arrayBuffer())
			const rewritten = await onRes({
				origUrl,
				usedUrl: url,
				resBody: uint8Array,
				statusCode,
				resHeaders,
			})

			resHeaders = rewritten?.resHeaders || resHeaders
			resBody = rewritten?.resBody || [uint8Array]
		}

		if (!resBody) {
			resBody =
				// @ts-ignore -- done by isogit, not sure why
				res.body && res.body.getReader
					? fromStream(res.body)
					: [new Uint8Array(await res.arrayBuffer())]
		}

		if (statusCode === 200 && origMethod === "GET") {
			cache.set(origUrl, { resHeaders, resBody })
		}

		return {
			url: origUrl,
			method: origMethod,
			statusCode,
			statusMessage: res.statusText,
			body: resBody,
			headers: resHeaders,
		}
	}

	return { request }
}
