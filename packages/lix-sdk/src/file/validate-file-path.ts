/**
 * Idea is to have a minimal spec that can be extended over time.
 *
 * Every valid file path must also be a valid RFC 3986 URI.
 */

/**
 * Validates a file path.
 *
 * @throws {Error} If the file path is invalid.
 */
export function validateFilePath(path: string): void {
	// validate beginning

	if (path.length === 0) {
		throw new Error("File path must not be empty.");
	}

	if (path[0] !== "/") {
		throw new Error(
			"File path must start with a slash.\n\nFiles must start with a root slash to identify the path as root."
		);
	}

	// validate middle

	// validate ending

	if (path.endsWith("/")) {
		throw new Error(
			"File path must not end with a slash.\n\nEnding a file with a slash leads to ambiguity whether or not the path is a directory or a file."
		);
	}

	// validate general

	if (path.includes("//")) {
		throw new Error(
			"File path must not contain consecutive slashes.\n\nConsecutive slashes lead to ambiguity whether or not the path is a directory or a file."
		);
	}

	if (path.includes("\\")) {
		throw new Error(
			"File path must not contain backslashes.\n\nThe restriction might be loosened in the future."
		);
	}
}

/**
 *
 */
export function isValidFilePath(path: string): boolean {
	try {
		validateFilePath(path);
		return true;
	} catch {
		return false;
	}
}
