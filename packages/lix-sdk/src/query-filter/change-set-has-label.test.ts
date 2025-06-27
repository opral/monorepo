import { test, expect } from "vitest";
import { changeSetHasLabel } from "./change-set-has-label.js";
import { openLix } from "../lix/open-lix.js";
import { createChangeSet } from "../change-set/create-change-set.js";
import { createLabel } from "../label/create-label.js";

test("should only return change sets with the given label", async () => {
	const lix = await openLix({});

	// Create two change sets
	const cs0 = await createChangeSet({
		lix,
		id: "cs0",
		elements: [],
	});

	await createChangeSet({
		lix,
		id: "cs1",
		elements: [],
	});

	// Insert a label
	const label = await createLabel({ lix, name: "mocked" });

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
