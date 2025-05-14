import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import type { LixSchemaDefinition } from "../schema/definition.js";

test("select, insert, update, delete entity", async () => {
	const mockSchema: LixSchemaDefinition = {
		"x-lix-key": "value",
		"x-lix-version": "1",
		type: "object",
		properties: {
			value: {
				type: "string",
			},
		},
	};

	const lix = await openLixInMemory({});

	await lix.db
		.insertInto("stored_schema")
		.values({ value: mockSchema })
		.execute();

	const initial = await lix.db.selectFrom("state").selectAll().execute();

	expect(initial).toHaveLength(0);

	await lix.db
		.insertInto("state")
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
		.selectFrom("state")
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
		.updateTable("state")
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
		.selectFrom("state")
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

	await lix.db.deleteFrom("state").where("entity_id", "=", "e0").execute();

	const viewAfterDelete = await lix.db
		.selectFrom("state")
		.selectAll()
		.execute();

	expect(viewAfterDelete).toHaveLength(0);
});
