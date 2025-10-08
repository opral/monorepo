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
		.map((segment) => segment.replace(/~1/g, "/").replace(/~0/g, "~"));

	if (segments.some((segment) => segment.length === 0)) {
		throw new Error(
			`JSON Pointer "${pointer}" contains an empty segment. Consecutive slashes are not allowed.`
		);
	}

	return segments;
}
