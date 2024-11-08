import { expect, test } from "vitest";
import {
	detectChanges,
	type DetectedCellChange,
	type DetectedRowChange,
	type DetectedSchemaDefinitionChange,
} from "./detectChanges.js";

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
			entity_id: "Name|John",
			type: "csv-v2-row",
			snapshot: {
				rowIndex: 2,
				rowEntities: ["Name|John|Name", "Name|John|Age"].sort(),
			},
		},
		{
			entity_id: "Name|John|Name",
			type: "csv-v2-cell",
			snapshot: { text: "John" },
		},
		{
			entity_id: "Name|John|Age",
			type: "csv-v2-cell",
			snapshot: { text: "30" },
		},
	] satisfies (DetectedRowChange | DetectedCellChange)[]);
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
			type: "csv-v2-cell",
			entity_id: "Name|Anna|Age",
			snapshot: { text: "21" },
		},
	] satisfies (DetectedRowChange | DetectedCellChange)[]);
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
		{
			entity_id: "Name|Peter",
			type: "csv-v2-row",
			snapshot: null,
		},
		{ entity_id: "Name|Peter|Name", type: "csv-v2-cell", snapshot: null },
		{ entity_id: "Name|Peter|Age", type: "csv-v2-cell", snapshot: null },
	] satisfies (DetectedRowChange | DetectedCellChange)[]);
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
			// detect the deletion of old rows
			{ entity_id: "Name|Anna", type: "csv-v2-row", snapshot: null },
			{ entity_id: "Name|Peter", type: "csv-v2-row", snapshot: null },

			// detect the insertion of the new unique column
			{
				entity_id: "Age|20",
				type: "csv-v2-row",
				snapshot: {
					rowIndex: 0,
					rowEntities: ["Age|20|Age", "Age|20|Name"].sort(),
				},
			},
			{
				entity_id: "Age|50",
				type: "csv-v2-row",
				snapshot: {
					rowIndex: 1,
					rowEntities: ["Age|50|Age", "Age|50|Name"].sort(),
				},
			},
			// detect the deletion of the old unique column
			{ entity_id: "Name|Anna|Name", type: "csv-v2-cell", snapshot: null },
			{ entity_id: "Name|Anna|Age", type: "csv-v2-cell", snapshot: null },
			{
				entity_id: "Name|Peter|Name",
				type: "csv-v2-cell",
				snapshot: null,
			},
			{ entity_id: "Name|Peter|Age", type: "csv-v2-cell", snapshot: null },

			{
				entity_id: "Age|50|Name",
				type: "csv-v2-cell",
				snapshot: { text: "Peter" },
			},
			{
				entity_id: "Age|50|Age",
				type: "csv-v2-cell",
				snapshot: { text: "50" },
			},

			{
				entity_id: "Age|20|Name",
				type: "csv-v2-cell",
				snapshot: { text: "Anna" },
			},
			{
				entity_id: "Age|20|Age",
				type: "csv-v2-cell",
				snapshot: { text: "20" },
			},
		] satisfies (DetectedRowChange | DetectedCellChange)[]),
	);
});

// 1. if the entity id would remain identical, the change graph would be messed up
// 2. if no new changes are reported after a column change, the initial state
//    is not tracked
test("changing the column order should just result in a schame change", async () => {
	const before = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
	const after = new TextEncoder().encode("Age,Name\n20,Anna\n50,Peter");

	const meta = { unique_column: "Name" };

	const detectedChanges = await detectChanges?.({
		before: { id: "random", path: "x.csv", data: before, metadata: meta },
		after: { id: "random", path: "x.csv", data: after, metadata: meta },
	});

	expect(detectedChanges).toEqual([
		{
			entity_id: "schema",
			type: "csv-v2-schema",
			snapshot: {
				columnNames: ["Age", "Name"],
			},
		},
	] satisfies (
		| DetectedRowChange
		| DetectedCellChange
		| DetectedSchemaDefinitionChange
	)[]);
});

test("changing the row order should just result in a row change", async () => {
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
			type: "csv-v2-row",
			snapshot: {
				rowIndex: 1,
				rowEntities: ["Name|Anna|Name", "Name|Anna|Age"].sort(),
			},
		},
		{
			entity_id: "Name|Peter",
			type: "csv-v2-row",
			snapshot: {
				rowIndex: 0,
				rowEntities: ["Name|Peter|Name", "Name|Peter|Age"].sort(),
			},
		},
	] satisfies (DetectedRowChange | DetectedCellChange)[]);
});