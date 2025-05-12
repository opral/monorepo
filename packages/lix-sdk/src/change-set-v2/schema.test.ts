import { describe, expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";

describe("change_set", () => {
	test("insert, update, delete on the change set view", async () => {
		const lix = await openLixInMemory({});

		const initial = await lix.db.selectFrom("change_set").selectAll().execute();

		expect(initial).toHaveLength(0);

		await lix.db
			.insertInto("change_set")
			.values([{ id: "cs0" }, { id: "cs1" }])
			.execute();

		const viewAfterInsert = await lix.db
			.selectFrom("change_set")
			.orderBy("id", "asc")
			.selectAll()
			.execute();

		expect(viewAfterInsert).toEqual([
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
			.set({ metadata: JSON.stringify({ foo: "bar" }) })
			.execute();

		const viewAfterUpdate = await lix.db
			.selectFrom("change_set")
			.orderBy("id", "asc")
			.selectAll()
			.execute();

		expect(viewAfterUpdate).toEqual([
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
			.selectAll()
			.execute();

		expect(viewAfterDelete).toEqual([
			{
				id: "cs1",
				metadata: null,
			},
		]);

		const changes = await lix.db
			.selectFrom("change")
			.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
			.where("schema_key", "=", "lix_change_set")
			.orderBy("change.created_at", "asc")
			.selectAll("change")
			.select("snapshot.content")
			.execute();

		expect(changes.map((change) => change.content)).toEqual([
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
});

describe("change_set_element", () => {
	test("insert, delete on the change set element view", async () => {
		const lix = await openLixInMemory({});

		const initial = await lix.db
			.selectFrom("change_set_element")
			.selectAll()
			.execute();

		expect(initial).toEqual([]);

		await lix.db
			.insertInto("change_set_element")
			.values([
				{
					change_set_id: "cs0",
					change_id: "c0",
					entity_id: "e0",
					schema_key: "lix_key_value_table",
					file_id: "f0",
				},
			])
			.execute();

		const viewAfterInsert = await lix.db
			.selectFrom("change_set_element")
			.orderBy("change_set_id", "asc")
			.selectAll()
			.execute();

		expect(viewAfterInsert).toEqual([
			{
				change_set_id: "cs0",
				change_id: "c0",
				entity_id: "e0",
				schema_key: "lix_key_value_table",
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
});

describe("change_set_edge", () => {
	test("insert, delete on the change set edge view", async () => {
		const lix = await openLixInMemory({});

		const initial = await lix.db
			.selectFrom("change_set_edge")
			.selectAll()
			.execute();

		expect(initial).toEqual([]);

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
			.selectAll()
			.execute();

		expect(viewAfterInsert).toEqual([
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
			.selectAll()
			.execute();

		expect(viewAfterDelete).toEqual([]);
	});
});