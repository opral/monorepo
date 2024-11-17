import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createVersion } from "./create-version.js";
import { updateChangesInVersion } from "./update-changes-in-version.js";
import { createChangeConflict } from "../change-conflict/create-change-conflict.js";

test("it should copy the changes from the parent version", async () => {
	const lix = await openLixInMemory({});

	const changeSet0 = await lix.db
		.insertInto("change_set")
		.defaultValues()
		.returningAll()
		.executeTakeFirstOrThrow();

	const version0 = await lix.db
		.insertInto("version")
		.values({ name: "version0", change_set_id: changeSet0.id })
		.returningAll()
		.executeTakeFirstOrThrow();

	const changes = await lix.db
		.insertInto("change")
		.values([
			{
				schema_key: "file",
				entity_id: "value1",
				file_id: "mock",
				plugin_key: "mock-plugin",
				snapshot_id: "no-content",
			},
			{
				schema_key: "file",
				entity_id: "value2",
				file_id: "mock",
				plugin_key: "mock-plugin",
				snapshot_id: "no-content",
			},
		])
		.returningAll()
		.execute();

	await updateChangesInVersion({
		lix,
		version: version0,
		changes,
	});

	const version1 = await createVersion({
		lix,
		parent: version0,
	});

	const changesInversion0 = await lix.db
		.selectFrom("change")
		.innerJoin(
			"change_set_element",
			"change.id",
			"change_set_element.change_id",
		)
		.innerJoin(
			"version",
			"version.change_set_id",
			"change_set_element.change_set_id",
		)
		.selectAll("change")
		.where("version.id", "=", version0.id)
		.execute();

	const changesInversion1 = await lix.db
		.selectFrom("change")
		.innerJoin(
			"change_set_element",
			"change.id",
			"change_set_element.change_id",
		)
		.innerJoin(
			"version",
			"version.change_set_id",
			"change_set_element.change_set_id",
		)
		.selectAll("change")
		.where("version.id", "=", version1.id)
		.execute();

	// main and feature version should have the same changes
	expect(changesInversion0).toStrictEqual(changesInversion1);
});

// test("if a parent version is provided, a merge target should be created to activate conflict detection", async () => {
// 	const lix = await openLixInMemory({});

// 	const version0 = await createVersion({ lix, name: "version0" });
// 	const version1 = await createVersion({ lix, parent: version0, name: "version1" });

// 	const versionTarget = await lix.db
// 		.selectFrom("version_target")
// 		.selectAll()
// 		.where("source_version_id", "=", version1.id)
// 		.where("target_version_id", "=", version0.id)
// 		.execute();

// 	expect(versionTarget.length).toBe(1);
// });

test("it should copy change conflict pointers from the parent version", async () => {
	const lix = await openLixInMemory({});

	const changeSet0 = await lix.db
		.insertInto("change_set")
		.defaultValues()
		.returningAll()
		.executeTakeFirstOrThrow();

	const version0 = await lix.db
		.insertInto("version")
		.values({ name: "version0", change_set_id: changeSet0.id })
		.returningAll()
		.executeTakeFirstOrThrow();

	const changes = await lix.db
		.insertInto("change")
		.values([
			{
				schema_key: "file",
				entity_id: "value1",
				file_id: "mock",
				plugin_key: "mock-plugin",
				snapshot_id: "no-content",
			},
			{
				schema_key: "file",
				entity_id: "value2",
				file_id: "mock",
				plugin_key: "mock-plugin",
				snapshot_id: "no-content",
			},
		])
		.returningAll()
		.execute();

	await updateChangesInVersion({
		lix,
		version: version0,
		changes,
	});

	await createChangeConflict({
		lix,
		version: version0,
		key: "mock-key",
		conflictingChangeIds: new Set([changes[0]!.id, changes[1]!.id]),
	});

	const version0Conflicts = await lix.db
		.selectFrom("version_change_conflict")
		.where("version_id", "=", version0.id)
		.selectAll()
		.execute();

	expect(version0Conflicts.length).toBe(1);

	const version1 = await createVersion({
		lix,
		parent: version0,
		name: "version1",
	});

	const version2Conflicts = await lix.db
		.selectFrom("version_change_conflict")
		.where("version_id", "=", version1.id)
		.selectAll()
		.execute();

	expect(version2Conflicts.length).toBe(1);
	expect(version2Conflicts[0]?.change_conflict_id).toBe(
		version0Conflicts[0]?.change_conflict_id,
	);
});
