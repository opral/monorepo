/**
 * Matches a pathname against a pattern with named parameters, wildcards, and optional segments.
 * Supports path-to-regexp v8 syntax (`/:param`, `/*wildcard`, `/de{/*path}`).
 *
 * @param {string} pattern - The pattern to match.
 * @param {string} pathname - The actual pathname.
 * @returns {object | undefined} - Matched parameters or `undefined` if no match.
 */
export function matchPathnamePattern(pattern, pathname) {
	// Ensure pathname doesn't have trailing slashes (unless root `/`)
	if (pathname !== "/" && pathname.endsWith("/")) {
		pathname = pathname.slice(0, -1);
	}

	// Convert `{*param}` to a named capture group `(?<param>.+)`
	let regexPattern = pattern
		.replace(/\{\*([^}]+)\}/g, (_, param) => `(?<${param}>.+)`) // ✅ Wildcards `{*param}`
		.replace(/\{\/\*([^}]+)\}/g, (_, param) => `(?:/(?<${param}>.*?))?`) // ✅ Optional wildcards `{/*param}`
		.replace(/\{\/:([^}]+)\}/g, (_, param) => `(?:/(?<${param}>[^/]+))?`) // ✅ Optional parameters `{/:param}`
		.replace(/\/:([^/]+)/g, (_, param) => `/(?<${param}>[^/]+)`) // ✅ Named parameters
		.replace(/\*([^/]+)/g, (_, param) => `(?<${param}>.+)`); // ✅ Normal wildcards `*param`

	// Create a RegExp object from the modified pattern
	const regex = new RegExp(`^${regexPattern}$`);

	// Attempt to match the pathname
	const match = pathname.match(regex);
	if (!match) return undefined;

	// Extract named parameters
	/** @type {Record<string, string | string[]>} */
	const params = match.groups ? { ...match.groups } : {};

	for (const key in params) {
		// ✅ Convert wildcard (`*param`) values to arrays to match `path-to-regexp` behavior
		if (pattern.includes(`*${key}`) && typeof params[key] === "string") {
			params[key] = params[key] ? params[key].split("/") : [];
		}
		// ✅ Remove undefined params (optional parameters)
		else if (params[key] === undefined) {
			delete params[key];
		}
	}

	return { params };
}

/**
 * Generates a pathname from a pattern and parameters.
 * Supports named parameters (`:param`), optional segments (`{}`), and wildcards (`*param`).
 *
 * @param {string} pattern - The pattern to generate the path from.
 * @param {Record<string, string | string[]>} params - Parameters to replace in the pattern.
 * @returns {string} - The generated pathname.
 */
export function compilePathnamePattern(pattern, params) {
	return (
		pattern
			// Replace optional segments `{/:param}`
			.replace(/\{(\/:[^}]+)\}/g, (_, segment) => {
				const paramKey = segment.slice(2); // Extract `param` from `/:param`
				return params[paramKey] ? `/${params[paramKey]}` : "";
			})
			// Replace named parameters `/:param`
			.replace(/\/:([^/]+)/g, (_, paramKey) => {
				if (params[paramKey] === undefined) {
					throw new Error(`Missing value for parameter ":${paramKey}"`);
				}
				return `/${params[paramKey]}`;
			})
			// Replace wildcards `/*param`
			.replace(/\*([^/]+)/g, (_, paramKey) => {
				if (!Array.isArray(params[paramKey])) {
					throw new Error(`Wildcard parameter "*${paramKey}" must be an array`);
				}
				return params[paramKey].length > 0
					? `/${params[paramKey].join("/")}`
					: "";
			})
			// Ensure the resulting path is correctly formatted
			.replace(/\/+/g, "/") // Prevent double slashes
			.replace(/\/$/, "")
	); // Remove trailing slash unless it's the root `/`
}