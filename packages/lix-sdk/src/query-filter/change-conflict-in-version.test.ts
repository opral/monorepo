import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createChangeConflict } from "../change-conflict/create-change-conflict.js";
import { changeConflictInVersion } from "./change-conflict-in-version.js";
import { createVersion } from "../version/create-version.js";

test("should find conflicts in the given version", async () => {
	const lix = await openLixInMemory({});

	// Insert changes
	await lix.db
		.insertInto("change")
		.values([
			{
				id: "change0",
				plugin_key: "mock-plugin",
				schema_key: "mock",
				file_id: "mock",
				entity_id: "value0",
				snapshot_id: "no-content",
			},
			{
				id: "change1",
				plugin_key: "mock-plugin",
				schema_key: "mock",
				file_id: "mock",
				entity_id: "value1",
				snapshot_id: "no-content",
			},
		])
		.execute();

	const version0 = await createVersion({ lix, name: "version0" });

	const version1 = await createVersion({ lix, name: "version1" });

	// Create change conflicts
	const mockConflict0 = await createChangeConflict({
		lix,
		version: version0,
		key: "mock-conflict0",
		conflictingChangeIds: new Set(["change0", "change1"]),
	});

	// conflict in another version that should not be returned
	await createChangeConflict({
		lix,
		version: version1,
		key: "mock-conflict1",
		conflictingChangeIds: new Set(["change0"]),
	});

	// Query conflicts in the version
	const conflictsInversion = await lix.db
		.selectFrom("change_conflict")
		.where(changeConflictInVersion(version0))
		.selectAll()
		.execute();

	expect(conflictsInversion.length).toBe(1);
	expect(conflictsInversion[0]?.id).toBe(mockConflict0.id);
});
