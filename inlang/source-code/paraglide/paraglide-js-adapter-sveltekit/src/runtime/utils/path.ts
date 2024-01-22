/**
 * Always starts with a slash and never ends with a slash.
 */
export function normalize(path: string) {
	return "/" + path.split("/").filter(Boolean).join("/")
}

export const resolve = (...segments: string[]) =>
	segments
		.map(normalize)
		.filter((s) => s !== "/")
		.reduce((a, b) => a + b, "") || "/"
