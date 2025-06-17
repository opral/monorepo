import { type LixPlugin } from "@lix-js/sdk";
import { JSONPropertySchema } from "./schemas/JSONPropertySchema.js";
import { flatten, unflatten } from "flat";

export const applyChanges: NonNullable<LixPlugin["applyChanges"]> = ({
	file,
	changes,
}) => {
	// Get the current state from the file data
	let flattened: Record<string, any> = {};

	if (file.data && file.data.length > 0) {
		try {
			const parsed = JSON.parse(new TextDecoder().decode(file.data));
			flattened = flatten(parsed, { safe: true }) as Record<string, any>;
		} catch (error) {
			// Handle potential parsing errors if the initial file data isn't valid JSON
			console.error("Failed to parse existing file data:", error);
		}
	}

	for (const change of changes) {
		if (change.schema_key === JSONPropertySchema["x-lix-key"]) {
			const propertyPath = change.entity_id;

			if (change.snapshot_content === null) {
				// If the content is null, remove the property from the state
				delete flattened[propertyPath];
			} else {
				// Update the current state with the new change content
				flattened[propertyPath] = change.snapshot_content?.value;
			}
		}
	}

	return {
		fileData: new TextEncoder().encode(JSON.stringify(unflatten(flattened))),
	};
};
