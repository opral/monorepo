/**
 * Removes extraneous dots and slashes, resolves relative paths and ensures the
 * path begins and ends with '/'
 */
export function normalPath(path: string): string {
	const dots = /(\/|^)(\.\/)+/g
	const slashes = /\/+/g

	const upreference = /(?<!\.\.)[^/]+\/\.\.\//

	// Append '/' to the beginning and end
	path = `/${path}/`

	// Handle the edge case where a path begins with '/..'
	path = path.replace(/^\/\.\./, "")

	// Remove extraneous '.' and '/'
	path = path.replace(dots, "/").replace(slashes, "/")

	// Resolve relative paths if they exist
	let match
	while ((match = path.match(upreference)?.[0])) {
		path = path.replace(match, "")
	}

	return path
}

/*
 * Returns the name `path`s parent directory, or '/' if `path` is '/'
 *
 * `normalPath` is used here to ensure proper behavior when we are dealing with
 * a top level directory.
 *
 * This is the most concise way to ensure that a path begins and ends with '/',
 * and also that the dirname of a top level directory resolves to '/'
 */
export function getDirname(path: string): string {
	return normalPath(
		path
			.split("/")
			.filter((x) => x)
			.slice(0, -1)
			.join("/"),
	)
}

/*
 * Returns only the final portion of `path`, also removing any slashes.
 */
export function getBasename(path: string): string {
	return (
		path
			.split("/")
			.filter((x) => x)
			.at(-1) ?? path
	)
}

/*
 * Converts a Uint8Array containing a SHA hash to the traditional display
 * format, i.e. a string of base 16 integers
 */
export function oidToString(oid: Uint8Array) {
	return [...oid].map((x) => x.toString(16).padStart(2, "0")).join("")
}

/*
 * Converts a string of base 16 integers to their appropriate Uint8Array
 * representaiton.
 */
export function stringToOid(oid: string) {
	return new Uint8Array(oid.match(/../g)?.map((x) => parseInt(x, 16)) ?? [])
}

/*
 * Takes a string containing the octal representaiton of a file mode and
 * returns the corresponding file type.
 */
export function modeToType(mode: string) {
	switch (mode) {
		case "40000":
			return "tree"
		case "100644":
			return "blob"
		case "100755":
			return "blob"
		case "120000":
			return "blob"
		case "160000":
			return "commit"
	}
	throw new Error(`Unexpected GitTree entry mode: ${mode}`)
}
