// Vendored in from NextJS

export const basePath = (process.env.__NEXT_ROUTER_BASEPATH || "") as "" | `/${string}`

export function addBasePath(path: string, required?: boolean): string {
	return process.env.__NEXT_MANUAL_CLIENT_BASE_PATH && !required
		? path
		: addPathPrefix(path, basePath)
}

export function addPathPrefix(path: string, prefix?: string) {
	if (!path.startsWith("/") || !prefix) return path

	const { pathname, query, hash } = parsePath(path)
	return `${prefix}${pathname}${query}${hash}`
}

export function parsePath(path: string) {
	const hashIndex = path.indexOf("#")
	const queryIndex = path.indexOf("?")
	const hasQuery = queryIndex > -1 && (hashIndex < 0 || queryIndex < hashIndex)

	if (hasQuery || hashIndex > -1) {
		return {
			pathname: path.slice(0, Math.max(0, hasQuery ? queryIndex : hashIndex)),
			// eslint-disable-next-line unicorn/prefer-string-slice
			query: hasQuery ? path.substring(queryIndex, hashIndex > -1 ? hashIndex : undefined) : "",
			hash: hashIndex > -1 ? path.slice(hashIndex) : "",
		}
	}

	return { pathname: path, query: "", hash: "" }
}
