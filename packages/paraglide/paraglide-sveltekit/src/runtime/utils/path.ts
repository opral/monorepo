/**
 * Always starts with a slash and never ends with a slash.
 */
export function normalize(path: string): `/${string}` {
	return `/${path.split("/").filter(Boolean).join("/")}`
}

/**
 * Join path segments
 * 
 * @example
 * ```ts
 * resolve(["some","sub/page"]) === "/some/sub/page"
 * ```
 */
export const resolve = (...segments: string[]) =>
	segments
		.map(normalize)
		.filter((s) => s !== "/")
		.reduce((a, b) => a + b, "") || "/"
