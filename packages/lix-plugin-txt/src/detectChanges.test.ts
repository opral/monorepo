import { expect, test } from "vitest";
import { detectChanges } from "./detectChanges.js";
import { TextSchemaV1 } from "./schemas/text.js";

const encode = (text: string) => new TextEncoder().encode(text);

test("it should not detect changes if the text file did not update", async () => {
	const before = encode(`LINE 1
LINE 2
LINE 3`);
	const after = before;

	const detectedChanges = detectChanges({
		before: { id: "random", path: "x.md", data: before, metadata: {} },
		after: { id: "random", path: "x.md", data: after, metadata: {} },
	});

	expect(detectedChanges).toEqual([]);
});

test("it should detect an update if a line was added", async () => {
	const before = encode(`LINE 1
LINE 2
LINE 3`);
	const after = encode(`LINE 1
LINE 2
LINE 4
LINE 3`);

	const detectedChanges = detectChanges({
		before: { id: "random", path: "x.md", data: before, metadata: {} },
		after: { id: "random", path: "x.md", data: after, metadata: {} },
	});

	expect(detectedChanges).toStrictEqual([
		{
			schema: TextSchemaV1,
			entity_id: "random",
			snapshot_content: {
				text: `LINE 1
LINE 2
LINE 4
LINE 3`,
			},
		},
	]);
});

test("it should detect an update if a line was removed", async () => {
	const before = encode(`LINE 1
LINE 2
LINE 3`);
	const after = encode(`LINE 1
LINE 2`);

	const detectedChanges = detectChanges({
		before: { id: "random", path: "x.md", data: before, metadata: {} },
		after: { id: "random", path: "x.md", data: after, metadata: {} },
	});

	expect(detectedChanges).toStrictEqual([
		{
			schema: TextSchemaV1,
			entity_id: "random",
			snapshot_content: {
				text: `LINE 1
LINE 2`,
			},
		},
	]);
});

test("it should detect an update if a line was changed", async () => {
	const before = encode(`LINE 1
LINE 2
LINE 3`);
	const after = encode(`LINE 1
LINE 2
LINE 3 - updated`);

	const detectedChanges = detectChanges({
		before: { id: "random", path: "x.md", data: before, metadata: {} },
		after: { id: "random", path: "x.md", data: after, metadata: {} },
	});

	expect(detectedChanges).toStrictEqual([
		{
			schema: TextSchemaV1,
			entity_id: "random",
			snapshot_content: {
				text: `LINE 1
LINE 2
LINE 3 - updated`,
			},
		},
	]);
});
