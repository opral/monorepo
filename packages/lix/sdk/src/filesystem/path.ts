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

export function splitFilePath(path: string): {
	directoryPath: string | null;
	name: string;
	extension: string | null;
} {
	if (!isValidFilePath(path)) {
		throw new Error(`Invalid file path ${path}`);
	}

	const segments = path.split("/");
	const fileName = segments.pop();
	if (!fileName) {
		throw new Error(`File path ${path} is missing a file name`);
	}

	const directorySegments = segments.filter(Boolean);
	const directoryPath =
		directorySegments.length === 0
			? null
			: `/${directorySegments.join("/")}/`;

	const lastDot = fileName.lastIndexOf(".");
	if (lastDot > 0) {
		const name = fileName.slice(0, lastDot);
		const extension = fileName.slice(lastDot + 1);
		return { directoryPath, name, extension: extension || null };
	}

	return { directoryPath, name: fileName, extension: null };
}

export function composeFileName(name: string, extension: string | null): string {
	return extension ? `${name}.${extension}` : name;
}

export function composeFilePath(args: {
	directoryPath: string | null;
	name: string;
	extension: string | null;
}): string {
	const dirPrefix =
		args.directoryPath && args.directoryPath !== "/"
			? args.directoryPath.slice(0, -1)
			: "";
	const filename = composeFileName(args.name, args.extension);
	return dirPrefix ? `${dirPrefix}/${filename}` : `/${filename}`;
}
