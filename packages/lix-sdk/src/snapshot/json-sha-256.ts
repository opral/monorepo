import { sha256 } from "js-sha256";
import type { JSONType } from "./schema.js";

/**
 * Creates a sha256 hash from a json object.
 *
 * Sorts the object properties to increase consistency,
 * and de-duplication of snapshots.
 */
export function jsonSha256(content: JSONType): string {
	const sortedContent = deepSortObject(content);

	return sha256(JSON.stringify(sortedContent));
}

// naive deep sorting to receive consistent hash
function deepSortObject(obj: JSONType): any {
	if (Array.isArray(obj)) {
		return obj.map((item) =>
			typeof item === "object" && item !== null ? deepSortObject(item) : item
		);
	} else if (typeof obj === "object" && obj !== null) {
		return Object.keys(obj)
			.sort()
			.reduce(
				(acc, key) => {
					acc[key] = deepSortObject(obj[key] as JSONType);
					return acc;
				},
				{} as Record<string, unknown>
			);
	}
	return obj;
}
