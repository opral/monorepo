import type { Change, NewChange } from "../database/schema.js";

/**
 * Creates a mock change object with the given properties.
 *
 * @example
 *   const change = mockChange({ id: "change1" });
 *   await lix.db.insertInto("change").values(change).execute();
 */
export function mockChange(args: Partial<NewChange>): Change {
	return {
		id: "mock",
		created_at: "mock",
		plugin_key: "mock",
		file_id: "mock",
		entity_id: "mock",
		schema_key: "mock",
		snapshot_id: "no-content",
		...args,
	};
}
