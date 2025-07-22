import { describe, expect, test } from "vitest";
import { openLix } from "../lix/open-lix.js";

describe("change_set", () => {
	test("insert, update, delete on the change set view", async () => {
		const lix = await openLix({});

		await lix.db
			.insertInto("change_set")
			.values([{ id: "cs0" }, { id: "cs1" }])
			.execute();

		const viewAfterInsert = await lix.db
			.selectFrom("change_set")
			.orderBy("id", "asc")
			.where("id", "in", ["cs0", "cs1"])
			.selectAll()
			.execute();

		expect(viewAfterInsert).toMatchObject([
			{
				id: "cs0",
				metadata: null,
			},
			{
				id: "cs1",
				metadata: null,
			},
		]);

		await lix.db
			.updateTable("change_set")
			.where("id", "=", "cs0")
			.set({ metadata: { foo: "bar" } })
			.execute();

		const viewAfterUpdate = await lix.db
			.selectFrom("change_set")
			.orderBy("id", "asc")
			.where("id", "in", ["cs0", "cs1"])
			.selectAll()
			.execute();

		expect(viewAfterUpdate).toMatchObject([
			{
				id: "cs0",
				metadata: { foo: "bar" },
			},
			{
				id: "cs1",
				metadata: null,
			},
		]);

		await lix.db.deleteFrom("change_set").where("id", "=", "cs0").execute();

		const viewAfterDelete = await lix.db
			.selectFrom("change_set")
			.orderBy("id", "asc")
			.where("id", "in", ["cs0", "cs1"])
			.selectAll()
			.execute();

		expect(viewAfterDelete).toMatchObject([
			{
				id: "cs1",
				metadata: null,
			},
		]);

		const changes = await lix.db
			.selectFrom("change")
			.where("schema_key", "=", "lix_change_set")
			.where("entity_id", "in", ["cs0", "cs1"])
			.orderBy("change.created_at", "asc")
			.selectAll()
			.execute();

		expect(changes.map((change) => change.snapshot_content)).toMatchObject([
			// insert
			{
				id: "cs0",
				metadata: null,
			},
			// insert
			{
				id: "cs1",
				metadata: null,
			},
			// update
			{
				id: "cs0",
				metadata: { foo: "bar" },
			},
			// delete
			null,
		]);
	});

	test("should allow inserting with explicit ID", async () => {
		const lix = await openLix({});
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

describe("change_set_element", () => {
	test("insert, delete on the change set element view", async () => {
		const lix = await openLix({});

		// Create change set
		await lix.db.insertInto("change_set").values({ id: "cs0" }).execute();

		// Create change
		await lix.db
			.insertInto("change")
			.values({
				id: "c0",
				entity_id: "e0",
				schema_key: "mock_schema",
				file_id: "f0",
				plugin_key: "test_plugin",
				snapshot_content: { id: "e0" },
				schema_version: "1.0",
			})
			.execute();

		// Create stored schema
		await lix.db
			.insertInto("stored_schema")
			.values({
				key: "mock_schema",
				value: {
					"x-lix-key": "mock_schema",
					"x-lix-version": "1.0",
					additionalProperties: false,
					type: "object",
					properties: {
						id: { type: "string" },
					},
					required: ["id"],
				},
			})
			.execute();

		await lix.db
			.insertInto("change_set_element")
			.values([
				{
					change_set_id: "cs0",
					change_id: "c0",
					entity_id: "e0",
					schema_key: "mock_schema",
					file_id: "f0",
				},
			])
			.execute();

		const viewAfterInsert = await lix.db
			.selectFrom("change_set_element")
			.where("change_set_id", "=", "cs0")
			.selectAll()
			.execute();

		expect(viewAfterInsert).toMatchObject([
			{
				change_set_id: "cs0",
				change_id: "c0",
				entity_id: "e0",
				schema_key: "mock_schema",
				file_id: "f0",
			},
		]);

		await lix.db
			.deleteFrom("change_set_element")
			.where("change_set_id", "=", "cs0")
			.execute();

		const viewAfterDelete = await lix.db
			.selectFrom("change_set_element")
			.where("change_set_id", "=", "cs0")
			.selectAll()
			.execute();

		expect(viewAfterDelete).toEqual([]);
	});

	test("should enforce primary key constraint (change_set_id, change_id)", async () => {
		const lix = await openLix({});

		// Create change set
		await lix.db.insertInto("change_set").values({ id: "cs1" }).execute();

		// Create change
		await lix.db
			.insertInto("change")
			.values({
				id: "c1",
				entity_id: "e1",
				schema_key: "mock_schema",
				file_id: "f1",
				plugin_key: "test_plugin",
				snapshot_content: { id: "e1" },
				schema_version: "1.0",
			})
			.execute();

		// Create stored schema
		await lix.db
			.insertInto("stored_schema")
			.values({
				key: "mock_schema",
				value: {
					"x-lix-key": "mock_schema",
					"x-lix-version": "1.0",
					additionalProperties: false,
					type: "object",
					properties: { id: { type: "string" } },
					required: ["id"],
				},
			})
			.execute();

		// Insert first element
		await lix.db
			.insertInto("change_set_element")
			.values({
				change_set_id: "cs1",
				change_id: "c1",
				entity_id: "e1",
				schema_key: "mock_schema",
				file_id: "f1",
			})
			.execute();

		// Attempt duplicate insert with same primary key
		await expect(
			lix.db
				.insertInto("change_set_element")
				.values({
					change_set_id: "cs1",
					change_id: "c1",
					entity_id: "e1",
					schema_key: "mock_schema",
					file_id: "f1",
				})
				.execute()
		).rejects.toThrow(/Primary key constraint violation/i);
	});

	test("should enforce foreign key constraint on change_set_id", async () => {
		const lix = await openLix({});

		// Create change (but NOT change set)
		await lix.db
			.insertInto("change")
			.values({
				id: "c1",
				entity_id: "e1",
				schema_key: "mock_schema",
				file_id: "f1",
				plugin_key: "test_plugin",
				snapshot_content: { id: "e1" },
				schema_version: "1.0",
			})
			.execute();

		// Create stored schema
		await lix.db
			.insertInto("stored_schema")
			.values({
				key: "mock_schema",
				value: {
					"x-lix-key": "mock_schema",
					"x-lix-version": "1.0",
					additionalProperties: false,
					type: "object",
					properties: { id: { type: "string" } },
					required: ["id"],
				},
			})
			.execute();

		// Attempt to insert with non-existent change_set_id
		await expect(
			lix.db
				.insertInto("change_set_element")
				.values({
					change_set_id: "cs_nonexistent",
					change_id: "c1",
					entity_id: "e1",
					schema_key: "mock_schema",
					file_id: "f1",
				})
				.execute()
		).rejects.toThrow(/Foreign key constraint violation/i);
	});

	test("should enforce foreign key constraint on change_id", async () => {
		const lix = await openLix({});

		// Create change set (but NOT change)
		await lix.db.insertInto("change_set").values({ id: "cs1" }).execute();

		// Create stored schema
		await lix.db
			.insertInto("stored_schema")
			.values({
				key: "mock_schema",
				value: {
					"x-lix-key": "mock_schema",
					additionalProperties: false,
					"x-lix-version": "1.0",
					type: "object",
					properties: { id: { type: "string" } },
					required: ["id"],
				},
			})
			.execute();

		// Attempt to insert with non-existent change_id
		await expect(
			lix.db
				.insertInto("change_set_element")
				.values({
					change_set_id: "cs1",
					change_id: "c_nonexistent",
					entity_id: "mock_entity",
					schema_key: "mock_schema",
					file_id: "mock_file",
				})
				.execute()
		).rejects.toThrow(/Foreign key constraint violation/i);
	});

	test("should enforce UNIQUE constraint on (change_set_id, entity_id, schema_key, file_id)", async () => {
		const lix = await openLix({});

		// Create change set
		await lix.db.insertInto("change_set").values({ id: "cs1" }).execute();

		// Create changes for same entity
		await lix.db
			.insertInto("change")
			.values([
				{
					id: "c1",
					entity_id: "ent1",
					schema_key: "sk1",
					file_id: "f1",
					plugin_key: "test_plugin",
					snapshot_content: { id: "ent1" },
					schema_version: "1.0",
				},
				{
					id: "c2",
					entity_id: "ent1", // Same entity
					schema_key: "sk1", // Same schema
					file_id: "f1", // Same file
					plugin_key: "test_plugin",
					snapshot_content: { id: "ent1" },
					schema_version: "1.0",
				},
			])
			.execute();

		// Create stored schema
		await lix.db
			.insertInto("stored_schema")
			.values({
				key: "sk1",
				value: {
					"x-lix-key": "sk1",
					"x-lix-version": "1.0",
					additionalProperties: false,
					type: "object",
					properties: { id: { type: "string" } },
					required: ["id"],
				},
			})
			.execute();

		// Insert first element successfully
		await lix.db
			.insertInto("change_set_element")
			.values({
				change_set_id: "cs1",
				change_id: "c1",
				entity_id: "ent1",
				schema_key: "sk1",
				file_id: "f1",
			})
			.execute();

		// Attempt to insert second element with same entity for same change set
		await expect(
			lix.db
				.insertInto("change_set_element")
				.values({
					change_set_id: "cs1",
					change_id: "c2",
					entity_id: "ent1", // Same entity
					schema_key: "sk1", // Same schema
					file_id: "f1", // Same file
				})
				.execute()
		).rejects.toThrow(); // Should fail on unique constraint
	});
});

describe("change_set_edge", () => {
	test("insert, delete on the change set edge view", async () => {
		const lix = await openLix({});

		// Create the referenced change sets first
		await lix.db
			.insertInto("change_set")
			.values([{ id: "cs0" }, { id: "cs1" }])
			.execute();

		await lix.db
			.insertInto("change_set_edge")
			.values([
				{
					parent_id: "cs0",
					child_id: "cs1",
				},
			])
			.execute();

		const viewAfterInsert = await lix.db
			.selectFrom("change_set_edge")
			.orderBy("parent_id", "asc")
			.where("parent_id", "=", "cs0")
			.selectAll()
			.execute();

		expect(viewAfterInsert).toMatchObject([
			{
				parent_id: "cs0",
				child_id: "cs1",
			},
		]);

		await lix.db
			.deleteFrom("change_set_edge")
			.where("parent_id", "=", "cs0")
			.execute();

		const viewAfterDelete = await lix.db
			.selectFrom("change_set_edge")
			.orderBy("parent_id", "asc")
			.where("parent_id", "=", "cs0")
			.selectAll()
			.execute();

		expect(viewAfterDelete).toEqual([]);
	});

	test("should enforce primary key constraint (parent_id, child_id)", async () => {
		const lix = await openLix({});

		// Create the referenced change sets first
		await lix.db
			.insertInto("change_set")
			.values([{ id: "cs0" }, { id: "cs1" }])
			.execute();

		// Insert first edge
		await lix.db
			.insertInto("change_set_edge")
			.values({
				parent_id: "cs0",
				child_id: "cs1",
			})
			.execute();

		// Attempt duplicate insert with same primary key
		await expect(
			lix.db
				.insertInto("change_set_edge")
				.values({
					parent_id: "cs0",
					child_id: "cs1",
				})
				.execute()
		).rejects.toThrow(/Primary key constraint violation/i);
	});

	test("should enforce foreign key constraint on parent_id", async () => {
		const lix = await openLix({});

		// Create only child change set (not parent)
		await lix.db.insertInto("change_set").values({ id: "cs1" }).execute();

		// Attempt to insert edge with non-existent parent_id
		await expect(
			lix.db
				.insertInto("change_set_edge")
				.values({
					parent_id: "cs_nonexistent",
					child_id: "cs1",
				})
				.execute()
		).rejects.toThrow(/Foreign key constraint violation/i);
	});

	test("should enforce foreign key constraint on child_id", async () => {
		const lix = await openLix({});

		// Create only parent change set (not child)
		await lix.db.insertInto("change_set").values({ id: "cs0" }).execute();

		// Attempt to insert edge with non-existent child_id
		await expect(
			lix.db
				.insertInto("change_set_edge")
				.values({
					parent_id: "cs0",
					child_id: "cs_nonexistent",
				})
				.execute()
		).rejects.toThrow(/Foreign key constraint violation/i);
	});

	test("should prevent self-referencing edges", async () => {
		const lix = await openLix({});

		// Create a change set
		await lix.db.insertInto("change_set").values({ id: "cs1" }).execute();

		// Attempt to create self-referencing edge
		await expect(
			lix.db
				.insertInto("change_set_edge")
				.values({
					parent_id: "cs1",
					child_id: "cs1", // Same as parent_id
				})
				.execute()
		).rejects.toThrow(/Self-referencing edges are not allowed/i);
	});

	test("change_set_edge view supports updates", async () => {
		const lix = await openLix({});

		// Create change sets
		await lix.db
			.insertInto("change_set")
			.values([{ id: "cs0" }, { id: "cs1" }, { id: "cs2" }])
			.execute();

		// Insert an edge
		await lix.db
			.insertInto("change_set_edge")
			.values({ parent_id: "cs0", child_id: "cs1" })
			.execute();

		// Update should succeed (updating primary key creates new entity_id)
		const result = await lix.db
			.updateTable("change_set_edge")
			.where("parent_id", "=", "cs0")
			.set({ child_id: "cs2" })
			.execute();

		expect(result).toBeDefined();
	});
});

// the unique constraint must be (change_set_id, entity_id, schema_key, file_id)
// to allow cross change set references
test("should allow the same change to be in multiple change sets", async () => {
	const lix = await openLix({});

	// Create change sets
	await lix.db
		.insertInto("change_set")
		.values([{ id: "cs1" }, { id: "cs2" }])
		.execute();

	// Create change
	await lix.db
		.insertInto("change")
		.values({
			id: "c1",
			entity_id: "e1",
			schema_key: "mock_schema",
			file_id: "f1",
			plugin_key: "test_plugin",
			snapshot_content: { id: "e1" },
			schema_version: "1.0",
		})
		.execute();

	// Create stored schema
	await lix.db
		.insertInto("stored_schema")
		.values({
			key: "mock_schema",
			value: {
				"x-lix-key": "mock_schema",
				"x-lix-version": "1.0",
				additionalProperties: false,
				type: "object",
				properties: { id: { type: "string" } },
				required: ["id"],
			},
		})
		.execute();

	// Insert the same change into first change set
	await lix.db
		.insertInto("change_set_element")
		.values({
			change_set_id: "cs1",
			change_id: "c1",
			entity_id: "e1",
			schema_key: "mock_schema",
			file_id: "f1",
		})
		.execute();

	// Insert the same change into second change set - this should work
	await expect(
		lix.db
			.insertInto("change_set_element")
			.values({
				change_set_id: "cs2",
				change_id: "c1",
				entity_id: "e1",
				schema_key: "mock_schema",
				file_id: "f1",
			})
			.execute()
	).resolves.toBeDefined();

	// Verify elements exist in both explicit change sets (not counting working change set)
	const elements = await lix.db
		.selectFrom("change_set_element")
		.where("change_id", "=", "c1")
		.where("change_set_id", "in", ["cs1", "cs2"]) // Only count the explicit change sets
		.selectAll()
		.execute();

	expect(elements).toHaveLength(2);
	expect(elements.map((e) => e.change_set_id).sort()).toEqual(["cs1", "cs2"]);
});

describe("change_set_label", () => {
	test("insert, update, delete on the change set label view", async () => {
		const lix = await openLix({});

		// Create the referenced change set and label first
		await lix.db.insertInto("change_set").values({ id: "cs0" }).execute();

		await lix.db
			.insertInto("label")
			.values({ id: "label0", name: "bug" })
			.execute();

		await lix.db
			.insertInto("change_set_label")
			.values({
				change_set_id: "cs0",
				label_id: "label0",
				metadata: { priority: "high", assignee: "alice" },
			})
			.execute();

		const viewAfterInsert = await lix.db
			.selectFrom("change_set_label")
			.where("change_set_id", "=", "cs0")
			.selectAll()
			.execute();

		expect(viewAfterInsert).toMatchObject([
			{
				change_set_id: "cs0",
				label_id: "label0",
				metadata: { priority: "high", assignee: "alice" },
			},
		]);

		// Test update - update the metadata (non-primary key field)
		await lix.db
			.updateTable("change_set_label")
			.where("change_set_id", "=", "cs0")
			.where("label_id", "=", "label0")
			.set({ metadata: { priority: "low", assignee: "bob", notes: "updated" } })
			.execute();

		const viewAfterUpdate = await lix.db
			.selectFrom("change_set_label")
			.where("change_set_id", "=", "cs0")
			.selectAll()
			.execute();

		expect(viewAfterUpdate).toMatchObject([
			{
				change_set_id: "cs0",
				label_id: "label0",
				metadata: { priority: "low", assignee: "bob", notes: "updated" },
			},
		]);

		// Test delete
		await lix.db
			.deleteFrom("change_set_label")
			.where("change_set_id", "=", "cs0")
			.where("label_id", "=", "label0")
			.execute();

		const viewAfterDelete = await lix.db
			.selectFrom("change_set_label")
			.where("change_set_id", "=", "cs0")
			.selectAll()
			.execute();

		expect(viewAfterDelete).toEqual([]);

		// Verify changes were recorded
		const changes = await lix.db
			.selectFrom("change")

			.where("schema_key", "=", "lix_change_set_label")
			.orderBy("change.created_at", "asc")
			.selectAll("change")

			.execute();

		expect(changes.map((change) => change.snapshot_content)).toMatchObject([
			// insert
			{
				change_set_id: "cs0",
				label_id: "label0",
				metadata: { priority: "high", assignee: "alice" },
			},
			// update
			{
				change_set_id: "cs0",
				label_id: "label0",
				metadata: { priority: "low", assignee: "bob", notes: "updated" },
			},
			// delete
			null,
		]);
	});

	test("should enforce primary key constraint (change_set_id, label_id)", async () => {
		const lix = await openLix({});

		// Create the referenced change set and label
		await lix.db.insertInto("change_set").values({ id: "cs1" }).execute();

		await lix.db
			.insertInto("label")
			.values({ id: "label1", name: "test" })
			.execute();

		// Insert first label
		await lix.db
			.insertInto("change_set_label")
			.values({
				change_set_id: "cs1",
				label_id: "label1",
			})
			.execute();

		// Attempt duplicate insert with same primary key
		await expect(
			lix.db
				.insertInto("change_set_label")
				.values({
					change_set_id: "cs1",
					label_id: "label1",
				})
				.execute()
		).rejects.toThrow(/Primary key constraint violation/i);
	});

	test("should enforce foreign key constraint on change_set_id", async () => {
		const lix = await openLix({});

		// Create only label (not change set)
		await lix.db
			.insertInto("label")
			.values({ id: "label1", name: "test" })
			.execute();

		// Attempt to insert with non-existent change_set_id
		await expect(
			lix.db
				.insertInto("change_set_label")
				.values({
					change_set_id: "cs_nonexistent",
					label_id: "label1",
				})
				.execute()
		).rejects.toThrow(/Foreign key constraint violation/i);
	});

	test("should enforce foreign key constraint on label_id", async () => {
		const lix = await openLix({});

		// Create only change set (not label)
		await lix.db.insertInto("change_set").values({ id: "cs1" }).execute();

		// Attempt to insert with non-existent label_id
		await expect(
			lix.db
				.insertInto("change_set_label")
				.values({
					change_set_id: "cs1",
					label_id: "label_nonexistent",
				})
				.execute()
		).rejects.toThrow(/Foreign key constraint violation/i);
	});
});

describe("change_set_thread", () => {
	test("insert and delete on the change_set_thread view", async () => {
		const lix = await openLix({});

		// Create change sets and threads to test with
		await lix.db
			.insertInto("change_set")
			.values([{ id: "cs0" }, { id: "cs1" }])
			.execute();

		await lix.db
			.insertInto("thread")
			.values([{ id: "t0" }, { id: "t1" }])
			.execute();

		// Test insert
		await lix.db
			.insertInto("change_set_thread")
			.values([
				{ change_set_id: "cs0", thread_id: "t0" },
				{ change_set_id: "cs1", thread_id: "t1" },
			])
			.execute();

		const viewAfterInsert = await lix.db
			.selectFrom("change_set_thread")
			.orderBy("change_set_id", "asc")
			.selectAll()
			.execute();

		expect(viewAfterInsert).toMatchObject([
			{
				change_set_id: "cs0",
				thread_id: "t0",
			},
			{
				change_set_id: "cs1",
				thread_id: "t1",
			},
		]);

		// Test delete
		await lix.db
			.deleteFrom("change_set_thread")
			.where("change_set_id", "=", "cs0")
			.execute();

		const viewAfterDelete = await lix.db
			.selectFrom("change_set_thread")
			.orderBy("change_set_id", "asc")
			.selectAll()
			.execute();

		expect(viewAfterDelete).toMatchObject([
			{
				change_set_id: "cs1",
				thread_id: "t1",
			},
		]);

		// Verify the underlying state table changes
		const changes = await lix.db
			.selectFrom("change")

			.where("schema_key", "=", "lix_change_set_thread")
			.where("entity_id", "in", ["cs0~t0", "cs1~t1"])
			.orderBy("change.created_at", "asc")
			.selectAll("change")

			.execute();

		expect(changes).toHaveLength(3); // 2 inserts, 1 delete
		expect(changes[0]?.snapshot_content).toMatchObject({
			change_set_id: "cs0",
			thread_id: "t0",
		});
		expect(changes[1]?.snapshot_content).toMatchObject({
			change_set_id: "cs1",
			thread_id: "t1",
		});
		expect(changes[2]?.snapshot_content).toBe(null); // delete
	});

	test("change_set_thread view enforces foreign key constraints", async () => {
		const lix = await openLix({});

		// Try to insert with non-existent change_set_id
		await expect(
			lix.db
				.insertInto("change_set_thread")
				.values({ change_set_id: "non_existent", thread_id: "t0" })
				.execute()
		).rejects.toThrow();

		// Try to insert with non-existent thread_id
		await expect(
			lix.db
				.insertInto("change_set_thread")
				.values({ change_set_id: "cs0", thread_id: "non_existent" })
				.execute()
		).rejects.toThrow();

		// Create valid records
		await lix.db
			.insertInto("change_set")
			.values([{ id: "cs0" }])
			.execute();

		await lix.db
			.insertInto("thread")
			.values([{ id: "t0" }])
			.execute();

		// Now insert should succeed
		await lix.db
			.insertInto("change_set_thread")
			.values({ change_set_id: "cs0", thread_id: "t0" })
			.execute();
	});

	test("change_set_thread view supports updates", async () => {
		const lix = await openLix({});

		// Create change sets and threads
		await lix.db
			.insertInto("change_set")
			.values([{ id: "cs0" }])
			.execute();

		await lix.db
			.insertInto("thread")
			.values([{ id: "t0" }, { id: "t1" }])
			.execute();

		// Insert a record
		await lix.db
			.insertInto("change_set_thread")
			.values({ change_set_id: "cs0", thread_id: "t0" })
			.execute();

		// Update should succeed (updating primary key creates new entity_id)
		const result = await lix.db
			.updateTable("change_set_thread")
			.where("change_set_id", "=", "cs0")
			.set({ thread_id: "t1" })
			.execute();

		expect(result).toBeDefined();
	});
});
