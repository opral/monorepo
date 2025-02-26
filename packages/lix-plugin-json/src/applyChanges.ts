import { changeIsLeafOf, type Change, type LixPlugin, type LixReadonly } from "@lix-js/sdk";
import { JSONPropertySchema } from "./schemas/JSONPropertySchema.js";
import { unflatten } from "flat";

export const applyChanges: NonNullable<LixPlugin["applyChanges"]> = async ({
	lix,
	// _file, - we don't need to apply changes since the leaf changes should be complete
	changes,
}) => {

	// We only apply the leafchanges
	// - since lix doesn't provide the changes in order
	// - fetching all snapshots for all changes will become costy
	// the award for the most inefficient deduplication goes to... (comment by @samuelstroschein)
	const leafChanges = [
		...new Set(
			await Promise.all(
				changes.map(async (change) => {
					const leafChange = await lix.db
						.selectFrom("change")
						.where(changeIsLeafOf({ id: change.id }))
						.selectAll()
						.executeTakeFirst();
					// enable string comparison to avoid duplicates
					return JSON.stringify(leafChange);
				})
			)
		),
	].map((v) => JSON.parse(v));

	const flattened: Record<string, any> = {} 

	for (const change of leafChanges) {
		
		if (change.schema_key === JSONPropertySchema.key) {
			const snapshot = await lix.db
				.selectFrom("snapshot")
				.where("id", "=", change.snapshot_id)
				.selectAll()
				.executeTakeFirstOrThrow();

			const propertyPath = change.entity_id

			flattened[propertyPath] = snapshot.content?.value
		}
	}

	return {
		fileData: new TextEncoder().encode(JSON.stringify(unflatten(flattened))),
	};
};