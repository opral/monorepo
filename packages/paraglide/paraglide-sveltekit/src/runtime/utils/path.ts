/**
 * Always starts with a slash and never ends with a slash.
 */
export function normalize(path: string): `/${string}` {
	return `/${path.split("/").filter(Boolean).join("/")}`
}
