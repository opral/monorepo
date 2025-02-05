/**
 * Matches a pathname against a pattern with named parameters, wildcards, and optional segments.
 * Supports path-to-regexp v8 syntax (`/:param`, `/*wildcard`, `/users{/:id}/delete`).
 *
 * @param {string} pattern - The pattern to match.
 * @param {string} pathname - The pathname.
 * @returns {{ params: Record<string, string | string[]>} | undefined} - Matched parameters or `undefined` if no match.
 */
export function matchPathnamePattern(pattern, pathname) {
	// Ensure pathname doesn't have trailing slashes (unless root `/`)
	if (pathname !== "/" && pathname.endsWith("/")) {
		pathname = pathname.slice(0, -1);
	}

	// Convert `{/:param}` to an optional named capture group `(?:/(?<param>[^/]+))?`
	let regexPattern = pattern
		.replace(/\{\/:([^}]+)\}/g, "(?:/(?<$1>[^/]+))?") // Optional parameters `{/:param}`
		.replace(/\/:([^/]+)/g, "/(?<$1>[^/]+)") // Named parameters
		.replace(/\*([^/]+)/g, "(?<$1>.*)"); // Wildcards

	// Create a RegExp object from the modified pattern
	const regex = new RegExp(`^${regexPattern}$`);

	// Attempt to match the pathname
	const match = pathname.match(regex);
	if (!match) return undefined;

	// Extract named parameters
	/** @type {Record<string, string | string[]>} */
	const params = match.groups ? { ...match.groups } : {};

	for (const key in params) {
		// Convert wildcard (`*param`) values to arrays to match regexp behavior
		if (pattern.includes(`*${key}`) && typeof params[key] === "string") {
			params[key] = params[key].split("/");
		}
		// Remove undefined params (optional parameters)
		else if (params[key] === undefined) {
			delete params[key];
		}
	}

	return { params };
}
