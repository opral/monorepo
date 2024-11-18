import { expect, test } from "vitest";
import { detectChanges } from "./detectChanges.js";
import type { DetectedChange } from "@lix-js/sdk";
import { CellSchema } from "./schemas/cell.js";
import { HeaderSchema } from "./schemas/header.js";
import { RowSchema } from "./schemas/row.js";

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

test("it should detect a new row with its cells", async () => {
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

	expect(detectedChanges).toStrictEqual([
		{
			entity_id: "Name|John",
			schema: RowSchema,
			snapshot: { lineNumber: 2 },
		},
		{
			entity_id: "Name|John|Name",
			schema: CellSchema,
			snapshot: { text: "John" },
		},
		{
			entity_id: "Name|John|Age",
			schema: CellSchema,
			snapshot: { text: "30" },
		},
	] satisfies DetectedChange<typeof CellSchema | typeof RowSchema>[]);
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
			schema: CellSchema,
			entity_id: "Name|Anna|Age",
			snapshot: { text: "21" },
		},
	] satisfies DetectedChange<typeof CellSchema>[]);
});

test("it should detect a deletion of a row and its cells", async () => {
	const before = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
	const after = new TextEncoder().encode("Name,Age\nAnna,20");

	const metadata = { unique_column: "Name" };

	const detectedChanges = await detectChanges?.({
		before: { id: "random", path: "x.csv", data: before, metadata },
		after: { id: "random", path: "x.csv", data: after, metadata },
	});

	expect(detectedChanges).toStrictEqual([
		{ entity_id: "Name|Peter", schema: RowSchema, snapshot: undefined },
		{ entity_id: "Name|Peter|Name", schema: CellSchema, snapshot: undefined },
		{ entity_id: "Name|Peter|Age", schema: CellSchema, snapshot: undefined },
	] satisfies DetectedChange<typeof CellSchema | typeof RowSchema>[]);
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
test("changing the unique column should lead to a new cell entity_ids to avoid bugs", async () => {
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
			{ entity_id: "Name|Anna|Name", schema: CellSchema, snapshot: undefined },
			{ entity_id: "Name|Anna|Age", schema: CellSchema, snapshot: undefined },
			{ entity_id: "Name|Peter|Name", schema: CellSchema, snapshot: undefined },
			{ entity_id: "Name|Peter|Age", schema: CellSchema, snapshot: undefined },
			// detect the insertion of the new unique column

			{
				entity_id: "Age|50|Name",
				schema: CellSchema,
				snapshot: { text: "Peter" },
			},
			{ entity_id: "Age|50|Age", schema: CellSchema, snapshot: { text: "50" } },

			{
				entity_id: "Age|20|Name",
				schema: CellSchema,
				snapshot: { text: "Anna" },
			},
			{ entity_id: "Age|20|Age", schema: CellSchema, snapshot: { text: "20" } },
		] satisfies DetectedChange<typeof CellSchema>[]),
	);
});

// 1. if the entity id would remain identical, the change graph would be messed up
// 2. if no new changes are reported after a column change, the initial state
//    is not tracked
test("changing the header order should result in a change", async () => {
	const before = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
	const after = new TextEncoder().encode("Age,Name\n20,Anna\n50,Peter");

	const meta = { unique_column: "Name" };

	const detectedChanges = await detectChanges?.({
		before: { id: "random", path: "x.csv", data: before, metadata: meta },
		after: { id: "random", path: "x.csv", data: after, metadata: meta },
	});

	expect(detectedChanges).toEqual([
		{
			entity_id: "header",
			schema: HeaderSchema,
			snapshot: {
				columnNames: ["Age", "Name"],
			},
		},
	] satisfies DetectedChange<typeof HeaderSchema>[]);
});

test("row order changes should be detected", async () => {
	// the row `Anna,20` is moved to the end
	// while `Peter,50` is moved to the beginning
	const before = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
	const after = new TextEncoder().encode("Name,Age\nPeter,50\nAnna,20");

	const meta = { unique_column: "Name" };

	const detectedChanges = await detectChanges?.({
		before: { id: "random", path: "x.csv", data: before, metadata: meta },
		after: { id: "random", path: "x.csv", data: after, metadata: meta },
	});

	expect(detectedChanges).toEqual([
		{
			entity_id: "Name|Anna",
			schema: RowSchema,
			snapshot: { lineNumber: 1 },
		},
		{
			entity_id: "Name|Peter",
			schema: RowSchema,
			snapshot: { lineNumber: 0 },
		},
	] satisfies DetectedChange<typeof RowSchema>[]);
});
