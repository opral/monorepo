import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createChangeConflict } from "./create-change-conflict.js";
import { createVersion } from "../version/create-version.js";

test("conflicts should be de-duplicated based on the change_conflict.key and version", async () => {
	const lix = await openLixInMemory({});

	const version0 = await createVersion({ lix, name: "version0" });

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
				file_id: "mock",
				entity_id: "value1",
				schema_key: "mock",
				snapshot_id: "no-content",
			},
		])
		.execute();

	const changeConflict = await createChangeConflict({
		lix,
		version: version0,
		key: "mock-conflict",
		conflictingChangeIds: new Set(["change0", "change1"]),
	});

	// Check that no new conflict is created
	const conflictsAfter1Creation = await lix.db
		.selectFrom("change_conflict")
		.where("change_conflict.key", "=", "mock-conflict")
		.selectAll()
		.execute();

	expect(conflictsAfter1Creation.length).toBe(1);
	expect(conflictsAfter1Creation[0]?.id).toBe(changeConflict.id);
	expect(conflictsAfter1Creation[0]?.key).toBe("mock-conflict");

	// Create a second conflict
	const changeConflict2 = await createChangeConflict({
		lix,
		version: version0,
		key: "mock-conflict",
		conflictingChangeIds: new Set(["change0", "change1"]),
	});

	// Check that no new conflict is created
	const conflictsAfter2Creation = await lix.db
		.selectFrom("change_conflict")
		.where("change_conflict.key", "=", "mock-conflict")
		.selectAll()
		.execute();

	expect(conflictsAfter2Creation.length).toBe(1);
	expect(conflictsAfter2Creation[0]?.id).toBe(changeConflict2.id);
	expect(conflictsAfter2Creation[0]?.key).toBe("mock-conflict");
});

test("if a conflict contains the same changes for a given key and version, no new conflict should be created", async () => {
	const lix = await openLixInMemory({});

	const version0 = await createVersion({ lix, name: "version0" });

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
				file_id: "mock",
				entity_id: "value1",
				schema_key: "mock",
				snapshot_id: "no-content",
			},
			{
				id: "change2",
				plugin_key: "mock-plugin",
				file_id: "mock",
				entity_id: "value1",
				schema_key: "mock",
				snapshot_id: "no-content",
			},
		])
		.execute();

	const changeConflict = await createChangeConflict({
		lix,
		version: version0,
		key: "mock-conflict",
		conflictingChangeIds: new Set(["change0", "change1"]),
	});

	// Check that no new conflict is created
	const conflictElements = await lix.db
		.selectFrom("change_set_element")
		.innerJoin(
			"change_conflict",
			"change_conflict.change_set_id",
			"change_set_element.change_set_id",
		)
		.where("change_conflict.id", "=", changeConflict.id)
		.selectAll()
		.execute();

	expect(conflictElements.length).toBe(2);
	expect(conflictElements[0]?.change_id).toBe("change0");
	expect(conflictElements[1]?.change_id).toBe("change1");

	const changeConflict2 = await createChangeConflict({
		lix,
		version: version0,
		key: "mock-conflict",
		conflictingChangeIds: new Set(["change0", "change1"]),
	});

	expect(changeConflict2.id).toBe(changeConflict.id);

	const changeConflict3 = await createChangeConflict({
		lix,
		version: version0,
		key: "mock-conflict-other",
		// 2 was preivously not in the conflict
		conflictingChangeIds: new Set(["change1", "change2"]),
	});

	// Check that no new conflict is created
	const conflictsAfter3Creation = await lix.db
		.selectFrom("change_conflict")
		.selectAll()
		.execute();

	const conflictElementsAfter3Creation = await lix.db
		.selectFrom("change_set_element")
		.innerJoin(
			"change_conflict",
			"change_conflict.change_set_id",
			"change_set_element.change_set_id",
		)
		.where("change_conflict.id", "=", changeConflict.id)
		.selectAll()
		.execute();

	expect(conflictsAfter3Creation.length).toBe(2);
	expect(conflictsAfter3Creation.map((c) => c.key)).toStrictEqual([
		"mock-conflict",
		"mock-conflict-other",
	]);
	expect(conflictsAfter3Creation.map((c) => c.id)).toStrictEqual([
		changeConflict.id,
		changeConflict3.id,
	]);
	expect(conflictElementsAfter3Creation.length).toBe(2);
});
