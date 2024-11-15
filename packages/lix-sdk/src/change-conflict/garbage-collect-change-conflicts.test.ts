import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { garbageCollectChangeConflicts } from "./garbage-collect-change-conflicts.js";
import { createChangeConflict } from "./create-change-conflict.js";
import { createVersion } from "../version/create-version.js";
import { updateChangesInVersion } from "../version/update-changes-in-version.js";

// garbage collection is not used atm
test.skip("should garbage collect conflicts that contain one or more changes that no version change pointer references (anymore)", async () => {
	const lix = await openLixInMemory({});

	const version0 = await createVersion({ lix, name: "version0" });

	const changes = await lix.db
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
			{
				id: "change2",
				plugin_key: "mock-plugin",
				schema_key: "mock",
				file_id: "mock",
				entity_id: "value2",
				snapshot_id: "no-content",
			},
		])
		.returningAll()
		.execute();

	// Create change conflicts
	const mockConflict0 = await createChangeConflict({
		lix,
		version: version0,
		key: "mock-conflict0",
		conflictingChangeIds: new Set(["change0", "change1"]),
	});

	await createChangeConflict({
		lix,
		version: version0,
		key: "mock-conflict1",
		conflictingChangeIds: new Set(["change1", "change2"]),
	});

	// Insert version change pointers (only for change0 and change1)
	// change2 is not referenced by any version change pointer
	// and should be garbage collected
	await updateChangesInVersion({
		lix,
		version: version0,
		changes: [changes[0]!, changes[1]!],
	});

	// Run garbage collection
	await garbageCollectChangeConflicts({ lix });

	// Check remaining conflicts
	const remainingConflicts = await lix.db
		.selectFrom("change_conflict")
		.selectAll()
		.execute();

	expect(remainingConflicts.length).toBe(1);
	expect(remainingConflicts[0]?.id).toBe(mockConflict0.id);

	// Check remaining conflict elements
	const remainingConflictElements = await lix.db
		.selectFrom("change_set_element")
		.innerJoin(
			"change_conflict",
			"change_conflict.change_set_id",
			"change_set_element.change_set_id",
		)
		.selectAll()
		.execute();

	expect(remainingConflictElements.length).toBe(2);
	expect(remainingConflictElements[0]?.change_id).toBe(mockConflict0.id);
	expect(remainingConflictElements[1]?.change_id).toBe(mockConflict0.id);

	// Check remaining version change conflict pointers
	const remainingVersionChangeConflictPointers = await lix.db
		.selectFrom("version_change_conflict")
		.selectAll()
		.execute();

	expect(remainingVersionChangeConflictPointers.length).toBe(1);
	expect(remainingVersionChangeConflictPointers[0]?.change_conflict_id).toBe(
		mockConflict0.id,
	);
});

test("should garbage collect conflicts that no version references", async () => {
	const lix = await openLixInMemory({});

	const changes = await lix.db
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
		.returningAll()
		.execute();

	const version0 = await createVersion({ lix, name: "version0" });

	const mockConflict0 = await createChangeConflict({
		lix,
		version: version0,
		key: "mock-conflict0",
		conflictingChangeIds: new Set(["change0", "change1"]),
	});

	// version points to changes 0 and 1

	await updateChangesInVersion({
		lix,
		version: version0,
		changes: [changes[0]!, changes[1]!],
	});

	// delete the conflict pointers mockConflict0
	await lix.db
		.deleteFrom("version_change_conflict")
		.where("change_conflict_id", "=", mockConflict0.id)
		.execute();

	// Run garbage collection
	const gc0 = await garbageCollectChangeConflicts({ lix });

	expect(gc0.deletedChangeConflicts.length).toBe(1);
	expect(gc0.deletedChangeConflicts.length).toBe(1);
	expect(gc0.deletedChangeConflicts[0]?.id).toBe(mockConflict0.id);
});

test("should NOT garbage collect conflicts that a version change conflict pointer references and where each change is referenced by a version change pointer", async () => {
	const lix = await openLixInMemory({});

	const changes = await lix.db
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
		.returningAll()
		.execute();

	const version0 = await createVersion({ lix, name: "version0" });

	const mockConflict0 = await createChangeConflict({
		lix,
		version: version0,
		key: "mock-conflict0",
		conflictingChangeIds: new Set(["change0", "change1"]),
	});

	// version points to changes 0 and 1

	await updateChangesInVersion({
		lix,
		version: version0,
		changes: [changes[0]!, changes[1]!],
	});

	// Run garbage collection
	const gc0 = await garbageCollectChangeConflicts({ lix });

	expect(gc0.deletedChangeConflicts.length).toBe(0);

	// delete all version change pointers
	await lix.db.deleteFrom("version_change_conflict").execute();

	const gc1 = await garbageCollectChangeConflicts({ lix });
	expect(gc1.deletedChangeConflicts.length).toBe(1);
	expect(gc1.deletedChangeConflicts[0]?.id).toBe(mockConflict0.id);
});
