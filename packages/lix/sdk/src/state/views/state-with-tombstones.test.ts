import { expect, test } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import { applyStateWithTombstonesView } from "./state-with-tombstones.js";

test("state_with_tombstones exposes tracked deletions as tombstones", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
			},
		],
	});

	// Create the view (temporary until wired into schema bootstrap)
	applyStateWithTombstonesView({ engine: lix.engine! });

	const active = await lix.db
		.selectFrom("active_version")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Insert a tracked row into active version
	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: "e_del",
			schema_key: "mock_schema_for_deleted",
			file_id: "file_tombstone",
			version_id: (active as any).version_id ?? (active as any).id,
			plugin_key: "test_plugin",
			schema_version: "1.0",
			snapshot_content: { v: "live" },
		})
		.execute();

	// Delete to create a tracked tombstone
	await lix.db
		.deleteFrom("state_all")
		.where("entity_id", "=", "e_del")
		.where("schema_key", "=", "mock_schema_for_deleted")
		.where("file_id", "=", "file_tombstone")
		.where("version_id", "=", (active as any).version_id ?? (active as any).id)
		.execute();

	// Default state_all should hide the deletion
	const hidden = await lix.db
		.selectFrom("state_all")
		.where("entity_id", "=", "e_del")
		.where("schema_key", "=", "mock_schema_for_deleted")
		.where("file_id", "=", "file_tombstone")
		.selectAll()
		.execute();
	expect(hidden).toHaveLength(0);

	// state_with_tombstones should expose the tombstone (snapshot_content = null)
	const withDeleted = await lix.db
		.selectFrom("state_with_tombstones" as any)
		.where("entity_id", "=", "e_del")
		.where("schema_key", "=", "mock_schema_for_deleted")
		.where("file_id", "=", "file_tombstone")
		.selectAll()
		.execute();

	expect(withDeleted).toHaveLength(1);
	const row: any = withDeleted[0];
	expect(row.snapshot_content).toBeNull();
	expect(row.change_id).toBeTruthy();
	expect(row.commit_id).toBeTruthy();
});
