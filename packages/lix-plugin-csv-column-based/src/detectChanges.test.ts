import { expect, test } from "vitest";
import { detectChanges } from "./detectChanges.js";
import type { DetectedChange } from "@lix-js/sdk";

test("it should not detect changes if the csv did not update", async () => {
	const before = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
	// same file
	const after = before;

	const metadata = { unique_column: "Name" };

	const detectedChanges = await detectChanges?.({
		before: { id: "random", path: "x.csv", data: before, metadata },
		after: { id: "random", path: "x.csv", data: after, metadata },
	});
	expect(detectedChanges).toEqual([]);
});

test("it should detect an insert", async () => {
	const before = new TextEncoder().encode(
		//
		"Name,Age\nAnna,20\nPeter,50",
	);
	const after = new TextEncoder().encode(
		"Name,Age\nAnna,20\nPeter,50\nJohn,30",
	);

	const metadata = { unique_column: "Name" };

	const detectedChanges = await detectChanges?.({
		before: { id: "random", path: "x.csv", data: before, metadata },
		after: { id: "random", path: "x.csv", data: after, metadata },
	});

	expect(detectedChanges).toEqual([
		{
			entity_id: "Name|John|Name",
			type: "cell",
			snapshot: { text: "John" },
		},
		{
			entity_id: "Name|John|Age",
			type: "cell",
			snapshot: { text: "30" },
		},
	] satisfies DetectedChange[]);
});

test("it should detect updates", async () => {
	const before = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
	const after = new TextEncoder().encode("Name,Age\nAnna,21\nPeter,50");

	const metadata = { unique_column: "Name" };

	const detectedChanges = await detectChanges?.({
		before: { id: "mock", path: "x.csv", data: before, metadata },
		after: { id: "mock", path: "x.csv", data: after, metadata },
	});

	expect(detectedChanges).toEqual([
		{
			type: "cell",
			entity_id: "Name|Anna|Age",
			snapshot: { text: "21" },
		},
	] satisfies DetectedChange[]);
});

test("it should detect a deletion", async () => {
	const before = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
	const after = new TextEncoder().encode("Name,Age\nAnna,20");

	const metadata = { unique_column: "Name" };

	const detectedChanges = await detectChanges?.({
		before: { id: "random", path: "x.csv", data: before, metadata },
		after: { id: "random", path: "x.csv", data: after, metadata },
	});

	expect(detectedChanges).toEqual([
		{ entity_id: "Name|Peter|Name", type: "cell", snapshot: undefined },
		{ entity_id: "Name|Peter|Age", type: "cell", snapshot: undefined },
	] satisfies DetectedChange[]);
});

// throwing an error leads to abysmal UX on potentially every save
// of a csv file in lix. It's better to just ignore the change
// and let an app or user define the unique column later.
test("it should return [] if the unique column is not set", async () => {
	const before = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
	const after = before;

	const metadata = { unique_column: undefined };

	const detectedChanges = await detectChanges({
		before: { id: "random", path: "x.csv", data: before, metadata },
		after: { id: "random", path: "x.csv", data: after, metadata },
	});

	expect(detectedChanges).toEqual([]);
});

// 1. if the entity id would remain identical, the change graph would be messed up
// 2. if no new changes are reported after a column change, the initial state
//    is not tracked
test("changing the unique column should lead to a new entity_id to avoid bugs", async () => {
	const before = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
	const after = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");

	const metaBefore = { unique_column: "Name" };
	const metaAfter = { unique_column: "Age" };

	const detectedChanges = await detectChanges?.({
		before: { id: "random", path: "x.csv", data: before, metadata: metaBefore },
		after: { id: "random", path: "x.csv", data: after, metadata: metaAfter },
	});

	expect(detectedChanges).toEqual(
		expect.arrayContaining([
			// detect the deletion of the old unique column
			{ entity_id: "Name|Anna|Name", type: "cell", snapshot: undefined },
			{ entity_id: "Name|Anna|Age", type: "cell", snapshot: undefined },
			{ entity_id: "Name|Peter|Name", type: "cell", snapshot: undefined },
			{ entity_id: "Name|Peter|Age", type: "cell", snapshot: undefined },
			// detect the insertion of the new unique column

			{ entity_id: "Age|50|Name", type: "cell", snapshot: { text: "Peter" } },
			{ entity_id: "Age|50|Age", type: "cell", snapshot: { text: "50" } },

			{ entity_id: "Age|20|Name", type: "cell", snapshot: { text: "Anna" } },
			{ entity_id: "Age|20|Age", type: "cell", snapshot: { text: "20" } },
		]),
	);
});
