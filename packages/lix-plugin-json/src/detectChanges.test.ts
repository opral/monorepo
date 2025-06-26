import { expect, test } from "vitest";
import { detectChanges } from "./detectChanges.js";
import { type FromLixSchemaDefinition, type DetectedChange } from "@lix-js/sdk";
import { JSONPropertySchema } from "./schemas/JSONPropertySchema.js";

test("it should not detect changes if the json did not update", async () => {
	const before = new TextEncoder().encode(
		JSON.stringify({
			Name: "Anna",
			Age: 20,
		}),
	);
	// same file
	const after = before;

	const detectedChanges = detectChanges?.({
		before: { id: "random", path: "x.json", data: before, metadata: {} },
		after: { id: "random", path: "x.json", data: after, metadata: {} },
	});
	expect(detectedChanges).toEqual([]);
});

test("it should detect a new property on root level", async () => {
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

	const detectedChanges = detectChanges?.({
		before: { id: "random", path: "x.json", data: before, metadata: {} },
		after: { id: "random", path: "x.json", data: after, metadata: {} },
	});

	expect(detectedChanges).toStrictEqual([
		{
			entity_id: "City",
			schema: JSONPropertySchema,
			snapshot_content: {
				property: "City",
				value: "New York",
			},
		},
	] satisfies DetectedChange<
		FromLixSchemaDefinition<typeof JSONPropertySchema>
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

	const detectedChanges = detectChanges?.({
		before: { id: "random", path: "x.json", data: before, metadata: {} },
		after: { id: "random", path: "x.json", data: after, metadata: {} },
	});

	expect(detectedChanges).toStrictEqual([
		{
			entity_id: "level1.newProp",
			schema: JSONPropertySchema,
			snapshot_content: {
				property: "level1.newProp",
				value: "level1.newProp",
			},
		},
		{
			entity_id: "level1.level2.newProp",

			schema: JSONPropertySchema,
			snapshot_content: {
				property: "level1.level2.newProp",
				value: "level1.level2.newProp",
			},
		},
		{
			entity_id: "level1.level2.level3.newProp",
			schema: JSONPropertySchema,
			snapshot_content: {
				property: "level1.level2.level3.newProp",
				value: "level1.level2.level3.newProp",
			},
		},
	] satisfies DetectedChange<
		FromLixSchemaDefinition<typeof JSONPropertySchema>
	>[]);
});

test("it should detect a new property containing an array on root level", async () => {
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

	const detectedChanges = detectChanges?.({
		before: { id: "random", path: "x.json", data: before, metadata: {} },
		after: { id: "random", path: "x.json", data: after, metadata: {} },
	});

	expect(detectedChanges).toStrictEqual([
		{
			entity_id: "array",
			schema: JSONPropertySchema,
			snapshot_content: {
				property: "array",
				value: [1, 2, 3],
			},
		},
	] satisfies DetectedChange<
		FromLixSchemaDefinition<typeof JSONPropertySchema>
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

	const detectedChanges = detectChanges?.({
		before: { id: "random", path: "x.json", data: before, metadata: {} },
		after: { id: "random", path: "x.json", data: after, metadata: {} },
	});

	expect(detectedChanges).toStrictEqual([
		{
			entity_id: "level1.prop",
			schema: JSONPropertySchema,
			snapshot_content: {
				property: "level1.prop",
				value: ["level1", 2, 3],
			},
		},
		{
			entity_id: "level1.level2.prop",
			schema: JSONPropertySchema,
			snapshot_content: {
				property: "level1.level2.prop",
				value: ["level2", 2, 3],
			},
		},
		{
			entity_id: "level1.level2.level3.prop",
			schema: JSONPropertySchema,
			snapshot_content: {
				property: "level1.level2.level3.prop",
				value: ["level3", 2, 3],
			},
		},
	] satisfies DetectedChange<
		FromLixSchemaDefinition<typeof JSONPropertySchema>
	>[]);
});

test("it should detect an updated property on root level", async () => {
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

	const detectedChanges = detectChanges?.({
		before: { id: "random", path: "x.json", data: before, metadata: {} },
		after: { id: "random", path: "x.json", data: after, metadata: {} },
	});

	expect(detectedChanges).toStrictEqual([
		{
			entity_id: "City",
			schema: JSONPropertySchema,
			snapshot_content: {
				property: "City",
				value: "New York",
			},
		},
	] satisfies DetectedChange<
		FromLixSchemaDefinition<typeof JSONPropertySchema>
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

	const detectedChanges = await detectChanges?.({
		before: { id: "random", path: "x.json", data: before, metadata: {} },
		after: { id: "random", path: "x.json", data: after, metadata: {} },
	});

	expect(detectedChanges).toStrictEqual([
		{
			entity_id: "level1.prop",
			schema: JSONPropertySchema,
			snapshot_content: null,
		},
		{
			entity_id: "level1.level2.prop",
			schema: JSONPropertySchema,
			snapshot_content: null,
		},
		{
			entity_id: "level1.level2.level3.prop",
			schema: JSONPropertySchema,
			snapshot_content: null,
		},
		{
			entity_id: "level1.newProp",
			schema: JSONPropertySchema,
			snapshot_content: {
				property: "level1.newProp",
				value: "level1.newProp",
			},
		},
		{
			entity_id: "level1.level2.newProp",
			schema: JSONPropertySchema,
			snapshot_content: {
				property: "level1.level2.newProp",
				value: "level1.level2.newProp",
			},
		},
		{
			entity_id: "level1.level2.level3.newProp",
			schema: JSONPropertySchema,
			snapshot_content: {
				property: "level1.level2.level3.newProp",
				value: "level1.level2.level3.newProp",
			},
		},
	] satisfies DetectedChange<
		FromLixSchemaDefinition<typeof JSONPropertySchema>
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

// 	const detectedChanges = await detectChanges?.({
// 		lix,
// 		before: { id: "mock", path: "x.json", data: before },
// 		after: { id: "mock", path: "x.json", data: after },
// 	});

// 	expect(detectedChanges).toEqual([
// 		{
// 			schema: JSONPropertySchema,
// 			entity_id: "Age",
// 			snapshot: 21,
// 		},
// 	] satisfies DetectedChange<typeof JSONPropertySchema>[]);
// });

// test("it should detect a deletion of a property", async () => {
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

// 	const detectedChanges = await detectChanges?.({
// 		lix,
// 		before: { id: "random", path: "x.json", data: before },
// 		after: { id: "random", path: "x.json", data: after },
// 	});

// 	expect(detectedChanges).toStrictEqual([
// 		{ entity_id: "Age", schema: JSONPropertySchema, snapshot: undefined },
// 	] satisfies DetectedChange<typeof JSONPropertySchema>[]);
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

// 	const detectedChanges = await detectChanges?.({
// 		lix,
// 		before: { id: "random", path: "x.json", data: before },
// 		after: { id: "random", path: "x.json", data: after },
// 	});

// 	expect(detectedChanges).toEqual([
// 		{
// 			entity_id: "Age",
// 			schema: JSONPropertySchema,
// 			snapshot: 21,
// 		},
// 		{
// 			entity_id: "City",
// 			schema: JSONPropertySchema,
// 			snapshot: undefined,
// 		},
// 		{
// 			entity_id: "Country",
// 			schema: JSONPropertySchema,
// 			snapshot: "USA",
// 		},
// 	] satisfies DetectedChange<typeof JSONPropertySchema>[]);
// });
