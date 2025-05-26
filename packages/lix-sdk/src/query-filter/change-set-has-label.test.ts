/* eslint-disable @typescript-eslint/no-unused-vars */
import { test, expect } from "vitest";
import { changeSetHasLabel } from "./change-set-has-label.js";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createChangeSet } from "../change-set-v2/create-change-set.js";
import { mockChange } from "../change/mock-change.js";

test("should only return change sets with the given label", async () => {
	const lix = await openLixInMemory({});

	const changes0 = await lix.db
		.insertInto("change")
		.values([mockChange({ id: "change1" }), mockChange({ id: "change2" })])
		.returningAll()
		.execute();

	// Create two change sets
	const cs0 = await createChangeSet({
		lix,
		elements: [changes0[0]!].map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
	});

	const cs1 = await createChangeSet({
		lix,
		elements: [changes0[1]!].map((change) => ({
			change_id: change.id,
			entity_id: change.entity_id,
			schema_key: change.schema_key,
			file_id: change.file_id,
		})),
	});

	// Insert a label
	const label = await lix.db
		.insertInto("label")
		.values({ name: "mocked" })
		.returningAll()
		.executeTakeFirstOrThrow();

	// Assign the label to one of the change sets
	await lix.db
		.insertInto("change_set_label")
		.values({ change_set_id: cs0.id, label_id: label.id })
		.execute();

	// Query change sets with the label
	const changeSets = await lix.db
		.selectFrom("change_set")
		.where(changeSetHasLabel({ name: "mocked" }))
		.selectAll()
		.execute();

	// Assertions
	expect(changeSets).toHaveLength(1);
	expect(changeSets[0]?.id).toBe(cs0.id);
});
