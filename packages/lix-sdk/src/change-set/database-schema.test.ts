import { describe, test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { mockChange } from "../change/mock-change.js";

describe("change_set table", () => {
	test("should allow inserting change sets with auto-generated IDs", async () => {
		const lix = await openLixInMemory({});

		// Insert without specifying id
		const insertResult = await lix.db
			.insertInto("change_set")
			.defaultValues()
			.executeTakeFirstOrThrow();

		expect(insertResult.numInsertedOrUpdatedRows).toBe(1);

		// Verify the ID was generated
		const changeSet = await lix.db
			.selectFrom("change_set")
			.selectAll()
			.limit(1)
			.executeTakeFirst();
		expect(changeSet).toBeDefined();
		expect(changeSet?.id).toBeTypeOf("string");
		expect(changeSet?.id.length).toBe(16); // Default nano_id length
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
		).resolves.toBeDefined();

		// Verify insertion
		const element = await lix.db
			.selectFrom("change_set_element")
			.selectAll()
			.executeTakeFirst();
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
					change_set_id: "cs1", // Same change set
					change_id: change2.id, // Different change
					entity_id: change2.entity_id, // Same entity combo
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
