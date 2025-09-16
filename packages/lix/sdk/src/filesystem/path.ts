/**
 * Regex fragments and validators for normalized filesystem paths.
 *
 * Paths are UTF-8 strings matching a strict subset of RFC 3986.
 * - leading slash
 * - no duplicate slashes
 * - no backslashes
 * - segments composed of unreserved characters
 */

const SEGMENT_CHARS = "[\\p{L}\\p{N}._~%-]";
const SEGMENT = `${SEGMENT_CHARS}+`;
const PERCENT_ENCODED_SEGMENT = /^(?:[^%]|%[0-9A-Fa-f]{2})+$/u;

/**
 * Regex string describing a normalized file path (no trailing slash, not root).
 */
export const FILE_PATH_PATTERN: string = `^/(?:${SEGMENT}/)*${SEGMENT}$`;
export const DIRECTORY_PATH_PATTERN: string = `^/(?:${SEGMENT}/)+$`;

const FILE_PATH_REGEX = new RegExp(FILE_PATH_PATTERN, "u");
const DIRECTORY_PATH_REGEX = new RegExp(DIRECTORY_PATH_PATTERN, "u");

/**
 * Test whether a path matches the normalized file form.
 */
export function isValidFilePath(path: string): boolean {
	if (!FILE_PATH_REGEX.test(path) || path === "/" || path.endsWith("/")) {
		return false;
	}
	return path
		.split("/")
		.filter(Boolean)
		.every(
			(segment) =>
				segment !== "." &&
				segment !== ".." &&
				(!segment.includes("%") || PERCENT_ENCODED_SEGMENT.test(segment))
		);
}

/**
 * Test whether a path matches the normalized directory form.
 */
export function isValidDirectoryPath(path: string): boolean {
	if (!DIRECTORY_PATH_REGEX.test(path) || path === "/") {
		return false;
	}
	return path
		.split("/")
		.filter(Boolean)
		.every(
			(segment) =>
				segment !== "." &&
				segment !== ".." &&
				(!segment.includes("%") || PERCENT_ENCODED_SEGMENT.test(segment))
		);
}
