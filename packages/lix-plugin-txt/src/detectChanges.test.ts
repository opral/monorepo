import { expect, test } from "vitest";
import { detectChanges } from "./detectChanges.js";
import { openLixInMemory } from "@lix-js/sdk";

const encode = (text: string) => new TextEncoder().encode(text);

test("it should not detect changes if the text file did not update", async () => {
	const lix = await openLixInMemory({});
	const before = encode(`LINE 1
LINE 2
LINE 3`);
	const after = before;

	const detectedChanges = await detectChanges({
		lix,
		before: { id: "random", path: "x.md", data: before, metadata: {} },
		after: { id: "random", path: "x.md", data: after, metadata: {} },
	});

	expect(detectedChanges).toEqual([]);
});

test("it should detect an update if a line was added", async () => {
	const lix = await openLixInMemory({});
	const before = encode(`LINE 1
LINE 2
LINE 3`);
	const after = encode(`LINE 1
LINE 2
LINE 4
LINE 3`);

	const detectedChanges = await detectChanges({
		lix,
		before: { id: "random", path: "x.md", data: before, metadata: {} },
		after: { id: "random", path: "x.md", data: after, metadata: {} },
	});

	expect(detectedChanges).toStrictEqual([
		{
			schema: {
				key: "lix_plugin_txt",
				type: "json",
				schema: {
					type: "object",
					properties: {
						id: {
							type: "string",
						},
						content: {
							type: "string",
						},
					},
					required: ["id", "content"],
					additionalProperties: false,
				},
			},
			entity_id: "random",
			snapshot: {
				text: `LINE 1
LINE 2
LINE 4
LINE 3`,
			},
		},
	]);
});

test("it should detect an update if a line was removed", async () => {
	const lix = await openLixInMemory({});
	const before = encode(`LINE 1
LINE 2
LINE 3`);
	const after = encode(`LINE 1
LINE 2`);

	const detectedChanges = await detectChanges({
		lix,
		before: { id: "random", path: "x.md", data: before, metadata: {} },
		after: { id: "random", path: "x.md", data: after, metadata: {} },
	});

	expect(detectedChanges).toStrictEqual([
		{
			schema: {
				key: "lix_plugin_txt",
				type: "json",
				schema: {
					type: "object",
					properties: {
						id: {
							type: "string",
						},
						content: {
							type: "string",
						},
					},
					required: ["id", "content"],
					additionalProperties: false,
				},
			},
			entity_id: "random",
			snapshot: {
				text: `LINE 1
LINE 2`,
			},
		},
	]);
});
test("it should detect an update if a line was changed", async () => {
	const lix = await openLixInMemory({});
	const before = encode(`LINE 1
LINE 2
LINE 3`);
	const after = encode(`LINE 1
LINE 2
LINE 3 - updated`);

	const detectedChanges = await detectChanges({
		lix,
		before: { id: "random", path: "x.md", data: before, metadata: {} },
		after: { id: "random", path: "x.md", data: after, metadata: {} },
	});

	expect(detectedChanges).toStrictEqual([
		{
			schema: {
				key: "lix_plugin_txt",
				type: "json",
				schema: {
					type: "object",
					properties: {
						id: {
							type: "string",
						},
						content: {
							type: "string",
						},
					},
					required: ["id", "content"],
					additionalProperties: false,
				},
			},
			entity_id: "random",
			snapshot: {
				text: `LINE 1
LINE 2
LINE 3 - updated`,
			},
		},
	]);
});
