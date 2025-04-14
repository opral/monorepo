import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createChangeSet } from "../change-set/create-change-set.js";
import { mockJsonPlugin } from "../plugin/mock-json-plugin.js";
import { fileQueueSettled } from "../file-queue/file-queue-settled.js";
import { createCheckpoint } from "../change-set/create-checkpoint.js";

test("should allow inserting a valid version", async () => {
	const lix = await openLixInMemory({});
	// Pre-populate change_set table
	await lix.db
		.insertInto("change_set")
		.values([{ id: "cs1" }, { id: "cs2" }])
		.execute();

	// Insert a version referencing a valid change set
	await expect(
		lix.db
			.insertInto("version_v2")
			.values({
				id: "v1",
				name: "version one",
				change_set_id: "cs1",
				working_change_set_id: "cs1",
			})
			.execute()
	).resolves.toBeDefined();

	// Verify the inserted data
	const version = await lix.db
		.selectFrom("version_v2")
		.selectAll()
		.where("id", "=", "v1")
		.executeTakeFirst();
	expect(version).toEqual({
		id: "v1",
		name: "version one",
		change_set_id: "cs1",
		working_change_set_id: "cs1",
	});
});

test("should use default id and name if not provided", async () => {
	const lix = await openLixInMemory({});
	// Pre-populate change_set table
	await lix.db
		.insertInto("change_set")
		.values([{ id: "cs1" }])
		.execute();

	// Insert a version providing only change_set_id
	await lix.db
		.insertInto("version_v2")
		.values({ change_set_id: "cs1", working_change_set_id: "cs1" })
		.execute();

	// Verify the inserted data (id and name should be defaulted)
	const version = await lix.db
		.selectFrom("version_v2")
		.selectAll()
		.where("change_set_id", "=", "cs1")
		.executeTakeFirst();

	expect(version?.id).toBeTypeOf("string");
	expect(version?.id.length).toBeGreaterThan(0);
	expect(version?.name).toBeTypeOf("string");
	expect(version?.name?.length).toBeGreaterThan(0);
	expect(version?.change_set_id).toBe("cs1");
});

test("should enforce primary key constraint (id)", async () => {
	const lix = await openLixInMemory({});
	// Pre-populate change_set table
	await lix.db
		.insertInto("change_set")
		.values([{ id: "cs1" }])
		.execute();

	await lix.db
		.insertInto("change_set")
		.values([{ id: "wcs1" }])
		.execute();

	await lix.db
		.insertInto("change_set")
		.values([{ id: "wcs2" }])
		.execute();

	// Insert initial version
	await lix.db
		.insertInto("version_v2")
		.values({
			id: "v1",
			name: "version one",
			change_set_id: "cs1",
			working_change_set_id: "wcs1",
		})
		.execute();

	// Attempt to insert the same version id again
	await expect(
		lix.db
			.insertInto("version_v2")
			.values({
				id: "v1",
				name: "version two",
				change_set_id: "cs1",
				working_change_set_id: "wcs2",
			}) // Same id
			.execute()
	).rejects.toThrow(/UNIQUE constraint failed: version_v2.id/i);
});

test("should enforce unique constraint (name)", async () => {
	const lix = await openLixInMemory({});
	// Pre-populate change_set table
	await lix.db
		.insertInto("change_set")
		.values([{ id: "cs1" }])
		.execute();

	await lix.db
		.insertInto("change_set")
		.values([{ id: "wcs1" }])
		.execute();

	await lix.db
		.insertInto("change_set")
		.values([{ id: "wcs2" }])
		.execute();

	// Insert initial version
	await lix.db
		.insertInto("version_v2")
		.values({
			id: "v1",
			name: "unique_name",
			change_set_id: "cs1",
			working_change_set_id: "wcs1",
		})
		.execute();

	// Attempt to insert another version with the same name
	await expect(
		lix.db
			.insertInto("version_v2")
			.values({
				id: "v2",
				name: "unique_name",
				change_set_id: "cs1",
				working_change_set_id: "wcs2",
			}) // Same name
			.execute()
	).rejects.toThrow(/UNIQUE constraint failed: version_v2.name/i);
});

test("should enforce foreign key constraint on change_set_id", async () => {
	const lix = await openLixInMemory({});
	// DO NOT pre-populate change_set table

	await expect(
		lix.db
			.insertInto("version_v2")
			.values({
				id: "v1",
				name: "v1_name",
				change_set_id: "cs_nonexistent",
				working_change_set_id: "cs_nonexistent",
			})
			.execute()
	).rejects.toThrow(/FOREIGN KEY constraint failed/i);
});

test("should enforce NOT NULL constraint on change_set_id", async () => {
	const lix = await openLixInMemory({});
	// Pre-populate change_set table (though not strictly needed for this test)
	await lix.db
		.insertInto("change_set")
		.values([{ id: "cs1" }])
		.execute();

	// Kysely's types should prevent this, but testing the constraint directly
	await expect(
		lix.db
			.insertInto("version_v2")
			// @ts-expect-error Testing invalid input
			.values({ id: "v1", name: "v1_name", change_set_id: null })
			.execute()
	).rejects.toThrow(/NOT NULL constraint failed: version_v2.change_set_id/i);
});

test("applying the schema should create an initial 'main' version", async () => {
	const lix = await openLixInMemory({});
	const initialVersion = await lix.db
		.selectFrom("version_v2")
		.where("name", "=", "main")
		.selectAll()
		.executeTakeFirst();

	expect(initialVersion).toBeDefined();
});

test("applying the schema should set the initial active version to 'main'", async () => {
	const lix = await openLixInMemory({});
	const activeVersion = await lix.db
		.selectFrom("active_version")
		.selectAll()
		.executeTakeFirst();
	expect(activeVersion).toBeDefined();
	expect(activeVersion?.version_id).toBe(
		"019328cc-ccb0-7f51-96e8-524df4597ac6"
	);
});

test("applying the schema multiple times should be idempotent for initial data", async () => {
	const lix = await openLixInMemory({});
	// openLixInMemory already applies the schema once.
	// We don't need to explicitly apply it again as the init logic handles it.

	// Verify counts after initial creation
	const initialChangeSetCount = await lix.db
		.selectFrom("change_set")
		.select(lix.db.fn.count("id").as("count"))
		.executeTakeFirstOrThrow();

	// change set + working change set
	expect(initialChangeSetCount.count).toBe(2);

	const initialVersionCount = await lix.db
		.selectFrom("version_v2")
		.select(lix.db.fn.count("id").as("count"))
		.executeTakeFirstOrThrow();
	expect(initialVersionCount.count).toBe(1);

	const initialActiveVersionCount = await lix.db
		.selectFrom("active_version")
		.select(lix.db.fn.count("version_id").as("count"))
		.executeTakeFirstOrThrow();
	expect(initialActiveVersionCount.count).toBe(1);
});

test("should enforce UNIQUE constraint on working_change_set_id", async () => {
	const lix = await openLixInMemory({});

	// Insert necessary change sets to satisfy foreign keys
	const cs1 = await lix.db
		.insertInto("change_set")
		.values({ id: "cs1" })
		.returningAll()
		.executeTakeFirstOrThrow();
	const cs2 = await lix.db
		.insertInto("change_set")
		.values({ id: "cs2" })
		.returningAll()
		.executeTakeFirstOrThrow();
	const workingCs1 = await lix.db
		.insertInto("change_set")
		.values({ id: "workingCs1" })
		.returningAll()
		.executeTakeFirstOrThrow();
	const workingCs2 = await lix.db
		.insertInto("change_set")
		.values({ id: "workingCs2" })
		.returningAll()
		.executeTakeFirstOrThrow();

	// Insert first version referencing workingCs1
	await lix.db
		.insertInto("version_v2")
		.values({
			id: "v1",
			name: "version one",
			change_set_id: cs1.id,
			working_change_set_id: workingCs1.id,
		})
		.execute();

	// Attempt to insert another version referencing the SAME workingCs1 -> should fail
	await expect(
		lix.db
			.insertInto("version_v2")
			.values({
				id: "v2",
				name: "version two",
				change_set_id: cs2.id, // Different historical point is fine
				working_change_set_id: workingCs1.id, // <<< Same working_change_set_id
			})
			.execute()
	).rejects.toThrow(
		/UNIQUE constraint failed: version_v2.working_change_set_id/i
	);

	// Inserting another version with a DIFFERENT working_change_set_id should succeed
	await expect(
		lix.db
			.insertInto("version_v2")
			.values({
				id: "v3",
				name: "version three",
				change_set_id: cs1.id, // Can branch from same historical point
				working_change_set_id: workingCs2.id, // <<< Different working_change_set_id
			})
			.execute()
	).resolves.toBeDefined();
});

test("the working change set should be updated when the change set is updated", async () => {
	const lix = await openLixInMemory({});

	const snapshots = await lix.db
		.insertInto("snapshot")
		.values([
			{ content: { value: "entity0" } },
			{ content: { value: "entity1" } },
			{ content: { value: "entity0-updated" } },
		])
		.returningAll()
		.execute();

	const changes = await lix.db
		.insertInto("change")
		.values([
			{
				id: "change0",
				entity_id: "entity0",
				schema_key: "key0",
				file_id: "file0",
				snapshot_id: snapshots[0]!.id,
				plugin_key: "mock",
			},
			{
				id: "change1",
				entity_id: "entity1",
				schema_key: "key1",
				file_id: "file1",
				snapshot_id: snapshots[1]!.id,
				plugin_key: "mock",
			},
			// updates the entity0
			{
				id: "change2",
				entity_id: "entity0",
				schema_key: "key0",
				file_id: "file0",
				snapshot_id: snapshots[2]!.id,
				plugin_key: "mock",
			},
			// deletes entity1
			{
				id: "change3",
				entity_id: "entity1",
				schema_key: "key1",
				file_id: "file1",
				snapshot_id: "no-content",
				plugin_key: "mock",
			},
		])
		.returningAll()
		.execute();

	// Create initial change sets
	const [initialChangeSet] = await lix.db
		.insertInto("change_set")
		.values({
			id: "cs0",
			immutable_elements: true,
		})
		.returning("id")
		.execute();

	const [workingChangeSet] = await lix.db
		.insertInto("change_set")
		.values({
			id: "working_cs",
			immutable_elements: false,
		})
		.returning("id")
		.execute();

	// Create initial version pointing to these change sets
	await lix.db
		.insertInto("version_v2")
		.values({
			id: "v0",
			name: "v0",
			change_set_id: initialChangeSet!.id,
			working_change_set_id: workingChangeSet!.id,
		})
		.execute();

	const cs1 = await createChangeSet({
		lix,
		id: "cs1",
		elements: [changes[0]!].map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
		parents: [initialChangeSet!],
	});

	// Update the version to point to the new change set
	await lix.db
		.updateTable("version_v2")
		.set({ change_set_id: cs1!.id })
		.where("id", "=", "v0")
		.execute();

	// Verify the working change set was updated with the new change
	const workingElements = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_id", "=", workingChangeSet!.id)
		.selectAll()
		.execute();

	expect(workingElements).toHaveLength(1);
	expect(workingElements[0]).toMatchObject({
		change_id: "change0",
		entity_id: "entity0",
		schema_key: "key0",
		file_id: "file0",
	});

	// now use change1 which inserts entity1
	const cs2 = await createChangeSet({
		lix,
		id: "cs2",
		elements: [changes[1]!].map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
		parents: [cs1!],
	});

	// Update the version to point to the new change set
	await lix.db
		.updateTable("version_v2")
		.set({ change_set_id: cs2!.id })
		.where("id", "=", "v0")
		.execute();

	// Verify the working change set was updated with the new change
	const workingElements2 = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_id", "=", workingChangeSet!.id)
		.orderBy("entity_id")
		.selectAll()
		.execute();

	expect(workingElements2).toHaveLength(2);
	expect(workingElements2[0]).toMatchObject({
		change_id: "change0",
		entity_id: "entity0",
		schema_key: "key0",
		file_id: "file0",
	});
	expect(workingElements2[1]).toMatchObject({
		change_id: "change1",
		entity_id: "entity1",
		schema_key: "key1",
		file_id: "file1",
	});

	// now use change2 which updates entity0
	const cs3 = await createChangeSet({
		lix,
		id: "cs3",
		elements: [changes[2]!].map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
		parents: [cs2!],
	});

	// Update the version to point to the new change set
	await lix.db
		.updateTable("version_v2")
		.set({ change_set_id: cs3!.id })
		.where("id", "=", "v0")
		.execute();

	// Verify the working change set was updated with the new change
	const workingElements3 = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_id", "=", workingChangeSet!.id)
		.orderBy("entity_id")
		.selectAll()
		.execute();

	expect(workingElements3).toHaveLength(2);
	expect(workingElements3[0]).toMatchObject({
		change_id: "change2",
		entity_id: "entity0",
		schema_key: "key0",
		file_id: "file0",
	});
	expect(workingElements3[1]).toMatchObject({
		change_id: "change1",
		entity_id: "entity1",
		schema_key: "key1",
		file_id: "file1",
	});

	// now use change3 which deletes entity1
	const cs4 = await createChangeSet({
		lix,
		id: "cs4",
		elements: [changes[3]!].map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
		parents: [cs3!],
	});

	// Update the version to point to the new change set
	await lix.db
		.updateTable("version_v2")
		.set({ change_set_id: cs4!.id })
		.where("id", "=", "v0")
		.execute();

	// Verify the working change set was updated with the new change
	const workingElements4 = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_id", "=", workingChangeSet!.id)
		.orderBy("entity_id")
		.selectAll()
		.execute();

	// expecting only entity0 because entity1 was deleted by change 3.
	// entity1 was never tracked in a previous checkpoint. hence, the
	// working change set does not contain a delete change to avoid user confusion a la:
	// "my previous checkpoint doesn't have entity1, why does it show as deleted?"
	expect(workingElements4).toHaveLength(1);
	expect(workingElements4[0]).toMatchObject({
		change_id: "change2",
		entity_id: "entity0",
		schema_key: "key0",
		file_id: "file0",
	});
});

// simplified test but depends on `createCheckpoint()` which was flaky at the time of writing this test
test.skip("keeps delete change if entity was inserted before or with the last checkpoint", async () => {
	const lix = await openLixInMemory({
		providePlugins: [mockJsonPlugin],
	});

	await lix.db
		.insertInto("file")
		.values({
			id: "file0",
			path: "/test.json",
			data: new TextEncoder().encode(
				JSON.stringify({
					entity0: "value0",
				})
			),
		})
		.execute();

	await fileQueueSettled({ lix });
	await createCheckpoint({ lix });

	// Delete the entity
	await lix.db.deleteFrom("file").where("path", "=", "/test.json").execute();

	await fileQueueSettled({ lix });

	const workingChangeSet = await lix.db
		.with("act_version", (eb) =>
			eb
				.selectFrom("active_version")
				.innerJoin("version_v2", "active_version.version_id", "version_v2.id")
				.selectAll("version_v2")
		)
		.selectFrom("change_set")
		.innerJoin(
			"act_version",
			"change_set.id",
			"act_version.working_change_set_id"
		)
		.selectAll("change_set")
		.executeTakeFirstOrThrow();

	const elements = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_id", "=", workingChangeSet.id)
		.orderBy("entity_id")
		.selectAll()
		.execute();

	expect(elements).toHaveLength(1);
	expect(elements[0]).toMatchObject({
		change_id: expect.any(String),
		entity_id: "entity0",
		schema_key: "mock_json_property",
		file_id: "file0",
	});
});

test("keeps the delete change if the ancestry from the previous checkpoint tracked the entity", async () => {
	const lix = await openLixInMemory({});

	const checkpointLabel = await lix.db
		.selectFrom("label")
		.where("name", "=", "checkpoint")
		.select("id")
		.executeTakeFirstOrThrow();

	const snapshots = await lix.db
		.insertInto("snapshot")
		.values({ content: { value: "entity0" } })
		.returningAll()
		.execute();

	const insertChange = await lix.db
		.insertInto("change")
		.values({
			id: "change-insert",
			entity_id: "entity0",
			schema_key: "test_entity",
			file_id: "file0",
			snapshot_id: snapshots[0]!.id,
			plugin_key: "test_plugin",
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	const deleteChange = await lix.db
		.insertInto("change")
		.values({
			id: "change-delete",
			entity_id: "entity0",
			schema_key: "test_entity",
			file_id: "file0",
			snapshot_id: "no-content",
			plugin_key: "test_plugin",
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	const insertChangeSet = await createChangeSet({
		lix,
		labels: [checkpointLabel],
		id: "checkpoint-cs",
		elements: [
			{
				change_id: insertChange.id,
				entity_id: insertChange.entity_id,
				schema_key: insertChange.schema_key,
				file_id: insertChange.file_id,
			},
		],
	});

	const deleteChangeSet = await createChangeSet({
		lix,
		id: "delete-cs",
		elements: [
			{
				change_id: deleteChange.id,
				entity_id: deleteChange.entity_id,
				schema_key: deleteChange.schema_key,
				file_id: deleteChange.file_id,
			},
		],
		parents: [insertChangeSet],
	});

	const workingChangeSet = await createChangeSet({
		lix,
		id: "working-cs",
		immutableElements: false,
	});

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.innerJoin("version_v2", "version_v2.id", "active_version.version_id")
		.select(["version_v2.id"])
		.executeTakeFirstOrThrow();

	// Update the version to point to the checkpoint change set
	await lix.db
		.updateTable("version_v2")
		.set({
			change_set_id: insertChangeSet.id,
			working_change_set_id: workingChangeSet.id,
		})
		.where("id", "=", activeVersion.id)
		.execute();

	// Trigger the handleUpdateWorkingChangeSet function by updating the version
	// to point to the delete change set
	await lix.db
		.updateTable("version_v2")
		.set({ change_set_id: deleteChangeSet.id })
		.where("id", "=", activeVersion.id)
		.execute();

	// Now check the working change set - it should contain the delete change
	const workingElements = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_id", "=", workingChangeSet.id)
		.where("entity_id", "=", "entity0")
		.selectAll()
		.execute();

	// The delete change should be in the working change set
	// because the entity0 has been previously captured in a
	// checkpoint. the user needs to know when creating a new
	// checkpoint that "you are deleting entity0"
	expect(workingElements).toHaveLength(1);
	expect(workingElements[0]).toMatchObject({
		change_id: deleteChange.id,
		entity_id: "entity0",
		schema_key: "test_entity",
		file_id: "file0",
	});
});