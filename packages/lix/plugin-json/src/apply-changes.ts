import { type LixPlugin } from "@lix-js/sdk";
import { JSONPropertySchema } from "./schemas/json-property.js";
import {
	setValueAtPointer,
	removeValueAtPointer,
	type JSONValue,
} from "./utilities/json-pointer.js";

/**
 * Applies JSON Pointer based changes to a file's parsed JSON document.
 *
 * @example
 * ```ts
 * applyChanges({ file, changes: [{ entity_id: "/title", snapshot_content: { property: "/title", value: "Hi" } }] });
 * ```
 */
export const applyChanges: NonNullable<LixPlugin["applyChanges"]> = ({
	file,
	changes,
}) => {
	const decoder = new TextDecoder();
	const encoder = new TextEncoder();
	const initialDocument =
		file.data && file.data.length > 0
			? (JSON.parse(decoder.decode(file.data)) as JSONValue)
			: {};
	let document: JSONValue | undefined = initialDocument;

	for (const change of changes) {
		if (change.schema_key === JSONPropertySchema["x-lix-key"]) {
			const propertyPath = change.entity_id;

			if (change.snapshot_content === null) {
				document = removeValueAtPointer(document, propertyPath);
			} else {
				document = setValueAtPointer(
					document,
					propertyPath,
					change.snapshot_content.value as JSONValue,
				);
			}
		}
	}

	return {
		fileData: encoder.encode(JSON.stringify(document ?? null)),
	};
};
