import { type LixPlugin } from "@lix-js/sdk";
import { JSONPropertySchema } from "./schemas/JSONPropertySchema.js";
import { unflatten } from "flat";

export const applyChanges: NonNullable<LixPlugin["applyChanges"]> = async ({
	lix,
	changes,
}) => {
	const flattened: Record<string, any> = {};

	for (const change of changes) {
		if (change.schema_key === JSONPropertySchema.key) {
			const snapshot = await lix.db
				.selectFrom("snapshot")
				.where("id", "=", change.snapshot_id)
				.selectAll()
				.executeTakeFirstOrThrow();

			const propertyPath = change.entity_id;

			flattened[propertyPath] = snapshot.content?.value;
		}
	}

	return {
		fileData: new TextEncoder().encode(JSON.stringify(unflatten(flattened))),
	};
};
