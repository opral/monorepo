import { expect, test } from "vitest";
import { detectChanges } from "./detectChanges.js";

import { loadProjectInMemory } from "../project/loadProjectInMemory.js";
import { newProject } from "../project/newProject.js";
import { contentFromDatabase } from "sqlite-wasm-kysely";

test("it should not detect changes if the database did not update", async () => {
	const project = await loadProjectInMemory({ blob: await newProject() });

	const detectedChanges = await detectChanges?.({
		lix: project.lix,
		before: {
			id: "random",
			path: "db.sqlite",
			data: contentFromDatabase(project._sqlite),
			metadata: {},
		},
		after: {
			id: "random",
			path: "db.sqlite",
			data: contentFromDatabase(project._sqlite),
			metadata: {},
		},
	});
	expect(detectedChanges).toEqual([]);
});

test("it should detect a new bundle", async () => {
	const projectBefore = await loadProjectInMemory({ blob: await newProject() });
	const projectAfter = await loadProjectInMemory({ blob: await newProject() });

	await projectAfter.db
		.insertInto("bundle")
		.values({
			id: "1",
			declarations: [],
		})
		.execute();

	const detectedChanges = await detectChanges?.({
		lix: projectBefore.lix,
		before: {
			id: "random",
			path: "db.sqlite",
			data: contentFromDatabase(projectBefore._sqlite),
			metadata: {},
		},
		after: {
			id: "random",
			path: "db.sqlite",
			data: contentFromDatabase(projectAfter._sqlite),
			metadata: {},
		},
	});
	expect(detectedChanges).toEqual([{
		"entity_id": "1",
		"schema": {
		  "key": "lix_plugin_inlang_bundle",
		  "schema": {
			"additionalProperties": true,
			"properties": {
			  "id": {
				"type": "string",
			  },
			},
			"required": [
			  "id",
			],
			"type": "object",
		  },
		  "type": "json",
		},
		"snapshot": {
		  "declarations": [],
		  "id": "1",
		},
	  },]);

	// expect(detectedChanges).toStrictEqual([
	// 	{
	// 		entity_id: "Name|John",
	// 		schema: RowSchemaV1,
	// 		snapshot: { lineNumber: 2 },
	// 	},
	// 	{
	// 		entity_id: "Name|John|Name",
	// 		schema: CellSchemaV1,
	// 		snapshot: { text: "John", rowId: "Name|John" },
	// 	},
	// 	{
	// 		entity_id: "Name|John|Age",
	// 		schema: CellSchemaV1,
	// 		snapshot: { text: "30", rowId: "Name|John" },
	// 	},
	// ] satisfies DetectedChange<typeof CellSchemaV1 | typeof RowSchemaV1>[]);
});

// test("it should detect updates", async () => {
// 	const lix = await openLixInMemory({});

// 	const before = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
// 	const after = new TextEncoder().encode("Name,Age\nAnna,21\nPeter,50");

// 	const metadata = { unique_column: "Name" };

// 	const detectedChanges = await detectChanges?.({
// 		lix,
// 		before: { id: "mock", path: "x.csv", data: before, metadata },
// 		after: { id: "mock", path: "x.csv", data: after, metadata },
// 	});

// 	expect(detectedChanges).toEqual([
// 		{
// 			schema: CellSchemaV1,
// 			entity_id: "Name|Anna|Age",
// 			snapshot: { text: "21", rowId: "Name|Anna" },
// 		},
// 	] satisfies DetectedChange<typeof CellSchemaV1>[]);
// });

// test("it should detect a deletion of a row and its cells", async () => {
// 	const lix = await openLixInMemory({});
// 	const before = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
// 	const after = new TextEncoder().encode("Name,Age\nAnna,20");

// 	const metadata = { unique_column: "Name" };

// 	const detectedChanges = await detectChanges?.({
// 		lix,
// 		before: { id: "random", path: "x.csv", data: before, metadata },
// 		after: { id: "random", path: "x.csv", data: after, metadata },
// 	});

// 	expect(detectedChanges).toStrictEqual([
// 		{ entity_id: "Name|Peter", schema: RowSchemaV1, snapshot: undefined },
// 		{ entity_id: "Name|Peter|Name", schema: CellSchemaV1, snapshot: undefined },
// 		{ entity_id: "Name|Peter|Age", schema: CellSchemaV1, snapshot: undefined },
// 	] satisfies DetectedChange<typeof CellSchemaV1 | typeof RowSchemaV1>[]);
// });

// // throwing an error leads to abysmal UX on potentially every save
// // of a csv file in lix. It's better to just ignore the change
// // and let an app or user define the unique column later.
// test("it should return [] if the unique column is not set", async () => {
// 	const lix = await openLixInMemory({});

// 	const before = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
// 	const after = before;

// 	const metadata = { unique_column: undefined };

// 	const detectedChanges = await detectChanges({
// 		lix,
// 		before: { id: "random", path: "x.csv", data: before, metadata },
// 		after: { id: "random", path: "x.csv", data: after, metadata },
// 	});

// 	expect(detectedChanges).toEqual([]);
// });

// // 1. if the entity id would remain identical, the change graph would be messed up
// // 2. if no new changes are reported after a column change, the initial state
// //    is not tracked
// test("changing the unique column should lead to a new cell entity_ids to avoid bugs", async () => {
// 	const lix = await openLixInMemory({});

// 	const before = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
// 	const after = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");

// 	const metaBefore = { unique_column: "Name" };
// 	const metaAfter = { unique_column: "Age" };

// 	const detectedChanges = await detectChanges?.({
// 		lix,
// 		before: { id: "random", path: "x.csv", data: before, metadata: metaBefore },
// 		after: { id: "random", path: "x.csv", data: after, metadata: metaAfter },
// 	});

// 	expect(detectedChanges).toEqual(
// 		expect.arrayContaining([
// 			// detect the deletion of the old unique column
// 			{
// 				entity_id: "Name|Anna|Name",
// 				schema: CellSchemaV1,
// 				snapshot: undefined,
// 			},
// 			{ entity_id: "Name|Anna|Age", schema: CellSchemaV1, snapshot: undefined },
// 			{
// 				entity_id: "Name|Peter|Name",
// 				schema: CellSchemaV1,
// 				snapshot: undefined,
// 			},
// 			{
// 				entity_id: "Name|Peter|Age",
// 				schema: CellSchemaV1,
// 				snapshot: undefined,
// 			},
// 			// detect the insertion of the new unique column

// 			{
// 				entity_id: "Age|50|Name",
// 				schema: CellSchemaV1,
// 				snapshot: { text: "Peter", rowId: "Age|50" },
// 			},
// 			{
// 				entity_id: "Age|50|Age",
// 				schema: CellSchemaV1,
// 				snapshot: { text: "50", rowId: "Age|50" },
// 			},

// 			{
// 				entity_id: "Age|20|Name",
// 				schema: CellSchemaV1,
// 				snapshot: { text: "Anna", rowId: "Age|20" },
// 			},
// 			{
// 				entity_id: "Age|20|Age",
// 				schema: CellSchemaV1,
// 				snapshot: { text: "20", rowId: "Age|20" },
// 			},
// 		] satisfies DetectedChange<typeof CellSchemaV1>[])
// 	);
// });

// // 1. if the entity id would remain identical, the change graph would be messed up
// // 2. if no new changes are reported after a column change, the initial state
// //    is not tracked
// test("changing the header order should result in a change", async () => {
// 	const lix = await openLixInMemory({});

// 	const before = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
// 	const after = new TextEncoder().encode("Age,Name\n20,Anna\n50,Peter");

// 	const meta = { unique_column: "Name" };

// 	const detectedChanges = await detectChanges?.({
// 		lix,
// 		before: { id: "random", path: "x.csv", data: before, metadata: meta },
// 		after: { id: "random", path: "x.csv", data: after, metadata: meta },
// 	});

// 	expect(detectedChanges).toEqual([
// 		{
// 			entity_id: "header",
// 			schema: HeaderSchemaV1,
// 			snapshot: {
// 				columnNames: ["Age", "Name"],
// 			},
// 		},
// 	] satisfies DetectedChange<typeof HeaderSchemaV1>[]);
// });

// test("row order changes should be detected", async () => {
// 	const lix = await openLixInMemory({});

// 	// the row `Anna,20` is moved to the end
// 	// while `Peter,50` is moved to the beginning
// 	const before = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
// 	const after = new TextEncoder().encode("Name,Age\nPeter,50\nAnna,20");

// 	const meta = { unique_column: "Name" };

// 	const detectedChanges = await detectChanges?.({
// 		lix,
// 		before: { id: "random", path: "x.csv", data: before, metadata: meta },
// 		after: { id: "random", path: "x.csv", data: after, metadata: meta },
// 	});

// 	expect(detectedChanges).toEqual([
// 		{
// 			entity_id: "Name|Anna",
// 			schema: RowSchemaV1,
// 			snapshot: { lineNumber: 1 },
// 		},
// 		{
// 			entity_id: "Name|Peter",
// 			schema: RowSchemaV1,
// 			snapshot: { lineNumber: 0 },
// 		},
// 	] satisfies DetectedChange<typeof RowSchemaV1>[]);
// });

// test("it detects the header entity", async () => {
// 	const lix = await openLixInMemory({});

// 	const before = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");
// 	const after = new TextEncoder().encode("Name,Age\nAnna,20\nPeter,50");

// 	const metadata = { unique_column: "Name" };

// 	const detectedChanges = await detectChanges?.({
// 		lix,
// 		before: { id: "random", path: "x.csv", data: before, metadata: null },
// 		after: { id: "random", path: "x.csv", data: after, metadata },
// 	});

// 	const header = detectedChanges.find((c) => c.entity_id === "header")
// 		?.snapshot as ExperimentalInferType<typeof HeaderSchemaV1> | undefined;

// 	expect(header?.columnNames).toEqual(["Name", "Age"]);
// });
