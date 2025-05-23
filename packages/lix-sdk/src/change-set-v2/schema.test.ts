import { describe, expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";

describe("change_set", () => {
	test("insert, update, delete on the change set view", async () => {
		const lix = await openLixInMemory({});

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
			.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
			.where("schema_key", "=", "lix_change_set")
			.where("entity_id", "in", ["cs0", "cs1"])
			.orderBy("change.created_at", "asc")
			.selectAll("change")
			.select("snapshot.content")
			.execute();

		expect(changes.map((change) => change.content)).toMatchObject([
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

	test("has a default id", async () => {
		const lix = await openLixInMemory({});

		// the insert would throw if no default id was provided
		await lix.db
			.insertInto("change_set")
			.defaultValues()
			.returningAll()
			.execute();
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

describe("change_set_element", () => {
	test("insert, delete on the change set element view", async () => {
		const lix = await openLixInMemory({});

		// Create change set
		await lix.db.insertInto("change_set").values({ id: "cs0" }).execute();

		// Create snapshot
		await lix.db
			.insertInto("snapshot")
			.values({
				id: "s0",
				content: { id: "e0" },
			})
			.execute();

		// Create change
		await lix.db
			.insertInto("change")
			.values({
				id: "c0",
				entity_id: "e0",
				schema_key: "mock_schema",
				file_id: "f0",
				plugin_key: "test_plugin",
				snapshot_id: "s0",
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
			.orderBy("change_set_id", "asc")
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
			.orderBy("change_set_id", "asc")
			.selectAll()
			.execute();

		expect(viewAfterDelete).toEqual([]);
	});

	test("should enforce primary key constraint (change_set_id, change_id)", async () => {
		const lix = await openLixInMemory({});

		// Create change set
		await lix.db.insertInto("change_set").values({ id: "cs1" }).execute();

		// Create snapshot and change
		await lix.db
			.insertInto("snapshot")
			.values({ id: "s1", content: { id: "e1" } })
			.execute();

		await lix.db
			.insertInto("change")
			.values({
				id: "c1",
				entity_id: "e1",
				schema_key: "mock_schema",
				file_id: "f1",
				plugin_key: "test_plugin",
				snapshot_id: "s1",
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
		const lix = await openLixInMemory({});

		// Create snapshot and change (but NOT change set)
		await lix.db
			.insertInto("snapshot")
			.values({ id: "s1", content: { id: "e1" } })
			.execute();

		await lix.db
			.insertInto("change")
			.values({
				id: "c1",
				entity_id: "e1",
				schema_key: "mock_schema",
				file_id: "f1",
				plugin_key: "test_plugin",
				snapshot_id: "s1",
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
		const lix = await openLixInMemory({});

		// Create change set (but NOT change)
		await lix.db.insertInto("change_set").values({ id: "cs1" }).execute();

		// Create stored schema
		await lix.db
			.insertInto("stored_schema")
			.values({
				key: "mock_schema",
				value: {
					"x-lix-key": "mock_schema",
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
		const lix = await openLixInMemory({});

		// Create change set
		await lix.db.insertInto("change_set").values({ id: "cs1" }).execute();

		// Create snapshots and changes for same entity
		await lix.db
			.insertInto("snapshot")
			.values([
				{ id: "s1", content: { id: "ent1" } },
				{ id: "s2", content: { id: "ent1" } },
			])
			.execute();

		await lix.db
			.insertInto("change")
			.values([
				{
					id: "c1",
					entity_id: "ent1",
					schema_key: "sk1",
					file_id: "f1",
					plugin_key: "test_plugin",
					snapshot_id: "s1",
				},
				{
					id: "c2",
					entity_id: "ent1", // Same entity
					schema_key: "sk1", // Same schema
					file_id: "f1", // Same file
					plugin_key: "test_plugin",
					snapshot_id: "s2",
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
		const lix = await openLixInMemory({});

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
		const lix = await openLixInMemory({});

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
		const lix = await openLixInMemory({});

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
		const lix = await openLixInMemory({});

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
		const lix = await openLixInMemory({});

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
});