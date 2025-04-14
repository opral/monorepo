import { test, expect, describe } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { mockChange } from "../change/mock-change.js";
import { createChangeSet } from "./create-change-set.js";

describe("change_set table", () => {
	test("should allow inserting change sets with auto-generated IDs", async () => {
		const lix = await openLixInMemory({});

		// Insert without specifying id
		const insertResult = await lix.db
			.insertInto("change_set")
			.defaultValues()
			.returningAll()
			.executeTakeFirstOrThrow();

		expect(insertResult.id).toBeDefined();
	});

	test("should allow inserting with explicit ID", async () => {
		const lix = await openLixInMemory({});
		const explicitId = "my-custom-changeset-id";

		await expect(
			lix.db.insertInto("change_set").values({ id: explicitId }).execute()
		).resolves.toBeDefined();

		const changeSet = await lix.db
			.selectFrom("change_set")
			.where("id", "=", explicitId)
			.selectAll()
			.executeTakeFirst();
		expect(changeSet?.id).toBe(explicitId);
	});

	test("deleting a change set should delete its elements (useful for interim change sets used in a transaction)", async () => {
		const lix = await openLixInMemory({});

		const changes = await lix.db
			.insertInto("change")
			.values([
				mockChange({ id: "c1", entity_id: "e1" }),
				mockChange({ id: "c2", entity_id: "e2" }),
			])
			.returningAll()
			.execute();

		// Create a change set with labels
		const changeSet = await createChangeSet({
			lix,
			elements: [
				{
					change_id: changes[0]!.id,
					entity_id: changes[0]!.entity_id,
					schema_key: changes[0]!.schema_key,
					file_id: changes[0]!.file_id,
				},
			],
		});

		// Delete the change set
		await lix.db
			.deleteFrom("change_set")
			.where("id", "=", changeSet.id)
			.execute();

		// Verify the change set was deleted
		const deletedChangeSet = await lix.db
			.selectFrom("change_set")
			.where("id", "=", changeSet.id)
			.selectAll()
			.executeTakeFirst();

		expect(deletedChangeSet).toBeUndefined();

		// Verify the change set elements were deleted
		const deletedChangeSetElements = await lix.db
			.selectFrom("change_set_element")
			.where("change_set_id", "=", changeSet.id)
			.selectAll()
			.execute();

		expect(deletedChangeSetElements).toHaveLength(0);
	});
});

describe("change_set_element table", () => {
	test("should allow inserting valid elements", async () => {
		const lix = await openLixInMemory({});
		// Pre-populate change_set
		await lix.db
			.insertInto("change_set")
			.values([{ id: "cs1" }])
			.execute();

		// Pre-populate change using mockChange
		const change = await lix.db
			.insertInto("change")
			.values([mockChange({ id: "c1" })]) // mockChange provides defaults for entity_id, schema_key, file_id
			.returningAll()
			.executeTakeFirstOrThrow();

		// Now insert the element
		const element = await lix.db
			.insertInto("change_set_element")
			.values({
				change_set_id: "cs1",
				change_id: change.id,
				entity_id: change.entity_id,
				schema_key: change.schema_key,
				file_id: change.file_id,
			})
			.returningAll()
			.executeTakeFirstOrThrow();

		expect(element).toEqual({
			change_set_id: "cs1",
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		});
	});

	test("should enforce primary key (change_set_id, change_id)", async () => {
		const lix = await openLixInMemory({});
		// Pre-populate change_set and change
		await lix.db
			.insertInto("change_set")
			.values([{ id: "cs1" }])
			.execute();
		const change = await lix.db
			.insertInto("change")
			.values([mockChange({ id: "c1" })])
			.returningAll()
			.executeTakeFirstOrThrow();

		// Insert initial element
		await lix.db
			.insertInto("change_set_element")
			.values({
				change_set_id: "cs1",
				change_id: change.id,
				entity_id: change.entity_id,
				schema_key: change.schema_key,
				file_id: change.file_id,
			})
			.execute();

		// Attempt duplicate insert
		await expect(
			lix.db
				.insertInto("change_set_element")
				.values({
					change_set_id: "cs1",
					change_id: change.id,
					entity_id: change.entity_id,
					schema_key: change.schema_key,
					file_id: change.file_id,
				})
				.execute()
		).rejects.toThrow(/UNIQUE constraint failed/i);
	});

	test("should enforce foreign key constraint on change_set_id", async () => {
		const lix = await openLixInMemory({});
		// Pre-populate ONLY change
		const change = await lix.db
			.insertInto("change")
			.values([mockChange({ id: "c1" })])
			.returningAll()
			.executeTakeFirstOrThrow();

		await expect(
			lix.db
				.insertInto("change_set_element")
				.values({
					change_set_id: "cs_nonexistent",
					change_id: change.id,
					entity_id: change.entity_id,
					schema_key: change.schema_key,
					file_id: change.file_id,
				})
				.execute()
		).rejects.toThrow(/FOREIGN KEY constraint failed/i);
	});

	test("should enforce foreign key constraint on change_id", async () => {
		const lix = await openLixInMemory({});
		// Pre-populate ONLY change_set
		await lix.db
			.insertInto("change_set")
			.values([{ id: "cs1" }])
			.execute();

		await expect(
			lix.db
				.insertInto("change_set_element")
				.values({
					change_set_id: "cs1",
					change_id: "c_nonexistent",
					// Using mock values here as the change doesn't exist
					entity_id: "mock_entity",
					schema_key: "mock_schema",
					file_id: "mock_file",
				})
				.execute()
		).rejects.toThrow(/FOREIGN KEY constraint failed/i);
	});

	test("should enforce UNIQUE constraint on (change_set_id, entity_id, schema_key, file_id)", async () => {
		const lix = await openLixInMemory({});
		// Pre-populate change set
		await lix.db
			.insertInto("change_set")
			.values([{ id: "cs1" }])
			.execute();

		// Pre-populate two changes with the SAME entity_id, schema_key, file_id
		const change1 = await lix.db
			.insertInto("change")
			.values([
				mockChange({
					id: "c1",
					entity_id: "ent1",
					schema_key: "sk1",
					file_id: "f1",
				}),
			])
			.returningAll()
			.executeTakeFirstOrThrow();

		const change2 = await lix.db
			.insertInto("change")
			.values([
				mockChange({
					id: "c2", // Different change ID
					entity_id: "ent1", // SAME entity
					schema_key: "sk1", // SAME schema
					file_id: "f1", // SAME file
				}),
			])
			.returningAll()
			.executeTakeFirstOrThrow();

		// Insert first element successfully
		await lix.db
			.insertInto("change_set_element")
			.values({
				change_set_id: "cs1",
				change_id: change1.id,
				entity_id: change1.entity_id,
				schema_key: change1.schema_key,
				file_id: change1.file_id,
			})
			.execute();

		// Attempt to insert second element with the same entity change for the *same* change set
		await expect(
			lix.db
				.insertInto("change_set_element")
				.values({
					change_set_id: "cs1",
					change_id: change2.id,
					entity_id: change2.entity_id,
					schema_key: change2.schema_key,
					file_id: change2.file_id,
				})
				.execute()
		).rejects.toThrow(); // Fails on the change_set_id, entity_id, schema_key, file_id constraint
	});
});

describe("change_set_label table", () => {
	test("should allow inserting valid labels", async () => {
		const lix = await openLixInMemory({});
		// Pre-populate change_set and label
		await lix.db
			.insertInto("change_set")
			.values([{ id: "cs1" }])
			.execute();
		await lix.db
			.insertInto("label")
			.values([{ id: "l1", name: "label1" }])
			.execute();

		await expect(
			lix.db
				.insertInto("change_set_label")
				.values({ change_set_id: "cs1", label_id: "l1" })
				.execute()
		).resolves.toBeDefined();

		const changeSetLabel = await lix.db
			.selectFrom("change_set_label")
			.selectAll()
			.executeTakeFirst();
		expect(changeSetLabel).toEqual({ change_set_id: "cs1", label_id: "l1" });
	});

	test("should enforce primary key (change_set_id, label_id)", async () => {
		const lix = await openLixInMemory({});
		// Pre-populate change_set and label
		await lix.db
			.insertInto("change_set")
			.values([{ id: "cs1" }])
			.execute();
		await lix.db
			.insertInto("label")
			.values([{ id: "l1", name: "label1" }])
			.execute();
		// Insert initial label link
		await lix.db
			.insertInto("change_set_label")
			.values({ change_set_id: "cs1", label_id: "l1" })
			.execute();

		// Attempt duplicate insert
		await expect(
			lix.db
				.insertInto("change_set_label")
				.values({ change_set_id: "cs1", label_id: "l1" })
				.execute()
		).rejects.toThrow(/UNIQUE constraint failed/i);
	});

	test("should enforce foreign key constraint on change_set_id", async () => {
		const lix = await openLixInMemory({});
		// Pre-populate ONLY label
		await lix.db
			.insertInto("label")
			.values([{ id: "l1", name: "label1" }])
			.execute();

		await expect(
			lix.db
				.insertInto("change_set_label")
				.values({ change_set_id: "cs_nonexistent", label_id: "l1" })
				.execute()
		).rejects.toThrow(/FOREIGN KEY constraint failed/i);
	});

	test("should enforce foreign key constraint on label_id", async () => {
		const lix = await openLixInMemory({});
		// Pre-populate ONLY change_set
		await lix.db
			.insertInto("change_set")
			.values([{ id: "cs1" }])
			.execute();

		await expect(
			lix.db
				.insertInto("change_set_label")
				.values({ change_set_id: "cs1", label_id: "l_nonexistent" })
				.execute()
		).rejects.toThrow(/FOREIGN KEY constraint failed/i);
	});
});

describe("change_set immutable flag and triggers", () => {
	test("change_set should default immutable to FALSE (0)", async () => {
		const lix = await openLixInMemory({});
		const cs = await lix.db
			.insertInto("change_set")
			.defaultValues()
			.returningAll()
			.executeTakeFirstOrThrow();

		const fetchedCs = await lix.db
			.selectFrom("change_set")
			.where("id", "=", cs.id)
			.selectAll()
			.executeTakeFirstOrThrow();
		expect(fetchedCs.immutable_elements).toBe(0);
	});

	test("change_set immutable can be set to TRUE (1)", async () => {
		const lix = await openLixInMemory({});
		const cs = await lix.db
			.insertInto("change_set")
			.defaultValues()
			.returningAll()
			.executeTakeFirstOrThrow();

		await lix.db
			.updateTable("change_set")
			.set({ immutable_elements: true })
			.where("id", "=", cs.id)
			.execute();
		const fetchedCs = await lix.db
			.selectFrom("change_set")
			.where("id", "=", cs.id)
			.selectAll()
			.executeTakeFirstOrThrow();
		expect(fetchedCs.immutable_elements).toBe(1);
	});

	test("inserting, updating, and deleting elements from a change set with immutable elements FALSE should work", async () => {
		const lix = await openLixInMemory({});

		// Create a mutable change set
		const [mutableCs] = await lix.db
			.insertInto("change_set")
			.values({
				immutable_elements: false,
			})
			.returning("id")
			.execute();

		await lix.db
			.insertInto("change")
			.values([
				{
					id: "change1",
					entity_id: "entity1",
					schema_key: "key1",
					file_id: "file1",
					plugin_key: "test",
					snapshot_id: "no-content",
				},
				{
					id: "change2",
					entity_id: "entity1",
					schema_key: "key1",
					file_id: "file1",
					plugin_key: "test",
					snapshot_id: "no-content",
				},
			])
			.execute();

		// Insert an element
		await expect(
			lix.db
				.insertInto("change_set_element")
				.values({
					change_set_id: mutableCs!.id,
					change_id: "change1",
					entity_id: "entity1",
					schema_key: "key1",
					file_id: "file1",
				})
				.execute()
		).resolves.toBeDefined();

		// Update the element
		await expect(
			lix.db
				.updateTable("change_set_element")
				.set({ change_id: "change2" })
				.where("change_set_id", "=", mutableCs!.id)
				.where("entity_id", "=", "entity1")
				.execute()
		).resolves.toBeDefined();

		// Delete the element
		await expect(
			lix.db
				.deleteFrom("change_set_element")
				.where("change_set_id", "=", mutableCs!.id)
				.where("entity_id", "=", "entity1")
				.execute()
		).resolves.toBeDefined();

		// Verify the element was deleted
		const elements = await lix.db
			.selectFrom("change_set_element")
			.where("change_set_id", "=", mutableCs!.id)
			.selectAll()
			.execute();

		expect(elements).toHaveLength(0);
	});

	test("triggers should prevent modification of change_set_element if change_set is immutable (1)", async () => {
		const lix = await openLixInMemory({});

		const immutableCs = await lix.db
			.insertInto("change_set")
			.values({
				immutable_elements: true,
			})
			.returningAll()
			.executeTakeFirstOrThrow();

		const mutableCs = await lix.db
			.insertInto("change_set")
			.defaultValues()
			.returningAll()
			.executeTakeFirstOrThrow();

		const changes = await lix.db
			.insertInto("change")
			.values([mockChange({ id: "c1" }), mockChange({ id: "c2" })])
			.returningAll()
			.execute();

		await lix.db
			.insertInto("change_set_element")
			.values([
				{
					change_id: changes[0]!.id,
					change_set_id: mutableCs.id,
					entity_id: changes[0]!.entity_id,
					schema_key: changes[0]!.schema_key,
					file_id: changes[0]!.file_id,
				},
			])
			.execute();

		// --- Test INSERT Trigger ---
		await expect(
			lix.db
				.insertInto("change_set_element")
				.values({
					change_id: changes[0]!.id,
					change_set_id: immutableCs.id,
					entity_id: changes[0]!.entity_id,
					schema_key: changes[0]!.schema_key,
					file_id: changes[0]!.file_id,
				})
				.execute()
		).rejects.toThrow(
			/Attempted to insert elements into a change set with immutable elements/i
		);

		// --- Test UPDATE Trigger ---
		// Setup: Insert into a set, then make it immutable
		const csToMakeImmutable = await lix.db
			.insertInto("change_set")
			.defaultValues()
			.returningAll()
			.executeTakeFirstOrThrow();

		await lix.db
			.insertInto("change_set_element")
			.values({
				change_id: changes[0]!.id,
				change_set_id: csToMakeImmutable.id,
				entity_id: changes[0]!.entity_id,
				schema_key: changes[0]!.schema_key,
				file_id: changes[0]!.file_id,
			})
			.execute();

		await lix.db
			.updateTable("change_set")
			.set({ immutable_elements: true })
			.where("id", "=", csToMakeImmutable.id)
			.execute();

		// Test: Attempt update on now-immutable set
		await expect(
			lix.db
				.updateTable("change_set_element")
				.set({ change_id: changes[1]!.id })
				.where("change_set_id", "=", csToMakeImmutable.id)
				.where("change_id", "=", changes[0]!.id)
				.executeTakeFirst()
		).rejects.toThrow(
			/Attempted to update elements of a change set with immutable elements/i
		);

		// Update should work on the still-mutable set
		const updateResult = await lix.db
			.updateTable("change_set_element")
			.set({ change_id: changes[1]!.id })
			.where("change_set_id", "=", mutableCs.id)
			.where("change_id", "=", changes[0]!.id)
			.returningAll()
			.executeTakeFirstOrThrow();
		expect(updateResult).toBeDefined();
		expect(updateResult.change_id).toBe(changes[1]!.id);

		// --- Test DELETE Trigger ---
		// Test: Attempt delete on the now-immutable set
		await expect(
			lix.db
				.deleteFrom("change_set_element")
				.where("change_set_id", "=", csToMakeImmutable.id)
				.executeTakeFirst()
		).rejects.toThrow(
			/Attempted to delete elements from a change set with immutable elements/i
		);

		// Delete should work on the (now updated) mutable set
		const deleteResult = await lix.db
			.deleteFrom("change_set_element")
			.where("change_set_id", "=", mutableCs.id)
			.where("change_id", "=", changes[1]!.id) // Element was updated
			.returningAll()
			.executeTakeFirstOrThrow();
		expect(deleteResult).toBeDefined();
	});

	test("a working change set can't be made immutable", async () => {
		const lix = await openLixInMemory({});

		// Get the active version and its working change set ID
		const activeVersion = await lix.db
			.selectFrom("active_version")
			.selectAll()
			.executeTakeFirstOrThrow();

		const version = await lix.db
			.selectFrom("version_v2")
			.where("id", "=", activeVersion.version_id)
			.select("working_change_set_id")
			.executeTakeFirstOrThrow();

		const workingChangeSetId = version.working_change_set_id;

		// Attempt to update the *actual* working change set
		await expect(
			lix.db
				.updateTable("change_set")
				.set({ immutable_elements: true })
				.where("id", "=", workingChangeSetId) // Target the correct ID
				.execute()
		).rejects.toThrow(
			/Cannot set immutable_elements to true for working change sets./i
		);
	});

	// maybe implement this. there is a bug somewhere which flips the immutable flag
	// which is the reason why this test is commented out
	test.skip("the immutable flag cannot be changed after the change set has been sealed", async () => {
		const lix = await openLixInMemory({});
		const cs = await lix.db
			.insertInto("change_set")
			.defaultValues()
			.returningAll()
			.executeTakeFirstOrThrow();

		// Seal the change set
		await lix.db
			.updateTable("change_set")
			.set({ immutable_elements: true })
			.where("id", "=", cs.id)
			.execute();

		// Attempt to change the immutable flag
		await expect(() =>
			lix.db
				.updateTable("change_set")
				.set({ immutable_elements: false })
				.where("id", "=", cs.id)
				.execute()
		).rejects.toThrow(
			/Cannot set immutable_elements to false once it was set to true/i
		);
	});
});
