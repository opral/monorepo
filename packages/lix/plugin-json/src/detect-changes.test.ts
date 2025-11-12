import { expect, test } from "vitest";
import { detectChanges } from "./detect-changes.js";
import {
	type FromLixSchemaDefinition,
	type DetectedChange,
	type LixPlugin,
} from "@lix-js/sdk";
import { JSONPointerValueSchema } from "./schemas/json-pointer-value.js";

type DetectChangesArgs = Parameters<NonNullable<LixPlugin["detectChanges"]>>[0];
type TestFile = (DetectChangesArgs["before"] & DetectChangesArgs["after"]) & {
	lixcol_metadata?: DetectChangesArgs["after"]["metadata"];
};

const noopQuerySync = (() => {
	throw new Error("querySync is not implemented in tests");
}) as DetectChangesArgs["querySync"];

const createDetectFile = ({
	id = "random",
	path = "x.json",
	data,
}: {
	id?: string;
	path?: string;
	data: Uint8Array;
}): TestFile =>
	({
		id,
		path,
		directory_id: null,
		name: path.split("/").pop() ?? "file",
		extension: path.includes(".") ? (path.split(".").pop() ?? "") : null,
		data,
		metadata: {},
		lixcol_metadata: {},
		hidden: false,
		lixcol_inherited_from_version_id: null,
		lixcol_created_at: new Date().toISOString(),
		lixcol_updated_at: new Date().toISOString(),
	}) as TestFile;

const runDetectChanges = ({
	before,
	after,
}: {
	before?: TestFile;
	after: TestFile;
}): ReturnType<NonNullable<LixPlugin["detectChanges"]>> =>
	detectChanges!({
		before: before as DetectChangesArgs["before"],
		after: after as DetectChangesArgs["after"],
		querySync: noopQuerySync,
	});

test("it should not detect changes if the json did not update", async () => {
	const before = new TextEncoder().encode(
		JSON.stringify({
			Name: "Anna",
			Age: 20,
		}),
	);
	// same file
	const after = before;

	const detectedChanges = runDetectChanges({
		before: createDetectFile({ data: before }),
		after: createDetectFile({ data: after }),
	});
	expect(detectedChanges).toEqual([]);
});

test("it should detect a new path on root level", async () => {
	const before = new TextEncoder().encode(
		JSON.stringify({
			Name: "Anna",
			Age: 20,
		}),
	);
	const after = new TextEncoder().encode(
		JSON.stringify({
			Name: "Anna",
			Age: 20,
			City: "New York",
		}),
	);

	const detectedChanges = runDetectChanges({
		before: createDetectFile({ data: before }),
		after: createDetectFile({ data: after }),
	});

	expect(detectedChanges).toStrictEqual([
		{
			entity_id: "/City",
			schema: JSONPointerValueSchema,
			snapshot_content: {
				path: "/City",
				value: "New York",
			},
		},
	] satisfies DetectedChange<
		FromLixSchemaDefinition<typeof JSONPointerValueSchema>
	>[]);
});

test("it should detect a new properties on nested levels", async () => {
	const before = new TextEncoder().encode(
		JSON.stringify({
			Name: "Anna",
			Age: 20,
		}),
	);
	const after = new TextEncoder().encode(
		JSON.stringify({
			Name: "Anna",
			Age: 20,
			level1: {
				newProp: "level1.newProp",
				level2: {
					newProp: "level1.level2.newProp",
					level3: {
						newProp: "level1.level2.level3.newProp",
					},
				},
			},
		}),
	);

	const detectedChanges = runDetectChanges({
		before: createDetectFile({ data: before }),
		after: createDetectFile({ data: after }),
	});

	expect(detectedChanges).toStrictEqual([
		{
			entity_id: "/level1/newProp",
			schema: JSONPointerValueSchema,
			snapshot_content: {
				path: "/level1/newProp",
				value: "level1.newProp",
			},
		},
		{
			entity_id: "/level1/level2/newProp",

			schema: JSONPointerValueSchema,
			snapshot_content: {
				path: "/level1/level2/newProp",
				value: "level1.level2.newProp",
			},
		},
		{
			entity_id: "/level1/level2/level3/newProp",
			schema: JSONPointerValueSchema,
			snapshot_content: {
				path: "/level1/level2/level3/newProp",
				value: "level1.level2.level3.newProp",
			},
		},
	] satisfies DetectedChange<
		FromLixSchemaDefinition<typeof JSONPointerValueSchema>
	>[]);
});

test("it should detect a new path containing an array on root level", async () => {
	const before = new TextEncoder().encode(
		JSON.stringify({
			Name: "Anna",
			Age: 20,
		}),
	);
	const after = new TextEncoder().encode(
		JSON.stringify({
			Name: "Anna",
			Age: 20,
			array: [1, 2, 3],
		}),
	);

	const detectedChanges = runDetectChanges({
		before: createDetectFile({ data: before }),
		after: createDetectFile({ data: after }),
	});

	expect(detectedChanges).toStrictEqual([
		{
			entity_id: "/array/0",
			schema: JSONPointerValueSchema,
			snapshot_content: {
				path: "/array/0",
				value: 1,
			},
		},
		{
			entity_id: "/array/1",
			schema: JSONPointerValueSchema,
			snapshot_content: {
				path: "/array/1",
				value: 2,
			},
		},
		{
			entity_id: "/array/2",
			schema: JSONPointerValueSchema,
			snapshot_content: {
				path: "/array/2",
				value: 3,
			},
		},
	] satisfies DetectedChange<
		FromLixSchemaDefinition<typeof JSONPointerValueSchema>
	>[]);
});

test("it should detect new properties containing an array in nested levels", async () => {
	const before = new TextEncoder().encode(
		JSON.stringify({
			prop: "level0",
		}),
	);
	const after = new TextEncoder().encode(
		JSON.stringify({
			prop: "level0",
			level1: {
				prop: ["level1", 2, 3],
				level2: {
					prop: ["level2", 2, 3],
					level3: {
						prop: ["level3", 2, 3],
					},
				},
			},
		}),
	);

	const detectedChanges = runDetectChanges({
		before: createDetectFile({ data: before }),
		after: createDetectFile({ data: after }),
	});

	expect(detectedChanges).toStrictEqual([
		{
			entity_id: "/level1/prop/0",
			schema: JSONPointerValueSchema,
			snapshot_content: {
				path: "/level1/prop/0",
				value: "level1",
			},
		},
		{
			entity_id: "/level1/prop/1",
			schema: JSONPointerValueSchema,
			snapshot_content: {
				path: "/level1/prop/1",
				value: 2,
			},
		},
		{
			entity_id: "/level1/prop/2",
			schema: JSONPointerValueSchema,
			snapshot_content: {
				path: "/level1/prop/2",
				value: 3,
			},
		},
		{
			entity_id: "/level1/level2/prop/0",
			schema: JSONPointerValueSchema,
			snapshot_content: {
				path: "/level1/level2/prop/0",
				value: "level2",
			},
		},
		{
			entity_id: "/level1/level2/prop/1",
			schema: JSONPointerValueSchema,
			snapshot_content: {
				path: "/level1/level2/prop/1",
				value: 2,
			},
		},
		{
			entity_id: "/level1/level2/prop/2",
			schema: JSONPointerValueSchema,
			snapshot_content: {
				path: "/level1/level2/prop/2",
				value: 3,
			},
		},
		{
			entity_id: "/level1/level2/level3/prop/0",
			schema: JSONPointerValueSchema,
			snapshot_content: {
				path: "/level1/level2/level3/prop/0",
				value: "level3",
			},
		},
		{
			entity_id: "/level1/level2/level3/prop/1",
			schema: JSONPointerValueSchema,
			snapshot_content: {
				path: "/level1/level2/level3/prop/1",
				value: 2,
			},
		},
		{
			entity_id: "/level1/level2/level3/prop/2",
			schema: JSONPointerValueSchema,
			snapshot_content: {
				path: "/level1/level2/level3/prop/2",
				value: 3,
			},
		},
	] satisfies DetectedChange<
		FromLixSchemaDefinition<typeof JSONPointerValueSchema>
	>[]);
});

test("it should detect updates and deletions inside arrays", async () => {
	const before = new TextEncoder().encode(
		JSON.stringify({
			list: ["a", "b", "c"],
		}),
	);
	const after = new TextEncoder().encode(
		JSON.stringify({
			list: ["a", "x"],
		}),
	);

	const detectedChanges = runDetectChanges({
		before: createDetectFile({ data: before }),
		after: createDetectFile({ data: after }),
	});

	expect(detectedChanges).toStrictEqual([
		{
			entity_id: "/list/1",
			schema: JSONPointerValueSchema,
			snapshot_content: {
				path: "/list/1",
				value: "x",
			},
		},
		{
			entity_id: "/list/2",
			schema: JSONPointerValueSchema,
			snapshot_content: null,
		},
	] satisfies DetectedChange<
		FromLixSchemaDefinition<typeof JSONPointerValueSchema>
	>[]);
});

test("it should detect nested updates inside arrays", async () => {
	const before = new TextEncoder().encode(
		JSON.stringify({
			items: [
				{
					name: "foo",
				},
			],
		}),
	);
	const after = new TextEncoder().encode(
		JSON.stringify({
			items: [
				{
					name: "foo",
					value: 1,
				},
			],
		}),
	);

	const detectedChanges = runDetectChanges({
		before: createDetectFile({ data: before }),
		after: createDetectFile({ data: after }),
	});

	expect(detectedChanges).toStrictEqual([
		{
			entity_id: "/items/0/value",
			schema: JSONPointerValueSchema,
			snapshot_content: {
				path: "/items/0/value",
				value: 1,
			},
		},
	] satisfies DetectedChange<
		FromLixSchemaDefinition<typeof JSONPointerValueSchema>
	>[]);
});

test("it should detect an updated path on root level", async () => {
	const before = new TextEncoder().encode(
		JSON.stringify({
			Name: "Samuel",
			City: "Berlin",
		}),
	);
	const after = new TextEncoder().encode(
		JSON.stringify({
			Name: "Samuel",
			City: "New York",
		}),
	);

	const detectedChanges = runDetectChanges({
		before: createDetectFile({ data: before }),
		after: createDetectFile({ data: after }),
	});

	expect(detectedChanges).toStrictEqual([
		{
			entity_id: "/City",
			schema: JSONPointerValueSchema,
			snapshot_content: {
				path: "/City",
				value: "New York",
			},
		},
	] satisfies DetectedChange<
		FromLixSchemaDefinition<typeof JSONPointerValueSchema>
	>[]);
});

test("it should detect updated properties on nested levels", async () => {
	const before = new TextEncoder().encode(
		JSON.stringify({
			prop: "prop",
			level1: {
				prop: "level1.prop",
				level2: {
					prop: "level1.level2.prop",
					level3: {
						prop: "level1.level2.level3.prop",
					},
				},
			},
		}),
	);

	const after = new TextEncoder().encode(
		JSON.stringify({
			prop: "prop",
			level1: {
				newProp: "level1.newProp",
				level2: {
					newProp: "level1.level2.newProp",
					level3: {
						newProp: "level1.level2.level3.newProp",
					},
				},
			},
		}),
	);

	const detectedChanges = await runDetectChanges({
		before: createDetectFile({ data: before }),
		after: createDetectFile({ data: after }),
	});

	expect(detectedChanges).toStrictEqual([
		{
			entity_id: "/level1/prop",
			schema: JSONPointerValueSchema,
			snapshot_content: null,
		},
		{
			entity_id: "/level1/level2/prop",
			schema: JSONPointerValueSchema,
			snapshot_content: null,
		},
		{
			entity_id: "/level1/level2/level3/prop",
			schema: JSONPointerValueSchema,
			snapshot_content: null,
		},
		{
			entity_id: "/level1/level2/level3/newProp",
			schema: JSONPointerValueSchema,
			snapshot_content: {
				path: "/level1/level2/level3/newProp",
				value: "level1.level2.level3.newProp",
			},
		},
		{
			entity_id: "/level1/level2/newProp",
			schema: JSONPointerValueSchema,
			snapshot_content: {
				path: "/level1/level2/newProp",
				value: "level1.level2.newProp",
			},
		},
		{
			entity_id: "/level1/newProp",
			schema: JSONPointerValueSchema,
			snapshot_content: {
				path: "/level1/newProp",
				value: "level1.newProp",
			},
		},
	] satisfies DetectedChange<
		FromLixSchemaDefinition<typeof JSONPointerValueSchema>
	>[]);
});

// test("it should detect updates", async () => {
// 	const lix = await openLix({});

// 	const before = new TextEncoder().encode(
// 		JSON.stringify({
// 			Name: "Anna",
// 			Age: 20,
// 		}),
// 	);
// 	const after = new TextEncoder().encode(
// 		JSON.stringify({
// 			Name: "Anna",
// 			Age: 21,
// 		}),
// 	);

// 	const detectedChanges = await runDetectChanges({
// 		lix,
// 		before: { id: "mock", path: "x.json", data: before },
// 		after: { id: "mock", path: "x.json", data: after },
// 	});

// 	expect(detectedChanges).toEqual([
// 		{
// 			schema: JSONPointerValueSchema,
// 			entity_id: "/Age",
// 			snapshot: 21,
// 		},
// 	] satisfies DetectedChange<typeof JSONPointerValueSchema>[]);
// });

// test("it should detect a deletion of a path", async () => {
// 	const lix = await openLix({});
// 	const before = new TextEncoder().encode(
// 		JSON.stringify({
// 			Name: "Anna",
// 			Age: 20,
// 		}),
// 	);
// 	const after = new TextEncoder().encode(
// 		JSON.stringify({
// 			Name: "Anna",
// 		}),
// 	);

// 	const detectedChanges = await runDetectChanges({
// 		lix,
// 		before: { id: "random", path: "x.json", data: before },
// 		after: { id: "random", path: "x.json", data: after },
// 	});

// 	expect(detectedChanges).toStrictEqual([
// 		{ entity_id: "/Age", schema: JSONPointerValueSchema, snapshot: undefined },
// 	] satisfies DetectedChange<typeof JSONPointerValueSchema>[]);
// });

// test("it should return [] if both before and after are empty", async () => {
// 	const lix = await openLix({});

// 	const before = new TextEncoder().encode(JSON.stringify({}));
// 	const after = before;

// 	const detectedChanges = await detectChanges({
// 		lix,
// 		before: { id: "random", path: "x.json", data: before },
// 		after: { id: "random", path: "x.json", data: after },
// 	});

// 	expect(detectedChanges).toEqual([]);
// });

// test("it should detect multiple changes", async () => {
// 	const lix = await openLix({});

// 	const before = new TextEncoder().encode(
// 		JSON.stringify({
// 			Name: "Anna",
// 			Age: 20,
// 			City: "New York",
// 		}),
// 	);
// 	const after = new TextEncoder().encode(
// 		JSON.stringify({
// 			Name: "Anna",
// 			Age: 21,
// 			Country: "USA",
// 		}),
// 	);

// 	const detectedChanges = await runDetectChanges({
// 		lix,
// 		before: { id: "random", path: "x.json", data: before },
// 		after: { id: "random", path: "x.json", data: after },
// 	});

// 	expect(detectedChanges).toEqual([
// 		{
// 			entity_id: "/Age",
// 			schema: JSONPointerValueSchema,
// 			snapshot: 21,
// 		},
// 		{
// 			entity_id: "/City",
// 			schema: JSONPointerValueSchema,
// 			snapshot: undefined,
// 		},
// 		{
// 			entity_id: "Country",
// 			schema: JSONPointerValueSchema,
// 			snapshot: "USA",
// 		},
// 	] satisfies DetectedChange<typeof JSONPointerValueSchema>[]);
// });
