import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";

test("select, insert, update, delete entity", async () => {
	const lix = await openLixInMemory({});

	const initial = await lix.db.selectFrom("entity").selectAll().execute();
	expect(initial).toHaveLength(0);

	await lix.db
		.insertInto("entity")
		.values({
			entity_id: "e0",
			file_id: "f0",
			schema_key: "s0",
			plugin_key: "lix_own_entity",
			snapshot_content: {
				value: "hello world",
			},
		})
		.execute();

	const viewAfterInsert = await lix.db
		.selectFrom("entity")
		.selectAll()
		.execute();

	expect(viewAfterInsert).toMatchObject([
		{
			entity_id: "e0",
			file_id: "f0",
			schema_key: "s0",
			plugin_key: "lix_own_entity",
			snapshot_content: {
				value: "hello world",
			},
		},
	]);

	await lix.db
		.updateTable("entity")
		.set({
			snapshot_content: {
				value: "hello world - updated",
			},
		})
		.where("entity_id", "=", "e0")
		.where("schema_key", "=", "s0")
		.where("file_id", "=", "f0")
		.execute();

	const viewAfterUpdate = await lix.db
		.selectFrom("entity")
		.selectAll()
		.execute();

	expect(viewAfterUpdate).toMatchObject([
		{
			entity_id: "e0",
			file_id: "f0",
			schema_key: "s0",
			plugin_key: "lix_own_entity",
			snapshot_content: {
				value: "hello world - updated",
			},
		},
	]);

	await lix.db.deleteFrom("entity").where("entity_id", "=", "e0").execute();

	const viewAfterDelete = await lix.db
		.selectFrom("entity")
		.selectAll()
		.execute();

	expect(viewAfterDelete).toHaveLength(0);
});
