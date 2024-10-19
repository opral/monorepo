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
			entity_id: "Name:John",
			type: "row",
			snapshot: ["John", "30"],
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
			type: "row",
			entity_id: "Name:Anna",
			snapshot: ["Anna", "21"],
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
		{ entity_id: "Name:Peter", type: "row", snapshot: undefined },
	] satisfies DetectedChange[]);
});

test("it should throw an error if the unique column is not set", async () => {
	const before = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
	const after = before;

	const metadata = { unique_column: undefined };

	await expect(
		detectChanges?.({
			before: { id: "random", path: "x.csv", data: before, metadata },
			after: { id: "random", path: "x.csv", data: after, metadata },
		}),
	).rejects.toThrowError();
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
			{ entity_id: "Name:Anna", type: "row", snapshot: undefined },
			{ entity_id: "Name:Peter", type: "row", snapshot: undefined },
			// detect the insertion of the new unique column
			{ entity_id: "Age:20", type: "row", snapshot: ["Anna", "20"] },
			{ entity_id: "Age:50", type: "row", snapshot: ["Peter", "50"] },
		]),
	);
});
