import { type LixPlugin } from "@lix-js/sdk";
import { JSONPropertySchema } from "./schemas/JSONPropertySchema.js";
import { unflatten } from "flat";

export const applyChanges: NonNullable<LixPlugin["applyChanges"]> = ({
	changes,
}) => {
	const flattened: Record<string, any> = {};

	for (const change of changes) {
		if (change.schema_key === JSONPropertySchema["x-lix-key"]) {
			const propertyPath = change.entity_id;

			flattened[propertyPath] = change.snapshot_content?.value;
		}
	}

	return {
		fileData: new TextEncoder().encode(JSON.stringify(unflatten(flattened))),
	};
};
