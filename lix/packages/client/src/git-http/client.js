/**
 * Forked from https://github.com/isomorphic-git/isomorphic-git/blob/main/src/http/web/index.js
 * for credentials: "include" support, configurable payload overrides, configurable logging etc.
 * @typedef {Object} GitProgressEvent
 * @property {string} phase
 * @property {number} loaded
 * @property {number} total
 */

/**
 * @callback ProgressCallback
 * @param {GitProgressEvent} progress
 * @returns {void | Promise<void>}
 */

/**
 * @typedef {Object} GitHttpRequest
 * @property {string} url - The URL to request
 * @property {string} [method='GET'] - The HTTP method to use
 * @property {Object<string, string>} [headers={}] - Headers to include in the HTTP request
 * @property {Object} [agent] - An HTTP or HTTPS agent that manages connections for the HTTP client (Node.js only)
 * @property {AsyncIterableIterator<Uint8Array>} [body] - An async iterator of Uint8Arrays that make up the body of POST requests
 * @property {ProgressCallback} [onProgress] - Reserved for future use (emitting `GitProgressEvent`s)
 * @property {object} [signal] - Reserved for future use (canceling a request)
 */

/**
 * @typedef {Object} GitHttpResponse
 * @property {string} url - The final URL that was fetched after any redirects
 * @property {string} [method] - The HTTP method that was used
 * @property {Object<string, string>} [headers] - HTTP response headers
 * @property {AsyncIterableIterator<Uint8Array>} [body] - An async iterator of Uint8Arrays that make up the body of the response
 * @property {number} statusCode - The HTTP status code
 * @property {string} statusMessage - The HTTP status message
 */

/**
 * @callback HttpFetch
 * @param {GitHttpRequest} request
 * @returns {Promise<GitHttpResponse>}
 */

/**
 * @typedef {Object} HttpClient
 * @property {HttpFetch} request
 */

// @ts-nocheck

// Convert a value to an Async Iterator
// This will be easier with async generator functions.
function fromValue(value) {
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

function getIterator(iterable) {
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
async function forAwait(iterable, cb) {
	const iter = getIterator(iterable)
	// eslint-disable-next-line no-constant-condition
	while (true) {
		const { value, done } = await iter.next()
		if (value) await cb(value)
		if (done) break
	}
	if (iter.return) iter.return()
}

async function collect(iterable) {
	let size = 0
	const buffers = []
	// This will be easier once `for await ... of` loops are available.
	await forAwait(iterable, (value) => {
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
function fromStream(stream) {
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

/* eslint-env browser */

/**
 * MakeHttpClient
 *
 * @param { verbose?: boolean, desciption?: string, onReq: ({body: any, url: string }) => {body: any, url: string} }
 * @returns HttpClient
 */
export function makeHttpClient({ verbose, description, onReq, onRes }) {
	/**
	 * HttpClient
	 *
	 * @param {GitHttpRequest} request
	 * @returns {Promise<GitHttpResponse>}
	 */
	async function request({ url, method = "GET", headers = {}, body }) {
		// onProgress param not used
		// streaming uploads aren't possible yet in the browser

		if (body) {
			body = await collect(body)
		}
		const origUrl = url
		const origMethod = method

		if (onReq) {
			const rewritten = await onReq({ body, url })

			method = rewritten?.method || method
			headers = rewritten?.headers || headers
			body = rewritten?.body || body
			url = rewritten?.url || url
		}

		const res = await fetch(url, { method, headers, body, credentials: "include" })

		// convert Header object to ordinary JSON
		let resHeaders = {}
		for (const [key, value] of res.headers.entries()) {
			resHeaders[key] = value
		}

		if (verbose) {
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
				res.body && res.body.getReader
					? fromStream(res.body)
					: [new Uint8Array(await res.arrayBuffer())]
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
