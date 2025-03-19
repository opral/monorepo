import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createChangeSet } from "../change-set/create-change-set.js";
import { validate } from "uuid";

test("change_proposal.id should default to uuid_v7", async () => {
	const lix = await openLixInMemory({});

	// Create some changes first
	const mockChange = await lix.db
		.insertInto("change")
		.values({
			schema_key: "file",
			entity_id: "entity1",
			file_id: "mock",
			plugin_key: "mock-plugin",
			snapshot_id: "no-content",
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	// Create a change set to use in the proposal
	const changeSet = await createChangeSet({
		lix,
		changes: [mockChange],
	});

	// Now we can test the change proposal with valid foreign keys
	const result = await lix.db
		.insertInto("change_proposal")
		.values({
			change_set_id: changeSet.id,
			source_change_set_id: changeSet.id,
			target_change_set_id: changeSet.id,
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(validate(result.id)).toBe(true);
});
