import { expect, test } from "vitest";
import { detectChanges } from "./detectChanges.js";
import { type DetectedChange, type FromLixSchemaDefinition } from "@lix-js/sdk";
import { CellSchemaV1 } from "./schemas/cell.js";
import { HeaderSchemaV1 } from "./schemas/header.js";
import { RowSchemaV1 } from "./schemas/row.js";

test("it should not detect changes if the csv did not update", async () => {
	const before = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
	// same file
	const after = before;

	const metadata = { unique_column: "Name" };

	const detectedChanges = detectChanges?.({
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

	const detectedChanges = detectChanges?.({
		before: { id: "random", path: "x.csv", data: before, metadata },
		after: { id: "random", path: "x.csv", data: after, metadata },
	});

	expect(detectedChanges).toStrictEqual([
		{
			entity_id: "Name|John",
			schema: RowSchemaV1,
			snapshot_content: { lineNumber: 2 },
		},
		{
			entity_id: "Name|John|Name",
			schema: CellSchemaV1,
			snapshot_content: { text: "John", rowId: "Name|John" },
		},
		{
			entity_id: "Name|John|Age",
			schema: CellSchemaV1,
			snapshot_content: { text: "30", rowId: "Name|John" },
		},
	] satisfies DetectedChange<
		FromLixSchemaDefinition<typeof CellSchemaV1 | typeof RowSchemaV1>
	>[]);
});

test("it should detect updates", async () => {
	const before = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
	const after = new TextEncoder().encode("Name,Age\nAnna,21\nPeter,50");

	const metadata = { unique_column: "Name" };

	const detectedChanges = detectChanges?.({
		before: { id: "mock", path: "x.csv", data: before, metadata },
		after: { id: "mock", path: "x.csv", data: after, metadata },
	});

	expect(detectedChanges).toEqual([
		{
			schema: CellSchemaV1,
			entity_id: "Name|Anna|Age",
			snapshot_content: { text: "21", rowId: "Name|Anna" },
		},
	] satisfies DetectedChange<FromLixSchemaDefinition<typeof CellSchemaV1>>[]);
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
		{
			entity_id: "Name|Peter",
			schema: RowSchemaV1,
			snapshot_content: null,
		},
		{
			entity_id: "Name|Peter|Name",
			schema: CellSchemaV1,
			snapshot_content: null,
		},
		{
			entity_id: "Name|Peter|Age",
			schema: CellSchemaV1,
			snapshot_content: null,
		},
	] satisfies DetectedChange<
		FromLixSchemaDefinition<typeof CellSchemaV1 | typeof RowSchemaV1>
	>[]);
});

// throwing an error leads to abysmal UX on potentially every save
// of a csv file in lix. It's better to just ignore the change
// and let an app or user define the unique column later.
test("it should return [] if the unique column is not set", async () => {
	const before = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
	const after = before;

	const metadata = { unique_column: undefined };

	const detectedChanges = detectChanges({
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

	const detectedChanges = detectChanges?.({
		before: { id: "random", path: "x.csv", data: before, metadata: metaBefore },
		after: { id: "random", path: "x.csv", data: after, metadata: metaAfter },
	});

	expect(detectedChanges).toEqual(
		expect.arrayContaining([
			// detect the deletion of the old unique column
			{
				entity_id: "Name|Anna|Name",
				schema: CellSchemaV1,
				snapshot_content: null,
			},
			{
				entity_id: "Name|Anna|Age",
				schema: CellSchemaV1,
				snapshot_content: null,
			},
			{
				entity_id: "Name|Peter|Name",
				schema: CellSchemaV1,
				snapshot_content: null,
			},
			{
				entity_id: "Name|Peter|Age",
				schema: CellSchemaV1,
				snapshot_content: null,
			},
			// detect the insertion of the new unique column

			{
				entity_id: "Age|50|Name",
				schema: CellSchemaV1,
				snapshot_content: { text: "Peter", rowId: "Age|50" },
			},
			{
				entity_id: "Age|50|Age",
				schema: CellSchemaV1,
				snapshot_content: { text: "50", rowId: "Age|50" },
			},

			{
				entity_id: "Age|20|Name",
				schema: CellSchemaV1,
				snapshot_content: { text: "Anna", rowId: "Age|20" },
			},
			{
				entity_id: "Age|20|Age",
				schema: CellSchemaV1,
				snapshot_content: { text: "20", rowId: "Age|20" },
			},
		] satisfies DetectedChange<FromLixSchemaDefinition<typeof CellSchemaV1>>[]),
	);
});

// 1. if the entity id would remain identical, the change graph would be messed up
// 2. if no new changes are reported after a column change, the initial state
//    is not tracked
test("changing the header order should result in a change", async () => {
	const before = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
	const after = new TextEncoder().encode("Age,Name\n20,Anna\n50,Peter");

	const meta = { unique_column: "Name" };

	const detectedChanges = detectChanges?.({
		before: { id: "random", path: "x.csv", data: before, metadata: meta },
		after: { id: "random", path: "x.csv", data: after, metadata: meta },
	});

	expect(detectedChanges).toEqual([
		{
			entity_id: "header",
			schema: HeaderSchemaV1,
			snapshot_content: {
				columnNames: ["Age", "Name"],
			},
		},
	] satisfies DetectedChange<FromLixSchemaDefinition<typeof HeaderSchemaV1>>[]);
});

test("row order changes should be detected", async () => {
	// the row `Anna,20` is moved to the end
	// while `Peter,50` is moved to the beginning
	const before = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
	const after = new TextEncoder().encode("Name,Age\nPeter,50\nAnna,20");

	const meta = { unique_column: "Name" };

	const detectedChanges = detectChanges?.({
		before: { id: "random", path: "x.csv", data: before, metadata: meta },
		after: { id: "random", path: "x.csv", data: after, metadata: meta },
	});

	expect(detectedChanges).toEqual([
		{
			entity_id: "Name|Anna",
			schema: RowSchemaV1,
			snapshot_content: { lineNumber: 1 },
		},
		{
			entity_id: "Name|Peter",
			schema: RowSchemaV1,
			snapshot_content: { lineNumber: 0 },
		},
	] satisfies DetectedChange<FromLixSchemaDefinition<typeof RowSchemaV1>>[]);
});

test("it detects the header entity", async () => {
	const before = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
	const after = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");

	const metadata = { unique_column: "Name" };

	const detectedChanges = detectChanges?.({
		before: { id: "random", path: "x.csv", data: before, metadata: null },
		after: { id: "random", path: "x.csv", data: after, metadata },
	});

	const header = detectedChanges.find(
		(c) => c.entity_id === "header",
	)?.snapshot_content;

	expect(header?.columnNames).toEqual(["Name", "Age"]);
});
