import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createChangeSet } from "./create-change-set.js";
import type { Change } from "../change/schema.js";
import type { LixSchemaDefinition } from "../schema-definition/definition.js";

test("creating a change set should succeed", async () => {
	const lix = await openLixInMemory({});

	await lix.db
		.insertInto("stored_schema")
		.values({
			value: {
				"x-lix-key": "mock-schema",
				"x-lix-version": "1.0",
				type: "object",
				properties: {
					id: { type: "string" },
				},
				required: ["id"],
			} satisfies LixSchemaDefinition,
		})
		.execute();

	const mockChanges = (await lix.db
		// @ts-expect-error - internal change table
		.insertInto("internal_change")
		.values([
			{
				schema_key: "mock-schema",
				schema_version: "1.0",
				entity_id: "value1",
				file_id: "mock",
				plugin_key: "mock-plugin",
				snapshot_id: "no-content",
			},
			{
				schema_key: "mock-schema",
				schema_version: "1.0",
				entity_id: "value2",
				file_id: "mock",
				plugin_key: "mock-plugin",
				snapshot_id: "no-content",
			},
		])
		.returningAll()
		.execute()) as Change[];

	const changeSet = await createChangeSet({
		lix: lix,
		elements: mockChanges.map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
	});

	const changeSetMembers = await lix.db
		.selectFrom("change_set_element")
		.selectAll()
		.where("change_set_id", "=", changeSet.id)
		.execute();

	expect(changeSetMembers.map((member) => member.change_id)).toEqual(
		expect.arrayContaining([mockChanges[0]?.id, mockChanges[1]?.id])
	);
});
