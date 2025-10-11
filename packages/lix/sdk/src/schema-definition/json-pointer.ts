export type JsonPointer = `/${string}`;

export function parseJsonPointer(pointer: string): string[] {
	if (typeof pointer !== "string") {
		throw new Error("JSON Pointer must be a string");
	}
	if (pointer.length === 0) {
		throw new Error("JSON Pointer must not be empty");
	}
	if (!pointer.startsWith("/")) {
		throw new Error(
			`JSON Pointer "${pointer}" must start with '/' (examples: /id, /value/x-lix-key).`
		);
	}

	const segments = pointer
		.slice(1)
		.split("/")
		.map((segment) => decodePointerSegment(segment));

	if (segments.some((segment) => segment.length === 0)) {
		throw new Error(
			`JSON Pointer "${pointer}" contains an empty segment. Consecutive slashes are not allowed.`
		);
	}

	return segments;
}

export type JsonPointerPath = {
	segments: readonly string[];
	label: string;
	jsonPath: string;
};

/**
 * Decodes a single JSON Pointer segment by unescaping the encoded forward-slash
 * and tilde sequences.
 *
 * @example
 * decodePointerSegment("foo~1bar");
 * // => "foo/bar"
 */
export function decodePointerSegment(segment: string): string {
	return segment.replace(/~1/g, "/").replace(/~0/g, "~");
}

/**
 * Normalizes a JSON pointer string (or plain property name) to its top-level
 * property. Returns the first JSON pointer segment for pointer values or the
 * original property when the input is not a pointer.
 *
 * @example
 * normalizePointerProperty("/value/x-lix-key");
 * // => "value"
 */
export function normalizePointerProperty(value: string): string {
	if (typeof value !== "string") {
		return "";
	}
	if (!value.startsWith("/")) {
		return value;
	}
	const segments = value.slice(1).split("/").map(decodePointerSegment);
	return segments[0] ?? "";
}

/**
 * Applies {@link normalizePointerProperty} to an array of pointer strings or
 * property names, filtering out invalid entries.
 *
 * @example
 * normalizePointerProperties(["/value/x-lix-key", "id"]);
 * // => ["value", "id"]
 */
export function normalizePointerProperties(
	values?: readonly string[] | string[]
): string[] {
	if (!Array.isArray(values)) {
		return [];
	}
	return values
		.map((value) => normalizePointerProperty(value))
		.filter((value): value is string => value.length > 0);
}

/**
 * Parses an array of JSON pointer strings (or simple property names) into
 * structured path descriptors that include both pointer segments and a JSON
 * path suitable for SQLite's `json_extract`.
 */
export function parsePointerPaths(
	values?: readonly string[] | string[]
): JsonPointerPath[] {
	if (!Array.isArray(values)) {
		return [];
	}
	const paths: JsonPointerPath[] = [];
	for (const entry of values) {
		if (typeof entry !== "string" || entry.length === 0) {
			continue;
		}
		let segments: string[];
		if (entry.startsWith("/")) {
			try {
				segments = parseJsonPointer(entry);
			} catch {
				continue;
			}
		} else {
			segments = [entry];
		}
		paths.push({
			segments,
			label: entry,
			jsonPath: buildSqliteJsonPath(segments),
		});
	}
	return paths;
}

/**
 * Builds a JSON path string compatible with SQLite's json_extract from pointer
 * segments.
 */
export function buildSqliteJsonPath(segments: readonly string[]): string {
	let path = "$";
	for (const segment of segments) {
		const index = Number(segment);
		if (Number.isInteger(index) && String(index) === segment) {
			path += `[${segment}]`;
			continue;
		}
		if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(segment)) {
			path += `.${segment}`;
			continue;
		}
		const escaped = segment.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
		path += `."${escaped}"`;
	}
	return path;
}

/**
 * Extracts a nested value from a JSON-like object/array using pointer segments.
 */
export function extractValueAtPath(
	source: unknown,
	segments: readonly string[]
): any {
	let current: any = source;
	for (const segment of segments) {
		if (Array.isArray(current)) {
			const index = Number(segment);
			if (!Number.isInteger(index)) {
				return undefined;
			}
			current = current[index];
			continue;
		}
		if (current && typeof current === "object") {
			current = (current as Record<string, unknown>)[segment];
			continue;
		}
		return undefined;
	}
	return current;
}
